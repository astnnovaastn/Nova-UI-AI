#!/usr/bin/env python3
"""
Nova Memory Server (FastAPI)
- Canonical service for Enhanced/Nova Memory Interface over HTTP
- Clean FastAPI app with CORS and graceful fallbacks

Run (PowerShell):
  python "c:\\Users\\afian\\OneDrive\\Desktop\\Astra_ai\\astra_ai\\nova-memory-server\\src\\server\\main.py"

Or start via uvicorn programmatically (handled in __main__).
"""
from __future__ import annotations

import os
import sys
from dataclasses import asdict, is_dataclass
from typing import Any, Dict, Optional

# Ensure project root is on sys.path for absolute imports like `astra_ai.memory...`
CURRENT_DIR = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import memory backends from the in-repo implementation
try:
    from astra_ai.memory.enhanced_nova_memory_interface import (
        EnhancedNovaMemoryInterface,
    )
    ENHANCED_AVAILABLE = True
except Exception:
    EnhancedNovaMemoryInterface = None  # type: ignore
    ENHANCED_AVAILABLE = False

from astra_ai.memory.nova_memory_interface import NovaMemoryInterface
from astra_ai.memory.memory_cleanup_system import MemoryCleanupSystem, CleanupPolicy

app = FastAPI(title="Nova Memory Server (FastAPI)", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    user_message: str
    ai_response: str
    context: Optional[Dict[str, Any]] = None


class CleanupRequest(BaseModel):
    policy: Optional[str] = None  # "balanced" | "conservative" | "aggressive"
    dry_run: Optional[bool] = False


# Initialize memory components with graceful fallback
MEMORY_IFACE: Optional[NovaMemoryInterface] = None
CLEANUP_SYSTEM: Optional[MemoryCleanupSystem] = None


@app.on_event("startup")
def on_startup():
    global MEMORY_IFACE, CLEANUP_SYSTEM

    if ENHANCED_AVAILABLE:
        try:
            # Enhanced interface manages its own cleanup system internally too
            MEMORY_IFACE = EnhancedNovaMemoryInterface()  # type: ignore
        except Exception:
            MEMORY_IFACE = None

    if MEMORY_IFACE is None:
        # Fallback to standard interface
        MEMORY_IFACE = NovaMemoryInterface()

    # Setup dedicated cleanup system using the memory file from the interface if available
    memory_file = getattr(MEMORY_IFACE, "memory_file", "nova_ai_memory.json")
    CLEANUP_SYSTEM = MemoryCleanupSystem(memory_file=memory_file, profile_file="user_profile.json")
    try:
        CLEANUP_SYSTEM.start_automatic_cleanup()
    except Exception:
        # Non-fatal if background thread can't start
        pass


@app.on_event("shutdown")
def on_shutdown():
    if CLEANUP_SYSTEM:
        try:
            CLEANUP_SYSTEM.stop_automatic_cleanup()
        except Exception:
            pass


@app.get("/health")
def health() -> Dict[str, Any]:
    return {"ok": True, "enhanced": ENHANCED_AVAILABLE}


@app.post("/memory/store")
def store_memory(req: ProcessRequest) -> Dict[str, Any]:
    if not MEMORY_IFACE:
        raise HTTPException(status_code=500, detail="Memory interface not initialized")
    try:
        result = MEMORY_IFACE.process_conversation(
            req.user_message, req.ai_response, req.context
        )
        # Ensure JSON-serializable
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/context")
def get_context(context_type: str = "comprehensive") -> Dict[str, Any]:
    if not MEMORY_IFACE:
        raise HTTPException(status_code=500, detail="Memory interface not initialized")
    try:
        ctx = MEMORY_IFACE.get_context_for_ai_response(context_type)
        return ctx
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/memory/stats")
def memory_stats() -> Dict[str, Any]:
    if not MEMORY_IFACE:
        raise HTTPException(status_code=500, detail="Memory interface not initialized")
    try:
        stats = MEMORY_IFACE.get_memory_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cleanup")
def run_cleanup(req: CleanupRequest) -> Dict[str, Any]:
    if not CLEANUP_SYSTEM:
        raise HTTPException(status_code=500, detail="Cleanup system not initialized")

    # Map string policy to CleanupPolicy enum (default: BALANCED)
    policy = CleanupPolicy.BALANCED
    if req.policy:
        val = req.policy.strip().lower()
        if val == "conservative":
            policy = CleanupPolicy.CONSERVATIVE
        elif val == "aggressive":
            policy = CleanupPolicy.AGGRESSIVE
        else:
            policy = CleanupPolicy.BALANCED

    try:
        stats = CLEANUP_SYSTEM.cleanup_memories(policy=policy, dry_run=bool(req.dry_run))
        if is_dataclass(stats):
            return asdict(stats)
        # Fallback if implementation changes
        return stats  # type: ignore
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Local run helper (avoids import path issues due to hyphen in folder name)
    try:
        import uvicorn
    except Exception:
        print("uvicorn is not installed. Install with: pip install uvicorn[standard]")
        raise

    uvicorn.run(app, host="127.0.0.1", port=8001, reload=False)
