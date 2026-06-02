import os
import requests
import base64
import json
import time
from pathlib import Path
from datetime import datetime

# Import PIL for image handling (installation: pip install pillow)
try:
    from PIL import Image
    import io
except ImportError:
    print("\n[!] Missing dependency: Pillow. Please install it using:")
    print("pip install pillow\n")
    exit(1)

# Configuration
# Default model for image generation/editing in Gemini 2.0/3.0
DEFAULT_MODEL = "gemini-2.0-flash" 
API_VERSION = "v1beta"

def get_api_key():
    """Retrieves the Gemini API key from the environment variable."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\n[!] Error: GEMINI_API_KEY environment variable not found.")
        print("Please set it using: set GEMINI_API_KEY=your_api_key_here (Windows)")
        print("or: export GEMINI_API_KEY=your_api_key_here (Linux/macOS)\n")
        exit(1)
    return api_key

def ensure_output_dir(directory="output"):
    """Creates the output directory if it doesn't exist."""
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    return path

def generate_unique_filename(prefix="image", extension="png"):
    """Generates a unique filename based on the current timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.{extension}"

def call_gemini_api(payload):
    """Sends a REST request to the Gemini API."""
    api_key = get_api_key()
    url = f"https://generativelanguage.googleapis.com/{API_VERSION}/models/{DEFAULT_MODEL}:generateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 429:
            print("\n[!] Error: Quota Exceeded (429).")
            print("Your API key has reached its limit or does not have image generation enabled.")
            print("Please wait a few minutes or check your Google AI Studio plan.")
            return None
        
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"\n[!] API Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Details: {e.response.text}")
        return None

def process_response(data, output_dir, prefix):
    """Processes the Gemini API response to extract and save image data."""
    if not data or "candidates" not in data:
        print("[!] No valid response data received.")
        return False

    found_image = False
    for candidate in data["candidates"]:
        if "content" in candidate and "parts" in candidate["content"]:
            for part in candidate["content"]["parts"]:
                # Check for inlineData (base64 encoded image)
                if "inlineData" in part:
                    b64_data = part["inlineData"]["data"]
                    filename = generate_unique_filename(prefix=prefix, extension="png")
                    save_path = output_dir / filename
                    
                    with open(save_path, "wb") as f:
                        f.write(base64.b64decode(b64_data))
                    
                    print(f"[+] Success! Image saved to: {save_path}")
                    found_image = True
                
                # If no image data, print the text response (which might explain why)
                elif "text" in part:
                    print("\n[i] AI Response:")
                    print("-" * 20)
                    print(part["text"])
                    print("-" * 20)
    
    if not found_image:
        print("[!] No image data found in the response. The model might not support direct generation for this prompt or account.")
    
    return found_image

def text_to_image(output_dir):
    """Handles the text-to-image generation flow."""
    prompt = input("\nEnter your image prompt: ").strip()
    if not prompt:
        print("[!] Prompt cannot be empty.")
        return

    print(f"[*] Requesting image generation for: '{prompt}'...")
    
    payload = {
        "contents": [{
            "parts": [{
                "text": f"Generate a high-quality photorealistic image based on this description: {prompt}. Respond ONLY with the image data."
            }]
        }],
        "generationConfig": {"temperature": 0.4}
    }
    
    data = call_gemini_api(payload)
    process_response(data, output_dir, "generated")

def edit_image(output_dir):
    """Handles the image editing flow."""
    img_path_str = input("\nEnter the path to the image you want to edit: ").strip()
    img_path = Path(img_path_str)

    if not img_path.exists() or not img_path.is_file():
        print(f"[!] Error: File not found at '{img_path_str}'")
        return

    instruction = input("What changes would you like to make? ").strip()
    if not instruction:
        print("[!] Edit instruction cannot be empty.")
        return

    try:
        # Read image and convert to base64
        with open(img_path, "rb") as image_file:
            encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
        
        mime_type = "image/png" if img_path.suffix.lower() == ".png" else "image/jpeg"
        
        print(f"[*] Requesting edit: '{instruction}'...")
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": f"Apply these changes to the image: {instruction}. Respond ONLY with the new image data."},
                    {"inlineData": {"mimeType": mime_type, "data": encoded_image}}
                ]
            }],
            "generationConfig": {"temperature": 0.4}
        }
        
        data = call_gemini_api(payload)
        process_response(data, output_dir, "edited")

    except Exception as e:
        print(f"[!] Error processing image for edit: {e}")

def main_menu():
    """Displays the main menu and handles user choices."""
    output_dir = ensure_output_dir()
    
    # Verify API key early
    get_api_key()

    while True:
        print("\n" + "="*40)
        print("      GEMINI IMAGE STUDIO (REST)")
        print("="*40)
        print("1. Generate image from text")
        print("2. Edit existing image")
        print("3. Exit")
        
        choice = input("\nSelect an option (1-3): ").strip()

        if choice == '1':
            text_to_image(output_dir)
        elif choice == '2':
            edit_image(output_dir)
        elif choice == '3':
            print("Goodbye!")
            break
        else:
            print("[!] Invalid choice. Please select 1, 2, or 3.")

if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user. Exiting...")
