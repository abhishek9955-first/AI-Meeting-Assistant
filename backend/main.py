from fastapi.staticfiles import StaticFiles
import os


from fastapi import FastAPI, UploadFile, File
from pipeline import process_meeting
from utils import save_uploaded_file

app = FastAPI()


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



frontend_path = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "frontend"
)

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")