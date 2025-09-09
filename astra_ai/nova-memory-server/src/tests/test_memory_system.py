memory_system_server/
│
├── app.py                          # Main server application (Flask/FastAPI)
├── memory/
│   ├── __init__.py
│   ├── nova_memory_interface.py     # NovaMemoryInterface class
│   ├── enhanced_nova_memory_interface.py  # EnhancedNovaMemoryInterface class
│   ├── memory_cleanup_system.py      # MemoryCleanupSystem class
│   ├── mem0_memory_system.py         # NovaMemoryAI class
│   ├── user_profile_manager.py        # User profile management
│   └── memory_event_handlers.py       # Event handlers for memory operations
│
├── data/
│   ├── nova_ai_memory.json           # Memory data storage
│   └── user_profile.json             # User profile data
│
├── requirements.txt                  # Dependencies
└── README.md                         # Documentation