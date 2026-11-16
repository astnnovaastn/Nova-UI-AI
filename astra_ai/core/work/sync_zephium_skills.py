"""Sync licensed Skill bodies, retaining AEGIS selection and permission metadata.

The reference repository is read only. Tool-name/output mapping below is the
adapter to AEGIS's existing execution pipeline, not a new grant of capabilities.
"""
from pathlib import Path
import hashlib
import json
import subprocess


def sync():
    core = Path(__file__).resolve().parent
    clone = core.parents[1] / 'ui' / 'zephium-source'
    commit = subprocess.check_output(['git', '-C', str(clone), 'rev-parse', 'HEAD'], text=True).strip()
    records = []
    for name in ('map-a-project', 'system-design', 'pricing-research'):
        source = clone / 'crates' / 'zephium-app' / 'skills' / name / 'SKILL.md'
        target = core / 'skills' / name / 'SKILL.md'
        original = source.read_text(encoding='utf-8')
        body = original.split('\n---', 1)[1].strip()
        header = target.read_text(encoding='utf-8').split('\n---', 1)[0]
        lines = [line for line in header.splitlines() if not line.startswith(('origin:', 'title:', 'tools:'))]
        title = body.splitlines()[0].removeprefix('# ')
        lines += [f'title: {title}', 'tools: [web_search, web_fetch]', f'origin: Zephium {commit} (MPL-2.0), AEGIS execution adapter']
        adapter = (
            '## AEGIS execution binding\n'
            'Follow the workflow below through the existing AEGIS planning, evidence, analysis and writing stages. '
            'Only use tools already permitted for this run. The upstream tool names describe intent: '
            'describe_project and computer parts mean inspect supplied project evidence or accessible public code/documentation; '
            'never claim local folder access or start a new agent outside the existing orchestrator. '
            'read_canvas means use the supplied run context. create/revise/finish mean produce or update the existing '
            'structured research output, not call unsupported tools. Represent diagrams in the existing knowledge map '
            'when requested, sheets as cited report tables, and plots only when the current output supports them. '
            'Preserve existing output schemas, citations and user requirements. For a named real system, distinguish '
            'verified architecture from a proposed design; do not invent unseen modules.\n\n'
        )
        notice = f'<!-- Adapted from Zephium crates/zephium-app/skills/{name}/SKILL.md at {commit}. Mozilla Public License 2.0; https://mozilla.org/MPL/2.0/. Upstream body preserved below. -->\n\n'
        target.write_text('\n'.join(lines) + '\n---\n\n' + notice + adapter + body + '\n', encoding='utf-8')
        records.append({'name': name, 'upstream': source.relative_to(clone).as_posix(), 'sha256': hashlib.sha256(original.encode()).hexdigest()})
    (core / 'skills' / 'ZEPHIUM-SOURCES.json').write_text(json.dumps({'commit': commit, 'license': 'MPL-2.0', 'skills': records}, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    sync()
