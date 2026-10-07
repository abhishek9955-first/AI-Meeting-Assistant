import requests


OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "qwen3:1.7b"


def refine_transcript(raw_transcript):

    system_prompt = """
You are a transcript refinement assistant.

Your job is to correct errors in the raw meeting transcript,
especially technical terms, acronyms, names, numbers, and
domain-specific terminology.

Rules:
1. Preserve the original meaning.
2. Do not summarize.
3. Do not add information.
4. Do not remove important information.
5. Preserve names, numbers, negations, and commitments.
6. If you are uncertain about a correction, keep the original wording.

Return ONLY the refined transcript.
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
                    "content": raw_transcript
                }
            ],
            "stream": False
        }
    )

    response.raise_for_status()

    result = response.json()

    return result["message"]["content"].strip()