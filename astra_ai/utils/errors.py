"""Custom exceptions and error handling for Nova AI."""

class NovaAIError(Exception):
    """Base exception class for Nova AI."""
    pass

class ConfigurationError(NovaAIError):
    """Raised when there is a configuration error."""
    pass

class APIError(NovaAIError):
    """Raised when there is an error with an external API."""
    pass

class MemoryError(NovaAIError):
    """Raised when there is an error with the memory system."""
    pass

class SearchError(NovaAIError):
    """Raised when there is an error with the search functionality."""
    pass

class ValidationError(NovaAIError):
    """Raised when there is a validation error."""
    pass

class ConnectionError(NovaAIError):
    """Raised when there is a connection error."""
    pass

class AuthenticationError(NovaAIError):
    """Raised when there is an authentication error."""
    pass

class RateLimitError(NovaAIError):
    """Raised when a rate limit is exceeded."""
    pass

class TimeoutError(NovaAIError):
    """Raised when an operation times out."""
    pass

def handle_api_error(error: Exception) -> NovaAIError:
    """Convert API-specific errors to NovaAI errors.
    
    Args:
        error: The original error
        
    Returns:
        NovaAIError: Converted error
    """
    error_str = str(error).lower()
    
    if "rate limit" in error_str or "too many requests" in error_str:
        return RateLimitError("API rate limit exceeded")
    elif "timeout" in error_str:
        return TimeoutError("API request timed out")
    elif "unauthorized" in error_str or "authentication" in error_str:
        return AuthenticationError("API authentication failed")
    elif "connection" in error_str:
        return ConnectionError("Failed to connect to API")
    else:
        return APIError(f"API error: {str(error)}")

def handle_memory_error(error: Exception) -> NovaAIError:
    """Convert memory-related errors to NovaAI errors.
    
    Args:
        error: The original error
        
    Returns:
        NovaAIError: Converted error
    """
    error_str = str(error).lower()
    
    if "database" in error_str:
        return MemoryError(f"Database error: {str(error)}")
    elif "vector" in error_str:
        return MemoryError(f"Vector memory error: {str(error)}")
    else:
        return MemoryError(f"Memory error: {str(error)}")

def handle_search_error(error: Exception) -> NovaAIError:
    """Convert search-related errors to NovaAI errors.
    
    Args:
        error: The original error
        
    Returns:
        NovaAIError: Converted error
    """
    error_str = str(error).lower()
    
    if "no results" in error_str:
        return SearchError("No search results found")
    elif "invalid query" in error_str:
        return ValidationError("Invalid search query")
    else:
        return SearchError(f"Search error: {str(error)}")

def handle_config_error(error: Exception) -> NovaAIError:
    """Convert configuration-related errors to NovaAI errors.
    
    Args:
        error: The original error
        
    Returns:
        NovaAIError: Converted error
    """
    error_str = str(error).lower()
    
    if "not found" in error_str:
        return ConfigurationError("Configuration file not found")
    elif "invalid" in error_str:
        return ValidationError("Invalid configuration")
    else:
        return ConfigurationError(f"Configuration error: {str(error)}")

def handle_error(error: Exception) -> NovaAIError:
    """Convert any error to a NovaAI error.
    
    Args:
        error: The original error
        
    Returns:
        NovaAIError: Converted error
    """
    if isinstance(error, NovaAIError):
        return error
        
    error_str = str(error).lower()
    
    if "api" in error_str:
        return handle_api_error(error)
    elif "memory" in error_str or "database" in error_str:
        return handle_memory_error(error)
    elif "search" in error_str:
        return handle_search_error(error)
    elif "config" in error_str:
        return handle_config_error(error)
    else:
        return NovaAIError(f"Error: {str(error)}") 