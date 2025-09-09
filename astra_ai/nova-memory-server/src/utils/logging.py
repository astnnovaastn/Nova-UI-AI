/memory_system_server
│
├── app.py                          # Main server application (Flask/FastAPI)
├── memory/
│   ├── __init__.py
│   ├── nova_memory_interface.py     # Nova Memory Interface
│   ├── enhanced_nova_memory_interface.py  # Enhanced Memory Interface
│   ├── memory_cleanup_system.py      # Memory Cleanup System
│   ├── mem0_memory_system.py         # Core Memory Management
│   ├── user_profile_manager.py       # User Profile Management
│   └── ...
│
├── storage/
│   ├── nova_ai_memory.json          # Memory data storage
│   └── user_profiles.json           # User profile storage
│
├── requirements.txt                 # Dependencies
└── README.md                        # Documentation