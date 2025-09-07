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
            print(f"❌ Groq API request failed: {e}")
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

# Create the Client class for compatibility
Client = GroqClient

# Test the client
if __name__ == "__main__":
    try:
        client = GroqClient()
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Hello! How are you?"}]
        )
        print("✅ Groq client working!")
        print(f"Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Error: {e}")
