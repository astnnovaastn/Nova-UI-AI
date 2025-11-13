#!/usr/bin/env python3
"""
User Profile Manager for Nova AI
================================

Manages a dedicated JSON file containing comprehensive user profile information.
This system maintains a centralized repository of user data including personal
information, preferences, goals, and conversation history.

Features:
- Real-time profile updates during conversations
- Comprehensive user data structure
- Automatic profile loading on AI startup
- Data validation and integrity checks
- Profile backup and recovery
"""

import json
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
from enum import Enum
import uuid
import shutil

logger = logging.getLogger(__name__)


class ProfileCategory(Enum):
    """Categories for organizing user profile data"""
    PERSONAL_INFO = "personal_info"
    PREFERENCES = "preferences"
    GOALS_ASPIRATIONS = "goals_aspirations"
    DISLIKES_AVOIDANCES = "dislikes_avoidances"
    INSTRUCTIONS_RULES = "instructions_rules"
    SECURITY_SETTINGS = "security_settings"
    CONVERSATION_HISTORY = "conversation_history"
    LEARNING_PROGRESS = "learning_progress"
    RELATIONSHIPS = "relationships"
    INTERESTS_HOBBIES = "interests_hobbies"
    WORK_CAREER = "work_career"
    HEALTH_WELLNESS = "health_wellness"
    FINANCIAL = "financial"
    TRAVEL_LOCATIONS = "travel_locations"
    TECHNOLOGY = "technology"
    CUSTOM = "custom"


@dataclass
class UserProfileData:
    """Comprehensive user profile data structure"""
    # Personal Information
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    occupation: Optional[str] = None
    
    # Preferences
    communication_style: Optional[str] = None
    response_length: Optional[str] = None  # short, medium, detailed
    formality_level: Optional[str] = None  # casual, professional, formal
    humor_preference: Optional[str] = None
    topics_of_interest: List[str] = field(default_factory=list)
    preferred_sources: List[str] = field(default_factory=list)
    
    # Goals and Aspirations
    short_term_goals: List[str] = field(default_factory=list)
    long_term_goals: List[str] = field(default_factory=list)
    current_projects: List[str] = field(default_factory=list)
    learning_objectives: List[str] = field(default_factory=list)
    
    # Dislikes and Avoidances
    topics_to_avoid: List[str] = field(default_factory=list)
    communication_triggers: List[str] = field(default_factory=list)
    sensitive_subjects: List[str] = field(default_factory=list)
    
    # Instructions and Rules
    permanent_instructions: List[str] = field(default_factory=list)
    auto_execute_commands: List[str] = field(default_factory=list)
    response_rules: List[str] = field(default_factory=list)
    privacy_preferences: List[str] = field(default_factory=list)
    
    # Security Settings
    data_retention_policy: Optional[str] = None
    sharing_preferences: Dict[str, bool] = field(default_factory=dict)
    access_controls: Dict[str, str] = field(default_factory=dict)
    
    # Conversation History
    total_conversations: int = 0
    first_interaction: Optional[str] = None
    last_interaction: Optional[str] = None
    favorite_topics: List[str] = field(default_factory=list)
    conversation_patterns: Dict[str, Any] = field(default_factory=dict)
    
    # Learning Progress
    skills_learning: List[str] = field(default_factory=list)
    completed_goals: List[str] = field(default_factory=list)
    knowledge_areas: Dict[str, float] = field(default_factory=dict)  # topic: confidence_level
    
    # Relationships
    family_members: List[str] = field(default_factory=list)
    friends: List[str] = field(default_factory=list)
    colleagues: List[str] = field(default_factory=list)
    important_people: List[str] = field(default_factory=list)
    
    # Interests and Hobbies
    hobbies: List[str] = field(default_factory=list)
    sports: List[str] = field(default_factory=list)
    entertainment: List[str] = field(default_factory=list)
    creative_activities: List[str] = field(default_factory=list)
    
    # Work and Career
    current_role: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    career_goals: List[str] = field(default_factory=list)
    skills: List[str] = field(default_factory=list)
    
    # Health and Wellness
    health_goals: List[str] = field(default_factory=list)
    fitness_activities: List[str] = field(default_factory=list)
    dietary_preferences: List[str] = field(default_factory=list)
    medical_notes: List[str] = field(default_factory=list)
    
    # Financial
    financial_goals: List[str] = field(default_factory=list)
    investment_interests: List[str] = field(default_factory=list)
    budget_preferences: Dict[str, Any] = field(default_factory=dict)
    
    # Travel and Locations
    visited_places: List[str] = field(default_factory=list)
    dream_destinations: List[str] = field(default_factory=list)
    travel_preferences: Dict[str, Any] = field(default_factory=dict)
    
    # Technology
    tech_interests: List[str] = field(default_factory=list)
    devices_used: List[str] = field(default_factory=list)
    software_preferences: List[str] = field(default_factory=list)
    programming_languages: List[str] = field(default_factory=list)
    
    # Custom fields
    custom_data: Dict[str, Any] = field(default_factory=dict)
    
    # Metadata
    profile_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    last_updated: str = field(default_factory=lambda: datetime.now().isoformat())
    version: str = "1.0"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert profile data to dictionary"""
        return {
            field.name: getattr(self, field.name)
            for field in self.__dataclass_fields__.values()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'UserProfileData':
        """Create profile data from dictionary"""
        return cls(**data)


class UserProfileManager:
    """Manages user profile data in a dedicated JSON file"""
    
    def __init__(self, profile_file: str = "user_profile.json", backup_dir: str = "profile_backups", enable_logging: bool = True):
        """
        Initialize the user profile manager
        
        Args:
            profile_file: Path to the user profile JSON file
            backup_dir: Directory for profile backups
        """
        self.profile_file = profile_file
        self.backup_dir = backup_dir
        self.enable_logging = enable_logging
        self.profile_data: Optional[UserProfileData] = None
        self.is_initialized = False
        
        # Create backup directory if it doesn't exist
        os.makedirs(backup_dir, exist_ok=True)
        
        # Load existing profile or create new one
        self._load_or_create_profile()
    
    def _load_or_create_profile(self) -> bool:
        """Load existing profile or create a new one"""
        try:
            if os.path.exists(self.profile_file):
                with open(self.profile_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Check if file is empty or invalid
                if not data or not isinstance(data, dict):
                    self.profile_data = UserProfileData()
                    self._save_profile()
                    if self.enable_logging:
                        logger.info(f"Created new user profile at {self.profile_file} (empty file)")
                else:
                    self.profile_data = UserProfileData.from_dict(data)
                    if self.enable_logging:
                        logger.info(f"Loaded user profile from {self.profile_file}")
            else:
                self.profile_data = UserProfileData()
                self._save_profile()
                if self.enable_logging:
                    logger.info(f"Created new user profile at {self.profile_file}")
            
            self.is_initialized = True
            return True
            
        except Exception as e:
            if self.enable_logging:
                logger.error(f"Failed to load/create profile: {e}")
            # Create a minimal profile as fallback
            self.profile_data = UserProfileData()
            self.is_initialized = True
            return False
    
    def _save_profile(self) -> bool:
        """Save profile data to JSON file"""
        try:
            if not self.profile_data:
                return False
            
            # Update last_updated timestamp
            self.profile_data.last_updated = datetime.now().isoformat()
            
            # Create backup before saving
            self._create_backup()
            
            # Save to file
            with open(self.profile_file, 'w', encoding='utf-8') as f:
                json.dump(self.profile_data.to_dict(), f, indent=2, ensure_ascii=False)
            
            logger.debug(f"Profile saved to {self.profile_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save profile: {e}")
            return False
    
    def _create_backup(self) -> bool:
        """Create a backup of the current profile"""
        try:
            if not os.path.exists(self.profile_file):
                return False
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = os.path.join(self.backup_dir, f"user_profile_backup_{timestamp}.json")
            
            shutil.copy2(self.profile_file, backup_file)
            logger.debug(f"Profile backup created: {backup_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return False
    
    def get_profile(self) -> Optional[UserProfileData]:
        """Get the current user profile data"""
        return self.profile_data
    
    def update_profile(self, updates: Dict[str, Any], category: Optional[ProfileCategory] = None) -> bool:
        """
        Update user profile with new information
        
        Args:
            updates: Dictionary of updates to apply
            category: Optional category for the updates
            
        Returns:
            bool: True if update was successful
        """
        try:
            if not self.profile_data:
                return False
            
            # Apply updates
            for key, value in updates.items():
                if hasattr(self.profile_data, key):
                    setattr(self.profile_data, key, value)
                else:
                    # Store in custom_data if field doesn't exist
                    self.profile_data.custom_data[key] = value
            
            # Update interaction timestamps
            if not self.profile_data.first_interaction:
                self.profile_data.first_interaction = datetime.now().isoformat()
            self.profile_data.last_interaction = datetime.now().isoformat()
            
            # Save the updated profile
            success = self._save_profile()
            
            if success:
                logger.info(f"Profile updated successfully. Category: {category}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to update profile: {e}")
            return False
    
    def add_conversation_data(self, user_message: str, ai_response: str, 
                            topics: List[str] = None, sentiment: str = None) -> bool:
        """
        Add conversation data to the profile
        
        Args:
            user_message: User's message
            ai_response: AI's response
            topics: List of topics discussed
            sentiment: Sentiment of the conversation
            
        Returns:
            bool: True if data was added successfully
        """
        try:
            if not self.profile_data:
                return False
            
            # Update conversation count
            self.profile_data.total_conversations += 1
            
            # Set first interaction if not set
            if not self.profile_data.first_interaction:
                self.profile_data.first_interaction = datetime.now().isoformat()
            
            # Always update last interaction
            self.profile_data.last_interaction = datetime.now().isoformat()
            
            # Add topics to favorite topics if they appear frequently
            if topics:
                for topic in topics:
                    if topic not in self.profile_data.favorite_topics:
                        self.profile_data.favorite_topics.append(topic)
            
            # Update conversation patterns
            if not self.profile_data.conversation_patterns:
                self.profile_data.conversation_patterns = {
                    "average_message_length": 0,
                    "common_words": [],
                    "sentiment_distribution": {},
                    "time_patterns": {}
                }
            
            # Update patterns (simplified)
            current_time = datetime.now()
            hour = current_time.hour
            if hour not in self.profile_data.conversation_patterns["time_patterns"]:
                self.profile_data.conversation_patterns["time_patterns"][str(hour)] = 0
            self.profile_data.conversation_patterns["time_patterns"][str(hour)] += 1
            
            # Save the updated profile
            return self._save_profile()
            
        except Exception as e:
            logger.error(f"Failed to add conversation data: {e}")
            return False
    
    def get_profile_summary(self) -> Dict[str, Any]:
        """Get a summary of the user profile"""
        if not self.profile_data:
            return {"error": "No profile data available"}
        
        return {
            "profile_id": self.profile_data.profile_id,
            "name": self.profile_data.name,
            "age": self.profile_data.age,
            "location": self.profile_data.location,
            "total_conversations": self.profile_data.total_conversations,
            "first_interaction": self.profile_data.first_interaction,
            "last_interaction": self.profile_data.last_interaction,
            "interests": self.profile_data.topics_of_interest[:5],  # Top 5
            "goals": self.profile_data.short_term_goals[:3],  # Top 3
            "preferences": {
                "communication_style": self.profile_data.communication_style,
                "response_length": self.profile_data.response_length,
                "formality_level": self.profile_data.formality_level
            },
            "last_updated": self.profile_data.last_updated
        }
    
    def search_profile(self, query: str) -> Dict[str, Any]:
        """
        Search the profile for specific information
        
        Args:
            query: Search query
            
        Returns:
            Dict containing matching profile information
        """
        if not self.profile_data:
            return {"error": "No profile data available"}
        
        query_lower = query.lower()
        results = {}
        
        # Search through various profile fields
        profile_dict = self.profile_data.to_dict()
        
        for field, value in profile_dict.items():
            if isinstance(value, str) and query_lower in value.lower():
                results[field] = value
            elif isinstance(value, list):
                matching_items = [item for item in value if isinstance(item, str) and query_lower in item.lower()]
                if matching_items:
                    results[field] = matching_items
        
        return {
            "query": query,
            "results": results,
            "total_matches": len(results)
        }
    
    def export_profile(self, export_file: str = None) -> str:
        """
        Export profile data to a file
        
        Args:
            export_file: Optional custom export file path
            
        Returns:
            str: Path to the exported file
        """
        try:
            if not export_file:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                export_file = f"user_profile_export_{timestamp}.json"
            
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(self.profile_data.to_dict(), f, indent=2, ensure_ascii=False)
            
            logger.info(f"Profile exported to {export_file}")
            return export_file
            
        except Exception as e:
            logger.error(f"Failed to export profile: {e}")
            return ""
    
    def import_profile(self, import_file: str) -> bool:
        """
        Import profile data from a file
        
        Args:
            import_file: Path to the import file
            
        Returns:
            bool: True if import was successful
        """
        try:
            with open(import_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.profile_data = UserProfileData.from_dict(data)
            success = self._save_profile()
            
            if success:
                logger.info(f"Profile imported from {import_file}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to import profile: {e}")
            return False
    
    def reset_profile(self) -> bool:
        """Reset the profile to default values"""
        try:
            self.profile_data = UserProfileData()
            success = self._save_profile()
            
            if success:
                logger.info("Profile reset to default values")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to reset profile: {e}")
            return False
    
    def get_profile_stats(self) -> Dict[str, Any]:
        """Get statistics about the profile"""
        if not self.profile_data:
            return {"error": "No profile data available"}
        
        return {
            "total_fields_filled": sum(1 for field in self.profile_data.__dataclass_fields__.values() 
                                     if getattr(self.profile_data, field.name) is not None),
            "total_conversations": self.profile_data.total_conversations,
            "profile_age_days": (datetime.now() - datetime.fromisoformat(self.profile_data.created_at)).days,
            "last_updated_days_ago": (datetime.now() - datetime.fromisoformat(self.profile_data.last_updated)).days,
            "interests_count": len(self.profile_data.topics_of_interest),
            "goals_count": len(self.profile_data.short_term_goals) + len(self.profile_data.long_term_goals),
            "custom_data_fields": len(self.profile_data.custom_data)
        }


def create_user_profile_manager(profile_file: str = "user_profile.json") -> UserProfileManager:
    """Create a new user profile manager instance"""
    return UserProfileManager(profile_file)
