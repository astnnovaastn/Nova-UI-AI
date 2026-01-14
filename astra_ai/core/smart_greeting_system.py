#!/usr/bin/env python3
"""
Smart Greeting System for Nova AI
=================================

Provides intelligent greeting functionality with:
- Time-based greetings (Good morning/afternoon/evening)
- Session tracking to prevent repetitive greetings
- Memory integration for greeting patterns
- User name recognition and personalization

Author: Nova AI Enhancement Team
Version: 1.0 - Production Ready
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import json
import os

class SmartGreetingSystem:
    """
    Smart Greeting System for Nova AI
    
    Handles intelligent greetings based on time of day, user identity,
    and session tracking to prevent repetitive greetings.
    """
    
    def __init__(self, memory_integration=None):
        """Initialize the smart greeting system"""
        self.memory_integration = memory_integration
        self.logger = logging.getLogger(__name__)
        self.session_greetings = {}  # Track greetings per session
        self.ai_creation_time = datetime.now()  # Track when AI was initialized
        self.last_greeting_time = {}  # Track last greeting time per session
        self.greeting_cooldown = 3600  # 1 hour cooldown between greetings
        
        # Greeting templates
        self.greeting_templates = {
            "morning": [
                "Good morning, {name}! Ready to tackle the day?",
                "Morning, {name}! How can I help you today?",
                "Good morning, {name}! What's on your agenda?",
                "Hey {name}, good morning! What can I do for you?",
                "Morning, {name}! Hope you're having a great start to your day!"
            ],
            "afternoon": [
                "Good afternoon, {name}! How's your day going?",
                "Afternoon, {name}! What can I help you with?",
                "Good afternoon, {name}! How can I assist you?",
                "Hey {name}, good afternoon! What's up?",
                "Afternoon, {name}! Hope you're having a productive day!"
            ],
            "evening": [
                "Good evening, {name}! How was your day?",
                "Evening, {name}! What can I help you with tonight?",
                "Good evening, {name}! How can I assist you?",
                "Hey {name}, good evening! What brings you here?",
                "Evening, {name}! Hope you had a great day!"
            ],
            "night": [
                "Hey {name}! Working late tonight?",
                "Hi {name}! Burning the midnight oil?",
                "Hello {name}! What can I help you with tonight?",
                "Hey {name}! Up late working on something interesting?",
                "Hi {name}! How can I assist you this evening?"
            ],
            "generic": [
                "Hi {name}! How can I help you today?",
                "Hello {name}! What can I do for you?",
                "Hey {name}! What's up?",
                "Hi {name}! Good to see you again!",
                "Hello {name}! How can I assist you?"
            ]
        }
    
    def get_time_period(self) -> str:
        """Determine the current time period for greeting"""
        current_hour = datetime.now().hour
        
        if 5 <= current_hour < 12:
            return "morning"
        elif 12 <= current_hour < 17:
            return "afternoon"
        elif 17 <= current_hour < 21:
            return "evening"
        else:
            return "night"
    
    def get_user_name(self) -> str:
        """Get user name from memory system"""
        if not self.memory_integration or not self.memory_integration.is_enabled:
            return "there"
        
        try:
            # Get user identity from memory system
            memory_interface = self.memory_integration.memory_system
            
            # Access the underlying NovaMemoryAI system
            if hasattr(memory_interface, 'memory_system'):
                underlying_memory = memory_interface.memory_system
                
                # Try to get name from user identity category
                user_identity = underlying_memory.data["memory_categories"].get("user_identity", {})
                
                # Look for name-related entries
                for key, item in user_identity.items():
                    if isinstance(item, dict) and "value" in item:
                        value = item["value"]
                        # Check if this looks like a name
                        if isinstance(value, str) and len(value) > 0:
                            # Check for common name patterns
                            if any(name_key in key.lower() for name_key in ["name", "called", "identity"]):
                                # Extract first name from full name/description
                                name_parts = value.split()
                                if name_parts:
                                    first_word = name_parts[0].strip()
                                    # Check if it looks like a name (not a description)
                                    if len(first_word) > 1 and first_word.replace("'", "").isalpha():
                                        return first_word.capitalize()
                
                # Fallback: check current_facts for legacy support
                current_facts = underlying_memory.data.get("current_facts", {})
                for fact_key, fact_value in current_facts.items():
                    if "name" in fact_key.lower() and isinstance(fact_value, str):
                        name_parts = fact_value.split()
                        if name_parts:
                            first_word = name_parts[0].strip()
                            if len(first_word) > 1 and first_word.replace("'", "").isalpha():
                                return first_word.capitalize()
            else:
                # Fallback: try to get name from interface methods
                try:
                    profile = memory_interface.get_user_profile()
                    user_name = profile.get("name", "")
                    if user_name and user_name.lower() != "unknown":
                        name_parts = user_name.split()
                        if name_parts:
                            first_word = name_parts[0].strip()
                            if len(first_word) > 1 and first_word.replace("'", "").isalpha():
                                return first_word.capitalize()
                except:
                    pass
            
            return "there"
        except Exception as e:
            self.logger.debug(f"Error getting user name: {e}")
            return "there"
    
    def should_greet(self, session_id: str = "default") -> bool:
        """Determine if we should greet the user in this session"""
        try:
            current_time = datetime.now()

            # Check if we've already greeted in this session recently
            if session_id in self.last_greeting_time:
                last_greeting = self.last_greeting_time[session_id]
                # Don't greet again if we greeted less than 1 hour ago
                if current_time - last_greeting < timedelta(seconds=self.greeting_cooldown):
                    return False

            # Check if this is a new session (AI just started)
            if current_time - self.ai_creation_time < timedelta(minutes=2):
                return True  # Always greet on startup

            # Check memory for recent greetings to avoid over-greeting
            if self.memory_integration and self.memory_integration.is_enabled:
                try:
                    greeting_data = self._get_greeting_history()
                    last_greeting_time = greeting_data.get("last_greeting_time")

                    if last_greeting_time:
                        try:
                            last_time = datetime.fromisoformat(last_greeting_time)
                            # Don't greet if we greeted less than 30 minutes ago
                            if current_time - last_time < timedelta(minutes=30):
                                return False
                        except ValueError:
                            pass  # Invalid datetime format, continue
                except Exception:
                    pass  # Memory error, continue with greeting

            return True
        except Exception as e:
            self.logger.debug(f"Error checking greeting status: {e}")
            return True  # Default to greeting if unsure
    
    def generate_greeting(self, session_id: str = "default") -> Optional[str]:
        """Generate an appropriate greeting if needed"""
        if not self.should_greet(session_id):
            return None

        try:
            # Get user name and time period
            user_name = self.get_user_name()
            time_period = self.get_time_period()

            # Select greeting template
            templates = self.greeting_templates.get(time_period, self.greeting_templates["generic"])

            # Use a simple rotation to avoid repetition
            greeting_count = self._get_greeting_count()
            template_index = greeting_count % len(templates)
            greeting_template = templates[template_index]

            # Format greeting with user name
            greeting = greeting_template.format(name=user_name)

            # Record this greeting
            self._record_greeting(session_id, time_period, greeting, user_name)
            
            return greeting
            
        except Exception as e:
            self.logger.error(f"Error generating greeting: {e}")
            return None
    
    def _get_greeting_history(self) -> Dict[str, Any]:
        """Get greeting history from memory"""
        try:
            if not self.memory_integration or not self.memory_integration.is_enabled:
                return {}
            
            # Get greeting patterns from memory
            memory_interface = self.memory_integration.memory_system
            
            # Access the underlying NovaMemoryAI system
            if hasattr(memory_interface, 'memory_system'):
                underlying_memory = memory_interface.memory_system
                greeting_category = underlying_memory.data["memory_categories"].get("greeting_patterns", {})
                
                # Extract values from memory items
                greeting_data = {}
                
                # Get last greeting time
                last_greeting_item = greeting_category.get("last_greeting_time", {})
                if isinstance(last_greeting_item, dict) and "value" in last_greeting_item:
                    greeting_data["last_greeting_time"] = last_greeting_item["value"]
                
                # Get total greetings count
                total_greetings_item = greeting_category.get("total_greetings", {})
                if isinstance(total_greetings_item, dict) and "value" in total_greetings_item:
                    greeting_data["total_greetings"] = total_greetings_item["value"]
                
                # Get other greeting data
                for key in ["last_greeting_text", "last_time_period", "last_user_name", "ai_creation_time"]:
                    item = greeting_category.get(key, {})
                    if isinstance(item, dict) and "value" in item:
                        greeting_data[key] = item["value"]
                
                return greeting_data
            else:
                # Fallback: try to get data from interface methods
                try:
                    context = memory_interface.get_context_for_ai_response("comprehensive")
                    # Extract greeting-related information from context if available
                    return context.get("greeting_patterns", {})
                except:
                    return {}
            
        except Exception as e:
            self.logger.debug(f"Error getting greeting history: {e}")
            return {}
    
    def _get_greeting_count(self) -> int:
        """Get total greeting count for template rotation"""
        try:
            greeting_data = self._get_greeting_history()
            return greeting_data.get("total_greetings", 0)
        except Exception:
            return 0
    
    def _record_greeting(self, session_id: str, time_period: str, greeting: str, user_name: str):
        """Record greeting in memory and session tracking"""
        try:
            current_time = datetime.now()

            # Record in session tracking
            self.session_greetings[session_id] = current_time
            self.last_greeting_time[session_id] = current_time

            # Record in memory system (simplified to avoid errors)
            if self.memory_integration and self.memory_integration.is_enabled:
                try:
                    # Store greeting information using the available memory system methods
                    greeting_content = f"Greeted {user_name} with '{greeting}' during {time_period} at {current_time.strftime('%H:%M')}"

                    # Try different memory storage methods based on what's available
                    if hasattr(self.memory_integration, 'store_memory'):
                        self.memory_integration.store_memory(
                            content=greeting_content,
                            category="conversation_patterns"
                        )
                    elif hasattr(self.memory_integration.memory_system, 'store_memory'):
                        self.memory_integration.memory_system.store_memory(
                            content=greeting_content,
                            category="conversation_patterns"
                        )

                    self.logger.debug(f"Recorded greeting: {greeting}")

                except Exception as memory_error:
                    # Silently handle memory storage errors
                    self.logger.debug(f"Memory storage error (non-critical): {memory_error}")

        except Exception as e:
            self.logger.error(f"Error recording greeting: {e}")

    def mark_greeting_completed(self, session_id: str = "default"):
        """Mark greeting as completed for this session"""
        try:
            current_time = datetime.now()
            self.last_greeting_time[session_id] = current_time
            self.session_greetings[session_id] = current_time
            self.logger.debug(f"Marked greeting completed for session: {session_id}")
        except Exception as e:
            self.logger.error(f"Error marking greeting completed: {e}")

    def get_ai_age(self) -> str:
        """Get how long the AI has been running"""
        try:
            age = datetime.now() - self.ai_creation_time
            
            if age.days > 0:
                return f"{age.days} day{'s' if age.days != 1 else ''}"
            elif age.seconds > 3600:
                hours = age.seconds // 3600
                return f"{hours} hour{'s' if hours != 1 else ''}"
            elif age.seconds > 60:
                minutes = age.seconds // 60
                return f"{minutes} minute{'s' if minutes != 1 else ''}"
            else:
                return "just started"
        except Exception:
            return "unknown"
    
    def get_greeting_stats(self) -> Dict[str, Any]:
        """Get greeting statistics for debugging/status"""
        try:
            greeting_data = self._get_greeting_history()
            
            return {
                "total_greetings": greeting_data.get("total_greetings", 0),
                "last_greeting": greeting_data.get("last_greeting_time", "Never"),
                "ai_age": self.get_ai_age(),
                "current_session_greetings": len(self.session_greetings),
                "ai_creation_time": self.ai_creation_time.isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error getting greeting stats: {e}")
            return {"error": str(e)}

# Global instance for easy access
_greeting_system = None

def get_greeting_system(memory_integration=None) -> SmartGreetingSystem:
    """Get or create the greeting system instance"""
    global _greeting_system
    
    if _greeting_system is None:
        _greeting_system = SmartGreetingSystem(memory_integration)
    
    return _greeting_system

def reset_greeting_system():
    """Reset the greeting system instance"""
    global _greeting_system
    _greeting_system = None
