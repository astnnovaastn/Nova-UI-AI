from __future__ import annotations

import asyncio
import concurrent.futures
import os
import platform
import re
import shutil
import subprocess
import threading
import time
import webbrowser
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus, urlparse

try:
    import requests
except ImportError:
    requests = None

_HAS_PLAYWRIGHT = False
try:
    from playwright.async_api import (
        async_playwright,
        BrowserContext,
        Page,
        Playwright,
        TimeoutError as PlaywrightTimeout,
    )
    _HAS_PLAYWRIGHT = True
except ImportError:
    # Playwright is optional; fallback to simpler browser control when unavailable.
    async_playwright = None
    BrowserContext = None
    Page = None
    Playwright = None
    PlaywrightTimeout = Exception

_OS = platform.system()   # "Windows" | "Darwin" | "Linux"

def _normalize_url(url: str) -> str:
    """
    Bare words like "instagram" → "https://instagram.com"
    Domains like "instagram.com" → "https://instagram.com"
    Full URLs pass through unchanged.
    """
    url = url.strip()
    if not url:
        return "about:blank"
    if "://" in url:
        return url
    # No dot at all → assume .com  (e.g. "instagram" → "instagram.com")
    if "." not in url:
        url = url + ".com"
    return "https://" + url


def _extract_site_url(text: str) -> Optional[str]:
    text = text.lower()
    # Direct URL first
    match = re.search(r'(https?://\S+)', text)
    if match:
        return match.group(1).strip()

    match = re.search(r'\b(www\.[a-z0-9.-]+\.[a-z]{2,})(/\S*)?\b', text)
    if match:
        return _normalize_url(match.group(1))


def _friendly_site_name(url: str) -> str:
    if not url:
        return "the web page"
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    if "soundcloud" in domain:
        return "SoundCloud"
    if "youtube" in domain:
        return "YouTube"
    if "spotify" in domain:
        return "Spotify"
    if "google" in domain:
        return "Google"
    if "bing" in domain:
        return "Bing"
    if "duckduckgo" in domain:
        return "DuckDuckGo"
    if domain.startswith("www."):
        domain = domain[4:]
    return domain or url


def _extract_browser_name(text: str) -> Optional[str]:
    text = text.lower()
    for name in ("chrome", "edge", "firefox", "safari", "opera", "operagx", "brave", "vivaldi"):
        if re.search(rf'\b{name}\b', text):
            return name
    return None


def _user_agent() -> str:
    if _OS == "Windows":
        return (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    if _OS == "Darwin":
        return (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    return (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )


def _real_profile_dir(browser: str) -> str:
    home  = Path.home()
    local = os.environ.get("LOCALAPPDATA", "")
    roam  = os.environ.get("APPDATA", "")

    candidates: list[Path] = []

    if _OS == "Windows":
        m = {
            "chrome":   [Path(local) / "Google"          / "Chrome"          / "User Data"],
            "edge":     [Path(local) / "Microsoft"        / "Edge"            / "User Data"],
            "brave":    [Path(local) / "BraveSoftware"    / "Brave-Browser"   / "User Data"],
            "vivaldi":  [Path(local) / "Vivaldi"          / "User Data"],
            "opera":    [Path(roam)  / "Opera Software"   / "Opera Stable",
                         Path(local) / "Opera Software"   / "Opera Stable"],
            "operagx":  [Path(roam)  / "Opera Software"   / "Opera GX Stable",
                         Path(local) / "Opera Software"   / "Opera GX Stable"],
        }
        candidates = m.get(browser, [])

    elif _OS == "Darwin":
        lib = home / "Library" / "Application Support"
        m = {
            "chrome":   [lib / "Google"             / "Chrome"],
            "edge":     [lib / "Microsoft Edge"],
            "brave":    [lib / "BraveSoftware"       / "Brave-Browser"],
            "vivaldi":  [lib / "Vivaldi"],
            "opera":    [lib / "com.operasoftware.Opera"],
            "operagx":  [lib / "com.operasoftware.OperaGX"],
        }
        candidates = m.get(browser, [])

    elif _OS == "Linux":
        cfg = home / ".config"
        m = {
            "chrome":   [cfg / "google-chrome", cfg / "chromium"],
            "edge":     [cfg / "microsoft-edge"],
            "brave":    [cfg / "BraveSoftware" / "Brave-Browser"],
            "vivaldi":  [cfg / "vivaldi"],
            "opera":    [cfg / "opera"],
            "operagx":  [cfg / "opera-gx"],
        }
        candidates = m.get(browser, [])

    for p in candidates:
        if p.exists():
            print(f"[Browser]  Real profile found for {browser}: {p}")
            return str(p)

    fallback = home / ".jarvis_profiles" / browser
    fallback.mkdir(parents=True, exist_ok=True)
    print(f"[Browser]   Real profile not found for {browser}, using: {fallback}")
    return str(fallback)

def _firefox_profile_dir() -> Optional[str]:
    home = Path.home()

    if _OS == "Windows":
        base = Path(os.environ.get("APPDATA", "")) / "Mozilla" / "Firefox"
    elif _OS == "Darwin":
        base = home / "Library" / "Application Support" / "Firefox"
    else:
        base = home / ".mozilla" / "firefox"

    ini = base / "profiles.ini"
    if not ini.exists():
        return None

    current: dict[str, str] = {}
    default_path: Optional[str] = None

    for line in ini.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if line.startswith("["):
            p = current.get("Path", "")
            if p and current.get("Default") == "1":
                is_rel = current.get("IsRelative", "1") == "1"
                default_path = str(base / p) if is_rel else p
            current = {}
        elif "=" in line:
            k, _, v = line.partition("=")
            current[k.strip()] = v.strip()

    p = current.get("Path", "")
    if p and current.get("Default") == "1":
        is_rel = current.get("IsRelative", "1") == "1"
        default_path = str(base / p) if is_rel else p

    if default_path and Path(default_path).exists():
        print(f"[Browser] Firefox real profile: {default_path}")
        return default_path
    return None

def _find_opera_windows() -> Optional[str]:
    local  = os.environ.get("LOCALAPPDATA", "")
    prog   = os.environ.get("PROGRAMFILES", "")
    prog86 = os.environ.get("PROGRAMFILES(X86)", "")

    candidates = [
        Path(local)  / "Programs" / "Opera"    / "opera.exe",
        Path(local)  / "Programs" / "Opera GX" / "opera.exe",
        Path(prog)   / "Opera"    / "opera.exe",
        Path(prog86) / "Opera"    / "opera.exe",
    ]
    for p in candidates:
        if p.exists():
            print(f"[Browser] Opera found at: {p}")
            return str(p)

    try:
        import winreg
        keys = [
            r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\opera.exe",
            r"SOFTWARE\Clients\StartMenuInternet\OperaStable\shell\open\command",
            r"SOFTWARE\Clients\StartMenuInternet\OperaGXStable\shell\open\command",
            r"SOFTWARE\Clients\StartMenuInternet\opera\shell\open\command",
        ]
        for key_path in keys:
            for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
                try:
                    k   = winreg.OpenKey(hive, key_path)
                    val = winreg.QueryValue(k, None)
                    winreg.CloseKey(k)
                    exe = val.strip().strip('"').split('"')[0].split(" --")[0].strip()
                    if exe and Path(exe).exists():
                        print(f"[Browser] Opera found via registry: {exe}")
                        return exe
                except Exception:
                    continue
    except Exception:
        pass

    return shutil.which("opera") or None

def _find_exe_windows(prog_name: str) -> Optional[str]:
    try:
        import winreg
        paths_to_try = [
            rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{prog_name}.exe",
            rf"SOFTWARE\Clients\StartMenuInternet\{prog_name}\shell\open\command",
        ]
        for key_path in paths_to_try:
            for hive in (winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER):
                try:
                    k   = winreg.OpenKey(hive, key_path)
                    val = winreg.QueryValue(k, None)
                    winreg.CloseKey(k)
                    exe = val.strip().strip('"').split('"')[0].split(" --")[0].strip()
                    if exe and Path(exe).exists():
                        return exe
                except Exception:
                    continue
    except Exception:
        pass
    return None

_BROWSER_SPECS: dict[str, dict] = {
    "Windows": {
        "chrome":   {"engine": "chromium", "channel": "chrome",  "bins": []},
        "edge":     {"engine": "chromium", "channel": "msedge",  "bins": []},
        "firefox":  {"engine": "firefox",  "channel": None,      "bins": ["firefox.exe"]},
        "opera":    {"engine": "chromium", "channel": None,      "bins": ["opera.exe"],  "special": "opera_windows"},
        "operagx":  {"engine": "chromium", "channel": None,      "bins": [],             "special": "opera_windows"},
        "brave":    {"engine": "chromium", "channel": None,      "bins": ["brave.exe"]},
        "vivaldi":  {"engine": "chromium", "channel": None,      "bins": ["vivaldi.exe"]},
        "safari":   None,
    },
    "Darwin": {
        "chrome":   {"engine": "chromium", "channel": "chrome",  "bins": []},
        "edge":     {"engine": "chromium", "channel": "msedge",  "bins": ["microsoft-edge"]},
        "firefox":  {"engine": "firefox",  "channel": None,      "bins": ["firefox"]},
        "opera":    {"engine": "chromium", "channel": None,      "bins": ["opera"]},
        "operagx":  {"engine": "chromium", "channel": None,      "bins": ["opera"]},
        "brave":    {"engine": "chromium", "channel": None,      "bins": ["brave browser", "brave"]},
        "vivaldi":  {"engine": "chromium", "channel": None,      "bins": ["vivaldi"]},
        "safari":   {"engine": "webkit",   "channel": None,      "bins": []},
    },
    "Linux": {
        "chrome":   {"engine": "chromium", "channel": None,
                     "bins": ["google-chrome", "google-chrome-stable", "chromium-browser", "chromium"]},
        "edge":     {"engine": "chromium", "channel": None,
                     "bins": ["microsoft-edge", "microsoft-edge-stable"]},
        "firefox":  {"engine": "firefox",  "channel": None, "bins": ["firefox"]},
        "opera":    {"engine": "chromium", "channel": None, "bins": ["opera", "opera-stable"]},
        "operagx":  {"engine": "chromium", "channel": None, "bins": ["opera", "opera-stable"]},
        "brave":    {"engine": "chromium", "channel": None, "bins": ["brave-browser", "brave"]},
        "vivaldi":  {"engine": "chromium", "channel": None, "bins": ["vivaldi-stable", "vivaldi"]},
        "safari":   None,
    },
}

_ALIASES: dict[str, str] = {
    "google chrome":   "chrome",
    "google-chrome":   "chrome",
    "microsoft edge":  "edge",
    "ms edge":         "edge",
    "msedge":          "edge",
    "mozilla firefox": "firefox",
    "opera gx":        "operagx",
    "opera_gx":        "operagx",
}


def _resolve_browser(name: str) -> dict | None:
    name   = _ALIASES.get(name.lower().strip(), name.lower().strip())
    os_map = _BROWSER_SPECS.get(_OS, {})
    spec   = os_map.get(name)
    if spec is None:
        return None

    engine  = spec["engine"]
    channel = spec.get("channel")
    bins    = spec.get("bins", [])
    exe     = None

    if spec.get("special") == "opera_windows":
        exe = _find_opera_windows()
        if not exe:
            print(f"[Browser] ⚠️  Opera executable not found on Windows.")
        return {"engine": engine, "exe": exe, "channel": channel}

    for b in bins:
        found = shutil.which(b)
        if found:
            exe = found
            break

    if not exe and _OS == "Darwin":
        app_names = {
            "chrome":  ["Google Chrome.app"],
            "edge":    ["Microsoft Edge.app"],
            "firefox": ["Firefox.app"],
            "opera":   ["Opera.app", "Opera GX.app"],
            "brave":   ["Brave Browser.app"],
            "vivaldi": ["Vivaldi.app"],
        }
        for app in app_names.get(name, []):
            app_dir = Path("/Applications") / app / "Contents" / "Windows"
            if app_dir.exists():
                found_bins = list(app_dir.iterdir())
                if found_bins:
                    exe = str(found_bins[0])
                    break

    if not exe and _OS == "Windows" and not channel:
        exe = _find_exe_windows(name)

    return {"engine": engine, "exe": exe, "channel": channel}


def _detect_default_browser() -> str:
    # Explicitly prioritizing Chrome as requested by the user
    try:
        # Check if Chrome is in PATH or in common Windows installation directories
        chrome_bins = ["chrome", "google-chrome", "chrome.exe"]
        for b in chrome_bins:
            if shutil.which(b):
                return "chrome"
                
        if _OS == "Windows":
            local = os.environ.get("LOCALAPPDATA", "")
            prog  = os.environ.get("PROGRAMFILES", "")
            prog86 = os.environ.get("PROGRAMFILES(X86)", "")
            
            common_paths = [
                Path(prog) / "Google" / "Chrome" / "Application" / "chrome.exe",
                Path(prog86) / "Google" / "Chrome" / "Application" / "chrome.exe",
                Path(local) / "Google" / "Chrome" / "Application" / "chrome.exe",
            ]
            
            for p in common_paths:
                if p.exists():
                    return "chrome"

            # Fallback to registry check for system default if Chrome not explicitly found
            import winreg
            try:
                k = winreg.OpenKey(
                    winreg.HKEY_CURRENT_USER,
                    r"Software\Microsoft\Windows\Shell\Associations"
                    r"\UrlAssociations\http\UserChoice",
                )
                prog_id = winreg.QueryValueEx(k, "ProgId")[0].lower()
                winreg.CloseKey(k)
                for kw in ("chrome", "edge", "firefox", "opera", "brave", "vivaldi"):
                    if kw in prog_id:
                        return kw
            except Exception:
                pass
        elif _OS == "Darwin":
            out = subprocess.run(
                ["defaults", "read",
                 "com.apple.LaunchServices/com.apple.launchservices.secure",
                 "LSHandlers"],
                capture_output=True, text=True, timeout=5,
            ).stdout.lower()
            for kw in ("chrome", "safari", "firefox", "opera", "brave", "vivaldi", "edge"):
                if kw in out:
                    return kw
        elif _OS == "Linux":
            out = subprocess.run(
                ["xdg-settings", "get", "default-web-browser"],
                capture_output=True, text=True, timeout=5,
            ).stdout.lower()
            for kw in ("chrome", "firefox", "opera", "brave", "vivaldi", "edge"):
                if kw in out:
                    return kw
    except Exception:
        pass
    return "chrome"


class _BrowserSession:
    """
    Bir tarayıcı örneği için tam oturum.
    Tüm tarayıcılar launch_persistent_context ile gerçek profil üzerinde açılır.
    """

    def __init__(self, browser_name: str):
        self.browser_name = browser_name
        self._spec        = _resolve_browser(browser_name)

        self._loop:    asyncio.AbstractEventLoop | None = None
        self._thread:  threading.Thread | None          = None
        self._ready    = threading.Event()
        self._async_init_error: Exception | None = None

        self._pw:      Playwright     | None = None
        self._context: BrowserContext | None = None
        self._page:    Page           | None = None

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(
            target=self._run_loop,
            daemon=True,
            name=f"BrowserThread-{self.browser_name}",
        )
        self._thread.start()
        started = self._ready.wait(timeout=20)
        if not started:
            raise RuntimeError(f"Browser session startup timed out for '{self.browser_name}'.")
        if self._async_init_error is not None:
            raise RuntimeError(
                f"Playwright startup failed for '{self.browser_name}': {self._async_init_error}"
            )

    def _run_loop(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._async_init())
        except Exception as e:
            self._async_init_error = e
            print(f"[Browser] Playwright startup failed: {e}")
        finally:
            self._ready.set()
        self._loop.run_forever()

    async def _async_init(self):
        self._pw = await async_playwright().start()

    def run(self, coro, timeout: int = 60) -> str:
        if not self._loop:
            raise RuntimeError(f"Session for '{self.browser_name}' not started.")
        if self._async_init_error is not None:
            raise RuntimeError(
                f"Playwright startup failed for '{self.browser_name}': {self._async_init_error}"
            )
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return future.result(timeout=timeout)

    def close(self):
        if self._loop:
            asyncio.run_coroutine_threadsafe(self._async_close(), self._loop).result(10)

    async def _async_close(self):
        if self._context:
            try:
                await self._context.close()
            except Exception:
                pass
        if self._pw:
            try:
                await self._pw.stop()
            except Exception:
                pass
        self._context = self._page = None

    async def _launch(self):
        """
        Tarayıcıyı gerçek kullanıcı profiliyle başlatır.
        Context zaten açıksa hiçbir şey yapmaz.
        """
        if self._context is not None:
            try:
                # Check if context is still valid
                if self._context.pages:
                    return
            except Exception:
                self._context = self._page = None

        if self._spec is None:
            raise RuntimeError(
                f"'{self.browser_name}' bu platformda ({_OS}) desteklenmiyor."
            )

        engine_name = self._spec["engine"]
        exe         = self._spec["exe"]
        channel     = self._spec["channel"]
        if self._pw is None:
            raise RuntimeError("Playwright did not initialize properly for browser session.")
        engine_obj  = getattr(self._pw, engine_name)

        common_kwargs = {
            "headless":    False,
            "slow_mo":     0,
            "viewport":    None,
            "no_viewport": True,
        }

        if engine_name == "firefox":
            profile = _firefox_profile_dir() or str(
                Path.home() / ".jarvis_profiles" / "firefox"
            )
            kwargs = {**common_kwargs}
            if exe:
                kwargs["executable_path"] = exe
            try:
                self._context = await engine_obj.launch_persistent_context(profile, **kwargs)
            except Exception as e:
                print(f"[Browser] Firefox real profile failed ({e}), using JARVIS profile")
                jarvis = str(Path.home() / ".jarvis_profiles" / "firefox_jarvis")
                Path(jarvis).mkdir(parents=True, exist_ok=True)
                self._context = await engine_obj.launch_persistent_context(jarvis, **kwargs)

            await asyncio.sleep(0.5)  
            self._page = await self._context.new_page()
            print(f"[Browser] ✅ Firefox launched")
            return

        if engine_name == "webkit":
            safari_profile = str(Path.home() / ".jarvis_profiles" / "safari")
            Path(safari_profile).mkdir(parents=True, exist_ok=True)
            kwargs = {**common_kwargs}
            self._context = await engine_obj.launch_persistent_context(safari_profile, **kwargs)
            await asyncio.sleep(0.5)
            self._page = await self._context.new_page()
            print(f"[Browser] ✅ Safari launched")
            return

        profile = _real_profile_dir(self.browser_name)

        kwargs = {
            **common_kwargs,
            "args": [
                "--start-maximized",
                "--disable-blink-features=AutomationControlled",
                "--no-first-run",
                "--disable-default-apps",
                "--no-default-browser-check",
            ],
        }

        if exe:
            kwargs["executable_path"] = exe
        elif channel:
            kwargs["channel"] = channel

        label = (
            f"{self.browser_name}"
            + (f"/{channel}" if channel else "")
            + (f" @ {exe}" if exe else "")
        )

        try:
            # Try to launch with real profile. If it fails (likely locked), fallback to JARVIS profile.
            self._context = await engine_obj.launch_persistent_context(profile, **kwargs)
            await asyncio.sleep(0.5) 
            self._page = await self._context.new_page()
            print(f"[Browser] ✅ Launched [{label}] profile={profile}")
            return
        except Exception as e:
            print(f"[Browser] ⚠️  Real profile failed for {label}: {e}")

        # Ensure we kill any existing process that might be hanging if we can't get context
        jarvis_profile = str(Path.home() / ".jarvis_profiles" / self.browser_name)
        # Use a unique subfolder if main JARVIS profile is also locked
        timestamp = int(time.time()) % 1000
        unique_jarvis = str(Path.home() / ".jarvis_profiles" / f"{self.browser_name}_{timestamp}")
        Path(unique_jarvis).mkdir(parents=True, exist_ok=True)
        print(f"[Browser] Retrying with UNIQUE JARVIS profile: {unique_jarvis}")

        try:
            self._context = await engine_obj.launch_persistent_context(unique_jarvis, **kwargs)
            await asyncio.sleep(0.5)
            self._page = await self._context.new_page()
            print(f"[Browser] ✅ Launched [{label}] with UNIQUE profile")
        except Exception as e2:
            # Last ditch effort: try without persistent context (fresh session)
            print(f"[Browser] ❌ Persistent context failed, attempting fresh session: {e2}")
            try:
                browser = await engine_obj.launch(**{k: v for k, v in kwargs.items() if k != "args"})
                self._context = await browser.new_context()
                self._page = await self._context.new_page()
                print(f"[Browser] ✅ Launched [{label}] fresh session")
            except Exception as e3:
                raise RuntimeError(f"Could not launch {self.browser_name}: {e3}") from e3


    async def _get_page(self) -> Page:
        try:
            await self._launch()
        except Exception as e:
            print(f"[Browser] Launch error: {e}")
            raise

        # If somehow page got closed, open a fresh one
        try:
            if self._page is None or self._page.is_closed():
                self._page = await self._context.new_page()
                await asyncio.sleep(0.2)
        except Exception:
            # Context might be dead, restart
            self._context = self._page = None
            await self._launch()
            self._page = await self._context.new_page()
            
        return self._page

    async def go_to(self, url: str) -> str:

        url      = _normalize_url(url)
        try:
            page     = await self._get_page()
        except Exception as e:
            return f"Browser error: {e}"
            
        prev_url = page.url

        async def _do_goto(p: Page) -> str:
            """Attempt navigation and return the resulting URL (may still be blank)."""
            try:
                await p.goto(url, wait_until="domcontentloaded", timeout=30_000)
                await asyncio.sleep(0.3)
            except PlaywrightTimeout:
                pass   # page may have partially loaded — check URL below
            except Exception as e:
                print(f"[Browser] goto exception (non-fatal): {e}")
            return p.url

        result_url = await _do_goto(page)

        if result_url in ("about:blank", "", None, prev_url) and prev_url in ("about:blank", "", None):
            print(f"[Browser] Still blank after goto — retrying on new tab: {url}")
            try:
                new_page   = await self._context.new_page()
                self._page = new_page
                result_url = await _do_goto(new_page)
            except Exception as e:
                print(f"[Browser] New-tab retry failed: {e}")

        if result_url and result_url not in ("about:blank", "", None):
            return f"Opened: {result_url}"
        return f"Could not open: {url}"

    async def search(self, query: str, engine: str = "google") -> str:
        _engines = {
            "google":     "https://www.google.com/search?q=",
            "bing":       "https://www.bing.com/search?q=",
            "duckduckgo": "https://duckduckgo.com/?q=",
            "yandex":     "https://yandex.com/search/?text=",
        }
        base = _engines.get(engine.lower(), _engines["google"])
        return await self.go_to(base + query.replace(" ", "+"))

    async def youtube_search_and_play(self, query: str) -> str:
        if not query:
            return "No YouTube query provided."
        search_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
        await self.go_to(search_url)
        try:
            page = await self._get_page()
        except Exception as e:
            return f"Browser error: {e}"
            
        # Wait for either results or a redirect
        try:
            await page.wait_for_selector('ytd-video-renderer, ytd-rich-item-renderer', timeout=10_000)
        except Exception:
            pass
            
        await asyncio.sleep(2.5)
        
        # Try to click the first video result
        selectors = (
            'ytd-video-renderer a#thumbnail',
            'ytd-rich-item-renderer a#thumbnail',
            'a#video-title',
            'ytd-video-renderer h3 a',
            'ytd-grid-video-renderer a#thumbnail',
            'a#thumbnail',
            '.style-scope ytd-video-renderer',
        )
        for selector in selectors:
            try:
                loc = page.locator(selector)
                count = await loc.count()
                for i in range(min(count, 3)): # Check first few results
                    link = loc.nth(i)
                    if await link.is_visible():
                        await link.click(timeout=5_000)
                        await asyncio.sleep(2.0)
                        # Handle potential "Consent" or "Skip Trial" popups if possible
                        return f"Playing the first YouTube result for: {query}"
            except Exception:
                continue
                
        return "Opened YouTube results, but could not start the video automatically. Please click a video."

    async def soundcloud_search_and_play(self, query: str) -> str:
        if not query:
            return "No SoundCloud query provided."
        search_url = f"https://soundcloud.com/search/sounds?q={quote_plus(query)}"
        await self.go_to(search_url)
        try:
            page = await self._get_page()
        except Exception as e:
            return f"Browser error: {e}"
            
        await asyncio.sleep(4.0)
        
        # Try to click the play button on the first result
        # SoundCloud UI has several potential play button locations
        selectors = (
            'button.sc-button-play',
            'a.playButton',
            '.soundTitle__playButton button',
            '.search__item button.sc-button-play',
            'div[role="group"] button.sc-button-play',
        )
        
        for selector in selectors:
            try:
                loc = page.locator(selector)
                count = await loc.count()
                for i in range(min(count, 5)):
                    btn = loc.nth(i)
                    if await btn.is_visible():
                        # Sometimes we need to hover first to trigger event listeners
                        await btn.hover()
                        await asyncio.sleep(0.5)
                        await btn.click(timeout=5000)
                        return f"Playing the first SoundCloud result for: {query}"
            except Exception:
                continue
                
        # If play button fails, try clicking the title of the first track
        try:
            title_loc = page.locator('a.soundTitle__titleAnchor').first
            if await title_loc.count() > 0:
                await title_loc.click()
                await asyncio.sleep(2.0)
                # Try play button again on the track page
                await page.locator('button.sc-button-play').first.click(timeout=5000)
                return f"Playing SoundCloud track: {query}"
        except Exception:
            pass
            
        return "Opened SoundCloud results, but could not start playback automatically. Please click play."

    async def spotify_search_and_play(self, query: str) -> str:
        if not query:
            return "No Spotify query provided."
        search_url = f"https://open.spotify.com/search/{quote_plus(query)}"
        await self.go_to(search_url)
        try:
            page = await self._get_page()
        except Exception as e:
            return f"Browser error: {e}"
            
        await asyncio.sleep(4.0)
        # Try to click play button or first result
        selectors = (
            'button[data-testid="play-button"]',
            'div[data-testid="tracklist-row"]',
            'a[href*="/track/"]',
            'a[href*="/album/"]',
        )
        for selector in selectors:
            try:
                el = page.locator(selector).first
                if await el.count() > 0:
                    await el.click(timeout=10_000)
                    return f"Playing Spotify results for: {query}"
            except Exception:
                continue
        return "Opened Spotify search, please click play."

    async def apple_music_search_and_play(self, query: str) -> str:
        search_url = f"https://music.apple.com/search?term={quote_plus(query)}"
        await self.go_to(search_url)
        try:
            page = await self._get_page()
        except Exception as e:
            return f"Browser error: {e}"
            
        await asyncio.sleep(4.0)
        # Apple music is tricky, try generic play buttons
        selectors = (
            'button[aria-label*="Play"]',
            '.play-button',
            'div[role="row"]',
        )
        for selector in selectors:
            try:
                el = page.locator(selector).first
                if await el.count() > 0:
                    await el.click(timeout=10_000)
                    return f"Playing Apple Music results for: {query}"
            except Exception:
                continue
        return "Opened Apple Music search."

    async def pinterest_search(self, query: str) -> str:
        search_url = f"https://www.pinterest.com/search/pins/?q={quote_plus(query)}"
        return await self.go_to(search_url)

    async def generic_search_and_click(self, site_url: str, query: str) -> str:
        """Generic search and click first result logic for any site"""
        await self.go_to(site_url)
        try:
            page = await self._get_page()
        except Exception as e:
            return f"Browser error: {e}"
            
        await asyncio.sleep(2.0)
        
        # Try to find a search box and type
        await self.smart_type("search", query)
        await self.press("Enter")
        await asyncio.sleep(3.0)
        
        # Try to click the most likely first result
        await self.smart_click("first result")
        return f"Searched for '{query}' on {site_url} and attempted to open the first result."

    async def click(self, selector: str = None, text: str = None) -> str:
        page = await self._get_page()
        try:
            if text:
                await page.get_by_text(text, exact=False).first.click(timeout=8_000)
                return f"Clicked text: '{text}'"
            if selector:
                await page.click(selector, timeout=8_000)
                return f"Clicked selector: {selector}"
            return "No selector or text provided."
        except PlaywrightTimeout:
            return "Element not found (timeout)."
        except Exception as e:
            return f"Click error: {e}"

    async def type_text(self, selector: str = None, text: str = "",
                        clear_first: bool = True) -> str:
        page = await self._get_page()
        try:
            el = page.locator(selector).first if selector else page.locator(":focus")
            if clear_first:
                await el.clear()
            await el.type(text, delay=50)
            return "Text typed."
        except Exception as e:
            return f"Type error: {e}"

    async def scroll(self, direction: str = "down", amount: int = 500) -> str:
        page = await self._get_page()
        try:
            y = amount if direction == "down" else -amount
            await page.mouse.wheel(0, y)
            return f"Scrolled {direction}."
        except Exception as e:
            return f"Scroll error: {e}"

    async def press(self, key: str) -> str:
        page = await self._get_page()
        try:
            await page.keyboard.press(key)
            return f"Pressed: {key}"
        except Exception as e:
            return f"Key error: {e}"

    async def get_text(self) -> str:
        page = await self._get_page()
        try:
            text = await page.inner_text("body")
            return text[:4_000]
        except Exception as e:
            return f"Could not get page text: {e}"

    async def get_url(self) -> str:
        page = await self._get_page()
        return page.url

    async def fill_form(self, fields: dict) -> str:
        page    = await self._get_page()
        results = []
        for selector, value in fields.items():
            try:
                el = page.locator(selector).first
                await el.clear()
                await el.type(str(value), delay=40)
                results.append(f"✓ {selector}")
            except Exception as e:
                results.append(f"✗ {selector}: {e}")
        return "Form filled: " + ", ".join(results)

    async def smart_click(self, description: str) -> str:
        page = await self._get_page()
        for role in ("button", "link", "searchbox", "textbox", "menuitem", "tab"):
            try:
                loc = page.get_by_role(role, name=description)
                if await loc.count() > 0:
                    await loc.first.click(timeout=5_000)
                    return f"Clicked ({role}): '{description}'"
            except Exception:
                pass
        for attempt in (
            lambda: page.get_by_text(description, exact=False).first.click(timeout=5_000),
            lambda: page.get_by_placeholder(description, exact=False).first.click(timeout=5_000),
            lambda: page.locator(
                f'[alt*="{description}" i],[title*="{description}" i],'
                f'[aria-label*="{description}" i]'
            ).first.click(timeout=5_000),
        ):
            try:
                await attempt()
                return f"Clicked: '{description}'"
            except Exception:
                pass
        return f"Could not find element: '{description}'"

    async def smart_type(self, description: str, text: str) -> str:
        page = await self._get_page()
        candidates = [
            ("placeholder", page.get_by_placeholder(description, exact=False)),
            ("label",       page.get_by_label(description, exact=False)),
            ("role",        page.get_by_role("textbox", name=description)),
            ("searchbox",   page.get_by_role("searchbox")),
            ("combobox",    page.get_by_role("combobox", name=description)),
        ]
        for method, loc in candidates:
            try:
                el = loc.first
                if await el.count() == 0:
                    continue
                await el.clear()
                await el.type(text, delay=50)
                return f"Typed into ({method}): '{description}'"
            except Exception:
                continue
        return f"Could not find input: '{description}'"

    async def new_tab(self, url: str = "") -> str:
        page = await self._get_page()
        ctx  = page.context
        new  = await ctx.new_page()
        self._page = new
        if url:
            return await self.go_to(url)
        return "New tab opened."

    async def close_tab(self) -> str:
        page = self._page
        if page and not page.is_closed():
            ctx   = page.context
            await page.close()
            pages = ctx.pages
            self._page = pages[-1] if pages else None
            return "Tab closed."
        return "No active tab to close."

    async def screenshot(self, path: str = None) -> str:
        page = await self._get_page()
        try:
            save_path = path or str(Path.home() / "Desktop" / "jarvis_screenshot.png")
            await page.screenshot(path=save_path, full_page=False)
            return f"Screenshot saved: {save_path}"
        except Exception as e:
            return f"Screenshot error: {e}"

    async def back(self) -> str:
        page = await self._get_page()
        try:
            await page.go_back(timeout=10_000)
            return f"Navigated back: {page.url}"
        except Exception as e:
            return f"Back error: {e}"

    async def forward(self) -> str:
        page = await self._get_page()
        try:
            await page.go_forward(timeout=10_000)
            return f"Navigated forward: {page.url}"
        except Exception as e:
            return f"Forward error: {e}"

    async def reload(self) -> str:
        page = await self._get_page()
        try:
            await page.reload(timeout=15_000)
            return f"Page reloaded: {page.url}"
        except Exception as e:
            return f"Reload error: {e}"

    async def close_browser(self) -> str:
        await self._async_close()
        return f"{self.browser_name} closed."

class _SessionRegistry:
    """Manages all active browser sessions with intelligent reuse."""

    def __init__(self):
        self._sessions:       dict[str, _BrowserSession] = {}
        self._active_browser: str                        = ""
        self._lock            = threading.Lock()

    def _get_or_create(self, browser_name: str) -> _BrowserSession:
        with self._lock:
            if browser_name not in self._sessions:
                sess = _BrowserSession(browser_name)
                try:
                    sess.start()
                    self._sessions[browser_name] = sess
                    print(f"[Registry] ✅ Created new session: {browser_name}")
                except Exception as e:
                    print(f"[Registry] ❌ Failed to create session for {browser_name}: {e}")
                    raise
            else:
                # Session exists, verify it's still alive
                sess = self._sessions[browser_name]
                try:
                    # Quick health check - attempt to get a page
                    if sess._page and not sess._page.is_closed():
                        print(f"[Registry] ✅ Reusing existing session: {browser_name}")
                        return sess
                except Exception:
                    pass
                # Session dead, recreate it
                print(f"[Registry] ⚠️  Session {browser_name} was dead, recreating...")
                try:
                    sess.close()
                except Exception:
                    pass
                sess = _BrowserSession(browser_name)
                sess.start()
                self._sessions[browser_name] = sess
                print(f"[Registry] ✅ Recreated session: {browser_name}")
            return self._sessions[browser_name]

    def get(self, browser_name: str | None = None) -> _BrowserSession:
        if not browser_name:
            browser_name = self._active_browser or _detect_default_browser()
        browser_name = _ALIASES.get(browser_name.lower().strip(), browser_name.lower().strip())
        
        # INTELLIGENT REUSE: Check if this browser is already open
        with self._lock:
            if browser_name in self._sessions:
                sess = self._sessions[browser_name]
                try:
                    # Verify session is alive
                    if sess._page and not sess._page.is_closed():
                        self._active_browser = browser_name
                        print(f"[Registry] ✅ Browser '{browser_name}' already open - reusing session")
                        return sess
                except Exception:
                    pass
        
        # Browser not alive or doesn't exist - create/recreate
        sess = self._get_or_create(browser_name)
        self._active_browser = browser_name
        return sess

    def switch(self, browser_name: str) -> str:
        browser_name = _ALIASES.get(browser_name.lower().strip(), browser_name.lower().strip())
        self._get_or_create(browser_name)
        self._active_browser = browser_name
        return f"Active browser → {browser_name}"

    def close_one(self, browser_name: str) -> str:
        with self._lock:
            sess = self._sessions.pop(browser_name, None)
        if sess:
            try:
                sess.close()
                if self._active_browser == browser_name:
                    self._active_browser = ""
                print(f"[Registry] ✅ Closed {browser_name}")
                return f"{browser_name} closed."
            except Exception as e:
                print(f"[Registry] ⚠️  Error closing {browser_name}: {e}")
                return f"Error closing {browser_name}: {e}"
        return f"No active session for: {browser_name}"

    def close_all(self) -> str:
        with self._lock:
            names    = list(self._sessions.keys())
            sessions = list(self._sessions.values())
            self._sessions.clear()
            self._active_browser = ""
        closed = []
        for name, s in zip(names, sessions):
            try:
                s.close()
                closed.append(name)
                print(f"[Registry] ✅ Closed {name}")
            except Exception as e:
                print(f"[Registry] ⚠️  Error closing {name}: {e}")
        result = f"Closed: {', '.join(closed)}" if closed else "No browsers to close"
        print(f"[Registry] {result}")
        return result

    def list_sessions(self) -> str:
        with self._lock:
            if not self._sessions:
                return "No active browser sessions."
            lines = []
            for name in self._sessions:
                marker = " ◀ active" if name == self._active_browser else ""
                lines.append(f"  • {name}{marker}")
            return "Open browsers:\n" + "\n".join(lines)


_registry = _SessionRegistry()

def browser_control(
    parameters:    dict = None,
    response=None,
    player=None,
    session_memory=None,
) -> str:
    params  = parameters or {}
    action  = params.get("action", "").lower().strip()
    browser = params.get("browser", "").lower().strip() or None
    description = params.get("description", "").strip()
    result  = "Unknown action."

    if action == "switch":
        target = browser or params.get("target", "").lower().strip()
        result = _registry.switch(target) if target else "Please specify a browser."
        _log(player, result)
        return result

    if action == "list_browsers":
        result = _registry.list_sessions()
        _log(player, result)
        return result

    if action == "close_all":
        result = _registry.close_all()
        _log(player, result)
        return result

    if not _HAS_PLAYWRIGHT:
        if action in ("go_to", "new_tab"):
            url = params.get("url", "") or _extract_site_url(description) or "about:blank"
            result = _open_url_with_default_browser(url, browser)
            result = _humanize_browser_response(action, result, params)
            _log(player, result)
            return result
        if action == "search":
            query = params.get("query", "").strip()
            engine = params.get("engine", "google").strip().lower() or "google"
            if not query:
                result = "No search query provided."
            else:
                url = f"https://{engine}.com/search?q={quote_plus(query)}"
                result = _open_url_with_default_browser(url, browser)
            result = _humanize_browser_response(action, result, params)
            _log(player, result)
            return result
        if action == "youtube_search_and_play":
            query = params.get("query", "").strip() or description
            if not query:
                result = "No YouTube query provided."
            else:
                video_url = _find_first_youtube_video_url(query)
                if video_url:
                    result = _open_url_with_default_browser(video_url, browser)
                else:
                    fallback_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
                    result = _open_url_with_default_browser(fallback_url, browser)
            result = _humanize_browser_response(action, result, params)
            _log(player, result)
            return result
        if action == "soundcloud_search_and_play":
            query = params.get("query", "").strip() or description
            if not query:
                result = "No SoundCloud query provided."
            else:
                track_url = _find_first_soundcloud_track_url(query)
                if track_url:
                    result = _open_url_with_default_browser(track_url, browser)
                else:
                    fallback_url = f"https://soundcloud.com/search/sounds?q={quote_plus(query)}"
                    result = _open_url_with_default_browser(fallback_url, browser)
            result = _humanize_browser_response(action, result, params)
            _log(player, result)
            return result
        result = "Browser automation requires the Playwright package. Install it with: pip install playwright"
        _log(player, result)
        return result

    try:
        sess = _registry.get(browser)
    except Exception as e:
        result = f"Could not start browser session: {e}"
        _log(player, result)
        return result

    try:
        if action == "go_to":
            result = sess.run(sess.go_to(params.get("url", "")))
        elif action == "youtube_search_and_play":
            query = params.get("query", "").strip() or description
            if not query:
                result = "No YouTube query provided."
            else:
                result = sess.run(sess.youtube_search_and_play(query))
        elif action == "soundcloud_search_and_play":
            query = params.get("query", "").strip() or description
            if not query:
                result = "No SoundCloud query provided."
            else:
                result = sess.run(sess.soundcloud_search_and_play(query))
        elif action == "spotify_search_and_play":
            query = params.get("query", "").strip() or description
            result = sess.run(sess.spotify_search_and_play(query))
        elif action == "apple_music_search_and_play":
            query = params.get("query", "").strip() or description
            result = sess.run(sess.apple_music_search_and_play(query))
        elif action == "pinterest_search":
            query = params.get("query", "").strip() or description
            result = sess.run(sess.pinterest_search(query))
        elif action == "generic_search_and_click":
            url = params.get("url") or _extract_site_url(description)
            query = params.get("query")
            result = sess.run(sess.generic_search_and_click(url, query))
        elif action == "search":
            result = sess.run(sess.search(params.get("query", ""), params.get("engine", "google")))
        elif action == "click":
            result = sess.run(sess.click(params.get("selector"), params.get("text")))
        elif action == "type":
            result = sess.run(sess.type_text(
                params.get("selector"), params.get("text", ""), params.get("clear_first", True)))
        elif action == "scroll":
            result = sess.run(sess.scroll(params.get("direction", "down"), int(params.get("amount", 500))))
        elif action == "fill_form":
            result = sess.run(sess.fill_form(params.get("fields", {})))
        elif action == "smart_click":
            result = sess.run(sess.smart_click(params.get("description", "")))
        elif action == "smart_type":
            result = sess.run(sess.smart_type(params.get("description", ""), params.get("text", "")))
        elif action == "get_text":
            result = sess.run(sess.get_text())
        elif action == "get_url":
            result = sess.run(sess.get_url())
        elif action == "press":
            result = sess.run(sess.press(params.get("key", "Enter")))
        elif action == "new_tab":
            result = sess.run(sess.new_tab(params.get("url", "")))
        elif action == "close_tab":
            result = sess.run(sess.close_tab())
        elif action == "screenshot":
            result = sess.run(sess.screenshot(params.get("path")))
        elif action == "back":
            result = sess.run(sess.back())
        elif action == "forward":
            result = sess.run(sess.forward())
        elif action == "reload":
            result = sess.run(sess.reload())
        elif action == "close":
            target = browser or _registry._active_browser
            result = _registry.close_one(target) if target else "No browser specified."
        else:
            result = f"Unknown browser action: '{action}'"

    except concurrent.futures.TimeoutError:
        result = f"Browser action '{action}' timed out (60s)."
    except Exception as e:
        result = f"Browser error ({action}): {e}"
        if action in ("go_to", "new_tab"):
            url = params.get("url", "") or _extract_site_url(description) or "about:blank"
            fallback = _open_url_with_default_browser(url, browser)
            result = f"{result} Falling back to default browser: {fallback}"
        elif action == "search":
            query = params.get("query", "").strip()
            if query:
                url = f"https://google.com/search?q={quote_plus(query)}"
                fallback = _open_url_with_default_browser(url, browser)
                result = f"{result} Falling back to default browser: {fallback}"
        elif action == "youtube_search_and_play":
            query = params.get("query", "").strip() or description
            if query:
                fallback_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
                fallback = _open_url_with_default_browser(fallback_url, browser)
                result = f"{result} Falling back to default browser: {fallback}"
        elif action == "soundcloud_search_and_play":
            query = params.get("query", "").strip() or description
            if query:
                fallback_url = f"https://soundcloud.com/search/sounds?q={quote_plus(query)}"
                fallback = _open_url_with_default_browser(fallback_url, browser)
                result = f"{result} Falling back to default browser: {fallback}"

    result = _humanize_browser_response(action, result, params)
    _log(player, result)
    return result


def _find_first_youtube_video_url(query: str) -> Optional[str]:
    if not requests:
        return None
    if not query:
        return None
    search_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }
    try:
        response = requests.get(search_url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None
        html = response.text
        match = re.search(r'"videoId":"([^"]+)"', html)
        if match:
            return f"https://www.youtube.com/watch?v={match.group(1)}"
        match = re.search(r'href="(/watch\?v=[^"]+)"', html)
        if match:
            return f"https://www.youtube.com{match.group(1)}"
    except Exception:
        pass
    return None


def _find_first_soundcloud_track_url(query: str) -> Optional[str]:
    if not requests:
        return None
    if not query:
        return None
    search_url = f"https://soundcloud.com/search/sounds?q={quote_plus(query)}"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }
    try:
        response = requests.get(search_url, headers=headers, timeout=10)
        if response.status_code != 200:
            return None
        html = response.text
        match = re.search(r'"permalink_url":"([^"]+)"', html)
        if match:
            return match.group(1)
        match = re.search(r'href="(https?://soundcloud.com/[^"]+)"', html)
        if match:
            return match.group(1)
    except Exception:
        pass
    return None


def _open_url_with_default_browser(url: str, browser: Optional[str] = None) -> str:
    if not url:
        return "No URL provided to open."
    try:
        if browser and browser.lower() in ("chrome", "google chrome"):
            try:
                webbrowser.get("chrome").open(url)
            except Exception:
                webbrowser.open(url)
        else:
            webbrowser.open(url)
        return f"Opened URL: {url}"
    except Exception as e:
        return f"Could not open URL: {e}"


def _humanize_browser_response(action: str, result: str, params: dict) -> str:
    if not result:
        return result
    lower = result.lower()
    if action == "go_to" and lower.startswith("opened"):
        url = params.get("url", "").strip()
        if url:
            site = _friendly_site_name(url)
            return f"I opened {site} for you."
    if action == "search" and lower.startswith("opened"):
        query = params.get("query", "").strip()
        engine = params.get("engine", "google").strip().title()
        if query:
            return f"I searched for '{query}' on {engine}."
    if action == "youtube_search_and_play":
        if lower.startswith("opened url:") or lower.startswith("opened:"):
            return "I opened YouTube search results for your query."
        return result
    if action == "soundcloud_search_and_play":
        if lower.startswith("opened url:") or lower.startswith("opened:"):
            return "I opened SoundCloud search results for your query."
        return result
    if action == "spotify_search_and_play":
        return f"I'm playing '{params.get('query')}' on Spotify for you."
    if action == "apple_music_search_and_play":
        return f"I'm searching for '{params.get('query')}' on Apple Music."
    if action == "pinterest_search":
        return f"I searched for '{params.get('query')}' on Pinterest."
    if action == "generic_search_and_click":
        return f"I searched for '{params.get('query')}' on the site and opened the first result."
    return result


def _log(player, text: str):
    short = str(text)[:80]
    print(f"[Browser] {short}")
    if player:
        player.write_log(f"[browser] {short[:60]}")
