from transcription import transcribe_audio
from refinement import refine_transcript
from documentation import generate_documentation


def process_meeting(audio_path):

    # Step 1: Audio → Raw Transcript
    raw_transcript = transcribe_audio(audio_path)

    # Step 2: Raw Transcript → Refined Transcript
    refined_transcript = refine_transcript(raw_transcript)

    # Step 3: Refined Transcript → Meeting Record
    meeting_record = generate_documentation(refined_transcript)

    return {
        "raw_transcript": raw_transcript,
        "refined_transcript": refined_transcript,
        "meeting_record": meeting_record
    }