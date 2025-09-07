"""
Test script to demonstrate the enhanced search capabilities
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'astra_ai'))

from astra_ai.core.enhanced_search import EnhancedSearchEngine, SearchStrategy
from astra_ai.core.advanced_memory_retrieval import AdvancedMemoryRetrieval, MemoryType, RetrievalContext
from astra_ai.core.nova_ai_v2 import NovaAI_V2
import time

def test_search_improvements():
    """Test the enhanced search capabilities."""
    print("🚀 Testing Enhanced Search System")
    print("=" * 50)
    
    # Initialize the enhanced system
    print("Initializing Nova AI V2...")
    ai = NovaAI_V2()
    
    # Add some test memories
    print("\n📝 Adding test memories...")
    test_memories = [
        ("I love playing guitar and listening to rock music", MemoryType.PREFERENCE),
        ("My favorite color is blue and I enjoy painting landscapes", MemoryType.PREFERENCE),
        ("Python is a programming language used for AI development", MemoryType.FACT),
        ("Machine learning algorithms can learn from data", MemoryType.FACT),
        ("I had a great conversation about artificial intelligence yesterday", MemoryType.CONVERSATION),
        ("The weather was sunny and warm today", MemoryType.CONVERSATION),
        ("I need to remember to buy groceries tomorrow", MemoryType.ACTION),
        ("My birthday is in December", MemoryType.FACT),
        ("I feel excited about learning new technologies", MemoryType.EMOTION),
        ("Classical music helps me concentrate while working", MemoryType.PREFERENCE)
    ]
    
    for content, mem_type in test_memories:
        ai.memory_retrieval.add_memory(content, mem_type)
        print(f"  ✓ Added: {content[:50]}...")
    
    print(f"\n✅ Added {len(test_memories)} memories to the system")
    
    # Test different search strategies
    test_queries = [
        ("What music do I like?", RetrievalContext.FACTUAL_QUERY),
        ("Tell me about programming", RetrievalContext.FACTUAL_QUERY),
        ("I'm feeling down today", RetrievalContext.EMOTIONAL_SUPPORT),
        ("Help me with a coding problem", RetrievalContext.PROBLEM_SOLVING),
        ("What are my preferences?", RetrievalContext.GENERAL_CHAT)
    ]
    
    print("\n🔍 Testing Search Queries")
    print("-" * 30)
    
    for query, context in test_queries:
        print(f"\n🔎 Query: '{query}'")
        print(f"📋 Context: {context.value}")
        
        start_time = time.time()
        result = ai.process_message(query, context)
        end_time = time.time()
        
        print(f"⏱️  Processing time: {(end_time - start_time)*1000:.2f}ms")
        print(f"🎯 Strategy used: {result['retrieval_info']['strategy']}")
        print(f"📊 Confidence: {result['retrieval_info']['confidence']:.2f}")
        print(f"💭 Memories found: {result['retrieval_info']['memory_count']}")
        print(f"📝 Response: {result['response'][:100]}...")
        print(f"💡 Explanation: {result['retrieval_info']['explanation']}")
    
    # Test feedback system
    print("\n🔄 Testing Feedback System")
    print("-" * 25)
    
    ai.provide_feedback("What music do I like?", True)
    print("✅ Provided positive feedback for music query")
    
    ai.provide_feedback("Tell me about programming", False)
    print("❌ Provided negative feedback for programming query")
    
    # Show system statistics
    print("\n📊 System Statistics")
    print("-" * 20)
    
    stats = ai.get_memory_summary()
    print(f"Total memories: {stats['memory_statistics']['total_memories']}")
    print(f"Total queries processed: {stats['performance_statistics']['total_queries']}")
    print(f"Successful retrievals: {stats['performance_statistics']['successful_retrievals']}")
    print(f"Average response time: {stats['performance_statistics']['average_response_time']*1000:.2f}ms")
    print(f"User satisfaction: {stats['performance_statistics']['user_satisfaction']:.2f}")
    
    # Test different search strategies
    print("\n🎛️  Testing Different Search Strategies")
    print("-" * 35)
    
    search_engine = ai.search_engine
    test_query = "music and guitar"
    
    strategies = [
        SearchStrategy.SEMANTIC,
        SearchStrategy.KEYWORD,
        SearchStrategy.HYBRID,
        SearchStrategy.TEMPORAL,
        SearchStrategy.IMPORTANCE
    ]
    
    for strategy in strategies:
        start_time = time.time()
        results = search_engine.search(test_query, strategy, max_results=3)
        end_time = time.time()
        
        print(f"\n🔧 Strategy: {strategy.value}")
        print(f"⏱️  Time: {(end_time - start_time)*1000:.2f}ms")
        print(f"📊 Results: {len(results)}")
        
        for i, result in enumerate(results[:2]):  # Show top 2 results
            print(f"  {i+1}. Score: {result.relevance_score:.3f} - {result.content[:60]}...")
    
    print("\n🎉 Enhanced Search System Test Complete!")
    print("=" * 50)

def compare_old_vs_new():
    """Compare old search method vs new enhanced search."""
    print("\n🆚 Comparing Old vs New Search Methods")
    print("=" * 45)
    
    # Simulate old search (simple keyword matching)
    def old_search(query, memories):
        """Simulate the old simple search method."""
        query_words = set(query.lower().split())
        results = []
        
        for memory in memories:
            memory_words = set(memory.lower().split())
            overlap = len(query_words & memory_words)
            if overlap > 0:
                score = overlap / len(query_words | memory_words)  # Jaccard similarity
                results.append((memory, score))
        
        return sorted(results, key=lambda x: x[1], reverse=True)[:3]
    
    # Test memories
    memories = [
        "I love playing guitar and listening to rock music",
        "Python is a programming language for AI development",
        "Classical music helps me concentrate while working",
        "Machine learning algorithms learn from data",
        "I enjoy painting landscapes with blue colors"
    ]
    
    test_queries = [
        "What music do I enjoy?",
        "Tell me about programming languages",
        "What helps with concentration?"
    ]
    
    # Initialize new system
    ai = NovaAI_V2()
    for memory in memories:
        ai.memory_retrieval.add_memory(memory, MemoryType.PREFERENCE)
    
    for query in test_queries:
        print(f"\n🔍 Query: '{query}'")
        
        # Old method
        print("📊 Old Method (Simple Keyword Matching):")
        old_results = old_search(query, memories)
        for i, (memory, score) in enumerate(old_results):
            print(f"  {i+1}. Score: {score:.3f} - {memory[:50]}...")
        
        # New method
        print("🚀 New Method (Enhanced Semantic Search):")
        new_result = ai.process_message(query)
        print(f"  Strategy: {new_result['retrieval_info']['strategy']}")
        print(f"  Confidence: {new_result['retrieval_info']['confidence']:.3f}")
        print(f"  Memories found: {new_result['retrieval_info']['memory_count']}")
        print(f"  Response: {new_result['response'][:80]}...")

if __name__ == "__main__":
    try:
        test_search_improvements()
        compare_old_vs_new()
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()