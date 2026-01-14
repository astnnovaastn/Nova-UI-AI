#!/usr/bin/env python3
"""
🤖 JSON-TO-AI RUNNER
====================

This script reads user messages from a JSON file and sends them to the Nova AI
for processing. It supports various JSON formats and provides flexible configuration.

📋 SUPPORTED JSON FORMATS:
  1. Chat History Format:
     [{"role": "user", "content": "message"}, ...]
  
  2. Message Array Format:
     [{"message": "text"}, {"text": "content"}, ...]
  
  3. Direct Text Array:
     ["message 1", "message 2", ...]
  
  4. Object with Messages:
     {"messages": ["msg1", "msg2"], "user_queries": [...]}

🚀 USAGE:
  python run_ai_from_json.py                           # Use default chat_history.json
  python run_ai_from_json.py --file data/custom.json  # Use custom file
  python run_ai_from_json.py --file data/messages.json --output results.json
  python run_ai_from_json.py --interactive             # Interactive mode
  python run_ai_from_json.py --file data/chat.json --filter user --limit 5

📊 OPTIONS:
  --file <path>        Path to JSON file (default: data/chat_history.json)
  --output <path>      Save results to file (default: ai_json_responses.json)
  --interactive        Enable interactive mode (ask before processing)
  --filter <role>      Only process messages from specific role (user/assistant)
  --limit <n>          Process only first N messages
  --verbose            Show detailed processing info
  --no-save            Don't save results to file
  --pretty             Pretty-print JSON output

Author: Nova AI Development Team
Version: 1.0
"""

import json
import sys
import os
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import argparse

# Add the workspace root to path for imports
root_dir = Path(__file__).parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Import the Nova AI system
try:
    from astra_ai.core.nova_ai import AleChatBot
    print("✓ Successfully imported Nova AI system")
except ImportError:
    try:
        # Fallback import path
        sys.path.insert(0, str(root_dir / "astra_ai" / "core"))
        from nova_ai import AleChatBot
        print("✓ Successfully imported Nova AI system (fallback path)")
    except ImportError as e:
        print(f"✗ Error: Could not import Nova AI system")
        print(f"  {e}")
        sys.exit(1)


class JSONAIRunner:
    """Main class for processing JSON files and sending to AI"""
    
    def __init__(self, verbose: bool = False):
        """Initialize the JSON AI Runner"""
        self.verbose = verbose
        self.ai_bot = None
        self.results = []
        self.failed_messages = []
        self.session_start = datetime.now()
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamps"""
        if level == "INFO" or self.verbose:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"[{timestamp}] {level}: {message}")
    
    def _load_json_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Load and parse JSON file"""
        try:
            self.log(f"Loading JSON file: {file_path}")
            file_path = Path(file_path)
            
            if not file_path.exists():
                print(f"✗ Error: File not found: {file_path}")
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.log(f"Successfully loaded JSON file ({file_path.stat().st_size} bytes)")
            return data
        except json.JSONDecodeError as e:
            print(f"✗ Error: Invalid JSON format: {e}")
            return None
        except Exception as e:
            print(f"✗ Error loading file: {e}")
            return None
    
    def _extract_messages(self, data: Any, filter_role: Optional[str] = None, 
                         limit: Optional[int] = None) -> List[str]:
        """Extract user messages from various JSON formats"""
        messages = []
        
        try:
            # Format 1: Array of chat objects with role/content
            if isinstance(data, list) and data and isinstance(data[0], dict):
                if 'role' in data[0] and 'content' in data[0]:
                    self.log(f"Detected chat history format (role/content)")
                    for item in data:
                        if isinstance(item, dict):
                            # Filter by role if specified
                            if filter_role and item.get('role') != filter_role:
                                continue
                            # Only collect user messages if filtering for users
                            if filter_role == 'user' or (not filter_role and item.get('role') == 'user'):
                                content = item.get('content', '')
                                if content:
                                    messages.append(content)
                            elif not filter_role and item.get('role') != 'user':
                                # Skip non-user messages when not filtering
                                continue
                
                # Format 2: Array of message objects
                elif 'message' in data[0] or 'text' in data[0]:
                    self.log(f"Detected message object format")
                    for item in data:
                        msg = item.get('message') or item.get('text') or item.get('content')
                        if msg:
                            messages.append(msg)
                
                # Format 3: Direct object array with any text-like content
                else:
                    self.log(f"Detected generic object format")
                    for item in data:
                        if isinstance(item, str):
                            messages.append(item)
                        elif isinstance(item, dict):
                            # Try to find any text content
                            for key in ['message', 'text', 'content', 'msg', 'query', 'input']:
                                if key in item:
                                    messages.append(item[key])
                                    break
            
            # Format 4: Direct string array
            elif isinstance(data, list):
                self.log(f"Detected string array format")
                messages = [str(item) for item in data if item]
            
            # Format 5: Object with messages property
            elif isinstance(data, dict):
                # Check for common message container keys
                for key in ['messages', 'texts', 'queries', 'user_messages', 'inputs', 'content']:
                    if key in data:
                        items = data[key]
                        if isinstance(items, list):
                            self.log(f"Detected object format with '{key}' property")
                            messages = [str(item) for item in items if item]
                            break
                
                # If no messages found, try to extract single message
                if not messages:
                    for key in ['message', 'text', 'content', 'query', 'input']:
                        if key in data:
                            self.log(f"Detected single message object with '{key}' property")
                            messages = [data[key]]
                            break
            
            # Apply limit if specified
            if limit and messages:
                self.log(f"Limiting to first {limit} messages")
                messages = messages[:limit]
            
            self.log(f"Extracted {len(messages)} messages")
            return messages
        
        except Exception as e:
            print(f"✗ Error extracting messages: {e}")
            return []
    
    def _initialize_ai(self) -> bool:
        """Initialize the Nova AI bot"""
        try:
            self.log("Initializing Nova AI system...")
            # Get API key from environment
            api_key = os.getenv('GROQ_API_KEY') or os.getenv('LLM_API_KEY')
            
            if not api_key:
                print("⚠ Warning: No API key found in environment variables")
                print("  Set GROQ_API_KEY or LLM_API_KEY environment variable")
            
            self.ai_bot = AleChatBot(api_key=api_key)
            self.log("Nova AI system initialized successfully")
            return True
        except Exception as e:
            print(f"✗ Error initializing AI: {e}")
            return False
    
    async def _get_ai_response(self, user_message: str) -> Optional[str]:
        """Get response from AI for a single message"""
        try:
            if not self.ai_bot:
                return None
            
            # Create message format expected by AI
            messages = [
                {"role": "system", "content": "You are a helpful AI assistant. Respond concisely and naturally."},
                {"role": "user", "content": user_message}
            ]
            
            # Get response from AI
            response = await self.ai_bot.get_response(messages, stream_to_terminal=False)
            return response
        
        except Exception as e:
            self.log(f"Error getting AI response: {e}", "ERROR")
            self.failed_messages.append({"message": user_message, "error": str(e)})
            return None
    
    async def process_messages(self, messages: List[str], interactive: bool = False) -> List[Dict[str, Any]]:
        """Process all messages and get AI responses"""
        results = []
        
        if not messages:
            print("✗ No messages to process")
            return results
        
        print(f"\n{'='*70}")
        print(f"Processing {len(messages)} message(s) with Nova AI")
        print(f"{'='*70}\n")
        
        for idx, message in enumerate(messages, 1):
            # Truncate long messages for display
            display_msg = message[:100] + "..." if len(message) > 100 else message
            print(f"[{idx}/{len(messages)}] Processing: {display_msg}")
            
            # Interactive mode: ask before processing
            if interactive:
                response = input("  Process this message? (y/n): ").strip().lower()
                if response != 'y':
                    self.log(f"Skipped message {idx}")
                    continue
            
            # Get AI response
            ai_response = await self._get_ai_response(message)
            
            if ai_response:
                result = {
                    "message_id": idx,
                    "timestamp": datetime.now().isoformat(),
                    "user_message": message,
                    "ai_response": ai_response,
                    "status": "success"
                }
                results.append(result)
                print(f"  ✓ Response received ({len(ai_response)} chars)")
            else:
                result = {
                    "message_id": idx,
                    "timestamp": datetime.now().isoformat(),
                    "user_message": message,
                    "ai_response": None,
                    "status": "failed"
                }
                results.append(result)
                print(f"  ✗ Failed to get response")
            
            print()
        
        self.results = results
        return results
    
    def _save_results(self, output_file: str, pretty: bool = False) -> bool:
        """Save results to JSON file"""
        try:
            self.log(f"Saving results to: {output_file}")
            
            output_data = {
                "session_info": {
                    "start_time": self.session_start.isoformat(),
                    "end_time": datetime.now().isoformat(),
                    "total_messages": len(self.results),
                    "successful": len([r for r in self.results if r.get("status") == "success"]),
                    "failed": len([r for r in self.results if r.get("status") == "failed"]),
                    "failed_details": self.failed_messages
                },
                "results": self.results
            }
            
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w', encoding='utf-8') as f:
                if pretty:
                    json.dump(output_data, f, indent=2, ensure_ascii=False)
                else:
                    json.dump(output_data, f, ensure_ascii=False)
            
            self.log(f"Results saved successfully")
            return True
        except Exception as e:
            print(f"✗ Error saving results: {e}")
            return False
    
    def print_summary(self):
        """Print processing summary"""
        total = len(self.results)
        successful = len([r for r in self.results if r.get("status") == "success"])
        failed = len([r for r in self.results if r.get("status") == "failed"])
        
        print(f"\n{'='*70}")
        print(f"PROCESSING SUMMARY")
        print(f"{'='*70}")
        print(f"Total Messages:    {total}")
        print(f"Successful:        {successful} ({successful/total*100:.1f}%)" if total > 0 else "Successful:        0")
        print(f"Failed:            {failed} ({failed/total*100:.1f}%)" if total > 0 else "Failed:            0")
        print(f"Session Duration:  {(datetime.now() - self.session_start).total_seconds():.2f}s")
        print(f"{'='*70}\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Send JSON messages to Nova AI for processing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_ai_from_json.py
  python run_ai_from_json.py --file data/custom.json --output results.json
  python run_ai_from_json.py --file data/messages.json --limit 5 --verbose
  python run_ai_from_json.py --interactive --filter user
        """
    )
    
    parser.add_argument('--file', default='data/chat_history.json',
                       help='Path to JSON file (default: data/chat_history.json)')
    parser.add_argument('--output', default='ai_json_responses.json',
                       help='Output file for results (default: ai_json_responses.json)')
    parser.add_argument('--interactive', action='store_true',
                       help='Enable interactive mode (ask before processing)')
    parser.add_argument('--filter', choices=['user', 'assistant'],
                       help='Filter messages by role')
    parser.add_argument('--limit', type=int,
                       help='Process only first N messages')
    parser.add_argument('--verbose', action='store_true',
                       help='Show detailed processing info')
    parser.add_argument('--no-save', action='store_true',
                       help='Don\'t save results to file')
    parser.add_argument('--pretty', action='store_true',
                       help='Pretty-print JSON output')
    
    args = parser.parse_args()
    
    # Create runner
    runner = JSONAIRunner(verbose=args.verbose)
    
    # Load JSON file
    data = runner._load_json_file(args.file)
    if data is None:
        sys.exit(1)
    
    # Extract messages
    messages = runner._extract_messages(data, filter_role=args.filter, limit=args.limit)
    if not messages:
        print("✗ No messages found to process")
        sys.exit(1)
    
    # Initialize AI
    if not runner._initialize_ai():
        print("✗ Failed to initialize AI system")
        sys.exit(1)
    
    # Process messages
    try:
        results = asyncio.run(runner.process_messages(messages, interactive=args.interactive))
    except KeyboardInterrupt:
        print("\n✗ Processing interrupted by user")
        results = runner.results
    
    # Save results
    if not args.no_save:
        runner._save_results(args.output, pretty=args.pretty)
    
    # Print summary
    runner.print_summary()
    
    # Display results preview
    if results:
        print("RESULTS PREVIEW (First 3):")
        print("="*70)
        for result in results[:3]:
            print(f"User: {result['user_message'][:60]}...")
            print(f"AI:   {result['ai_response'][:60]}..." if result['ai_response'] else "AI:   [Failed]")
            print("-"*70)


if __name__ == "__main__":
    main()
