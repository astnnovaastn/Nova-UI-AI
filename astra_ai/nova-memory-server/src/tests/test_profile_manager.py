Memory System Server
│
├── server.py (Flask/FastAPI application)
│   ├── /api/memory/store (POST) - Store a memory
│   ├── /api/memory/retrieve (GET) - Retrieve memories
│   ├── /api/memory/cleanup (POST) - Trigger memory cleanup
│   ├── /api/memory/statistics (GET) - Get memory statistics
│   └── /api/memory/health (GET) - Check system health
│
├── nova_memory_interface.py (Handles basic memory operations)
│   ├── process_conversation(user_message, ai_response)
│   ├── get_context_for_ai_response(context_type)
│   ├── save_memory()
│   └── is_healthy()
│
├── enhanced_nova_memory_interface.py (Advanced memory operations)
│   ├── process_conversation(user_message, ai_response)
│   ├── get_context_for_ai_response(context_type)
│   ├── search_memories(query)
│   └── get_memory_gaps()
│
├── memory_cleanup_system.py (Manages memory cleanup)
│   ├── cleanup_memories(policy)
│   ├── start_automatic_cleanup()
│   └── stop_automatic_cleanup()
│
├── mem0_memory_system.py (Core memory management)
│   ├── NovaMemoryAI (Handles memory storage/retrieval)
│   ├── MemoryEventType (Defines memory event types)
│   ├── MemoryCategory (Defines memory categories)
│   └── ComprehensiveMemoryManager (Manages memory browsing and cleanup)
│
└── user_profile_manager.py (Handles user profiles and preferences)