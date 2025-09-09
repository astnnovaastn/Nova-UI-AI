#!/usr/bin/env python3
"""
Memory Cleanup System for Nova AI
=================================

Automatic cleanup system that removes old, unused, or irrelevant memories
to maintain memory efficiency and prevent overload.

Features:
- Age-based memory cleanup
- Usage-based memory cleanup
- Relevance-based memory cleanup
- Essential data preservation
- Configurable cleanup policies
- Cleanup logging and reporting
"""

import json
import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set, Tuple
from dataclasses import dataclass, field
from enum import Enum
import threading
import time

logger = logging.getLogger(__name__)


class CleanupPolicy(Enum):
    """Memory cleanup policies"""
    CONSERVATIVE = "conservative"  # Keep more memories
    BALANCED = "balanced"         # Moderate cleanup
    AGGRESSIVE = "aggressive"     # Remove more memories
    CUSTOM = "custom"             # User-defined policy


class MemoryType(Enum):
    """Types of memories for cleanup classification"""
    ESSENTIAL = "essential"       # Never delete
    IMPORTANT = "important"       # Delete only if very old
    NORMAL = "normal"            # Standard cleanup rules
    TEMPORARY = "temporary"      # Delete quickly
    REDUNDANT = "redundant"      # Delete immediately


@dataclass
class CleanupRule:
    """Rule for memory cleanup"""
    memory_type: MemoryType
    max_age_days: int
    min_access_count: int
    relevance_threshold: float
    preserve_essential: bool = True
    description: str = ""


@dataclass
class CleanupStats:
    """Statistics about cleanup operations"""
    total_memories_before: int = 0
    total_memories_after: int = 0
    memories_deleted: int = 0
    memories_preserved: int = 0
    cleanup_duration: float = 0.0
    cleanup_timestamp: str = ""
    policy_used: str = ""
    errors: List[str] = field(default_factory=list)


class MemoryCleanupSystem:
    """Automatic memory cleanup system"""
    
    def __init__(self, memory_file: str, profile_file: str = "user_profile.json"):
        """
        Initialize the memory cleanup system
        
        Args:
            memory_file: Path to the main memory file
            profile_file: Path to the user profile file
        """
        self.memory_file = memory_file
        self.profile_file = profile_file
        self.cleanup_rules = self._initialize_cleanup_rules()
        self.cleanup_stats = CleanupStats()
        self.is_running = False
        self.cleanup_thread = None
        
        # Load existing cleanup configuration
        self.config = self._load_cleanup_config()
    
    def _initialize_cleanup_rules(self) -> Dict[MemoryType, CleanupRule]:
        """Initialize default cleanup rules"""
        return {
            MemoryType.ESSENTIAL: CleanupRule(
                memory_type=MemoryType.ESSENTIAL,
                max_age_days=365,  # Keep for 1 year
                min_access_count=1,
                relevance_threshold=0.0,
                preserve_essential=True,
                description="Essential user data - never delete"
            ),
            MemoryType.IMPORTANT: CleanupRule(
                memory_type=MemoryType.IMPORTANT,
                max_age_days=90,   # Keep for 3 months
                min_access_count=2,
                relevance_threshold=0.7,
                preserve_essential=True,
                description="Important memories - keep longer"
            ),
            MemoryType.NORMAL: CleanupRule(
                memory_type=MemoryType.NORMAL,
                max_age_days=30,   # Keep for 1 month
                min_access_count=1,
                relevance_threshold=0.5,
                preserve_essential=False,
                description="Normal memories - standard cleanup"
            ),
            MemoryType.TEMPORARY: CleanupRule(
                memory_type=MemoryType.TEMPORARY,
                max_age_days=7,    # Keep for 1 week
                min_access_count=0,
                relevance_threshold=0.3,
                preserve_essential=False,
                description="Temporary memories - quick cleanup"
            ),
            MemoryType.REDUNDANT: CleanupRule(
                memory_type=MemoryType.REDUNDANT,
                max_age_days=1,    # Keep for 1 day
                min_access_count=0,
                relevance_threshold=0.1,
                preserve_essential=False,
                description="Redundant memories - immediate cleanup"
            )
        }
    
    def _load_cleanup_config(self) -> Dict[str, Any]:
        """Load cleanup configuration from file"""
        config_file = "memory_cleanup_config.json"
        default_config = {
            "policy": "balanced",
            "auto_cleanup_enabled": True,
            "cleanup_interval_hours": 24,
            "max_memory_size_mb": 100,
            "preserve_essential_data": True,
            "cleanup_logging": True
        }
        
        try:
            if os.path.exists(config_file):
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                # Merge with defaults
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                return config
            else:
                # Save default config
                with open(config_file, 'w', encoding='utf-8') as f:
                    json.dump(default_config, f, indent=2)
                return default_config
        except Exception as e:
            logger.error(f"Failed to load cleanup config: {e}")
            return default_config
    
    def _save_cleanup_config(self) -> bool:
        """Save cleanup configuration to file"""
        try:
            config_file = "memory_cleanup_config.json"
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Failed to save cleanup config: {e}")
            return False
    
    def _classify_memory(self, memory: Dict[str, Any]) -> MemoryType:
        """Classify a memory based on its content and metadata"""
        try:
            # Check if it's essential user data
            essential_keywords = [
                "name", "age", "location", "preferences", "goals",
                "instructions", "security", "profile", "identity"
            ]
            
            content = memory.get("content", "").lower()
            category = memory.get("category", "").lower()
            
            # Essential data
            if any(keyword in content for keyword in essential_keywords):
                return MemoryType.ESSENTIAL
            
            if category in ["user_identity", "personal_preferences", "user_instructions"]:
                return MemoryType.ESSENTIAL
            
            # Important data
            important_keywords = [
                "project", "work", "career", "learning", "skill",
                "relationship", "family", "important"
            ]
            
            if any(keyword in content for keyword in important_keywords):
                return MemoryType.IMPORTANT
            
            if category in ["task_project_tracking", "personal_development", "long_term_goals"]:
                return MemoryType.IMPORTANT
            
            # Temporary data
            temporary_keywords = [
                "weather", "news", "current", "today", "now",
                "temporary", "session", "conversation"
            ]
            
            if any(keyword in content for keyword in temporary_keywords):
                return MemoryType.TEMPORARY
            
            if category in ["current_state", "session_themes", "news_weather_history"]:
                return MemoryType.TEMPORARY
            
            # Check for redundancy
            access_count = memory.get("access_count", 0)
            confidence = memory.get("confidence", 0.5)
            
            if access_count == 0 and confidence < 0.3:
                return MemoryType.REDUNDANT
            
            # Default to normal
            return MemoryType.NORMAL
            
        except Exception as e:
            logger.error(f"Failed to classify memory: {e}")
            return MemoryType.NORMAL
    
    def _should_delete_memory(self, memory: Dict[str, Any], rule: CleanupRule) -> Tuple[bool, str]:
        """
        Determine if a memory should be deleted based on cleanup rules
        
        Returns:
            Tuple[bool, str]: (should_delete, reason)
        """
        try:
            # Check age
            created_at = memory.get("created_at", "")
            if created_at:
                try:
                    created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    age_days = (datetime.now() - created_date).days
                    
                    if age_days > rule.max_age_days:
                        return True, f"Memory is {age_days} days old (max: {rule.max_age_days})"
                except:
                    pass
            
            # Check access count
            access_count = memory.get("access_count", 0)
            if access_count < rule.min_access_count:
                return True, f"Memory accessed only {access_count} times (min: {rule.min_access_count})"
            
            # Check relevance
            confidence = memory.get("confidence", 0.5)
            if confidence < rule.relevance_threshold:
                return True, f"Memory confidence {confidence:.2f} below threshold {rule.relevance_threshold:.2f}"
            
            # Check if essential data should be preserved
            if rule.preserve_essential and memory.get("category") in ["user_identity", "personal_preferences"]:
                return False, "Essential data preserved"
            
            return False, "Memory meets retention criteria"
            
        except Exception as e:
            logger.error(f"Error checking memory deletion: {e}")
            return False, f"Error: {e}"
    
    def cleanup_memories(self, policy: CleanupPolicy = CleanupPolicy.BALANCED, 
                        dry_run: bool = False) -> CleanupStats:
        """
        Perform memory cleanup based on the specified policy
        
        Args:
            policy: Cleanup policy to use
            dry_run: If True, only simulate cleanup without deleting
            
        Returns:
            CleanupStats: Statistics about the cleanup operation
        """
        start_time = time.time()
        self.cleanup_stats = CleanupStats()
        self.cleanup_stats.cleanup_timestamp = datetime.now().isoformat()
        self.cleanup_stats.policy_used = policy.value
        
        try:
            # Load memory data
            if not os.path.exists(self.memory_file):
                logger.warning(f"Memory file {self.memory_file} not found")
                self.cleanup_stats.total_memories_before = 0
                self.cleanup_stats.total_memories_after = 0
                self.cleanup_stats.cleanup_duration = time.time() - start_time
                return self.cleanup_stats
            
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    memory_data = json.load(f)
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Invalid JSON in memory file: {e}")
                self.cleanup_stats.total_memories_before = 0
                self.cleanup_stats.total_memories_after = 0
                self.cleanup_stats.cleanup_duration = time.time() - start_time
                return self.cleanup_stats
            
            # Get all memories
            all_memories = []
            if isinstance(memory_data, dict) and "memories" in memory_data:
                all_memories = memory_data["memories"]
            elif isinstance(memory_data, list):
                all_memories = memory_data
            
            self.cleanup_stats.total_memories_before = len(all_memories)
            
            # Apply policy-specific rules
            if policy == CleanupPolicy.CONSERVATIVE:
                self._apply_conservative_policy()
            elif policy == CleanupPolicy.AGGRESSIVE:
                self._apply_aggressive_policy()
            elif policy == CleanupPolicy.CUSTOM:
                self._apply_custom_policy()
            else:  # BALANCED
                self._apply_balanced_policy()
            
            # Process memories
            memories_to_keep = []
            memories_to_delete = []
            
            for memory in all_memories:
                memory_type = self._classify_memory(memory)
                rule = self.cleanup_rules.get(memory_type, self.cleanup_rules[MemoryType.NORMAL])
                
                should_delete, reason = self._should_delete_memory(memory, rule)
                
                if should_delete:
                    memories_to_delete.append((memory, reason))
                else:
                    memories_to_keep.append(memory)
            
            # Calculate stats
            if dry_run:
                # In dry run, show what would be deleted but don't actually delete
                self.cleanup_stats.memories_deleted = len(memories_to_delete)
                self.cleanup_stats.memories_preserved = len(memories_to_keep)
                self.cleanup_stats.total_memories_after = self.cleanup_stats.total_memories_before  # No actual changes
            else:
                # In actual run, update the counts
                self.cleanup_stats.memories_deleted = len(memories_to_delete)
                self.cleanup_stats.memories_preserved = len(memories_to_keep)
            
            # Perform cleanup if not dry run
            if not dry_run and memories_to_delete:
                # Update memory data
                if "memories" in memory_data:
                    memory_data["memories"] = memories_to_keep
                else:
                    memory_data = memories_to_keep
                
                # Save updated memory data
                with open(self.memory_file, 'w', encoding='utf-8') as f:
                    json.dump(memory_data, f, indent=2, ensure_ascii=False)
                
                # Log cleanup details
                if self.config.get("cleanup_logging", True):
                    self._log_cleanup_details(memories_to_delete)
            
            # Set final count for non-dry run
            if not dry_run:
                self.cleanup_stats.total_memories_after = len(memories_to_keep)
            self.cleanup_stats.cleanup_duration = time.time() - start_time
            
            logger.info(f"Memory cleanup completed: {self.cleanup_stats.memories_deleted} deleted, "
                       f"{self.cleanup_stats.memories_preserved} preserved")
            
            return self.cleanup_stats
            
        except Exception as e:
            error_msg = f"Cleanup failed: {e}"
            logger.error(error_msg)
            self.cleanup_stats.errors.append(error_msg)
            self.cleanup_stats.cleanup_duration = time.time() - start_time
            return self.cleanup_stats
    
    def _apply_conservative_policy(self):
        """Apply conservative cleanup policy"""
        # Increase retention periods
        for rule in self.cleanup_rules.values():
            rule.max_age_days = int(rule.max_age_days * 1.5)
            rule.min_access_count = max(1, rule.min_access_count - 1)
            rule.relevance_threshold = max(0.1, rule.relevance_threshold - 0.1)
    
    def _apply_aggressive_policy(self):
        """Apply aggressive cleanup policy"""
        # Decrease retention periods
        for rule in self.cleanup_rules.values():
            if rule.memory_type != MemoryType.ESSENTIAL:
                rule.max_age_days = max(1, int(rule.max_age_days * 0.7))
                rule.min_access_count = rule.min_access_count + 1
                rule.relevance_threshold = min(0.9, rule.relevance_threshold + 0.1)
    
    def _apply_balanced_policy(self):
        """Apply balanced cleanup policy (use default rules)"""
        pass  # Use default rules
    
    def _apply_custom_policy(self):
        """Apply custom cleanup policy from configuration"""
        # This would load custom rules from configuration
        pass
    
    def _log_cleanup_details(self, deleted_memories: List[Tuple[Dict, str]]):
        """Log details about deleted memories"""
        try:
            log_file = f"memory_cleanup_{datetime.now().strftime('%Y%m%d')}.log"
            
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"\n=== Memory Cleanup - {datetime.now().isoformat()} ===\n")
                f.write(f"Policy: {self.cleanup_stats.policy_used}\n")
                f.write(f"Memories deleted: {self.cleanup_stats.memories_deleted}\n")
                f.write(f"Memories preserved: {self.cleanup_stats.memories_preserved}\n")
                f.write(f"Duration: {self.cleanup_stats.cleanup_duration:.2f}s\n\n")
                
                for memory, reason in deleted_memories:
                    f.write(f"DELETED: {memory.get('content', '')[:100]}...\n")
                    f.write(f"Reason: {reason}\n")
                    f.write(f"Category: {memory.get('category', 'unknown')}\n")
                    f.write(f"Age: {memory.get('created_at', 'unknown')}\n\n")
                
                f.write("=" * 50 + "\n")
                
        except Exception as e:
            logger.error(f"Failed to log cleanup details: {e}")
    
    def start_automatic_cleanup(self):
        """Start automatic cleanup in background thread"""
        if self.is_running:
            logger.warning("Automatic cleanup is already running")
            return
        
        if not self.config.get("auto_cleanup_enabled", True):
            logger.info("Automatic cleanup is disabled")
            return
        
        self.is_running = True
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
        logger.info("Automatic memory cleanup started")
    
    def stop_automatic_cleanup(self):
        """Stop automatic cleanup"""
        self.is_running = False
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=5)
        logger.info("Automatic memory cleanup stopped")
    
    def _cleanup_loop(self):
        """Background cleanup loop"""
        while self.is_running:
            try:
                # Wait for next cleanup interval
                interval_hours = self.config.get("cleanup_interval_hours", 24)
                time.sleep(interval_hours * 3600)
                
                if not self.is_running:
                    break
                
                # Perform cleanup
                policy = CleanupPolicy(self.config.get("policy", "balanced"))
                self.cleanup_memories(policy)
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying
    
    def get_cleanup_recommendations(self) -> Dict[str, Any]:
        """Get recommendations for memory cleanup"""
        try:
            if not os.path.exists(self.memory_file):
                return {"error": "Memory file not found"}
            
            with open(self.memory_file, 'r', encoding='utf-8') as f:
                memory_data = json.load(f)
            
            all_memories = memory_data.get("memories", []) if isinstance(memory_data, dict) else memory_data
            
            recommendations = {
                "total_memories": len(all_memories),
                "memory_size_mb": os.path.getsize(self.memory_file) / (1024 * 1024),
                "recommendations": []
            }
            
            # Analyze memory distribution
            memory_types = {}
            for memory in all_memories:
                mem_type = self._classify_memory(memory)
                memory_types[mem_type] = memory_types.get(mem_type, 0) + 1
            
            recommendations["memory_distribution"] = memory_types
            
            # Generate recommendations
            if len(all_memories) > 1000:
                recommendations["recommendations"].append("Consider running cleanup - high memory count")
            
            if recommendations["memory_size_mb"] > 50:
                recommendations["recommendations"].append("Consider running cleanup - large memory file")
            
            if memory_types.get(MemoryType.REDUNDANT, 0) > 100:
                recommendations["recommendations"].append("Many redundant memories detected")
            
            if memory_types.get(MemoryType.TEMPORARY, 0) > 500:
                recommendations["recommendations"].append("Many temporary memories detected")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to get cleanup recommendations: {e}")
            return {"error": str(e)}


def create_memory_cleanup_system(memory_file: str, profile_file: str = "user_profile.json") -> MemoryCleanupSystem:
    """Create a new memory cleanup system instance"""
    return MemoryCleanupSystem(memory_file, profile_file)
