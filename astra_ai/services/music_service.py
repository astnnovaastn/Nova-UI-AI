#!/usr/bin/env python3
"""
🎵 NOVA AI MUSIC SERVICE
========================

Advanced music system for Nova AI with voice command processing, music search,
and lyrics display capabilities.

Features:
- Natural language music request processing
- YouTube Music search integration
- Lyrics fetching and display
- Music playback control commands
- Copyright-compliant lyrics handling

Author: Nova AI Development Team
Version: 1.0
License: MIT
"""

import asyncio
import json
import logging
import os
import re
import requests
import subprocess
import sys
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import quote_plus
import webbrowser
from dataclasses import dataclass
from pathlib import Path

# Audio playback libraries (with fallbacks)
try:
    import pygame
    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False

try:
    import vlc
    VLC_AVAILABLE = True
except ImportError:
    VLC_AVAILABLE = False

try:
    from playsound import playsound
    PLAYSOUND_AVAILABLE = True
except ImportError:
    PLAYSOUND_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class MusicTrack:
    """Represents a music track with metadata"""
    title: str
    artist: str
    video_id: str
    duration: str
    thumbnail: str
    url: str
    description: str = ""
    view_count: str = ""
    published_at: str = ""
    # Enhanced fields for direct playback
    audio_url: Optional[str] = None
    local_file: Optional[str] = None
    source_type: str = "youtube"  # youtube, jamendo, freemusicarchive, etc.
    license_type: str = "standard"  # creative_commons, public_domain, standard
    is_playable_direct: bool = False

@dataclass
class LyricsResult:
    """Represents lyrics search result"""
    title: str
    artist: str
    lyrics_preview: str  # Short preview only for copyright compliance
    source: str
    full_lyrics_available: bool = False

@dataclass
class AudioPlayer:
    """Represents the audio player state"""
    is_playing: bool = False
    is_paused: bool = False
    current_track: Optional[MusicTrack] = None
    position: float = 0.0
    volume: float = 0.7
    player_instance: Any = None
    player_type: str = "none"  # pygame, vlc, playsound, system

class MusicService:
    """Service for handling music requests, search, and playback."""
    
    def __init__(self, youtube_api_key: str):
        """Initialize the music service.
        
        Args:
            youtube_api_key: YouTube Data API v3 key for music search
        """
        self.youtube_api_key = youtube_api_key
        self.youtube_base_url = "https://www.googleapis.com/youtube/v3"
        self.current_track = None
        self.playback_history = []

        # Enhanced audio player
        self.audio_player = AudioPlayer()
        self.music_cache_dir = Path("music_cache")
        self.music_cache_dir.mkdir(exist_ok=True)

        # Initialize audio player
        self._initialize_audio_player()

        # Legal music sources
        self.legal_sources = {
            'jamendo': 'https://api.jamendo.com/v3.0',
            'freemusicarchive': 'https://freemusicarchive.org/api',
            'internetarchive': 'https://archive.org/advancedsearch.php'
        }
        
        # Music command patterns for natural language processing
        self.music_patterns = {
            'play': [
                r'(?:hey\s+)?(?:nova|ai)?\s*,?\s*play\s+(.+)',
                r'(?:can you|could you)\s+play\s+(.+)',
                r'i want to (?:hear|listen to)\s+(.+)',
                r'put on\s+(.+)',
                r'start playing\s+(.+)',
                r'play me\s+(.+)',
                r'find and play\s+(.+)'
            ],
            'search': [
                r'(?:search for|find|look for)\s+(?:the song|music|track)?\s*(.+)',
                r'do you know\s+(?:the song|track)?\s*(.+)',
                r'have you heard\s+(?:of\s+)?(.+)'
            ],
            'lyrics': [
                r'(?:show|display|get)\s+(?:me\s+)?(?:the\s+)?lyrics\s+(?:for|of|to)?\s*(.+)',
                r'what are the lyrics\s+(?:for|of|to)\s+(.+)',
                r'lyrics\s+(?:for|of|to)\s+(.+)',
                r'sing\s+(.+)',
                r'(?:show|tell) me the words to\s+(.+)'
            ],
            'control': [
                r'(?:pause|stop)\s+(?:the\s+)?music',
                r'(?:resume|continue|unpause)\s+(?:the\s+)?music',
                r'(?:skip|next)\s+(?:song|track)',
                r'(?:previous|back|last)\s+(?:song|track)',
                r'(?:turn up|increase|raise)\s+(?:the\s+)?volume',
                r'(?:turn down|decrease|lower)\s+(?:the\s+)?volume'
            ]
        }
        
    def is_music_request(self, message: str) -> bool:
        """Check if a message is a music-related request."""
        message_lower = message.lower()
        
        # Check for music keywords
        music_keywords = [
            'play', 'music', 'song', 'track', 'artist', 'album', 'lyrics',
            'sing', 'listen', 'hear', 'tune', 'melody', 'beat', 'rhythm'
        ]
        
        # Check for any music patterns
        for category, patterns in self.music_patterns.items():
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    return True
        
        # Check for music keywords
        return any(keyword in message_lower for keyword in music_keywords)
    
    def parse_music_command(self, message: str) -> Tuple[str, str, Dict[str, Any]]:
        """Parse a music command and extract intent and parameters.
        
        Returns:
            Tuple of (command_type, query, parameters)
        """
        message_lower = message.lower()
        
        # Check each command type
        for command_type, patterns in self.music_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, message_lower)
                if match:
                    if command_type in ['play', 'search', 'lyrics']:
                        query = match.group(1).strip()
                        return command_type, query, {}
                    else:
                        return command_type, "", {}
        
        # Default to search if contains music keywords
        if self.is_music_request(message):
            # Extract potential song/artist from message
            query = re.sub(r'(?:find|search|look for|play|music|song|track)', '', message_lower).strip()
            return 'search', query, {}
        
        return 'unknown', message, {}
    
    async def search_music(self, query: str, max_results: int = 5) -> List[MusicTrack]:
        """Search for music using YouTube Data API.
        
        Args:
            query: Search query (song name, artist, etc.)
            max_results: Maximum number of results to return
            
        Returns:
            List of MusicTrack objects
        """
        try:
            # Clean and prepare the search query
            clean_query = self._clean_search_query(query)
            
            # YouTube Data API search parameters
            params = {
                'part': 'snippet',
                'q': f"{clean_query} music",
                'type': 'video',
                'videoCategoryId': '10',  # Music category
                'maxResults': max_results,
                'order': 'relevance',
                'key': self.youtube_api_key
            }
            
            # Make API request
            search_url = f"{self.youtube_base_url}/search"
            response = requests.get(search_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            tracks = []
            
            # Process search results
            for item in data.get('items', []):
                try:
                    video_id = item['id']['videoId']
                    snippet = item['snippet']
                    
                    # Get additional video details
                    video_details = await self._get_video_details(video_id)
                    
                    track = MusicTrack(
                        title=snippet['title'],
                        artist=self._extract_artist_from_title(snippet['title']),
                        video_id=video_id,
                        duration=video_details.get('duration', 'Unknown'),
                        thumbnail=snippet['thumbnails']['medium']['url'],
                        url=f"https://www.youtube.com/watch?v={video_id}",
                        description=snippet['description'][:200] + "..." if len(snippet['description']) > 200 else snippet['description'],
                        view_count=video_details.get('view_count', 'Unknown'),
                        published_at=snippet['publishedAt']
                    )
                    tracks.append(track)
                    
                except Exception as e:
                    logger.warning(f"Error processing search result: {e}")
                    continue
            
            return tracks

        except Exception as e:
            logger.error(f"Error searching for music: {e}")
            return []

    async def search_legal_music(self, query: str, max_results: int = 3) -> List[MusicTrack]:
        """Search for legally playable music from free sources.

        Args:
            query: Search query
            max_results: Maximum results to return

        Returns:
            List of legally playable tracks
        """
        legal_tracks = []

        try:
            # Search Jamendo (Creative Commons music)
            jamendo_tracks = await self._search_jamendo(query, max_results)
            legal_tracks.extend(jamendo_tracks)

            # Search Internet Archive (Public domain)
            if len(legal_tracks) < max_results:
                archive_tracks = await self._search_internet_archive(query, max_results - len(legal_tracks))
                legal_tracks.extend(archive_tracks)

            return legal_tracks[:max_results]

        except Exception as e:
            logger.error(f"Error searching legal music: {e}")
            return []

    async def _search_jamendo(self, query: str, max_results: int) -> List[MusicTrack]:
        """Search Jamendo for Creative Commons music."""
        try:
            # Jamendo API (free tier available)
            # Note: This is a simplified example - you'd need to register for API access
            url = f"{self.legal_sources['jamendo']}/tracks"
            params = {
                'client_id': 'your_jamendo_client_id',  # Would need registration
                'format': 'json',
                'search': query,
                'limit': max_results,
                'include': 'musicinfo'
            }

            # For demo purposes, return mock data
            # In production, you'd make the actual API call
            mock_tracks = []
            for i in range(min(2, max_results)):
                track = MusicTrack(
                    title=f"Sample Track {i+1} - {query}",
                    artist="Independent Artist",
                    video_id=f"jamendo_{i}",
                    duration="3:30",
                    thumbnail="https://example.com/thumb.jpg",
                    url=f"https://jamendo.com/track/{i}",
                    audio_url=f"https://example.com/audio_{i}.mp3",  # Would be real URL
                    source_type="jamendo",
                    license_type="creative_commons",
                    is_playable_direct=True
                )
                mock_tracks.append(track)

            return mock_tracks

        except Exception as e:
            logger.error(f"Error searching Jamendo: {e}")
            return []

    async def _search_internet_archive(self, query: str, max_results: int) -> List[MusicTrack]:
        """Search Internet Archive for public domain music."""
        try:
            # Internet Archive API for public domain music
            url = self.legal_sources['internetarchive']
            params = {
                'q': f'collection:opensource_audio AND {query}',
                'fl': 'identifier,title,creator,description',
                'rows': max_results,
                'output': 'json'
            }

            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            tracks = []
            for item in data.get('response', {}).get('docs', []):
                track = MusicTrack(
                    title=item.get('title', ['Unknown'])[0] if isinstance(item.get('title'), list) else item.get('title', 'Unknown'),
                    artist=item.get('creator', ['Unknown'])[0] if isinstance(item.get('creator'), list) else item.get('creator', 'Unknown'),
                    video_id=item.get('identifier', ''),
                    duration="Unknown",
                    thumbnail="",
                    url=f"https://archive.org/details/{item.get('identifier', '')}",
                    audio_url=f"https://archive.org/download/{item.get('identifier', '')}/{item.get('identifier', '')}.mp3",
                    source_type="internetarchive",
                    license_type="public_domain",
                    is_playable_direct=True
                )
                tracks.append(track)

            return tracks

        except Exception as e:
            logger.error(f"Error searching Internet Archive: {e}")
            return []
    
    async def _get_video_details(self, video_id: str) -> Dict[str, Any]:
        """Get additional details for a video."""
        try:
            params = {
                'part': 'contentDetails,statistics',
                'id': video_id,
                'key': self.youtube_api_key
            }
            
            url = f"{self.youtube_base_url}/videos"
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            if data.get('items'):
                item = data['items'][0]
                return {
                    'duration': self._parse_duration(item['contentDetails']['duration']),
                    'view_count': self._format_view_count(item['statistics'].get('viewCount', '0'))
                }
        except Exception as e:
            logger.warning(f"Error getting video details: {e}")
        
        return {}
    
    def _clean_search_query(self, query: str) -> str:
        """Clean and optimize search query for better results."""
        # Remove common filler words
        filler_words = ['the', 'a', 'an', 'by', 'from', 'with', 'and', 'or']
        words = query.split()
        cleaned_words = [word for word in words if word.lower() not in filler_words or len(words) <= 3]
        
        # Join back and clean up
        cleaned = ' '.join(cleaned_words)
        cleaned = re.sub(r'[^\w\s-]', '', cleaned)  # Remove special characters except hyphens
        
        return cleaned.strip()

    def _initialize_audio_player(self):
        """Initialize the best available audio player."""
        try:
            if PYGAME_AVAILABLE:
                pygame.mixer.init()
                self.audio_player.player_type = "pygame"
                logger.info("✅ Pygame audio player initialized")
            elif VLC_AVAILABLE:
                self.audio_player.player_instance = vlc.Instance()
                self.audio_player.player_type = "vlc"
                logger.info("✅ VLC audio player initialized")
            elif PLAYSOUND_AVAILABLE:
                self.audio_player.player_type = "playsound"
                logger.info("✅ Playsound audio player initialized")
            else:
                self.audio_player.player_type = "system"
                logger.info("⚠️ Using system audio player (limited functionality)")
        except Exception as e:
            logger.error(f"Failed to initialize audio player: {e}")
            self.audio_player.player_type = "system"

    def _extract_artist_from_title(self, title: str) -> str:
        """Extract artist name from video title."""
        # Common patterns for artist extraction
        patterns = [
            r'^([^-]+)\s*-',  # Artist - Song
            r'by\s+([^(]+)',  # by Artist
            r'^([^|]+)\s*\|', # Artist | Song
        ]
        
        for pattern in patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                artist = match.group(1).strip()
                # Clean up common suffixes
                artist = re.sub(r'\s*(official|music|video|mv|audio|lyrics).*$', '', artist, flags=re.IGNORECASE)
                return artist
        
        # Fallback: use first part of title
        parts = title.split('-')
        if len(parts) > 1:
            return parts[0].strip()
        
        return "Unknown Artist"
    
    def _parse_duration(self, duration_str: str) -> str:
        """Parse ISO 8601 duration to readable format."""
        try:
            # Simple parsing for PT#M#S format
            match = re.search(r'PT(?:(\d+)M)?(?:(\d+)S)?', duration_str)
            if match:
                minutes = int(match.group(1) or 0)
                seconds = int(match.group(2) or 0)
                return f"{minutes}:{seconds:02d}"
        except:
            pass
        return "Unknown"
    
    def _format_view_count(self, view_count: str) -> str:
        """Format view count to readable format."""
        try:
            count = int(view_count)
            if count >= 1_000_000_000:
                return f"{count/1_000_000_000:.1f}B views"
            elif count >= 1_000_000:
                return f"{count/1_000_000:.1f}M views"
            elif count >= 1_000:
                return f"{count/1_000:.1f}K views"
            else:
                return f"{count} views"
        except:
            return "Unknown views"
    
    async def get_lyrics_preview(self, track: MusicTrack) -> Optional[LyricsResult]:
        """Get a brief lyrics preview for copyright compliance.
        
        Note: This returns only a short preview to comply with copyright.
        For full lyrics, users are directed to official sources.
        """
        try:
            # For copyright compliance, we only provide brief previews
            # and direct users to official sources
            
            lyrics_result = LyricsResult(
                title=track.title,
                artist=track.artist,
                lyrics_preview="🎵 Lyrics preview not available - respecting copyright. 🎵",
                source="Copyright Protected",
                full_lyrics_available=False
            )
            
            return lyrics_result
            
        except Exception as e:
            logger.error(f"Error getting lyrics preview: {e}")
            return None
    
    def play_music(self, track: MusicTrack) -> str:
        """Initiate music playback by opening in browser.
        
        Args:
            track: MusicTrack to play
            
        Returns:
            Status message
        """
        try:
            # Open YouTube video in default browser
            webbrowser.open(track.url)
            
            # Update current track and history
            self.current_track = track
            self.playback_history.append({
                'track': track,
                'played_at': datetime.now().isoformat(),
                'action': 'play'
            })
            
            return f"🎵 Now playing: {track.title} by {track.artist}"
            
        except Exception as e:
            logger.error(f"Error playing music: {e}")
            return f"❌ Sorry, I couldn't play that track: {str(e)}"

    async def play_audio_direct(self, track: MusicTrack) -> str:
        """Play audio directly in terminal using available audio libraries.

        Args:
            track: MusicTrack with audio_url for direct playback

        Returns:
            Status message
        """
        if not track.is_playable_direct or not track.audio_url:
            return "❌ This track cannot be played directly. Opening in browser instead..."

        try:
            # Stop any currently playing audio
            self.stop_audio()

            # Download audio file if needed
            local_file = await self._get_audio_file(track)
            if not local_file:
                return "❌ Could not download audio file for playback"

            # Play using the best available method
            success = False

            if self.audio_player.player_type == "pygame" and PYGAME_AVAILABLE:
                success = self._play_with_pygame(local_file)
            elif self.audio_player.player_type == "vlc" and VLC_AVAILABLE:
                success = self._play_with_vlc(local_file)
            elif self.audio_player.player_type == "playsound" and PLAYSOUND_AVAILABLE:
                success = self._play_with_playsound(local_file)
            else:
                success = self._play_with_system(local_file)

            if success:
                self.audio_player.current_track = track
                self.audio_player.is_playing = True
                self.current_track = track

                self.playback_history.append({
                    'track': track,
                    'played_at': datetime.now().isoformat(),
                    'action': 'play_direct'
                })

                return f"🎵 Now playing directly: {track.title} by {track.artist}\n💡 Use voice commands: 'pause music', 'stop music', 'resume music'"
            else:
                return "❌ Could not start audio playback. Check your audio system."

        except Exception as e:
            logger.error(f"Error playing audio directly: {e}")
            return f"❌ Audio playback error: {str(e)}"

    async def _get_audio_file(self, track: MusicTrack) -> Optional[str]:
        """Download or get cached audio file."""
        try:
            # Check if already cached
            cache_filename = f"{track.source_type}_{track.video_id}.mp3"
            cache_path = self.music_cache_dir / cache_filename

            if cache_path.exists():
                return str(cache_path)

            # Download the audio file (only for legal sources)
            if track.license_type in ['creative_commons', 'public_domain']:
                response = requests.get(track.audio_url, stream=True)
                response.raise_for_status()

                with open(cache_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)

                return str(cache_path)
            else:
                logger.warning(f"Cannot download copyrighted content: {track.title}")
                return None

        except Exception as e:
            logger.error(f"Error getting audio file: {e}")
            return None

    def _play_with_pygame(self, file_path: str) -> bool:
        """Play audio using pygame."""
        try:
            pygame.mixer.music.load(file_path)
            pygame.mixer.music.play()
            return True
        except Exception as e:
            logger.error(f"Pygame playback error: {e}")
            return False

    def _play_with_vlc(self, file_path: str) -> bool:
        """Play audio using VLC."""
        try:
            media = self.audio_player.player_instance.media_new(file_path)
            player = self.audio_player.player_instance.media_player_new()
            player.set_media(media)
            player.play()
            self.audio_player.player_instance = player
            return True
        except Exception as e:
            logger.error(f"VLC playback error: {e}")
            return False

    def _play_with_playsound(self, file_path: str) -> bool:
        """Play audio using playsound (blocking)."""
        try:
            # Run in separate thread to avoid blocking
            def play_thread():
                playsound(file_path)

            thread = threading.Thread(target=play_thread, daemon=True)
            thread.start()
            return True
        except Exception as e:
            logger.error(f"Playsound playback error: {e}")
            return False

    def _play_with_system(self, file_path: str) -> bool:
        """Play audio using system default player."""
        try:
            if sys.platform == "win32":
                os.startfile(file_path)
            elif sys.platform == "darwin":  # macOS
                subprocess.run(["open", file_path])
            else:  # Linux
                subprocess.run(["xdg-open", file_path])
            return True
        except Exception as e:
            logger.error(f"System playback error: {e}")
            return False

    def pause_audio(self) -> str:
        """Pause direct audio playback."""
        try:
            if not self.audio_player.is_playing:
                return "🎵 No music is currently playing"

            if self.audio_player.player_type == "pygame" and PYGAME_AVAILABLE:
                pygame.mixer.music.pause()
                self.audio_player.is_paused = True
                return "⏸️ Music paused"
            elif self.audio_player.player_type == "vlc" and self.audio_player.player_instance:
                self.audio_player.player_instance.pause()
                self.audio_player.is_paused = True
                return "⏸️ Music paused"
            else:
                return "⏸️ Pause not supported with current audio player. Use system controls."

        except Exception as e:
            logger.error(f"Error pausing audio: {e}")
            return "❌ Could not pause audio"

    def resume_audio(self) -> str:
        """Resume direct audio playback."""
        try:
            if not self.audio_player.is_paused:
                return "🎵 Music is not paused"

            if self.audio_player.player_type == "pygame" and PYGAME_AVAILABLE:
                pygame.mixer.music.unpause()
                self.audio_player.is_paused = False
                return "▶️ Music resumed"
            elif self.audio_player.player_type == "vlc" and self.audio_player.player_instance:
                self.audio_player.player_instance.play()
                self.audio_player.is_paused = False
                return "▶️ Music resumed"
            else:
                return "▶️ Resume not supported with current audio player. Use system controls."

        except Exception as e:
            logger.error(f"Error resuming audio: {e}")
            return "❌ Could not resume audio"

    def stop_audio(self) -> str:
        """Stop direct audio playback."""
        try:
            if self.audio_player.player_type == "pygame" and PYGAME_AVAILABLE:
                pygame.mixer.music.stop()
            elif self.audio_player.player_type == "vlc" and self.audio_player.player_instance:
                self.audio_player.player_instance.stop()

            self.audio_player.is_playing = False
            self.audio_player.is_paused = False
            self.audio_player.current_track = None

            return "⏹️ Music stopped"

        except Exception as e:
            logger.error(f"Error stopping audio: {e}")
            return "❌ Could not stop audio"
    
    def format_search_results(self, tracks: List[MusicTrack], query: str) -> str:
        """Format search results for display."""
        if not tracks:
            return f"🎵 No music found for '{query}'. Try a different search term or artist name."
        
        result_lines = [f"🎵 **Music Search Results for '{query}'**\n"]
        
        for i, track in enumerate(tracks[:3], 1):  # Show top 3 results
            result_lines.append(f"**{i}. {track.title}**")
            result_lines.append(f"   🎤 Artist: {track.artist}")
            result_lines.append(f"   ⏱️ Duration: {track.duration}")
            result_lines.append(f"   👀 {track.view_count}")
            result_lines.append(f"   🔗 [Play on YouTube]({track.url})")
            result_lines.append("")
        
        result_lines.append("💡 **How to play:** Say 'play [song name]' or click the YouTube link above!")
        result_lines.append("🎤 **Get lyrics:** Say 'show me lyrics for [song name]'")
        
        return "\n".join(result_lines)
    
    def format_now_playing(self, track: MusicTrack) -> str:
        """Format now playing information."""
        return f"""🎵 **Now Playing**

**{track.title}**
🎤 **Artist:** {track.artist}
⏱️ **Duration:** {track.duration}
👀 **Views:** {track.view_count}

🔗 **Playing on YouTube:** {track.url}

💡 **Voice Commands:**
• "Pause music" - Pause playback
• "Show lyrics" - Display lyrics
• "Play next song" - Skip to next
"""
    
    def get_playback_history(self, limit: int = 5) -> str:
        """Get recent playback history."""
        if not self.playback_history:
            return "🎵 No music has been played yet. Try saying 'play [song name]'!"
        
        history_lines = ["🎵 **Recent Music History**\n"]
        
        for entry in self.playback_history[-limit:]:
            track = entry['track']
            played_at = datetime.fromisoformat(entry['played_at']).strftime('%H:%M')
            history_lines.append(f"• **{track.title}** by {track.artist} (played at {played_at})")
        
        return "\n".join(history_lines)

    def _format_direct_playback_info(self, track: MusicTrack) -> str:
        """Format information for direct playback."""
        return f"""🎵 **Direct Audio Playback**

**{track.title}**
🎤 **Artist:** {track.artist}
⏱️ **Duration:** {track.duration}
📜 **License:** {track.license_type.replace('_', ' ').title()}
🎼 **Source:** {track.source_type.title()}

🎮 **Direct Controls Available:**
• "Pause music" - Pause playback
• "Resume music" - Resume playback
• "Stop music" - Stop playback
• "What's playing?" - Show status

💡 **Playing directly in terminal - no browser needed!**
"""

    def get_audio_status(self) -> str:
        """Get current audio playback status."""
        if self.audio_player.current_track:
            track = self.audio_player.current_track

            if self.audio_player.is_playing and not self.audio_player.is_paused:
                status_icon = "▶️"
                status_text = "Playing"
            elif self.audio_player.is_paused:
                status_icon = "⏸️"
                status_text = "Paused"
            else:
                status_icon = "⏹️"
                status_text = "Stopped"

            return f"""🎵 **Audio Status: {status_text}**

{status_icon} **{track.title}**
🎤 **Artist:** {track.artist}
🎼 **Source:** {track.source_type.title()}
🎮 **Player:** {self.audio_player.player_type.title()}

**Available Commands:**
• "Pause music" / "Resume music"
• "Stop music"
• "Play [new song]" to switch tracks"""
        else:
            return "🎵 **No Audio Playing**\n\nSay 'play [song name]' to start listening!"

    async def process_music_request(self, message: str) -> Optional[str]:
        """Process a music request and return appropriate response.

        Args:
            message: User's music request message

        Returns:
            Formatted response string or None if not a music request
        """
        if not self.is_music_request(message):
            return None

        try:
            command_type, query, params = self.parse_music_command(message)

            if command_type == 'play':
                return await self._handle_play_request(query)
            elif command_type == 'search':
                return await self._handle_search_request(query)
            elif command_type == 'lyrics':
                return await self._handle_lyrics_request(query)
            elif command_type == 'control':
                return self._handle_enhanced_control_request(message)
            else:
                # Default to search for unknown music requests
                return await self._handle_search_request(query or message)

        except Exception as e:
            logger.error(f"Error processing music request: {e}")
            return f"🎵 Sorry, I encountered an error processing your music request: {str(e)}"

    async def _handle_play_request(self, query: str) -> str:
        """Handle play music requests with enhanced direct playback."""
        if not query.strip():
            return "🎵 What would you like me to play? Try saying 'play [song name]' or 'play [artist] - [song]'."

        # First, try to find legal music for direct playback
        legal_tracks = await self.search_legal_music(query, max_results=1)

        if legal_tracks:
            track = legal_tracks[0]
            play_status = await self.play_audio_direct(track)

            if "Now playing directly" in play_status:
                return f"MUSIC_RESULT: {play_status}\n\n{self._format_direct_playback_info(track)}"

        # Fallback to YouTube search and browser playback
        tracks = await self.search_music(query, max_results=1)

        if not tracks:
            return f"🎵 Sorry, I couldn't find '{query}' in our legal music sources or YouTube. Try a different song name or artist."

        # Play the first result in browser
        track = tracks[0]
        play_status = self.play_music(track)

        # Return formatted response
        return f"MUSIC_RESULT: {play_status}\n\n{self.format_now_playing(track)}\n\n💡 **Note:** This plays in your browser. For direct terminal playback, try asking for Creative Commons or public domain music!"

    async def _handle_search_request(self, query: str) -> str:
        """Handle music search requests."""
        if not query.strip():
            return "🎵 What music are you looking for? Try 'search for [song name]' or 'find [artist]'."

        tracks = await self.search_music(query, max_results=5)
        formatted_results = self.format_search_results(tracks, query)

        return f"MUSIC_RESULT: {formatted_results}"

    async def _handle_lyrics_request(self, query: str) -> str:
        """Handle lyrics requests."""
        if not query.strip():
            if self.current_track:
                query = f"{self.current_track.artist} {self.current_track.title}"
            else:
                return "🎵 Which song's lyrics would you like? Try 'show lyrics for [song name]'."

        # Search for the track first
        tracks = await self.search_music(query, max_results=1)

        if not tracks:
            return f"🎵 Sorry, I couldn't find '{query}' to get lyrics for."

        track = tracks[0]
        lyrics_result = await self.get_lyrics_preview(track)

        if lyrics_result:
            return f"""MUSIC_RESULT: 🎵 **Lyrics for {track.title}**

🎤 **Artist:** {track.artist}

**Copyright Notice:**
To respect copyright laws, I can't display full lyrics here. However, you can find the complete lyrics at:

🔗 **Official Sources:**
• [YouTube Music Video]({track.url})
• [Genius.com](https://genius.com/search?q={quote_plus(f"{track.artist} {track.title}")})
• [AZLyrics](https://search.azlyrics.com/search.php?q={quote_plus(f"{track.artist} {track.title}")})

💡 **Tip:** Many music videos on YouTube include lyrics in the description or as captions!"""
        else:
            return f"🎵 Sorry, I couldn't find lyrics information for '{track.title}' by {track.artist}."

    def _handle_enhanced_control_request(self, message: str) -> str:
        """Handle music control requests with direct audio support."""
        message_lower = message.lower()

        # Check if we have direct audio playing
        has_direct_audio = (self.audio_player.current_track and
                           self.audio_player.current_track.is_playable_direct)

        if any(word in message_lower for word in ['pause', 'stop']):
            if 'stop' in message_lower:
                if has_direct_audio:
                    return self.stop_audio()
                else:
                    return "⏹️ **Stop Music:** Close the browser tab or use browser controls to stop YouTube playback."
            else:  # pause
                if has_direct_audio:
                    return self.pause_audio()
                else:
                    return "⏸️ **Pause Music:** Press spacebar in your browser or use the YouTube pause button."

        elif any(word in message_lower for word in ['resume', 'continue', 'unpause', 'play']):
            if has_direct_audio:
                return self.resume_audio()
            else:
                return "▶️ **Resume Music:** Press spacebar in your browser or use the YouTube play button."

        elif any(word in message_lower for word in ['status', 'playing', 'current', "what's playing"]):
            return self.get_audio_status()

        elif any(word in message_lower for word in ['skip', 'next']):
            return "🎵 **Next Track:** Ask me to play a different song, or use browser controls for YouTube."

        elif any(word in message_lower for word in ['previous', 'back', 'last']):
            return "🎵 **Previous Track:** Ask me to play a previous song from your history, or use browser controls."

        elif any(word in message_lower for word in ['volume', 'turn up', 'turn down']):
            return self._handle_volume_control(message_lower)

        else:
            return self._get_enhanced_controls_help()

    def _handle_volume_control(self, message: str) -> str:
        """Handle volume control requests."""
        if 'up' in message or 'increase' in message or 'raise' in message:
            return "🔊 **Volume Up:** Use your system volume controls (Volume+ key) or browser volume slider."
        elif 'down' in message or 'decrease' in message or 'lower' in message:
            return "🔉 **Volume Down:** Use your system volume controls (Volume- key) or browser volume slider."
        else:
            return "🎵 **Volume Control:** Use your system volume keys or browser volume slider to adjust volume."

    def _get_enhanced_controls_help(self) -> str:
        """Get enhanced controls help information."""
        return """🎵 **Enhanced Music Controls**

**🎮 Direct Audio Commands:**
• "Pause music" - Pause direct playback
• "Resume music" - Resume direct playback
• "Stop music" - Stop direct playback
• "What's playing?" - Show current status

**🌐 Browser Audio Commands:**
• Use spacebar in browser to pause/resume
• Use browser controls for YouTube playback
• Close browser tab to stop

**💡 Tips:**
• Legal music (Creative Commons/Public Domain) plays directly in terminal
• Copyrighted music plays in browser for legal compliance
• Ask for "Creative Commons music" for direct playback!"""

    def _handle_control_request(self, message: str) -> str:
        """Handle music control requests."""
        message_lower = message.lower()

        if any(word in message_lower for word in ['pause', 'stop']):
            return "🎵 **Music Control:** To pause music, use the pause button in your browser or YouTube player."
        elif any(word in message_lower for word in ['resume', 'continue', 'unpause']):
            return "🎵 **Music Control:** To resume music, use the play button in your browser or YouTube player."
        elif any(word in message_lower for word in ['skip', 'next']):
            return "🎵 **Music Control:** To skip to the next song, use the next button in your YouTube player or ask me to play a different song."
        elif any(word in message_lower for word in ['previous', 'back', 'last']):
            return "🎵 **Music Control:** To go back, use the previous button in your YouTube player."
        elif any(word in message_lower for word in ['volume', 'turn up', 'turn down']):
            return "🎵 **Volume Control:** Adjust volume using your system volume controls or the YouTube player volume slider."
        else:
            return "🎵 **Music Controls Available:**\n• Pause/Resume: Use YouTube player controls\n• Volume: Use system or player volume controls\n• Next song: Ask me to play something else!"

    def get_music_help(self) -> str:
        """Get comprehensive help information for the enhanced music system."""
        return f"""🎵 **Nova AI Enhanced Music System Help**

**🎤 Voice Commands:**
• "Play [song name]" - Search and play music (direct or browser)
• "Play Creative Commons music" - Find legal music for direct playback
• "Search for [song/artist]" - Find music without playing
• "Show lyrics for [song]" - Get lyrics information
• "What's playing?" - Show current track info and controls
• "Pause/Resume/Stop music" - Control direct playback

**🎼 Playback Types:**

**🎮 Direct Terminal Playback:**
• Creative Commons licensed music
• Public domain recordings
• Plays directly in terminal - no browser needed!
• Full voice control (pause, resume, stop)

**🌐 Browser Playback:**
• Copyrighted music (YouTube)
• Larger music catalog
• Uses browser controls for legal compliance

**🔧 Audio System Status:**
• **Player Type:** {self.audio_player.player_type.title()}
• **Direct Playback:** {'✅ Available' if self.audio_player.player_type != 'system' else '⚠️ Limited (system player only)'}

**🎼 Examples:**
• "Play some Creative Commons jazz music"
• "Find public domain classical music"
• "Play Bohemian Rhapsody" (browser playback)
• "Pause music" (direct playback control)
• "What's playing?" (show current status)

**📝 Legal & Copyright:**
• Direct playback: Only legal, licensed music
• Browser playback: Copyrighted content via official platforms
• Lyrics: Links to official sources (copyright compliant)
• All content respects copyright and fair use policies

**💡 Pro Tips:**
• Ask for "Creative Commons" or "public domain" music for direct playback
• Use voice commands for hands-free control
• Direct playback works offline once cached
• Browser playback provides access to latest hits

**🔧 Setup:**
To enable enhanced audio features, install dependencies:
`pip install -r astra_ai/services/music_requirements.txt`"""
