import os
import requests
import base64
import json
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

# Configuration for Zhipu AI / Ollama Cloud
# Note: The key provided is a Zhipu AI (BigModel.cn) key.
# Format: {API_ID}.{API_SECRET}
DEFAULT_API_KEY = "bdf56477c82d4e13b7e013509562523d.fRD5-TjJRpjnpFR5KgpewUOA"
DEFAULT_MODEL = "gemma4:31b-cloud"
BASE_URL = "https://open.bigmodel.cn/api/paas/v4"

def get_api_key():
    """Retrieves the API key from environment variable or hardcoded default."""
    api_key = os.environ.get("OLLAMA_API_KEY")
    if not api_key:
        # Use the provided key as fallback
        api_key = DEFAULT_API_KEY
    return api_key

def ensure_output_dir(directory="output"):
    """Creates the output directory if it doesn't exist."""
    path = Path(directory)
    path.mkdir(parents=True, exist_ok=True)
    return path

def generate_unique_filename(prefix="ollama_gen", extension="png"):
    """Generates a unique filename based on the current timestamp."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{prefix}_{timestamp}.{extension}"

def generate_image_rest(prompt, output_dir):
    """Calls the image generation API via REST."""
    api_key = get_api_key()
    # Zhipu AI image generation endpoint
    url = f"{BASE_URL}/images/generations"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # We use the user-specified model
    payload = {
        "model": DEFAULT_MODEL,
        "prompt": prompt,
        "size": "1024x1024"
    }

    print(f"[*] Requesting image generation from {DEFAULT_MODEL}...")
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        # Handle the response
        if response.status_code == 200:
            data = response.json()
            if "data" in data and len(data["data"]) > 0:
                # Zhipu AI typically returns a URL or base64
                image_info = data["data"][0]
                
                if "url" in image_info:
                    img_url = image_info["url"]
                    print(f"[*] Downloading image from: {img_url}")
                    img_response = requests.get(img_url)
                    if img_response.status_code == 200:
                        filename = generate_unique_filename()
                        save_path = output_dir / filename
                        with open(save_path, "wb") as f:
                            f.write(img_response.content)
                        print(f"[+] Success! Image saved to: {save_path}")
                        return True
                elif "b64_json" in image_info:
                    b64_data = image_info["b64_json"]
                    filename = generate_unique_filename()
                    save_path = output_dir / filename
                    with open(save_path, "wb") as f:
                        f.write(base64.b64decode(b64_data))
                    print(f"[+] Success! Image saved to: {save_path}")
                    return True
            
            print("[!] API responded but no image data was found.")
            print(f"Response data: {json.dumps(data, indent=2)}")
        else:
            print(f"[!] API Error: {response.status_code}")
            print(f"Details: {response.text}")
            
    except Exception as e:
        print(f"[!] Connection Error: {e}")
    
    return False

def main():
    print("\n" + "="*40)
    print("      OLLAMA CLOUD IMAGE SYSTEM")
    print("="*40)
    print(f"Model: {DEFAULT_MODEL}")
    
    output_dir = ensure_output_dir()
    
    while True:
        prompt = input("\nEnter your image prompt (or 'exit' to quit): ").strip()
        
        if prompt.lower() in ['exit', 'quit']:
            print("Goodbye!")
            break
            
        if not prompt:
            print("[!] Prompt cannot be empty.")
            continue
            
        generate_image_rest(prompt, output_dir)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user. Exiting...")
