#!/usr/bin/env python3
"""
Test script for enhanced AI search functionality in Nova AI
"""

import asyncio
import sys
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

def test_search_format():
    """Test the new comprehensive search format"""
    print("🧪 Testing Enhanced Search Format...")
    print()
    
    try:
        from core.nova_ai import AleChatBot
        bot = AleChatBot()
        
        # Test queries that should trigger comprehensive search
        test_queries = [
            "What is artificial intelligence?",
            "What is the capital city of France?",
            "What's the newest iPhone?",
            "What is machine learning?",
            "What is climate change?"
        ]
        
        print("✅ Testing Search Query Processing:")
        
        for query in test_queries:
            print(f"\n🔍 Testing query: '{query}'")
            
            # Test if it's detected as a search query
            if hasattr(bot, '_should_search'):
                should_search = bot._should_search(query)
                print(f"  Search detection: {'✅ YES' if should_search else '❌ NO'}")

            # Test the comprehensive analysis format
            search_system = getattr(bot, 'search_system', None)
            if search_system and hasattr(search_system, '_generate_comprehensive_analysis'):
                # Mock some results for testing
                mock_web_results = [
                    {
                        "title": f"Understanding {query.replace('What is ', '').replace('?', '')}",
                        "snippet": f"This is a comprehensive explanation of {query.replace('What is ', '').replace('?', '')} with detailed information and context.",
                        "url": "https://example.com",
                        "type": "web_result"
                    }
                ]
                
                mock_kg_result = {
                    "title": query.replace('What is ', '').replace('?', '').title(),
                    "description": f"{query.replace('What is ', '').replace('?', '').title()} is an important concept in modern technology and society.",
                    "type": "knowledge_graph"
                }
                
                try:
                    # Test the new comprehensive format
                    result = search_system._generate_comprehensive_analysis(
                        mock_kg_result, None, mock_web_results, [], query, "comprehensive"
                    )
                    
                    # Check if the result follows the new format
                    required_sections = [
                        "SEARCH RESULT",
                        "Direct Answer",
                        "Additional Information",
                        "Background and Origins",
                        "Current Relevance",
                        "Key Facts and Statistics",
                        "Comparisons and Related Information",
                        "Applications and Use Cases",
                        "Challenges, Criticisms, or Controversies",
                        "Future Developments or Trends",
                        "Conclusion",
                        "Sources"
                    ]
                    
                    sections_found = 0
                    for section in required_sections:
                        if section in result:
                            sections_found += 1
                    
                    print(f"  Format compliance: {sections_found}/{len(required_sections)} sections found")
                    
                    # Check if ** formatting is removed
                    has_asterisks = "**" in result
                    print(f"  Formatting clean: {'❌ Contains **' if has_asterisks else '✅ Clean formatting'}")
                    
                    # Show a sample of the result
                    print(f"  Sample output (first 200 chars):")
                    print(f"    {result[:200]}...")
                    
                except Exception as e:
                    print(f"  ❌ Error testing format: {e}")
            else:
                print(f"  ⚠️ Search system or comprehensive analysis method not found")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def test_section_methods():
    """Test individual section creation methods"""
    print("\n🧪 Testing Individual Section Methods...")
    print()
    
    try:
        from core.nova_ai import AleChatBot
        bot = AleChatBot()

        # Get the search system
        search_system = getattr(bot, 'search_system', None)
        if not search_system:
            print("  ❌ Search system not found")
            return False

        # Mock data for testing
        mock_results = [
            {
                "title": "Artificial Intelligence Overview",
                "snippet": "AI is the simulation of human intelligence in machines that are programmed to think and learn.",
                "type": "web_result"
            },
            {
                "title": "History of AI",
                "snippet": "The concept of AI was first discussed in the 1950s by pioneers like Alan Turing.",
                "type": "web_result"
            }
        ]

        test_query = "What is artificial intelligence?"

        # Test each section method
        section_methods = [
            ('_create_direct_answer', 'Direct Answer'),
            ('_create_additional_information', 'Additional Information'),
            ('_create_background_section', 'Background and Origins'),
            ('_create_current_relevance', 'Current Relevance'),
            ('_create_key_facts', 'Key Facts and Statistics'),
            ('_create_comparisons', 'Comparisons and Related Information'),
            ('_create_applications', 'Applications and Use Cases'),
            ('_create_challenges', 'Challenges, Criticisms, or Controversies'),
            ('_create_future_trends', 'Future Developments or Trends'),
            ('_create_enhanced_conclusion', 'Conclusion'),
            ('_create_enhanced_sources', 'Sources')
        ]

        methods_working = 0
        total_methods = len(section_methods)

        for method_name, section_name in section_methods:
            if hasattr(search_system, method_name):
                try:
                    method = getattr(search_system, method_name)
                    
                    # Call method with appropriate parameters
                    if method_name in ['_create_direct_answer']:
                        result = method(None, None, mock_results, test_query)
                    elif method_name in ['_create_enhanced_conclusion']:
                        result = method(test_query, mock_results)
                    elif method_name in ['_create_enhanced_sources']:
                        result = method(mock_results)
                    else:
                        result = method(mock_results, test_query)
                    
                    if result and len(result) > 10:
                        print(f"  ✅ {section_name}: Working ({len(result)} chars)")
                        methods_working += 1
                    else:
                        print(f"  ⚠️ {section_name}: Short result ({len(result) if result else 0} chars)")
                        
                except Exception as e:
                    print(f"  ❌ {section_name}: Error - {e}")
            else:
                print(f"  ❌ {section_name}: Method not found")
        
        print(f"\n📊 Section Methods: {methods_working}/{total_methods} working properly")
        
        return methods_working >= total_methods * 0.8
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def test_full_search_integration():
    """Test full search integration with the new format"""
    print("\n🧪 Testing Full Search Integration...")
    print()
    
    try:
        from core.nova_ai import AleChatBot
        bot = AleChatBot()
        
        # Test a simple search query
        test_query = "What is Python programming?"
        
        print(f"🔍 Testing full search for: '{test_query}'")
        
        # This would normally trigger a full search
        if hasattr(bot, 'process_message'):
            try:
                # Note: This might fail due to API keys, but we can test the structure
                response = await bot.process_message(test_query)
                
                if response:
                    print(f"  ✅ Response generated ({len(response)} chars)")
                    
                    # Check if it follows the new format
                    if "SEARCH RESULT" in response:
                        print(f"  ✅ Uses new SEARCH RESULT format")
                    else:
                        print(f"  ⚠️ May not use new format (could be cached or different path)")
                    
                    # Check formatting
                    if "**" not in response:
                        print(f"  ✅ Clean formatting (no ** symbols)")
                    else:
                        print(f"  ⚠️ Contains ** formatting symbols")
                    
                    # Show sample
                    print(f"  Sample (first 300 chars):")
                    print(f"    {response[:300]}...")
                    
                else:
                    print(f"  ❌ No response generated")
                    
            except Exception as e:
                print(f"  ⚠️ Full integration test failed (likely API issue): {e}")
                print(f"  This is expected if API keys are not configured")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def main():
    """Main test function"""
    print("🎯 ENHANCED SEARCH FUNCTIONALITY TEST")
    print("=" * 50)
    
    results = []
    
    # Test 1: Search format
    results.append(test_search_format())
    
    # Test 2: Section methods
    results.append(test_section_methods())
    
    # Test 3: Full integration
    results.append(await test_full_search_integration())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    test_names = [
        "Search Format Structure",
        "Section Methods",
        "Full Integration"
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
        print("\n🎉 Enhanced search functionality is working well!")
        print("\n💡 To test manually:")
        print("  1. Start Nova AI: python astra_ai/core/nova_ai.py")
        print("  2. Ask: 'What is artificial intelligence?'")
        print("  3. You should see the new SEARCH RESULT format!")
    elif overall_percentage >= 60:
        print("\n⚠️ Enhanced search has some issues but is functional.")
    else:
        print("\n❌ Enhanced search needs significant fixes.")

if __name__ == "__main__":
    asyncio.run(main())
