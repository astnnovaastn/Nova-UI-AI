# -*- coding: utf-8 -*-
"""
OpenRouter client for Python - Using OpenRouter API
Wrapper around OpenRouter's API with Groq-compatible interface
"""

# Force UTF-8 encoding for the entire process
import sys
import io
import os
import json
import requests
import time
from typing import Dict, List, Optional, Any

# Set default encoding BEFORE any other imports
if sys.version_info[0] >= 3:
    import locale
    locale.setlocale(locale.LC_ALL, '')
    # Force stdout/stderr to use UTF-8
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Set the default encoding for string encoding operations
_original_print = print

def _safe_print(*args, **kwargs):
    """Print function that handles Unicode safely"""
    try:
        _original_print(*args, **kwargs)
    except UnicodeEncodeError:
        # Fallback: encode each argument separately
        safe_args = []
        for arg in args:
            if isinstance(arg, str):
                safe_args.append(arg.encode('utf-8', errors='replace').decode('utf-8', errors='replace'))
            else:
                safe_args.append(arg)
        _original_print(*safe_args, **kwargs)


def _normalize_text_for_api(value: Any) -> str:
    """Normalize text before sending to external APIs.

    Replaces Unicode dash variants (especially U+2011 non-breaking hyphen)
    that can trigger ASCII-encoding errors in some request paths.
    """
    if value is None:
        return ""
    text = str(value)
    dash_map = {
        "\u2010": "-",  # hyphen
        "\u2011": "-",  # non-breaking hyphen
        "\u2012": "-",  # figure dash
        "\u2013": "-",  # en dash
        "\u2014": "-",  # em dash
        "\u2212": "-",  # minus sign
    }
    for bad, good in dash_map.items():
        text = text.replace(bad, good)
    return text


def _is_transient_api_error(exc: Exception) -> bool:
    """True when the error is likely temporary and worth retrying."""
    text = str(exc).upper()
    transient_markers = (
        "503", "UNAVAILABLE", "RESOURCE_EXHAUSTED", "429",
        "RATE_LIMIT", "TIMEOUT", "DEADLINE_EXCEEDED", "TRY AGAIN LATER",
    )
    return any(marker in text for marker in transient_markers)


class OpenRouterClient:
    """An OpenRouter client that mimics Groq client interface for easy migration"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "google/gemini-2.0-flash-001"):
        raw_api_key = api_key or os.getenv('OPENROUTER_API_KEY') or os.getenv('GEMINI_API_KEY')
        self.api_key = _normalize_text_for_api(raw_api_key).strip()
        self.model = _normalize_text_for_api(model).strip() or "google/gemini-2.0-flash-001"
        self.timeout = 30
        self.base_url = "https://openrouter.ai/api/v1"
        
        if not self.api_key:
            raise ValueError("OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass api_key parameter.")
        
        # Validate API key format
        if len(self.api_key) < 10:
            raise ValueError("Invalid OpenRouter API key format. API key appears to be too short.")
        
        # Initialize the client
        self._client = None
    
    @property
    def chat(self):
        """Return chat completions interface"""
        return ChatCompletions(self)


class ChatCompletions:
    """Chat completions interface"""
    
    def __init__(self, client: OpenRouterClient):
        self.client = client
        self.completions = CompletionsInterface(client)


class CompletionsInterface:
    """Completions interface"""
    
    def __init__(self, client: OpenRouterClient):
        self.client = client
    
    def create(self, **kwargs):
        """Create a chat completion using the OpenRouter API"""
        
        # Extract parameters
        messages = kwargs.get("messages", [])
        model = kwargs.get("model", self.client.model)
        temperature = kwargs.get("temperature", 0.7)
        max_tokens = kwargs.get("max_tokens", 1024)
        stream = kwargs.get("stream", False)
        
        # Fallback models to try if the primary model fails
        fallback_models = [
            "google/gemini-2.0-flash-001",
            "google/gemini-2.0-flash",
            "anthropic/claude-3-haiku",
            "meta/llama-3.1-70b-instruct",
        ]
        
        last_exception = None
        
        for model_to_try in [model] + [m for m in fallback_models if m != model]:
            try:
                # Normalize model ID to avoid hidden Unicode characters
                safe_model = _normalize_text_for_api(model_to_try).strip()
                if not safe_model:
                    safe_model = "google/gemini-2.0-flash-001"
                
                # Convert messages to OpenRouter format
                openrouter_messages = []
                for msg in messages:
                    openrouter_messages.append({
                        "role": _normalize_text_for_api(msg.get("role", "user")),
                        "content": _normalize_text_for_api(msg.get("content", ""))
                    })
                
                # Prepare the request payload
                payload = {
                    "model": safe_model,
                    "messages": openrouter_messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
                
                # Set up headers
                headers = {
                    "Authorization": f"Bearer {self.client.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://nova-ai.local",
                    "X-Title": "NOVA AI"
                }
                
                # Make the API request
                response = requests.post(
                    f"{self.client.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=self.client.timeout
                )
                
                # Check for errors
                response.raise_for_status()
                
                # Parse the response
                result = response.json()
                
                # Extract the response text
                response_text = ""
                if "choices" in result and len(result["choices"]) > 0:
                    choice = result["choices"][0]
                    if "message" in choice:
                        response_text = choice["message"].get("content", "")
                
                # Safely handle Unicode in response text
                try:
                    response_text = response_text.encode('utf-8', errors='replace').decode('utf-8')
                except Exception:
                    response_text = str(response_text) if response_text else "No response generated"
                
                # Get usage information
                usage = result.get("usage", {})
                prompt_tokens = usage.get("prompt_tokens", 0)
                completion_tokens = usage.get("completion_tokens", 0)
                total_tokens = usage.get("total_tokens", 0)
                
                # If usage is not provided, estimate it
                if total_tokens == 0:
                    prompt_tokens = self._estimate_tokens(messages)
                    completion_tokens = self._estimate_tokens([{"role": "assistant", "content": response_text}])
                    total_tokens = prompt_tokens + completion_tokens
                
                # Convert response to Groq-compatible format
                return ChatCompletion({
                    "choices": [{
                        "message": {
                            "content": response_text,
                            "role": "assistant"
                        },
                        "finish_reason": "stop"
                    }],
                    "usage": {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": total_tokens
                    }
                })
                
            except requests.exceptions.RequestException as e:
                last_exception = e
                # If it's a transient error, try the next model
                if _is_transient_api_error(e):
                    time.sleep(1.0)
                    continue
                # For non-transient errors, try fallback models
                continue
            except Exception as e:
                last_exception = e
                continue
        
        # All models failed - return error response
        error_str = str(last_exception) if last_exception else "Unknown error"
        try:
            error_msg = f"[ERROR] OpenRouter API request failed: {error_str}"
            _safe_print(error_msg)
        except UnicodeEncodeError:
            error_msg = f"[ERROR] OpenRouter API request failed: {error_str.encode('ascii', errors='replace').decode('ascii')}"
            _safe_print(error_msg)
        
        # Return a fallback response with Unicode-safe handling
        fallback_content = f"I apologize, but I'm having trouble connecting to the AI API right now. Error: {error_str[:100]}"
        try:
            fallback_content = fallback_content.encode('utf-8', errors='replace').decode('utf-8')
        except Exception:
            fallback_content = fallback_content.encode('ascii', errors='replace').decode('ascii')
        
        return ChatCompletion({
            "choices": [{
                "message": {
                    "content": fallback_content,
                    "role": "assistant"
                },
                "finish_reason": "stop"
            }],
            "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        })
    
    def _estimate_tokens(self, messages: List[Dict[str, str]]) -> int:
        """Estimate token count (rough approximation)"""
        # Simple approximation: ~1 token per 4 characters
        total_chars = sum(len(msg.get("content", "")) for msg in messages)
        return max(1, total_chars // 4)


class ChatCompletion:
    """Chat completion response"""
    
    def __init__(self, data: Dict[str, Any]):
        self.choices = [Choice(choice) for choice in data.get("choices", [])]
        self.usage = Usage(data.get("usage", {}))


class Choice:
    """Chat completion choice"""
    
    def __init__(self, data: Dict[str, Any]):
        self.message = Message(data.get("message", {}))
        self.finish_reason = data.get("finish_reason", "stop")


class Message:
    """Message object"""
    
    def __init__(self, data: Dict[str, str]):
        self.role = data.get("role", "assistant")
        self.content = data.get("content", "")


class Usage:
    """Token usage information"""
    
    def __init__(self, data: Dict[str, int]):
        self.prompt_tokens = data.get("prompt_tokens", 0)
        self.completion_tokens = data.get("completion_tokens", 0)
        self.total_tokens = data.get("total_tokens", 0)