import os
from openai import OpenAI
from dotenv import load_dotenv
from schemas import MeetingRecord


load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_documentation(refined_transcript):

    prompt = f"""
You are a meeting documentation assistant.

Create a structured meeting record from the refined transcript.

Rules:
1. Use ONLY information present in the transcript.
2. Do not invent facts.
3. Do not turn a proposal into a decision.
4. Do not create an action item unless the task was actually assigned.
5. If the owner is not mentioned, use "Unspecified".
6. If the deadline is not mentioned, use "Unspecified".
7. Keep the summary concise.
8. Extract important meeting minutes.
9. Extract only confirmed decisions.
10. Extract actionable tasks.

Return the result in this JSON format:

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
            "owner": "person or Unspecified",
            "deadline": "deadline or Unspecified"
        }}
    ]
}}

REFINED TRANSCRIPT:
{refined_transcript}
"""

    response = client.responses.create(
        model="gpt-6-luna",
        input=prompt
    )

    result = response.output_text

    return MeetingRecord.model_validate_json(result)