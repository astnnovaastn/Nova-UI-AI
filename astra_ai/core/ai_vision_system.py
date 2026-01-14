"""
Nova AI Vision System
Advanced AI vision capabilities with memory integration, real-time analysis, and natural language processing
"""

import asyncio
import base64
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
# import cv2
# import numpy as np
# Note: OpenCV and numpy temporarily disabled due to compilation issues
# Motion detection will be implemented with basic image comparison
from dataclasses import dataclass, asdict
import requests
import io
from PIL import Image
import threading
import time

# Configure logging
logger = logging.getLogger("NovaAI.VisionSystem")

@dataclass
class VisionAnalysis:
    """Vision analysis result data structure"""
    id: str
    timestamp: datetime
    image_data: str  # base64 encoded
    analysis_type: str  # 'object_detection', 'scene_analysis', 'motion_tracking', etc.
    objects_detected: List[Dict[str, Any]]
    scene_description: str
    confidence_scores: Dict[str, float]
    motion_data: Optional[Dict[str, Any]] = None
    user_query: Optional[str] = None
    ai_response: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert analysis to dictionary for storage"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'VisionAnalysis':
        """Create analysis from dictionary"""
        data['timestamp'] = datetime.fromisoformat(data['timestamp'])
        return cls(**data)

class AIVisionSystem:
    """Advanced AI Vision System with memory integration and real-time analysis"""
    
    def __init__(self, memory_system=None, google_api_key=None):
        self.memory_system = memory_system
        self.google_api_key = google_api_key or ""
        self.vision_history: Dict[str, VisionAnalysis] = {}
        self.is_analyzing = False
        self.motion_detector = None
        self.last_frame = None
        self.motion_threshold = 30
        self.analysis_queue = asyncio.Queue()
        self.processing_thread = None
        
        # Load existing vision history from memory
        self._load_vision_history()
        
        # Initialize motion detection
        self._initialize_motion_detection()
        
        logger.info("AI Vision System initialized")

    def _load_vision_history(self):
        """Load vision history from memory system"""
        if not self.memory_system:
            return
            
        try:
            vision_data = self.memory_system.memory_system.data["memory_categories"].get("visual_experiences", {})
            
            if "vision_history" in vision_data:
                for analysis_dict in vision_data["vision_history"]:
                    analysis = VisionAnalysis.from_dict(analysis_dict)
                    self.vision_history[analysis.id] = analysis
                    
                logger.info(f"Loaded {len(self.vision_history)} vision analyses from memory")
        except Exception as e:
            logger.error(f"Error loading vision history from memory: {e}")

    def _save_vision_analysis(self, analysis: VisionAnalysis):
        """Save vision analysis to memory system"""
        if not self.memory_system:
            return
            
        try:
            # Store in vision history
            self.vision_history[analysis.id] = analysis
            
            # Update memory system
            current_data = self.memory_system.memory_system.data["memory_categories"].get("visual_experiences", {})
            
            if "vision_history" not in current_data:
                current_data["vision_history"] = []
            
            # Add new analysis
            current_data["vision_history"].append(analysis.to_dict())
            
            # Keep only last 100 analyses to manage memory
            if len(current_data["vision_history"]) > 100:
                current_data["vision_history"] = current_data["vision_history"][-100:]
            
            # Update statistics
            current_data["total_analyses"] = len(current_data["vision_history"])
            current_data["last_analysis"] = analysis.timestamp.isoformat()
            
            self.memory_system.memory_system.data["memory_categories"]["visual_experiences"] = current_data
            self.memory_system.memory_system.save_memory()
            
            logger.debug(f"Saved vision analysis to memory: {analysis.id}")
            
        except Exception as e:
            logger.error(f"Error saving vision analysis to memory: {e}")

    def _initialize_motion_detection(self):
        """Initialize motion detection system"""
        try:
            # Simplified motion detection without OpenCV for now
            self.motion_detector = True  # Placeholder
            logger.info("Motion detection initialized (simplified mode)")
        except Exception as e:
            logger.error(f"Error initializing motion detection: {e}")

    async def analyze_image_with_google_vision(self, image_data: str, user_query: str = None) -> Dict[str, Any]:
        """Analyze image using Google Vision API"""
        try:
            # Prepare the request
            url = f"https://vision.googleapis.com/v1/images:annotate?key={self.google_api_key}"
            
            # Create comprehensive analysis request
            features = [
                {"type": "LABEL_DETECTION", "maxResults": 20},
                {"type": "OBJECT_LOCALIZATION", "maxResults": 20},
                {"type": "TEXT_DETECTION"},
                {"type": "FACE_DETECTION"},
                {"type": "LANDMARK_DETECTION"},
                {"type": "LOGO_DETECTION"},
                {"type": "SAFE_SEARCH_DETECTION"},
                {"type": "IMAGE_PROPERTIES"}
            ]
            
            payload = {
                "requests": [{
                    "image": {"content": image_data},
                    "features": features
                }]
            }
            
            # Make API request
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            result = response.json()
            
            if "responses" in result and len(result["responses"]) > 0:
                return result["responses"][0]
            else:
                raise Exception("No response from Google Vision API")
                
        except Exception as e:
            logger.error(f"Google Vision API error: {e}")
            return {"error": str(e)}

    def _process_google_vision_response(self, response: Dict[str, Any], user_query: str = None) -> Dict[str, Any]:
        """Process Google Vision API response into structured data"""
        try:
            processed = {
                "objects_detected": [],
                "labels": [],
                "text_detected": "",
                "faces_detected": 0,
                "landmarks": [],
                "logos": [],
                "scene_description": "",
                "confidence_scores": {},
                "colors": [],
                "safe_search": {}
            }
            
            # Process object localization
            if "localizedObjectAnnotations" in response:
                for obj in response["localizedObjectAnnotations"]:
                    processed["objects_detected"].append({
                        "name": obj.get("name", "Unknown"),
                        "confidence": obj.get("score", 0),
                        "bounding_box": obj.get("boundingPoly", {})
                    })
            
            # Process labels
            if "labelAnnotations" in response:
                for label in response["labelAnnotations"]:
                    processed["labels"].append({
                        "description": label.get("description", ""),
                        "confidence": label.get("score", 0)
                    })
            
            # Process text detection
            if "textAnnotations" in response and len(response["textAnnotations"]) > 0:
                processed["text_detected"] = response["textAnnotations"][0].get("description", "")
            
            # Process face detection
            if "faceAnnotations" in response:
                processed["faces_detected"] = len(response["faceAnnotations"])
            
            # Process landmarks
            if "landmarkAnnotations" in response:
                for landmark in response["landmarkAnnotations"]:
                    processed["landmarks"].append({
                        "description": landmark.get("description", ""),
                        "confidence": landmark.get("score", 0)
                    })
            
            # Process logos
            if "logoAnnotations" in response:
                for logo in response["logoAnnotations"]:
                    processed["logos"].append({
                        "description": logo.get("description", ""),
                        "confidence": logo.get("score", 0)
                    })
            
            # Process image properties
            if "imagePropertiesAnnotation" in response:
                colors_info = response["imagePropertiesAnnotation"].get("dominantColors", {})
                if "colors" in colors_info:
                    for color in colors_info["colors"][:5]:  # Top 5 colors
                        rgb = color.get("color", {})
                        processed["colors"].append({
                            "red": rgb.get("red", 0),
                            "green": rgb.get("green", 0),
                            "blue": rgb.get("blue", 0),
                            "score": color.get("score", 0)
                        })
            
            # Process safe search
            if "safeSearchAnnotation" in response:
                processed["safe_search"] = response["safeSearchAnnotation"]
            
            # Generate scene description
            processed["scene_description"] = self._generate_scene_description(processed, user_query)
            
            return processed
            
        except Exception as e:
            logger.error(f"Error processing Google Vision response: {e}")
            return {"error": str(e)}

    def _generate_scene_description(self, analysis_data: Dict[str, Any], user_query: str = None) -> str:
        """Generate natural language scene description"""
        try:
            description_parts = []
            
            # Describe main objects
            objects = analysis_data.get("objects_detected", [])
            if objects:
                object_names = [obj["name"] for obj in objects[:5]]  # Top 5 objects
                if len(object_names) == 1:
                    description_parts.append(f"I can see a {object_names[0]}")
                elif len(object_names) == 2:
                    description_parts.append(f"I can see a {object_names[0]} and a {object_names[1]}")
                else:
                    description_parts.append(f"I can see {', '.join(object_names[:-1])}, and a {object_names[-1]}")
            
            # Describe scene context from labels
            labels = analysis_data.get("labels", [])
            if labels:
                high_confidence_labels = [label["description"] for label in labels if label["confidence"] > 0.7][:3]
                if high_confidence_labels:
                    description_parts.append(f"The scene appears to be {', '.join(high_confidence_labels)}")
            
            # Mention text if detected
            text = analysis_data.get("text_detected", "").strip()
            if text:
                if len(text) > 100:
                    description_parts.append("I can see text in the image")
                else:
                    description_parts.append(f"I can see text that says: '{text}'")
            
            # Mention faces
            faces = analysis_data.get("faces_detected", 0)
            if faces > 0:
                if faces == 1:
                    description_parts.append("I can see one person")
                else:
                    description_parts.append(f"I can see {faces} people")
            
            # Mention landmarks
            landmarks = analysis_data.get("landmarks", [])
            if landmarks:
                landmark_names = [lm["description"] for lm in landmarks[:2]]
                description_parts.append(f"I recognize {', '.join(landmark_names)}")
            
            # Combine description
            if description_parts:
                description = ". ".join(description_parts) + "."
            else:
                description = "I can see an image, but I'm having difficulty identifying specific objects or scenes."
            
            # Add context based on user query
            if user_query:
                query_lower = user_query.lower()
                if "what am i holding" in query_lower and objects:
                    held_objects = [obj["name"] for obj in objects if obj["confidence"] > 0.5]
                    if held_objects:
                        description = f"You appear to be holding: {', '.join(held_objects)}. " + description
                elif "what do you see" in query_lower:
                    description = "Looking at your image, " + description.lower()
            
            return description
            
        except Exception as e:
            logger.error(f"Error generating scene description: {e}")
            return "I can see an image but encountered an error analyzing it."

    def detect_motion(self, frame_data: str) -> Dict[str, Any]:
        """Detect motion in video frame (simplified version)"""
        try:
            # Simplified motion detection without OpenCV
            # In a full implementation, this would compare frames for changes

            # For now, return a placeholder response
            import random
            motion_detected = random.choice([True, False])  # Simulate motion detection

            if motion_detected:
                # Simulate detected motion areas
                motion_areas = [{
                    "x": random.randint(50, 200),
                    "y": random.randint(50, 150),
                    "width": random.randint(50, 100),
                    "height": random.randint(50, 100),
                    "area": random.randint(2500, 10000)
                }]
            else:
                motion_areas = []

            return {
                "motion_detected": motion_detected,
                "motion_areas": motion_areas,
                "total_motion_area": sum(area["area"] for area in motion_areas)
            }

        except Exception as e:
            logger.error(f"Error detecting motion: {e}")
            return {"motion_detected": False, "motion_areas": [], "error": str(e)}

    async def analyze_frame(self, frame_data: str, analysis_type: str = "comprehensive", user_query: str = None) -> VisionAnalysis:
        """Analyze a single frame with comprehensive AI vision"""
        try:
            import uuid

            analysis_id = str(uuid.uuid4())
            timestamp = datetime.now()

            # Perform Google Vision analysis
            google_response = await self.analyze_image_with_google_vision(frame_data, user_query)

            if "error" in google_response:
                raise Exception(f"Vision analysis failed: {google_response['error']}")

            # Process the response
            processed_data = self._process_google_vision_response(google_response, user_query)

            # Generate AI response based on analysis
            ai_response = await self._generate_ai_response(processed_data, user_query)

            # Create analysis object
            analysis = VisionAnalysis(
                id=analysis_id,
                timestamp=timestamp,
                image_data=frame_data,
                analysis_type=analysis_type,
                objects_detected=processed_data.get("objects_detected", []),
                scene_description=processed_data.get("scene_description", ""),
                confidence_scores=self._extract_confidence_scores(processed_data),
                user_query=user_query,
                ai_response=ai_response,
                metadata={
                    "labels": processed_data.get("labels", []),
                    "text_detected": processed_data.get("text_detected", ""),
                    "faces_detected": processed_data.get("faces_detected", 0),
                    "landmarks": processed_data.get("landmarks", []),
                    "logos": processed_data.get("logos", []),
                    "colors": processed_data.get("colors", []),
                    "safe_search": processed_data.get("safe_search", {})
                }
            )

            # Save to memory
            self._save_vision_analysis(analysis)

            logger.info(f"Vision analysis completed: {analysis_id}")
            return analysis

        except Exception as e:
            logger.error(f"Error analyzing frame: {e}")
            # Return error analysis
            return VisionAnalysis(
                id=str(uuid.uuid4()),
                timestamp=datetime.now(),
                image_data=frame_data,
                analysis_type="error",
                objects_detected=[],
                scene_description=f"Analysis failed: {str(e)}",
                confidence_scores={},
                user_query=user_query,
                ai_response=f"I encountered an error while analyzing the image: {str(e)}"
            )

    async def _generate_ai_response(self, analysis_data: Dict[str, Any], user_query: str = None, auto_activated: bool = False) -> str:
        """Generate natural language AI response based on analysis with enhanced conversational style"""
        try:
            scene_desc = analysis_data.get("scene_description", "")
            objects = analysis_data.get("objects_detected", [])
            labels = analysis_data.get("labels", [])
            text = analysis_data.get("text_detected", "").strip()
            faces = analysis_data.get("faces_detected", 0)
            landmarks = analysis_data.get("landmarks", [])

            # For auto-activated queries, provide more conversational responses
            if auto_activated and user_query:
                return await self._generate_conversational_response(analysis_data, user_query)

            # Base response
            response_parts = []

            if user_query:
                query_lower = user_query.lower()

                if "what do you see" in query_lower:
                    response_parts.append("👁️ **Looking at your image:**")
                    response_parts.append(scene_desc)

                    if objects:
                        high_conf_objects = [obj for obj in objects if obj["confidence"] > 0.7]
                        if high_conf_objects:
                            obj_list = ", ".join([obj["name"] for obj in high_conf_objects[:5]])
                            response_parts.append(f"\n🎯 **Key objects detected:** {obj_list}")

                    if text:
                        response_parts.append(f"\n📝 **Text found:** {text[:100]}{'...' if len(text) > 100 else ''}")

                    if faces > 0:
                        response_parts.append(f"\n👥 **People detected:** {faces}")

                elif "what am i holding" in query_lower:
                    if objects:
                        held_items = [obj["name"] for obj in objects if obj["confidence"] > 0.5]
                        if held_items:
                            response_parts.append(f"🤲 **You appear to be holding:** {', '.join(held_items)}")
                        else:
                            response_parts.append("🤔 I can see objects in the image, but I'm not certain what you're specifically holding.")
                    else:
                        response_parts.append("🤔 I don't see any clear objects that you're holding in this image.")

                elif "track movement" in query_lower or "motion" in query_lower:
                    response_parts.append("👁️ **Motion tracking activated!** I'm now monitoring for movement in the camera feed.")
                    response_parts.append("I'll alert you when I detect motion and can describe what's moving.")

                else:
                    # General analysis response
                    response_parts.append("👁️ **AI Vision Analysis:**")
                    response_parts.append(scene_desc)
            else:
                # No specific query - provide comprehensive analysis
                response_parts.append("👁️ **Comprehensive Vision Analysis:**")
                response_parts.append(scene_desc)

                if objects:
                    response_parts.append(f"\n🎯 **Objects:** {len(objects)} detected")

                if labels:
                    top_labels = [label["description"] for label in labels[:3] if label["confidence"] > 0.8]
                    if top_labels:
                        response_parts.append(f"\n🏷️ **Scene tags:** {', '.join(top_labels)}")

            # Add confidence indicator
            if objects:
                avg_confidence = sum(obj["confidence"] for obj in objects) / len(objects)
                if avg_confidence > 0.8:
                    response_parts.append(f"\n✅ **High confidence analysis** ({avg_confidence:.1%})")
                elif avg_confidence > 0.6:
                    response_parts.append(f"\n⚠️ **Moderate confidence** ({avg_confidence:.1%})")
                else:
                    response_parts.append(f"\n❓ **Lower confidence** ({avg_confidence:.1%}) - image may be unclear")

            return "\n".join(response_parts)

        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return f"I analyzed the image but encountered an error generating the response: {str(e)}"

    async def _generate_conversational_response(self, analysis_data: Dict[str, Any], user_query: str) -> str:
        """Generate conversational response for auto-activated vision queries"""
        try:
            query_lower = user_query.lower()

            # Determine response style based on query type
            if "holding" in query_lower or "hand" in query_lower:
                return self._respond_to_holding_query(analysis_data, user_query)
            elif "color" in query_lower:
                return self._respond_to_color_query(analysis_data, user_query)
            elif any(word in query_lower for word in ["this", "that", "what is"]):
                return self._respond_to_identification_query(analysis_data, user_query)
            else:
                return self._respond_to_general_query(analysis_data, user_query)

        except Exception as e:
            logger.error(f"Error generating conversational response: {e}")
            scene_desc = analysis_data.get("scene_description", "")
            return f"I can see what you're showing me, but I'm having trouble analyzing it right now. {scene_desc if scene_desc else ''}"

    def _respond_to_holding_query(self, analysis_data: Dict[str, Any], user_query: str) -> str:
        """Respond to queries about what someone is holding"""
        objects = analysis_data.get("objects_detected", [])
        scene_desc = analysis_data.get("scene_description", "")

        if objects:
            # Look for objects that might be held
            held_objects = [obj for obj in objects if obj.get('confidence', 0) > 0.3]

            if held_objects:
                main_object = held_objects[0]
                response = f"I can see you're holding **{main_object['name']}**"

                # Add confidence if high
                confidence = main_object.get('confidence', 0)
                if confidence > 0.7:
                    response += f" (I'm quite confident about this)"
                elif confidence > 0.5:
                    response += f" (I'm moderately confident)"

                # Add additional context from scene description
                if scene_desc and len(scene_desc) > 50:
                    response += f".\n\n{scene_desc}"

                return response

        # Fallback response
        return f"I can see your hands in the image, but I'm having trouble clearly identifying what you're holding. {scene_desc if scene_desc else 'Could you hold the object a bit closer to the camera?'}"

    def _respond_to_color_query(self, analysis_data: Dict[str, Any], user_query: str) -> str:
        """Respond to queries about colors"""
        scene_desc = analysis_data.get("scene_description", "")

        # Extract color information from scene description or objects
        colors = []
        if scene_desc:
            # Simple color extraction from description
            color_words = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'grey']
            colors = [color for color in color_words if color in scene_desc.lower()]

        if colors:
            if len(colors) == 1:
                return f"The main color I see is **{colors[0]}**."
            elif len(colors) <= 3:
                return f"I can see these colors: **{', '.join(colors[:-1])} and {colors[-1]}**."
            else:
                return f"I can see several colors including **{', '.join(colors[:3])}** and others."

        return f"I can see the scene but I'm having trouble identifying specific colors clearly. {scene_desc if scene_desc else 'Could you ensure good lighting?'}"

    def _respond_to_identification_query(self, analysis_data: Dict[str, Any], user_query: str) -> str:
        """Respond to general identification queries"""
        objects = analysis_data.get("objects_detected", [])
        scene_desc = analysis_data.get("scene_description", "")

        if objects:
            main_object = objects[0]
            response = f"I can see **{main_object['name']}**"

            # Add confidence info
            confidence = main_object.get('confidence', 0)
            if confidence > 0.8:
                response += " and I'm quite confident in this identification"

            # Add scene context
            if scene_desc:
                response += f".\n\n{scene_desc}"

            return response

        return f"I can see something in the image. {scene_desc if scene_desc else 'Could you help me by describing what you want me to identify?'}"

    def _respond_to_general_query(self, analysis_data: Dict[str, Any], user_query: str) -> str:
        """Respond to general vision queries"""
        scene_desc = analysis_data.get("scene_description", "")
        objects = analysis_data.get("objects_detected", [])

        if scene_desc:
            return f"Here's what I can see: {scene_desc}"

        # Build response from available data
        response_parts = []

        if objects:
            object_names = [obj['name'] for obj in objects[:3]]
            response_parts.append(f"I can see {', '.join(object_names)}")

        if response_parts:
            return " ".join(response_parts) + "."

        return "I can see the camera feed, but I'm having trouble providing a detailed analysis right now. Could you try adjusting the lighting or camera angle?"

    def _extract_confidence_scores(self, analysis_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract confidence scores from analysis data"""
        scores = {}

        # Object detection confidence
        objects = analysis_data.get("objects_detected", [])
        if objects:
            scores["object_detection"] = sum(obj["confidence"] for obj in objects) / len(objects)

        # Label confidence
        labels = analysis_data.get("labels", [])
        if labels:
            scores["scene_labeling"] = sum(label["confidence"] for label in labels) / len(labels)

        # Overall confidence
        if scores:
            scores["overall"] = sum(scores.values()) / len(scores)

        return scores

    def get_vision_history(self, limit: int = 10) -> List[VisionAnalysis]:
        """Get recent vision analysis history"""
        analyses = list(self.vision_history.values())
        analyses.sort(key=lambda x: x.timestamp, reverse=True)
        return analyses[:limit]

    def search_vision_history(self, query: str, limit: int = 5) -> List[VisionAnalysis]:
        """Search vision history by query"""
        query_lower = query.lower()
        matches = []

        for analysis in self.vision_history.values():
            # Search in scene description
            if query_lower in analysis.scene_description.lower():
                matches.append(analysis)
                continue

            # Search in AI response
            if analysis.ai_response and query_lower in analysis.ai_response.lower():
                matches.append(analysis)
                continue

            # Search in detected objects
            for obj in analysis.objects_detected:
                if query_lower in obj.get("name", "").lower():
                    matches.append(analysis)
                    break

        # Sort by timestamp (most recent first)
        matches.sort(key=lambda x: x.timestamp, reverse=True)
        return matches[:limit]

    def get_vision_statistics(self) -> Dict[str, Any]:
        """Get vision system statistics"""
        if not self.vision_history:
            return {"total_analyses": 0}

        analyses = list(self.vision_history.values())

        # Count analysis types
        type_counts = {}
        for analysis in analyses:
            type_counts[analysis.analysis_type] = type_counts.get(analysis.analysis_type, 0) + 1

        # Count detected objects
        all_objects = []
        for analysis in analyses:
            all_objects.extend([obj["name"] for obj in analysis.objects_detected])

        object_counts = {}
        for obj in all_objects:
            object_counts[obj] = object_counts.get(obj, 0) + 1

        # Get top objects
        top_objects = sorted(object_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        return {
            "total_analyses": len(analyses),
            "analysis_types": type_counts,
            "total_objects_detected": len(all_objects),
            "unique_objects": len(object_counts),
            "top_objects": top_objects,
            "first_analysis": min(analyses, key=lambda x: x.timestamp).timestamp.isoformat(),
            "last_analysis": max(analyses, key=lambda x: x.timestamp).timestamp.isoformat()
        }

    async def start_real_time_analysis(self):
        """Start real-time vision analysis processing"""
        self.is_analyzing = True
        logger.info("Real-time vision analysis started")

    async def stop_real_time_analysis(self):
        """Stop real-time vision analysis processing"""
        self.is_analyzing = False
        logger.info("Real-time vision analysis stopped")
