#!/usr/bin/env python3
"""
Test script for ImageBackupManager
Verifies image backup functionality end-to-end
"""

import sys
import json
from pathlib import Path

# Add current dir to path
sys.path.insert(0, str(Path(__file__).parent))

from image_backup_manager import ImageBackupManager

def create_test_image_base64():
    """Create a minimal valid JPEG base64 data URI for testing"""
    # Minimal 1x1 JPEG (red pixel)
    jpeg_b64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
    
    return f"data:image/jpeg;base64,{jpeg_b64}"


def main():
    print("=" * 70)
    print("IMAGE BACKUP MANAGER - TEST SUITE")
    print("=" * 70)
    print()
    
    # Test 1: Initialize ImageBackupManager
    print("[TEST 1] Initialize ImageBackupManager...")
    try:
        backup_root = Path(__file__).parent / "ai_generated_images_test"
        manager = ImageBackupManager(backup_root)
        print(f"✓ Manager initialized at: {backup_root}")
    except Exception as e:
        print(f"✗ Failed to initialize: {e}")
        return False
    
    print()
    
    # Test 2: Save test image
    print("[TEST 2] Save test image...")
    try:
        test_prompt = "A beautiful landscape with mountains and a sunset"
        image_uri = create_test_image_base64()
        provider = "google"
        
        filename = manager.save_image_backup(image_uri, test_prompt, provider)
        
        if filename:
            print(f"✓ Image saved with filename: {filename}")
        else:
            print(f"✗ save_image_backup returned None")
            return False
    except Exception as e:
        print(f"✗ Failed to save image: {e}")
        return False
    
    print()
    
    # Test 3: Verify file exists
    print("[TEST 3] Verify saved image file exists...")
    try:
        filepath = manager.get_image_by_id(filename)
        if filepath and filepath.exists():
            file_size = filepath.stat().st_size
            print(f"✓ File exists: {filepath}")
            print(f"  Size: {file_size} bytes")
        else:
            print(f"✗ File not found: {filepath}")
            return False
    except Exception as e:
        print(f"✗ Failed to verify file: {e}")
        return False
    
    print()
    
    # Test 4: Verify index.json was created and updated
    print("[TEST 4] Verify index.json was created and updated...")
    try:
        index = manager.get_index()
        total = index.get("total_images", 0)
        print(f"✓ Index loaded successfully")
        print(f"  Total images: {total}")
        print(f"  Last updated: {index.get('last_updated')}")
        
        if total > 0:
            latest_img = index["images"][-1]
            print(f"  Latest image:")
            print(f"    - ID: {latest_img.get('id')}")
            print(f"    - Timestamp: {latest_img.get('timestamp')}")
            print(f"    - Prompt: {latest_img.get('prompt')}")
            print(f"    - Provider: {latest_img.get('provider')}")
            print(f"    - MIME Type: {latest_img.get('mime_type')}")
            print(f"    - Size: {latest_img.get('file_size')} bytes")
        else:
            print(f"✗ No images in index")
            return False
    except Exception as e:
        print(f"✗ Failed to verify index: {e}")
        return False
    
    print()
    
    # Test 5: Save another image with different prompt
    print("[TEST 5] Save second image with different prompt...")
    try:
        test_prompt_2 = "A futuristic AI robot in a cyberpunk city"
        image_uri_2 = create_test_image_base64()
        
        filename_2 = manager.save_image_backup(image_uri_2, test_prompt_2, "google")
        
        if filename_2:
            print(f"✓ Second image saved: {filename_2}")
        else:
            print(f"✗ Failed to save second image")
            return False
    except Exception as e:
        print(f"✗ Failed to save second image: {e}")
        return False
    
    print()
    
    # Test 6: Verify both images in index
    print("[TEST 6] Verify both images are in index...")
    try:
        index = manager.get_index()
        total = index.get("total_images", 0)
        
        if total >= 2:
            print(f"✓ Index contains {total} images")
            print(f"  Images:")
            for img in index["images"]:
                print(f"    - {img.get('id')}: {img.get('prompt')[:50]}...")
        else:
            print(f"✗ Expected at least 2 images, found {total}")
            return False
    except Exception as e:
        print(f"✗ Failed to verify multiple images: {e}")
        return False
    
    print()
    
    # Test 7: Search by prompt
    print("[TEST 7] Search images by prompt...")
    try:
        results = manager.search_by_prompt("robot")
        if len(results) > 0:
            print(f"✓ Found {len(results)} image(s) matching 'robot'")
            for result in results:
                print(f"    - {result.get('id')}: {result.get('prompt')}")
        else:
            print(f"✗ No images found matching 'robot'")
            return False
    except Exception as e:
        print(f"✗ Failed to search: {e}")
        return False
    
    print()
    
    # Test 8: Get recent images
    print("[TEST 8] Get recent images...")
    try:
        recent = manager.get_recent_images(limit=5)
        print(f"✓ Retrieved {len(recent)} recent image(s)")
        for img in recent:
            print(f"    - {img.get('id')}: {img.get('prompt')[:50]}...")
    except Exception as e:
        print(f"✗ Failed to get recent images: {e}")
        return False
    
    print()

    # Test 9: Save an edit source and edited result with lineage metadata
    print("[TEST 9] Save edited image lineage...")
    try:
        source_filename = manager.save_source_image(b"test source bytes", "image/png")
        edited_filename = manager.save_image_backup(
            create_test_image_base64(),
            "Add a dog beside the subject",
            "google",
            kind="edited",
            source_image_id=source_filename,
        )
        edited_record = next(
            image for image in manager.get_index()["images"]
            if image.get("id") == edited_filename
        )
        if edited_record.get("kind") != "edited":
            print(f"Expected edited kind, found {edited_record.get('kind')}")
            return False
        if edited_record.get("source_image_id") != source_filename:
            print("Edited image source lineage was not preserved")
            return False
        if not manager.get_image_by_id(source_filename):
            print("Stored source image was not found")
            return False
        print(f"Edited image lineage saved: {edited_filename} <- {source_filename}")
    except Exception as e:
        print(f"Failed to save edited image lineage: {e}")
        return False

    print()

    # Test 10: Legacy records default to generated without rewriting the index
    print("[TEST 10] Apply defaults to legacy metadata...")
    try:
        raw_index = manager._read_index()
        raw_index["images"].append({
            "id": "legacy-image.jpg",
            "timestamp": "2026-01-01T00:00:00Z",
            "prompt": "Legacy image",
            "provider": "google",
        })
        raw_index["total_images"] = len(raw_index["images"])
        manager._write_index(raw_index)
        legacy_record = next(
            image for image in manager.get_index()["images"]
            if image.get("id") == "legacy-image.jpg"
        )
        if legacy_record.get("kind") != "generated":
            print(f"Expected generated default, found {legacy_record.get('kind')}")
            return False
        print("Legacy metadata defaults to generated")
    except Exception as e:
        print(f"Failed to apply legacy metadata defaults: {e}")
        return False

    print()
    print("=" * 70)
    print("✓ ALL TESTS PASSED")
    print("=" * 70)
    print()
    print("Test directory created at:")
    print(f"  {backup_root}")
    print()
    print("Image backup system is working correctly!")
    print()
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
