#!/usr/bin/env python3
"""
Test script to check Nova AI system components
"""

import sys
import os
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent.parent))

def test_component(name, import_func):
    """Test a single component"""
    try:
        import_func()
        print(f'✅ {name}: Available')
        return True
    except ImportError as e:
        print(f'❌ {name}: Not available - {e}')
        return False
    except Exception as e:
        print(f'⚠️ {name}: Error - {e}')
        return False

def main():
    print('🔍 Testing Nova AI System Components...')
    print()
    
    results = {}
    
    # Test memory system
    results['memory'] = test_component(
        'Memory System',
        lambda: __import__('core.nova_memory_integration', fromlist=['NovaMemoryIntegration'])
    )

    # Test smart greeting system
    results['greeting'] = test_component(
        'Smart Greeting System',
        lambda: __import__('core.smart_greeting_system', fromlist=['SmartGreetingSystem'])
    )

    # Test task management
    results['tasks'] = test_component(
        'Task Management System',
        lambda: __import__('core.task_management', fromlist=['TaskManager'])
    )

    # Test AI vision system
    results['vision'] = test_component(
        'AI Vision System',
        lambda: __import__('core.ai_vision_system', fromlist=['AIVisionSystem', 'VisionAnalysis'])
    )

    # Test conversation analytics
    results['analytics'] = test_component(
        'Conversation Analytics',
        lambda: __import__('core.conversation_analytics', fromlist=['ConversationAnalytics'])
    )

    # Test music system
    results['music'] = test_component(
        'Music System',
        lambda: __import__('services.music_service', fromlist=['MusicService'])
    )

    print()
    print('🚀 Testing Nova AI Core...')
    results['core'] = test_component(
        'Nova AI Core',
        lambda: __import__('core.nova_ai', fromlist=['NovaAI'])
    )
    
    print()
    print('📊 Summary:')
    working = sum(1 for v in results.values() if v)
    total = len(results)
    print(f'Working: {working}/{total} ({working/total*100:.1f}%)')
    
    if working == total:
        print('🎉 All systems operational!')
    elif working >= total * 0.8:
        print('✅ Most systems working - minor issues')
    else:
        print('⚠️ Several systems need attention')
    
    print()
    print('🔧 To fix missing systems:')
    if not results.get('memory'):
        print('  • Check memory system dependencies')
    if not results.get('greeting'):
        print('  • Check smart greeting system')
    if not results.get('tasks'):
        print('  • Check task management system')
    if not results.get('vision'):
        print('  • Check AI vision system dependencies')
    if not results.get('analytics'):
        print('  • Check conversation analytics system')

if __name__ == '__main__':
    main()
