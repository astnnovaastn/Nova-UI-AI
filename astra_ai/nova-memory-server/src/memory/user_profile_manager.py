memory_system_server/
│
├── app.py                          # Main server application (Flask/FastAPI)
├── requirements.txt                # Dependencies
│
├── memory/
│   ├── __init__.py                 # Package initialization
│   ├── nova_memory_interface.py     # NovaMemoryInterface class
│   ├── enhanced_nova_memory_interface.py  # EnhancedNovaMemoryInterface class
│   ├── memory_cleanup_system.py     # MemoryCleanupSystem class
│   ├── mem0_memory_system.py        # NovaMemoryAI class
│   ├── user_profile_manager.py      # UserProfileManager class
│   └── other_memory_management.py    # Other memory management classes
│
└── storage/
    ├── nova_ai_memory.json          # Memory storage file
    └── user_profile.json             # User profile storage file