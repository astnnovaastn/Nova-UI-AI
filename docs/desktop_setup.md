# Run this branch on another computer

Use Python 3.12 and Node.js 22 or later. Windows provides the native AppContainer isolation used by learned tools; unavailable isolation leaves drafts inspectable and disables their execution.

```powershell
git clone --single-branch --branch NEW-INPROVE-AI-MODEL-AND-A-CLEAN-UI-WITH-THE-GEMINI-MODELS https://github.com/astnnovaastn/Nova-UI-AI.git
cd Nova-UI-AI
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements_desktop.txt
.\.venv\Scripts\python.exe scripts/nova_runtime.py
```

Keep that terminal open. In a second terminal:

```powershell
cd Nova-UI-AI/astra_ai/ui/frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173/. Configure your own Gemini and Groq keys in Nova Settings. Requested web research requires the existing Firecrawl configuration. Keys remain local. No provider substitution or billing activation is performed.

Optional local voice identity matching uses the CPU packages described in `requirements_voice_local.txt`; install those only when using enrollment. Ordinary Gemini Live voice does not require the speaker model. The public speech gate assets are included.

The repository contains source and tests. Personal memory JSON, recovered transcripts, recordings, learned runtime artifacts, and credentials stay on the original computer. A new checkout creates its own stores. Transfer private stores separately only if you want that computer to share the same history; preserve the complete store/transcript/forgotten-record set together.

## Check the code

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m pytest
```

From `astra_ai/ui/frontend`:

```powershell
npm run build
npm run test:memory-globe
node --test src/conversation.test.mjs src/taskNotices.test.mjs src/voice.test.mjs src/ws.test.mjs src/echoGuard.test.mjs src/speechGate.test.mjs src/components/Theme/appearance.test.mjs
```

Provider validation scripts are opt-in and use temporary stores: `scripts/validate_learning_provider.py` and `scripts/validate_groq_learning.py`. They make real API requests and respect existing background pacing.

See [implementation details](growing_memory_learning_plan.md) and [recorded validation](growing_memory_validation.md). The current globe is preserved; a future globe replacement and further mobile polish remain deferred.
