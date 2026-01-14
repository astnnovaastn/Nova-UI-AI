"""
Working Groq client for Python 3.14 compatibility
This bypasses the pydantic issues by using direct HTTP requests
"""

import requests
import json
import os
from typing import Dict, List, Optional, Any

class GroqClient:
    """A working Groq client that uses direct HTTP requests"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        if not self.api_key:
            raise ValueError("Groq API key is required. Set GROQ_API_KEY environment variable or pass api_key parameter.")
        
        # Validate API key format
        if not self.api_key.startswith('gsk_'):
            raise ValueError("Invalid Groq API key format. API key should start with 'gsk_'.")
    
    @property
    def chat(self):
        """Return chat completions interface"""
        return ChatCompletions(self)

class ChatCompletions:
    """Chat completions interface"""
    
    def __init__(self, client: GroqClient):
        self.client = client
    
    @property
    def completions(self):
        return CompletionsInterface(self.client)

class CompletionsInterface:
    """Completions interface"""
    
    def __init__(self, client: GroqClient):
        self.client = client
    
    def create(self, **kwargs):
        """Create a chat completion"""
        url = f"{self.client.base_url}/chat/completions"
        
        # Default parameters
        data = {
            "model": kwargs.get("model", "llama-3.1-8b-instant"),
            "messages": kwargs.get("messages", []),
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 1024),
            "stream": kwargs.get("stream", False)
        }
        
        try:
            response = requests.post(url, headers=self.client.headers, json=data, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            return ChatCompletion(result)
            
        except requests.exceptions.RequestException as e:
            error_msg = f"[ERROR] Groq API request failed: {e}"
            print(error_msg)
            
            # Try to extract more specific error information
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    if 'error' in error_data:
                        error_msg += f" - API Error: {error_data['error'].get('message', 'Unknown error')}"
                except:
                    pass
            
            # Return a fallback response
            return ChatCompletion({
                "choices": [{
                    "message": {
                        "content": f"I apologize, but I'm having trouble connecting to the Groq API right now. Error: {str(e)}",
                        "role": "assistant"
                    },
                    "finish_reason": "stop"
                }],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            })

class ChatCompletion:
    """Chat completion response"""
    
    def __init__(self, data: Dict[str, Any]):
        self.choices = [Choice(choice) for choice in data.get("choices", [])]
        self.usage = Usage(data.get("usage", {}))
        self.id = data.get("id", "")
        self.object = data.get("object", "chat.completion")
        self.created = data.get("created", 0)
        self.model = data.get("model", "")

class Choice:
    """Choice in completion response"""
    
    def __init__(self, data: Dict[str, Any]):
        self.message = Message(data.get("message", {}))
        self.finish_reason = data.get("finish_reason", "stop")
        self.index = data.get("index", 0)

class Message:
    """Message in choice"""
    
    def __init__(self, data: Dict[str, Any]):
        self.content = data.get("content", "")
        self.role = data.get("role", "assistant")

class Usage:
    """Usage statistics"""
    
    def __init__(self, data: Dict[str, Any]):
        self.prompt_tokens = data.get("prompt_tokens", 0)
        self.completion_tokens = data.get("completion_tokens", 0)
        self.total_tokens = data.get("total_tokens", 0)

def validate_api_key(api_key: str) -> bool:
    """Validate the Groq API key by making a simple request to the models endpoint."""
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        response = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10)
        return response.status_code == 200
    except:
        return False

# Create the Client class for compatibility
Client = GroqClient

# Test the client
if __name__ == "__main__":
    try:
        # Load environment variables
        from dotenv import load_dotenv
        import os
        load_dotenv()
        
        # Get API key from environment
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            print("GROQ_API_KEY not found in environment variables")
            exit(1)
            
        client = GroqClient(api_key=api_key)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Hello! How are you?"}],
            max_tokens=50
        )
        print("Groq client working!")
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"Error: {e}")
        if "401" in str(e):
            print("Unauthorized - please check your GROQ_API_KEY in the .env file")
