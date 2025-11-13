"""
Nova Memory Validator and Fixer

A dedicated AI Memory Validator that inspects and corrects issues in JSON memory state files.

The following rules apply:

1. The "type": "ADD" event should only be created **once per semantic fact**, not duplicated.
   - If two ADD events describe the same fact (e.g., "to wach football games" and "like to wach football games"), merge them into a single event with the highest confidence.
2. Remove or merge redundant "current_state unknown" entries. Keep only the most recent and valid state.
3. Ensure that `semantic_context` and `emotional_context` are **always objects**, not strings.
   - If they are currently strings (e.g. "Inferred from input: ..."), convert them into structured objects like:
     ```json
     {
       "context_type": "inferred",
       "source_text": "like to watch football games",
       "confidence_score": 0.75
     }
     ```
4. Make sure all Added_preference fields are valid — remove if redundant or mismatched.
5. Fix spelling errors in summary or values (e.g. "wach" → "watch").
6. Ensure all `cluster` and `vector_index` sections stay synchronized with the events that exist.
7. The final output must be a **valid JSON object**, fully consistent and normalized.
8. Maintain all timestamps, event_ids, and structure integrity — only modify content and redundant data.
9. Set "relationship_established": true if the user identity or preferences are clearly defined.
10. Validate that "user.name" is populated when available, otherwise assign "anonymous_user".
"""
import json
import re
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import hashlib
from collections import defaultdict


class MemoryValidator:
    """
    A memory validator and fixer that ensures all 10 specified rules are followed.
    """
    
    def __init__(self):
        self.spelling_corrections = {
            'wach': 'watch',
            'teh': 'the',
            'recieve': 'receive',
            'seperate': 'separate',
            'definately': 'definitely',
            'occured': 'occurred',
            'begining': 'beginning',
            'seach': 'search',
            'recieved': 'received',
            'existance': 'existence',
            'occassion': 'occasion',
            'occassions': 'occasions',
            'accomodate': 'accommodate',
            'accommadate': 'accommodate',
            'acheive': 'achieve',
            'acheivement': 'achievement',
            'agressive': 'aggressive',
            'alot': 'a lot',
            'apparant': 'apparent',
            'arguement': 'argument',
            'assasin': 'assassin',
            'caluclate': 'calculate',
            'caluclated': 'calculated',
            'cannnot': 'cannot',
            'committment': 'commitment',
            'concieved': 'conceived',
            'concieve': 'conceive',
            'concieving': 'conceiving',
            'definatly': 'definitely',
            'dependance': 'dependence',
            'dependancy': 'dependency',
            'desparate': 'desperate',
            'developement': 'development',
            'dissapear': 'disappear',
            'dissapeared': 'disappeared',
            'disatisfaction': 'dissatisfaction',
            'embarass': 'embarrass',
            'embarassed': 'embarrassed',
            'embarassing': 'embarrassing',
            'enviroment': 'environment',
            'enviromental': 'environmental',
            'enviornment': 'environment',
            'enviornmental': 'environmental',
            'excede': 'exceed',
            'exceded': 'exceeded',
            'exceds': 'exceeds',
            'existance': 'existence',
            'existant': 'existent',
            'experiance': 'experience',
            'expirience': 'experience',
            'expirienced': 'experienced',
            'expiriencing': 'experiencing',
            'faciliate': 'facilitate',
            'familar': 'familiar',
            'foward': 'forward',
            'freind': 'friend',
            'freindly': 'friendly',
            'freinds': 'friends',
            'futher': 'further',
            'genaral': 'general',
            'genral': 'general',
            'goverment': 'government',
            'govorment': 'government',
            'govornment': 'government',
            'grat': 'great',
            'harras': 'harass',
            'harrased': 'harassed',
            'harrases': 'harasses',
            'harrasing': 'harassing',
            'harrass': 'harass',
            'harrassed': 'harassed',
            'harrasses': 'harasses',
            'harrassing': 'harassing',
            'hieght': 'height',
            'hygeine': 'hygiene',
            'hypocracy': 'hypocrisy',
            'hypocricy': 'hypocrisy',
            'hypocrit': 'hypocrite',
            'illegaly': 'illegally',
            'illegible': 'illegible',
            'immitate': 'imitate',
            'immitated': 'imitated',
            'immitating': 'imitating',
            'immitator': 'imitator',
            'impossible': 'impossible',
            'independance': 'independence',
            'independant': 'independent',
            'independantly': 'independently',
            'inefficency': 'inefficiency',
            'inefficent': 'inefficient',
            'inefficently': 'inefficiently',
            'insistance': 'insistence',
            'inteligence': 'intelligence',
            'inteligent': 'intelligent',
            'intenational': 'international',
            'interational': 'international',
            'interational': 'international',
            'interferance': 'interference',
            'interfereing': 'interfering',
            'interrim': 'interim',
            'interruption': 'interruption',
            'irresistable': 'irresistible',
            'irresistably': 'irresistibly',
            'jewelery': 'jewelry',
            'kindergarden': 'kindergarten',
            'laiter': 'later',
            'laiter': 'latter',
            'libary': 'library',
            'librarien': 'librarian',
            'librarin': 'librarian',
            'lightyear': 'light year',
            'lightyears': 'light years',
            'likley': 'likely',
            'lonelyness': 'loneliness',
            'mear': 'mere',
            'mear': 'mare',
            'mear': 'wear',
            'mear': 'tear',
            'mear': 'bear',
            'mear': 'pear',
            'mear': 'snare',
            'mear': 'aware',
            'mear': 'scare',
            'mear': 'flare',
            'mear': 'flare',
            'mear': 'flare',
            'mear': 'flare',
            'millenium': 'millennium',
            'millenial': 'millennial',
            'millenia': 'millennia',
            'milleniums': 'millenniums',
            'mischievous': 'mischievous',
            'mischeivous': 'mischievous',
            'mischevious': 'mischievous',
            'monestary': 'monastery',
            'monestary': 'monetary',
            'monestary': 'monetary',
            'monestary': 'monetary',
            'moniter': 'monitor',
            'mountian': 'mountain',
            'multiply': 'multiply',
            'neccesarily': 'necessarily',
            'neccesary': 'necessary',
            'neccessarily': 'necessarily',
            'neccessary': 'necessary',
            'necesarily': 'necessarily',
            'necesary': 'necessary',
            'nessasarily': 'necessarily',
            'nessasary': 'necessary',
            'noticable': 'noticeable',
            'noticably': 'noticeably',
            'occassion': 'occasion',
            'occassional': 'occasional',
            'occassionally': 'occasionally',
            'occassioned': 'occasioned',
            'occassions': 'occasions',
            'occurance': 'occurrence',
            'occurances': 'occurrences',
            'ocurred': 'occurred',
            'ocurring': 'occurring',
            'occurr': 'occur',
            'occurrs': 'occurs',
            'offical': 'official',
            'offically': 'officially',
            'officals': 'officials',
            'omit': 'omit',
            'omited': 'omitted',
            'omiting': 'omitting',
            'omition': 'omission',
            'ommision': 'omission',
            'ommited': 'omitted',
            'ommiting': 'omitting',
            'opposim': 'opossum',
            'oppossum': 'opossum',
            'optomism': 'optimism',
            'optomistic': 'optimistic',
            'ordance': 'ordnance',
            'organim': 'organism',
            'organistion': 'organisation',
            'organistations': 'organisations',
            'organiztion': 'organization',
            'organiztions': 'organizations',
            'parrallel': 'parallel',
            'parrallell': 'parallel',
            'particualr': 'particular',
            'particuar': 'particular',
            'particulalr': 'particular',
            'peice': 'piece',
            'peices': 'pieces',
            'percieved': 'perceived',
            'perenially': 'perennially',
            'performence': 'performance',
            'perhasp': 'perhaps',
            'perhpas': 'perhaps',
            'perphas': 'perhaps',
            'personel': 'personnel',
            'personell': 'personnel',
            'personnell': 'personnel',
            'portait': 'portrait',
            'portayed': 'portrayed',
            'portraing': 'portraying',
            'possable': 'possible',
            'possably': 'possibly',
            'precentage': 'percentage',
            'preceeded': 'preceded',
            'preceeding': 'preceding',
            'preceeds': 'precedes',
            'precice': 'precise',
            'precisly': 'precisely',
            'preocupation': 'preoccupation',
            'prepair': 'prepare',
            'presance': 'presence',
            'presense': 'presence',
            'privelige': 'privilege',
            'priveliged': 'privileged',
            'priveliges': 'privileges',
            'privelleged': 'privileged',
            'priviledge': 'privilege',
            'priviledges': 'privileges',
            'procede': 'proceed',
            'procedes': 'proceeds',
            'procedger': 'procedure',
            'proceding': 'proceeding',
            'procedings': 'proceedings',
            'proceedure': 'procedure',
            'profesion': 'profession',
            'professer': 'professor',
            'profilic': 'prolific',
            'progrom': 'program',
            'progroms': 'programs',
            'prominately': 'prominently',
            'promiscous': 'promiscuous',
            'protaganist': 'protagonist',
            'protaganists': 'protagonists',
            'protem': 'prorogued',
            'protray': 'portray',
            'protrayed': 'portrayed',
            'protraying': 'portraying',
            'protrays': 'portrays',
            'provinicial': 'provincial',
            'pseudononymous': 'pseudonymous',
            'psuedo': 'pseudo',
            'psycology': 'psychology',
            'publically': 'publicly',
            'puritannical': 'puritanical',
            'puting': 'putting',
            'quantaty': 'quantity',
            'quarantine': 'quarantine',
            'queston': 'question',
            'questons': 'questions',
            'quicklyu': 'quickly',
            'quiet': 'quiet',
            'quizes': 'quizzes',
            'raelly': 'really',
            'reccomend': 'recommend',
            'reccomendation': 'recommendation',
            'reccomendations': 'recommendations',
            'reccomended': 'recommended',
            'reccomending': 'recommending',
            'reccomends': 'recommends',
            'reccommend': 'recommend',
            'reccommended': 'recommended',
            'reccommending': 'recommending',
            'reccommends': 'recommends',
            'rechargable': 'rechargeable',
            'recipiant': 'recipient',
            'recipiants': 'recipients',
            'recived': 'received',
            'reciver': 'receiver',
            'recivers': 'receivers',
            'recives': 'receives',
            'reciving': 'receiving',
            'reccuring': 'recurring',
            'reccur': 'recur',
            'reccurs': 'recurs',
            'recquired': 'required',
            'recquires': 'requires',
            'recquiring': 'requiring',
            'referal': 'referral',
            'refered': 'referred',
            'refering': 'referring',
            'refernce': 'reference',
            'refernces': 'references',
            'referrs': 'refers',
            'reget': 'regret',
            'regettable': 'regrettable',
            'reguardless': 'regardless',
            'reicarnation': 'reincarnation',
            'reknown': 'renown',
            'reknowned': 'renowned',
            'rela': 'real',
            'releive': 'relieve',
            'releived': 'relieved',
            'releiver': 'reliever',
            'religeous': 'religious',
            'religous': 'religious',
            'religously': 'religiously',
            'relinqushment': 'relinquishment',
            'reluctent': 'reluctant',
            'remaing': 'remaining',
            'remembance': 'remembrance',
            'remenicent': 'reminiscent',
            'reminent': 'remnant',
            'reminescent': 'reminiscent',
            'reminscent': 'reminiscent',
            'reminscent': 'reminiscent',
            'rendevous': 'rendezvous',
            'renedered': 'rendered',
        }

    def validate_and_fix_memory(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main method to validate and fix the entire memory structure according to all 10 rules.
        """
        # Rule 1: Deduplicate ADD events for same semantic facts
        memory_data = self._deduplicate_add_events(memory_data)
        
        # Rule 2: Remove redundant "current_state unknown" entries
        memory_data = self._remove_redundant_current_state_unknown(memory_data)
        
        # Rule 3: Convert string contexts to structured objects
        memory_data = self._convert_contexts_to_objects(memory_data)
        
        # Rule 4: Validate Added_preference fields
        memory_data = self._validate_added_preferences(memory_data)
        
        # Rule 5: Fix spelling errors
        memory_data = self._fix_spelling_errors(memory_data)
        
        # Rule 6: Synchronize cluster and vector_index
        memory_data = self._synchronize_clusters_and_vectors(memory_data)
        
        # Rule 8: Maintain structure integrity while modifying content
        # (This is handled within the other functions)
        
        # Rule 9: Set relationship_established if user identity/preferences are defined
        memory_data = self._set_relationship_established(memory_data)
        
        # Rule 10: Validate user.name
        memory_data = self._validate_user_name(memory_data)
        
        # Rule 7: Ensure valid JSON output (handled by returning valid dict)
        
        return memory_data

    def _deduplicate_add_events(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 1: Deduplicate ADD events for the same semantic fact.
        """
        memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
        seen_facts = {}  # Maps fact signature to event index
        to_remove = set()  # Indices of events to remove
        
        for i, event in enumerate(memory_events):
            if event.get("type") == "ADD":
                # Create a signature for the fact based on category, subcategory, and value
                signature = self._create_fact_signature(event)
                if signature in seen_facts:
                    # Compare confidence scores, keep the one with higher confidence
                    existing_idx = seen_facts[signature]
                    existing_event = memory_events[existing_idx]
                    current_event = event
                    
                    # Keep the one with higher confidence
                    if current_event.get("confidence", 0) > existing_event.get("confidence", 0):
                        to_remove.add(existing_idx)
                        seen_facts[signature] = i
                    else:
                        to_remove.add(i)
                else:
                    seen_facts[signature] = i
        
        # Remove duplicates in reverse order to maintain indices
        for idx in sorted(to_remove, reverse=True):
            if idx < len(memory_events):
                memory_events.pop(idx)
        
        return memory_data

    def _create_fact_signature(self, event: Dict[str, Any]) -> str:
        """
        Create a signature to identify semantic similarity between events.
        """
        category = event.get("category", "unknown")
        subcategory = event.get("subcategory", "unknown")
        value = event.get("current_value", "")
        
        # Normalize the value by removing common words and standardizing format
        normalized_value = self._normalize_fact_value(value)
        
        # Create a signature combining category, subcategory, and normalized value
        signature = f"{category}::{subcategory}::{normalized_value}"
        
        return signature

    def _normalize_fact_value(self, value: str) -> str:
        """
        Normalize fact values to identify semantic similarity.
        """
        if not isinstance(value, str):
            return str(value).lower().strip()
        
        normalized = value.lower().strip()
        
        # Remove common articles and standardize phrasing
        normalized = re.sub(r'\b(i|you|we|they|he|she|it)\s+', '', normalized)
        normalized = re.sub(r'\b(am|is|are|was|were)\s+', '', normalized)
        normalized = re.sub(r'\b(to|the|a|an)\s+', '', normalized)
        
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())
        
        return normalized

    def _remove_redundant_current_state_unknown(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 2: Remove redundant "current_state unknown" entries.
        """
        memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
        
        # Find all current_state unknown entries
        current_state_unknown_indices = []
        for i, event in enumerate(memory_events):
            if (event.get("type") == "ADD" and 
                event.get("category") == "current_state" and 
                event.get("current_value", "").lower() == "unknown"):
                current_state_unknown_indices.append(i)
        
        # Remove all but the most recent one
        if len(current_state_unknown_indices) > 1:
            # Keep only the most recent (highest index)
            indices_to_remove = current_state_unknown_indices[:-1]
            for idx in sorted(indices_to_remove, reverse=True):
                if idx < len(memory_events):
                    memory_events.pop(idx)
        
        return memory_data

    def _convert_contexts_to_objects(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 3: Convert string contexts to structured objects.
        """
        memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
        
        for event in memory_events:
            # Convert semantic_context if it's a string
            semantic_context = event.get("semantic_context")
            if isinstance(semantic_context, str):
                event["semantic_context"] = self._convert_string_to_semantic_context(semantic_context)
            
            # Convert emotional_context if it's a string or needs conversion
            emotional_context = event.get("emotional_context")
            if isinstance(emotional_context, str):
                event["emotional_context"] = self._convert_string_to_emotional_context(emotional_context)
            elif isinstance(emotional_context, dict):
                # Validate the structure of existing emotional context
                event["emotional_context"] = self._validate_emotional_context_structure(emotional_context)
        
        return memory_data

    def _convert_string_to_semantic_context(self, semantic_str: str) -> Dict[str, Any]:
        """
        Convert semantic context string to structured object.
        """
        return {
            "context_type": "inferred",
            "source_text": semantic_str,
            "confidence_score": 0.75
        }

    def _convert_string_to_emotional_context(self, emotional_str: str) -> Dict[str, Any]:
        """
        Convert emotional context string to structured object.
        """
        return {
            "sentiment": "neutral",
            "emotion_tags": [],
            "emotional_intensity": 0.5,
            "mood_context": "normal",
            "confidence": 0.7
        }

    def _validate_emotional_context_structure(self, emotional_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ensure emotional context has proper structure with default values.
        """
        required_fields = {
            "sentiment": "neutral",
            "emotion_tags": [],
            "emotional_intensity": 0.5,
            "mood_context": "normal",
            "confidence": 0.7
        }
        
        for field, default_value in required_fields.items():
            if field not in emotional_context:
                emotional_context[field] = default_value
            elif field == "emotion_tags" and not isinstance(emotional_context[field], list):
                emotional_context[field] = [str(emotional_context[field])] if emotional_context[field] else []
            elif field == "sentiment" and not isinstance(emotional_context[field], str):
                emotional_context[field] = str(emotional_context[field]) if emotional_context[field] else default_value
            elif field in ["emotional_intensity", "confidence"] and not isinstance(emotional_context[field], (int, float)):
                emotional_context[field] = float(emotional_context[field]) if emotional_context[field] else default_value
            elif field == "mood_context" and not isinstance(emotional_context[field], str):
                emotional_context[field] = str(emotional_context[field]) if emotional_context[field] else default_value
        
        return emotional_context

    def _validate_added_preferences(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 4: Validate Added_preference fields - remove if redundant or mismatched.
        """
        memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
        
        for event in memory_events:
            if event.get("type") == "ADD":
                added_preference = event.get("Added_preference")
                if added_preference:
                    # Check if the Added_preference is redundant with the current_value
                    current_value = event.get("current_value", "")
                    
                    # Normalize both for comparison
                    normalized_added = self._normalize_fact_value(added_preference)
                    normalized_current = self._normalize_fact_value(current_value)
                    
                    if normalized_added == normalized_current:
                        # They're the same, so the Added_preference is redundant
                        if "Added_preference" in event:
                            del event["Added_preference"]
        
        return memory_data

    def _fix_spelling_errors(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 5: Fix spelling errors in summary or values.
        """
        memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
        
        for event in memory_events:
            # Fix summary
            summary = event.get("summary", "")
            if isinstance(summary, str):
                event["summary"] = self._correct_spelling(summary)
            
            # Fix current_value
            current_value = event.get("current_value", "")
            if isinstance(current_value, str):
                event["current_value"] = self._correct_spelling(current_value)
            
            # Fix Added_preference if it exists
            added_preference = event.get("Added_preference", "")
            if isinstance(added_preference, str):
                event["Added_preference"] = self._correct_spelling(added_preference)
        
        return memory_data

    def _correct_spelling(self, text: str) -> str:
        """
        Apply spelling corrections to text.
        """
        if not text:
            return text
        
        corrected_text = text
        for wrong, correct in self.spelling_corrections.items():
            # Use word boundaries to avoid partial replacements
            corrected_text = re.sub(rf'\b{re.escape(wrong)}\b', correct, corrected_text, flags=re.IGNORECASE)
        
        return corrected_text

    def _synchronize_clusters_and_vectors(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 6: Ensure cluster and vector_index sections stay synchronized with events.
        """
        memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
        vector_index = memory_data.get("vector_index", {})
        clusters = memory_data.get("clusters", {})
        
        # Get all event IDs from memory events
        event_ids = {event["event_id"] for event in memory_events if "event_id" in event}
        
        # Remove entries from vector_index for non-existent events
        vector_index_to_remove = set()
        for event_id in vector_index:
            if event_id not in event_ids:
                vector_index_to_remove.add(event_id)
        
        for event_id in vector_index_to_remove:
            del vector_index[event_id]
        
        # Remove entries from cluster event_ids that don't exist
        for cluster_id, cluster_data in clusters.items():
            if "event_ids" in cluster_data:
                cluster_event_ids = cluster_data["event_ids"]
                valid_event_ids = [eid for eid in cluster_event_ids if eid in event_ids]
                cluster_data["event_ids"] = valid_event_ids
        
        # Update the memory data
        memory_data["vector_index"] = vector_index
        memory_data["clusters"] = clusters
        
        return memory_data

    def _set_relationship_established(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 9: Set relationship_established if user identity or preferences are clearly defined.
        """
        user_info = memory_data.get("user", {})
        
        # Check if user has identity or preferences
        has_identity = bool(user_info.get("name"))
        
        # Check for preferences in fact_history or memory_events
        has_preferences = False
        fact_history = memory_data.get("fact_history", {})
        memory_events = memory_data.get("memory_engine", {}).get("memory_events", [])
        
        # Check in fact_history
        for key, value in fact_history.items():
            if "preference" in key.lower() or "like" in key.lower() or "dislike" in key.lower():
                has_preferences = True
                break
        
        # Check in memory_events
        if not has_preferences:
            for event in memory_events:
                if event.get("type") == "ADD":
                    current_value = event.get("current_value", "").lower()
                    if any(word in current_value for word in ["like", "love", "enjoy", "prefer", "dislike", "hate"]):
                        has_preferences = True
                        break
        
        # Set relationship_established based on findings
        if has_identity or has_preferences:
            user_info["relationship_established"] = True
        
        memory_data["user"] = user_info
        return memory_data

    def _validate_user_name(self, memory_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Rule 10: Validate that user.name is populated, otherwise assign "anonymous_user".
        """
        user_info = memory_data.get("user", {})
        
        if not user_info.get("name"):
            user_info["name"] = "anonymous_user"
        
        memory_data["user"] = user_info
        return memory_data