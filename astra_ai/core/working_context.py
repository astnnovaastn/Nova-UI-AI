"""Small per-conversation state; tool results are evidence, never instructions."""
from collections import deque


class WorkingContext:
    def __init__(self):
        self.latest_request = ''
        self.turn_id = ''
        self.results = deque(maxlen=8)

    def begin(self, text, turn_id):
        self.latest_request = str(text)[-8000:]
        self.turn_id = turn_id

    def result(self, name, arguments, result, turn_id):
        self.results.append({'tool': name, 'turn_id': turn_id, 'status': result.get('status'),
                             'query': str(arguments.get('query',''))[:400],
                             **{k:result[k] for k in ('research_id','research_revision','note_id','job_id','id','reason') if k in result}})

    def snapshot(self):
        return {'latest_request': self.latest_request, 'turn_id': self.turn_id,
                'recent_operations': list(self.results)}
