import os
from bson import ObjectId
from fastapi.staticfiles import StaticFiles
from schemas import UserRegister, UserLogin, UserResponse, TranscriptRefineRequest, DocumentationRequest
import jwt 
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware 
from pipeline import process_meeting
from transcription import transcribe_audio
from refinement import refine_transcript
from documentation import generate_documentation
from utils import save_uploaded_file
from vision import scan_clue_board



SECRET_KEY = "6UkPR5eI6OY3jDzLijp+t6EnYRXnh0EBLCjVNkiZmhk="
ALGORITHM = "HS256"


from database import users_collection, meetings_collection, check_db_connection


def create_access_token(user_id: str, email: str):
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

app = FastAPI()

@app.on_event("startup")
async def startup_db_client():
    await check_db_connection()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/transcribe")
async def transcribe_only(file: UploadFile = File(...)):
    if not file.filename:
        return {"error": "No file was selected."}

    allowed_types = [
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
        "audio/mp4",
        "audio/aac",
        "audio/x-m4a",
        "audio/ogg",
        "audio/flac"
    ]

    if not file.content_type or not file.content_type.startswith("audio/"):
        return {
            "error": "Unsupported file type. Please upload an audio file."
        }

    audio_path = save_uploaded_file(file)

    try:
        raw_transcript = transcribe_audio(audio_path)
        return {
            "raw_transcript": raw_transcript
        }
    except Exception as e:
        return {
            "error": "The audio could not be transcribed.",
            "details": str(e)
        }


# LLM 1: Raw Transcript -> Refined Transcript
@app.post("/refine")
async def refine_transcript_endpoint(req: TranscriptRefineRequest):
    if not req.raw_transcript or not req.raw_transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raw transcript cannot be empty."
        )

    try:
        refined_transcript = refine_transcript(req.raw_transcript)
        return {
            "refined_transcript": refined_transcript
        }
    except Exception as e:
        return {
            "error": "Refinement failed.",
            "details": str(e)
        }


# LLM 2: Refined Transcript -> Meeting Minutes & Action Items
@app.post("/document")
async def document_meeting_endpoint(req: DocumentationRequest):
    if not req.refined_transcript or not req.refined_transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refined transcript cannot be empty."
        )

    try:
        meeting_record = generate_documentation(req.refined_transcript)
        
        # Persist meeting in MongoDB
        meeting_doc = {
            "title": (meeting_record.summary[:55] + "...") if len(meeting_record.summary) > 55 else meeting_record.summary,
            "summary": meeting_record.summary,
            "decisions": meeting_record.decisions,
            "action_items": [item.dict() for item in meeting_record.action_items],
            "minutes": meeting_record.minutes,
            "raw_transcript": req.raw_transcript or "",
            "refined_transcript": req.refined_transcript,
            "created_at": datetime.utcnow().isoformat(),
            "formatted_date": datetime.utcnow().strftime("%b %d, %Y • %I:%M %p")
        }
        insert_result = await meetings_collection.insert_one(meeting_doc)
        meeting_id = str(insert_result.inserted_id)

        return {
            "meeting_id": meeting_id,
            "meeting_record": meeting_record
        }
    except Exception as e:
        return {
            "error": "Documentation generation failed.",
            "details": str(e)
        }


# Combined Endpoint for backwards compatibility
@app.post("/generate-minutes")
async def generate_minutes_from_raw(req: TranscriptRefineRequest):
    if not req.raw_transcript or not req.raw_transcript.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Raw transcript cannot be empty."
        )

    try:
        refined_transcript = refine_transcript(req.raw_transcript)
        meeting_record = generate_documentation(refined_transcript)

        # Persist meeting in MongoDB
        meeting_doc = {
            "title": (meeting_record.summary[:55] + "...") if len(meeting_record.summary) > 55 else meeting_record.summary,
            "summary": meeting_record.summary,
            "decisions": meeting_record.decisions,
            "action_items": [item.dict() for item in meeting_record.action_items],
            "minutes": meeting_record.minutes,
            "refined_transcript": refined_transcript,
            "created_at": datetime.utcnow().isoformat(),
            "formatted_date": datetime.utcnow().strftime("%b %d, %Y • %I:%M %p")
        }
        await meetings_collection.insert_one(meeting_doc)

        return {
            "refined_transcript": refined_transcript,
            "meeting_record": meeting_record
        }
    except Exception as e:
        return {
            "error": "Documentation generation failed.",
            "details": str(e)
        }


@app.get("/dashboard/stats")
async def get_dashboard_stats():
    try:
        total_meetings = await meetings_collection.count_documents({})
        meetings_cursor = meetings_collection.find().sort("created_at", -1).limit(6)
        meetings_list = await meetings_cursor.to_list(length=6)
        
        all_meetings = await meetings_collection.find().to_list(length=1000)
        total_action_items = sum(len(m.get("action_items", [])) for m in all_meetings)
        total_decisions = sum(len(m.get("decisions", [])) for m in all_meetings)
        
        recent = []
        for m in meetings_list:
            recent.append({
                "id": str(m["_id"]),
                "title": m.get("title", "Meeting Overview"),
                "summary": m.get("summary", ""),
                "date": m.get("formatted_date", "Recently"),
                "action_items_count": len(m.get("action_items", [])),
                "decisions_count": len(m.get("decisions", []))
            })
            
        return {
            "total_meetings": total_meetings,
            "total_action_items": total_action_items,
            "total_decisions": total_decisions,
            "audio_hours": f"{round(total_meetings * 0.5, 1)} hrs",
            "recent_meetings": recent
        }
    except Exception as e:
        return {
            "total_meetings": 0,
            "total_action_items": 0,
            "total_decisions": 0,
            "audio_hours": "0 hrs",
            "recent_meetings": []
        }



@app.get("/meetings")
async def list_all_meetings():
    try:
        cursor = meetings_collection.find().sort("created_at", -1)
        meetings = await cursor.to_list(length=100)
        return [
            {
                "id": str(m["_id"]),
                "title": m.get("title", "Meeting Overview"),
                "summary": m.get("summary", ""),
                "decisions_count": len(m.get("decisions", [])),
                "action_items_count": len(m.get("action_items", [])),
                "formatted_date": m.get("formatted_date", "Recently"),
                "created_at": m.get("created_at", "")
            }
            for m in meetings
        ]
    except Exception as e:
        return []


@app.get("/meetings/{meeting_id}")
async def get_meeting_by_id(meeting_id: str):
    try:
        meeting = await meetings_collection.find_one({"_id": ObjectId(meeting_id)})
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found.")
        
        return {
            "id": str(meeting["_id"]),
            "title": meeting.get("title", ""),
            "summary": meeting.get("summary", ""),
            "decisions": meeting.get("decisions", []),
            "action_items": meeting.get("action_items", []),
            "minutes": meeting.get("minutes", []),
            "raw_transcript": meeting.get("raw_transcript", ""),
            "refined_transcript": meeting.get("refined_transcript", ""),
            "formatted_date": meeting.get("formatted_date", ""),
            "created_at": meeting.get("created_at", "")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid meeting ID or error: {str(e)}")


@app.post("/process")
async def process_audio(file: UploadFile = File(...)):



    if not file.filename:
        return {"error": "No file was selected."}

    allowed_types = [
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
        "audio/mp4",
        "audio/aac",
        "audio/x-m4a"
    ]

    if not file.content_type or not file.content_type.startswith("audio/"):
     return {
        "error": "Unsupported file type. Please upload an audio file."
    }

    audio_path = save_uploaded_file(file)

    try:
        result = process_meeting(audio_path)
        meeting_record = result.get("meeting_record")
        if meeting_record:
            meeting_doc = {
                "title": (meeting_record.summary[:55] + "...") if len(meeting_record.summary) > 55 else meeting_record.summary,
                "summary": meeting_record.summary,
                "decisions": meeting_record.decisions,
                "action_items": [item.dict() for item in meeting_record.action_items],
                "minutes": meeting_record.minutes,
                "raw_transcript": result.get("raw_transcript", ""),
                "refined_transcript": result.get("refined_transcript", ""),
                "created_at": datetime.utcnow().isoformat(),
                "formatted_date": datetime.utcnow().strftime("%b %d, %Y • %I:%M %p")
            }
            insert_res = await meetings_collection.insert_one(meeting_doc)
            result["meeting_id"] = str(insert_res.inserted_id)

        return result

    except Exception as e:
        return {
            "error": "The audio could not be processed.",
            "details": str(e)
        }
from datetime import datetime


@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    # Check if user with this email already exists
    existing_user = await users_collection.find_one({"email": user_data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    user_doc = {
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password": user_data.password,
        "meetings_transcribed": 0,
        "meetings_analyzed": 0,
        "created_at": datetime.utcnow().isoformat()
    }

    result = await users_collection.insert_one(user_doc)
    user_id = str(result.inserted_id)
    token = create_access_token(user_id=user_id, email=user_doc["email"])

    return {
        "message": "User registered successfully.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user_doc["name"],
            "email": user_doc["email"],
            "meetings_transcribed": user_doc["meetings_transcribed"],
            "meetings_analyzed": user_doc["meetings_analyzed"],
        }
    }


@app.post("/login")
async def login(credentials: UserLogin):
    user = await users_collection.find_one({"email": credentials.email.lower()})

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email does not exist."
        )

    if user["password"] != credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Please check your credentials."
        )

    user_id = str(user["_id"])
    token = create_access_token(user_id=user_id, email=user["email"])

    return {
        "message": "Login successful.",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "meetings_transcribed": user.get("meetings_transcribed", 0),
            "meetings_analyzed": user.get("meetings_analyzed", 0),
        }
    }





# vision.py

@app.post("/scan-clue")
async def scan_clue(file: UploadFile = File(...)):

    image_path = save_uploaded_file(file)

    result = scan_clue_board(image_path)
    return result

frontend_path = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "frontend"
)

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

