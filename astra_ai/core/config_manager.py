import json
import os
import logging
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

class ConfigManager:
    """Manages configuration settings for the AI system."""
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize the configuration manager.
        
        Args:
            config_path: Optional path to the config file. If None, will look in default locations.
        """
        self.config: Dict[str, Any] = {}
        self.config_path = config_path or self._find_config_file()
        self.load_config()
    
    def _find_config_file(self) -> str:
        """Find the configuration file in standard locations."""
        possible_locations = [
            "config/config.json",
            "astra_ai/config/config.json",
            "../config/config.json",
            os.path.expanduser("~/.config/astra_ai/config.json")
        ]
        
        # Get the directory containing this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        for location in possible_locations:
            # Try relative to current directory
            full_path = os.path.join(current_dir, location)
            if os.path.exists(full_path):
                return full_path
            
            # Try relative to project root
            project_root = os.path.dirname(os.path.dirname(current_dir))
            full_path = os.path.join(project_root, location)
            if os.path.exists(full_path):
                return full_path
        
        # If no config file found, use default location
        default_path = os.path.join(current_dir, "../config/config.json")
        os.makedirs(os.path.dirname(default_path), exist_ok=True)
        return default_path
    
    def load_config(self) -> None:
        """Load the configuration from file."""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    self.config = json.load(f)
                logger.info(f"Configuration loaded from {self.config_path}")
            else:
                logger.warning(f"Configuration file {self.config_path} not found. Using default configuration.")
                self._create_default_config()
        except Exception as e:
            logger.error(f"Error loading configuration: {e}")
            self._create_default_config()
    
    def _create_default_config(self) -> None:
        """Create a default configuration."""
        self.config = {
            "api_keys": {
                "groq": os.getenv("GROQ_API_KEY", ""),
                "serpapi": os.getenv("SERPAPI_KEY", "")
            },
            "memory": {
                "vector_memory": {
                    "enabled": True,
                    "max_short_term_size": 30,
                    "max_mid_term_size": 100,
                    "max_long_term_size": 1000,
                    "similarity_threshold": 0.7
                },
                "mem0_ai": {
                    "enabled": True,
                    "batch_size": 10,
                    "batch_timeout": 30,
                    "cache_timeout": 300
                }
            },
            "response": {
                "timing": {
                    "min_response_time": 0.1,
                    "max_response_time": 0.3,
                    "typing_speed_variation": 0.005
                },
                "style": {
                    "repetition_threshold": 0.7,
                    "max_generation_attempts": 3
                }
            },
            "logging": {
                "level": "INFO",
                "file": "alebot.log",
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            },
            "paths": {
                "data_dir": "data",
                "self_improving_ai_dir": "data/self_improving_ai",
                "memory_dir": "data/memory"
            }
        }
        self.save_config()
    
    def save_config(self) -> None:
        """Save the current configuration to file."""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=4)
            logger.info(f"Configuration saved to {self.config_path}")
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """Get a configuration value by dot-separated path.
        
        Args:
            key_path: Dot-separated path to the config value (e.g., "memory.vector_memory.enabled")
            default: Default value to return if path not found
            
        Returns:
            The configuration value or default if not found
        """
        try:
            value = self.config
            for key in key_path.split('.'):
                value = value[key]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key_path: str, value: Any, save: bool = True) -> None:
        """Set a configuration value by dot-separated path.
        
        Args:
            key_path: Dot-separated path to the config value
            value: Value to set
            save: Whether to save the config file after setting
        """
        keys = key_path.split('.')
        current = self.config
        
        # Navigate to the correct nested level
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        # Set the value
        current[keys[-1]] = value
        
        if save:
            self.save_config()
    
    def update(self, updates: Dict[str, Any], save: bool = True) -> None:
        """Update multiple configuration values at once.
        
        Args:
            updates: Dictionary of dot-separated paths and their values
            save: Whether to save the config file after updating
        """
        for key_path, value in updates.items():
            self.set(key_path, value, save=False)
        
        if save:
            self.save_config() 