import json

file_path = r'C:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\Date\nova_ai_memory.json'
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

print('Checking structure...')
print('Total root keys:', len(list(data.keys())))
print('Sample root keys:', list(data.keys())[:10])  # Show first 10
has_vector_index_root = 'vector_index' in data
has_clusters_root = 'clusters' in data
has_vector_index_mem_engine = 'vector_index' in data.get('memory_engine', {})
has_clusters_mem_engine = 'clusters' in data.get('memory_engine', {})

print(f'Memory Engine has vector_index: {has_vector_index_mem_engine}')
print(f'Memory Engine has clusters: {has_clusters_mem_engine}')
print(f'ROOT has vector_index: {has_vector_index_root}')
print(f'ROOT has clusters: {has_clusters_root}')

if has_vector_index_root:
    print('  - Root vector_index length:', len(data["vector_index"]))
if has_clusters_root:
    print('  - Root clusters length:', len(data["clusters"]))
if has_vector_index_mem_engine:
    print('  - ME vector_index length:', len(data["memory_engine"]["vector_index"]))
if has_clusters_mem_engine:
    print('  - ME clusters length:', len(data["memory_engine"]["clusters"]))