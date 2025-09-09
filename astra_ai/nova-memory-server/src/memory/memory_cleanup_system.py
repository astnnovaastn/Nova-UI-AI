# main.py
from fastapi import FastAPI
from nova_memory_interface import NovaMemoryInterface
from enhanced_nova_memory_interface import EnhancedNovaMemoryInterface
from memory_cleanup_system import MemoryCleanupSystem

app = FastAPI()

# Initialize memory systems
memory_interface = EnhancedNovaMemoryInterface("enhanced_nova_memory.json")
cleanup_system = MemoryCleanupSystem("nova_ai_memory.json")

@app.on_event("startup")
async def startup_event():
    # Load memory and start cleanup system
    memory_interface.initialize()
    cleanup_system.start_automatic_cleanup()

@app.post("/memory/store")
async def store_memory(user_message: str, ai_response: str, context: Optional[Dict[str, Any]] = None):
    result = memory_interface.process_conversation(user_message, ai_response, context)
    return result

@app.get("/memory/retrieve")
async def retrieve_memory(query: str):
    results = memory_interface.search_memories(query)
    return results

@app.delete("/memory/delete")
async def delete_memory(memory_id: str):
    result = memory_interface.delete_memory(memory_id)
    return result

@app.get("/memory/stats")
async def get_memory_stats():
    stats = memory_interface.get_memory_statistics()
    return stats

@app.get("/memory/health")
async def check_health():
    health = memory_interface.is_healthy()
    return health

@app.on_event("shutdown")
async def shutdown_event():
    cleanup_system.stop_automatic_cleanup()