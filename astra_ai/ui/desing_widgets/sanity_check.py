import os
import requests
import json

def sanity_check():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found.")
        return

    models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash-image",
        "gemini-3-pro-preview",
        "gemini-3-flash-preview",
        "gemini-3.1-pro-preview",
        "gemini-3-pro-image-preview",
        "gemini-3.1-flash-image-preview"
    ]
    
    headers = {'Content-Type': 'application/json'}
    payload = {"contents": [{"parts": [{"text": "Hello"}]}]}

    print(f"{'Model':<35} | {'Status':<10} | {'Response struct'}")
    print("-" * 60)

    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            response = requests.post(url, headers=headers, json=payload)
            status = response.status_code
            resp_struct = "OK" if status == 200 else "Error"
            if status == 429:
                resp_struct = "Quota Exceeded (429)"
            elif status == 404:
                resp_struct = "Not Found (404)"
            
            print(f"{model:<35} | {status:<10} | {resp_struct}")
            
            if status == 200:
                # print(f"    Sample: {response.text[:50]}...")
                pass
        except Exception as e:
            print(f"{model:<35} | Error      | {e}")

if __name__ == "__main__":
    sanity_check()
