#!/usr/bin/env python3
"""
Conversation Analytics System for Nova AI
=========================================

Tracks and analyzes conversation patterns including:
- Conversation duration tracking
- Session gap analysis
- User engagement statistics
- Memory integration for analytics data

Author: Nova AI Enhancement Team
Version: 1.0 - Production Ready
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import json
import time

class ConversationAnalytics:
    """
    Conversation Analytics System for Nova AI
    
    Tracks conversation duration, session gaps, and provides
    detailed analytics about user interaction patterns.
    """
    
    def __init__(self, memory_integration=None):
        """Initialize the conversation analytics system"""
        self.memory_integration = memory_integration
        self.logger = logging.getLogger(__name__)
        
        # Current session tracking
        self.current_session = {
            "session_id": None,
            "start_time": None,
            "last_activity": None,
            "message_count": 0,
            "user_messages": 0,
            "ai_responses": 0
        }
        
        # Session management
        self.session_timeout = timedelta(minutes=30)  # 30 minutes of inactivity = new session
    
    def start_session(self, session_id: str = None) -> str:
        """Start a new conversation session"""
        if not session_id:
            session_id = f"session_{int(time.time())}"
        
        # End previous session if active
        if self.current_session["session_id"]:
            self.end_session()
        
        # Start new session
        now = datetime.now()
        self.current_session = {
            "session_id": session_id,
            "start_time": now,
            "last_activity": now,
            "message_count": 0,
            "user_messages": 0,
            "ai_responses": 0
        }
        
        self.logger.debug(f"Started new session: {session_id}")
        return session_id
    
    def track_message(self, is_user_message: bool = True):
        """Track a message in the current session"""
        now = datetime.now()
        
        # Check if we need to start a new session
        if not self.current_session["session_id"] or self._should_start_new_session():
            self.start_session()
        
        # Update session statistics
        self.current_session["last_activity"] = now
        self.current_session["message_count"] += 1
        
        if is_user_message:
            self.current_session["user_messages"] += 1
        else:
            self.current_session["ai_responses"] += 1
    
    def end_session(self) -> Dict[str, Any]:
        """End the current session and store analytics"""
        if not self.current_session["session_id"]:
            return {}
        
        # Calculate session statistics
        session_data = self._calculate_session_stats()
        
        # Store in memory system
        self._store_session_analytics(session_data)
        
        # Reset current session
        session_id = self.current_session["session_id"]
        self.current_session = {
            "session_id": None,
            "start_time": None,
            "last_activity": None,
            "message_count": 0,
            "user_messages": 0,
            "ai_responses": 0
        }
        
        self.logger.debug(f"Ended session: {session_id}")
        return session_data
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get current session statistics"""
        if not self.current_session["session_id"]:
            return {"active_session": False}
        
        return {
            "active_session": True,
            "session_id": self.current_session["session_id"],
            "duration_minutes": self._get_session_duration_minutes(),
            "message_count": self.current_session["message_count"],
            "user_messages": self.current_session["user_messages"],
            "ai_responses": self.current_session["ai_responses"],
            "last_activity": self.current_session["last_activity"].isoformat()
        }
    
    def get_analytics_summary(self) -> Dict[str, Any]:
        """Get comprehensive analytics summary"""
        try:
            analytics_data = self._get_analytics_from_memory()
            
            # Calculate summary statistics
            total_sessions = len(analytics_data.get("sessions", []))
            total_duration = sum(session.get("duration_minutes", 0) for session in analytics_data.get("sessions", []))
            total_messages = sum(session.get("message_count", 0) for session in analytics_data.get("sessions", []))
            
            # Calculate averages
            avg_session_duration = total_duration / total_sessions if total_sessions > 0 else 0
            avg_messages_per_session = total_messages / total_sessions if total_sessions > 0 else 0
            
            # Get session gaps
            session_gaps = self._calculate_session_gaps(analytics_data.get("sessions", []))
            
            return {
                "total_sessions": total_sessions,
                "total_duration_minutes": total_duration,
                "total_messages": total_messages,
                "average_session_duration": round(avg_session_duration, 2),
                "average_messages_per_session": round(avg_messages_per_session, 2),
                "average_session_gap_hours": round(session_gaps.get("average_gap_hours", 0), 2),
                "longest_session_minutes": max((s.get("duration_minutes", 0) for s in analytics_data.get("sessions", [])), default=0),
                "current_session": self.get_session_stats()
            }
        except Exception as e:
            self.logger.error(f"Error getting analytics summary: {e}")
            return {"error": str(e)}
    
    def _should_start_new_session(self) -> bool:
        """Check if we should start a new session based on inactivity"""
        if not self.current_session["last_activity"]:
            return True
        
        time_since_last = datetime.now() - self.current_session["last_activity"]
        return time_since_last > self.session_timeout
    
    def _get_session_duration_minutes(self) -> float:
        """Get current session duration in minutes"""
        if not self.current_session["start_time"]:
            return 0
        
        duration = datetime.now() - self.current_session["start_time"]
        return duration.total_seconds() / 60
    
    def _calculate_session_stats(self) -> Dict[str, Any]:
        """Calculate comprehensive session statistics"""
        duration_minutes = self._get_session_duration_minutes()
        
        return {
            "session_id": self.current_session["session_id"],
            "start_time": self.current_session["start_time"].isoformat(),
            "end_time": datetime.now().isoformat(),
            "duration_minutes": round(duration_minutes, 2),
            "message_count": self.current_session["message_count"],
            "user_messages": self.current_session["user_messages"],
            "ai_responses": self.current_session["ai_responses"],
            "messages_per_minute": round(self.current_session["message_count"] / max(duration_minutes, 1), 2)
        }
    
    def _store_session_analytics(self, session_data: Dict[str, Any]):
        """Store session analytics in memory system"""
        try:
            if not self.memory_integration or not self.memory_integration.is_enabled:
                return
            
            memory_system = self.memory_integration.memory_system
            
            # Get current analytics data
            analytics_data = memory_system.memory_system.data["memory_categories"].get("conversation_analytics", {})
            
            # Initialize if needed
            if "sessions" not in analytics_data:
                analytics_data["sessions"] = []
            if "summary_stats" not in analytics_data:
                analytics_data["summary_stats"] = {}
            
            # Add new session
            analytics_data["sessions"].append(session_data)
            
            # Update summary statistics
            analytics_data["summary_stats"] = {
                "last_session": session_data["session_id"],
                "last_session_end": session_data["end_time"],
                "total_sessions": len(analytics_data["sessions"]),
                "total_duration_minutes": sum(s.get("duration_minutes", 0) for s in analytics_data["sessions"]),
                "total_messages": sum(s.get("message_count", 0) for s in analytics_data["sessions"])
            }
            
            # Keep only last 100 sessions to prevent memory bloat
            if len(analytics_data["sessions"]) > 100:
                analytics_data["sessions"] = analytics_data["sessions"][-100:]
            
            # Store updated data
            memory_system.memory_system.data["memory_categories"]["conversation_analytics"] = analytics_data

            # Save to file
            memory_system.memory_system.save_memory()
            
            self.logger.debug(f"Stored session analytics: {session_data['session_id']}")
            
        except Exception as e:
            self.logger.error(f"Error storing session analytics: {e}")
    
    def _get_analytics_from_memory(self) -> Dict[str, Any]:
        """Get analytics data from memory system"""
        try:
            if not self.memory_integration or not self.memory_integration.is_enabled:
                return {}
            
            memory_system = self.memory_integration.memory_system
            return memory_system.memory_system.data["memory_categories"].get("conversation_analytics", {})
        except Exception as e:
            self.logger.debug(f"Error getting analytics from memory: {e}")
            return {}
    
    def _calculate_session_gaps(self, sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate gaps between sessions"""
        if len(sessions) < 2:
            return {"average_gap_hours": 0, "gaps": []}
        
        gaps = []
        sorted_sessions = sorted(sessions, key=lambda x: x.get("start_time", ""))
        
        for i in range(1, len(sorted_sessions)):
            try:
                prev_end = datetime.fromisoformat(sorted_sessions[i-1]["end_time"])
                curr_start = datetime.fromisoformat(sorted_sessions[i]["start_time"])
                gap = curr_start - prev_end
                gaps.append(gap.total_seconds() / 3600)  # Convert to hours
            except Exception:
                continue
        
        average_gap = sum(gaps) / len(gaps) if gaps else 0
        
        return {
            "average_gap_hours": average_gap,
            "gaps": gaps,
            "shortest_gap_hours": min(gaps) if gaps else 0,
            "longest_gap_hours": max(gaps) if gaps else 0
        }

# Global instance for easy access
_analytics_system = None

def get_analytics_system(memory_integration=None) -> ConversationAnalytics:
    """Get or create the analytics system instance"""
    global _analytics_system
    
    if _analytics_system is None:
        _analytics_system = ConversationAnalytics(memory_integration)
    
    return _analytics_system

def reset_analytics_system():
    """Reset the analytics system instance"""
    global _analytics_system
    _analytics_system = None
