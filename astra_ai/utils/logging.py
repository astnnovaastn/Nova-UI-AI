"""Logging configuration for Nova AI."""

import logging
import logging.handlers
import os
from pathlib import Path
from typing import Optional

from pythonjsonlogger import jsonlogger

def setup_logging(
    log_file: Optional[str] = None,
    log_level: str = "INFO",
    json_format: bool = False,
    max_bytes: int = 10_485_760,  # 10MB
    backup_count: int = 5
) -> None:
    """Set up logging configuration.
    
    Args:
        log_file: Path to log file. If None, will use default path.
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Whether to use JSON formatting for logs
        max_bytes: Maximum size of each log file
        backup_count: Number of backup files to keep
    """
    # Create logs directory if it doesn't exist
    if log_file is None:
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        log_file = str(log_dir / "nova_ai.log")
    
    # Set up root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove any existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    
    # Create file handler
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    file_handler.setLevel(log_level)
    
    # Create formatters
    if json_format:
        formatter = jsonlogger.JsonFormatter(
            '%(asctime)s %(name)s %(levelname)s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    # Add formatters to handlers
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Add handlers to root logger
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Create logger for this module
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized: level={log_level}, file={log_file}")

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name.
    
    Args:
        name: Logger name
        
    Returns:
        logging.Logger: Configured logger
    """
    return logging.getLogger(name) 