#!/usr/bin/env python3
"""
Integration Verification Script
=================================

This script verifies that the Memory System and Auto-Optimizer are properly
integrated and working together in sync.

Run this to ensure everything is connected correctly.
"""

import sys
import time
import json
from pathlib import Path
from datetime import datetime


def check_imports():
    """Check if all required modules can be imported"""
    print("\n[1] Checking imports...")
    
    required_modules = [
        ("astra_ai.memory.mem0_memory_system", "NovaMemoryAI"),
        ("astra_ai.memory.memory_auto_optimizer", "MemoryAutoOptimizer"),
    ]
    
    all_ok = True
    for module_name, class_name in required_modules:
        try:
            module = __import__(module_name, fromlist=[class_name])
            cls = getattr(module, class_name)
            print(f"    ✓ {module_name}.{class_name}")
        except ImportError as e:
            print(f"    ✗ {module_name}.{class_name} - {e}")
            all_ok = False
    
    return all_ok


def check_memory_file():
    """Check if memory file exists and is valid JSON"""
    print("\n[2] Checking memory file...")
    
    memory_file = Path(r"astra_ai/Date/nova_ai_memory.json")
    
    if not memory_file.exists():
        print(f"    ✗ File not found: {memory_file}")
        return False
    
    print(f"    ✓ File exists: {memory_file}")
    
    try:
        with open(memory_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"    ✓ Valid JSON (size: {len(json.dumps(data)):,} bytes)")
        
        # Check structure
        if 'memory_engine' in data:
            engine = data['memory_engine']
            print(f"    ✓ Has memory_engine")
            
            checks = [
                ('memory_events', list),
                ('vector_index', dict),
                ('clusters', dict),
                ('update_log', list),
            ]
            
            for key, expected_type in checks:
                if key in engine:
                    value = engine[key]
                    if isinstance(value, expected_type):
                        count = len(value)
                        print(f"      ✓ {key}: {count} items")
                    else:
                        print(f"      ✗ {key}: wrong type (expected {expected_type.__name__})")
                        return False
                else:
                    print(f"      ✗ {key}: missing")
                    return False
        else:
            print(f"    ✗ Missing memory_engine section")
            return False
        
        return True
    
    except json.JSONDecodeError as e:
        print(f"    ✗ Invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"    ✗ Error reading file: {e}")
        return False


def check_integration():
    """Check if NovaMemoryAI and MemoryAutoOptimizer are integrated"""
    print("\n[3] Checking integration...")
    
    try:
        from astra_ai.memory.mem0_memory_system import NovaMemoryAI
        
        # Check that NovaMemoryAI has optimizer-related attributes/methods
        required_methods = [
            'start_auto_optimizer',
            'stop_auto_optimizer',
            'force_optimizer_optimization',
            'get_optimizer_metrics',
        ]
        
        memory = NovaMemoryAI(auto_optimize=False)  # Initialize without auto-start for this check
        
        for method_name in required_methods:
            if hasattr(memory, method_name):
                print(f"    ✓ NovaMemoryAI.{method_name}()")
            else:
                print(f"    ✗ NovaMemoryAI.{method_name}() not found")
                return False
        
        # Check optimizer attribute
        if hasattr(memory, 'optimizer'):
            print(f"    ✓ NovaMemoryAI.optimizer attribute")
        else:
            print(f"    ✗ NovaMemoryAI.optimizer attribute not found")
            return False
        
        if hasattr(memory, 'auto_optimize_enabled'):
            print(f"    ✓ NovaMemoryAI.auto_optimize_enabled flag")
        else:
            print(f"    ✗ NovaMemoryAI.auto_optimize_enabled flag not found")
            return False
        
        return True
    
    except Exception as e:
        print(f"    ✗ Error: {e}")
        return False


def check_auto_start():
    """Check if optimizer auto-starts"""
    print("\n[4] Checking auto-start functionality...")
    
    try:
        from astra_ai.memory.mem0_memory_system import NovaMemoryAI
        
        print("    Creating NovaMemoryAI with auto_optimize=True...")
        memory = NovaMemoryAI(auto_optimize=True)
        
        # Check if optimizer is running
        time.sleep(0.5)
        
        if memory.optimizer and memory.optimizer.is_running:
            print(f"    ✓ Optimizer is running")
        else:
            print(f"    ✗ Optimizer is not running")
            return False
        
        # Stop it
        memory.stop_auto_optimizer()
        time.sleep(0.5)
        
        if not memory.optimizer.is_running:
            print(f"    ✓ Optimizer stopped cleanly")
        else:
            print(f"    ✗ Optimizer failed to stop")
            return False
        
        return True
    
    except Exception as e:
        print(f"    ✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_metrics():
    """Check if metrics tracking works"""
    print("\n[5] Checking metrics functionality...")
    
    try:
        from astra_ai.memory.mem0_memory_system import NovaMemoryAI
        
        memory = NovaMemoryAI(auto_optimize=False)
        
        # Try to get metrics (should work even if optimizer isn't running)
        metrics = memory.get_optimizer_metrics()
        
        if metrics is None:
            # This is OK - optimizer might not be initialized
            print(f"    ✓ get_optimizer_metrics() returns None (optimizer not active)")
        elif isinstance(metrics, dict):
            expected_keys = [
                'files_checked',
                'changes_detected',
                'optimizations_run',
                'clusters_reorganized',
                'events_reclustered',
                'formatting_applied',
                'errors',
            ]
            
            all_present = all(key in metrics for key in expected_keys)
            
            if all_present:
                print(f"    ✓ Metrics dictionary has all required keys")
                for key, value in metrics.items():
                    print(f"      {key}: {value}")
            else:
                missing = [k for k in expected_keys if k not in metrics]
                print(f"    ✗ Missing metrics keys: {missing}")
                return False
        else:
            print(f"    ✗ Unexpected metrics type: {type(metrics)}")
            return False
        
        return True
    
    except Exception as e:
        print(f"    ✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_documentation():
    """Check if documentation files exist"""
    print("\n[6] Checking documentation...")
    
    docs = [
        ('MEMORY_SYSTEM_INTEGRATION_GUIDE.md', 'Integration guide'),
        ('MEMORY_AUTO_OPTIMIZER_GUIDE.md', 'Optimizer guide'),
        ('example_sync_demo.py', 'Sync demo example'),
    ]
    
    all_ok = True
    for filename, description in docs:
        doc_path = Path(r"astra_ai/memory") / filename
        
        if doc_path.exists():
            size = doc_path.stat().st_size
            print(f"    ✓ {filename} ({size:,} bytes) - {description}")
        else:
            print(f"    ✗ {filename} - {description} NOT FOUND")
            all_ok = False
    
    return all_ok


def print_report(results):
    """Print final verification report"""
    print("\n" + "=" * 70)
    print("INTEGRATION VERIFICATION REPORT")
    print("=" * 70)
    
    all_passed = all(results.values())
    
    for check_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status:.<40} {check_name}")
    
    print("=" * 70)
    
    if all_passed:
        print("\n✓ ALL CHECKS PASSED!")
        print("\nMemory System and Auto-Optimizer are properly integrated.")
        print("Both systems are ready to work together in sync.")
        print("\nYou can now use:")
        print("  memory = NovaMemoryAI()  # Optimizer starts automatically")
        return 0
    else:
        print("\n✗ SOME CHECKS FAILED")
        print("\nPlease fix the issues above before using the integrated system.")
        print("\nCommon fixes:")
        print("  1. Ensure memory_auto_optimizer.py is in astra_ai/memory/")
        print("  2. Verify nova_ai_memory.json exists and is valid")
        print("  3. Check that imports are not breaking")
        print("  4. Review the integration guide for setup instructions")
        return 1


def main():
    """Run all checks"""
    print("\n" + "=" * 70)
    print("MEMORY SYSTEM + AUTO-OPTIMIZER INTEGRATION VERIFICATION")
    print("=" * 70)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        'Imports Available': check_imports(),
        'Memory File Valid': check_memory_file(),
        'Classes Integrated': check_integration(),
        'Auto-Start Works': check_auto_start(),
        'Metrics Tracking': check_metrics(),
        'Documentation': check_documentation(),
    }
    
    return print_report(results)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
