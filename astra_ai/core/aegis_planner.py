"""
Aegis AI Task Planner — Groq-based multi-step task decomposition
Adapts Aegis planner pattern to use Groq (llama-3.3-70b) instead of Gemini
"""

import json
import re
import os
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Tool declarations matching aegis_ai capabilities
AVAILABLE_TOOLS = {
    "browser_control": {
        "description": "ONLY use if the user says 'browser', 'chrome', or needs to WATCH/SEE something. Controls web browser for media playback (YouTube, SoundCloud) or visual interaction.",
        "actions": [
            "go_to", "search", "youtube_search_and_play", "soundcloud_search_and_play", 
            "spotify_search_and_play", "apple_music_search_and_play", "pinterest_search",
            "generic_search_and_click", "click", "type", "scroll", "screenshot", 
            "new_tab", "close_tab", "back", "forward", "reload", "close"
        ],
        "required_params": ["action"],
        "optional_params": ["url", "query", "selector", "text", "direction", "browser", "description"]
    },
    "computer_settings": {
        "description": "Controls system: volume, brightness, wifi, settings, file explorer, apps",
        "actions": ["volume_up", "volume_down", "volume_mute", "volume_set", "brightness_up", "brightness_down", "toggle_wifi", "toggle_bluetooth", "open_app", "close_app", "screenshot", "lock_screen", "shutdown", "restart"],
        "required_params": ["action"],
        "optional_params": ["value", "description", "app_name", "confirmed"]
    },
    "web_search": {
        "description": "PREFERRED for general info, facts, news, or questions. Uses SerpAPI (Fast, no browser window). Use this unless the user explicitly mentions 'browser' or 'chrome'.",
        "required_params": ["query"],
        "optional_params": ["summarize", "target_site"]
    },
    "file_controller": {
        "description": "Manages files: list, create, delete, read, write, find, move, copy, rename, disk_usage, organize_desktop, and visually search and open files in Windows Explorer",
        "actions": ["list", "create_file", "create_folder", "delete", "move", "copy", "rename", "read", "write", "find", "largest", "disk_usage", "organize_desktop", "search_and_open"],
        "required_params": ["action"],
        "optional_params": ["path", "name", "content", "destination", "new_name"]
    },
    "file_processor": {
        "description": "Processes files using system AI (Groq): describe images, OCR, summarize PDFs/docs, convert formats, analyze data (CSV/Excel), explain code, transcribe audio/video",
        "required_params": ["file_path"],
        "optional_params": ["action", "instruction", "format", "save"]
    },
    "code_helper": {
        "description": "Writes, runs, or explains code",
        "required_params": ["action"],
        "optional_params": ["description", "language", "file_path", "output_path"]
    },
    "conversation": {
        "description": "Normal AI conversation (default fallback)",
        "required_params": [],
        "optional_params": []
    }
}

PLANNER_SYSTEM_PROMPT = """You are Aegis AI's planning module. Your job is to break user requests into action steps.

Available tools and their capabilities:
- browser_control: 
    * actions: 
        - go_to (url): Navigate to a specific URL.
        - search (query): Search on Google.
        - youtube_search_and_play (query): Search and play a video on YouTube.
        - soundcloud_search_and_play (query): Search and play a track on SoundCloud.
        - spotify_search_and_play (query): Search and play music on Spotify.
        - apple_music_search_and_play (query): Search and play music on Apple Music.
        - pinterest_search (query): Search for pins on Pinterest.
        - generic_search_and_click (url, query): Go to a specific site and search for something then click the first result.
        - click (selector/text), type (text, selector), scroll (direction, amount), screenshot, new_tab, close_tab, back, forward, reload, close.
- computer_settings:
    * actions: volume_up, volume_down, volume_mute, volume_set (value 0-100), brightness_up, brightness_down, toggle_wifi, toggle_bluetooth, open_app (app_name), close_app, screenshot, lock_screen, shutdown, restart.
- web_search: Research and find information using SerpAPI.
- file_controller: Create, read, write, list files.
- code_helper: Write or run code.
- conversation: AI chat response.

PLANNING RULES:
1. Max 5 steps per plan.
2. If the user wants to play media (video, song, artist) on YouTube, SoundCloud, Spotify, or Apple Music, ALWAYS use the specialized action (e.g., youtube_search_and_play) as the VERY FIRST STEP.
   - Clean the search query: remove "Can you", "search for", "find", etc. Use only the subject (e.g., "Michael Jackson Billie Jean").
3. Handle "do the same on [site]" requests by identifying the previous subject (e.g., song/artist) from the context and applying it to the new site's specialized action.
4. For general web searches, use 'browser_control' with 'search' or 'generic_search_and_click' for single-step result opening.
5. Each step must specify: tool, description, parameters.
6. Return ONLY valid JSON.

Response Format:
{
  "goal": "user's goal",
  "steps": [
    {
      "step": 1,
      "tool": "tool_name",
      "description": "Detailed explanation of what this step does",
      "parameters": {"action": "specific_action", "param1": "value1"},
      "critical": true
    }
  ],
  "estimated_duration_seconds": number
}
"""

def _get_groq_client():
    """Get Groq client instance."""
    try:
        # Import our working groq client
        import sys
        import os

        # Add the root directory to the path to find groq_client_fix.py
        # Current file is at astra_ai/core/aegis_planner.py
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(current_dir))
        if root_dir not in sys.path:
            sys.path.insert(0, root_dir)

        from groq_client_fix import GroqClient
        
        api_key = GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        if not api_key:
            print("[Planner]  GROQ_API_KEY not set, planning disabled")
            return None
            
        return GroqClient(api_key=api_key)
    except ImportError:
        # Fallback to standard groq library
        try:
            from groq import Groq
            api_key = GROQ_API_KEY or os.getenv("GROQ_API_KEY")
            if not api_key:
                return None
            return Groq(api_key=api_key)
        except ImportError:
            print("[Planner]  Groq library not installed")
            return None
    except Exception as e:
        print(f"[Planner]  Failed to initialize Groq client: {e}")
        return None

def create_plan(goal: str, context: str = "") -> Optional[Dict[str, Any]]:
    """
    Break a user goal into action steps using Groq.
    
    Args:
        goal: User's request/goal
        context: Optional context about the user/conversation
    
    Returns:
        Dict with keys: goal, steps, estimated_duration_seconds
        Or None if planning fails (fallback to conversation)
    """
    client = _get_groq_client()
    if not client:
        return _fallback_plan(goal, "conversation")
    
    # Build the prompt
    tools_desc = "\n".join([
        f"- {name}: {info['description']} (Actions: {', '.join(info.get('actions', []))})"
        for name, info in AVAILABLE_TOOLS.items()
    ])
    
    user_prompt = f"""Goal: {goal}"""
    if context:
        user_prompt += f"\n\nContext: {context}"
    
    full_prompt = PLANNER_SYSTEM_PROMPT + f"\n\nAvailable Tools:\n{tools_desc}\n\n{user_prompt}"
    
    try:
        print(f"[Planner]  Planning goal: {goal[:60]}...")
        
        # Use a valid Groq model
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": full_prompt}],
            max_tokens=1500,
            temperature=0.1,  # Lower temp for more deterministic planning
            response_format={"type": "json_object"}
        )
        
        text = response.choices[0].message.content.strip()
        
        # Parse JSON
        plan = json.loads(text)
        
        # Validate plan structure
        if "steps" not in plan or not isinstance(plan["steps"], list):
            raise ValueError("Invalid plan: missing steps array")
        
        if not plan["steps"]:
            print("[Planner]  Empty plan, using conversation fallback")
            return _fallback_plan(goal, "conversation")
        
        # Ensure each step has required fields
        for step in plan["steps"]:
            if "tool" not in step:
                step["tool"] = "conversation"
            if "description" not in step:
                step["description"] = goal
            if "parameters" not in step:
                step["parameters"] = {}
            if "critical" not in step:
                step["critical"] = step["step"] == 1
        
        print(f"[Planner]  Created plan with {len(plan['steps'])} steps")
        for s in plan["steps"]:
            print(f"  Step {s['step']}: [{s['tool']}] {s['description'][:50]}")
        
        return plan
        
    except json.JSONDecodeError as e:
        print(f"[Planner]  JSON parse error: {e}")
        return _fallback_plan(goal, "conversation")
    except Exception as e:
        print(f"[Planner]  Planning failed: {e}")
        return _fallback_plan(goal, "conversation")

def _fallback_plan(goal: str, tool: str = "conversation") -> Dict[str, Any]:
    """Fallback plan when LLM planning fails."""
    print(f"[Planner]  Using fallback plan with {tool}")
    return {
        "goal": goal,
        "steps": [
            {
                "step": 1,
                "tool": tool,
                "description": goal,
                "parameters": {"description": goal} if tool == "conversation" else {},
                "critical": True
            }
        ],
        "estimated_duration_seconds": 5
    }

def replan(goal: str, completed_steps: List[Dict], failed_step: Dict, error: str) -> Optional[Dict[str, Any]]:
    """
    Revise plan after a step failure.
    
    Args:
        goal: Original user goal
        completed_steps: Steps that completed successfully
        failed_step: The step that failed
        error: Error message
    
    Returns:
        Revised plan or None
    """
    client = _get_groq_client()
    if not client:
        return _fallback_plan(goal)
    
    completed_summary = "\n".join([
        f"  - Step {s['step']} ({s['tool']}):  Done"
        for s in completed_steps
    ]) if completed_steps else "  (none)"
    
    replan_prompt = f"""Goal: {goal}

Already completed:
{completed_summary}

Failed step: [{failed_step.get('tool')}] {failed_step.get('description')}
Error: {error}

Create a REVISED plan for the remaining work. Do not repeat completed steps.
Return ONLY JSON with steps array."""
    
    try:
        print(f"[Planner]  Replanning after step {failed_step.get('step')} failure...")
        
        # Use a valid Groq model
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": PLANNER_SYSTEM_PROMPT + "\n\n" + replan_prompt}],
            max_tokens=1000,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        text = response.choices[0].message.content.strip()
        plan = json.loads(text)
        
        print(f"[Planner]  Revised plan: {len(plan['steps'])} steps")
        return plan
        
    except Exception as e:
        print(f"[Planner]  Replan failed: {e}")
        return _fallback_plan(goal)

# Tool-specific action keywords
BROWSER_KEYWORDS = ["youtube", "yt", "soundcloud", "spotify", "watch", "click", "browser", "chrome", "edge", "tab", "website", "on the web"]
COMPUTER_KEYWORDS = ["volume", "mute", "unmute", "brightness", "wifi", "bluetooth", "screenshot", "task manager", "settings", "shutdown", "restart", "app"]
FILE_KEYWORDS = ["file", "folder", "directory", "desktop", "downloads", "documents"]
SEARCH_KEYWORDS = ["search", "find", "who is", "what is", "tell me about", "look up", "info about", "news about", "weather in"]

def analyze_user_intent(user_message: str) -> Dict[str, Any]:
    """
    Analyze if user request needs multi-step planning or single tool call.
    """
    message_lower = user_message.lower()
    
    # Keywords indicating multi-step or tool-requiring work
    complex_keywords = [
        "research", "find and", "compare", "analyze",
        "create and", "build", "organize", "list and",
        "save", "download", "install",
        "schedule", "plan", "arrange"
    ]
    
    likely_tools = []
    
    # Check for browser intent - needs explicit browser mention or media sites
    if any(kw in message_lower for kw in BROWSER_KEYWORDS):
        likely_tools.append("browser_control")
    
    # Check for search intent
    if any(kw in message_lower for kw in SEARCH_KEYWORDS):
        # If no browser mentioned, prioritize web_search
        if "browser_control" not in likely_tools:
            likely_tools.append("web_search")
    
    if any(kw in message_lower for kw in COMPUTER_KEYWORDS):
        likely_tools.append("computer_settings")
    if any(kw in message_lower for kw in FILE_KEYWORDS):
        likely_tools.append("file_controller")
    if any(kw in message_lower for kw in ["code", "python", "script"]):
        likely_tools.append("code_helper")

    # Needs planning if multiple tools or complex keywords
    needs_planning = len(likely_tools) > 1 or any(kw in message_lower for kw in complex_keywords)
    
    # Also use planner if it's a file or computer action to handle parameters better
    if "file_controller" in likely_tools or "computer_settings" in likely_tools:
        needs_planning = True
        
    complexity = "simple"
    if needs_planning:
        complexity = "moderate" if len(likely_tools) <= 2 else "complex"
    
    if not likely_tools:
        likely_tools = ["conversation"]
    
    return {
        "needs_planning": needs_planning,
        "likely_tools": likely_tools,
        "complexity": complexity
    }
