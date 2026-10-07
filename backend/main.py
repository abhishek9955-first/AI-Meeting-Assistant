import os
from fastapi.staticfiles import StaticFiles
from schemas import UserRegister, UserLogin, UserResponse, TranscriptRefineRequest
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
        return {
            "refined_transcript": refined_transcript,
            "meeting_record": meeting_record
        }
    except Exception as e:
        return {
            "error": "Documentation generation failed.",
            "details": str(e)
        }


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

