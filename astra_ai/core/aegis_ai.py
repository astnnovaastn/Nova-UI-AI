"""Import-safe public Aegis core; importing starts no model or writer."""
class AegisCore:
    def __init__(self, memory):
        self.memory = memory

    def live_session(self, **options):
        from astra_ai.core.gemini_session import GeminiLiveSession
        return GeminiLiveSession(memory_manager=self.memory, **options)

    def capabilities(self):
        from astra_ai.core.gemini_session import MEMORY_TOOL_DECLARATIONS, MEMORY_EVENT_TOOL_DECLARATIONS, WIDGET_TOOL_DECLARATIONS, ACTION_TOOL_DECLARATIONS
        return MEMORY_TOOL_DECLARATIONS + MEMORY_EVENT_TOOL_DECLARATIONS + WIDGET_TOOL_DECLARATIONS + ACTION_TOOL_DECLARATIONS


def __getattr__(name):
    if name in {'AleChatBot', 'AegisSearch'}:
        from astra_ai.core import legacy_aegis_ai
        return getattr(legacy_aegis_ai, name)
    raise AttributeError(name)


if __name__ == '__main__':
    import runpy
    runpy.run_module('astra_ai.core.legacy_aegis_ai', run_name='__main__')
