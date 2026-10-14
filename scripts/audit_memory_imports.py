"""Conservative static import inventory. Dynamic/legacy paths are not deleted."""
import ast
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    imports = {}; parse_errors = []
    for path in (ROOT/'astra_ai').rglob('*.py'):
        if any(part in {'node_modules', '__pycache__', 'memory_unused_old', 'test_backups', 'backups', 'learned', 'Jarvis-MK37-main'} or part.startswith('.venv') for part in path.parts):continue
        relative = path.relative_to(ROOT); name = '.'.join(relative.with_suffix('').parts)
        if name.endswith('.__init__'):name = name[:-9]
        try:tree = ast.parse(path.read_text(encoding='utf-8-sig'))
        except (SyntaxError, UnicodeError):parse_errors.append(relative.as_posix());continue
        refs = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):refs.update(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom):
                if node.level:
                    package = name if path.name == '__init__.py' else name.rsplit('.', 1)[0]
                    prefix = package.split('.')[:len(package.split('.')) - node.level + 1]
                    base = '.'.join([*prefix, *(node.module or '').split('.')]).rstrip('.')
                else:base = node.module or ''
                refs.add(base)
                refs.update(base + '.' + alias.name for alias in node.names if alias.name != '*')
        imports[name] = refs
    reached = set(); pending = ['astra_ai.ui.backend.server']
    while pending:
        name = pending.pop()
        if name in reached:continue
        reached.add(name)
        for ref in imports.get(name, set()):
            options = [ref, 'astra_ai.ui.backend.' + ref, 'astra_ai.core.' + ref, 'astra_ai.' + ref]
            resolved = next((option for option in options if option in imports), None)
            if resolved:pending.append(resolved)
    lines = ['# Memory implementation inventory', '', 'Static imports include imports inside functions. This intentionally overapproximates', 'reachability. Unreached code is a candidate for manual review, not proof it is safe', 'to delete; dynamic loaders and compatibility entry points must also be checked.', '', '| Module | Static status |', '|---|---|']
    for name in sorted(imports):
        if '.memory.' in name or any(x in name for x in ['memory_retrieval', 'memory_integration', 'time_service', 'learning', 'learned_capabil', 'chat_stream', 'gemini_live']):
            status = 'Reachable from backend' if name in reached else 'Manual/dynamic/compatibility review required'
            lines.append(f'| `{name}` | {status} |')
    lines.extend(['', '## Existing parse failures outside the new implementation', ''])
    lines.extend('- `'+path+'`' for path in parse_errors)
    (ROOT/'docs/memory_implementation_inventory.md').write_text('\n'.join(lines)+'\n', encoding='utf-8')
    print({'modules_scanned': len(imports), 'static_reachable': len(reached), 'existing_parse_failures': len(parse_errors), 'deleted_modules': 0})


if __name__ == '__main__':main()
