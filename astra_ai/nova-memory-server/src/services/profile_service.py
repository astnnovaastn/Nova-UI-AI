from flask import Flask, request, jsonify
from nova_memory_interface import NovaMemoryInterface
from enhanced_nova_memory_interface import EnhancedNovaMemoryInterface
from memory_cleanup_system import MemoryCleanupSystem

app = Flask(__name__)

# Initialize memory systems
memory_interface = EnhancedNovaMemoryInterface("enhanced_nova_memory.json")
cleanup_system = MemoryCleanupSystem("nova_ai_memory.json")

@app.route('/memory/store', methods=['POST'])
def store_memory():
    data = request.json
    user_message = data.get('user_message')
    ai_response = data.get('ai_response')
    context = data.get('context')
    
    result = memory_interface.process_conversation(user_message, ai_response, context)
    return jsonify(result)

@app.route('/memory/retrieve', methods=['GET'])
def retrieve_memory():
    query = request.args.get('query')
    memories = memory_interface.search_memories(query)
    return jsonify(memories)

@app.route('/memory/delete', methods=['DELETE'])
def delete_memory():
    memory_id = request.args.get('id')
    result = memory_interface.delete_memory(memory_id)
    return jsonify(result)

@app.route('/memory/statistics', methods=['GET'])
def memory_statistics():
    stats = memory_interface.get_memory_statistics()
    return jsonify(stats)

@app.route('/memory/cleanup', methods=['GET'])
def cleanup_memory():
    cleanup_stats = cleanup_system.cleanup_memories()
    return jsonify(cleanup_stats)

if __name__ == '__main__':
    app.run(debug=True)