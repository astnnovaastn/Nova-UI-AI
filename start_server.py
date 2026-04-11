#!/usr/bin/env python3
"""
Direct server launcher - with lazy imports to avoid compatibility issues
"""
if __name__ == "__main__":
    import sys
    import os
    
    sys.path.insert(0, str(r'd:\Astra_ai'))
    os.chdir(r'd:\Astra_ai')
    
    # Lazy import to avoid early binding issues
    try:
        import uvicorn
        from astra_ai.ui.backend.server import app
        
        print("="*70)
        print("[*] NOVA AI BACKEND SERVER")
        print("="*70)
        print("[>] WebSocket: ws://localhost:8340/ws/voice")
        print("[>] HTTP API:  http://localhost:8340/api")
        print("="*70)
        print("")
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8340,
            log_level="info"
        )
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        print("")
        print("[*] Tip: Check that all dependencies are installed")
        print("")
        sys.exit(1)
