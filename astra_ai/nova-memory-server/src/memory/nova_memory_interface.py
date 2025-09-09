Memory System Server
│
├── main.py (Entry point for the server)
│   ├── Initialize server framework (Flask/FastAPI)
│   ├── Set up routes for API endpoints
│   ├── Initialize NovaMemoryInterface or EnhancedNovaMemoryInterface
│   ├── Start MemoryCleanupSystem in a background thread
│   └── Start server
│
├── nova_memory_interface.py (Handles memory operations)
│   ├── NovaMemoryInterface
│   │   ├── process_conversation()
│   │   ├── get_context_for_ai_response()
│   │   ├── search_with_user_preferences()
│   │   ├── get_user_profile()
│   │   └── other memory-related methods
│   └── EnhancedNovaMemoryInterface (Extends NovaMemoryInterface)
│
├── memory_cleanup_system.py (Automatic memory cleanup)
│   ├── MemoryCleanupSystem
│   │   ├── cleanup_memories()
│   │   ├── start_automatic_cleanup()
│   │   └── stop_automatic_cleanup()
│
├── mem0_memory_system.py (Core memory management)
│   ├── NovaMemoryAI
│   │   ├── store_memory()
│   │   ├── retrieve_memory()
│   │   ├── delete_memory()
│   │   └── other memory management methods
│
├── enhanced_nova_memory_interface.py (Enhanced features)
│   ├── EnhancedNovaMemoryInterface
│   │   ├── process_conversation()
│   │   ├── get_context_for_ai_response()
│   │   └── other enhanced features
│
└── user_profile_manager.py (Handles user profiles)
    ├── UserProfileManager
    │   ├── get_user_profile()
    │   ├── update_user_profile()
    │   └── other user profile methods