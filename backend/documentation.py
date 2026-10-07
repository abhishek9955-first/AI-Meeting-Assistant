import os
import json
import re
from dotenv import load_dotenv
from schemas import MeetingRecord
from google import genai

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("OPENAI_API_KEY")
client = genai.Client(api_key=api_key)


def generate_documentation(refined_transcript):

    prompt = f"""
You are a meeting documentation assistant.

Create a structured meeting record from the refined transcript.

Rules:
1. Use ONLY information present in the transcript.
2. Do not invent facts.
3. Do not turn a proposal into a decision.
4. Do not create an action item unless the task was actually assigned.
5. If the owner is not mentioned, use "".
6. If the deadline is not mentioned, use "".
7. Keep the summary concise and professional.
8. Extract important meeting minutes.
9. Extract only confirmed decisions.
10. Extract actionable tasks.

Return ONLY a valid JSON object strictly matching this schema with no extra text or explanations:

{{
    "summary": "short summary",
    "minutes": [
        "important point 1",
        "important point 2"
    ],
    "decisions": [
        "confirmed decision 1"
    ],
    "action_items": [
        {{
            "task": "task description",
            "owner": "person name or empty string if unspecified",
            "deadline": "deadline or empty string if unspecified"
        }}
    ]
}}

REFINED TRANSCRIPT:
{refined_transcript}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    result = response.text.strip()
    
    # Strip markdown code blocks if present
    if result.startswith("```"):
        result = re.sub(r"^```(?:json)?\s*", "", result)
        result = re.sub(r"\s*```$", "", result)
        result = result.strip()

    return MeetingRecord.model_validate_json(result)