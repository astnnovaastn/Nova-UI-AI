"""Test script to verify Ollama integration works properly."""

import requests
import json

def test_ollama_connection():
    """Test basic connection to Ollama."""
    try:
        # Test the Ollama endpoint with a simple request
        payload = {
            'model': 'qwen2.5:3b',
            'messages': [
                {'role': 'user', 'content': 'Hello, are you working? Just say "Yes" if you are.'}
            ],
            'stream': False,
            'options': {
                'temperature': 0.3,
                'num_predict': 50
            }
        }
        
        response = requests.post('http://localhost:11434/api/chat', json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("Ollama connection successful!")
            print(f"Response: {result['message']['content']}")
            return True
        else:
            print(f"Ollama connection failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to Ollama. Please ensure Ollama is running on http://localhost:11434")
        return False
    except Exception as e:
        print(f"Error testing Ollama connection: {e}")
        return False

if __name__ == "__main__":
    print("Testing Ollama connection...")
    success = test_ollama_connection()
    if success:
        print("Ollama is working correctly and ready to be used by the AI Organizer.")
    else:
        print("Ollama is not accessible. Please ensure the Ollama service is running.")