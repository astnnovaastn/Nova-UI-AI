"""
Image Backup Manager
====================
Handles persistent storage of AI-generated images.
Saves images to disk and maintains a JSON index with metadata.

Features:
- Auto-decode base64 data URIs to binary image files
- Generate unique filenames with timestamp + prompt hash
- Maintain searchable JSON index with image metadata
- Non-blocking operation (backup failures don't interrupt API)
"""

import json
import base64
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import threading


logger = logging.getLogger("ImageBackupManager")


class ImageBackupManager:
    """Manages AI-generated image backups"""
    
    def __init__(self, backup_root: Optional[Path] = None):
        """
        Initialize the backup manager.
        
        Args:
            backup_root: Root directory for image backups.
                        If None, uses backend/ai_generated_images/
        """
        if backup_root is None:
            # Default to backend/ai_generated_images/
            backup_root = Path(__file__).parent / "ai_generated_images"
        
        self.backup_root = Path(backup_root)
        self.index_file = self.backup_root / "index.json"
        self.lock = threading.Lock()
        
        # Create directory if it doesn't exist
        self._ensure_directory()
        
        logger.info(f"[BACKUP] ImageBackupManager initialized at {self.backup_root}")
    
    def _ensure_directory(self):
        """Ensure backup directory and index file exist"""
        try:
            self.backup_root.mkdir(parents=True, exist_ok=True)
            
            # Create index if it doesn't exist
            if not self.index_file.exists():
                initial_index = {
                    "total_images": 0,
                    "last_updated": datetime.now().isoformat() + "Z",
                    "images": []
                }
                self._write_index(initial_index)
                logger.info(f"[BACKUP] Created new image index at {self.index_file}")
        
        except Exception as e:
            logger.error(f"[BACKUP] Failed to ensure backup directory: {e}")
            raise
    
    def _generate_filename(self, prompt: str, mime_type: str) -> str:
        """
        Generate unique filename with timestamp + prompt hash.
        
        Format: YYYYMMDD_HHMMSS_<8char_hash>.<ext>
        Example: 20260525_143022_a1b2c3d4.jpg
        
        Args:
            prompt: Image generation prompt
            mime_type: MIME type (e.g., 'image/jpeg')
        
        Returns:
            Filename string
        """
        # Timestamp
        now = datetime.now()
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        
        # Hash of prompt (first 8 chars)
        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()[:8]
        
        # File extension from MIME type
        ext_map = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/gif": "gif",
            "image/bmp": "bmp",
        }
        ext = ext_map.get(mime_type.lower(), "jpg")
        
        return f"{timestamp}_{prompt_hash}.{ext}"
    
    def _extract_mime_type_from_uri(self, data_uri: str) -> str:
        """
        Extract MIME type from data URI.
        
        Format: data:image/jpeg;base64,<base64_data>
        
        Args:
            data_uri: Data URI string
        
        Returns:
            MIME type (e.g., 'image/jpeg') or 'image/jpeg' if not found
        """
        try:
            if not data_uri.startswith("data:"):
                logger.warning(f"[BACKUP] Invalid data URI format: {data_uri[:50]}")
                return "image/jpeg"
            
            # Extract mime type between "data:" and ";base64"
            parts = data_uri.split(";")
            if len(parts) >= 2:
                mime_type = parts[0].replace("data:", "", 1)
                return mime_type
            
            return "image/jpeg"
        
        except Exception as e:
            logger.warning(f"[BACKUP] Failed to extract MIME type: {e}")
            return "image/jpeg"
    
    def _extract_base64_from_uri(self, data_uri: str) -> str:
        """
        Extract base64 string from data URI.
        
        Args:
            data_uri: Data URI string
        
        Returns:
            Base64 string (without "data:...;base64," prefix)
        
        Raises:
            ValueError: If data URI format is invalid
        """
        try:
            # Format: data:image/jpeg;base64,<base64_data>
            if not data_uri.startswith("data:"):
                raise ValueError("Not a data URI - missing 'data:' prefix")
            
            # Find the base64 data after the comma
            if ",base64," in data_uri:
                base64_data = data_uri.split(",base64,", 1)[1]
            elif ",base64," in data_uri.lower():
                base64_data = data_uri.split(",", 1)[1]
            else:
                base64_data = data_uri.split(",", 1)[1]
            
            return base64_data.strip()
        
        except Exception as e:
            logger.error(f"[BACKUP] Failed to extract base64 from URI: {e}")
            raise ValueError(f"Invalid data URI format: {str(e)}")
    
    def _decode_base64_to_bytes(self, base64_str: str) -> bytes:
        """
        Decode base64 string to binary bytes.
        
        Args:
            base64_str: Base64-encoded string
        
        Returns:
            Binary image data
        
        Raises:
            ValueError: If base64 decoding fails
        """
        try:
            return base64.b64decode(base64_str)
        except Exception as e:
            logger.error(f"[BACKUP] Failed to decode base64: {e}")
            raise ValueError(f"Invalid base64 data: {str(e)}")
    
    def _read_index(self) -> Dict[str, Any]:
        """Read image index from disk"""
        try:
            if self.index_file.exists():
                with open(self.index_file, 'r') as f:
                    return json.load(f)
            else:
                return {
                    "total_images": 0,
                    "last_updated": datetime.now().isoformat() + "Z",
                    "images": []
                }
        except Exception as e:
            logger.error(f"[BACKUP] Failed to read index: {e}")
            return {
                "total_images": 0,
                "last_updated": datetime.now().isoformat() + "Z",
                "images": []
            }
    
    def _write_index(self, index: Dict[str, Any]):
        """Write image index to disk with thread safety"""
        try:
            with self.lock:
                with open(self.index_file, 'w') as f:
                    json.dump(index, f, indent=2)
                logger.debug(f"[BACKUP] Index updated: {len(index.get('images', []))} images")
        except Exception as e:
            logger.error(f"[BACKUP] Failed to write index: {e}")
    
    def save_image_backup(
        self,
        image_base64_uri: str,
        prompt: str,
        provider: str
    ) -> Optional[str]:
        """
        Save AI-generated image to disk and update index.
        
        Pipeline:
        1. Extract MIME type from data URI
        2. Extract base64 string from data URI
        3. Decode base64 to binary image data
        4. Generate unique filename
        5. Save binary data to disk
        6. Update index.json with metadata
        
        Args:
            image_base64_uri: Image as data URI (e.g., 'data:image/jpeg;base64,...')
            prompt: Image generation prompt
            provider: Provider name (e.g., 'google', 'pollinations')
        
        Returns:
            Filename of saved image, or None if backup failed
            (Failures are non-blocking and logged)
        """
        try:
            # Step 1: Extract MIME type
            mime_type = self._extract_mime_type_from_uri(image_base64_uri)
            logger.info(f"[BACKUP] Detected MIME type: {mime_type}")
            
            # Step 2: Extract base64 string
            base64_str = self._extract_base64_from_uri(image_base64_uri)
            logger.debug(f"[BACKUP] Extracted base64 string ({len(base64_str)} chars)")
            
            # Step 3: Decode to binary
            image_bytes = self._decode_base64_to_bytes(base64_str)
            logger.info(f"[BACKUP] Decoded image: {len(image_bytes)} bytes")
            
            # Step 4: Generate filename
            filename = self._generate_filename(prompt, mime_type)
            filepath = self.backup_root / filename
            logger.info(f"[BACKUP] Generated filename: {filename}")
            
            # Step 5: Save to disk
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            logger.info(f"[BACKUP] Image saved to {filepath}")
            
            # Step 6: Update index
            file_size = len(image_bytes)
            metadata = {
                "id": filename,
                "timestamp": datetime.now().isoformat() + "Z",
                "prompt": prompt[:500],  # Limit prompt length in index
                "provider": provider,
                "mime_type": mime_type,
                "file_size": file_size,
                "status": "saved"
            }
            
            index = self._read_index()
            index["images"].append(metadata)
            index["total_images"] = len(index["images"])
            index["last_updated"] = datetime.now().isoformat() + "Z"
            self._write_index(index)
            
            logger.info(
                f"[BACKUP] ✓ Image backed up: {filename} "
                f"({file_size} bytes, prompt: {prompt[:50]}...)"
            )
            
            return filename
        
        except Exception as e:
            logger.error(
                f"[BACKUP] ✗ Failed to backup image: {e}",
                exc_info=True
            )
            # Return None but don't raise - backup failures are non-blocking
            return None
    
    def get_index(self) -> Dict[str, Any]:
        """
        Get current image backup index.
        
        Returns:
            Index dictionary with total_images, last_updated, and image list
        """
        return self._read_index()
    
    def get_images_count(self) -> int:
        """Get total number of backed-up images"""
        index = self._read_index()
        return index.get("total_images", 0)
    
    def get_image_by_id(self, filename: str) -> Optional[Path]:
        """
        Get file path for a backed-up image by filename.
        
        Args:
            filename: Image filename (e.g., '20260525_143022_a1b2c3d4.jpg')
        
        Returns:
            Path to image file, or None if not found
        """
        filepath = self.backup_root / filename
        if filepath.exists() and filepath.is_file():
            return filepath
        return None
    
    def get_recent_images(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get most recent backed-up images.
        
        Args:
            limit: Number of recent images to return
        
        Returns:
            List of image metadata dictionaries, sorted by timestamp (newest first)
        """
        index = self._read_index()
        images = index.get("images", [])
        
        # Sort by timestamp descending (newest first)
        images.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return images[:limit]
    
    def get_images_by_provider(self, provider: str) -> List[Dict[str, Any]]:
        """
        Get all images generated by a specific provider.
        
        Args:
            provider: Provider name (e.g., 'google', 'pollinations')
        
        Returns:
            List of image metadata dictionaries
        """
        index = self._read_index()
        images = index.get("images", [])
        
        return [img for img in images if img.get("provider") == provider]
    
    def search_by_prompt(self, query: str) -> List[Dict[str, Any]]:
        """
        Search backed-up images by prompt text.
        
        Args:
            query: Search query (case-insensitive substring match)
        
        Returns:
            List of matching image metadata dictionaries
        """
        index = self._read_index()
        images = index.get("images", [])
        query_lower = query.lower()
        
        return [
            img for img in images
            if query_lower in img.get("prompt", "").lower()
        ]
