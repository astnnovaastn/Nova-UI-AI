"""Optional same-origin TLS gateway. The existing backend remains loopback-only.
Run with a certificate trusted by the paired computer and its matching private key.
"""

import asyncio, contextlib, os
from pathlib import Path
import httpx, websockets
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from .workspace_sync import WorkspaceHub

COOKIE = "nova_paired_device"
# Explicit application data routes. Administration, keys, runtime and OS actions stay local.
ALLOWED = (
    "/api/research",
    "/api/memory",
    "/api/conversations",
    "/api/sync",
    "/api/themes",
    "/api/settings/preferences",
    "/api/preferences",
    "/api/search",
    "/api/news",
    "/api/notes",
    "/api/images",
    "/api/weather",
    "/api/transcribe",
    "/api/library",
    "/api/health",
    "/api/status",
)
PAIR_PAGE = """<!doctype html><meta name="viewport" content="width=device-width"><title>Pair with Aegis</title><style>body{font:16px system-ui;background:#242423;color:#eee;max-width:420px;margin:15vh auto;padding:24px}input,button{font:inherit;border-radius:8px;padding:12px;border:1px solid #777;background:#333;color:inherit;width:100%;box-sizing:border-box;margin:8px 0}p{line-height:1.6}</style><h1>Connect to your host</h1><p>On the host, open Settings → Connected windows and devices → Pair a computer. Enter its code here, then approve this device on the host.</p><form id="pair"><input name="code" aria-label="Pairing code" required autocomplete="off"><input name="label" aria-label="Device name" placeholder="Device name" required maxlength="80"><button>Request pairing</button></form><p id="state" role="status"></p><script>const state=document.getElementById('state');document.getElementById('pair').onsubmit=async e=>{e.preventDefault();const r=await fetch('/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});state.textContent=r.ok?'Waiting for approval on the host…':'Code expired or already used.';};setInterval(async()=>{const r=await fetch('/pair/status');if(r.ok&&(await r.json()).approved)location.href='/';},3000);</script>"""


def make_gateway(store: WorkspaceHub, dist: Path, backend="http://127.0.0.1:8340"):
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

    def credential(request, pending=False):
        return store.device(request.cookies.get(COOKIE, ""), pending=pending)

    def same_origin(request):
        origin = request.headers.get("origin")
        return not origin or origin == "https://" + request.headers.get("host", "")

    @app.middleware("http")
    async def secure(request, call_next):
        if request.url.scheme != "https":
            return JSONResponse({"detail": "Trusted HTTPS is required."}, 400)
        if not same_origin(request):
            return JSONResponse({"detail": "Same-origin requests only."}, 403)
        if request.url.path.startswith("/api/") and not credential(request):
            return JSONResponse({"detail": "Pairing and host approval required."}, 401)
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/pair")
    async def pair_page():
        return HTMLResponse(PAIR_PAGE)

    @app.post("/pair")
    async def pair(request: Request):
        body = await request.json()
        try:
            result = store.claim(
                str(body.get("code", "")), str(body.get("label", "Computer"))
            )
        except ValueError:
            return JSONResponse({"detail": "Invalid or expired pairing code"}, 403)
        response = JSONResponse({"state": result["state"]})
        response.set_cookie(
            COOKIE,
            result["credential"],
            secure=True,
            httponly=True,
            samesite="strict",
            max_age=365 * 86400,
        )
        return response

    @app.get("/pair/status")
    async def pair_status(request: Request):
        device = credential(request, True)
        return {"approved": bool(device and not device["revoked"])}

    @app.api_route(
        "/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
    )
    async def api(path: str, request: Request):
        device = credential(request)
        full = "/api/" + path
        if not any(
            full == prefix or full.startswith(prefix + "/") for prefix in ALLOWED
        ):
            return JSONResponse(
                {"detail": "This operation is available on the host only."}, 403
            )
        if int(request.headers.get("content-length", "0")) > 64 * 1024 * 1024:
            return Response(status_code=413)
        headers = {
            k: v
            for k, v in request.headers.items()
            if k.lower() in {"content-type", "x-nova-client", "accept", "range"}
        }
        headers["x-nova-paired-device"] = device["id"]
        async with httpx.AsyncClient(timeout=120) as client:
            result = await client.request(
                request.method,
                backend + full,
                params=request.query_params,
                content=await request.body(),
                headers=headers,
            )
        return Response(
            result.content,
            status_code=result.status_code,
            headers={
                k: v
                for k, v in result.headers.items()
                if k.lower()
                in {
                    "content-type",
                    "content-disposition",
                    "content-range",
                    "accept-ranges",
                    "x-content-type-options",
                }
            },
        )

    @app.websocket("/ws/{path:path}")
    async def websocket(path: str, socket: WebSocket):
        device = credential(socket)
        if (
            not device
            or not same_origin(socket)
            or socket.url.scheme != "wss"
            or not (path == "voice" or path.startswith("collaboration/"))
        ):
            await socket.close(code=1008)
            return
        target = (
            backend.replace("http://", "ws://")
            + "/ws/"
            + path
            + ("?" + socket.url.query if socket.url.query else "")
        )
        await socket.accept()
        try:
            async with websockets.connect(
                target,
                additional_headers={"x-nova-paired-device": device["id"]},
                max_size=2000000,
            ) as upstream:

                async def outgoing():
                    while store.device(socket.cookies.get(COOKIE, "")):
                        message = await socket.receive()
                        if message["type"] == "websocket.disconnect":
                            return
                        await upstream.send(
                            message.get("bytes")
                            if message.get("bytes") is not None
                            else message.get("text", "")
                        )

                async def incoming():
                    async for message in upstream:
                        if not store.device(socket.cookies.get(COOKIE, "")):
                            return
                        if isinstance(message, bytes):
                            await socket.send_bytes(message)
                        else:
                            await socket.send_text(message)

                async def revoked():
                    while store.device(socket.cookies.get(COOKIE, "")):
                        await asyncio.sleep(1)

                tasks = [
                    asyncio.create_task(f()) for f in (incoming, outgoing, revoked)
                ]
                await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                for task in tasks:
                    task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)
        except (WebSocketDisconnect, ConnectionError, OSError):
            pass
        finally:
            with contextlib.suppress(RuntimeError):
                await socket.close()

    if (dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=dist / "assets"))

    @app.get("/{path:path}")
    async def index(request: Request, path: str):
        if not credential(request):
            return HTMLResponse(PAIR_PAGE)
        asset = (dist / path).resolve()
        if asset.is_relative_to(dist.resolve()) and asset.is_file():
            from fastapi.responses import FileResponse

            return FileResponse(asset)
        return HTMLResponse((dist / "index.html").read_text(encoding="utf-8"))

    return app


if __name__ == "__main__":
    import argparse, uvicorn

    parser = argparse.ArgumentParser(
        description="Trusted HTTPS gateway for paired Aegis computers"
    )
    parser.add_argument("--cert", required=True)
    parser.add_argument("--key", required=True)
    parser.add_argument("--store", required=True)
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8443)
    args = parser.parse_args()
    uvicorn.run(
        make_gateway(
            WorkspaceHub(Path(args.store)),
            Path(__file__).parent.parent / "frontend" / "dist",
        ),
        host=args.host,
        port=args.port,
        ssl_certfile=args.cert,
        ssl_keyfile=args.key,
    )
