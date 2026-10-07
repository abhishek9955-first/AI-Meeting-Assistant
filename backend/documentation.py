import requests
import json
from schemas import MeetingRecord


OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen3:1.7b"


def generate_documentation(refined_transcript):

    system_prompt = """
You are a meeting documentation assistant.

Create a structured meeting record from the transcript.

STRICT RULES:
1. Use ONLY information present in the transcript.
2. Do not invent information.
3. Do not turn a proposal or suggestion into a decision.
4. Create an action item ONLY when a task was actually assigned.
5. If owner is not stated, use "Unspecified".
6. If deadline is not stated, use "Unspecified".
7. Keep the summary concise.
8. Include important meeting points in minutes.
9. Include only confirmed decisions.

Return ONLY valid JSON in exactly this format:

{
  "summary": "short summary",
  "minutes": ["important point"],
  "decisions": ["confirmed decision"],
  "action_items": [
    {
      "task": "task description",
      "owner": "person or Unspecified",
      "deadline": "deadline or Unspecified"
    }
  ]
}
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": refined_transcript
                }
            ],
            "format": "json",
            "stream": False
        }
    )

    response.raise_for_status()

    result = response.json()

    output = result["message"]["content"]

    return MeetingRecord.model_validate_json(output)