"""Read literal regression fixtures from existing trusted tests; never execute test discovery."""
import ast,json
from pathlib import Path

def cases_for(repo,target,function):
    repo=Path(repo).resolve();target=Path(target).resolve();module='.'.join(target.relative_to(repo).with_suffix('').parts);cases=[]
    for directory in (repo/'tests',repo/'astra_ai'/'tests',repo/'astra_ai'/'ui'/'backend'/'tests'):
        if not directory.exists():continue
        for path in directory.rglob('test_*.py'):
            if path.stat().st_size>512000:continue
            try:tree=ast.parse(path.read_text(encoding='utf-8'))
            except (OSError,SyntaxError,UnicodeError):continue
            names=set();modules=set()
            for node in tree.body:
                if isinstance(node,ast.ImportFrom) and node.module==module:
                    names.update(n.asname or n.name for n in node.names if n.name==function)
                elif isinstance(node,ast.Import):modules.update(n.asname or n.name for n in node.names if n.name==module)
            if not names and not modules:continue
            for node in ast.walk(tree):
                if not isinstance(node,ast.Assert) or not isinstance(node.test,ast.Compare) or len(node.test.comparators)!=1 or not isinstance(node.test.left,ast.Call):continue
                call=node.test.left
                matched=isinstance(call.func,ast.Name) and call.func.id in names or isinstance(call.func,ast.Attribute) and call.func.attr==function and isinstance(call.func.value,ast.Name) and call.func.value.id in modules
                if not matched or len(call.args)!=1 or call.keywords or not isinstance(node.test.ops[0],(ast.Eq,ast.Is)):continue
                try:case={'input':ast.literal_eval(call.args[0]),'expected':ast.literal_eval(node.test.comparators[0])};encoded=json.dumps(case,allow_nan=False)
                except (ValueError,TypeError):continue
                if len(encoded)<=16000 and case not in cases:cases.append(case)
                if len(cases)>=100:return cases
    return cases
