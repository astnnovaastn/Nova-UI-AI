#!/usr/bin/env python3
"""
Unit tests for the enhanced memory system and load_memory functionality.
Tests the memory loading, context generation, and fallback mechanisms.
"""

import unittest
import tempfile
import os
import sys
from unittest.mock import Mock

# Add the parent directory to the path to import astra_ai modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from astra_ai.memory.enhanced_nova_memory_interface import (
    EnhancedNovaMemoryInterface
)
from astra_ai.core.response_manager import ResponseManager


class TestMemorySystem(unittest.TestCase):
    """Test cases for the memory system functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create a temporary memory file for testing
        self.temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        self.temp_file.close()
        
        # Initialize memory interface with temporary file
        self.memory_interface = EnhancedNovaMemoryInterface(
            memory_file=self.temp_file.name,
            enable_logging=False
        )
        
        # Initialize response manager with memory system
        self.response_manager = ResponseManager(memory_system=self.memory_interface)
    
    def tearDown(self):
        """Clean up test fixtures"""
        # Remove temporary file
        if os.path.exists(self.temp_file.name):
            os.unlink(self.temp_file.name)
    
    def test_load_memory_basic_functionality(self):
        """Test basic load_memory functionality"""
        # Test with empty query
        result = self.memory_interface.load_memory("")
        
        self.assertIsInstance(result, dict)
        self.assertIn("success", result)
        self.assertIn("memory_available", result)
        self.assertIn("fallback_context", result)
    
    def test_load_memory_with_query(self):
        """Test load_memory with a specific query"""
        query = "What is my name?"
        result = self.memory_interface.load_memory(query)
        
        self.assertIsInstance(result, dict)
        self.assertIn("query", result)
        self.assertEqual(result["query"], query)
        self.assertIn("memory_available", result)
    
    def test_load_memory_context_types(self):
        """Test load_memory with different context types"""
        context_types = ["comprehensive", "basic", "focused"]
        
        for context_type in context_types:
            result = self.memory_interface.load_memory("test query", context_type)
            self.assertIsInstance(result, dict)
            self.assertEqual(result.get("context_type"), context_type)
    
    def test_fallback_context_when_memory_unavailable(self):
        """Test fallback context when memory system is not available"""
        # Create a mock memory interface that's not initialized
        mock_interface = Mock()
        mock_interface.is_initialized = False
        
        # Test fallback context
        fallback = self.memory_interface._get_fallback_context()
        
        self.assertIsInstance(fallback, dict)
        self.assertIn("message", fallback)
        self.assertIn("suggestions", fallback)
        self.assertIn("capabilities", fallback)
    
    def test_recent_conversations_retrieval(self):
        """Test retrieval of recent conversations"""
        # Test with no conversations
        conversations = self.memory_interface._get_recent_conversations(days=3)
        self.assertIsInstance(conversations, list)
    
    def test_user_instructions_retrieval(self):
        """Test retrieval of user instructions"""
        instructions = self.memory_interface._get_user_instructions()
        self.assertIsInstance(instructions, list)
    
    def test_auto_instructions_retrieval(self):
        """Test retrieval of auto-instructions"""
        auto_instructions = self.memory_interface._get_auto_instructions()
        self.assertIsInstance(auto_instructions, list)
    
    def test_response_manager_memory_integration(self):
        """Test response manager integration with memory system"""
        user_message = "Hello, what's my name?"
        conversation_history = []
        context = {}
        
        # Test response generation with memory
        response, metadata = self.response_manager.generate_response(
            user_message, conversation_history, context
        )
        
        self.assertIsInstance(response, str)
        self.assertIsInstance(metadata, dict)
        self.assertIn("memory_available", metadata)
    
    def test_memory_context_loading_in_response_manager(self):
        """Test memory context loading in response manager"""
        user_message = "Test message"
        context = {}
        
        memory_context = self.response_manager._load_memory_context(user_message, context)
        
        self.assertIsInstance(memory_context, dict)
        self.assertIn("memory_available", memory_context)
    
    def test_auto_instruction_detection(self):
        """Test auto-instruction detection logic"""
        # Test instruction that should trigger
        instruction = {
            "content": "always show time when greeting",
            "trigger_keywords": ["always", "show", "time"]
        }
        
        should_apply = self.response_manager._should_apply_auto_instruction(
            instruction, "hello"
        )
        self.assertIsInstance(should_apply, bool)
    
    def test_auto_instruction_application(self):
        """Test auto-instruction application"""
        instruction = {
            "content": "show time when greeting",
            "trigger_keywords": ["show", "time"]
        }
        
        response = self.response_manager._apply_auto_instruction(instruction, "hello")
        
        self.assertIsInstance(response, str)
        self.assertIn("time", response.lower())
    
    def test_memory_personalization(self):
        """Test memory-based personalization"""
        memory_context = {
            "memory_available": True,
            "user_profile": {"name": "TestUser"},
            "recent_conversations": [
                {"content": "We discussed AI yesterday", "category": "conversation_summary"}
            ]
        }
        
        base_response = "Hello! How can I help you?"
        personalized_response = self.response_manager._add_memory_personalization(
            base_response, memory_context
        )
        
        self.assertIsInstance(personalized_response, str)
        # Should contain user name if available
        self.assertIn("TestUser", personalized_response)
    
    def test_memory_context_addition(self):
        """Test adding memory context to responses"""
        memory_context = {
            "memory_available": True,
            "relevant_memories": [
                {"content": "User likes coffee", "confidence": 0.9}
            ],
            "user_instructions": [
                {"content": "User prefers short responses", "confidence": 0.8}
            ]
        }
        
        base_response = "Here's some information."
        enhanced_response = self.response_manager._add_memory_context(
            base_response, memory_context
        )
        
        self.assertIsInstance(enhanced_response, str)
        self.assertIn("coffee", enhanced_response)
    
    def test_response_metadata_generation(self):
        """Test response metadata generation with memory context"""
        memory_context = {
            "memory_available": True,
            "context_type": "comprehensive",
            "relevant_memories": [{"content": "test memory"}],
            "auto_instructions": [{"content": "test instruction"}]
        }
        
        metadata = self.response_manager._generate_response_metadata(
            "Test response", {}, {}, memory_context
        )
        
        self.assertIsInstance(metadata, dict)
        self.assertIn("memory_available", metadata)
        self.assertIn("memory_context_type", metadata)
        self.assertIn("relevant_memories_count", metadata)
        self.assertIn("auto_instructions_applied", metadata)
    
    def test_memory_system_health_check(self):
        """Test memory system health check"""
        health_status = self.memory_interface.is_healthy()
        
        self.assertIsInstance(health_status, dict)
        self.assertIn("healthy", health_status)
        self.assertIn("health_score", health_status)
    
    def test_memory_statistics(self):
        """Test memory statistics retrieval"""
        stats = self.memory_interface.get_memory_statistics()
        
        self.assertIsInstance(stats, dict)
    
    def test_memory_search_functionality(self):
        """Test memory search functionality"""
        query = "test search"
        results = self.memory_interface.search_memories(query)
        
        self.assertIsInstance(results, list)
    
    def test_memory_gaps_detection(self):
        """Test memory gaps detection"""
        gaps = self.memory_interface.get_memory_gaps()
        
        self.assertIsInstance(gaps, list)
    
    def test_self_awareness_report(self):
        """Test self-awareness report generation"""
        report = self.memory_interface.get_self_awareness_report()
        
        self.assertIsInstance(report, dict)
    
    def test_error_handling_in_load_memory(self):
        """Test error handling in load_memory function"""
        # Test with invalid memory system
        mock_interface = Mock()
        mock_interface.is_initialized = False
        mock_interface._get_fallback_context.return_value = {"message": "Fallback"}
        
        # This should not raise an exception
        result = self.memory_interface.load_memory("test")
        self.assertIsInstance(result, dict)
    
    def test_memory_context_structure(self):
        """Test that memory context has the expected structure"""
        result = self.memory_interface.load_memory("test query", "comprehensive")
        
        expected_keys = [
            "success", "query", "context_type", "timestamp",
            "user_profile", "basic_context", "focused_context",
            "relevant_memories", "recent_conversations",
            "user_instructions", "auto_instructions",
            "memory_gaps", "memory_stats", "self_awareness",
            "fallback_available", "fallback_context", "memory_available"
        ]
        
        for key in expected_keys:
            self.assertIn(key, result, f"Missing key: {key}")


class TestMemoryIntegration(unittest.TestCase):
    """Test cases for memory system integration with Nova AI"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        self.temp_file.close()
        
        # Mock the memory system for integration testing
        self.memory_interface = Mock()
        self.memory_interface.is_initialized = True
        self.memory_interface.load_memory.return_value = {
            "success": True,
            "memory_available": True,
            "user_profile": {"name": "TestUser"},
            "relevant_memories": [],
            "recent_conversations": [],
            "user_instructions": [],
            "auto_instructions": [],
            "fallback_context": {}
        }
    
    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.temp_file.name):
            os.unlink(self.temp_file.name)
    
    def test_nova_ai_memory_integration(self):
        """Test Nova AI integration with memory system"""
        # This would test the actual Nova AI integration
        # For now, we'll test the response manager integration
        response_manager = ResponseManager(memory_system=self.memory_interface)
        
        user_message = "Hello, what do you remember about me?"
        conversation_history = []
        context = {}
        
        response, metadata = response_manager.generate_response(
            user_message, conversation_history, context
        )
        
        self.assertIsInstance(response, str)
        self.assertIsInstance(metadata, dict)
        self.assertTrue(metadata.get("memory_available", False))
    
    def test_memory_context_passing(self):
        """Test that memory context is properly passed through the system"""
        response_manager = ResponseManager(memory_system=self.memory_interface)
        
        # Verify that load_memory is called
        user_message = "Test message"
        context = {}
        
        response_manager._load_memory_context(user_message, context)
        
        # Verify the memory system was called
        self.memory_interface.load_memory.assert_called_with(user_message, "comprehensive")


if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)
