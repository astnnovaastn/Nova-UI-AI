#!/usr/bin/env python3
"""
AI Video Analyzer Service
========================

Analyzes videos from URLs (YouTube, Vimeo, etc.) and provides comprehensive
AI-powered analysis including content summary, key topics, and insights.
"""

import logging
import re
import json
import requests
from typing import Dict, Optional, List
from datetime import datetime
import traceback

logger = logging.getLogger(__name__)

class VideoAnalyzer:
    """Service for analyzing videos using AI."""
    
    def __init__(self):
        """Initialize the video analyzer service."""
        self.supported_platforms = {
            'youtube': ['youtube.com', 'youtu.be'],
            'vimeo': ['vimeo.com'],
            'dailymotion': ['dailymotion.com'],
            'twitch': ['twitch.tv']
        }
        
    def is_video_url(self, url: str) -> bool:
        """Check if the URL is a supported video platform.
        
        Args:
            url: The URL to check
            
        Returns:
            bool: True if it's a supported video URL
        """
        if not url:
            return False
            
        url_lower = url.lower()
        
        # Check for specific video platforms
        for platform, domains in self.supported_platforms.items():
            if any(domain in url_lower for domain in domains):
                return True
                
        # Check for direct video file extensions
        video_extensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.wmv']
        if any(url_lower.endswith(ext) for ext in video_extensions):
            return True
            
        return False
    
    def extract_video_id(self, url: str) -> Dict[str, str]:
        """Extract video ID and platform from URL.
        
        Args:
            url: The video URL
            
        Returns:
            Dict containing platform and video_id
        """
        try:
            url_lower = url.lower()
            
            # YouTube patterns
            if 'youtube.com' in url_lower or 'youtu.be' in url_lower:
                if 'youtu.be/' in url_lower:
                    video_id = url.split('youtu.be/')[-1].split('?')[0]
                elif 'watch?v=' in url_lower:
                    video_id = url.split('watch?v=')[-1].split('&')[0]
                else:
                    video_id = None
                return {'platform': 'youtube', 'video_id': video_id, 'url': url}
            
            # Vimeo patterns
            elif 'vimeo.com' in url_lower:
                video_id = re.search(r'vimeo\.com/(\d+)', url)
                video_id = video_id.group(1) if video_id else None
                return {'platform': 'vimeo', 'video_id': video_id, 'url': url}
            
            # Default for other platforms
            else:
                return {'platform': 'other', 'video_id': None, 'url': url}
                
        except Exception as e:
            logger.error(f"Error extracting video ID: {e}")
            return {'platform': 'unknown', 'video_id': None, 'url': url}
    
    def get_video_metadata(self, video_info: Dict) -> Dict:
        """Get video metadata (title, duration, etc.).
        
        Args:
            video_info: Video information dictionary
            
        Returns:
            Dict: Video metadata
        """
        try:
            # This would normally use APIs like YouTube Data API, but for now
            # we'll provide a simulation for demonstration
            
            platform = video_info.get('platform', 'unknown')
            url = video_info.get('url', '')
            
            if platform == 'youtube':
                # In a real implementation, you would use YouTube Data API
                metadata = {
                    'title': self._extract_title_from_url(url) or "YouTube Video",
                    'duration': "Unknown",
                    'views': "N/A",
                    'channel': "YouTube Channel",
                    'upload_date': "Recent",
                    'description': "Video description not available",
                    'thumbnail': None,
                    'platform': 'YouTube'
                }
            elif platform == 'vimeo':
                metadata = {
                    'title': "Vimeo Video",
                    'duration': "Unknown", 
                    'views': "N/A",
                    'channel': "Vimeo User",
                    'upload_date': "Recent",
                    'description': "Video description not available",
                    'thumbnail': None,
                    'platform': 'Vimeo'
                }
            else:
                metadata = {
                    'title': "Video File",
                    'duration': "Unknown",
                    'views': "N/A", 
                    'channel': "Unknown",
                    'upload_date': "Unknown",
                    'description': "Direct video file",
                    'thumbnail': None,
                    'platform': platform.title()
                }
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error getting video metadata: {e}")
            return {
                'title': "Unknown Video",
                'duration': "Unknown",
                'views': "N/A",
                'channel': "Unknown",
                'upload_date': "Unknown", 
                'description': "Could not retrieve video information",
                'thumbnail': None,
                'platform': 'Unknown',
                'error': str(e)
            }
    
    def _extract_title_from_url(self, url: str) -> Optional[str]:
        """Try to extract a title from the URL."""
        try:
            # Simple extraction - in real implementation you'd use proper APIs
            if 'youtube.com' in url and 'watch?v=' in url:
                return "YouTube Video"
            return None
        except:
            return None
    
    async def analyze_video_content(self, video_info: Dict, ai_client=None) -> str:
        """Analyze video content using AI.
        
        Args:
            video_info: Video information and metadata
            ai_client: AI client for analysis (optional)
            
        Returns:
            str: Comprehensive video analysis
        """
        try:
            metadata = video_info.get('metadata', {})
            title = metadata.get('title', 'Unknown Video')
            platform = metadata.get('platform', 'Unknown')
            url = video_info.get('url', '')
            
            # Comprehensive analysis prompt
            analysis_prompt = f"""
            Analyze this video and provide a comprehensive summary:
            
            Video Title: {title}
            Platform: {platform}
            URL: {url}
            
            Please provide:
            1. Content Overview (what the video is about)
            2. Key Topics and Themes
            3. Target Audience
            4. Educational/Entertainment Value
            5. Production Quality Assessment
            6. Key Insights and Takeaways
            7. Recommended Use Cases
            
            Format the response in a clear, structured way with emojis and bullet points.
            """
            
            # If AI client is available, use it for analysis
            if ai_client and hasattr(ai_client, 'client'):
                try:
                    messages = [
                        {"role": "system", "content": "You are an expert video content analyzer. Provide detailed, professional analysis of videos."},
                        {"role": "user", "content": analysis_prompt}
                    ]
                    
                    # Use the GROQ client directly to avoid infinite loop
                    completion = ai_client.client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=messages,
                        max_tokens=2000,
                        temperature=0.7,
                        stream=False
                    )
                    
                    response = completion.choices[0].message.content
                    logger.info("✅ Video analysis completed using AI")
                    return response
                    
                except Exception as e:
                    logger.warning(f"AI analysis failed, using fallback: {e}")
            
            # Fallback analysis based on available metadata
            analysis = self._generate_fallback_analysis(metadata)
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing video content: {e}")
            return f"❌ Error analyzing video: {str(e)}"
    
    def _generate_fallback_analysis(self, metadata: Dict) -> str:
        """Generate a fallback analysis when AI is not available."""
        title = metadata.get('title', 'Unknown Video')
        platform = metadata.get('platform', 'Unknown')
        duration = metadata.get('duration', 'Unknown')
        views = metadata.get('views', 'N/A')
        channel = metadata.get('channel', 'Unknown')
        
        analysis = f"""🎬 **VIDEO ANALYSIS SUMMARY**

📋 **Basic Information:**
• Title: {title}
• Platform: {platform}
• Duration: {duration}
• Channel: {channel}
• Views: {views}

🔍 **Content Analysis:**
• Video appears to be hosted on {platform}
• Content type: Based on the title, this seems to be informational/educational content
• Target audience: General viewers interested in the topic
• Accessibility: Available through standard web browsers

📊 **Platform Analysis:**
• {platform} is a well-established video platform
• Good for reaching diverse audiences
• Standard video quality and streaming capabilities

💡 **Key Insights:**
• Title suggests focused content on a specific topic
• Platform choice indicates intent for broad distribution
• Standard video format ensures wide compatibility

🎯 **Recommendations:**
• Content appears suitable for educational or informational purposes
• Good for sharing and embedding in other platforms
• Consider checking actual video content for more detailed analysis

⚠️ **Note:** This is a basic analysis based on metadata only. For detailed content analysis including visual and audio elements, please ensure AI analysis features are fully enabled."""

        return analysis
    
    async def analyze_video(self, url: str, ai_client=None) -> Dict:
        """Complete video analysis workflow.
        
        Args:
            url: Video URL to analyze
            ai_client: AI client for enhanced analysis
            
        Returns:
            Dict: Complete analysis results
        """
        try:
            logger.info(f"Starting video analysis for: {url}")
            
            # Validate URL
            if not self.is_video_url(url):
                return {
                    'error': 'Unsupported video URL. Please provide a YouTube, Vimeo, or direct video file URL.',
                    'supported_platforms': list(self.supported_platforms.keys())
                }
            
            # Extract video information
            video_info = self.extract_video_id(url)
            
            # Get metadata
            metadata = self.get_video_metadata(video_info)
            video_info['metadata'] = metadata
            
            # Perform AI analysis
            analysis = await self.analyze_video_content(video_info, ai_client)
            
            # Compile results
            results = {
                'url': url,
                'platform': video_info.get('platform'),
                'video_id': video_info.get('video_id'),
                'metadata': metadata,
                'analysis': analysis,
                'timestamp': datetime.now().isoformat(),
                'status': 'success'
            }
            
            logger.info(f"Video analysis completed successfully for: {url}")
            return results
            
        except Exception as e:
            logger.error(f"Error in video analysis workflow: {e}")
            logger.error(traceback.format_exc())
            return {
                'error': f"Analysis failed: {str(e)}",
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'status': 'error'
            }
    
    def format_analysis_response(self, analysis_results: Dict) -> str:
        """Format analysis results for display.
        
        Args:
            analysis_results: Results from analyze_video()
            
        Returns:
            str: Formatted response for UI display
        """
        try:
            if 'error' in analysis_results:
                return f"❌ Video Analysis Error: {analysis_results['error']}"
            
            metadata = analysis_results.get('metadata', {})
            analysis = analysis_results.get('analysis', '')
            
            # Format for UI display with special prefix
            response = f"VIDEO_ANALYSIS_SHOW: {analysis_results['url']}|"
            response += f"VIDEO_DATA: {json.dumps(analysis_results)}"
            
            return response
            
        except Exception as e:
            logger.error(f"Error formatting analysis response: {e}")
            return f"❌ Error formatting video analysis: {str(e)}"

# Helper function for easy import
def create_video_analyzer() -> VideoAnalyzer:
    """Create and return a VideoAnalyzer instance."""
    return VideoAnalyzer()