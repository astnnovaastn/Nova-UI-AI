#!/usr/bin/env python3
"""
Test script to demonstrate Mem0AI performance improvements
"""

import time
import asyncio
from astra_ai.core.nova_ai import Mem0AI

async def test_memory_performance():
    """Test the performance improvements of the optimized Mem0AI"""
    
    print("🚀 Testing Optimized Mem0AI Performance")
    print("=" * 50)
    
    try:
        # Initialize Mem0AI
        mem0 = Mem0AI()
        
        # Test 1: Batch Processing Performance
        print("\n📦 Test 1: Batch Processing")
        print("-" * 30)
        
        start_time = time.time()
        
        # Store multiple memories (should be queued for batch processing)
        test_memories = [
            "User prefers short responses",
            "User is interested in AI technology", 
            "User asked about Python programming",
            "User likes technical explanations",
            "User prefers no emojis in responses"
        ]
        
        for i, memory in enumerate(test_memories):
            result = mem0.store_memory(f"{memory} - Test {i+1}")
            print(f"  ✓ Queued memory {i+1}: {result.get('status', 'unknown')}")
        
        # Force flush the batch
        batch_result = mem0.flush_memory_queue()
        batch_time = time.time() - start_time
        
        print(f"  📊 Batch processed {batch_result.get('count', 0)} memories in {batch_time:.2f}s")
        
        # Test 2: Cache Performance
        print("\n🗄️ Test 2: Cache Performance")
        print("-" * 30)
        
        # First query (will hit the API)
        start_time = time.time()
        memories1 = mem0.retrieve_memories("Python programming", limit=3)
        first_query_time = time.time() - start_time
        print(f"  🔍 First query: {len(memories1)} results in {first_query_time:.2f}s")
        
        # Second identical query (should hit cache)
        start_time = time.time()
        memories2 = mem0.retrieve_memories("Python programming", limit=3)
        cached_query_time = time.time() - start_time
        print(f"  ⚡ Cached query: {len(memories2)} results in {cached_query_time:.2f}s")
        
        speedup = first_query_time / cached_query_time if cached_query_time > 0 else float('inf')
        print(f"  🚀 Cache speedup: {speedup:.1f}x faster")
        
        # Test 3: Performance Statistics
        print("\n📈 Test 3: Performance Statistics")
        print("-" * 30)
        
        stats = mem0.get_performance_stats()
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
        # Test 4: Settings Optimization
        print("\n⚙️ Test 4: Settings Optimization")
        print("-" * 30)
        
        print("  Original settings:")
        print(f"    Batch size: {mem0._batch_size}")
        print(f"    Cache timeout: {mem0._cache_timeout}s")
        
        # Optimize for faster processing
        mem0.optimize_settings(batch_size=3, cache_timeout=180)
        
        print("  Optimized settings:")
        print(f"    Batch size: {mem0._batch_size}")
        print(f"    Cache timeout: {mem0._cache_timeout}s")
        
        # Test 5: Cleanup
        print("\n🧹 Test 5: Cleanup")
        print("-" * 30)
        
        mem0.shutdown()
        print("  ✓ Shutdown completed successfully")
        
        print("\n🎉 Performance Test Completed!")
        print("=" * 50)
        print("Key Improvements:")
        print("• Batch processing reduces API calls")
        print("• Caching speeds up repeated queries")
        print("• Automatic cleanup prevents memory leaks")
        print("• Configurable settings for optimization")
        
    except Exception as e:
        print(f"❌ Error during performance test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_memory_performance())