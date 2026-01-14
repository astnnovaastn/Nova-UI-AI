"""
Final optimization of the main memory file to ensure it's properly processed
"""

from astra_ai.memory.mem0_memory_system import NovaMemoryAI

def optimize_main_file():
    print("Performing final optimization on the main memory file...")
    
    # Load the existing memory file with auto-optimizer
    memory_system = NovaMemoryAI(storage_file="Date/nova_ai_memory.json", auto_optimize=True)
    memory_system.load_memory()
    
    print(f"Loaded memory with {len(memory_system.data['memory_engine']['memory_events'])} events")
    print(f"Current clusters: {len(memory_system.data['memory_engine']['clusters'])}")
    
    # Force optimization to ensure proper clustering
    print("Forcing optimization to create optimized clusters...")
    success = memory_system.force_optimizer_optimization()
    
    if success:
        print("SUCCESS: Optimization completed successfully")

        # Wait a bit for the file to be updated
        import time
        time.sleep(1)

        # Reload to see the results
        memory_system.load_memory()
        print(f"After optimization - Events: {len(memory_system.data['memory_engine']['memory_events'])}")
        print(f"After optimization - Clusters: {len(memory_system.data['memory_engine']['clusters'])}")

        # Show a sample of the clusters created
        clusters = memory_system.data['memory_engine']['clusters']
        print("\nCreated clusters:")
        for i, (cluster_id, cluster) in enumerate(clusters.items()):
            if i >= 5:  # Show first 5
                print("  ...")
                break
            print(f"  {cluster_id}: {cluster['topic']} - {len(cluster['event_ids'])} events, coherence: {cluster.get('coherence_score', 'N/A')}")
    else:
        print("FAILED: Optimization failed")
    
    # Get metrics
    metrics = memory_system.get_optimizer_metrics()
    print(f"\nOptimizer metrics: {metrics}")
    
    # Stop optimizer
    memory_system.stop_auto_optimizer()
    
    print("\nMain memory file optimization completed!")

if __name__ == "__main__":
    optimize_main_file()