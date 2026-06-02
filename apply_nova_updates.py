#!/usr/bin/env python
"""Update nova_ai.py with parameter extraction functions and improved dispatch logic."""

# Read the file
with open('astra_ai/core/nova_ai.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the helper functions to insert
new_functions = '''
    def _extract_site_from_message(self, text: str) -> str:
        """Extract website name from user message."""
        sites = {
            "youtube": "YouTube",
            "soundcloud": "SoundCloud",
            "spotify": "Spotify",
            "google": "Google",
            "facebook": "Facebook",
            "twitter": "Twitter",
            "instagram": "Instagram",
            "reddit": "Reddit",
            "linkedin": "LinkedIn",
        }
        normalized = text.lower()
        for key, val in sites.items():
            if key in normalized:
                return val
        return "that website"

    def _extract_browser_parameters(self, user_message: str) -> dict:
        """Extract browser action parameters from natural language.
        Returns dict with: action, url, query, browser, description
        """
        try:
            from astra_ai.actions.browser_control import _parse_browser_request
            parsed = _parse_browser_request(user_message)
            return parsed
        except Exception:
            return {"action": "search", "description": user_message}

    def _extract_computer_parameters(self, user_message: str) -> dict:
        """Extract computer settings parameters from natural language.
        Returns dict with: action, value, description
        """
        try:
            from astra_ai.actions.computer_settings import _detect_action
            detected = _detect_action(user_message)
            return detected
        except Exception:
            return {"action": "help", "description": user_message}'''

# Update summarize_tool_intent function
old_summary = '''    def summarize_tool_intent(self, text: str, category: str) -> str:
        normalized = text.lower().strip()
        if category == "browser_action":
            if "soundcloud" in normalized:
                return "I'm interpreting your request and will find the track on SoundCloud for you."
            if "youtube" in normalized or "yt" in normalized:
                return "I'm interpreting your request and will find that video on YouTube for you."
            if "search" in normalized and "google" in normalized:
                return "I'm interpreting your request and will search for it in the browser."
            return "I'm interpreting your browser request and taking action now."
        if category == "computer_settings_action":
            return "I'm interpreting your system request and will adjust the settings now."
        return "I'm understanding your request now."'''

new_summary = '''    def summarize_tool_intent(self, text: str, category: str) -> str:
        normalized = text.lower().strip()
        if category == "browser_action":
            if "soundcloud" in normalized:
                return "I'm going to SoundCloud to find and play that for you."
            if "youtube" in normalized or "yt" in normalized:
                return "I'm going to YouTube to find and play that for you."
            if "search" in normalized and "google" in normalized:
                return "I'm going to search Google for that information."
            if "open" in normalized or "go to" in normalized:
                site = self._extract_site_from_message(text)
                return f"I'm opening {site} for you."
            return "I'm controlling the browser now."
        if category == "computer_settings_action":
            if "volume" in normalized or "sound" in normalized:
                return "I'm adjusting the volume for you."
            if "brightness" in normalized or "screen" in normalized:
                return "I'm adjusting the brightness for you."
            if "settings" in normalized:
                return "I'm opening system settings for you."
            return "I'm adjusting the system settings now."
        return "I'm understanding your request now."'''

# Replace the summarize function
content = content.replace(old_summary, new_summary)

# Insert the helper functions after summarize_tool_intent (before _extract_basic_entities)
marker = '''    def _extract_basic_entities(self, text: str) -> List[ContextEntity]:
        """Basic entity extraction"""'''

replacement = new_functions + '''

    def _extract_basic_entities(self, text: str) -> List[ContextEntity]:
        """Basic entity extraction"""'''

content = content.replace(marker, replacement)

# Update the dispatch code for browser_action
old_browser_dispatch = '''                        intro = self.summarize_tool_intent(user_message, "browser_action")
                        result = browser_control_tool(parameters={"description": user_message})'''

new_browser_dispatch = '''                        intro = self.summarize_tool_intent(user_message, "browser_action")
                        params = self._extract_browser_parameters(user_message)
                        result = browser_control_tool(parameters=params)'''

content = content.replace(old_browser_dispatch, new_browser_dispatch)

# Update the dispatch code for computer_settings_action
old_computer_dispatch = '''                        intro = self.summarize_tool_intent(user_message, "computer_settings_action")
                        result = computer_settings_tool(parameters={"description": user_message})'''

new_computer_dispatch = '''                        intro = self.summarize_tool_intent(user_message, "computer_settings_action")
                        params = self._extract_computer_parameters(user_message)
                        result = computer_settings_tool(parameters=params)'''

content = content.replace(old_computer_dispatch, new_computer_dispatch)

# Write back the file
with open('astra_ai/core/nova_ai.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Successfully updated nova_ai.py with:")
print("  - Improved summarize_tool_intent() with more specific responses")
print("  - Added _extract_site_from_message()")
print("  - Added _extract_browser_parameters()")
print("  - Added _extract_computer_parameters()")
print("  - Updated browser action dispatch to use extracted parameters")
print("  - Updated computer settings dispatch to use extracted parameters")
