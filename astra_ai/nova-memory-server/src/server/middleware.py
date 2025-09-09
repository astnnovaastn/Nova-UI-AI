memory_system_server/
│
├── app.py                          # Main server application (Flask/FastAPI)
├── requirements.txt                # Dependencies
│
├── memory/
│   ├── __init__.py                 # Package initialization
│   ├── nova_memory_interface.py     # Nova Memory Interface
│   ├── enhanced_nova_memory_interface.py  # Enhanced Memory Interface
│   ├── memory_cleanup_system.py     # Memory Cleanup System
│   ├── mem0_memory_system.py        # Core Memory Management System
│   ├── user_profile_manager.py       # User Profile Management
│   └── models.py                    # Data models (e.g., MemoryItem, UserProfile)
│
├── storage/
│   ├── nova_ai_memory.json          # Memory data storage
│   └── user_profiles.json           # User profile storage
│
└── logs/
    └── memory_system.log            # Log file for memory operations