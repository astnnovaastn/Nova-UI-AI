"""V35: which installed distributions the AEGIS backend actually imports (server + runtime + Work), with versions.

Run with the development venv and a throwaway state folder; prints a pinned requirements list for
release/requirements-desktop.txt. No network, no model call:
  set NOVA_STATE_DIR=%TEMP%\aegis-audit-state & set AEGIS_ENV_FILE=%TEMP%\aegis-audit.env
  .venv\Scripts\python.exe release\import-audit.py
"""
import importlib
import importlib.metadata as md
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'astra_ai' / 'ui' / 'backend'))
before = set(sys.modules)
for name in ('astra_ai.ui.backend.server', 'astra_ai.core.work.orchestrator', 'astra_ai.core.work.v29_tasks', 'astra_ai.core.work.agent_browser',
             'astra_ai.core.work.free_search', 'astra_ai.core.work.dev_drafts', 'astra_ai.core.work.repo_index'):
    importlib.import_module(name)
runtime = ROOT / 'scripts' / 'nova_runtime.py'
for line in runtime.read_text(encoding='utf-8').splitlines():
    if line.startswith(('import ', 'from ')) and not line.startswith('from astra_ai'):
        exec(line)
mapping = md.packages_distributions()
used = {}
for module in sorted(set(sys.modules) - before | {'uvicorn', 'httpx', 'fastapi', 'dotenv'}):
    top = module.split('.')[0]
    for dist in mapping.get(top, []):
        try:
            used[dist] = md.version(dist)
        except md.PackageNotFoundError:
            pass
print(json.dumps(used, indent=1, sort_keys=True))
