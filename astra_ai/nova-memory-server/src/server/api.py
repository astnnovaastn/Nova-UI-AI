Memory System Server
│
├── app.py (Main server file)
│   ├── Initialize Flask/FastAPI
│   ├── Define API endpoints
│   │   ├── /memory/store
│   │   ├── /memory/retrieve
│   │   ├── /memory/update
│   │   ├── /memory/delete
│   │   ├── /memory/cleanup
│   │   ├── /memory/statistics
│   │   └── /memory/health
│   ├── Initialize NovaMemoryInterface
│   ├── Initialize MemoryCleanupSystem
│   └── Start server
│
├── nova_memory_interface.py (Handles memory operations)
│   ├── process_conversation()
│   ├── get_context_for_ai_response()
│   ├── search_with_user_preferences()
│   └── other memory-related methods
│
├── enhanced_nova_memory_interface.py (Enhanced features)
│   ├── process_conversation()
│   ├── get_context_for_ai_response()
│   └── other advanced methods
│
├── mem0_memory_system.py (Core memory management)
│   ├── NovaMemoryAI class
│   ├── MemoryItem class
│   └── MemoryEventType enum
│
├── memory_cleanup_system.py (Memory cleanup logic)
│   ├── MemoryCleanupSystem class
│   ├── CleanupPolicy enum
│   └── cleanup_memories() method
│
└── user_profile_manager.py (User profile management)
    ├── UserProfileManager class
    └── methods for managing user profiles