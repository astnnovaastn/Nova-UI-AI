#!/usr/bin/env python3
"""
Enhanced Nova Memory Interface
=============================

Upgraded memory interface that integrates the enhanced memory system
with the existing Nova AI architecture. Provides backward compatibility
while adding advanced features.

Features:
- Seamless integration with enhanced memory system
- Backward compatibility with existing NovaMemoryInterface
- Advanced memory retrieval and context generation
- Self-awareness and gap detection
- Continuous processing integration
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from .enhanced_memory_system import EnhancedMemorySystem, EnhancedMemoryCategories
from .user_profile_manager import UserProfileManager, ProfileCategory
from .memory_cleanup_system import MemoryCleanupSystem, CleanupPolicy

logger = logging.getLogger(__name__)

class EnhancedNovaMemoryInterface:
    """
    Enhanced memory interface with advanced features and backward compatibility
    """
    
    def __init__(self, memory_file: str = "enhanced_nova_memory.json",
                 enable_logging: bool = True):
        """Initialize the enhanced memory interface"""
        self.memory_file = memory_file
        self.enable_logging = enable_logging
        self.is_initialized = False
        
        try:
            # Initialize enhanced memory system
            self.memory_system = EnhancedMemorySystem(memory_file)
            
            # Initialize user profile manager
            self.user_profile_manager = UserProfileManager(
                profile_file="user_profile.json"
            )
            
            # Initialize memory cleanup system
            self.cleanup_system = MemoryCleanupSystem(
                memory_file=memory_file,
                profile_file="user_profile.json"
            )
            
            # Start automatic cleanup
            self.cleanup_system.start_automatic_cleanup()
            
            self.is_initialized = True
            
            if enable_logging:
                logger.info(f"[OK] Enhanced Memory Interface initialized with {len(self.memory_system.memories)} memories")
                logger.info(f"[OK] User Profile Manager initialized")
                logger.info(f"[OK] Memory Cleanup System started")
                
        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize enhanced memory interface: {e}")
            self.memory_system = None
            self.user_profile_manager = None
            self.cleanup_system = None
    
    def process_conversation(self, user_message: str, ai_response: str, 
                           context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a conversation with enhanced memory capabilities and real-time profile updates
        
        Args:
            user_message: The user's message
            ai_response: The AI's response
            context: Optional context information
            
        Returns:
            Dict with processing results including memory operations, categories affected, etc.
        """
        if not self.is_initialized:
            return {"success": False, "error": "Memory system not initialized"}
        
        try:
            # Process with enhanced memory system
            result = self.memory_system.process_conversation(user_message, ai_response, context)
            
            # Update user profile in real-time
            if self.user_profile_manager:
                self._update_user_profile_from_conversation(user_message, ai_response, context)
            
            if self.enable_logging and result.get('memory_operations', 0) > 0:
                logger.info(f"[MEMORY] Processed conversation: {result['memory_operations']} operations, "
                          f"{len(result['categories_affected'])} categories affected")
            
            return result
            
        except Exception as e:
            logger.error(f"[ERROR] Conversation processing failed: {e}")
            return {"success": False, "error": str(e)}
    
    def get_context_for_ai_response(self, context_type: str = "comprehensive") -> Dict[str, Any]:
        """
        Get comprehensive context for AI response generation
        
        Args:
            context_type: Type of context ('basic', 'comprehensive', 'focused')
            
        Returns:
            Dict containing comprehensive user context
        """
        if not self.is_initialized:
            return {"error": "Memory system not initialized"}
        
        try:
            if context_type == "comprehensive":
                # Get full user profile
                profile = self.memory_system.get_comprehensive_user_profile()
                
                # Add self-awareness information
                awareness = self.memory_system.get_self_awareness_status()
                
                # Add memory confidence report
                confidence_report = self.memory_system.get_memory_confidence_report()
                
                return {
                    "user_profile": profile,
                    "self_awareness": awareness,
                    "confidence_report": confidence_report,
                    "memory_gaps": [gap.__dict__ for gap in self.memory_system.memory_gaps],
                    "total_memories": len(self.memory_system.memories),
                    "last_updated": datetime.now().isoformat()
                }
            
            elif context_type == "basic":
                # Get essential information only
                essential_categories = ['user_identity', 'personal_preferences', 'communication_style']
                basic_context = {}
                
                for category in essential_categories:
                    memories = self.memory_system.get_memories_by_category(category)
                    if memories:
                        basic_context[category] = [
                            {
                                'content': m.content,
                                'confidence': m.confidence,
                                'subcategory': m.subcategory
                            }
                            for m in memories[:3]  # Top 3 memories per category
                        ]
                
                return {
                    "basic_context": basic_context,
                    "total_memories": len(self.memory_system.memories)
                }
            
            elif context_type == "focused":
                # Get recently accessed or high-priority memories
                all_memories = self.memory_system.get_all_memories()
                
                # Sort by recent access and high priority
                focused_memories = sorted(
                    all_memories,
                    key=lambda m: (m.last_accessed, m.priority.value),
                    reverse=True
                )[:10]
                
                focused_context = {}
                for memory in focused_memories:
                    if memory.category not in focused_context:
                        focused_context[memory.category] = []
                    
                    focused_context[memory.category].append({
                        'content': memory.content,
                        'confidence': memory.confidence,
                        'subcategory': memory.subcategory,
                        'last_accessed': memory.last_accessed.isoformat()
                    })
                
                return {
                    "focused_context": focused_context,
                    "context_size": len(focused_memories)
                }
            
        except Exception as e:
            logger.error(f"[ERROR] Context generation failed: {e}")
            return {"error": str(e)}
    
    def get_memory_statistics(self) -> Dict[str, Any]:
        """Get comprehensive memory statistics"""
        if not self.is_initialized:
            return {"error": "Memory system not initialized"}
        
        try:
            stats = self.memory_system.stats.copy()
            
            # Add category breakdown
            category_stats = {}
            for category in EnhancedMemoryCategories:
                memories = self.memory_system.get_memories_by_category(category.value)
                if memories:
                    avg_confidence = sum(m.confidence for m in memories) / len(memories)
                    category_stats[category.value] = {
                        'count': len(memories),
                        'avg_confidence': avg_confidence,
                        'last_updated': max(m.last_accessed for m in memories).isoformat()
                    }
            
            stats['category_breakdown'] = category_stats
            stats['active_categories'] = len(category_stats)
            
            # Add memory health assessment
            awareness = self.memory_system.get_self_awareness_status()
            stats['memory_health'] = awareness['memory_health']
            stats['coverage_percentage'] = awareness['memory_coverage']['coverage_percentage']
            
            return stats
            
        except Exception as e:
            logger.error(f"[ERROR] Statistics generation failed: {e}")
            return {"error": str(e)}
    
    def search_memories(self, query: str, category: str = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search memories with enhanced capabilities"""
        if not self.is_initialized:
            return []
        
        try:
            memories = self.memory_system.search_memories(query, category, limit)
            
            return [
                {
                    'id': memory.id,
                    'category': memory.category,
                    'subcategory': memory.subcategory,
                    'content': memory.content,
                    'confidence': memory.confidence,
                    'created_at': memory.created_at.isoformat(),
                    'last_accessed': memory.last_accessed.isoformat(),
                    'access_count': memory.access_count,
                    'tags': memory.tags
                }
                for memory in memories
            ]
            
        except Exception as e:
            logger.error(f"[ERROR] Memory search failed: {e}")
            return []
    
    def get_memory_gaps(self) -> List[Dict[str, Any]]:
        """Get detected memory gaps"""
        if not self.is_initialized:
            return []
        
        try:
            gaps = self.memory_system.detect_memory_gaps()
            
            return [
                {
                    'category': gap.category,
                    'description': gap.description,
                    'importance': gap.importance,
                    'suggested_questions': gap.suggested_questions,
                    'detected_at': gap.detected_at.isoformat()
                }
                for gap in gaps
            ]
            
        except Exception as e:
            logger.error(f"[ERROR] Gap detection failed: {e}")
            return []
    
    def get_self_awareness_report(self) -> Dict[str, Any]:
        """Get AI's self-awareness report about its memory state"""
        if not self.is_initialized:
            return {"error": "Memory system not initialized"}
        
        try:
            return self.memory_system.get_self_awareness_status()
            
        except Exception as e:
            logger.error(f"[ERROR] Self-awareness report failed: {e}")
            return {"error": str(e)}
    
    def is_healthy(self) -> Dict[str, Any]:
        """Check if memory system is healthy"""
        if not self.is_initialized:
            return {"healthy": False, "error": "Memory system not initialized"}
        
        try:
            awareness = self.memory_system.get_self_awareness_status()
            confidence_report = self.memory_system.get_memory_confidence_report()
            
            # Determine health status
            health_score = 0
            issues = []
            
            # Check coverage
            coverage = awareness['memory_coverage']['coverage_percentage']
            if coverage > 70:
                health_score += 30
            elif coverage > 50:
                health_score += 20
            else:
                issues.append(f"Low memory coverage: {coverage:.1f}%")
            
            # Check confidence
            overall_confidence = confidence_report['overall_confidence']
            if overall_confidence > 0.8:
                health_score += 40
            elif overall_confidence > 0.6:
                health_score += 30
            elif overall_confidence > 0.4:
                health_score += 20
            else:
                issues.append(f"Low confidence: {overall_confidence:.2f}")
            
            # Check memory count
            memory_count = len(self.memory_system.memories)
            if memory_count > 50:
                health_score += 20
            elif memory_count > 20:
                health_score += 15
            elif memory_count > 5:
                health_score += 10
            else:
                issues.append(f"Few memories stored: {memory_count}")
            
            # Check gaps
            gap_count = len(self.memory_system.memory_gaps)
            if gap_count < 3:
                health_score += 10
            elif gap_count < 5:
                health_score += 5
            else:
                issues.append(f"Many memory gaps: {gap_count}")
            
            return {
                "healthy": health_score >= 70,
                "health_score": health_score,
                "health_status": awareness['memory_health'],
                "issues": issues,
                "recommendations": confidence_report.get('recommendations', [])
            }
            
        except Exception as e:
            logger.error(f"[ERROR] Health check failed: {e}")
            return {"healthy": False, "error": str(e)}
    
    # Backward compatibility methods
    def store_memory(self, content: str, category: str = "general", 
                    confidence: float = 0.8) -> str:
        """Store a memory (backward compatibility)"""
        if not self.is_initialized:
            return ""
        
        return self.memory_system.store_memory(
            category=category,
            subcategory="general",
            content=content,
            confidence=confidence
        )
    
    def get_memories(self, category: str = None) -> List[Dict[str, Any]]:
        """Get memories (backward compatibility)"""
        if category:
            return self.search_memories("", category)
        else:
            return self.search_memories("")[:20]  # Limit for compatibility
    
    def load_memory(self, query: str = "", context_type: str = "comprehensive") -> Dict[str, Any]:
        """
        Load relevant memory information for AI responses.
        This is the main function that should be called before generating responses.
        
        Args:
            query: The user's query to find relevant memories
            context_type: Type of context to load ('comprehensive', 'basic', 'focused')
            
        Returns:
            Dict containing all relevant memory information for AI response generation
        """
        if not self.is_initialized:
            return {
                "success": False,
                "error": "Memory system not initialized",
                "fallback_context": self._get_fallback_context()
            }
        
        try:
            # Get comprehensive context
            context = self.get_context_for_ai_response(context_type)
            
            # Search for query-specific memories
            relevant_memories = []
            if query:
                relevant_memories = self.search_memories(query, limit=10)
            
            # Get recent conversation history (last 2-3 days)
            recent_conversations = self._get_recent_conversations(days=3)
            
            # Get user instructions and preferences
            user_instructions = self._get_user_instructions()
            
            # Get memory gaps for proactive suggestions
            memory_gaps = self.get_memory_gaps()
            
            # Check for specific user instructions that should be followed
            auto_instructions = self._get_auto_instructions()
            
            # Get comprehensive user profile data
            user_profile_data = {}
            if self.user_profile_manager:
                try:
                    user_profile_data = self.user_profile_manager.get_profile_summary()
                except Exception as e:
                    logger.error(f"Failed to get user profile summary: {e}")
                    user_profile_data = {}
            
            # Build comprehensive memory context
            memory_context = {
                "success": True,
                "query": query,
                "context_type": context_type,
                "timestamp": datetime.now().isoformat(),
                
                # Core user information
                "user_profile": context.get("user_profile", {}),
                "user_profile_data": user_profile_data,
                "basic_context": context.get("basic_context", {}),
                "focused_context": context.get("focused_context", {}),
                
                # Query-specific information
                "relevant_memories": relevant_memories,
                "recent_conversations": recent_conversations,
                
                # User instructions and preferences
                "user_instructions": user_instructions,
                "auto_instructions": auto_instructions,
                
                # Memory system status
                "memory_gaps": memory_gaps,
                "memory_stats": self.get_memory_statistics(),
                "self_awareness": context.get("self_awareness", {}),
                
                # Fallback information
                "fallback_available": True,
                "fallback_context": self._get_fallback_context()
            }
            
            # Add memory availability flag
            memory_context["memory_available"] = len(relevant_memories) > 0 or len(context.get("user_profile", {})) > 0
            
            return memory_context
            
        except Exception as e:
            logger.error(f"[ERROR] Memory loading failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "fallback_context": self._get_fallback_context(),
                "memory_available": False
            }
    
    def _get_recent_conversations(self, days: int = 3) -> List[Dict[str, Any]]:
        """Get recent conversation history from the last N days"""
        if not self.is_initialized:
            return []
        
        try:
            # Get all memories and filter by recent conversations
            all_memories = self.memory_system.get_all_memories()
            cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
            
            recent_memories = []
            for memory in all_memories:
                if memory.category in ['conversation_summary', 'current_state', 'session_themes']:
                    memory_timestamp = memory.created_at.timestamp() if hasattr(memory.created_at, 'timestamp') else 0
                    if memory_timestamp > cutoff_date:
                        recent_memories.append({
                            'content': memory.content,
                            'category': memory.category,
                            'subcategory': memory.subcategory,
                            'created_at': memory.created_at.isoformat() if hasattr(memory.created_at, 'isoformat') else str(memory.created_at),
                            'confidence': memory.confidence
                        })
            
            # Sort by creation date (most recent first)
            recent_memories.sort(key=lambda x: x['created_at'], reverse=True)
            
            return recent_memories[:20]  # Limit to 20 most recent
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to get recent conversations: {e}")
            return []
    
    def _get_user_instructions(self) -> List[Dict[str, Any]]:
        """Get stored user instructions and preferences"""
        if not self.is_initialized:
            return []
        
        try:
            # Search for user instructions in various categories
            instruction_categories = ['user_instructions', 'personal_preferences', 'communication_boundaries']
            instructions = []
            
            for category in instruction_categories:
                memories = self.memory_system.get_memories_by_category(category)
                for memory in memories:
                    if memory.confidence > 0.7:  # Only high-confidence instructions
                        instructions.append({
                            'content': memory.content,
                            'category': memory.category,
                            'subcategory': memory.subcategory,
                            'confidence': memory.confidence,
                            'created_at': memory.created_at.isoformat() if hasattr(memory.created_at, 'isoformat') else str(memory.created_at)
                        })
            
            return instructions
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to get user instructions: {e}")
            return []
    
    def _get_auto_instructions(self) -> List[Dict[str, Any]]:
        """Get instructions that should be automatically followed (like showing time)"""
        if not self.is_initialized:
            return []
        
        try:
            # Look for specific auto-execution instructions
            auto_keywords = ['always', 'every time', 'automatically', 'show', 'display', 'when', 'start']
            auto_instructions = []
            
            all_memories = self.memory_system.get_all_memories()
            for memory in all_memories:
                if memory.category == 'user_instructions' and memory.confidence > 0.8:
                    content_lower = memory.content.lower()
                    if any(keyword in content_lower for keyword in auto_keywords):
                        auto_instructions.append({
                            'content': memory.content,
                            'category': memory.category,
                            'subcategory': memory.subcategory,
                            'confidence': memory.confidence,
                            'trigger_keywords': [kw for kw in auto_keywords if kw in content_lower]
                        })
            
            return auto_instructions
            
        except Exception as e:
            logger.error(f"[ERROR] Failed to get auto instructions: {e}")
            return []
    
    def _get_fallback_context(self) -> Dict[str, Any]:
        """Get fallback context when memory system is not available"""
        return {
            "message": "Memory system not available. I'll do my best to help you without access to our previous conversations.",
            "suggestions": [
                "You can ask me anything you'd like to know",
                "I can help with general questions and tasks",
                "Feel free to tell me about yourself so I can remember for next time"
            ],
            "capabilities": [
                "Answer questions",
                "Help with tasks",
                "Provide information",
                "Engage in conversation"
            ]
        }
    
    def _update_user_profile_from_conversation(self, user_message: str, ai_response: str, 
                                             context: Optional[Dict[str, Any]] = None):
        """Update user profile based on conversation content"""
        try:
            if not self.user_profile_manager:
                return
            
            # Extract topics from conversation
            topics = self._extract_topics_from_conversation(user_message, ai_response)
            
            # Extract personal information
            personal_info = self._extract_personal_info(user_message)
            if personal_info:
                self.user_profile_manager.update_profile(personal_info, ProfileCategory.PERSONAL_INFO)
            
            # Extract preferences
            preferences = self._extract_preferences(user_message)
            if preferences:
                self.user_profile_manager.update_profile(preferences, ProfileCategory.PREFERENCES)
            
            # Extract goals and aspirations
            goals = self._extract_goals(user_message)
            if goals:
                self.user_profile_manager.update_profile(goals, ProfileCategory.GOALS_ASPIRATIONS)
            
            # Extract instructions
            instructions = self._extract_instructions(user_message)
            if instructions:
                self.user_profile_manager.update_profile(instructions, ProfileCategory.INSTRUCTIONS_RULES)
            
            # Add conversation data
            sentiment = self._analyze_sentiment(user_message)
            self.user_profile_manager.add_conversation_data(
                user_message, ai_response, topics, sentiment
            )
            
        except Exception as e:
            logger.error(f"Failed to update user profile: {e}")
    
    def _extract_topics_from_conversation(self, user_message: str, ai_response: str) -> List[str]:
        """Extract topics from conversation"""
        topics = []
        message_lower = user_message.lower()
        
        # Simple topic extraction based on keywords
        topic_keywords = {
            "work": ["work", "job", "career", "office", "meeting", "project"],
            "technology": ["computer", "software", "programming", "tech", "ai", "code"],
            "health": ["health", "fitness", "exercise", "diet", "medical", "doctor"],
            "travel": ["travel", "vacation", "trip", "flight", "hotel", "destination"],
            "family": ["family", "parents", "children", "kids", "spouse", "relatives"],
            "hobbies": ["hobby", "interest", "sport", "music", "art", "reading"],
            "education": ["school", "university", "learning", "study", "course", "education"],
            "finance": ["money", "budget", "investment", "savings", "financial", "bank"]
        }
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                topics.append(topic)
        
        return topics
    
    def _extract_personal_info(self, user_message: str) -> Dict[str, Any]:
        """Extract personal information from user message"""
        personal_info = {}
        message_lower = user_message.lower()
        
        # Extract name
        if "my name is" in message_lower:
            name_start = message_lower.find("my name is") + 10
            name_part = user_message[name_start:].strip()
            if name_part:
                personal_info["name"] = name_part.split()[0]
        
        # Extract age
        if "i am" in message_lower and "years old" in message_lower:
            import re
            age_match = re.search(r'i am (\d+) years old', message_lower)
            if age_match:
                personal_info["age"] = int(age_match.group(1))
        elif "i'm" in message_lower and "years old" in message_lower:
            import re
            age_match = re.search(r"i'm (\d+) years old", message_lower)
            if age_match:
                personal_info["age"] = int(age_match.group(1))
        
        # Extract location
        location_indicators = ["i live in", "i'm from", "i'm in", "located in"]
        for indicator in location_indicators:
            if indicator in message_lower:
                location_start = message_lower.find(indicator) + len(indicator)
                location_part = user_message[location_start:].strip()
                if location_part:
                    personal_info["location"] = location_part.split()[0]
                break
        
        return personal_info
    
    def _extract_preferences(self, user_message: str) -> Dict[str, Any]:
        """Extract user preferences from message"""
        preferences = {}
        message_lower = user_message.lower()
        
        # Communication style preferences
        if "i prefer" in message_lower or "i like" in message_lower:
            if "short" in message_lower and "response" in message_lower:
                preferences["response_length"] = "short"
            elif "detailed" in message_lower and "response" in message_lower:
                preferences["response_length"] = "detailed"
            elif "casual" in message_lower:
                preferences["communication_style"] = "casual"
            elif "formal" in message_lower:
                preferences["communication_style"] = "formal"
        
        # Topics of interest
        interest_indicators = ["i'm interested in", "i like", "i enjoy", "i love"]
        for indicator in interest_indicators:
            if indicator in message_lower:
                interest_start = message_lower.find(indicator) + len(indicator)
                interest_part = user_message[interest_start:].strip()
                if interest_part:
                    # Extract topics from the interest statement
                    topics = self._extract_topics_from_conversation(interest_part, "")
                    if topics:
                        preferences["topics_of_interest"] = topics
                break
        
        return preferences
    
    def _extract_goals(self, user_message: str) -> Dict[str, Any]:
        """Extract goals and aspirations from message"""
        goals = {}
        message_lower = user_message.lower()
        
        goal_indicators = ["i want to", "i hope to", "my goal is", "i'm trying to", "i plan to"]
        for indicator in goal_indicators:
            if indicator in message_lower:
                goal_start = message_lower.find(indicator) + len(indicator)
                goal_part = user_message[goal_start:].strip()
                if goal_part:
                    if "short" in message_lower or "soon" in message_lower:
                        goals.setdefault("short_term_goals", []).append(goal_part)
                    else:
                        goals.setdefault("long_term_goals", []).append(goal_part)
                break
        
        return goals
    
    def _extract_instructions(self, user_message: str) -> Dict[str, Any]:
        """Extract user instructions from message"""
        instructions = {}
        message_lower = user_message.lower()
        
        instruction_indicators = ["always", "never", "remember to", "please", "i want you to"]
        for indicator in instruction_indicators:
            if indicator in message_lower:
                instruction_start = message_lower.find(indicator)
                instruction_part = user_message[instruction_start:].strip()
                if instruction_part:
                    if "always" in message_lower or "every time" in message_lower:
                        instructions.setdefault("auto_execute_commands", []).append(instruction_part)
                    else:
                        instructions.setdefault("permanent_instructions", []).append(instruction_part)
                break
        
        return instructions
    
    def _analyze_sentiment(self, user_message: str) -> str:
        """Simple sentiment analysis"""
        message_lower = user_message.lower()
        
        positive_words = ["happy", "good", "great", "excellent", "wonderful", "amazing", "love", "like"]
        negative_words = ["sad", "bad", "terrible", "awful", "hate", "dislike", "angry", "frustrated"]
        
        positive_count = sum(1 for word in positive_words if word in message_lower)
        negative_count = sum(1 for word in negative_words if word in message_lower)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        else:
            return "neutral"
    
    def get_user_profile(self) -> Dict[str, Any]:
        """Get comprehensive user profile data"""
        if not self.user_profile_manager:
            return {"error": "User profile manager not available"}
        
        try:
            return self.user_profile_manager.get_profile().to_dict()
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            return {"error": str(e)}
    
    def update_user_profile(self, updates: Dict[str, Any], category: str = None) -> bool:
        """Update user profile with new information"""
        if not self.user_profile_manager:
            return False
        
        try:
            profile_category = None
            if category:
                try:
                    profile_category = ProfileCategory(category)
                except ValueError:
                    logger.warning(f"Invalid profile category: {category}")
            
            return self.user_profile_manager.update_profile(updates, profile_category)
        except Exception as e:
            logger.error(f"Failed to update user profile: {e}")
            return False
    
    def search_user_profile(self, query: str) -> Dict[str, Any]:
        """Search user profile for specific information"""
        if not self.user_profile_manager:
            return {"error": "User profile manager not available"}
        
        try:
            return self.user_profile_manager.search_profile(query)
        except Exception as e:
            logger.error(f"Failed to search user profile: {e}")
            return {"error": str(e)}
    
    def export_user_profile(self, export_file: str = None) -> str:
        """Export user profile to a file"""
        if not self.user_profile_manager:
            return ""
        
        try:
            return self.user_profile_manager.export_profile(export_file)
        except Exception as e:
            logger.error(f"Failed to export user profile: {e}")
            return ""
    
    def get_profile_statistics(self) -> Dict[str, Any]:
        """Get user profile statistics"""
        if not self.user_profile_manager:
            return {"error": "User profile manager not available"}
        
        try:
            return self.user_profile_manager.get_profile_stats()
        except Exception as e:
            logger.error(f"Failed to get profile statistics: {e}")
            return {"error": str(e)}
    
    def run_memory_cleanup(self, policy: str = "balanced", dry_run: bool = False) -> Dict[str, Any]:
        """Run memory cleanup with specified policy"""
        if not self.cleanup_system:
            return {"error": "Memory cleanup system not available"}
        
        try:
            cleanup_policy = CleanupPolicy(policy)
            stats = self.cleanup_system.cleanup_memories(cleanup_policy, dry_run)
            return {
                "success": True,
                "stats": {
                    "total_memories_before": stats.total_memories_before,
                    "total_memories_after": stats.total_memories_after,
                    "memories_deleted": stats.memories_deleted,
                    "memories_preserved": stats.memories_preserved,
                    "cleanup_duration": stats.cleanup_duration,
                    "policy_used": stats.policy_used
                }
            }
        except Exception as e:
            logger.error(f"Failed to run memory cleanup: {e}")
            return {"error": str(e)}
    
    def get_cleanup_recommendations(self) -> Dict[str, Any]:
        """Get memory cleanup recommendations"""
        if not self.cleanup_system:
            return {"error": "Memory cleanup system not available"}
        
        try:
            return self.cleanup_system.get_cleanup_recommendations()
        except Exception as e:
            logger.error(f"Failed to get cleanup recommendations: {e}")
            return {"error": str(e)}
    
    def stop_cleanup_system(self):
        """Stop the automatic memory cleanup system"""
        if self.cleanup_system:
            self.cleanup_system.stop_automatic_cleanup()
            logger.info("Memory cleanup system stopped")