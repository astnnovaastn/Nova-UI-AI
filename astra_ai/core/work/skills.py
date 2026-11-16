"""Skills for AEGIS Work: how to do a kind of job, as instructions the lead follows.

The format is Zephium's (MPL-2.0): a folder holding SKILL.md with `---` frontmatter (name, one-line
description, optional tools and triggers) and a Markdown body. See
astra_ai/ui/zephium-source/crates/zephium-app/src/work_lead/skills.rs. This module is an independent
Python implementation of that format; the built-in bodies under skills/ that were adapted from
Zephium's skills say so in their own header.

A skill changes only the instructions and the shape of the result. It never adds a model, a provider,
a tool or a permission: those stay with the orchestrator and its six-model cap. Only the person
creates or edits skills (never a page, a source or a model), and every change is written to an
append-only audit log. A run records the name and version of the skill it used.
"""
from __future__ import annotations

import hashlib
import json
import re
import threading
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

MAX_NAME = 40
MAX_DESCRIPTION = 200
MAX_BODY = 16 * 1024
MAX_USER_SKILLS = 64
BUILTIN_DIR = Path(__file__).with_name('skills')
NAME = re.compile(r'[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?')


class SkillError(ValueError):
    pass


@dataclass
class Skill:
    name: str
    description: str
    body: str
    title: str = ''
    category: str = 'research'
    tools: list = field(default_factory=list)
    triggers: list = field(default_factory=list)
    source: str = 'builtin'          # builtin | user
    origin: str = ''                 # where a built-in body came from, for attribution
    enabled: bool = True

    @property
    def version(self):
        return hashlib.sha256((self.description + '\n' + self.body).encode()).hexdigest()[:12]

    def public(self, with_body=False):
        row = {k: v for k, v in asdict(self).items() if k != 'body'}
        row['version'] = self.version
        if with_body:
            row['body'] = self.body
        return row


def parse(text: str, source='user') -> Skill:
    """Parses `---`, `key: value` lines, `---`, then the body (Zephium's SKILL.md format)."""
    if len(text.encode()) > MAX_BODY:
        raise SkillError('too_large')
    text = text.lstrip('﻿').replace('\r\n', '\n')
    if not text.startswith('---\n') or '\n---' not in text[4:]:
        raise SkillError('no_frontmatter')
    head, body = text[4:].split('\n---', 1)
    body = body.lstrip('\n').strip()
    meta = {}
    for line in head.splitlines():
        if ':' in line:
            key, value = line.split(':', 1)
            meta[key.strip()] = value.strip().strip('"').strip()
    listed = lambda value: [item.strip().strip('"') for item in value.strip('[]').split(',') if item.strip()][:24]
    name = meta.get('name', '')
    if not NAME.fullmatch(name):
        raise SkillError('name')
    description = meta.get('description', '')
    if not description or len(description) > MAX_DESCRIPTION or any(ord(c) < 32 for c in description):
        raise SkillError('description')
    if not body:
        raise SkillError('empty')
    return Skill(name=name, description=description, body=body, title=meta.get('title', '') or name.replace('-', ' ').capitalize(),
                 category=meta.get('category', 'research'), tools=listed(meta.get('tools', '')), triggers=listed(meta.get('triggers', '')),
                 source=source, origin=meta.get('origin', ''))


def render(skill: Skill) -> str:
    lines = ['---', f'name: {skill.name}', f'title: {skill.title}', f'description: {skill.description}', f'category: {skill.category}']
    if skill.tools:
        lines.append('tools: [' + ', '.join(skill.tools) + ']')
    if skill.triggers:
        lines.append('triggers: [' + ', '.join(skill.triggers) + ']')
    return '\n'.join(lines) + '\n---\n\n' + skill.body.strip() + '\n'


def compatible(skill, other):
    return skill.category == other.category or {skill.name, other.name} == {'map-a-project', 'system-design'}


def snapshot(skill, how, workflow='', available_tools=()):
    detail = skill.public()
    detail.pop('triggers', None)
    detail.pop('enabled', None)
    detail['tools'] = [tool for tool in detail['tools'] if tool in available_tools]
    detail.update(chosen=how, workflow=workflow, status='loaded')
    return {'public': detail, 'instructions': skill.body[:4200]}


def instructions_for(snapshots):
    return '\n\n'.join(item['public']['title'] + ':\n' + item['instructions'] for item in snapshots)



class SkillRegistry:
    """Built-in skills (the workflow catalog, with fuller bodies where shipped), then the person's own."""

    def __init__(self, root):
        self.root = Path(root) / 'work' / 'skills'
        self.state = Path(root) / 'work' / 'skills.json'
        self.audit = Path(root) / 'work' / 'skills-audit.jsonl'
        self.lock = threading.Lock()

    # Reading

    def builtins(self):
        from .catalog import WORKFLOWS
        found = {}
        for flow in WORKFLOWS.values():
            found[flow.skill] = Skill(name=flow.skill, description=flow.brief[:MAX_DESCRIPTION], body=flow.brief, title=flow.skill.replace('-', ' ').capitalize(), category=flow.persona)
        if BUILTIN_DIR.is_dir():
            for path in sorted(BUILTIN_DIR.glob('*/SKILL.md')):
                try:
                    skill = parse(path.read_text(encoding='utf-8'), 'builtin')
                except (SkillError, OSError):
                    continue
                if skill.name in found and not skill.category:
                    skill.category = found[skill.name].category
                found[skill.name] = skill
        return found

    def _settings(self):
        try:
            return json.loads(self.state.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            return {'disabled': []}

    def user_skills(self):
        found = {}
        if not self.root.is_dir():
            return found
        for path in sorted(self.root.glob('*/SKILL.md'))[:MAX_USER_SKILLS * 2]:
            try:
                skill = parse(path.read_text(encoding='utf-8'), 'user')
            except (SkillError, OSError):
                continue
            found.setdefault(skill.name, skill)
        return dict(list(found.items())[:MAX_USER_SKILLS])

    def all(self):
        skills = self.builtins()
        skills.update(self.user_skills())  # A person's skill replaces a built-in of the same name.
        disabled = set(self._settings().get('disabled', []))
        for skill in skills.values():
            skill.enabled = skill.name not in disabled
        return dict(sorted(skills.items()))

    def get(self, name):
        return self.all().get(name)

    # Choosing

    def select(self, request: str, workflow: str = ''):
        selected = self.select_many(request, workflow)
        return selected[0] if selected else (None, '')

    def select_many(self, request: str, workflow: str = ''):
        """Choose the explicit workflow first, then strongly matched complementary skills."""
        skills = {name: skill for name, skill in self.all().items() if skill.enabled}
        text = request.casefold()
        matches = []
        for skill in skills.values():
            if skill.name == workflow:
                continue
            hits = [trigger for trigger in skill.triggers if trigger and
                    re.search(r'(?<!\w)' + re.escape(trigger.casefold()) + r'(?!\w)', text)]
            if hits:
                matches.append((skill, len(hits), max(len(trigger.split()) for trigger in hits)))
        matches.sort(key=lambda row: (-row[1], -row[2], row[0].name))
        primary = skills.get(workflow)
        selected = [(primary, 'workflow')] if primary else []
        for skill, _, phrase_size in matches:
            if not selected or (phrase_size > 1 and all(compatible(skill, other) for other, _ in selected)):
                selected.append((skill, 'matched'))
            if len(selected) == (3 if primary else 2):
                break
        return selected

    def snapshots(self, request, workflow='', available_tools=()):
        return [snapshot(skill, how, workflow, available_tools)
                for skill, how in self.select_many(request, workflow)]

    # Changing (the person only)

    def _log(self, action, name, version=''):
        self.audit.parent.mkdir(parents=True, exist_ok=True)
        with self.audit.open('a', encoding='utf-8') as out:
            out.write(json.dumps({'at': round(time.time(), 3), 'action': action, 'skill': name, 'version': version}) + '\n')

    def save(self, text: str):
        skill = parse(text, 'user')
        with self.lock:
            if skill.name not in self.user_skills() and len(self.user_skills()) >= MAX_USER_SKILLS:
                raise SkillError('too_many')
            folder = self.root / skill.name
            folder.mkdir(parents=True, exist_ok=True)
            (folder / 'SKILL.md').write_text(render(skill), encoding='utf-8')
            self._log('save', skill.name, skill.version)
        return self.get(skill.name)

    def duplicate(self, name: str, new_name: str):
        source = self.get(name)
        if not source:
            raise SkillError('not_found')
        copy = Skill(**{**asdict(source), 'name': new_name, 'source': 'user', 'origin': f'Copied from {name}'})
        return self.save(render(copy))

    def delete(self, name: str):
        with self.lock:
            path = self.root / name / 'SKILL.md'
            if not NAME.fullmatch(name) or not path.is_file():
                raise SkillError('not_found')
            path.unlink()
            try:
                path.parent.rmdir()
            except OSError:
                pass
            self._log('delete', name)

    def set_enabled(self, name: str, enabled: bool):
        if name not in self.all():
            raise SkillError('not_found')
        with self.lock:
            settings = self._settings()
            disabled = set(settings.get('disabled', []))
            (disabled.discard if enabled else disabled.add)(name)
            settings['disabled'] = sorted(disabled)
            self.state.parent.mkdir(parents=True, exist_ok=True)
            self.state.write_text(json.dumps(settings), encoding='utf-8')
            self._log('enable' if enabled else 'disable', name)
