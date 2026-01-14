"""
Smart Persistent Command Framework for AI Behavior Customization

This module allows the AI to recognize, store, and apply user-defined behavioral commands
that persist across conversations, making the AI more adaptive and personalized.
"""

import json
import re
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

@dataclass
class PersistentCommand:
    """Represents a persistent command with its metadata."""
    id: str
    command_text: str
    command_type: str
    behavior_description: str
    trigger_patterns: List[str]
    is_active: bool
    created_at: str
    last_used: Optional[str] = None
    usage_count: int = 0
    mode_group: Optional[str] = None

class PersistentCommandManager:
    """Manages persistent commands for AI behavior customization."""
    
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.commands_file = os.path.join(data_dir, "persistent_commands.json")
        self.active_commands: Dict[str, PersistentCommand] = {}
        self.command_modes: Dict[str, List[str]] = {}  # Mode name -> command IDs
        self.current_mode: Optional[str] = None
        
        # Ensure data directory exists
        os.makedirs(data_dir, exist_ok=True)
        
        # Load existing commands
        self._load_commands()
        
        # Initialize command patterns
        self._initialize_command_patterns()
    
    def _initialize_command_patterns(self):
        """Initialize patterns for detecting different types of commands."""
        self.command_patterns = {
'formatting': {
        'patterns': [
            r'(?:keep|make|format|give).*(?:short|brief|concise|compact)',
            r'(?:summarize|break down|compress|simplify).*',
            r'(?:present|show|respond|reply).*(?:in|using).*(?:bullet|bullets|bullet points)',
            r'(?:one|single) (?:sentence|line|paragraph) (?:only|max)',
            r'(?:avoid|remove|don’t use|no).*?(?:emojis?|symbols?|unicode)',
            r'(?:format|present|respond).*?(?:like|as if|similar to).*(?:table|list|compact view|headings)',
            r'(?:minimize|strip|cut down).*?(?:text|explanations|length)'
        ],
        'examples': [
            "Give me short, concise answers",
            "Respond using bullet points",
            "One sentence answers only",
            "No emojis in your responses",
            "Keep everything compact and simplified"
        ]
    },

    'tone_style': {
        'patterns': [
            r'(?:talk|speak|explain|respond) (?:like|as if).*(?:i(\'m| am)?|i am|i’m) (?:a )?(?:child|kid|five|5|beginner|newbie|novice)',
            r'(?:use|speak in|respond in|explain in) (?:casual|technical|simple|professional|gen z|playful|neutral) (?:language|tone|style|vocabulary)?',
            r'(?:be|act|respond) (?:more|less)? (?:casual|formal|funny|strict|sarcastic|kind|neutral|professional)',
            r'(?:adjust|change|shift|switch).*?(?:tone|style|vibe).*?(?:to|into)'
        ],
        'examples': [
            "Talk like I'm five",
            "Explain things in simple terms",
            "Use a professional tone",
            "Speak casually like a friend",
            "Be more playful in your responses"
        ]
    },

    'content_behavior': {
        'patterns': [
            r'(?:always|from now on).*?(?:include|add|attach).*(?:examples?|use case|source|citation)',
            r'(?:never|don’t|stop).*?(?:explain|define|describe|elaborate|detail)',
            r'(?:start|begin) (?:every|each|all)? (?:response|reply|answer).*?(?:with|by).*',
            r'(?:end|finish|conclude).*?(?:reply|response|answer).*?(?:with|by).*',
            r'(?:make sure to|ensure you).*?(?:reference|cite|mention).*?(?:source|link|origin)',
            r'(?:highlight|emphasize).*?(?:key|main|important).*?(?:points|ideas|takeaways)'
        ],
        'examples': [
            "Always include a real-world example",
            "Never explain things in too much detail",
            "Start every response with a summary",
            "End with a list of takeaways",
            "Always mention sources or citations"
        ]
    },

    'search_behavior': {
        'patterns': [
            r'(?:keep|make|format).*?(?:search|lookup).*?(?:results|responses).*?(?:short|brief|concise|summarized)',
            r'(?:only|just|show).*?(?:one|single|\d+).*?(?:search|web|lookup).*?(?:result|hit|source)',
            r'(?:search|lookup|get info).*?(?:like|as if|similar to).*?(?:google|reddit|wikipedia|bing)',
            r'(?:summarize|reformat|structure).*?(?:results|articles|findings).*?(?:in|as).*?(?:points|table|summary)',
            r'(?:filter|prioritize|prefer).*?(?:recent|credible|popular|academic|official).*?(?:sources|links)'
        ],
        'examples': [
            "Keep search results short",
            "Give me only one result when searching",
            "Search like Google",
            "Summarize articles into bullet points",
            "Prefer official sources when searching"
        ]
    },

    'code_behavior': {
        'patterns': [
            r'(?:when|whenever|every time).*?(?:you )?(?:give|show|provide).*?(?:code).*?(?:just|only|don’t).*?(?:explain|describe|elaborate)',
            r'(?:just|only) (?:give|show).*?(?:code|script|solution)',
            r'(?:always|from now on).*?(?:comment|explain|annotate|document).*?(?:code|functions|scripts)',
            r'(?:use|write|stick to|limit).*?(?:only|just)? (?:python|javascript|java|typescript|c\+\+|html)',
            r'(?:avoid|don’t use).*?(?:boilerplate|extra comments|redundant code)',
            r'(?:give|format|display).*?(?:code).*?(?:as file|in markdown|clean|copyable)'
        ],
        'examples': [
            "When you give code, don't explain it",
            "Only provide the code",
            "Always comment your code",
            "Use only Python",
            "Avoid unnecessary comments in code"
        ]
    },

    'response_timing_behavior': {
        'patterns': [
            r'(?:respond|reply|answer) (?:quickly|instantly|immediately|after delay)',
            r'(?:wait|pause|delay).*?(?:before|after).*?(?:responding|replying)',
            r'(?:type|simulate).*?(?:typing|thinking|pauses)?',
            r'(?:act|respond).*?(?:like|as if).*?(?:you’re human|typing|taking time|deliberating)'
        ],
        'examples': [
            "Respond instantly",
            "Simulate thinking before you answer",
            "Add a short delay to make it feel natural"
        ]
    },

    'multi_language_behavior': {
        'patterns': [
            r'(?:always|from now on).*?(?:translate|provide|include).*?(?:translation|version) (?:in|to) (?P<lang>\w+)',
            r'(?:repeat|restate).*?(?:answer|response).*?(?:in|as) (?P<lang>\w+)',
            r'(?:switch|change).*?(?:language|response style) (?:to|into) (?P<lang>\w+)'
        ],
        'examples': [
            "Translate all responses into Spanish",
            "Repeat answers in French too",
            "Switch to Hindi responses"
        ]
    },

    'persona_behavior': {
        'patterns': [
            r'(?:act|respond|talk|roleplay) (?:like|as if|as) (?:a|an)? (?P<persona>[a-zA-Z ]+)',
            r'(?:pretend|imagine|roleplay).*?(?:you are|as) (?P<persona>[a-zA-Z ]+)',
            r'(?:use|mimic|copy).*?(?:style|speech|writing) (?:of|like) (?P<persona>[a-zA-Z ]+)',
        ],
        'examples': [
            "Act like a pirate",
            "Pretend you’re a Shakespearean poet",
            "Talk like Elon Musk explaining AI",
            "Respond as a medieval knight"
        ]
    }
}
    
    def detect_command(self, user_input: str) -> Optional[Tuple[str, str, List[str]]]:
        """
        Detect if user input contains a persistent command.
        
        Returns:
            Tuple of (command_type, behavior_description, trigger_patterns) or None
        """
        user_input_lower = user_input.lower().strip()
        
        # Check for command indicators
        command_indicators = [
            'from now on', 'whenever', 'always', 'never', 'don\'t ever',
            'keep', 'make sure', 'remember to', 'going forward'
        ]
        
        has_indicator = any(indicator in user_input_lower for indicator in command_indicators)
        
        if not has_indicator:
            return None
        
        # Check against command patterns
        for command_type, pattern_data in self.command_patterns.items():
            for pattern in pattern_data['patterns']:
                if re.search(pattern, user_input_lower):
                    # Extract the specific behavior description
                    behavior_desc = self._extract_behavior_description(user_input, command_type)
                    trigger_patterns = [pattern]
                    
                    return command_type, behavior_desc, trigger_patterns
        
        # If no specific pattern matched but has indicators, treat as general command
        if has_indicator:
            return 'general', user_input.strip(), []
        
        return None
    
    def _extract_behavior_description(self, user_input: str, command_type: str) -> str:
        """Extract a clean behavior description from user input."""
        # Remove command indicators and clean up
        indicators_to_remove = [
            'from now on', 'whenever', 'always', 'never', 'don\'t ever',
            'keep', 'make sure', 'remember to', 'going forward', 'you'
        ]
        
        cleaned = user_input.lower()
        for indicator in indicators_to_remove:
            cleaned = cleaned.replace(indicator, '').strip()
        
        # Clean up extra spaces and punctuation
        cleaned = re.sub(r'\s+', ' ', cleaned).strip(' .,!?')
        
        # Capitalize first letter
        if cleaned:
            cleaned = cleaned[0].upper() + cleaned[1:]
        
        return cleaned or user_input.strip()
    
    def add_command(self, user_input: str, command_type: str, behavior_description: str, 
                   trigger_patterns: List[str], mode_group: Optional[str] = None) -> str:
        """Add a new persistent command."""
        # Generate unique ID
        command_id = f"{command_type}_{len(self.active_commands)}_{int(datetime.now().timestamp())}"
        
        # Create command object
        command = PersistentCommand(
            id=command_id,
            command_text=user_input,
            command_type=command_type,
            behavior_description=behavior_description,
            trigger_patterns=trigger_patterns,
            is_active=True,
            created_at=datetime.now().isoformat(),
            mode_group=mode_group
        )
        
        # Store command
        self.active_commands[command_id] = command
        
        # Add to mode group if specified
        if mode_group:
            if mode_group not in self.command_modes:
                self.command_modes[mode_group] = []
            self.command_modes[mode_group].append(command_id)
        
        # Save to file
        self._save_commands()
        
        return command_id
    
    def remove_command(self, command_id: str) -> bool:
        """Remove a persistent command."""
        if command_id in self.active_commands:
            command = self.active_commands[command_id]
            
            # Remove from mode group if applicable
            if command.mode_group and command.mode_group in self.command_modes:
                if command_id in self.command_modes[command.mode_group]:
                    self.command_modes[command.mode_group].remove(command_id)
                    
                    # Remove empty mode group
                    if not self.command_modes[command.mode_group]:
                        del self.command_modes[command.mode_group]
            
            # Remove command
            del self.active_commands[command_id]
            self._save_commands()
            return True
        
        return False
    
    def deactivate_command(self, command_id: str) -> bool:
        """Deactivate a command without removing it."""
        if command_id in self.active_commands:
            self.active_commands[command_id].is_active = False
            self._save_commands()
            return True
        return False
    
    def activate_command(self, command_id: str) -> bool:
        """Activate a previously deactivated command."""
        if command_id in self.active_commands:
            self.active_commands[command_id].is_active = True
            self._save_commands()
            return True
        return False
    
    def get_active_commands(self) -> List[PersistentCommand]:
        """Get all currently active commands."""
        return [cmd for cmd in self.active_commands.values() if cmd.is_active]
    
    def get_commands_by_type(self, command_type: str) -> List[PersistentCommand]:
        """Get all active commands of a specific type."""
        return [cmd for cmd in self.active_commands.values() 
                if cmd.is_active and cmd.command_type == command_type]
    
    def apply_commands_to_response(self, response: str, context: str = "") -> str:
        """Apply all active commands to modify a response."""
        modified_response = response
        
        for command in self.get_active_commands():
            # Update usage statistics
            command.last_used = datetime.now().isoformat()
            command.usage_count += 1
            
            # Apply command based on type
            modified_response = self._apply_command(modified_response, command, context)
        
        self._save_commands()
        return modified_response
    
    def _apply_command(self, response: str, command: PersistentCommand, context: str) -> str:
        """Apply a specific command to modify the response."""
        command_type = command.command_type
        behavior = command.behavior_description.lower()
        
        try:
            if command_type == 'formatting':
                return self._apply_formatting_command(response, behavior)
            elif command_type == 'tone_style':
                return self._apply_tone_command(response, behavior)
            elif command_type == 'content_behavior':
                return self._apply_content_command(response, behavior, context)
            elif command_type == 'search_behavior':
                return self._apply_search_command(response, behavior, context)
            elif command_type == 'code_behavior':
                return self._apply_code_command(response, behavior)
            else:
                # General command - apply basic modifications
                return self._apply_general_command(response, behavior)
                
        except Exception as e:
            logger.error(f"Error applying command {command.id}: {e}")
            return response
    
    def _apply_formatting_command(self, response: str, behavior: str) -> str:
        """Apply formatting-related commands."""
        if 'short' in behavior or 'brief' in behavior or 'concise' in behavior:
            # Shorten the response
            sentences = response.split('. ')
            if len(sentences) > 3:
                response = '. '.join(sentences[:3]) + '.'
        
        elif 'bullet' in behavior or 'points' in behavior:
            # Convert to bullet points if not already
            if '•' not in response and '-' not in response.split('\n')[0]:
                sentences = [s.strip() for s in response.split('.') if s.strip()]
                if len(sentences) > 1:
                    response = '\n'.join([f"• {s}." for s in sentences[:5]])
        
        elif 'one sentence' in behavior or 'single sentence' in behavior:
            # Limit to one sentence
            first_sentence = response.split('.')[0]
            if first_sentence:
                response = first_sentence.strip() + '.'
        
        elif 'no emoji' in behavior:
            # Remove emojis (already implemented in your system)
            pass
        
        return response
    
    def _apply_tone_command(self, response: str, behavior: str) -> str:
        """Apply tone and style commands."""
        if 'beginner' in behavior or 'five' in behavior or 'simple' in behavior:
            # Simplify language (basic implementation)
            response = response.replace('utilize', 'use')
            response = response.replace('implement', 'do')
            response = response.replace('subsequently', 'then')
            response = response.replace('therefore', 'so')
        
        elif 'professional' in behavior:
            # Make more formal (basic implementation)
            response = response.replace("can't", "cannot")
            response = response.replace("won't", "will not")
            response = response.replace("don't", "do not")
        
        elif 'casual' in behavior:
            # Make more casual
            response = response.replace('However,', 'But')
            response = response.replace('Therefore,', 'So')
            response = response.replace('Additionally,', 'Also')
        
        return response
    
    def _apply_content_command(self, response: str, behavior: str, context: str) -> str:
        """Apply content behavior commands."""
        if 'include example' in behavior or 'real-world example' in behavior:
            if 'example:' not in response.lower() and 'for example' not in response.lower():
                response += "\n\nExample: [This would include a relevant real-world example based on the topic]"
        
        elif 'start with summary' in behavior:
            if not response.startswith('Summary:'):
                # Extract key point for summary
                first_sentence = response.split('.')[0]
                response = f"Summary: {first_sentence}.\n\n{response}"
        
        elif 'include source' in behavior:
            if 'source:' not in response.lower():
                response += "\n\nSource: Based on current knowledge and best practices."
        
        return response
    
    def _apply_search_command(self, response: str, behavior: str, context: str) -> str:
        """Apply search-specific commands."""
        if 'search' in context.lower():
            if 'short' in behavior or 'brief' in behavior:
                # Already handled by formatting commands
                pass
            elif 'one result' in behavior or 'single result' in behavior:
                # Limit to first result (would need integration with search system)
                pass
        
        return response
    
    def _apply_code_command(self, response: str, behavior: str) -> str:
        """Apply code-related commands."""
        if 'code' in response.lower() and ('don\'t explain' in behavior or 'no explain' in behavior):
            # Remove explanations, keep only code blocks
            lines = response.split('\n')
            code_lines = []
            in_code_block = False
            
            for line in lines:
                if '```' in line:
                    in_code_block = not in_code_block
                    code_lines.append(line)
                elif in_code_block:
                    code_lines.append(line)
            
            if code_lines:
                response = '\n'.join(code_lines)
        
        return response
    
    def _apply_general_command(self, response: str, behavior: str) -> str:
        """Apply general commands that don't fit specific categories."""
        # Basic implementation for general commands
        return response
    
    def create_mode(self, mode_name: str, command_ids: List[str]) -> bool:
        """Create a named mode with specific commands."""
        self.command_modes[mode_name] = command_ids
        self._save_commands()
        return True
    
    def switch_mode(self, mode_name: str) -> bool:
        """Switch to a specific mode, activating its commands."""
        if mode_name not in self.command_modes:
            return False
        
        # Deactivate all current commands
        for command in self.active_commands.values():
            command.is_active = False
        
        # Activate commands in the specified mode
        for command_id in self.command_modes[mode_name]:
            if command_id in self.active_commands:
                self.active_commands[command_id].is_active = True
        
        self.current_mode = mode_name
        self._save_commands()
        return True
    
    def list_commands(self) -> str:
        """Generate a formatted list of all active commands."""
        active_commands = self.get_active_commands()
        
        if not active_commands:
            return "No active commands currently set."
        
        result = "Active Commands:\n"
        result += "-" * 50 + "\n"
        
        # Group by type
        by_type = {}
        for cmd in active_commands:
            if cmd.command_type not in by_type:
                by_type[cmd.command_type] = []
            by_type[cmd.command_type].append(cmd)
        
        for cmd_type, commands in by_type.items():
            result += f"\n{cmd_type.replace('_', ' ').title()}:\n"
            for i, cmd in enumerate(commands, 1):
                result += f"  {i}. {cmd.behavior_description}\n"
                result += f"     (Used {cmd.usage_count} times)\n"
        
        if self.current_mode:
            result += f"\nCurrent Mode: {self.current_mode}\n"
        
        return result
    
    def find_command_to_remove(self, user_input: str) -> Optional[str]:
        """Find a command to remove based on user input."""
        user_input_lower = user_input.lower()
        
        # Look for removal keywords
        removal_keywords = ['forget', 'remove', 'stop', 'cancel', 'disable', 'turn off']
        
        if not any(keyword in user_input_lower for keyword in removal_keywords):
            return None
        
        # Try to match against existing command descriptions
        for command_id, command in self.active_commands.items():
            if command.is_active:
                # Check if user input references this command
                behavior_words = command.behavior_description.lower().split()
                if any(word in user_input_lower for word in behavior_words if len(word) > 3):
                    return command_id
        
        return None
    
    def _load_commands(self):
        """Load commands from file."""
        try:
            if os.path.exists(self.commands_file):
                with open(self.commands_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Load commands
                    commands_data = data.get('commands', {})
                    for cmd_id, cmd_data in commands_data.items():
                        self.active_commands[cmd_id] = PersistentCommand(**cmd_data)
                    
                    # Load modes
                    self.command_modes = data.get('modes', {})
                    self.current_mode = data.get('current_mode')
                    
        except Exception as e:
            logger.error(f"Error loading commands: {e}")
    
    def _save_commands(self):
        """Save commands to file."""
        try:
            data = {
                'commands': {cmd_id: asdict(cmd) for cmd_id, cmd in self.active_commands.items()},
                'modes': self.command_modes,
                'current_mode': self.current_mode,
                'last_updated': datetime.now().isoformat()
            }
            
            with open(self.commands_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"Error saving commands: {e}")