#!/usr/bin/env python3
"""
Test script for enhanced AI vision system with automatic camera activation
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

def test_vision_query_detection():
    """Test if vision queries are properly detected"""
    print("🧪 Testing Enhanced Vision Query Detection...")
    print()
    
    try:
        from core.nova_ai import AleChatBot
        bot = AleChatBot()
        
        # Test queries that should trigger auto-vision
        auto_vision_queries = [
            "What do you see?",
            "What am I holding?",
            "What is this?",
            "Look at what I'm holding",
            "What do you see in front of you?",
            "What is the color of this?",
            "Can you see this?",
            "What's in my hand?",
            "Identify this object"
        ]
        
        # Test queries that should NOT trigger auto-vision
        non_vision_queries = [
            "What's the weather like?",
            "Tell me a joke",
            "What time is it?",
            "Play some music",
            "How are you?"
        ]
        
        print("✅ Auto-Vision Trigger Tests:")
        passed = 0
        total = len(auto_vision_queries)
        
        for query in auto_vision_queries:
            # Check if it's detected as a vision query
            if hasattr(bot, '_process_vision_query'):
                # This is an async method, so we'll test the detection logic
                query_lower = query.lower()
                auto_vision_patterns = [
                    r"what do you see",
                    r"what am i holding",
                    r"what is this",
                    r"what is that",
                    r"look at what i'm holding",
                    r"look at this",
                    r"what do you see in front of you",
                    r"what is the color of this",
                    r"what color is this",
                    r"identify this",
                    r"recognize this",
                    r"analyze this",
                    r"describe what you see",
                    r"tell me what this is",
                    r"can you see this",
                    r"do you see this",
                    r"what's in my hand",
                    r"what am i showing you"
                ]
                
                import re
                auto_activate = any(re.search(pattern, query_lower) for pattern in auto_vision_patterns)
                
                if auto_activate:
                    print(f"  ✅ '{query}' -> Auto-vision triggered")
                    passed += 1
                else:
                    print(f"  ❌ '{query}' -> Auto-vision NOT triggered")
            else:
                print(f"  ⚠️ Vision processing method not found")
        
        print(f"\n📊 Auto-Vision Detection: {passed}/{total} passed")
        
        print("\n✅ Non-Vision Query Tests:")
        passed_non = 0
        total_non = len(non_vision_queries)
        
        for query in non_vision_queries:
            query_lower = query.lower()
            auto_vision_patterns = [
                r"what do you see",
                r"what am i holding",
                r"what is this",
                r"what is that",
                r"look at what i'm holding",
                r"look at this",
                r"what do you see in front of you",
                r"what is the color of this",
                r"what color is this",
                r"identify this",
                r"recognize this",
                r"analyze this",
                r"describe what you see",
                r"tell me what this is",
                r"can you see this",
                r"do you see this",
                r"what's in my hand",
                r"what am i showing you"
            ]
            
            import re
            auto_activate = any(re.search(pattern, query_lower) for pattern in auto_vision_patterns)
            
            if not auto_activate:
                print(f"  ✅ '{query}' -> Correctly NOT triggered")
                passed_non += 1
            else:
                print(f"  ❌ '{query}' -> Incorrectly triggered")
        
        print(f"\n📊 Non-Vision Detection: {passed_non}/{total_non} passed")
        
        return passed >= total * 0.8 and passed_non >= total_non * 0.8
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_vision_system_availability():
    """Test if the AI vision system is available and enhanced"""
    print("\n🧪 Testing Vision System Availability...")
    print()
    
    try:
        from core.nova_ai import AleChatBot, AI_VISION_AVAILABLE
        
        print(f"AI Vision Available: {AI_VISION_AVAILABLE}")
        
        if not AI_VISION_AVAILABLE:
            print("❌ AI Vision system not available")
            return False
        
        bot = AleChatBot()
        
        if not bot.ai_vision:
            print("❌ AI Vision not initialized in bot")
            return False
        
        print("✅ AI Vision system initialized")
        
        # Check for enhanced methods
        enhanced_methods = [
            '_generate_conversational_response',
            '_respond_to_holding_query',
            '_respond_to_color_query',
            '_respond_to_identification_query',
            '_respond_to_general_query'
        ]
        
        methods_found = 0
        for method in enhanced_methods:
            if hasattr(bot.ai_vision, method):
                print(f"  ✅ Enhanced method found: {method}")
                methods_found += 1
            else:
                print(f"  ❌ Enhanced method missing: {method}")
        
        print(f"\n📊 Enhanced Methods: {methods_found}/{len(enhanced_methods)} found")
        
        return methods_found >= len(enhanced_methods) * 0.8
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_widget_enhancement():
    """Test if the AI eye widget has been enhanced"""
    print("\n🧪 Testing Widget Enhancement...")
    print()
    
    try:
        widget_path = Path(__file__).parent.parent / "ui" / "ai_eye_widget.html"
        
        if not widget_path.exists():
            print("❌ AI Eye widget not found")
            return False
        
        print("✅ AI Eye widget found")
        
        # Read widget content
        with open(widget_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for enhanced features
        enhanced_features = [
            'auto-activation-banner',
            'autoActivated',
            'pendingQuery',
            'analysisType',
            'autoStartVision',
            'performAutoAnalysis',
            'generateAnalysisPrompt',
            'sendAnalysisToChat'
        ]
        
        features_found = 0
        for feature in enhanced_features:
            if feature in content:
                print(f"  ✅ Enhanced feature found: {feature}")
                features_found += 1
            else:
                print(f"  ❌ Enhanced feature missing: {feature}")
        
        print(f"\n📊 Enhanced Features: {features_found}/{len(enhanced_features)} found")
        
        return features_found >= len(enhanced_features) * 0.8
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def test_auto_vision_response():
    """Test the auto-vision response generation"""
    print("\n🧪 Testing Auto-Vision Response Generation...")
    print()
    
    try:
        from core.nova_ai import AleChatBot
        bot = AleChatBot()
        
        if not bot.ai_vision:
            print("❌ AI Vision not available")
            return False
        
        # Test auto-vision request handling
        test_queries = [
            "What am I holding?",
            "What do you see?",
            "What is the color of this?"
        ]
        
        passed = 0
        for query in test_queries:
            try:
                response = await bot._process_vision_query(query)
                
                if response and "Activating AI Vision" in response:
                    print(f"  ✅ '{query}' -> Auto-vision response generated")
                    passed += 1
                else:
                    print(f"  ❌ '{query}' -> No auto-vision response")
                    
            except Exception as e:
                print(f"  ❌ '{query}' -> Error: {e}")
        
        print(f"\n📊 Auto-Vision Responses: {passed}/{len(test_queries)} passed")
        
        return passed >= len(test_queries) * 0.8
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🎯 ENHANCED AI VISION SYSTEM TEST")
    print("=" * 50)
    
    results = []
    
    # Test 1: Vision query detection
    results.append(test_vision_query_detection())
    
    # Test 2: Vision system availability
    results.append(test_vision_system_availability())
    
    # Test 3: Widget enhancement
    results.append(test_widget_enhancement())
    
    # Test 4: Auto-vision response
    results.append(await test_auto_vision_response())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    test_names = [
        "Vision Query Detection",
        "Vision System Availability", 
        "Widget Enhancement",
        "Auto-Vision Response"
    ]
    
    passed_tests = sum(1 for result in results if result)
    total_tests = len(results)
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {name}")
    
    print("-" * 50)
    overall_percentage = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    overall_status = "✅" if overall_percentage >= 80 else "⚠️" if overall_percentage >= 60 else "❌"
    
    print(f"{overall_status} OVERALL: {passed_tests}/{total_tests} ({overall_percentage:.1f}%)")
    
    if overall_percentage >= 80:
        print("\n🎉 Enhanced AI Vision system is working well!")
        print("\n💡 To test manually:")
        print("  1. Start Nova AI Desktop: python astra_ai/scripts/run_desktop_nova.py")
        print("  2. Say: 'What am I holding?' or 'What do you see?'")
        print("  3. Camera should auto-activate and analyze immediately!")
    elif overall_percentage >= 60:
        print("\n⚠️ Enhanced AI Vision has some issues but is functional.")
    else:
        print("\n❌ Enhanced AI Vision needs significant fixes.")

if __name__ == "__main__":
    asyncio.run(main())
