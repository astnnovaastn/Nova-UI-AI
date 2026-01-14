import json
p='astra_ai/Date/nova_ai_memory.json'
try:
    with open(p,'r',encoding='utf-8') as f:
        data=json.load(f)
    print('OK: parsed, memory_events=', len(data.get('memory_engine',{}).get('memory_events',[])))
except Exception as e:
    print('ERROR',e)
    import traceback; traceback.print_exc()
