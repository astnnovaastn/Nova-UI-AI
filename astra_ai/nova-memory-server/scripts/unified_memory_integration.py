#!/usr/bin/env python3
"""
Unified Memory Integration for Nova AI
=====================================

Comprehensive memory integration that brings together all memory system components
to work as "one brain" with seamless integration, self-awareness, and advanced features.

Features:
- Unified interface for all memory systems
- Self-awareness and confidence scoring
- Memory gap detection and recommendations
- Seamless AI-memory integration
- Backward compatibility with existing systems
"""

import os
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import json

# Import all memory system components
try:
    from enhanced_memory_system import EnhancedMemorySystem, MemoryPriority, EnhancedMemoryCategories
    ENHANCED_MEMORY_AVAILABLE = True
except ImportError:
    ENHANCED_MEMORY_AVAILABLE = False
    EnhancedMemorySystem = None

try:
    from enhanced_nova_memory_interface import EnhancedNovaMemoryInterface
    ENHANCED_INTERFACE_AVAILABLE = True
except ImportError:
    ENHANCED_INTERFACE_AVAILABLE = False
    EnhancedNovaMemoryInterface = None

try:
    from nova_memory_interface import NovaMemoryInterface
    STANDARD_INTERFACE_AVAILABLE = True
except ImportError:
    STANDARD_INTERFACE_AVAILABLE = False
    NovaMemoryInterface = None

logger = logging.getLogger(__name__)

class UnifiedMemoryIntegration:
    """
    Unified memory integration that combines all memory systems into one cohesive brain
    """
    
    def __init__(self, memory_file: str = "unified_nova_memory.json", enable_logging: bool = True):
        """Initialize the unified memory integration"""
        self.memory_file = memory_file
        self.enable_logging = enable_logging
        self.is_enabled = False
        
        # Memory system components
        self.enhanced_memory = None
        self.enhanced_interface = None
        self.standard_interface = None
        
        # Self-awareness state
        self.self_awareness = {
            'memory_health': 'unknown',
            'confidence_level': 0.0,
            'knowledge_gaps': [],
            'learning_priorities': [],
            'memory_coverage': 0.0,
            'last_assessment': None
        }
        
        # Initialize memory systems
        self._initialize_memory_systems()
        
        if self.is_enabled:
            # Perform initial self-assessment
            self._update_self_awareness()
            
            if enable_logging:
                logger.info(f"[OK] Unified Memory Integration initialized")
                logger.info(f"Memory health: {self.self_awareness['memory_health']}")
                logger.info(f"Confidence level: {self.self_awareness['confidence_level']:.2f}")
    
    def _initialize_memory_systems(self):
        """Initialize all available memory systems"""
        systems_initialized = 0
        
        # Try to initialize enhanced memory system
        if ENHANCED_MEMORY_AVAILABLE:
            try:
                enhanced_file = self.memory_file.replace('.json', '_enhanced.json')
                self.enhanced_memory = EnhancedMemorySystem(enhanced_file)
                systems_initialized += 1
                logger.info("[OK] Enhanced memory system initialized")
            except Exception as e:
                logger.error(f"[ERROR] Enhanced memory system failed: {e}")
        
        # Try to initialize enhanced interface
        if ENHANCED_INTERFACE_AVAILABLE:
            try:
                interface_file = self.memory_file.replace('.json', '_interface.json')
                self.enhanced_interface = EnhancedNovaMemoryInterface(interface_file, self.enable_logging)
                systems_initialized += 1
                logger.info("[OK] Enhanced memory interface initialized")
            except Exception as e:
                logger.error(f"[ERROR] Enhanced memory interface failed: {e}")
        
        # Try to initialize standard interface as fallback
        if STANDARD_INTERFACE_AVAILABLE:
            try:
                self.standard_interface = NovaMemoryInterface(self.memory_file, self.enable_logging)
                systems_initialized += 1
                logger.info("[OK] Standard memory interface initialized")
            except Exception as e:
                logger.error(f"[ERROR] Standard memory interface failed: {e}")
        
        # Check if at least one system is available
        self.is_enabled = systems_initialized > 0
        
        if not self.is_enabled:
            logger.error("[ERROR] No memory systems could be initialized")
    
    def process_conversation(self, user_message: str, ai_response: str, 
                           context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process conversation with unified memory capabilities"""
        if not self.is_enabled:
            return {"success": False, "error": "Memory system not available"}
        
        results = []
        
        # Process with enhanced memory system
        if self.enhanced_memory:
            try:
                enhanced_result = self.enhanced_memory.process_conversation(user_message, ai_response, context)
                results.append(("enhanced", enhanced_result))
            except Exception as e:
                logger.error(f"[ERROR] Enhanced memory processing failed: {e}")
        
        # Process with enhanced interface
        if self.enhanced_interface:
            try:
                interface_result = self.enhanced_interface.process_conversation(user_message, ai_response, context)
                results.append(("interface", interface_result))
            except Exception as e:
                logger.error(f"[ERROR] Enhanced interface processing failed: {e}")
        
        # Process with standard interface as fallback
        if self.standard_interface and not results:
            try:
                standard_result = self.standard_interface.process_conversation(user_message, ai_response, context)
                results.append(("standard", standard_result))
            except Exception as e:
                logger.error(f"[ERROR] Standard interface processing failed: {e}")
        
        # Combine results
        if results:
            combined_result = self._combine_processing_results(results)
            
            # Update self-awareness after processing
            self._update_self_awareness()
            
            return combined_result
        else:
            return {"success": False, "error": "All memory processing failed"}
    
    def _combine_processing_results(self, results: List[Tuple[str, Dict[str, Any]]]) -> Dict[str, Any]:
        """Combine results from multiple memory systems"""
        combined = {
            "success": True,
            "memory_operations": 0,
            "categories_affected": [],
            "systems_used": [],
            "enhanced_processing": False,
            "insights_generated": [],
            "timestamp": datetime.now().isoformat()
        }
        
        for system_name, result in results:
            if result.get("success", False):
                combined["memory_operations"] += result.get("memory_operations", 0)
                combined["categories_affected"].extend(result.get("categories_affected", []))
                combined["systems_used"].append(system_name)
                
                if system_name in ["enhanced", "interface"]:
                    combined["enhanced_processing"] = True
                
                if "insights_generated" in result:
                    combined["insights_generated"].extend(result["insights_generated"])
        
        # Remove duplicates
        combined["categories_affected"] = list(set(combined["categories_affected"]))
        
        return combined
    
    def get_comprehensive_context(self, context_type: str = "comprehensive") -> Dict[str, Any]:
        """Get comprehensive context from all memory systems"""
        if not self.is_enabled:
            return {"error": "Memory system not available"}
        
        # Try enhanced interface first
        if self.enhanced_interface:
            try:
                context = self.enhanced_interface.get_context_for_ai_response(context_type)
                
                # Add self-awareness information
                context["self_awareness"] = self.self_awareness
                context["unified_integration"] = True
                
                return context
            except Exception as e:
                logger.error(f"[ERROR] Enhanced context retrieval failed: {e}")
        
        # Fallback to standard interface
        if self.standard_interface:
            try:
                context = self.standard_interface.get_context_for_ai_response(context_type)
                context["self_awareness"] = self.self_awareness
                context["unified_integration"] = True
                return context
            except Exception as e:
                logger.error(f"[ERROR] Standard context retrieval failed: {e}")
        
        return {"error": "Context retrieval failed"}
    
    def _update_self_awareness(self):
        """Update AI's self-awareness of its memory state"""
        try:
            if self.enhanced_memory:
                # Get comprehensive self-awareness from enhanced system
                awareness = self.enhanced_memory.get_self_awareness_status()
                confidence_report = self.enhanced_memory.get_memory_confidence_report()
                
                self.self_awareness.update({
                    'memory_health': awareness['memory_health'],
                    'confidence_level': confidence_report['overall_confidence'],
                    'knowledge_gaps': awareness['knowledge_gaps'][:5],  # Top 5 gaps
                    'learning_priorities': awareness['learning_priorities'],
                    'memory_coverage': awareness['memory_coverage']['coverage_percentage'],
                    'last_assessment': datetime.now().isoformat()
                })
            
            elif self.enhanced_interface:
                # Get self-awareness from enhanced interface
                awareness = self.enhanced_interface.get_self_awareness_report()
                
                self.self_awareness.update({
                    'memory_health': awareness.get('memory_health', 'unknown'),
                    'confidence_level': awareness.get('confidence_assessment', {}).get('overall_confidence', 0.0),
                    'knowledge_gaps': awareness.get('knowledge_gaps', [])[:5],
                    'learning_priorities': awareness.get('learning_priorities', []),
                    'memory_coverage': awareness.get('memory_coverage', {}).get('coverage_percentage', 0.0),
                    'last_assessment': datetime.now().isoformat()
                })
            
            else:
                # Basic self-awareness from standard interface
                if self.standard_interface:
                    stats = self.standard_interface.get_memory_statistics()
                    
                    self.self_awareness.update({
                        'memory_health': 'basic',
                        'confidence_level': 0.6,  # Default for standard system
                        'knowledge_gaps': [],
                        'learning_priorities': [],
                        'memory_coverage': 50.0,  # Estimate for standard system
                        'last_assessment': datetime.now().isoformat()
                    })
        
        except Exception as e:
            logger.error(f"[ERROR] Self-awareness update failed: {e}")
    
    def get_memory_status_report(self) -> Dict[str, Any]:
        """Get comprehensive memory status report"""
        report = {
            "unified_integration": True,
            "systems_available": [],
            "self_awareness": self.self_awareness,
            "memory_statistics": {},
            "health_assessment": {},
            "recommendations": []
        }
        
        # Check available systems
        if self.enhanced_memory:
            report["systems_available"].append("enhanced_memory")
        if self.enhanced_interface:
            report["systems_available"].append("enhanced_interface")
        if self.standard_interface:
            report["systems_available"].append("standard_interface")
        
        # Get memory statistics
        try:
            if self.enhanced_interface:
                stats = self.enhanced_interface.get_memory_statistics()
                report["memory_statistics"] = stats
            elif self.standard_interface:
                stats = self.standard_interface.get_memory_statistics()
                report["memory_statistics"] = stats
        except Exception as e:
            logger.error(f"[ERROR] Statistics retrieval failed: {e}")
        
        # Health assessment
        try:
            if self.enhanced_interface:
                health = self.enhanced_interface.is_healthy()
                report["health_assessment"] = health
                report["recommendations"] = health.get("recommendations", [])
        except Exception as e:
            logger.error(f"[ERROR] Health assessment failed: {e}")
        
        return report
    
    def what_do_you_know_about_me(self) -> str:
        """Generate comprehensive response about what the AI knows about the user"""
        if not self.is_enabled:
            return "I don't have access to memory systems right now, so I can only remember what we've discussed in this current conversation."
        
        try:
            # Get comprehensive context
            context = self.get_comprehensive_context("comprehensive")
            
            if "error" in context:
                return "I'm having trouble accessing my memory systems right now. I can only remember our current conversation."
            
            # Build comprehensive response
            response_parts = []
            
            # User identity and preferences
            user_profile = context.get("user_profile", {})
            if user_profile:
                response_parts.append("Here's what I know about you:")
                
                # Identity information
                identity = user_profile.get("identity", {})
                if identity:
                    response_parts.append("\n**Identity & Personal:**")
                    for category, data in identity.items():
                        if data:
                            category_name = category.replace('_', ' ').title()
                            response_parts.append(f"• {category_name}: {self._format_memory_data(data)}")
                
                # Preferences
                preferences = user_profile.get("preferences", {})
                if preferences:
                    response_parts.append("\n**Preferences & Communication:**")
                    for category, data in preferences.items():
                        if data:
                            category_name = category.replace('_', ' ').title()
                            response_parts.append(f"• {category_name}: {self._format_memory_data(data)}")
                
                # Professional information
                professional = user_profile.get("professional", {})
                if professional:
                    response_parts.append("\n**Professional Background:**")
                    for category, data in professional.items():
                        if data:
                            category_name = category.replace('_', ' ').title()
                            response_parts.append(f"• {category_name}: {self._format_memory_data(data)}")
                
                # Personal interests
                personal = user_profile.get("personal", {})
                if personal:
                    response_parts.append("\n**Personal Interests:**")
                    for category, data in personal.items():
                        if data:
                            category_name = category.replace('_', ' ').title()
                            response_parts.append(f"• {category_name}: {self._format_memory_data(data)}")
            
            # Self-awareness information
            if self.self_awareness['knowledge_gaps']:
                response_parts.append(f"\n**Areas I'd like to learn more about:**")
                for gap in self.self_awareness['knowledge_gaps'][:3]:
                    response_parts.append(f"• {gap.get('description', gap.get('category', 'Unknown area'))}")
            
            # Memory confidence
            confidence = self.self_awareness['confidence_level']
            coverage = self.self_awareness['memory_coverage']
            
            response_parts.append(f"\n**Memory Status:**")
            response_parts.append(f"• Confidence in stored information: {confidence:.1%}")
            response_parts.append(f"• Memory coverage: {coverage:.1f}%")
            response_parts.append(f"• Memory health: {self.self_awareness['memory_health'].title()}")
            
            if response_parts:
                return "\n".join(response_parts)
            else:
                return "I don't have much stored information about you yet. As we continue talking, I'll learn and remember more about your preferences, interests, and background."
        
        except Exception as e:
            logger.error(f"[ERROR] Comprehensive memory retrieval failed: {e}")
            return "I'm having some difficulty accessing my memory systems right now. I can remember our current conversation, but I may not have access to all stored information about you."
    
    def _format_memory_data(self, data: Dict[str, Any]) -> str:
        """Format memory data for display"""
        if not data:
            return "No information stored"
        
        formatted_items = []
        for subcategory, items in data.items():
            if items:
                if isinstance(items, list):
                    for item in items[:2]:  # Show top 2 items
                        content = item.get('content', str(item))
                        if content and len(content) > 100:
                            content = content[:97] + "..."
                        formatted_items.append(content)
                else:
                    content = str(items)
                    if len(content) > 100:
                        content = content[:97] + "..."
                    formatted_items.append(content)
        
        return "; ".join(formatted_items[:3]) if formatted_items else "No specific details stored"

    def store_memory(self, content: str, category: str = "general", confidence: float = 0.8) -> str:
        """Store a memory (compatibility method for news system)"""
        if self.enhanced_memory:
            return self.enhanced_memory.store_memory(
                category=category,
                subcategory="general",
                content=content,
                confidence=confidence
            )
        elif self.enhanced_interface:
            return self.enhanced_interface.store_memory(content, category, confidence)
        elif self.standard_interface:
            return self.standard_interface.store_memory(content, category, confidence)
        else:
            return ""

    def get_memories(self, category: str = None) -> List[Dict[str, Any]]:
        """Get memories (compatibility method for news system)"""
        if self.enhanced_interface:
            return self.enhanced_interface.search_memories("", category)
        elif self.standard_interface:
            return self.standard_interface.get_memories(category)
        else:
            return []

    # Add memory_system property for backward compatibility
    @property
    def memory_system(self):
        """Provide memory_system property for backward compatibility"""
        if self.enhanced_memory:
            return self.enhanced_memory
        elif self.enhanced_interface:
            return self.enhanced_interface
        elif self.standard_interface:
            return self.standard_interface
        else:
            return None


# Convenience function for easy integration
def get_unified_memory_integration(memory_file: str = "unified_nova_memory.json", 
                                 enable_logging: bool = True) -> UnifiedMemoryIntegration:
    """Get unified memory integration instance"""
    return UnifiedMemoryIntegration(memory_file, enable_logging)
