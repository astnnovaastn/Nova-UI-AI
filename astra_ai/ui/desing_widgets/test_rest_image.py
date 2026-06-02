
import os
from groq import Groq

# Get API key from environment variable
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY environment variable not set. Please set it before running this script.")

client = Groq(api_key=api_key)
filename = os.path.dirname(__file__) + "/audio.m4a"

with open(filename, "rb") as file:
    transcription = client.audio.transcriptions.create(
      file=(filename, file.read()),
      model="whisper-large-v3-turbo",
      temperature=0,
      response_format="verbose_json",
    )
    print(transcription.text)
      