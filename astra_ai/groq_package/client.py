"""
Mock Groq client for compatibility with Python 3.14
"""

class Client:
    """Mock Groq client that provides basic interface compatibility"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key
        print(f"⚠️  Using mock Groq client (API key: {'set' if api_key else 'not set'})")
        print("⚠️  To use the real Groq API, please install the official groq package when it supports Python 3.14")
    
    @property
    def chat(self):
        """Return chat completions interface"""
        return MockChatCompletions()
    
    def completions_create(self, **kwargs):
        """Mock completions method"""
        print("⚠️  Mock Groq client: completions_create called")
        return MockCompletion()

class MockChatCompletions:
    """Mock chat completions interface"""
    
    @property
    def completions(self):
        return MockCompletionsInterface()

class MockCompletionsInterface:
    """Mock completions interface"""
    
    def create(self, **kwargs):
        """Mock create method"""
        print("⚠️  Mock Groq client: chat.completions.create called")
        print(f"   Model: {kwargs.get('model', 'unknown')}")
        print(f"   Messages: {len(kwargs.get('messages', []))} messages")
        return MockChatCompletion()

class MockChatCompletion:
    """Mock chat completion response"""
    
    def __init__(self):
        self.choices = [MockChoice()]
        self.usage = MockUsage()
        self.id = "mock-completion-id"
        self.object = "chat.completion"
        self.created = 1692000000
        self.model = "mock-model"

class MockChoice:
    """Mock choice in completion response"""
    
    def __init__(self):
        self.message = MockMessage()
        self.finish_reason = "stop"
        self.index = 0

class MockMessage:
    """Mock message in choice"""
    
    def __init__(self):
        self.content = "This is a mock response from the Groq client. The real Groq API is not available because the groq package doesn't support Python 3.14 yet. Please use Python 3.11 or 3.12 for full functionality."
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
        self.prompt_tokens = 10
        self.completion_tokens = 20
        self.total_tokens = 30
