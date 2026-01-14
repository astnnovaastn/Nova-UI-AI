#!/usr/bin/env python3
"""
Script to fix the memory system logic in mem0_memory_system.py
"""

import re

def fix_memory_system_logic():
    # Read the original file
    with open('C:\\Users\\afian\\OneDrive\\Desktop\\Astra_ai\\astra_ai\\memory\\mem0_memory_system.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # The original logic block that needs to be replaced
    original_logic = '''            # Determine update type based on semantic analysis
            previous_value = str(similar_event.get('current_value', similar_event.get('summary', '')))
            update_type = self._determine_update_type(previous_value, operation_content)

            # Create timestamp
            timestamp = datetime.now().isoformat()
            event_id = f"evt_{uuid.uuid4().hex[:8]}"

            # Update the operation to be an UPDATE event
            update_event = {
                "event_id": event_id,
                "type": "UPDATE",
                "summary": f"User now prefers {operation_content}" if "prefer" in operation_content.lower() else f"Updated {fact_type}: {operation_content}",
                "timestamp": timestamp,
                "emotional_context": operation.get('emotional_context', {
                    "sentiment": "neutral",
                    "emotion_tags": [],
                    "emotional_intensity": 0.5,
                    "mood_context": "normal",
                    "confidence": 0.9
                }),
                "semantic_context": {
                    "related_facts": [similar_event_id],
                    "confidence_score": similarity_score,
                    "context_type": update_type,
                    "semantic_tags": [fact_type.split('.')[-1]] if '.' in fact_type else [fact_type],
                    "similarity_hash": hashlib.md5((previous_value + operation_content).encode()).hexdigest()[:8]
                },
                "importance_score": operation.get('importance_score', 0.6),
                "confidence": 0.9,  # Higher confidence for updates
                "category": similar_event.get('category', fact_type.split('.')[0] if '.' in fact_type else fact_type),
                "subcategory": similar_event.get('subcategory', fact_type.split('.')[1] if '.' in fact_type else 'general'),
                "previous_value": previous_value,
                "current_value": operation_content,
                "provenance": {
                    "enhanced_in_place": True,
                    "enhanced_at": timestamp,
                    "original_summary": similar_event.get('summary', f"Previous {fact_type} was {previous_value}"),
                    "context": f"User: {operation_content}",
                    "source_conversation_timestamp": timestamp,
                    "cleanup_operation": "merged_similarities"
                }
            }

            # Add to update log for tracking preference evolution
            self._create_update_log_entry(update_event, similar_event_id, similarity_score, update_type)

            # Update the vector index with the new vector for this event
            self.data["memory_engine"]["vector_index"][event_id] = new_vector

            # Update clusters to reflect the new state
            self._update_clusters_for_event(event_id, update_event)

            # Replace the original ADD event in memory_events with this UPDATE event
            memory_events = self.data["memory_engine"]["memory_events"]
            for i, mem_event in enumerate(memory_events):
                if isinstance(mem_event, dict) and mem_event.get("event_id") == similar_event_id:
                    memory_events[i] = update_event
                    break

            return update_event'''

    # The new logic with conditional check
    new_logic = '''            # Determine if this is actually an update by checking for semantic indicators of updates
            previous_value = str(similar_event.get('current_value', similar_event.get('summary', '')))
            update_type = self._determine_update_type(previous_value, operation_content)

            # Only create UPDATE event if there are clear semantic indicators of an update
            # (reversal, reinforcement, habit_change) or if similarity is very high (>=0.9)
            # Otherwise, treat as a new ADD event
            if update_type in ["reversal", "reinforcement", "habit_change"] or similarity_score >= 0.9:
                # Create timestamp
                timestamp = datetime.now().isoformat()
                event_id = f"evt_{uuid.uuid4().hex[:8]}"

                # Create UPDATE event
                update_event = {
                    "event_id": event_id,
                    "type": "UPDATE",
                    "summary": f"User now prefers {operation_content}" if "prefer" in operation_content.lower() else f"Updated {fact_type}: {operation_content}",
                    "timestamp": timestamp,
                    "emotional_context": operation.get('emotional_context', {
                        "sentiment": "neutral",
                        "emotion_tags": [],
                        "emotional_intensity": 0.5,
                        "mood_context": "normal",
                        "confidence": 0.9
                    }),
                    "semantic_context": {
                        "related_facts": [similar_event_id],
                        "confidence_score": similarity_score,
                        "context_type": update_type,
                        "semantic_tags": [fact_type.split('.')[-1]] if '.' in fact_type else [fact_type],
                        "similarity_hash": hashlib.md5((previous_value + operation_content).encode()).hexdigest()[:8]
                    },
                    "importance_score": operation.get('importance_score', 0.6),
                    "confidence": 0.9,  # Higher confidence for updates
                    "category": similar_event.get('category', fact_type.split('.')[0] if '.' in fact_type else fact_type),
                    "subcategory": similar_event.get('subcategory', fact_type.split('.')[1] if '.' in fact_type else 'general'),
                    "previous_value": previous_value,
                    "current_value": operation_content,
                    "provenance": {
                        "enhanced_in_place": True,
                        "enhanced_at": timestamp,
                        "original_summary": similar_event.get('summary', f"Previous {fact_type} was {previous_value}"),
                        "context": f"User: {operation_content}",
                        "source_conversation_timestamp": timestamp,
                        "cleanup_operation": "merged_similarities"
                    }
                }

                # Add to update log for tracking preference evolution
                self._create_update_log_entry(update_event, similar_event_id, similarity_score, update_type)

                # Update the vector index with the new vector for this event
                self.data["memory_engine"]["vector_index"][event_id] = new_vector

                # Update clusters to reflect the new state
                self._update_clusters_for_event(event_id, update_event)

                # Replace the original ADD event in memory_events with this UPDATE event
                memory_events = self.data["memory_engine"]["memory_events"]
                for i, mem_event in enumerate(memory_events):
                    if isinstance(mem_event, dict) and mem_event.get("event_id") == similar_event_id:
                        memory_events[i] = update_event
                        break

                return update_event
            else:
                # This is similar but not clearly an update, treat as a new ADD event
                # This maintains the original intent to add new information
                timestamp = datetime.now().isoformat()
                event_id = f"evt_{uuid.uuid4().hex[:8]}"

                # Create complete ADD event with all required fields from the specification
                add_event = {
                    "event_id": event_id,
                    "type": "ADD",
                    "summary": f"User {fact_type.replace('personal_preferences.', '')} {operation_content}" if 'personal_preferences.' in fact_type else f"Added {fact_type}: {operation_content}",
                    "timestamp": timestamp,
                    "emotional_context": self._process_emotional_context(operation.get('emotional_context'), {
                        "sentiment": "neutral",
                        "emotion_tags": ["interest"] if 'like' in operation_content.lower() else [],
                        "emotional_intensity": 0.5,
                        "mood_context": "normal",
                        "confidence": 0.85
                    }),
                    "semantic_context": f"Inferred from input: '{operation_content}'",
                    "importance_score": operation.get('importance_score', 0.6),
                    "confidence": operation.get('confidence', 0.85),
                    "category": operation.get('category', fact_type.split('.')[0] if '.' in fact_type else fact_type),
                    "subcategory": operation.get('subcategory', fact_type.split('.')[1] if '.' in fact_type else 'general'),
                    "previous_value": None,
                    "current_value": operation_content,
                    "provenance": {
                        "enhanced_in_place": True,
                        "enhanced_at": timestamp,
                        "source_info": {
                            "source_type": "conversation",
                            "source_details": "chat input",
                            "context": f"User: {operation_content}",
                            "event_index": len(self.data["memory_engine"]["memory_events"])
                        },
                        "source_conversation_timestamp": timestamp
                    }
                }

                # Add to vector index
                self.data["memory_engine"]["vector_index"][event_id] = new_vector

                # Add to memory events
                memory_events = self.data["memory_engine"]["memory_events"]
                memory_events.append(add_event)

                # Create/update clusters based on the new event
                self._update_clusters_with_new_event(add_event)

                return add_event'''

    # Replace the original logic with new logic
    updated_content = content.replace(original_logic, new_logic)

    # Write back to the file
    with open('C:\\Users\\afian\\OneDrive\\Desktop\\Astra_ai\\astra_ai\\memory\\mem0_memory_system.py', 'w', encoding='utf-8') as f:
        f.write(updated_content)

    print("Memory system logic updated successfully!")

if __name__ == "__main__":
    fix_memory_system_logic()