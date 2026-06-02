#!/usr/bin/env python3
"""
Test script to send a search query through WebSocket and verify the fix
"""
import asyncio
import json
import websockets
import time
from datetime import datetime

async def test_search():
    uri = "ws://localhost:8340/ws/voice"
    
    try:
        async with websockets.connect(uri) as websocket:
            print(f"✅ Connected to {uri}")
            
            # Send a search query in the correct JSON format
            search_query = "search about machine learning models"
            message = {
                "type": "transcript",
                "text": search_query,
                "isFinal": True
            }
            print(f"\n📝 Sending search query: '{search_query}'")
            print(f"   Message: {json.dumps(message)}")
            
            await websocket.send(json.dumps(message))
            print(f"✓ Message sent at {datetime.now().strftime('%H:%M:%S')}")
            
            # Wait for response
            print("\n⏳ Waiting for Nova AI response (up to 30 seconds)...")
            start_time = time.time()
            response_count = 0
            
            # Listen for responses with a timeout
            while time.time() - start_time < 30:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    response_count += 1
                    
                    try:
                        response_data = json.loads(response)
                        resp_type = response_data.get('type')
                        print(f"\n  [{response_count}] Response type: {resp_type}")
                        
                        if resp_type == 'response':
                            text = response_data.get('text', '')[:100]
                            print(f"      Text: {text}...")
                        elif resp_type == 'response_audio':
                            print(f"      Audio generated ({len(response_data.get('audio', ''))} chars)")
                        elif resp_type == 'search_result':
                            print(f"      🔍 SEARCH RESULT BROADCAST!")
                            print(f"      Query: {response_data.get('query')}")
                            print(f"      ID: {response_data.get('id')}")
                    except:
                        pass
                        
                    # Stop after getting response
                    if response_count >= 2:
                        break
                        
                except asyncio.TimeoutError:
                    break
            
            # Wait for file to be written
            print(f"\n⏰ Waiting 3 seconds for server to write to file...")
            await asyncio.sleep(3)
            
            # Check the file
            print("\n📂 Checking content_analysis.json...")
            import json as json_lib
            from pathlib import Path
            
            content_file = Path("content_analysis.json")
            if content_file.exists():
                with open(content_file, 'r', encoding='utf-8') as f:
                    data = json_lib.load(f)
                
                analyses = data.get('analyses', [])
                if analyses:
                    latest = analyses[-1]
                    print(f"\n✅ Latest search in file:")
                    print(f"   ID: {latest.get('content_id')}")
                    print(f"   Query: {latest.get('query')}")
                    print(f"   Type: {latest.get('content_type')}")
                    print(f"   Content preview: {latest.get('raw_content', 'N/A')[:100]}...")
                else:
                    print("\n❌ No searches found in file")
            else:
                print(f"\n❌ content_analysis.json not found")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Testing Search Fix via WebSocket\n")
    asyncio.run(test_search())
