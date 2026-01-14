"""Module for continuous learning and adaptation."""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
import numpy as np

class ContinuousLearning:
    """Manages continuous learning and adaptation capabilities."""
    
    def __init__(self, data_dir: str = "data"):
        """Initialize the continuous learning system.
        
        Args:
            data_dir: Directory to store learning data
        """
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        
        # Initialize learning components
        self.learned_patterns = self._load_learned_patterns()
        self.conversation_metrics = self._initialize_metrics()
        self.user_model = self._load_user_model()
        
        # Learning parameters
        self.learning_rate = 0.1
        self.pattern_threshold = 0.7
        self.adaptation_rate = 0.05
        
    def _load_learned_patterns(self) -> Dict:
        """Load learned conversation patterns."""
        patterns_file = self.data_dir / "learned_patterns.json"
        if patterns_file.exists():
            with open(patterns_file, 'r') as f:
                return json.load(f)
        return {
            "conversation_flows": [],
            "topic_transitions": {},
            "response_effectiveness": {},
            "user_preferences": {},
            "error_patterns": []
        }
    
    def _initialize_metrics(self) -> Dict:
        """Initialize conversation metrics tracking."""
        return {
            "response_quality": [],
            "user_satisfaction": [],
            "conversation_length": [],
            "topic_coherence": [],
            "error_rate": [],
            "adaptation_success": []
        }
    
    def _load_user_model(self) -> Dict:
        """Load or initialize user model."""
        model_file = self.data_dir / "user_model.json"
        if model_file.exists():
            with open(model_file, 'r') as f:
                return json.load(f)
        return {
            "interaction_style": {
                "verbosity": 0.5,
                "formality": 0.5,
                "technical_level": 0.5
            },
            "topics_of_interest": [],
            "preferred_learning_style": "balanced",
            "expertise_areas": [],
            "communication_patterns": {}
        }
    
    def learn_from_interaction(self, 
                             user_message: str, 
                             ai_response: str, 
                             context: Dict,
                             feedback: Optional[Dict] = None) -> None:
        """Learn from a single interaction.
        
        Args:
            user_message: User's message
            ai_response: AI's response
            context: Conversation context
            feedback: Optional feedback data
        """
        # Update conversation patterns
        self._update_conversation_patterns(user_message, ai_response, context)
        
        # Update user model
        self._update_user_model(user_message, context)
        
        # Process feedback if available
        if feedback:
            self._process_feedback(feedback)
        
        # Update metrics
        self._update_metrics(user_message, ai_response, context)
        
        # Save learned data
        self._save_learned_data()
    
    def _update_conversation_patterns(self, 
                                    user_message: str, 
                                    ai_response: str, 
                                    context: Dict) -> None:
        """Update learned conversation patterns.
        
        Args:
            user_message: User's message
            ai_response: AI's response
            context: Conversation context
        """
        # Extract message features
        user_features = self._extract_message_features(user_message)
        response_features = self._extract_message_features(ai_response)
        
        # Update conversation flows
        flow = {
            "user_message_type": user_features["type"],
            "context": context.get("type", "general"),
            "response_type": response_features["type"],
            "effectiveness": context.get("effectiveness", 0.5)
        }
        self.learned_patterns["conversation_flows"].append(flow)
        
        # Update topic transitions
        if "topic" in context:
            current_topic = context["topic"]
            previous_topic = context.get("previous_topic")
            if previous_topic:
                if previous_topic not in self.learned_patterns["topic_transitions"]:
                    self.learned_patterns["topic_transitions"][previous_topic] = {}
                if current_topic not in self.learned_patterns["topic_transitions"][previous_topic]:
                    self.learned_patterns["topic_transitions"][previous_topic][current_topic] = 0
                self.learned_patterns["topic_transitions"][previous_topic][current_topic] += 1
    
    def _update_user_model(self, user_message: str, context: Dict) -> None:
        """Update user model based on interaction.
        
        Args:
            user_message: User's message
            context: Conversation context
        """
        # Update interaction style
        message_stats = self._analyze_message_style(user_message)
        self.user_model["interaction_style"]["verbosity"] = self._moving_average(
            self.user_model["interaction_style"]["verbosity"],
            message_stats["verbosity"],
            self.adaptation_rate
        )
        self.user_model["interaction_style"]["formality"] = self._moving_average(
            self.user_model["interaction_style"]["formality"],
            message_stats["formality"],
            self.adaptation_rate
        )
        
        # Update topics of interest
        if "topic" in context:
            topic = context["topic"]
            if topic not in self.user_model["topics_of_interest"]:
                self.user_model["topics_of_interest"].append(topic)
        
        # Update expertise areas
        if "expertise_demonstrated" in context:
            expertise = context["expertise_demonstrated"]
            if expertise not in self.user_model["expertise_areas"]:
                self.user_model["expertise_areas"].append(expertise)
    
    def _process_feedback(self, feedback: Dict) -> None:
        """Process user feedback for learning.
        
        Args:
            feedback: Feedback data
        """
        # Update response effectiveness
        if "response_id" in feedback and "effectiveness" in feedback:
            self.learned_patterns["response_effectiveness"][feedback["response_id"]] = feedback["effectiveness"]
        
        # Record error patterns
        if feedback.get("error"):
            self.learned_patterns["error_patterns"].append({
                "type": feedback["error"],
                "context": feedback.get("context", {}),
                "timestamp": datetime.now().isoformat()
            })
    
    def _update_metrics(self, 
                       user_message: str, 
                       ai_response: str, 
                       context: Dict) -> None:
        """Update conversation metrics.
        
        Args:
            user_message: User's message
            ai_response: AI's response
            context: Conversation context
        """
        # Calculate metrics
        response_quality = context.get("response_quality", 0.5)
        user_satisfaction = context.get("user_satisfaction", 0.5)
        topic_coherence = self._calculate_topic_coherence(user_message, ai_response)
        
        # Update metric histories
        self.conversation_metrics["response_quality"].append(response_quality)
        self.conversation_metrics["user_satisfaction"].append(user_satisfaction)
        self.conversation_metrics["topic_coherence"].append(topic_coherence)
        self.conversation_metrics["conversation_length"].append(len(user_message.split()))
    
    def _extract_message_features(self, message: str) -> Dict:
        """Extract features from a message.
        
        Args:
            message: Message to analyze
            
        Returns:
            Dict: Message features
        """
        words = message.split()
        return {
            "length": len(words),
            "type": self._determine_message_type(message),
            "complexity": self._calculate_complexity(message),
            "formality": self._calculate_formality(message)
        }
    
    def _determine_message_type(self, message: str) -> str:
        """Determine the type of message.
        
        Args:
            message: Message to analyze
            
        Returns:
            str: Message type
        """
        message = message.lower()
        if "?" in message:
            return "question"
        elif "!" in message:
            return "exclamation"
        elif any(cmd in message for cmd in ["please", "could you", "would you"]):
            return "request"
        else:
            return "statement"
    
    def _calculate_complexity(self, message: str) -> float:
        """Calculate message complexity score.
        
        Args:
            message: Message to analyze
            
        Returns:
            float: Complexity score
        """
        words = message.split()
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0
        return min(1.0, avg_word_length / 10.0)
    
    def _calculate_formality(self, message: str) -> float:
        """Calculate message formality score.
        
        Args:
            message: Message to analyze
            
        Returns:
            float: Formality score
        """
        informal_markers = {"hey", "hi", "yeah", "nope", "gonna", "wanna", "dunno"}
        formal_markers = {"hello", "greetings", "please", "would", "could", "thank you"}
        
        words = set(message.lower().split())
        informal_count = len(words.intersection(informal_markers))
        formal_count = len(words.intersection(formal_markers))
        
        if informal_count == 0 and formal_count == 0:
            return 0.5
        
        return formal_count / (formal_count + informal_count)
    
    def _calculate_topic_coherence(self, user_message: str, ai_response: str) -> float:
        """Calculate topic coherence between messages.
        
        Args:
            user_message: User's message
            ai_response: AI's response
            
        Returns:
            float: Coherence score
        """
        user_words = set(user_message.lower().split())
        response_words = set(ai_response.lower().split())
        
        intersection = len(user_words.intersection(response_words))
        union = len(user_words.union(response_words))
        
        return intersection / union if union > 0 else 0.0
    
    def _moving_average(self, current: float, new: float, rate: float) -> float:
        """Calculate moving average.
        
        Args:
            current: Current value
            new: New value
            rate: Learning rate
            
        Returns:
            float: Updated average
        """
        return current * (1 - rate) + new * rate
    
    def _save_learned_data(self) -> None:
        """Save learned data to files."""
        # Save patterns
        patterns_file = self.data_dir / "learned_patterns.json"
        with open(patterns_file, 'w') as f:
            json.dump(self.learned_patterns, f, indent=4)
        
        # Save user model
        model_file = self.data_dir / "user_model.json"
        with open(model_file, 'w') as f:
            json.dump(self.user_model, f, indent=4)
        
        # Save metrics
        metrics_file = self.data_dir / "conversation_metrics.json"
        with open(metrics_file, 'w') as f:
            json.dump(self.conversation_metrics, f, indent=4)
    
    def get_learned_response_suggestions(self, 
                                      user_message: str, 
                                      context: Dict) -> Dict:
        """Get response suggestions based on learned patterns.
        
        Args:
            user_message: User's message
            context: Conversation context
            
        Returns:
            Dict: Response suggestions and parameters
        """
        message_type = self._determine_message_type(user_message)
        message_features = self._extract_message_features(user_message)
        
        # Find similar patterns
        similar_flows = [
            flow for flow in self.learned_patterns["conversation_flows"]
            if flow["user_message_type"] == message_type
            and flow["effectiveness"] > self.pattern_threshold
        ]
        
        # Get topic suggestions
        current_topic = context.get("topic")
        topic_suggestions = []
        if current_topic and current_topic in self.learned_patterns["topic_transitions"]:
            transitions = self.learned_patterns["topic_transitions"][current_topic]
            topic_suggestions = sorted(transitions.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            "message_type": message_type,
            "complexity_target": message_features["complexity"],
            "formality_target": self.user_model["interaction_style"]["formality"],
            "similar_patterns": similar_flows,
            "topic_suggestions": topic_suggestions,
            "user_expertise": self.user_model["expertise_areas"]
        } 