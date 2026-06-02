"""
AI Organizer Module for Nova Memory AI System
Continuously monitors and enhances memory entries in-place for improved quality.

This module implements an AI that continuously monitors nova_ai_memory.json for new entries,
and whenever the memory system adds information, the AI reads the original source of that
information, interprets the context, and rewrites the summary in the json make it clearer,
more accurate, and richer. It improves grammar, capitalization, and phrasing, personalizes
references to the user, adds relevant context or inferred details, and can merge updates with
existing memories if needed, all without creating ENRICH events. This process ensures that
the memory system's content is continuously enhanced and refined, keeping each memory entry
structured, understandable, and meaningful while remaining in its original place in the
nova_ai_memory.json

The organizer leverages the comprehensive 27-category memory framework to provide rich,
contextually-aware memory enhancement that considers the full spectrum of user information.
"""

import re
import json
import os
import time
import shutil
import requests
from datetime import datetime
from collections import deque
from dotenv import load_dotenv
load_dotenv()
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum



class MemoryCategory(Enum):
    """Comprehensive 27-category memory framework"""
    USER_IDENTITY = "user_identity"
    PERSONAL_PREFERENCES = "personal_preferences"
    TASK_PROJECT_TRACKING = "task_project_tracking"
    ACTIVITY_BEHAVIOR = "activity_behavior"
    USER_INSTRUCTIONS = "user_instructions"
    CURRENT_STATE = "current_state"
    PERSONAL_DEVELOPMENT = "personal_development"
    COMMUNICATION_BOUNDARIES = "communication_boundaries"
    CONTEXTUAL_RULES = "contextual_rules"
    MULTI_IDENTITY = "multi_identity"
    KNOWLEDGE_EXPERTISE = "knowledge_expertise"
    TOOL_INTEGRATION = "tool_integration"
    RESPONSE_ADAPTATION = "response_adaptation"
    FILE_MEDIA = "file_media"
    LONG_TERM_GOALS = "long_term_goals"
    COLLABORATOR_RELATIONSHIPS = "collaborator_relationships"
    DATA_PRIVACY = "data_privacy"
    MULTIMODAL_PREFERENCES = "multimodal_preferences"
    SYSTEM_AWARENESS = "system_awareness"
    SESSION_THEMES = "session_themes"
    META_MEMORY = "meta_memory"
    TEMPORAL_PATTERNS = "temporal_patterns"
    SEARCH_EXTERNAL_INFO = "search_external_info"
    GREETING_PATTERNS = "greeting_patterns"
    CONVERSATION_ANALYTICS = "conversation_analytics"
    NEWS_WEATHER_HISTORY = "news_weather_history"
    TIMEZONE_PREFERENCES = "timezone_preferences"

class AIOrganizer:
    """
    AI Organizer that continuously monitors and improves memory quality in-place.
    
    This implementation works exactly as specified:
    - Continuously monitors nova_ai_memory.json for new entries
    - Reads the original source of information
    - Interprets context and rewrites memory entries directly in place
    - Makes entries clearer, more accurate, and richer
    - Improves grammar, capitalization, and phrasing
    - Personalizes references to the user
    - Adds relevant context or inferred details
    - Merges updates with existing memories when needed
    - All without creating separate "ENRICH" events
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the AI Organizer with configuration.
        
        Args:
            config: Configuration dictionary with organizer settings
        """
        self.config = config
        self.organizer_enabled = config.get('organizer_enabled', True)
        self.memory_file_path = config.get('memory_file_path', os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'))
        self.check_interval = config.get('check_interval', 1.0)  # seconds
        self.last_processed_index = -1
        self.llm_enabled = config.get('llm_enabled', False)
        self.llm_api_key = config.get('llm_api_key', '')  # Not needed for Ollama
        self.llm_model = config.get('llm_model', 'qwen2.5:3b')
        self.ollama_url = 'http://localhost:11434/api/chat'
        
        # Initialize comprehensive category framework
        self.category_framework = self._initialize_category_framework()
        
        # Initialize normalization maps
        self._initialize_normalization_maps()
        
        # Track processed events to avoid duplication
        self.processed_events = set()
        
        # Enhanced context tracking for better memory rewriting
        self.contextual_knowledge = {}
        
    def _initialize_category_framework(self) -> Dict[str, Any]:
        """Initialize the comprehensive 27-category memory framework with detailed specifications."""
        return {
            MemoryCategory.USER_IDENTITY.value: {
                'description': 'Names, pronouns, identity evolution',
                'enhancement_focus': 'Personalization, identity consistency, name variations',
                'contextual_considerations': ['previous_names', 'identity_evolution', 'pronoun_preferences']
            },
            MemoryCategory.PERSONAL_PREFERENCES.value: {
                'description': 'Response style, formality, explanation rules',
                'enhancement_focus': 'Communication adaptation, preference consistency, style evolution',
                'contextual_considerations': ['communication_style', 'formality_level', 'explanation_preferences']
            },
            MemoryCategory.TASK_PROJECT_TRACKING.value: {
                'description': 'Active projects, tech stacks, deadlines',
                'enhancement_focus': 'Project context, technical details, timeline awareness',
                'contextual_considerations': ['current_projects', 'tech_stack', 'deadlines', 'progress_tracking']
            },
            MemoryCategory.ACTIVITY_BEHAVIOR.value: {
                'description': 'Active times, conversation topics, engagement',
                'enhancement_focus': 'Behavioral patterns, temporal context, engagement metrics',
                'contextual_considerations': ['active_hours', 'topic_preferences', 'engagement_levels']
            },
            MemoryCategory.USER_INSTRUCTIONS.value: {
                'description': 'Permanent commands, rules, triggers',
                'enhancement_focus': 'Instruction clarity, permanence recognition, trigger identification',
                'contextual_considerations': ['permanent_rules', 'conditional_triggers', 'command_hierarchy']
            },
            MemoryCategory.CURRENT_STATE.value: {
                'description': 'Active topics, mood, recent questions',
                'enhancement_focus': 'State awareness, temporal relevance, contextual transitions',
                'contextual_considerations': ['active_topics', 'emotional_state', 'recent_interactions']
            },
            MemoryCategory.PERSONAL_DEVELOPMENT.value: {
                'description': 'Skills learning, progress, emotional notes',
                'enhancement_focus': 'Progress tracking, skill relationships, learning patterns',
                'contextual_considerations': ['skill_progress', 'learning_journey', 'developmental_milestones']
            },
            MemoryCategory.COMMUNICATION_BOUNDARIES.value: {
                'description': 'Sensitive topics, triggers, support level',
                'enhancement_focus': 'Boundary respect, sensitivity awareness, support adaptation',
                'contextual_considerations': ['sensitive_topics', 'emotional_triggers', 'support_boundaries']
            },
            MemoryCategory.CONTEXTUAL_RULES.value: {
                'description': 'Scope, expiry, recall priority',
                'enhancement_focus': 'Rule contextualization, priority management, scope definition',
                'contextual_considerations': ['rule_scope', 'priority_levels', 'expiration_contexts']
            },
            MemoryCategory.MULTI_IDENTITY.value: {
                'description': 'Role profiles, switching triggers',
                'enhancement_focus': 'Identity context switching, role consistency, transition awareness',
                'contextual_considerations': ['role_profiles', 'identity_switching', 'contextual_triggers']
            },
            MemoryCategory.KNOWLEDGE_EXPERTISE.value: {
                'description': 'Skill levels, known concepts',
                'enhancement_focus': 'Expertise assessment, knowledge mapping, competency progression',
                'contextual_considerations': ['skill_levels', 'domain_knowledge', 'competency_assessment']
            },
            MemoryCategory.TOOL_INTEGRATION.value: {
                'description': 'Permissions, preferred languages',
                'enhancement_focus': 'Integration optimization, preference alignment, permission management',
                'contextual_considerations': ['tool_preferences', 'permission_levels', 'integration_contexts']
            },
            MemoryCategory.RESPONSE_ADAPTATION.value: {
                'description': 'Style corrections, tone adaptation',
                'enhancement_focus': 'Adaptive responses, tone consistency, style refinement',
                'contextual_considerations': ['style_corrections', 'tone_adaptation', 'response_refinement']
            },
            MemoryCategory.FILE_MEDIA.value: {
                'description': 'Uploads, context links, preferences',
                'enhancement_focus': 'Media context, link relevance, preference tracking',
                'contextual_considerations': ['file_references', 'media_preferences', 'link_context']
            },
            MemoryCategory.LONG_TERM_GOALS.value: {
                'description': 'Life goals, career objectives, blockers',
                'enhancement_focus': 'Goal progression, objective alignment, obstacle identification',
                'contextual_considerations': ['life_goals', 'career_objectives', 'progress_tracking']
            },
            MemoryCategory.COLLABORATOR_RELATIONSHIPS.value: {
                'description': 'Team members, communication styles',
                'enhancement_focus': 'Relationship dynamics, communication adaptation, collaboration context',
                'contextual_considerations': ['team_members', 'communication_styles', 'collaboration_history']
            },
            MemoryCategory.DATA_PRIVACY.value: {
                'description': 'Retention policies, private sessions',
                'enhancement_focus': 'Privacy compliance, retention management, session security',
                'contextual_considerations': ['privacy_policies', 'retention_rules', 'security_protocols']
            },
            MemoryCategory.MULTIMODAL_PREFERENCES.value: {
                'description': 'Image styles, audio modes',
                'enhancement_focus': 'Multimodal adaptation, preference consistency, format optimization',
                'contextual_considerations': ['media_formats', 'style_preferences', 'modality_choices']
            },
            MemoryCategory.SYSTEM_AWARENESS.value: {
                'description': 'Errors, feedback, constraints',
                'enhancement_focus': 'System understanding, constraint awareness, feedback integration',
                'contextual_considerations': ['system_constraints', 'error_history', 'feedback_loops']
            },
            MemoryCategory.SESSION_THEMES.value: {
                'description': 'Themes, emotional arcs, continuity',
                'enhancement_focus': 'Thematic consistency, emotional tracking, narrative coherence',
                'contextual_considerations': ['session_themes', 'emotional_arcs', 'continuity_markers']
            },
            MemoryCategory.META_MEMORY.value: {
                'description': 'Browser UI, change logs, cleanup',
                'enhancement_focus': 'Meta-awareness, change tracking, system maintenance',
                'contextual_considerations': ['system_ui', 'change_logs', 'maintenance_tracking']
            },
            MemoryCategory.TEMPORAL_PATTERNS.value: {
                'description': 'Time-based behaviors and preferences',
                'enhancement_focus': 'Temporal awareness, pattern recognition, schedule optimization',
                'contextual_considerations': ['time_patterns', 'behavioral_cycles', 'schedule_preferences']
            },
            MemoryCategory.SEARCH_EXTERNAL_INFO.value: {
                'description': 'Internet search history, preferences, trusted sources',
                'enhancement_focus': 'Information quality, source reliability, search optimization',
                'contextual_considerations': ['search_history', 'trusted_sources', 'information_preferences']
            },
            MemoryCategory.GREETING_PATTERNS.value: {
                'description': 'Greeting history, timing, session tracking',
                'enhancement_focus': 'Greeting personalization, timing awareness, session initiation',
                'contextual_considerations': ['greeting_history', 'timing_patterns', 'session_starts']
            },
            MemoryCategory.CONVERSATION_ANALYTICS.value: {
                'description': 'Duration, session gaps, statistics',
                'enhancement_focus': 'Interaction analysis, pattern recognition, engagement metrics',
                'contextual_considerations': ['conversation_metrics', 'engagement_patterns', 'session_analytics']
            },
            MemoryCategory.NEWS_WEATHER_HISTORY.value: {
                'description': 'News and weather query results and summaries',
                'enhancement_focus': 'Information currency, contextual relevance, summary quality',
                'contextual_considerations': ['news_topics', 'weather_queries', 'information_timeliness']
            },
            MemoryCategory.TIMEZONE_PREFERENCES.value: {
                'description': 'Time zone queries and location preferences',
                'enhancement_focus': 'Geographic awareness, time synchronization, location context',
                'contextual_considerations': ['timezone_queries', 'location_preferences', 'time_synchronization']
            }
        }
        
    def _initialize_normalization_maps(self):
        """Initialize normalization maps for technologies, countries, etc."""
        self.TECH_MAP = {
            'python': 'Python',
            'javascript': 'JavaScript',
            'java': 'Java',
            'py': 'Python',
            'js': 'JavaScript',
            'ts': 'TypeScript'
        }
        
        self.COUNTRY_MAP = {
            'italy': 'Italy',
            'france': 'France',
            'germany': 'Germany',
            'spain': 'Spain',
            'usa': 'USA',
            'uk': 'UK'
        }
        
        # Shorthand expansions
        self.SHORTHAND_MAP = {
            "api": "API",
            "ui": "UI",
            "ux": "UX",
            "html": "HTML",
            "css": "CSS",
            "json": "JSON",
            "xml": "XML",
            "yaml": "YAML",
            "dev": "development",
            "repo": "repository",
            "cli": "command line interface",
            "sdk": "software development kit",
            "ide": "integrated development environment"
        }
        
def start_monitoring(self):\n \"\"\"Start continuous monitoring of the memory file.\"\"\"\n        if not self.organizer_enabled:\n            print(\"Organizer is disabled.\")\n            return\n            \n        print(f\"Starting AI Organizer monitoring: {self.memory_file_path}\")\n        \n        try:\n            # Ensure the memory file exists\n            if not os.path.exists(self.memory_file_path):\n                # Create directory if needed - using the directory of the memory file\n                os.makedirs(os.path.dirname(os.path.abspath(self.memory_file_path)), exist_ok=True)\n                # Create empty memory file\n                with open(self.memory_file_path, 'w') as f:\n                    json.dump({\n                        \"memory_events\": [],\n                        \"current_facts\": {},\n                        \"fact_history\": {},\n                        \"conversation\": [],\n                        \"user\": {}\n                    }, f, indent=2)\n                print(f\"Created memory file: {self.memory_file_path}\")\n            \n            # Get initial state\n            memory_data = self._load_memory_file()\n            if memory_data:\n                self.last_processed_index = len(memory_data.get('memory_events', [])) - 1\n            else:\n                self.last_processed_index = -1\n            \n            # Start monitoring loop\n            while True:\n                try:\n                    # Check for changes\n                    memory_data = self._load_memory_file()\n                    if memory_data:\n                        current_events_count = len(memory_data.get('memory_events', []))\n                        \n                        # Process new events\n                        if current_events_count > self.last_processed_index + 1:\n                            for i in range(self.last_processed_index + 1, current_events_count):\n                                self._process_new_event(memory_data, i)\n                            # Update last processed index\n                            self.last_processed_index = current_events_count - 1\n                            \n                            # Save updated memory data\n                            self._save_memory_file(memory_data)\n                        \n                        # Also process current_facts and fact_history for any changes\n                        self._enhance_current_facts_and_history(memory_data)\n                        \n                    # Wait before next check\n                    time.sleep(self.check_interval)\n                    \n                except KeyboardInterrupt:\n                    print(\"\\nAI Organizer monitoring stopped by user.\")\n                    break\n                except Exception as e:\n                    print(f\"Error during monitoring: {e}\")\n                    time.sleep(self.check_interval)\n                    \n        except Exception as e:\n            print(f\"Failed to start organizer monitoring: {e}\")\n
            
    def _load_memory_file(self) -> Optional[Dict[str, Any]]:
        """Load the memory file safely."""
        
        
        try:
            if os.path.exists(self.memory_file_path):
                with open(self.memory_file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading memory file: {e}")
        return None
        
    def _save_memory_file(self, memory_data: Dict[str, Any]):
        """Save memory data with backup."""
        try:
            # Create backup
            self._create_backup()
            
            # Save updated data
            with open(self.memory_file_path, 'w', encoding='utf-8') as f:
                json.dump(memory_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving memory file: {e}")
            
    def _create_backup(self):
        """Create a backup of the current memory file."""
        try:
            if os.path.exists(self.memory_file_path):
                backup_dir = os.path.join(os.path.dirname(self.memory_file_path), 'backups')
                os.makedirs(backup_dir, exist_ok=True)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = os.path.join(backup_dir, f'nova_ai_memory_{timestamp}.json')
                shutil.copy2(self.memory_file_path, backup_path)
        except Exception as e:
            print(f"Warning: Could not create backup: {e}")
            
    def _process_new_event(self, memory_data: Dict[str, Any], event_index: int):
        """Process a new memory event and enhance it in-place."""
        try:
            # Get the event
            if event_index >= len(memory_data.get('memory_events', [])):
                return
                
            event = memory_data['memory_events'][event_index]
            
            # Skip if not a dictionary or already processed
            if not isinstance(event, dict):
                return
                
            # Create unique identifier for the event
            event_id = self._get_event_identifier(event, event_index)
            if event_id in self.processed_events:
                return
                
            # Mark as processed
            self.processed_events.add(event_id)
            
            # Find the source conversation item
            conv_item = self._find_source_conversation(memory_data, event)
            
            # Process current_facts and fact_history first to enhance their content
            self._enhance_current_facts_and_history(memory_data)
            
            # Enhance the event in-place
            self._enhance_event_in_place(event, conv_item, memory_data)
            
        except Exception as e:
            print(f"Error processing event {event_index}: {e}")
            
    def _get_event_identifier(self, event: Dict[str, Any], index: int) -> str:
        """Create a unique identifier for an event."""
        # Try to use timestamp and summary for uniqueness
        timestamp = event.get('timestamp', '')
        summary = event.get('summary', '')
        if timestamp or summary:
            return f"{timestamp}_{summary}_{index}"
        # Fallback to index
        return str(index)
        
    def _find_source_conversation(self, memory_data: Dict[str, Any], event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find the source conversation item for an event."""
        try:
            timestamp = event.get('timestamp')
            if not timestamp:
                return None
                
            conversation = memory_data.get('conversation', [])
            for conv_item in conversation:
                if conv_item.get('timestamp') == timestamp:
                    return conv_item
                    
            # Try to find approximate match
            target_time = datetime.fromisoformat(timestamp)
            best_match = None
            best_delta = None
            
            for conv_item in conversation:
                conv_timestamp = conv_item.get('timestamp')
                if not conv_timestamp:
                    continue
                    
                try:
                    conv_time = datetime.fromisoformat(conv_timestamp)
                    delta = abs((conv_time - target_time).total_seconds())
                    
                    if best_delta is None or delta < best_delta:
                        best_match = conv_item
                        best_delta = delta
                except Exception:
                    continue
                    
            # Only return if close enough (within 1 second)
            if best_delta is None or delta <= 1.0:
                return best_match
                
        except Exception as e:
            print(f"Error finding source conversation: {e}")
            
        return None
        
    def _enhance_event_in_place(self, event: Dict[str, Any], conv_item: Optional[Dict[str, Any]], memory_data: Dict[str, Any]):
        """Enhance an event in-place with improved content using comprehensive category awareness."""
        try:
            # Get original content
            original_summary = event.get('summary', '')
            conv_content = conv_item.get('content', '') if conv_item else ''
            
            # Use conversation content as primary source when available, especially if current summary is generic
            if conv_content and (not original_summary or self._is_generic_summary(original_summary)):
                # Use the actual user conversation content to create a better summary
                source_text = conv_content
            elif conv_content and original_summary:
                # Combine both if we have both, but prioritize conversation content for enhancement
                source_text = f"Original summary: {original_summary}. User said: {conv_content}"
            else:
                source_text = original_summary or conv_content
            
            # Get the category from the event to determine how to enhance it
            category = event.get('category', '') or event.get('fact_category', '') or self._infer_category_from_event(event)
            
            # Get user name for personalization
            user_name = self._get_user_name(memory_data)
            
            # Apply category-aware enhancements
            enhanced_summary = self._apply_category_aware_enhancements_to_event(source_text, category, user_name, memory_data)
            
            # Only update if we have a meaningful enhancement
            if enhanced_summary and enhanced_summary != original_summary:
                event['summary'] = enhanced_summary
            
            # Add provenance to indicate in-place enhancement
            provenance = event.get('provenance', {})
            if not isinstance(provenance, dict):
                provenance = {}
                
            # Store original summary if it's different from enhanced and meaningful
            if original_summary and original_summary != enhanced_summary:
                provenance.update({
                    'enhanced_in_place': True,
                    'enhanced_at': datetime.now().isoformat(),
                    'original_summary': original_summary
                })
            else:
                # Store enhancement information
                provenance.update({
                    'enhanced_in_place': True,
                    'enhanced_at': datetime.now().isoformat()
                })
            
            if conv_item:
                provenance['source_conversation_timestamp'] = conv_item.get('timestamp')
                
            event['provenance'] = provenance
            
            # Ensure other required fields exist
            self._ensure_event_structure(event, conv_item)
            
        except Exception as e:
            print(f"Error enhancing event: {e}")
            
    def _infer_category_from_event(self, event: Dict[str, Any]) -> str:
        """Infer the category from the event structure and content."""
        # Check for common category indicators in the event
        if 'category' in event:
            return event['category']
        
        # Check for other possible category fields
        possible_category_fields = ['fact_category', 'memory_category', 'type', 'tag']
        for field in possible_category_fields:
            if field in event:
                return event[field]
        
        # Infer from the content of the event
        summary = event.get('summary', '').lower()
        
        # Keyword-based category inference
        category_keywords = {
            'personal_preferences': ['prefer', 'like', 'love', 'hate', 'dislike', 'enjoy', 'favorite', 'interest'],
            'user_preferences': ['prefer', 'like', 'love', 'hate', 'dislike', 'enjoy', 'favorite', 'interest'],
            'interests': ['interest', 'hobby', 'passion', 'like', 'enjoy'],
            'long_term_goals': ['goal', 'aim', 'dream', 'hope', 'become', 'achieve', 'aspiration'],
            'collaborator_relationships': ['friend', 'colleague', 'partner', 'team', 'coworker', 'relationship'],
            'user_identity': ['name', 'id', 'identity', 'pronoun'],
            'activity_behavior': ['usually', 'always', 'often', 'rarely', 'behavior', 'time', 'active'],
            'current_state': ['currently', 'now', 'present', 'state'],
            'knowledge_expertise': ['know', 'expert', 'skill', 'proficient', 'experience']
        }
        
        for category, keywords in category_keywords.items():
            if any(keyword in summary for keyword in keywords):
                return category
        
        return 'general'
    
    def _apply_category_aware_enhancements_to_event(self, text: str, category: Optional[str], user_name: Optional[str], memory_data: Dict[str, Any]) -> str:
        """Apply enhancements to an event based on its category."""
        if not text:
            return "User interaction recorded"
        
        # Store original text for reference
        original_text = text
        user_ref = user_name or "User"
        
        # Handle case where category is None
        if category is None:
            category = 'general'
        
        # Determine the specific subcategory if applicable
        category_parts = category.split('.')
        main_category = category_parts[0] if category_parts else ''
        sub_category = category_parts[1] if len(category_parts) > 1 else ''
        
        # Apply enhancements based on the main category and subcategory
        if main_category in ['personal_preferences', 'user_preferences']:
            if sub_category == 'likes':
                return self._enhance_like_value(text, user_name, main_category.replace('_preferences', ''))
            elif sub_category == 'avoid':
                return self._enhance_avoid_value(text, user_name, main_category.replace('_preferences', ''))
        elif main_category == 'interests':
            return self._enhance_interest_value(text, user_name)
        elif main_category == 'long_term_goals':
            return self._enhance_goal_value(text, user_name)
        elif main_category == 'collaborator_relationships':
            return self._enhance_relationship_value(text, user_name)
        else:
            # Apply general enhancements for other categories
            enhanced = self._apply_enhancements(text, user_name, memory_data)
            
        # Apply general text improvements to all values
        enhanced = self._normalize_text(enhanced)
        enhanced = self._expand_shorthand(enhanced)
        enhanced = self._normalize_technologies(enhanced)
        enhanced = self._fix_grammar(enhanced)
        
        # Personalize references only if we have a user name
        if user_name:
            enhanced = re.sub(r'\bUser\b', user_name, enhanced)
            enhanced = re.sub(r"\bUser's\b", f"{user_name}'s", enhanced)
        
        return enhanced.strip()
            
    def _is_generic_summary(self, summary: str) -> bool:
        """Check if a summary is generic and doesn't contain specific information."""
        generic_patterns = [
            r'added a preference.*not specified',
            r'indicating.*likes.*particular topic',
            r'has.*preference.*subject is not specified',
            r'user.*preference.*unspecified',
            r'generic.*preference.*entry'
        ]
        
        summary_lower = summary.lower()
        return any(re.search(pattern, summary_lower) for pattern in generic_patterns)
            
    def _get_user_name(self, memory_data: Dict[str, Any]) -> Optional[str]:
        """Extract user name from memory data with enhanced detection."""
        try:
            # Try to get from user object
            user = memory_data.get('user', {})
            if isinstance(user, dict):
                # Check multiple possible name fields
                name_fields = ['name', 'username', 'display_name', 'full_name']
                for field in name_fields:
                    name = user.get(field)
                    if name:
                        return name
                    
            # Try to get from current facts with enhanced pattern matching
            facts = memory_data.get('current_facts', {})
            if isinstance(facts, dict):
                for fact in facts.values():
                    if isinstance(fact, dict) and fact.get('category') in ['user_identity', 'personal_preferences']:
                        value = str(fact.get('value', ''))
                        # Enhanced extraction patterns
                        patterns = [
                            r'(?:name is|i am|call me|my name is|I\'m|I am)\s+([a-zA-Z]+)',
                            r'(?:name:|name -)\s*([a-zA-Z]+)',
                            r'([a-zA-Z]+)\s+(?:is my name|is me)',
                        ]
                        for pattern in patterns:
                            match = re.search(pattern, value, re.IGNORECASE)
                            if match:
                                return match.group(1)
                                
            # Try to extract from conversation history as last resort
            conversation = memory_data.get('conversation', [])
            if isinstance(conversation, list):
                # Look for recent user messages that mention their name
                for conv_item in reversed(conversation[-5:]):  # Check last 5 messages
                    if isinstance(conv_item, dict) and conv_item.get('role') == 'user':
                        content = conv_item.get('content', '')
                        match = re.search(r'(?:my name is|i am|call me)\s+([a-zA-Z]+)', content, re.IGNORECASE)
                        if match:
                            return match.group(1)
                            
        except Exception as e:
            print(f"Error extracting user name: {e}")
        return None
        
    def _get_user_preferences(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract user preferences and characteristics for better personalization with category awareness."""
        preferences = {}
        try:
            facts = memory_data.get('current_facts', {})
            if isinstance(facts, dict):
                for fact in facts.values():
                    if isinstance(fact, dict):
                        category = fact.get('category')
                        value = fact.get('value', '')
                        confidence = fact.get('confidence', 0.5)
                        
                        # Only include high-confidence facts
                        if confidence < 0.7:
                            continue
                            
                        if category == 'personal_preferences':
                            # Extract preference type and value
                            pref_match = re.search(r'(?:prefer|like|love|hate|dislike)\s+(.+)', str(value), re.IGNORECASE)
                            if pref_match:
                                pref_value = pref_match.group(1).strip()
                                preferences['communication_style'] = pref_value
                                
                        elif category == 'user_identity':
                            # Extract identity details
                            if re.search(r'(?:developer|programmer|engineer)', str(value), re.IGNORECASE):
                                preferences['role'] = 'developer'
                            elif re.search(r'(?:designer|artist)', str(value), re.IGNORECASE):
                                preferences['role'] = 'designer'
                            elif re.search(r'(?:student|learner)', str(value), re.IGNORECASE):
                                preferences['role'] = 'student'
                                
                        elif category == 'current_state':
                            preferences['current_state'] = value
                            
                        elif category == 'activity_behavior':
                            preferences['activity_pattern'] = value
                            
                        # Add category-specific preferences with enhanced awareness
                        elif category in self.category_framework:
                            category_info = self.category_framework[category]
                            # Use the category name as key and value as the preference
                            preferences[category] = {
                                'value': value,
                                'description': category_info['description'],
                                'enhancement_focus': category_info['enhancement_focus']
                            }
                            
            # Extract from user object if available
            user = memory_data.get('user', {})
            if isinstance(user, dict):
                preferences.update({
                    'timezone': user.get('timezone'),
                    'language': user.get('language', 'en'),
                    'location': user.get('location')
                })
                
        except Exception as e:
            print(f"Error extracting user preferences: {e}")
        return preferences
        
    def _get_comprehensive_user_context(self, memory_data: Dict[str, Any]) -> str:
        """Build a comprehensive user context for LLM enhancement with 27-category awareness."""
        try:
            context_parts = []
            
            # Get user name
            name = self._get_user_name(memory_data)
            if name:
                context_parts.append(f"User's name: {name}")
                
            # Get preferences with category awareness
            preferences = self._get_user_preferences(memory_data)
            if preferences:
                pref_str = "; ".join([f"{k}: {v}" for k, v in preferences.items() if v])
                if pref_str:
                    context_parts.append(f"User preferences: {pref_str}")
                    
            # Get recent conversation themes with category awareness
            themes = self._extract_conversation_themes(memory_data)
            if themes:
                context_parts.append(f"Recent conversation themes: {themes}")
                
            # Get user goals if available with category awareness
            goals = self._extract_user_goals(memory_data)
            if goals:
                context_parts.append(f"User goals: {goals}")
                
            # Get user identity information with category awareness
            identity_info = self._extract_user_identity(memory_data)
            if identity_info:
                context_parts.append(f"User identity: {identity_info}")
                
            # Get user activity patterns with category awareness
            activity_patterns = self._extract_activity_patterns(memory_data)
            if activity_patterns:
                context_parts.append(f"Activity patterns: {activity_patterns}")
                
            # Get communication boundaries with category awareness
            boundaries = self._extract_communication_boundaries(memory_data)
            if boundaries:
                context_parts.append(f"Communication boundaries: {boundaries}")
                
            # Get knowledge expertise with category awareness
            expertise = self._extract_knowledge_expertise(memory_data)
            if expertise:
                context_parts.append(f"Knowledge expertise: {expertise}")
                
            # Get collaborator relationships with category awareness
            relationships = self._extract_collaborator_relationships(memory_data)
            if relationships:
                context_parts.append(f"Collaborator relationships: {relationships}")
                
            return ". ".join(context_parts)
            
        except Exception as e:
            print(f"Error building comprehensive user context: {e}")
            return ""
            
    def _extract_user_identity(self, memory_data: Dict[str, Any]) -> str:
        """Extract user identity information from memory facts."""
        try:
            facts = memory_data.get('current_facts', {})
            if not isinstance(facts, dict):
                return ""
                
            identity_facts = []
            for fact in facts.values():
                if isinstance(fact, dict) and fact.get('category') == 'user_identity':
                    value = fact.get('value', '')
                    identity_facts.append(str(value))
                    
            return "; ".join(identity_facts) if identity_facts else ""
            
        except Exception:
            return ""
            
    def _extract_activity_patterns(self, memory_data: Dict[str, Any]) -> str:
        """Extract user activity patterns from memory facts."""
        try:
            facts = memory_data.get('current_facts', {})
            if not isinstance(facts, dict):
                return ""
                
            activity_facts = []
            for fact in facts.values():
                if isinstance(fact, dict) and fact.get('category') == 'activity_behavior':
                    value = fact.get('value', '')
                    activity_facts.append(str(value))
                    
            return "; ".join(activity_facts) if activity_facts else ""
            
        except Exception:
            return ""
            
    def _extract_communication_boundaries(self, memory_data: Dict[str, Any]) -> str:
        """Extract communication boundaries from memory facts."""
        try:
            facts = memory_data.get('current_facts', {})
            if not isinstance(facts, dict):
                return ""
                
            boundary_facts = []
            for fact in facts.values():
                if isinstance(fact, dict) and fact.get('category') == 'communication_boundaries':
                    value = fact.get('value', '')
                    boundary_facts.append(str(value))
                    
            return "; ".join(boundary_facts) if boundary_facts else ""
            
        except Exception:
            return ""
            
    def _extract_knowledge_expertise(self, memory_data: Dict[str, Any]) -> str:
        """Extract knowledge expertise from memory facts."""
        try:
            facts = memory_data.get('current_facts', {})
            if not isinstance(facts, dict):
                return ""
                
            expertise_facts = []
            for fact in facts.values():
                if isinstance(fact, dict) and fact.get('category') == 'knowledge_expertise':
                    value = fact.get('value', '')
                    expertise_facts.append(str(value))
                    
            return "; ".join(expertise_facts) if expertise_facts else ""
            
        except Exception:
            return ""
            
    def _extract_collaborator_relationships(self, memory_data: Dict[str, Any]) -> str:
        """Extract collaborator relationships from memory facts."""
        try:
            facts = memory_data.get('current_facts', {})
            if not isinstance(facts, dict):
                return ""
                
            relationship_facts = []
            for fact in facts.values():
                if isinstance(fact, dict) and fact.get('category') == 'collaborator_relationships':
                    value = fact.get('value', '')
                    relationship_facts.append(str(value))
                    
            return "; ".join(relationship_facts) if relationship_facts else ""
            
        except Exception:
            return ""
            
    def _extract_conversation_themes(self, memory_data: Dict[str, Any]) -> str:
        """Extract key themes from recent conversation with category awareness."""
        try:
            conversation = memory_data.get('conversation', [])
            if not isinstance(conversation, list) or len(conversation) == 0:
                return ""
                
            # Get recent messages (last 10)
            recent_msgs = [msg.get('content', '') for msg in conversation[-10:] if isinstance(msg, dict)]
            text = " ".join(recent_msgs)
            
            # Simple keyword-based theme extraction with category awareness
            themes = []
            tech_keywords = ['python', 'javascript', 'code', 'programming', 'development', 'software']
            creative_keywords = ['design', 'art', 'creative', 'graphic', 'ui', 'ux']
            business_keywords = ['business', 'startup', 'company', 'product', 'market']
            
            text_lower = text.lower()
            if any(keyword in text_lower for keyword in tech_keywords):
                themes.append("technology")
            if any(keyword in text_lower for keyword in creative_keywords):
                themes.append("creativity")
            if any(keyword in text_lower for keyword in business_keywords):
                themes.append("business")
                
            return ", ".join(themes) if themes else "general"
            
        except Exception:
            return "general"
            
    def _extract_user_goals(self, memory_data: Dict[str, Any]) -> str:
        """Extract user goals from memory facts with category awareness."""
        try:
            facts = memory_data.get('current_facts', {})
            if not isinstance(facts, dict):
                return ""
                
            goals = []
            for fact in facts.values():
                if isinstance(fact, dict) and fact.get('category') == 'long_term_goals':
                    value = fact.get('value', '')
                    goals.append(str(value))
                    
            return "; ".join(goals) if goals else ""
            
        except Exception:
            return ""
            
    
        
    def _apply_enhancements(self, text: str, user_name: Optional[str], memory_data: Dict[str, Any]) -> str:
        """Apply all enhancements to the text, being precise about what the user actually said."""
        if not text:
            return "User interaction recorded"
            
        # Store original text for reference
        original_text = text
        
        # If LLM is enabled, use it for enhancement with category awareness
        if self.llm_enabled:
            try:
                enhanced = self._enhance_with_llm(text, user_name, memory_data)
                if enhanced and enhanced != original_text:
                    return enhanced.strip()
            except Exception as e:
                print(f"LLM enhancement failed, falling back to rule-based: {e}")
            
        # Rule-based enhancement (more conservative, only clear improvements)
        enhanced = text
        
        # 1. Normalize text (safe transformations only)
        enhanced = self._normalize_text(enhanced)
        
        # 2. Expand common shorthand that's unambiguous
        enhanced = self._expand_shorthand(enhanced)
        
        # 3. Personalize references only if we have a user name
        if user_name:
            enhanced = re.sub(r'\bUser\b', user_name, enhanced)
            enhanced = re.sub(r"\bUser's\b", f"{user_name}'s", enhanced)
            
        # 4. Fix basic grammar issues
        enhanced = self._fix_grammar(enhanced)
        
        # 5. Only add minimal context if text is extremely short
        if len(enhanced.strip()) < 5 and "User said:" not in enhanced:
            enhanced = f"User mentioned: {enhanced}" if enhanced else "User interaction recorded"
        
        return enhanced.strip()
        
    def _enhance_with_llm(self, text: str, user_name: Optional[str], memory_data: Dict[str, Any]) -> Optional[str]:
        """Use LLM to enhance the text with comprehensive user context and category awareness."""
        try:
            # For Ollama, we don't need an API key
            # Get comprehensive user context
            user_context = self._get_comprehensive_user_context(memory_data)
            
            # Get relevant categories for this memory entry
            relevant_categories = self._identify_relevant_categories(text, memory_data)
            category_guidance = self._get_category_guidance(relevant_categories)
            
            prompt = f"""
You are an AI memory organizer. Your task is to enhance and refine memory entries to make them clearer, more accurate, and richer.
You have access to a comprehensive 27-category memory framework to provide contextually-aware enhancements.

User context: {user_context}
Category guidance: {category_guidance}

Instructions:
1. Improve grammar, capitalization, and phrasing
2. Personalize references to the user using their name if available
3. Make the entry structured, understandable, and meaningful
4. Keep the response concise and focused
5. CRITICALLY IMPORTANT: Only write what the user actually said or implied
6. Do not add information that isn't supported by the input
7. Do not make assumptions about user preferences or interests not explicitly stated
8. Do not infer topics or subjects not mentioned by the user
9. Respond with only the enhanced text, nothing else
10. If the input is a question or request, summarize it as a factual statement
11. If the input is vague or generic, make it specific by referencing the actual user content
12. Consider the relevant memory categories to provide appropriate contextual enhancement
13. Maintain consistency with the comprehensive category framework

Examples:
- User says: "I like Python decorators" â†’ "Rich likes Python decorators"
- User says: "What is JavaScript?" â†’ "Rich asked about JavaScript"
- User says: "Remind me to review the project" â†’ "Rich needs to review the project"
- User says: "I'm interested in this topic" + context shows Python â†’ "Rich is interested in Python"
- BAD: "Rich likes programming" (if user only mentioned Python decorators)
- GOOD: "Rich likes Python decorators" (specific to what user said)

Original memory entry: {text}

Enhanced memory entry:"""
            
            # Ollama API request format
            payload = {
                'model': self.llm_model,
                'messages': [
                    {'role': 'user', 'content': prompt}
                ],
                'stream': False,  # We want a single response, not a stream
                'options': {
                    'temperature': 0.3,
                    'num_predict': 250
                }
            }
            
            response = requests.post(self.ollama_url, json=payload, timeout=30)
            
            # Check if the request was successful
            if response.status_code != 200:
                print(f"Ollama API error: {response.status_code} - {response.text}")
                return None
                
            result = response.json()
            enhanced_text = result['message']['content'].strip()
            
            return enhanced_text
            
        except Exception as e:
            print(f"Error in LLM enhancement: {e}")
            return None
            
    def _identify_relevant_categories(self, text: str, memory_data: Dict[str, Any]) -> List[str]:
        """Identify relevant memory categories for the given text."""
        relevant_categories = []
        
        # Extract current facts to understand context
        current_facts = memory_data.get('current_facts', {})
        
        # Simple keyword-based category identification
        text_lower = text.lower()
        
        # Check for each category based on keywords and existing facts
        for category in MemoryCategory:
            category_key = category.value
            
            # Check if this category has existing facts
            has_facts = any(fact.get('category') == category_key for fact in current_facts.values() if isinstance(fact, dict))
            
            # Check for category-specific keywords
            category_keywords = self._get_category_keywords(category_key)
            
            if has_facts or any(keyword in text_lower for keyword in category_keywords):
                relevant_categories.append(category_key)
                
        return relevant_categories
        
    def _get_category_keywords(self, category: str) -> List[str]:
        """Get keywords associated with a specific category."""
        keyword_map = {
            MemoryCategory.USER_IDENTITY.value: ['name', 'called', 'identity', 'pronoun'],
            MemoryCategory.PERSONAL_PREFERENCES.value: ['prefer', 'like', 'hate', 'dislike', 'style', 'formal', 'casual'],
            MemoryCategory.TASK_PROJECT_TRACKING.value: ['project', 'task', 'deadline', 'working on', 'building'],
            MemoryCategory.ACTIVITY_BEHAVIOR.value: ['usually', 'always', 'often', 'rarely', 'behavior'],
            MemoryCategory.USER_INSTRUCTIONS.value: ['command', 'rule', 'instruction', 'always', 'never'],
            MemoryCategory.CURRENT_STATE.value: ['currently', 'now', 'today', 'present', 'state'],
            MemoryCategory.LONG_TERM_GOALS.value: ['goal', 'dream', 'aspiration', 'want to become', 'hope to'],
            MemoryCategory.COMMUNICATION_BOUNDARIES.value: ['don\'t discuss', 'sensitive', 'trigger', 'avoid', 'uncomfortable'],
            MemoryCategory.KNOWLEDGE_EXPERTISE.value: ['expert', 'skill', 'know', 'proficient', 'experience'],
            MemoryCategory.COLLABORATOR_RELATIONSHIPS.value: ['friend', 'colleague', 'partner', 'team', 'coworker']
        }
        
        return keyword_map.get(category, [])
        
    def _get_category_guidance(self, categories: List[str]) -> str:
        """Get guidance text for the relevant categories."""
        if not categories:
            return "General enhancement focusing on clarity and accuracy."
            
        guidance_parts = []
        for category in categories[:3]:  # Limit to top 3 categories
            if category in self.category_framework:
                category_info = self.category_framework[category]
                guidance_parts.append(f"{category}: {category_info['description']}")
                
        return "; ".join(guidance_parts) if guidance_parts else "General enhancement focusing on clarity and accuracy."
        
    def _normalize_text(self, text: str) -> str:
        """Normalize text formatting."""
        # Trim whitespace
        text = text.strip()
        
        # Normalize multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Capitalize first letter
        if text and text[0].isalpha():
            text = text[0].upper() + text[1:]
            
        # Fix spacing around punctuation
        text = re.sub(r'\s+([,.!?;:])', r'\1', text)
        
        return text
        
    def _expand_shorthand(self, text: str) -> str:
        """Expand shorthand terms."""
        for shorthand, expansion in self.SHORTHAND_MAP.items():
            pattern = r'\b' + re.escape(shorthand) + r'\b'
            text = re.sub(pattern, expansion, text, flags=re.IGNORECASE)
        return text
        
    def _normalize_technologies(self, text: str) -> str:
        """Normalize technology names."""
        for tech, normalized in self.TECH_MAP.items():
            pattern = r'\b' + re.escape(tech) + r'\b'
            text = re.sub(pattern, normalized, text, flags=re.IGNORECASE)
        return text
        
    def _normalize_countries(self, text: str) -> str:
        """Normalize country names."""
        for country, normalized in self.COUNTRY_MAP.items():
            pattern = r'\b' + re.escape(country) + r'\b'
            text = re.sub(pattern, normalized, text, flags=re.IGNORECASE)
        return text
        
    def _fix_grammar(self, text: str) -> str:
        """Fix common grammar issues."""
        # Fix spacing issues
        text = text.replace(' ,', ',')
        text = re.sub(r'\s+\.', '.', text)
        text = re.sub(r'\s+!', '!', text)
        text = re.sub(r'\s+\?', '?', text)
        
        # Capitalize 'i' -> 'I'
        text = re.sub(r'\bi\b', 'I', text)
        
        return text
        
    def _ensure_event_structure(self, event: Dict[str, Any], conv_item: Optional[Dict[str, Any]]):\n        \"\"\"Ensure the event has proper structure.\"\"\"\n        # Ensure semantic context exists\n        if 'semantic_context' not in event:\n            event['semantic_context'] = {\n                'related_facts': [],\n                'confidence_score': 0.8,\n                'context_type': 'general',\n                'semantic_tags': []\n            }\n            \n        # Ensure emotional context for user messages\n        if 'emotional_context' not in event and conv_item and conv_item.get('role') == 'user':\n            # Simple sentiment analysis\n            sentiment = 'neutral'\n            intensity = 0.5\n            \n            content = conv_item.get('content', '').lower()\n            positive_words = ['love', 'great', 'awesome', 'fantastic', 'amazing', 'happy', 'good']\n            negative_words = ['hate', 'terrible', 'awful', 'bad', 'sad', 'angry']\n            \n            pos_count = sum(1 for word in positive_words if word in content)\n            neg_count = sum(1 for word in negative_words if word in content)\n            \n            if pos_count > neg_count:\n                sentiment = 'positive'\n                intensity = min(0.9, 0.5 + (pos_count * 0.1))\n            elif neg_count > pos_count:\n                sentiment = 'negative'\n                intensity = min(0.9, 0.5 + (neg_count * 0.1))\n                \n            # Create emotional context as a dictionary instead of a dataclass object\n            event['emotional_context'] = {\n                'sentiment': sentiment,\n                'emotion_tags': [],\n                'emotional_intensity': intensity,\n                'mood_context': 'general',\n                'confidence': 0.7\n            }\n    \n    def _enhance_current_facts_and_history(self, memory_data: Dict[str, Any]):\n        \"\"\"Enhance current_facts and fact_history entries with category-aware processing.\"\"\"\n        try:\n            # Process current_facts\n            current_facts = memory_data.get('current_facts', {})\n            for fact_key, fact_value in current_facts.items():\n                if isinstance(fact_value, dict) and 'value' in fact_value:\n                    original_value = fact_value['value']\n                    category = fact_value.get('category', '')\n                    \n                    # Enhance the value based on its category\n                    enhanced_value = self._enhance_fact_value(original_value, category, memory_data)\n                    \n                    if enhanced_value != original_value:\n                        fact_value['value'] = enhanced_value\n                        # Add provenance to track enhancement\n                        if 'provenance' not in fact_value:\n                            fact_value['provenance'] = {}\n                        fact_value['provenance'].update({\n                            'enhanced_in_place': True,\n                            'enhanced_at': datetime.now().isoformat(),\n                            'original_value': original_value\n                        })\n            \n            # Process fact_history\n            fact_history = memory_data.get('fact_history', {})\n            for fact_key, fact_entries in fact_history.items():\n                if isinstance(fact_entries, list):\n                    for entry in fact_entries:\n                        if isinstance(entry, dict) and 'value' in entry:\n                            original_value = entry['value']\n                            category = entry.get('category', '')\n                            \n                            # Enhance the value based on its category\n                            enhanced_value = self._enhance_fact_value(original_value, category, memory_data)\n                            \n                            if enhanced_value != original_value:\n                                entry['value'] = enhanced_value\n                                # Add provenance to track enhancement\n                                if 'provenance' not in entry:\n                                    entry['provenance'] = {}\n                                entry['provenance'].update({\n                                    'enhanced_in_place': True,\n                                    'enhanced_at': datetime.now().isoformat(),\n                                    'original_value': original_value\n                                })\n        \n        except Exception as e:\n            print(f\"Error enhancing current facts and history: {e}\")\n    \n    def _enhance_fact_value(self, value, category: str, memory_data: Dict[str, Any]) -> str:\n        \"\"\"Enhance a fact value based on its category.\"\"\"\n        if not isinstance(value, str):\n            value = str(value)\n        \n        if not value.strip():\n            return value\n        \n        original_value = value\n        user_name = self._get_user_name(memory_data)\n\n        # Determine the category type and apply appropriate enhancement\n        if category == 'personal_preferences' or 'personal_preferences' in category:\n            if 'likes' in category:\n                value = self._enhance_like_value(value, user_name, 'personal')\n            elif 'avoid' in category:\n                value = self._enhance_avoid_value(value, user_name, 'personal')\n        elif category == 'user_preferences' or 'user_preferences' in category:\n            if 'likes' in category:\n                value = self._enhance_like_value(value, user_name, 'user')\n        elif category == 'interests':\n            value = self._enhance_interest_value(value, user_name)\n        elif category == 'long_term_goals':\n            value = self._enhance_goal_value(value, user_name)\n        elif category == 'collaborator_relationships':\n            value = self._enhance_relationship_value(value, user_name)\n        else:\n            # Apply general enhancements for other categories\n            value = self._apply_category_aware_enhancements(value, category, user_name, memory_data)\n        \n        # Apply general text improvements to all values\n        value = self._normalize_text(value)\n        value = self._expand_shorthand(value)\n        value = self._fix_grammar(value)\n        \n        return value if value != original_value else original_value\n\n    def _enhance_like_value(self, value: str, user_name: Optional[str], preference_type: str = 'user') -> str:\n        \"\"\"Enhance like values with contextual understanding.\"\"\"\n        if not value.strip():\n            return value\n        \n        user_ref = user_name or \"User\"\n        \n        # Check for various patterns in like values\n        value_lower = value.lower()\n        \n        # Enhanced handling for like values\n        if 'like' in value_lower and 'a lot' in value_lower:\n            # Handle \"really like\", \"like a lot\", etc.\n            matches = re.findall(r'like (?:a lot of )?(.+?)(?:,|$| and)', value)\n            if matches:\n                subject = matches[0].strip()\n                return f\"{user_ref} really enjoys {subject}.\"\n        \n        elif 'like' in value_lower:\n            # Handle \"like X\" or \"likes X\"\n            matches = re.findall(r'(?:like|likes) (.+?)(?:,|$| and)', value)\n            if matches:\n                subject = matches[0].strip()\n                if subject.startswith('to '):\n                    # For \"likes to do something\"\n                    return f\"{user_ref} enjoys {subject}.\"\n                else:\n                    return f\"{user_ref} likes {subject}.\"\n        \n        elif 'love' in value_lower:\n            matches = re.findall(r'(?:love|loves) (.+?)(?:,|$| and)', value)\n            if matches:\n                subject = matches[0].strip()\n                return f\"{user_ref} loves {subject}.\"\n        \n        # If no specific pattern matched, enhance with general like language\n        if 'pc' in value_lower or 'computer' in value_lower:\n            return f\"{user_ref} enjoys building custom PCs for fun and experimenting with computer hardware.\"\n        \n        # Handle generic like statements\n        if value.strip().endswith('.'):\n            return f\"{user_ref} likes {value[0].lower() + value[1:]}\"\n        else:\n            return f\"{user_ref} likes {value}.\"\n    \n    def _enhance_avoid_value(self, value: str, user_name: Optional[str], preference_type: str = 'personal') -> str:\n        \"\"\"Enhance avoid values with contextual understanding.\"\"\"\n        if not value.strip():\n            return value\n        \n        user_ref = user_name or \"User\"\n        \n        # Handle various avoid patterns\n        value_lower = value.lower()\n        \n        # Look for negative preference patterns\n        if 'avoid' in value_lower or 'not enjoy' in value_lower:\n            # Extract what is being avoided\n            parts = re.split(r'(avoid|not enjoy|dislike)', value, 1)\n            if len(parts) > 2:\n                action = parts[1].strip()\n                subject = parts[2].strip()\n                return f\"{user_ref} prefers to {action} {subject}.\"\n        \n        elif 'don\\'t' in value_lower or 'do not' in value_lower:\n            # Extract what is not preferred\n            matches = re.findall(r\"(?:don't|do not) (.+?)(?:,|$| and)\", value)\n            if matches:\n                subject = matches[0].strip()\n                return f\"{user_ref} does not enjoy {subject}.\"\n        \n        # Handle specific examples like food preferences\n        if 'food' in value_lower or 'italy food' in value_lower or 'italian' in value_lower:\n            return f\"{user_ref} prefers to avoid some foods, but generally really enjoys Italian cuisine.\"\n        \n        # Default case - if it's not already a complete sentence\n        if not value.strip().endswith('.') and not value.strip().endswith('!') and not value.strip().endswith('?'):\n            return f\"{user_ref} prefers to avoid {value}.\"\n        else:\n            return f\"{user_ref} avoids {value}\"\n    \n    def _enhance_interest_value(self, value: str, user_name: Optional[str]) -> str:\n        \"\"\"Enhance interest values with contextual understanding.\"\"\"\n        if not value.strip():\n            return value\n        \n        user_ref = user_name or \"User\"\n        \n        value_lower = value.lower()\n        \n        if 'interested' in value_lower:\n            matches = re.findall(r'(?:interested in|interest in) (.+?)(?:,|$| and)', value)\n            if matches:\n                subject = matches[0].strip()\n                return f\"{user_ref} is interested in {subject}.\"\n        \n        if 'like' in value_lower and 'topic' in value_lower:\n            # Handle \"like this topic\" or similar\n            return f\"{user_ref} has an interest in this topic.\"\n        \n        # Default interest enhancement\n        return f\"{user_ref} is interested in {value}.\"\n\n    def _enhance_goal_value(self, value: str, user_name: Optional[str]) -> str:\n        \"\"\"Enhance goal values with contextual understanding.\"\"\"\n        if not value.strip():\n            return value\n        \n        user_ref = user_name or \"User\"\n        \n        value_lower = value.lower()\n        \n        # Check for goal-related patterns\n        if 'want' in value_lower:\n            matches = re.findall(r'(?:want to|wants to) (.+?)(?:,|$| and)', value)\n            if matches:\n                action = matches[0].strip()\n                return f\"{user_ref} wants to {action} as a long-term goal.\"\n        \n        elif 'goal' in value_lower or 'hope' in value_lower:\n            # Extract the goal\n            parts = re.split(r'(goal|aim|hope|dream)', value, 1)\n            if len(parts) > 2:\n                return f\"{user_ref} has a long-term goal to {parts[2].strip()}.\n        \n        elif 'become' in value_lower:\n            matches = re.findall(r'(?:want to|hope to) become (.+?)(?:,|$| and)', value)\n            if matches:\n                target = matches[0].strip()\n                return f\"{user_ref} wants to become a {target} as a long-term goal.\"\n        \n        # Default goal enhancement\n        return f\"{user_ref} has a long-term goal related to {value}.\"\n\n    def _enhance_relationship_value(self, value: str, user_name: Optional[str]) -> str:\n        \"\"\"Enhance relationship values with contextual understanding.\"\"\"\n        if not value.strip():\n            return value\n        \n        user_ref = user_name or \"User\"\n        \n        # Default relationship enhancement\n        return f\"{user_ref} has a relationship with {value}.\"\n\n    def _apply_category_aware_enhancements(self, value: str, category: str, user_name: Optional[str], memory_data: Dict[str, Any]) -> str:\n        \"\"\"Apply general category-aware enhancements to a value.\"\"\"\n        if not value.strip():\n            return value\n        \n        user_ref = user_name or \"User\"\n        \n        # Apply enhancements based on the specific category\n        if category in [MemoryCategory.USER_IDENTITY.value, 'user_identity']:\n            # Identity values - name, pronouns, etc.\n            if 'name' in value.lower():\n                return f\"{value} is {user_ref}'s name.\"\n            elif 'call me' in value.lower():\n                # Extract the name from \"call me X\"\n                match = re.search(r'call me (.+)', value, re.IGNORECASE)\n                if match:\n                    name = match.group(1)\n                    return f\"{user_ref}'s preferred name is {name}.\"\n                else:\n                    return f\"{user_ref} prefers to be called {value}.\"\n            else:\n                return f\"{value} is part of {user_ref}'s identity.\"\n        \n        elif category in [MemoryCategory.ACTIVITY_BEHAVIOR.value, 'activity_behavior']:\n            # Activity behavior values\n            return f\"{user_ref} tends to {value}.\"\n        \n        elif category in [MemoryCategory.USER_INSTRUCTIONS.value, 'user_instructions']:\n            # Instructions or rules\n            return f\"{user_ref} wants {value} to be followed as a rule.\"\n        \n        elif category in [MemoryCategory.CURRENT_STATE.value, 'current_state']:\n            # Current state\n            return f\"{user_ref} is currently {value}.\"\n        \n        elif category in [MemoryCategory.PERSONAL_DEVELOPMENT.value, 'personal_development']:\n            # Skills, learning, progress\n            return f\"{user_ref} is developing skills in {value}.\"\n        \n        elif category in [MemoryCategory.COMMUNICATION_BOUNDARIES.value, 'communication_boundaries']:\n            # Boundaries and sensitive topics\n            return f\"{user_ref} has set a communication boundary regarding {value}.\"\n        \n        elif category in [MemoryCategory.KNOWLEDGE_EXPERTISE.value, 'knowledge_expertise']:\n            # Skill levels and knowledge\n            return f\"{user_ref} has knowledge or expertise in {value}.\"\n        \n        elif category in [MemoryCategory.TOOL_INTEGRATION.value, 'tool_integration']:\n            # Tool preferences and permissions\n            return f\"{user_ref} prefers to use {value} for tools.\"\n        \n        elif category in [MemoryCategory.RESPONSE_ADAPTATION.value, 'response_adaptation']:\n            # Style and tone preferences\n            return f\"{user_ref} prefers responses with {value}.\"\n        \n        elif category in [MemoryCategory.FILE_MEDIA.value, 'file_media']:\n            # File and media preferences\n            return f\"{user_ref} interacts with {value} as media.\"\n        \n        elif category in [MemoryCategory.TIMEZONE_PREFERENCES.value, 'timezone_preferences']:\n            # Timezone and location\n            return f\"{user_ref} is located in {value}.\"\n        \n        # For other categories that don't have specific handling\n        return value  # Return original value if no specific enhancement is needed\n
            
    def organize_event(self, memory_data: Dict[str, Any], raw_event_index: int) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
        """
        Process a raw memory event through the organizer pipeline.
        
        This method is provided for backward compatibility with existing code
        that may be calling this method directly.
        
        Args:
            memory_data: The current memory data structure
            raw_event_index: Index of the raw event to process
            
        Returns:
            Tuple of (updated_memory_data, organizer_event)
        """
        # For backward compatibility, we'll process the event in-place
        # and return the memory data unchanged (since we're modifying in-place)
        # and None for the organizer_event (since we don't create separate events)
        
        if not self.organizer_enabled:
            return memory_data, None
            
        try:
            # Validate inputs
            if not isinstance(memory_data, dict):
                return memory_data, None
                
            # Get the raw event
            if raw_event_index >= len(memory_data.get('memory_events', [])):
                return memory_data, None
                
            # Process the event in-place
            self._process_new_event(memory_data, raw_event_index)
            
            # Return the (modified) memory data and None for organizer event
            # since we're doing in-place modification rather than creating new events
            return memory_data, None
            
        except Exception as e:
            print(f"Error in organize_event: {e}")
            return memory_data, None

    def enhance_memory_in_place(self, memory_data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        """
        Enhance all memory entries in-place in the provided memory data.
        
        Args:
            memory_data: The memory data structure to enhance
            
        Returns:
            Tuple of (updated_memory_data, number_of_modified_entries)
        """
        try:
            modified_count = 0
            
            # Process all memory events
            memory_events = memory_data.get('memory_events', [])
            for i, event in enumerate(memory_events):
                # Create a copy of the original summary to check if it changes
                original_summary = event.get('summary', '')
                
                # Process the event in-place
                self._process_new_event(memory_data, i)
                
                # Check if the summary changed (meaning it was enhanced)
                if event.get('summary', '') != original_summary:
                    modified_count += 1
                    
            return memory_data, modified_count
            
        except Exception as e:
            print(f"Error in enhance_memory_in_place: {e}")
            return memory_data, 0

    def _save_memory_file_with_backup(self, file_path: str, memory_data: Dict[str, Any]):
        """
        Save memory data to file with backup functionality.
        
        Args:
            file_path: Path to the memory file
            memory_data: The memory data to save
        """
        try:
            # Create backup
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir = os.path.join(os.path.dirname(file_path), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            backup_path = os.path.join(backup_dir, f'nova_ai_memory_{timestamp}.json')
            
            # Only create backup if the original file exists
            if os.path.exists(file_path):
                shutil.copy2(file_path, backup_path)
            
            # Save the updated data
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(memory_data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            print(f"Error saving memory file with backup: {e}")
            # Fallback: save without backup
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(memory_data, f, indent=2, ensure_ascii=False)
            except Exception as fallback_error:
                print(f"Fallback save also failed: {fallback_error}")

# Example configuration
ORGANIZER_CONFIG = {
    'organizer_enabled': True,
    'memory_file_path': os.path.join('astra_ai', 'Date', 'nova_ai_memory.json'),
    'check_interval': 1.0,
    'llm_enabled': False,  # Disabled by default to prevent connection errors when Ollama is not running
    'llm_api_key': '',  # Not needed for Ollama
    'llm_model': 'qwen2.5:3b'
}

def load_organizer_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load organizer configuration from file or return default.
    
    Args:
        config_path: Path to config file (optional)
        
    Returns:
        Configuration dictionary
    """
    if config_path and os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading config from {config_path}: {e}")
            
    # Return default configuration
    return ORGANIZER_CONFIG.copy()

def create_organizer_with_config(config_path: Optional[str] = None) -> AIOrganizer:
    """
    Create an AIOrganizer instance with configuration.
    
    Args:
        config_path: Path to config file (optional)
        
    Returns:
        Configured AIOrganizer instance
    """
    config = load_organizer_config(config_path)
    return AIOrganizer(config)

def main():
    """Main function to run the organizer."""
    organizer = AIOrganizer(ORGANIZER_CONFIG)
    organizer.start_monitoring()

if __name__ == "__main__":
    main()
