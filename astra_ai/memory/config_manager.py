"""
Configuration Manager for Nova AI.

This module handles loading and accessing configuration settings from JSON files.
"""

import os
import json
import logging
from typing import Any, Dict, Optional

class ConfigManager:
    """
    Configuration Manager for Nova AI.
    
    This class handles loading and accessing configuration settings from JSON files.
    It also provides methods for updating and saving configuration settings.
    """
    
    def __init__(self, config_dir: Optional[str] = None):
        """
        Initialize the ConfigManager.
        
        Args:
            config_dir (str, optional): Path to the configuration directory.
                If None, defaults to 'config' in the project root.
        """
        # Set up logging
        self.logger = logging.getLogger(__name__)
        
        # Determine the project root directory
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Set the configuration directory
        if config_dir is None:
            self.config_dir = os.path.join(self.project_root, "config")
        else:
            self.config_dir = config_dir
            
        # Ensure the configuration directory exists
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Initialize the configuration dictionary
        self.config = {}
        
        # Load the main configuration file
        self.load_config()
        
    def load_config(self, config_file: str = "config.json") -> Dict[str, Any]:
        """
        Load the configuration from a JSON file.
        
        Args:
            config_file (str, optional): Name of the configuration file.
                Defaults to "config.json".
                
        Returns:
            Dict[str, Any]: The loaded configuration.
        """
        config_path = os.path.join(self.config_dir, config_file)
        
        try:
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    self.config = json.load(f)
                self.logger.info(f"Loaded configuration from {config_path}")
            else:
                self.logger.warning(f"Configuration file {config_path} not found. Using default configuration.")
                self.config = {}
        except Exception as e:
            self.logger.error(f"Error loading configuration from {config_path}: {e}")
            self.config = {}
            
        return self.config
    
    def save_config(self, config_file: str = "config.json") -> bool:
        """
        Save the configuration to a JSON file.
        
        Args:
            config_file (str, optional): Name of the configuration file.
                Defaults to "config.json".
                
        Returns:
            bool: True if the configuration was saved successfully, False otherwise.
        """
        config_path = os.path.join(self.config_dir, config_file)
        
        try:
            with open(config_path, "w") as f:
                json.dump(self.config, f, indent=2)
            self.logger.info(f"Saved configuration to {config_path}")
            return True
        except Exception as e:
            self.logger.error(f"Error saving configuration to {config_path}: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value.
        
        Args:
            key (str): The configuration key. Can be a dot-separated path.
            default (Any, optional): The default value to return if the key is not found.
                Defaults to None.
                
        Returns:
            Any: The configuration value, or the default value if the key is not found.
        """
        # Split the key into parts
        parts = key.split(".")
        
        # Start with the entire configuration
        value = self.config
        
        # Traverse the configuration dictionary
        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return default
                
        return value
    
    def set(self, key: str, value: Any) -> None:
        """
        Set a configuration value.
        
        Args:
            key (str): The configuration key. Can be a dot-separated path.
            value (Any): The value to set.
        """
        # Split the key into parts
        parts = key.split(".")
        
        # Start with the entire configuration
        config = self.config
        
        # Traverse the configuration dictionary
        for i, part in enumerate(parts[:-1]):
            if part not in config:
                config[part] = {}
            elif not isinstance(config[part], dict):
                config[part] = {}
            config = config[part]
                
        # Set the value
        config[parts[-1]] = value
    
    def load_process_info(self) -> Dict[str, Any]:
        """
        Load the process information from the process_info.json file.
        
        Returns:
            Dict[str, Any]: The process information.
        """
        return self.load_json_file("process_info.json")
    
    def save_process_info(self, process_info: Dict[str, Any]) -> bool:
        """
        Save the process information to the process_info.json file.
        
        Args:
            process_info (Dict[str, Any]): The process information to save.
            
        Returns:
            bool: True if the process information was saved successfully, False otherwise.
        """
        return self.save_json_file("process_info.json", process_info)
    
    def load_json_file(self, file_name: str) -> Dict[str, Any]:
        """
        Load a JSON file from the project root.
        
        Args:
            file_name (str): Name of the JSON file.
            
        Returns:
            Dict[str, Any]: The loaded JSON data.
        """
        file_path = os.path.join(self.project_root, file_name)
        
        try:
            if os.path.exists(file_path):
                with open(file_path, "r") as f:
                    data = json.load(f)
                self.logger.info(f"Loaded JSON data from {file_path}")
                return data
            else:
                self.logger.warning(f"JSON file {file_path} not found.")
                return {}
        except Exception as e:
            self.logger.error(f"Error loading JSON data from {file_path}: {e}")
            return {}
    
    def save_json_file(self, file_name: str, data: Dict[str, Any]) -> bool:
        """
        Save JSON data to a file in the project root.
        
        Args:
            file_name (str): Name of the JSON file.
            data (Dict[str, Any]): The JSON data to save.
            
        Returns:
            bool: True if the JSON data was saved successfully, False otherwise.
        """
        file_path = os.path.join(self.project_root, file_name)
        
        try:
            with open(file_path, "w") as f:
                json.dump(data, f, indent=2)
            self.logger.info(f"Saved JSON data to {file_path}")
            return True
        except Exception as e:
            self.logger.error(f"Error saving JSON data to {file_path}: {e}")
            return False