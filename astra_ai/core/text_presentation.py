"""Professional generated prose without altering quoted material or code."""
import re

_EMOJI = re.compile(r'(?:[\U0001f1e6-\U0001f1ff\U0001f300-\U0001faff\u2600-\u27bf](?:[\ufe0e\ufe0f\U0001f3fb-\U0001f3ff]|\u200d[\U0001f300-\U0001faff\u2600-\u27bf])*|[0-9#*]\ufe0f?\u20e3)')
_PROTECTED = re.compile(r'(```.*?```|~~~.*?~~~|`[^`\n]*`|(?m:^>[^\n]*(?:\n>[^\n]*)*)|"[^"\n]*"|“[^”\n]*”)', re.S)


def without_decorative_emoji(text):
    parts = _PROTECTED.split(str(text))
    return ''.join(part if i % 2 else _EMOJI.sub('', part) for i, part in enumerate(parts))
