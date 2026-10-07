import os
from openai import OpenAI
from dotenv import load_dotenv


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

dotenv_path = os.path.join(BASE_DIR, ".env")

load_dotenv(dotenv_path)

api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key)

def refine_transcript(raw_transcript):

    prompt = f"""
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

Return only the refined transcript.

RAW TRANSCRIPT:
{raw_transcript}
"""

    response = client.responses.create(
        model="gpt-6-luna",
        input=prompt
    )

    return response.output_text.strip()