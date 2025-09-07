"""
Mock Groq client for compatibility with Python 3.14
This is a temporary workaround until proper groq package support is available
"""

class MockGroqClient:
    """Mock Groq client that provides basic interface compatibility"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key
        print(f"⚠️  Using mock Groq client (API key: {'set' if api_key else 'not set'})")
    
    def chat_completions_create(self, **kwargs):
        """Mock chat completions method"""
        print("⚠️  Mock Groq client: chat_completions_create called")
        return MockChatCompletion()
    
    def completions_create(self, **kwargs):
        """Mock completions method"""
        print("⚠️  Mock Groq client: completions_create called")
        return MockCompletion()

class MockChatCompletion:
    """Mock chat completion response"""
    
    def __init__(self):
        self.choices = [MockChoice()]
        self.usage = MockUsage()

class MockChoice:
    """Mock choice in completion response"""
    
    def __init__(self):
        self.message = MockMessage()
        self.finish_reason = "stop"

class MockMessage:
    """Mock message in choice"""
    
    def __init__(self):
        self.content = "This is a mock response from the Groq client. Please configure a real API key and install the proper groq package."
        self.role = "assistant"

class MockCompletion:
    """Mock completion response"""
    
    def __init__(self):
        self.choices = [MockCompletionChoice()]
        self.usage = MockUsage()

class MockCompletionChoice:
    """Mock choice in completion response"""
    
    def __init__(self):
        self.text = "This is a mock response from the Groq client."
        self.finish_reason = "stop"

class MockUsage:
    """Mock usage statistics"""
    
    def __init__(self):
        self.prompt_tokens = 0
        self.completion_tokens = 0
        self.total_tokens = 0

# Create the mock client class that can be imported as groq.Client
Client = MockGroqClient
