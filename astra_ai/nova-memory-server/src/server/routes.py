from flask import Flask, request, jsonify
from nova_memory_interface import NovaMemoryInterface
from enhanced_nova_memory_interface import EnhancedNovaMemoryInterface
from memory_cleanup_system import MemoryCleanupSystem

app = Flask(__name__)

# Initialize memory systems
memory_interface = EnhancedNovaMemoryInterface("enhanced_nova_memory.json")
cleanup_system = MemoryCleanupSystem("enhanced_nova_memory.json")

@app.route('/process_conversation', methods=['POST'])
def process_conversation():
    data = request.json
    user_message = data.get('user_message')
    ai_response = data.get('ai_response')
    
    result = memory_interface.process_conversation(user_message, ai_response)
    return jsonify(result)

@app.route('/get_context', methods=['GET'])
def get_context():
    context = memory_interface.get_context_for_ai_response()
    return jsonify(context)

@app.route('/get_user_profile', methods=['GET'])
def get_user_profile():
    profile = memory_interface.get_user_profile()
    return jsonify(profile)

@app.route('/run_cleanup', methods=['POST'])
def run_cleanup():
    policy = request.json.get('policy', 'balanced')
    cleanup_stats = cleanup_system.cleanup_memories(policy)
    return jsonify(cleanup_stats)

@app.route('/health', methods=['GET'])
def health_check():
    health_status = memory_interface.is_healthy()
    return jsonify(health_status)

if __name__ == '__main__':
    cleanup_system.start_automatic_cleanup()  # Start background cleanup
    app.run(host='0.0.0.0', port=5000)  # Run the server