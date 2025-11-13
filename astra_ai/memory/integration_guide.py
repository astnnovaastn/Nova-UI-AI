"""
Integration Guide for New Memory Event System

This module demonstrates how to integrate the new memory event system
with the existing NovaMemoryAI codebase.
"""

import json
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass

# Import the new enhanced memory system
from enhanced_mem0_memory_system import EnhancedNovaMemoryAI, MemoryCategory

class MemoryEventIntegrator:
    """Integrator class to bridge new memory event system with existing codebase"""
    
    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        self.new_memory_system = EnhancedNovaMemoryAI(storage_file)
        self.storage_file = storage_file
    
    def process_operation_with_new_system(self, operation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process an operation using the new memory event system
        
        Args:
            operation: Operation from the existing system
            
        Returns:
            Processed operation with complete memory event structure
        """
        # Extract key information from operation
        fact_type = operation.get('fact_type', '')
        value = operation.get('value', '')
        confidence = operation.get('confidence', 0.8)
        category = operation.get('category', 'user_identity')
        subcategory = operation.get('subcategory', 'general')
        
        # Determine if this should be an ADD or UPDATE operation
        if operation.get('type') == 'ADD':
            # Create ADD event using new system
            add_event = self.new_memory_system.create_add_event(
                text=value,
                context=f"Operation: {fact_type} = {value}"
            )
            return add_event
        elif operation.get('type') == 'UPDATE':
            # Find similar existing event for UPDATE
            similar_events = self.new_memory_system._find_similar_events(value)
            if similar_events:
                # Create UPDATE event
                previous_event_id, similarity_score = similar_events[0]
                update_type = self.new_memory_system._determine_update_type(
                    "", value  # Simplified for example
                )
                
                update_event = self.new_memory_system.create_update_event(
                    previous_event_id=previous_event_id,
                    summary=f"Updated {fact_type}: {value}",
                    timestamp=datetime.now().isoformat(),
                    emotional_context={
                        "sentiment": "neutral",
                        "emotion_tags": [],
                        "emotional_intensity": 0.5,
                        "mood_context": "normal",
                        "confidence": confidence
                    },
                    semantic_context={
                        "related_facts": [previous_event_id],
                        "confidence_score": similarity_score,
                        "context_type": update_type,
                        "semantic_tags": [subcategory],
                        "similarity_hash": str(hash(value) % 1000000)
                    },
                    importance_score=0.6,
                    confidence=confidence,
                    category=category,
                    subcategory=subcategory,
                    previous_value="",  # Would get from existing event
                    current_value=value,
                    provenance={
                        "enhanced_in_place": True,
                        "enhanced_at": datetime.now().isoformat(),
                        "source_info": {
                            "source_type": "operation",
                            "source_details": "memory_operation",
                            "context": f"Operation: {fact_type} = {value}",
                            "event_index": len(self.new_memory_system.data.get("memory_events", []))
                        },
                        "source_conversation_timestamp": datetime.now().isoformat()
                    }
                )
                return update_event
            else:
                # No similar event found, create ADD event instead
                add_event = self.new_memory_system.create_add_event(
                    text=value,
                    context=f"Operation: {fact_type} = {value}"
                )
                return add_event
        
        return operation  # Return unchanged if neither ADD nor UPDATE
    
    def get_complete_memory_structure(self) -> Dict[str, Any]:
        """
        Get the complete memory structure in the new format
        
        Returns:
            Complete memory structure with all components
        """
        return self.new_memory_system.get_complete_memory_structure()
    
    def save_memory(self):
        """Save memory using the new system"""
        self.new_memory_system.save_memory()
    
    def migrate_existing_data(self) -> bool:
        """
        Migrate existing memory data to new format
        
        Returns:
            True if migration successful, False otherwise
        """
        try:
            # Load existing data
            with open(self.storage_file, 'r') as f:
                existing_data = json.load(f)
            
            # Migrate memory events to new format
            if "memory_events" in existing_data:
                for event in existing_data["memory_events"]:
                    # Process each event with new system
                    new_event = self.process_operation_with_new_system(event)
                    # Add to new system
                    self.new_memory_system.data["memory_events"].append(new_event)
            
            # Migrate fact history
            if "fact_history" in existing_data:
                self.new_memory_system.data["fact_history"] = existing_data["fact_history"]
            
            # Migrate user data
            if "user" in existing_data:
                self.new_memory_system.data["user"] = existing_data["user"]
            
            # Save using new system
            self.save_memory()
            
            return True
        except Exception as e:
            print(f"Error migrating data: {e}")
            return False

# Example integration with existing NovaMemoryAI
class IntegratedNovaMemoryAI:
    """
    Integrated NovaMemoryAI that uses both existing and new memory event systems
    """
    
    def __init__(self, storage_file: str = "astra_ai/Date/nova_ai_memory.json"):
        # Initialize both systems
        self.existing_system = NovaMemoryAI(storage_file)  # Existing system
        self.integrator = MemoryEventIntegrator(storage_file)  # New integrator
        
        # Flag to determine which system to use
        self.use_new_system = True  # Default to new system
    
    def process_operation(self, operation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process operation using either existing or new system based on flag
        
        Args:
            operation: Memory operation to process
            
        Returns:
            Processed operation
        """
        if self.use_new_system:
            # Use new system
            return self.integrator.process_operation_with_new_system(operation)
        else:
            # Use existing system (placeholder)
            # In a real implementation, this would call existing methods
            return operation
    
    def get_memory_context(self) -> Dict[str, Any]:
        """
        Get memory context using appropriate system
        
        Returns:
            Memory context dictionary
        """
        if self.use_new_system:
            # Get from new system
            return self.integrator.get_complete_memory_structure()
        else:
            # Get from existing system
            return self.existing_system.get_memory_context()
    
    def save_memory(self):
        """Save memory using appropriate system"""
        if self.use_new_system:
            self.integrator.save_memory()
        else:
            self.existing_system.save_memory()
    
    def switch_to_new_system(self):
        """Switch to using the new memory event system"""
        self.use_new_system = True
        print("Switched to new memory event system")
    
    def switch_to_existing_system(self):
        """Switch to using the existing memory system"""
        self.use_new_system = False
        print("Switched to existing memory system")
    
    def migrate_to_new_system(self) -> bool:
        """
        Migrate existing data to new system
        
        Returns:
            True if migration successful, False otherwise
        """
        if self.integrator.migrate_existing_data():
            self.switch_to_new_system()
            return True
        return False

# Example usage
def main():
    """Example usage of the integrated system"""
    
    print("=== Memory Event System Integration Demo ===\n")
    
    # Create integrated system
    integrated_system = IntegratedNovaMemoryAI("demo_integrated_memory.json")
    
    # Process some operations using new system
    print("1. Processing operations with new system...")
    
    # ADD operation
    add_operation = {
        "type": "ADD",
        "fact_type": "personal_preferences.likes",
        "value": "reading science fiction novels",
        "confidence": 0.85,
        "category": MemoryCategory.PERSONAL_PREFERENCES.value,
        "subcategory": "likes"
    }
    
    processed_add = integrated_system.process_operation(add_operation)
    print(f"✓ ADD Event Processed: {processed_add.get('event_id', 'N/A')}")
    print(f"  Summary: {processed_add.get('summary', 'N/A')}")
    print(f"  Category: {processed_add.get('category', 'N/A')}")
    print()
    
    # UPDATE operation
    update_operation = {
        "type": "UPDATE",
        "fact_type": "personal_preferences.likes",
        "value": "reading science fiction and fantasy novels",
        "confidence": 0.9,
        "category": MemoryCategory.PERSONAL_PREFERENCES.value,
        "subcategory": "likes",
        "previous_value": "reading science fiction novels"
    }
    
    processed_update = integrated_system.process_operation(update_operation)
    print(f"✓ UPDATE Event Processed: {processed_update.get('event_id', 'N/A')}")
    print(f"  Summary: {processed_update.get('summary', 'N/A')}")
    print(f"  Previous Value: {processed_update.get('previous_value', 'N/A')}")
    print(f"  Current Value: {processed_update.get('current_value', 'N/A')}")
    print()
    
    # Get complete memory context
    print("2. Getting complete memory context...")
    memory_context = integrated_system.get_memory_context()
    print(f"✓ Memory Events: {len(memory_context.get('memory_engine', {}).get('memory_events', []))}")
    print(f"✓ Vector Index Entries: {len(memory_context.get('vector_index', {}))}")
    print(f"✓ Clusters: {len(memory_context.get('clusters', {}))}")
    print(f"✓ Update Log Entries: {len(memory_context.get('memory_engine', {}).get('update_log', []))}")
    print()
    
    # Save memory
    print("3. Saving memory...")
    integrated_system.save_memory()
    print("✓ Memory saved successfully")
    print()
    
    # Demonstrate system switching
    print("4. Demonstrating system switching...")
    integrated_system.switch_to_existing_system()
    print("✓ Switched to existing system")
    
    integrated_system.switch_to_new_system()
    print("✓ Switched back to new system")
    print()
    
    print("=== Integration Demo Complete ===")

if __name__ == "__main__":
    main()