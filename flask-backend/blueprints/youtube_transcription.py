import json
from flask import Blueprint, request, jsonify
import os
import requests
import yt_dlp

youtube_transcription_bp = Blueprint('youtube_transcription', __name__)

# Path to temporarily store audio files
TEMP_AUDIO_PATH = "temp_audio"
if not os.path.exists(TEMP_AUDIO_PATH):
    os.makedirs(TEMP_AUDIO_PATH)

# Load the API key from config/config.json
def load_api_key():
    try:
        with open('config/config.json', 'r') as file:
            config = json.load(file)
            return config['OPENAI_API_KEY']
    except FileNotFoundError:
        print("config.json not found.")
        return None

# Function to download audio from YouTube
def download_audio_from_youtube(url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{TEMP_AUDIO_PATH}/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'noplaylist': True  # This ensures that only one video is downloaded, not an entire playlist
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        audio_file_path = ydl.prepare_filename(info_dict)
        audio_file_path = os.path.splitext(audio_file_path)[0] + ".mp3"  # Ensure it's saved as MP3
        return audio_file_path

# Route to transcribe and summarize YouTube video audio
@youtube_transcription_bp.route('/transcribe_summarize_youtube', methods=['POST'])
def transcribe_summarize_youtube():
    audio_file_path = None
    try:
        data = request.json
        youtube_url = data.get('url', '')

        api_key = load_api_key()

        if api_key and youtube_url:
            # Step 1: Download audio from YouTube
            audio_file_path = download_audio_from_youtube(youtube_url)
            print(f"Audio downloaded at: {audio_file_path}")

            # Step 2: Transcribe the audio using Whisper API
            url_whisper = "https://api.openai.com/v1/audio/transcriptions"
            headers = {
                "Authorization": f"Bearer {api_key}"
            }

            with open(audio_file_path, 'rb') as audio_file:
                files = {
                    "file": (audio_file.name, audio_file, "audio/mpeg"),
                    "model": (None, "whisper-1")
                }

                response = requests.post(url_whisper, headers=headers, files=files)
                if response.status_code != 200:
                    return jsonify({"error": "Transcription failed", "details": response.text}), 400

                transcription = response.json()['text']
                print(f"Transcription: {transcription}")

            # Step 3: Summarize the transcription using ChatGPT
            url_chatgpt = "https://api.openai.com/v1/chat/completions"
            headers_chatgpt = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": f"Summarize the following video contents:\n\n{transcription}"}
                ],
                "max_tokens": 150
            }

            response_chatgpt = requests.post(url_chatgpt, headers=headers_chatgpt, json=payload)

            if response_chatgpt.status_code != 200:
                return jsonify({"error": "Summarization failed", "details": response_chatgpt.text}), 400

            summary = response_chatgpt.json()['choices'][0]['message']['content'].strip()
            print(f"Summary: {summary}")

            # Step 4: Clean up the downloaded audio file
            if audio_file_path and os.path.exists(audio_file_path):
                os.remove(audio_file_path)

            # return jsonify({"transcription": transcription, "summary": summary})
            result = response_chatgpt.json()
            return jsonify(result['choices'][0]['message']['content'].strip())
        else:
            return jsonify({"error": "Invalid request. No URL or API key provided."}), 400

    except Exception as e:
        print(f"Error occurred: {e}")
        # Clean up audio file even in case of error
        if audio_file_path and os.path.exists(audio_file_path):
            os.remove(audio_file_path)
        return jsonify({"error": "An error occurred during the process.", "details": str(e)}), 400
