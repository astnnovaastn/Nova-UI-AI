memory_system_server/
│
├── app.py                          # Main server application (Flask/FastAPI)
├── memory/
│   ├── __init__.py
│   ├── nova_memory_interface.py     # Memory interface for processing requests
│   ├── enhanced_nova_memory_interface.py  # Enhanced memory interface
│   ├── mem0_memory_system.py        # Core memory management logic
│   ├── memory_cleanup_system.py      # Memory cleanup logic
│   ├── user_profile_manager.py       # User profile management
│   └── models.py                    # Data models (MemoryItem, UserProfile, etc.)
│
├── storage/
│   ├── nova_ai_memory.json          # JSON file for memory storage
│   └── user_profiles.json           # JSON file for user profiles
│
└── requirements.txt                 # Dependencies for the server