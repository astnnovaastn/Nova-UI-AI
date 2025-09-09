Memory System Server
│
├── server.py (Main server file using Flask/FastAPI)
│   ├── Initialize NovaMemoryAI
│   ├── Initialize EnhancedNovaMemoryInterface
│   ├── Initialize MemoryCleanupSystem
│   ├── Define API endpoints
│   └── Start server
│
├── nova_memory_interface.py (Handles memory operations)
│   ├── NovaMemoryInterface
│   ├── MemoryInitializationError
│   └── Convenience functions
│
├── enhanced_nova_memory_interface.py (Advanced memory features)
│   ├── EnhancedNovaMemoryInterface
│   └── Methods for context and memory retrieval
│
├── memory_cleanup_system.py (Memory cleanup logic)
│   ├── MemoryCleanupSystem
│   └── Cleanup policies and rules
│
├── mem0_memory_system.py (Core memory management)
│   ├── NovaMemoryAI
│   ├── MemoryItem
│   ├── MemoryCategory
│   └── AdaptiveLearning classes
│
└── user_profile_manager.py (User profile management)
    ├── UserProfileManager
    └── ProfileCategory