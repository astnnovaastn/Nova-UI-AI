# AEGIS Work sandbox (V34). Runs approved test commands with no network, read-only root, bounded CPU/memory.
# Built locally: docker build -t aegis-work-sandbox:1 astra_ai/core/work/sandbox
FROM python:3.12-slim
RUN pip install --no-cache-dir pytest==8.3.3 \
 && apt-get update && apt-get install -y --no-install-recommends nodejs npm git \
 && rm -rf /var/lib/apt/lists/* \
 && useradd -m -u 1000 runner
ENV PYTHONDONTWRITEBYTECODE=1 PYTEST_ADDOPTS="-p no:cacheprovider"
USER runner
WORKDIR /workspace
