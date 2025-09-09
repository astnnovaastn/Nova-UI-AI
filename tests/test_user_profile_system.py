#!/usr/bin/env python3
"""
Unit tests for the user profile system and memory cleanup functionality.
Tests the user profile management, real-time updates, and automatic cleanup.
"""

import unittest
import tempfile
import os
import sys
import json
from unittest.mock import Mock, patch
from datetime import datetime, timedelta

# Add the parent directory to the path to import astra_ai modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from astra_ai.memory.user_profile_manager import (
    UserProfileManager, UserProfileData, ProfileCategory
)
from astra_ai.memory.memory_cleanup_system import (
    MemoryCleanupSystem, CleanupPolicy, MemoryType
)
from astra_ai.memory.enhanced_nova_memory_interface import (
    EnhancedNovaMemoryInterface
)


class TestUserProfileManager(unittest.TestCase):
    """Test cases for the user profile manager"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        self.temp_file.close()
        
        # Create a minimal profile file
        with open(self.temp_file.name, 'w') as f:
            json.dump({}, f)
        
        self.profile_manager = UserProfileManager(
            profile_file=self.temp_file.name,
            backup_dir="test_backups",
            enable_logging=False
        )
    
    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.temp_file.name):
            os.unlink(self.temp_file.name)
        
        # Clean up backup directory
        if os.path.exists("test_backups"):
            import shutil
            shutil.rmtree("test_backups")
    
    def test_profile_initialization(self):
        """Test profile manager initialization"""
        self.assertIsNotNone(self.profile_manager)
        self.assertTrue(self.profile_manager.is_initialized)
        self.assertIsNotNone(self.profile_manager.get_profile())
    
    def test_profile_data_structure(self):
        """Test user profile data structure"""
        profile = self.profile_manager.get_profile()
        self.assertIsInstance(profile, UserProfileData)
        
        # Check required fields
        self.assertIsNotNone(profile.profile_id)
        self.assertIsNotNone(profile.created_at)
        self.assertIsNotNone(profile.last_updated)
        self.assertEqual(profile.version, "1.0")
    
    def test_profile_update(self):
        """Test profile update functionality"""
        updates = {
            "name": "Test User",
            "age": 25,
            "location": "Test City"
        }
        
        success = self.profile_manager.update_profile(updates, ProfileCategory.PERSONAL_INFO)
        self.assertTrue(success)
        
        profile = self.profile_manager.get_profile()
        self.assertEqual(profile.name, "Test User")
        self.assertEqual(profile.age, 25)
        self.assertEqual(profile.location, "Test City")
    
    def test_conversation_data_addition(self):
        """Test adding conversation data to profile"""
        success = self.profile_manager.add_conversation_data(
            "Hello, I'm interested in AI",
            "That's great! AI is a fascinating field.",
            ["technology", "ai"],
            "positive"
        )
        
        self.assertTrue(success)
        
        profile = self.profile_manager.get_profile()
        self.assertEqual(profile.total_conversations, 1)
        self.assertIsNotNone(profile.first_interaction)
        self.assertIsNotNone(profile.last_interaction)
    
    def test_profile_summary(self):
        """Test profile summary generation"""
        # Add some data first
        self.profile_manager.update_profile({
            "name": "Test User",
            "age": 30,
            "topics_of_interest": ["technology", "science"]
        })
        
        summary = self.profile_manager.get_profile_summary()
        
        self.assertIsInstance(summary, dict)
        self.assertEqual(summary["name"], "Test User")
        self.assertEqual(summary["age"], 30)
        self.assertIn("technology", summary["interests"])
    
    def test_profile_search(self):
        """Test profile search functionality"""
        # Add some data first
        self.profile_manager.update_profile({
            "name": "John Doe",
            "occupation": "Software Engineer",
            "hobbies": ["programming", "reading"]
        })
        
        # Search for name
        results = self.profile_manager.search_profile("John")
        self.assertIn("name", results["results"])
        
        # Search for occupation
        results = self.profile_manager.search_profile("engineer")
        self.assertIn("occupation", results["results"])
    
    def test_profile_export_import(self):
        """Test profile export and import functionality"""
        # Add some data
        self.profile_manager.update_profile({
            "name": "Export Test",
            "age": 28
        })
        
        # Export profile
        export_file = self.profile_manager.export_profile()
        self.assertTrue(os.path.exists(export_file))
        
        # Create new manager and import
        new_manager = UserProfileManager("test_import.json")
        success = new_manager.import_profile(export_file)
        self.assertTrue(success)
        
        # Check imported data
        imported_profile = new_manager.get_profile()
        self.assertEqual(imported_profile.name, "Export Test")
        self.assertEqual(imported_profile.age, 28)
        
        # Clean up
        os.unlink(export_file)
        os.unlink("test_import.json")
    
    def test_profile_statistics(self):
        """Test profile statistics generation"""
        # Add some data
        self.profile_manager.update_profile({
            "name": "Stats Test",
            "topics_of_interest": ["tech", "science", "art"],
            "short_term_goals": ["learn python", "read books"]
        })
        
        stats = self.profile_manager.get_profile_stats()
        
        self.assertIsInstance(stats, dict)
        self.assertIn("total_fields_filled", stats)
        self.assertIn("interests_count", stats)
        self.assertIn("goals_count", stats)
    
    def test_profile_reset(self):
        """Test profile reset functionality"""
        # Add some data
        self.profile_manager.update_profile({"name": "Reset Test"})
        
        # Reset profile
        success = self.profile_manager.reset_profile()
        self.assertTrue(success)
        
        # Check that data is reset
        profile = self.profile_manager.get_profile()
        self.assertIsNone(profile.name)


class TestMemoryCleanupSystem(unittest.TestCase):
    """Test cases for the memory cleanup system"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_memory_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        self.temp_profile_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        
        # Create sample memory data
        sample_memories = {
            "memories": [
                {
                    "id": "1",
                    "content": "User's name is John",
                    "category": "user_identity",
                    "confidence": 0.9,
                    "created_at": (datetime.now() - timedelta(days=1)).isoformat(),
                    "access_count": 5
                },
                {
                    "id": "2",
                    "content": "Weather is sunny today",
                    "category": "current_state",
                    "confidence": 0.6,
                    "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
                    "access_count": 0
                },
                {
                    "id": "3",
                    "content": "User likes coffee",
                    "category": "personal_preferences",
                    "confidence": 0.8,
                    "created_at": (datetime.now() - timedelta(days=5)).isoformat(),
                    "access_count": 2
                }
            ]
        }
        
        with open(self.temp_memory_file.name, 'w') as f:
            json.dump(sample_memories, f)
        
        self.temp_memory_file.close()
        self.temp_profile_file.close()
        
        self.cleanup_system = MemoryCleanupSystem(
            memory_file=self.temp_memory_file.name,
            profile_file=self.temp_profile_file.name
        )
    
    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.temp_memory_file.name):
            os.unlink(self.temp_memory_file.name)
        if os.path.exists(self.temp_profile_file.name):
            os.unlink(self.temp_profile_file.name)
    
    def test_cleanup_system_initialization(self):
        """Test cleanup system initialization"""
        self.assertIsNotNone(self.cleanup_system)
        self.assertIsNotNone(self.cleanup_system.cleanup_rules)
    
    def test_memory_classification(self):
        """Test memory classification functionality"""
        # Test essential memory
        essential_memory = {
            "content": "User's name is John",
            "category": "user_identity"
        }
        mem_type = self.cleanup_system._classify_memory(essential_memory)
        self.assertEqual(mem_type, MemoryType.ESSENTIAL)
        
        # Test temporary memory
        temp_memory = {
            "content": "Weather is sunny today",
            "category": "current_state"
        }
        mem_type = self.cleanup_system._classify_memory(temp_memory)
        self.assertEqual(mem_type, MemoryType.TEMPORARY)
    
    def test_memory_deletion_logic(self):
        """Test memory deletion decision logic"""
        # Test essential memory (should not be deleted)
        essential_memory = {
            "content": "User's name is John",
            "category": "user_identity",
            "created_at": (datetime.now() - timedelta(days=100)).isoformat(),
            "access_count": 1,
            "confidence": 0.9
        }
        
        rule = self.cleanup_system.cleanup_rules[MemoryType.ESSENTIAL]
        should_delete, reason = self.cleanup_system._should_delete_memory(essential_memory, rule)
        self.assertFalse(should_delete)
        
        # Test old temporary memory (should be deleted)
        temp_memory = {
            "content": "Weather is sunny today",
            "category": "current_state",
            "created_at": (datetime.now() - timedelta(days=10)).isoformat(),
            "access_count": 0,
            "confidence": 0.3
        }
        
        rule = self.cleanup_system.cleanup_rules[MemoryType.TEMPORARY]
        should_delete, reason = self.cleanup_system._should_delete_memory(temp_memory, rule)
        self.assertTrue(should_delete)
    
    def test_cleanup_execution(self):
        """Test cleanup execution"""
        # Run cleanup in dry run mode
        stats = self.cleanup_system.cleanup_memories(CleanupPolicy.BALANCED, dry_run=True)
        
        self.assertIsNotNone(stats)
        self.assertGreater(stats.total_memories_before, 0)
        # In dry run mode, no memories should actually be deleted
        self.assertEqual(stats.total_memories_after, stats.total_memories_before)
    
    def test_cleanup_recommendations(self):
        """Test cleanup recommendations"""
        recommendations = self.cleanup_system.get_cleanup_recommendations()
        
        self.assertIsInstance(recommendations, dict)
        self.assertIn("total_memories", recommendations)
        self.assertIn("memory_size_mb", recommendations)
        self.assertIn("recommendations", recommendations)


class TestEnhancedMemoryInterfaceIntegration(unittest.TestCase):
    """Test cases for enhanced memory interface with user profile integration"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_memory_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        self.temp_memory_file.close()
        
        self.memory_interface = EnhancedNovaMemoryInterface(
            memory_file=self.temp_memory_file.name,
            enable_logging=False
        )
    
    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.temp_memory_file.name):
            os.unlink(self.temp_memory_file.name)
        
        # Clean up user profile file
        if os.path.exists("user_profile.json"):
            os.unlink("user_profile.json")
    
    def test_user_profile_integration(self):
        """Test user profile integration in memory interface"""
        # Test profile update
        updates = {
            "name": "Integration Test User",
            "age": 30,
            "topics_of_interest": ["technology", "science"]
        }
        
        success = self.memory_interface.update_user_profile(updates, "personal_info")
        self.assertTrue(success)
        
        # Test profile retrieval
        profile = self.memory_interface.get_user_profile()
        self.assertIsInstance(profile, dict)
        self.assertEqual(profile["name"], "Integration Test User")
    
    def test_conversation_processing_with_profile_updates(self):
        """Test conversation processing with real-time profile updates"""
        # Process a conversation that should update the profile
        user_message = "Hi, my name is Alice and I'm 25 years old. I'm interested in AI and machine learning."
        ai_response = "Nice to meet you, Alice! AI and machine learning are fascinating fields."
        
        result = self.memory_interface.process_conversation(user_message, ai_response)
        
        self.assertTrue(result.get("success", False))
        
        # Check if profile was updated
        profile = self.memory_interface.get_user_profile()
        self.assertEqual(profile["name"], "Alice")
        self.assertEqual(profile["age"], 25)
        self.assertIn("technology", profile["topics_of_interest"])
    
    def test_memory_cleanup_integration(self):
        """Test memory cleanup integration"""
        # Get cleanup recommendations
        recommendations = self.memory_interface.get_cleanup_recommendations()
        self.assertIsInstance(recommendations, dict)
        
        # Run cleanup (dry run)
        cleanup_result = self.memory_interface.run_memory_cleanup("balanced", dry_run=True)
        self.assertIsInstance(cleanup_result, dict)
    
    def test_profile_search_functionality(self):
        """Test profile search functionality"""
        # Add some profile data
        self.memory_interface.update_user_profile({
            "name": "Search Test",
            "occupation": "Data Scientist",
            "hobbies": ["programming", "hiking"]
        })
        
        # Search for specific information
        results = self.memory_interface.search_user_profile("scientist")
        self.assertIsInstance(results, dict)
        self.assertIn("results", results)
    
    def test_profile_statistics(self):
        """Test profile statistics functionality"""
        # Add some data
        self.memory_interface.update_user_profile({
            "name": "Stats Test",
            "topics_of_interest": ["tech", "science"],
            "short_term_goals": ["learn python"]
        })
        
        stats = self.memory_interface.get_profile_statistics()
        self.assertIsInstance(stats, dict)
        self.assertIn("total_fields_filled", stats)
    
    def test_profile_export(self):
        """Test profile export functionality"""
        # Add some data
        self.memory_interface.update_user_profile({
            "name": "Export Test",
            "age": 28
        })
        
        # Export profile
        export_file = self.memory_interface.export_user_profile()
        self.assertTrue(os.path.exists(export_file))
        
        # Clean up
        os.unlink(export_file)


class TestMemorySystemIntegration(unittest.TestCase):
    """Integration tests for the complete memory system"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.temp_memory_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        self.temp_memory_file.close()
        
        self.memory_interface = EnhancedNovaMemoryInterface(
            memory_file=self.temp_memory_file.name,
            enable_logging=False
        )
    
    def tearDown(self):
        """Clean up test fixtures"""
        if os.path.exists(self.temp_memory_file.name):
            os.unlink(self.temp_memory_file.name)
        
        if os.path.exists("user_profile.json"):
            os.unlink("user_profile.json")
    
    def test_complete_conversation_flow(self):
        """Test complete conversation flow with profile updates and memory loading"""
        # Simulate a conversation
        user_message = "Hello, I'm John. I'm 30 years old and I work as a software engineer. I'm interested in AI and want to learn machine learning."
        ai_response = "Nice to meet you, John! It's great that you're interested in AI and machine learning. I'd be happy to help you learn more about these topics."
        
        # Process conversation
        result = self.memory_interface.process_conversation(user_message, ai_response)
        self.assertTrue(result.get("success", False))
        
        # Load memory context
        memory_context = self.memory_interface.load_memory("What do you know about me?")
        
        # Verify memory context includes profile data
        self.assertIn("user_profile_data", memory_context)
        self.assertIn("name", memory_context["user_profile_data"])
        self.assertEqual(memory_context["user_profile_data"]["name"], "John")
    
    def test_memory_cleanup_preservation(self):
        """Test that memory cleanup preserves essential user data"""
        # Add essential user data
        self.memory_interface.update_user_profile({
            "name": "Cleanup Test",
            "age": 25,
            "location": "Test City"
        })
        
        # Run cleanup
        cleanup_result = self.memory_interface.run_memory_cleanup("aggressive", dry_run=True)
        self.assertIsInstance(cleanup_result, dict)
        
        # Verify essential data is preserved
        profile = self.memory_interface.get_user_profile()
        self.assertEqual(profile["name"], "Cleanup Test")
        self.assertEqual(profile["age"], 25)


if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)
