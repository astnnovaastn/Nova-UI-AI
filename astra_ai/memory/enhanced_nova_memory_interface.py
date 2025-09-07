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

import os
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from enhanced_memory_system import EnhancedMemorySystem, MemoryPriority, EnhancedMemoryCategories

logger = logging.getLogger(__name__)

class EnhancedNovaMemoryInterface:
    """
    Enhanced memory interface with advanced features and backward compatibility
    """
    
    def __init__(self, memory_file: str = "enhanced_nova_memory.json", enable_logging: bool = True):
        """Initialize the enhanced memory interface"""
        self.memory_file = memory_file
        self.enable_logging = enable_logging
        self.is_initialized = False
        
        try:
            # Initialize enhanced memory system
            self.memory_system = EnhancedMemorySystem(memory_file)
            self.is_initialized = True
            
            if enable_logging:
                logger.info(f"[OK] Enhanced Memory Interface initialized with {len(self.memory_system.memories)} memories")
                
        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize enhanced memory interface: {e}")
            self.memory_system = None
    
    def process_conversation(self, user_message: str, ai_response: str, 
                           context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process a conversation with enhanced memory capabilities
        
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
            result = self.memory_system.process_conversation(user_message, ai_response, context)
            
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
