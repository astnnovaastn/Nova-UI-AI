#!/usr/bin/env python3
"""
Memory Processing Pipeline
Processes organizer summaries every 15 minutes and sends them to Nova AI
"""

import os
import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class MemoryProcessingPipeline:
    """
    Processes organizer summaries every 15 minutes and sends them to Nova AI
    """
    
    def __init__(self, memory_system, nova_ai_instance=None):
        """
        Initialize the memory processing pipeline
        
        Args:
            memory_system: Reference to the memory system
            nova_ai_instance: Reference to Nova AI instance (optional)
        """
        self.memory_system = memory_system
        self.nova_ai = nova_ai_instance
        self.processing_interval = 15 * 60  # 15 minutes in seconds
        self.last_processed_time = None
        self.processing_thread = None
        self.is_running = False
        self.organizer_summaries_dir = os.path.join("astra_ai", "Date", "organizer_summaries")
        
        # Track processed summaries to avoid duplicates
        self.processed_summaries = set()
        
    def start_processing(self):
        """Start the background processing thread"""
        if self.is_running:
            logger.warning("Memory processing pipeline is already running")
            return
            
        self.is_running = True
        self.processing_thread = threading.Thread(target=self._processing_loop, daemon=True)
        self.processing_thread.start()
        logger.info("[MEMORY-PIPELINE] Started 15-minute memory processing pipeline")
        
    def stop_processing(self):
        """Stop the background processing thread"""
        self.is_running = False
        if self.processing_thread:
            self.processing_thread.join(timeout=5)
        logger.info("[MEMORY-PIPELINE] Stopped memory processing pipeline")
        
    def _processing_loop(self):
        """Main processing loop that runs every 15 minutes"""
        while self.is_running:
            try:
                self.process_organizer_summaries()
                time.sleep(self.processing_interval)
            except Exception as e:
                logger.error(f"[MEMORY-PIPELINE] Error in processing loop: {e}")
                time.sleep(60)  # Wait 1 minute before retrying
                
    def process_organizer_summaries(self):
        """
        Process all organizer summaries and send them to Nova AI
        """
        try:
            # Get all summary files
            summary_files = self._get_summary_files()
            
            if not summary_files:
                logger.debug("[MEMORY-PIPELINE] No organizer summaries found")
                return
                
            processed_count = 0
            for file_path in summary_files:
                if self._process_summary_file(file_path):
                    processed_count += 1
                    
            if processed_count > 0:
                logger.info(f"[MEMORY-PIPELINE] Processed {processed_count} organizer summaries")
                
        except Exception as e:
            logger.error(f"[MEMORY-PIPELINE] Error processing organizer summaries: {e}")
            
    def _get_summary_files(self) -> List[str]:
        """Get all organizer summary files"""
        if not os.path.exists(self.organizer_summaries_dir):
            return []
            
        summary_files = []
        for filename in os.listdir(self.organizer_summaries_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(self.organizer_summaries_dir, filename)
                if os.path.isfile(file_path):
                    summary_files.append(file_path)
                    
        return summary_files
        
    def _process_summary_file(self, file_path: str) -> bool:
        """
        Process a single organizer summary file
        
        Args:
            file_path: Path to the summary file
            
        Returns:
            True if successfully processed, False otherwise
        """
        try:
            # Check if already processed
            if file_path in self.processed_summaries:
                return False
                
            # Load the summary
            with open(file_path, 'r', encoding='utf-8') as f:
                summary_data = json.load(f)
                
            # Extract key information
            date = summary_data.get('date')
            daily_summary = summary_data.get('daily_summary', '')
            important_facts = summary_data.get('important_user_facts', [])
            session_ids = summary_data.get('session_ids', [])
            
            if not date:
                logger.warning(f"[MEMORY-PIPELINE] No date found in {file_path}")
                return False
                
            # Create memory context for Nova AI
            memory_context = self._create_memory_context(
                date=date,
                daily_summary=daily_summary,
                important_facts=important_facts,
                session_ids=session_ids
            )
            
            # Send to Nova AI
            if self.nova_ai:
                self._send_to_nova_ai(memory_context)
            else:
                # Store in memory system for later retrieval
                self._store_memory_context(memory_context)
                
            # Mark as processed
            self.processed_summaries.add(file_path)
            logger.info(f"[MEMORY-PIPELINE] Processed summary for {date}")
            return True
            
        except Exception as e:
            logger.error(f"[MEMORY-PIPELINE] Error processing {file_path}: {e}")
            return False
            
    def _create_memory_context(self, date: str, daily_summary: str, important_facts: List[str], session_ids: List[str]) -> Dict[str, Any]:
        """
        Create memory context from organizer summary
        
        Args:
            date: Date of the sessions
            daily_summary: Daily summary from organizer
            important_facts: List of important user facts
            session_ids: List of session IDs
            
        Returns:
            Memory context dictionary
        """
        return {
            "type": "daily_memory_context",
            "date": date,
            "daily_summary": daily_summary,
            "important_user_facts": important_facts,
            "session_ids": session_ids,
            "processed_at": datetime.now().isoformat(),
            "context_strength": self._calculate_context_strength(important_facts, daily_summary)
        }
        
    def _calculate_context_strength(self, important_facts: List[str], daily_summary: str) -> float:
        """
        Calculate the strength/importance of the memory context
        
        Args:
            important_facts: List of important facts
            daily_summary: Daily summary text
            
        Returns:
            Strength score between 0.0 and 1.0
        """
        strength = 0.5  # Base strength
        
        # Boost for important facts
        strength += len(important_facts) * 0.1
        
        # Boost for detailed summary
        if len(daily_summary) > 100:
            strength += 0.1
            
        # Cap at 1.0
        return min(strength, 1.0)
        
    def _send_to_nova_ai(self, memory_context: Dict[str, Any]):
        """
        Send memory context to Nova AI
        
        Args:
            memory_context: Memory context to send
        """
        try:
            # Format the context for Nova AI
            formatted_context = self._format_for_nova_ai(memory_context)
            
            # Send to Nova AI (this would be implemented based on Nova AI's interface)
            if hasattr(self.nova_ai, 'receive_memory_context'):
                self.nova_ai.receive_memory_context(formatted_context)
            elif hasattr(self.nova_ai, 'update_memory_context'):
                self.nova_ai.update_memory_context(formatted_context)
            else:
                logger.warning("[MEMORY-PIPELINE] Nova AI doesn't have memory context interface")
                
        except Exception as e:
            logger.error(f"[MEMORY-PIPELINE] Error sending to Nova AI: {e}")
            
    def _format_for_nova_ai(self, memory_context: Dict[str, Any]) -> str:
        """
        Format memory context for Nova AI consumption
        
        Args:
            memory_context: Memory context dictionary
            
        Returns:
            Formatted string for Nova AI
        """
        date = memory_context.get('date', 'Unknown date')
        summary = memory_context.get('daily_summary', '')
        facts = memory_context.get('important_user_facts', [])
        
        formatted = f"📅 Daily Memory Context - {date}\n"
        formatted += f"📝 Summary: {summary}\n"
        
        if facts:
            formatted += f"🔑 Important Facts:\n"
            for i, fact in enumerate(facts, 1):
                formatted += f"  {i}. {fact}\n"
                
        formatted += f"💪 Context Strength: {memory_context.get('context_strength', 0.5):.2f}\n"
        formatted += f"⏰ Processed: {memory_context.get('processed_at', '')}\n"
        
        return formatted
        
    def _store_memory_context(self, memory_context: Dict[str, Any]):
        """
        Store memory context in memory system for later retrieval
        
        Args:
            memory_context: Memory context to store
        """
        try:
            if self.memory_system:
                # Store as a special memory event
                self.memory_system.add_memory_event(
                    summary=f"Daily memory context for {memory_context.get('date')}",
                    category="memory_context",
                    context=json.dumps(memory_context),
                    importance_score=memory_context.get('context_strength', 0.5)
                )
                logger.info(f"[MEMORY-PIPELINE] Stored memory context for {memory_context.get('date')}")
        except Exception as e:
            logger.error(f"[MEMORY-PIPELINE] Error storing memory context: {e}")
            
    def process_now(self):
        """
        Manually trigger processing of organizer summaries
        """
        logger.info("[MEMORY-PIPELINE] Manual processing triggered")
        self.process_organizer_summaries()
        
    def get_processed_summaries(self) -> List[str]:
        """
        Get list of processed summary files
        
        Returns:
            List of processed file paths
        """
        return list(self.processed_summaries)
        
    def clear_processed_cache(self):
        """Clear the processed summaries cache"""
        self.processed_summaries.clear()
        logger.info("[MEMORY-PIPELINE] Cleared processed summaries cache")
