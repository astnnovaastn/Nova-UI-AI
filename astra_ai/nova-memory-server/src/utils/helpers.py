from flask import Flask, request, jsonify
from nova_memory_interface import NovaMemoryInterface
from enhanced_nova_memory_interface import EnhancedNovaMemoryInterface
from memory_cleanup_system import MemoryCleanupSystem

app = Flask(__name__)

# Initialize memory interfaces
memory_interface = NovaMemoryInterface("nova_ai_memory.json")
enhanced_memory_interface = EnhancedNovaMemoryInterface("enhanced_nova_memory.json")
cleanup_system = MemoryCleanupSystem("nova_ai_memory.json")

@app.route('/memory/process', methods=['POST'])
def process_memory():
    data = request.json
    user_message = data.get('user_message')
    ai_response = data.get('ai_response')
    
    result = memory_interface.process_conversation(user_message, ai_response)
    return jsonify(result)

@app.route('/memory/context', methods=['GET'])
def get_context():
    context = enhanced_memory_interface.get_context_for_ai_response()
    return jsonify(context)

@app.route('/memory/statistics', methods=['GET'])
def get_statistics():
    stats = memory_interface.get_memory_statistics()
    return jsonify(stats)

@app.route('/memory/cleanup', methods=['DELETE'])
def cleanup_memory():
    cleanup_stats = cleanup_system.cleanup_memories()
    return jsonify(cleanup_stats)

@app.route('/memory/profile', methods=['GET'])
def get_user_profile():
    profile = enhanced_memory_interface.get_user_profile()
    return jsonify(profile)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)