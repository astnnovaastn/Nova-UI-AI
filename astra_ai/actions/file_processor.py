"""
file_processor.py — JARVIS Universal File Processor (Refactored for Nova AI)
Now uses the system's LLM (Groq) for processing tasks.
"""

import os
import re
import json
import shutil
import subprocess
import tempfile
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional, Callable, Any

# Optional imports for specific file types
try:
    from PIL import Image
    _HAS_PILLOW = True
except ImportError:
    _HAS_PILLOW = False

try:
    import pandas as pd
    _HAS_PANDAS = True
except ImportError:
    _HAS_PANDAS = False

try:
    import pdfplumber
    _HAS_PDFPLUMBER = True
except ImportError:
    _HAS_PDFPLUMBER = False

try:
    from docx import Document
    _HAS_DOCX = True
except ImportError:
    _HAS_DOCX = False

try:
    from pptx import Presentation
    _HAS_PPTX = True
except ImportError:
    _HAS_PPTX = False

try:
    from pydub import AudioSegment
    _HAS_PYDUB = True
except ImportError:
    _HAS_PYDUB = False

def _detect_type(path: Path) -> str:
    ext = path.suffix.lower().lstrip(".")
    image_exts = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "svg", "ico"}
    video_exts = {"mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v", "3gp"}
    audio_exts = {"mp3", "wav", "ogg", "m4a", "aac", "flac", "wma", "opus"}
    code_exts  = {"py", "js", "ts", "jsx", "tsx", "html", "css", "java", "c",
                  "cpp", "cs", "go", "rs", "rb", "php", "swift", "kt", "sh",
                  "bash", "ps1", "lua", "r", "m", "sql", "yaml", "toml"}
    archive_exts = {"zip", "rar", "tar", "gz", "7z", "bz2", "xz"}

    if ext in image_exts:  return "image"
    if ext in video_exts:  return "video"
    if ext in audio_exts:  return "audio"
    if ext in code_exts:   return "code"
    if ext in archive_exts: return "archive"
    if ext == "pdf":       return "pdf"
    if ext in ("docx", "doc"): return "docx"
    if ext in ("txt", "md", "rst", "log"): return "text"
    if ext in ("csv", "tsv"): return "csv"
    if ext in ("xlsx", "xls", "ods"): return "excel"
    if ext == "json":      return "json"
    if ext == "xml":       return "xml"
    if ext in ("pptx", "ppt"): return "pptx"
    return "unknown"

def _file_size_str(path: Path) -> str:
    try:
        size = path.stat().st_size
        if size < 1024:        return f"{size} B"
        if size < 1024**2:     return f"{size/1024:.1f} KB"
        if size < 1024**3:     return f"{size/1024**2:.1f} MB"
        return f"{size/1024**3:.1f} GB"
    except Exception:
        return "Unknown size"

def _output_path(src: Path, suffix: str, new_ext: str = None) -> Path:
    ext  = new_ext or src.suffix
    name = f"{src.stem}_{suffix}{ext}"
    return src.parent / name

async def _ask_llm(prompt: str, context_chatbot: Any = None) -> str:
    """Helper to route prompts back to Nova AI's primary LLM (Groq)."""
    if context_chatbot and hasattr(context_chatbot, 'get_response'):
        # We need a special internal method to avoid recursive loops
        # Or just use the groq client directly if exposed
        if hasattr(context_chatbot, 'groq_client'):
            try:
                # Use a specific model that handles text well
                model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
                response = context_chatbot.groq_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=2000
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                return f"LLM error: {e}"
    
    return f"LLM processing is not configured. Prompt would have been: {prompt[:100]}..."

async def _process_image(path: Path, action: str, params: dict, chatbot: Any = None) -> str:
    if not _HAS_PILLOW:
        return "Pillow is not installed. Run: pip install Pillow"

    action = action or "describe"

    if action in ("describe", "ocr", "analyze", "read", "extract_text"):
        # For now, without a vision model in Groq, we'll use a placeholder or 
        # suggest using the vision system if available.
        if hasattr(chatbot, 'vision_system') and chatbot.vision_system:
            try:
                result = await chatbot.vision_system.analyze_image(str(path), prompt=params.get("instruction"))
                return result.description if hasattr(result, 'description') else str(result)
            except Exception as e:
                return f"Vision system failed: {e}"
        
        return "Vision analysis requires a vision-capable model (like Llama 3.2 Vision on Groq or Gemini)."

    if action == "resize":
        width  = int(params.get("width",  0))
        height = int(params.get("height", 0))
        scale  = float(params.get("scale", 0))
        try:
            img = Image.open(path)
            w, h = img.size
            if scale:
                new_size = (int(w * scale), int(h * scale))
            elif width and height:
                new_size = (width, height)
            elif width:
                new_size = (width, int(h * width / w))
            elif height:
                new_size = (int(w * height / h), height)
            else:
                return "Please specify width, height, or scale."
            out = _output_path(path, f"resized_{new_size[0]}x{new_size[1]}")
            img.resize(new_size, Image.LANCZOS).save(out)
            return f"Resized from {w}x{h} to {new_size[0]}x{new_size[1]}. Saved: {out.name}"
        except Exception as e:
            return f"Resize failed: {e}"

    if action == "convert":
        fmt = params.get("format", "png").lower().strip(".")
        fmt_map = {"jpg": "JPEG", "jpeg": "JPEG", "png": "PNG",
                   "webp": "WEBP", "bmp": "BMP", "tiff": "TIFF"}
        pil_fmt = fmt_map.get(fmt, fmt.upper())
        try:
            img = Image.open(path).convert("RGB") if fmt == "jpg" else Image.open(path)
            out = _output_path(path, "converted", f".{fmt}")
            img.save(out, pil_fmt)
            return f"Converted to {fmt.upper()}. Saved: {out.name}"
        except Exception as e:
            return f"Convert failed: {e}"

    return f"Unsupported image action: {action}"

async def _process_pdf(path: Path, action: str, params: dict, chatbot: Any = None) -> str:
    action = action or "summarize"

    def _extract_pdf_text(max_chars=50000) -> str:
        text = ""
        if _HAS_PDFPLUMBER:
            try:
                with pdfplumber.open(path) as pdf:
                    for page in pdf.pages:
                        text += (page.extract_text() or "") + "\n"
                return text[:max_chars]
            except Exception:
                pass
        return ""

    if action in ("summarize", "extract_text", "analyze", "reformat"):
        text = _extract_pdf_text()
        if not text.strip():
            return "Could not extract text from PDF (may be scanned/image-based)."

        if action == "extract_text":
            out = _output_path(path, "text", ".txt")
            out.write_text(text, encoding="utf-8")
            return f"Text extracted ({len(text)} chars). Saved: {out.name}"

        prompt_map = {
            "summarize":      f"Summarize this PDF document concisely:\n\n{text}",
            "analyze":        f"Analyze this document thoroughly:\n\n{text}",
            "reformat":       f"Reformat this text cleanly with proper structure:\n\n{text}",
        }
        
        result = await _ask_llm(prompt_map.get(action, f"Analyze:\n\n{text}"), chatbot)
        
        if len(result) > 600 and params.get("save", True):
            out = _output_path(path, action, ".txt")
            out.write_text(result, encoding="utf-8")
            return f"{result[:400]}...\n\nFull result saved: {out.name}"
        return result

    return f"Unknown PDF action: '{action}'"

async def _process_text_doc(path: Path, file_type: str, action: str,
                       params: dict, chatbot: Any = None) -> str:
    action = action or "summarize"

    def _read_content() -> str:
        if file_type == "docx" and _HAS_DOCX:
            try:
                doc  = Document(path)
                return "\n".join(p.text for p in doc.paragraphs)
            except Exception as e:
                return f"Read failed: {e}"
        else:
            return path.read_text(encoding="utf-8", errors="ignore")

    content = _read_content()
    if not content.strip():
        return "File appears to be empty."

    if action == "word_count":
        words = len(content.split())
        chars = len(content)
        lines = content.count("\n")
        return f"Word count: {words} words, {chars} characters, {lines} lines."

    instruction = params.get("instruction", "")
    prompt_map  = {
        "summarize":  f"Summarize this document concisely:\n\n{content[:40000]}",
        "analyze":    f"Analyze this document:\n\n{content[:40000]}",
        "reformat":   f"Reformat this text with clean structure, proper headings and paragraphs:\n\n{content[:40000]}",
        "fix":        f"Fix grammar, spelling and style issues in this text:\n\n{content[:40000]}",
        "to_bullet":  f"Convert this text into a clear bullet-point summary:\n\n{content[:40000]}",
        "custom":     f"{instruction}\n\n{content[:40000]}",
    }

    prompt = prompt_map.get(action, prompt_map["custom"])
    result = await _ask_llm(prompt, chatbot)
    
    if len(result) > 600 and params.get("save", True):
        out = _output_path(path, action, ".txt")
        out.write_text(result, encoding="utf-8")
        return f"{result[:400]}...\n\nFull result saved: {out.name}"
    return result

async def file_processor(parameters: dict, chatbot: Any = None) -> str:
    """Main entry point for file processing."""
    file_path_str = parameters.get("file_path", "").strip()
    if not file_path_str:
        return "No file path provided."

    path = Path(file_path_str)
    if not path.exists():
        return f"File not found: {file_path_str}"
    if not path.is_file():
        return f"Path is not a file: {file_path_str}"

    file_type   = _detect_type(path)
    action      = (parameters.get("action") or "").lower().strip()
    params      = parameters

    print(f"[FileProcessor] {file_type.upper()} | {path.name} | action={action or 'auto'}")

    dispatch = {
        "image":   _process_image,
        "pdf":     _process_pdf,
        "docx":    lambda p, a, pm, c: _process_text_doc(p, "docx", a, pm, c),
        "text":    lambda p, a, pm, c: _process_text_doc(p, "text", a, pm, c),
        "json":    lambda p, a, pm, c: _process_text_doc(p, "text", a, pm, c), # Handled as text for now
        "code":    lambda p, a, pm, c: _process_text_doc(p, "text", a, pm, c),
    }

    handler = dispatch.get(file_type)
    if not handler:
        # Generic text-based processing for unknown types
        try:
            return await _process_text_doc(path, "text", action, params, chatbot)
        except Exception as e:
            return f"Unsupported file type ({path.suffix}) or processing failed: {e}"

    try:
        return await handler(path, action, params, chatbot)
    except Exception as e:
        return f"Processing failed: {e}"
