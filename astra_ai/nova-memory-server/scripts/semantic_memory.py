from typing import Dict, List, Set, Optional
from datetime import datetime
import logging
import json
import os
import networkx as nx

logger = logging.getLogger(__name__)

class SemanticMemory:
    """Advanced semantic memory system for storing and managing concepts and their relationships."""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize the semantic memory system.
        
        Args:
            data_dir: Directory to store semantic memory data
        """
        self.data_dir = data_dir
        self.concepts: Dict[str, Dict] = {}
        self.relationships = nx.DiGraph()
        self.concept_history: Dict[str, List[Dict]] = {}
        
        # Load existing semantic memory if available
        self._load_semantic_memory()
    
    def _load_semantic_memory(self):
        """Load semantic memory from disk."""
        try:
            memory_file = os.path.join(self.data_dir, "semantic_memory.json")
            if os.path.exists(memory_file):
                with open(memory_file, 'r') as f:
                    data = json.load(f)
                    self.concepts = data.get('concepts', {})
                    self.concept_history = data.get('concept_history', {})
                    
                    # Rebuild relationship graph
                    for rel in data.get('relationships', []):
                        self.relationships.add_edge(
                            rel['source'],
                            rel['target'],
                            weight=rel['weight'],
                            type=rel['type']
                        )
                    
                logger.info(f"Loaded semantic memory with {len(self.concepts)} concepts")
        except Exception as e:
            logger.error(f"Error loading semantic memory: {e}")
    
    def _save_semantic_memory(self):
        """Save semantic memory to disk."""
        try:
            os.makedirs(self.data_dir, exist_ok=True)
            memory_file = os.path.join(self.data_dir, "semantic_memory.json")
            
            # Convert relationships to list format
            relationships = []
            for source, target, data in self.relationships.edges(data=True):
                relationships.append({
                    'source': source,
                    'target': target,
                    'weight': data['weight'],
                    'type': data['type']
                })
            
            with open(memory_file, 'w') as f:
                json.dump({
                    'concepts': self.concepts,
                    'relationships': relationships,
                    'concept_history': self.concept_history
                }, f, indent=2)
            
            logger.info(f"Saved semantic memory with {len(self.concepts)} concepts")
        except Exception as e:
            logger.error(f"Error saving semantic memory: {e}")
    
    def add_concept(self, concept: str, properties: Dict, confidence: float = 1.0) -> bool:
        """Add a new concept to semantic memory.
        
        Args:
            concept: The concept name
            properties: Properties of the concept
            confidence: Confidence in the concept (0-1)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Initialize concept if it doesn't exist
            if concept not in self.concepts:
                self.concepts[concept] = {
                    'properties': {},
                    'confidence': 0.0,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                self.concept_history[concept] = []
            
            # Update concept
            self.concepts[concept]['properties'].update(properties)
            self.concepts[concept]['confidence'] = confidence
            self.concepts[concept]['updated_at'] = datetime.now().isoformat()
            
            # Record in history
            self.concept_history[concept].append({
                'properties': properties,
                'confidence': confidence,
                'timestamp': datetime.now().isoformat()
            })
            
            # Save changes
            self._save_semantic_memory()
            
            return True
        except Exception as e:
            logger.error(f"Error adding concept: {e}")
            return False
    
    def add_relationship(self, source: str, target: str, rel_type: str, weight: float = 1.0) -> bool:
        """Add a relationship between concepts.
        
        Args:
            source: Source concept
            target: Target concept
            rel_type: Type of relationship
            weight: Relationship weight (0-1)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Ensure both concepts exist
            if source not in self.concepts or target not in self.concepts:
                return False
            
            # Add relationship
            self.relationships.add_edge(
                source,
                target,
                weight=weight,
                type=rel_type
            )
            
            # Save changes
            self._save_semantic_memory()
            
            return True
        except Exception as e:
            logger.error(f"Error adding relationship: {e}")
            return False
    
    def get_concept(self, concept: str) -> Optional[Dict]:
        """Get a concept and its properties.
        
        Args:
            concept: The concept name
            
        Returns:
            Optional[Dict]: Concept data if found, None otherwise
        """
        return self.concepts.get(concept)
    
    def get_related_concepts(self, concept: str, rel_type: Optional[str] = None) -> List[Dict]:
        """Get concepts related to a given concept.
        
        Args:
            concept: The concept name
            rel_type: Optional relationship type filter
            
        Returns:
            List[Dict]: List of related concepts with their relationships
        """
        try:
            if concept not in self.concepts:
                return []
            
            related = []
            for target in self.relationships.successors(concept):
                edge_data = self.relationships.get_edge_data(concept, target)
                if rel_type is None or edge_data['type'] == rel_type:
                    related.append({
                        'concept': target,
                        'relationship': edge_data['type'],
                        'weight': edge_data['weight'],
                        'properties': self.concepts[target]['properties']
                    })
            
            return related
        except Exception as e:
            logger.error(f"Error getting related concepts: {e}")
            return []
    
    def update_concept(self, concept: str, properties: Dict, confidence: Optional[float] = None) -> bool:
        """Update a concept's properties and confidence.
        
        Args:
            concept: The concept name
            properties: New properties to add/update
            confidence: Optional new confidence value
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if concept not in self.concepts:
                return False
            
            # Update properties
            self.concepts[concept]['properties'].update(properties)
            
            # Update confidence if provided
            if confidence is not None:
                self.concepts[concept]['confidence'] = confidence
            
            self.concepts[concept]['updated_at'] = datetime.now().isoformat()
            
            # Record in history
            self.concept_history[concept].append({
                'properties': properties,
                'confidence': confidence or self.concepts[concept]['confidence'],
                'timestamp': datetime.now().isoformat()
            })
            
            # Save changes
            self._save_semantic_memory()
            
            return True
        except Exception as e:
            logger.error(f"Error updating concept: {e}")
            return False
    
    def delete_concept(self, concept: str) -> bool:
        """Delete a concept and its relationships.
        
        Args:
            concept: The concept name
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if concept not in self.concepts:
                return False
            
            # Remove concept
            del self.concepts[concept]
            del self.concept_history[concept]
            
            # Remove relationships
            self.relationships.remove_node(concept)
            
            # Save changes
            self._save_semantic_memory()
            
            return True
        except Exception as e:
            logger.error(f"Error deleting concept: {e}")
            return False
    
    def get_concept_history(self, concept: str) -> List[Dict]:
        """Get the history of changes for a concept.
        
        Args:
            concept: The concept name
            
        Returns:
            List[Dict]: List of historical changes
        """
        return self.concept_history.get(concept, [])
    
    def search_concepts(self, query: str) -> List[Dict]:
        """Search for concepts matching a query.
        
        Args:
            query: The search query
            
        Returns:
            List[Dict]: List of matching concepts
        """
        try:
            query = query.lower()
            results = []
            
            for concept, data in self.concepts.items():
                # Check concept name
                if query in concept.lower():
                    results.append({
                        'concept': concept,
                        'properties': data['properties'],
                        'confidence': data['confidence']
                    })
                    continue
                
                # Check properties
                for prop_name, prop_value in data['properties'].items():
                    if isinstance(prop_value, str) and query in prop_value.lower():
                        results.append({
                            'concept': concept,
                            'properties': data['properties'],
                            'confidence': data['confidence']
                        })
                        break
            
            return results
        except Exception as e:
            logger.error(f"Error searching concepts: {e}")
            return [] 