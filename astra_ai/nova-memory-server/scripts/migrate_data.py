memory_system_server/
│
├── memory_server.py                # Main application file
├── requirements.txt                # Dependencies (Flask, FastAPI, etc.)
│
├── memory/
│   ├── __init__.py                 # Package initialization
│   ├── nova_memory_interface.py     # Nova Memory Interface
│   ├── enhanced_nova_memory_interface.py  # Enhanced Memory Interface
│   ├── memory_cleanup_system.py     # Memory Cleanup System
│   ├── mem0_memory_system.py        # Core Memory System
│   └── user_profile_manager.py      # User Profile Management
│
└── config/
    ├── memory_cleanup_config.json   # Configuration for cleanup policies
    └── logging_config.json          # Logging configuration