# main.py (Flask/FastAPI server)
from flask import Flask, request, jsonify
from mem0_memory_system import NovaMemoryAI
from enhanced_nova_memory_interface import EnhancedNovaMemoryInterface
from memory_cleanup_system import MemoryCleanupSystem

app = Flask(__name__)

# Initialize memory systems
memory_ai = NovaMemoryAI("memory.json")
enhanced_memory_interface = EnhancedNovaMemoryInterface("enhanced_memory.json")
cleanup_system = MemoryCleanupSystem("memory.json")

@app.route('/memory/store', methods=['POST'])
def store_memory():
    data = request.json
    result = memory_ai.store_memory(data)
    return jsonify(result)

@app.route('/memory/retrieve', methods=['GET'])
def retrieve_memory():
    criteria = request.args
    result = memory_ai.retrieve_memory(criteria)
    return jsonify(result)

@app.route('/memory/update', methods=['PUT'])
def update_memory():
    data = request.json
    result = memory_ai.update_memory(data)
    return jsonify(result)

@app.route('/memory/delete', methods=['DELETE'])
def delete_memory():
    memory_id = request.args.get('id')
    result = memory_ai.delete_memory(memory_id)
    return jsonify(result)

@app.route('/memory/statistics', methods=['GET'])
def memory_statistics():
    stats = memory_ai.get_memory_statistics()
    return jsonify(stats)

@app.route('/memory/cleanup', methods=['GET'])
def cleanup_memory():
    cleanup_system.cleanup_memories()
    return jsonify({"status": "cleanup completed"})

if __name__ == '__main__':
    app.run(debug=True)