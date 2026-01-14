"""
Self-Improving AI System
========================

This module implements a self-improving AI system that learns from user interactions,
remembers successful task solutions, and improves over time.

Features:
- Task recognition and learning
- Solution storage and retrieval
- Learning from failures
- Safe code execution
- Performance improvement tracking
- Integration with existing memory systems
"""

import json
import logging
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
import hashlib
import re
import ast
import traceback
from dataclasses import dataclass, asdict
from enum import Enum

# Add project root to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

logger = logging.getLogger("AleChatBot.SelfImprovingAI")

class TaskType(Enum):
    """Types of tasks the AI can learn."""
    APPLICATION_LAUNCH = "application_launch"
    FILE_OPERATION = "file_operation"
    SYSTEM_COMMAND = "system_command"
    WEB_SEARCH = "web_search"
    CALCULATION = "calculation"
    TEXT_PROCESSING = "text_processing"
    AUTOMATION = "automation"
    UNKNOWN = "unknown"

class ExecutionStatus(Enum):
    """Status of task execution."""
    SUCCESS = "success"
    FAILURE = "failure"
    PARTIAL_SUCCESS = "partial_success"
    BLOCKED = "blocked"
    TIMEOUT = "timeout"

@dataclass
class TaskSolution:
    """Represents a learned solution for a task."""
    task_id: str
    task_type: TaskType
    task_description: str
    solution_code: str
    success_rate: float
    execution_count: int
    last_used: datetime
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]
    user_feedback: List[Dict[str, Any]]
    performance_metrics: Dict[str, float]

@dataclass
class TaskExecution:
    """Represents an execution attempt of a task."""
    execution_id: str
    task_id: str
    status: ExecutionStatus
    execution_time: float
    error_message: Optional[str]
    output: Optional[str]
    timestamp: datetime
    user_feedback: Optional[str]

class SafeCodeExecutor:
    """Safely executes code with security restrictions."""
    
    def __init__(self):
        self.blocked_functions = {
            'eval', 'exec', 'compile', '__import__', 'globals', 'locals', 'vars',
            'delattr', 'setattr', 'getattr', 'input', 'raw_input'
        }
        self.allowed_modules = {
            'math', 'datetime', 'json', 'time', 'random', 'string', 're', 
            'urllib.parse', 'base64', 'subprocess', 'os', 'webbrowser',
            'pathlib', 'shutil', 'platform'
        }
        self.dangerous_os_functions = {
            'system', 'popen', 'spawn', 'fork', 'execv', 'execl'
        }
        
    def is_code_safe(self, code: str) -> Tuple[bool, str]:
        """Check if code is safe to execute."""
        try:
            # Parse the code to check for dangerous operations
            tree = ast.parse(code)
            
            for node in ast.walk(tree):
                # Check for dangerous function calls
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        if node.func.id in self.blocked_functions:
                            return False, f"Blocked function: {node.func.id}"
                    
                    # Check for dangerous os functions
                    if isinstance(node.func, ast.Attribute):
                        if (isinstance(node.func.value, ast.Name) and 
                            node.func.value.id == 'os' and 
                            node.func.attr in self.dangerous_os_functions):
                            return False, f"Blocked os function: os.{node.func.attr}"
                
                # Check for dangerous imports
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name not in self.allowed_modules:
                            return False, f"Blocked import: {alias.name}"
                
                if isinstance(node, ast.ImportFrom):
                    if node.module and node.module not in self.allowed_modules:
                        return False, f"Blocked import from: {node.module}"
            
            return True, "Code is safe"
            
        except SyntaxError as e:
            return False, f"Syntax error: {str(e)}"
        except Exception as e:
            return False, f"Code analysis error: {str(e)}"
    
    def execute_code(self, code: str, timeout: int = 10) -> Tuple[ExecutionStatus, Optional[str], Optional[str]]:
        """Execute code safely with timeout."""
        is_safe, safety_message = self.is_code_safe(code)
        if not is_safe:
            return ExecutionStatus.BLOCKED, None, safety_message
        
        try:
            # Create a controlled execution environment
            import subprocess
            import webbrowser
            
            # Create a safer but functional execution environment
            safe_builtins = {
                'print': print,
                'len': len,
                'str': str,
                'int': int,
                'float': float,
                'bool': bool,
                'list': list,
                'dict': dict,
                'tuple': tuple,
                'set': set,
                'range': range,
                'enumerate': enumerate,
                'zip': zip,
                'min': min,
                'max': max,
                'sum': sum,
                'abs': abs,
                'round': round,
            }
            
            restricted_globals = {
                '__builtins__': safe_builtins,
                'subprocess': subprocess,
                'os': os,
                'webbrowser': webbrowser,
                'time': time,
                're': __import__('re'),
                'math': __import__('math'),
            }
            
            # Execute with timeout (simplified - in production use proper timeout)
            start_time = time.time()
            
            # Capture output
            import io
            import contextlib
            
            output_buffer = io.StringIO()
            
            with contextlib.redirect_stdout(output_buffer):
                exec(code, restricted_globals)
            
            execution_time = time.time() - start_time
            output = output_buffer.getvalue()
            
            if execution_time > timeout:
                return ExecutionStatus.TIMEOUT, output, f"Execution timed out after {timeout} seconds"
            
            return ExecutionStatus.SUCCESS, output, None
            
        except Exception as e:
            error_msg = f"Execution error: {str(e)}\n{traceback.format_exc()}"
            return ExecutionStatus.FAILURE, None, error_msg

class TaskRecognizer:
    """Recognizes and categorizes user tasks."""
    
    def __init__(self):
        self.task_patterns = {
            TaskType.APPLICATION_LAUNCH: [
                r'open\s+(\w+(?:\s+\w+)*)',
                r'launch\s+(\w+(?:\s+\w+)*)',
                r'start\s+(\w+(?:\s+\w+)*)',
                r'run\s+(\w+(?:\s+\w+)*)',
                r'can\s+(?:you\s+)?open\s+(\w+(?:\s+\w+)*)',
                r'please\s+open\s+(\w+(?:\s+\w+)*)',
            ],
            TaskType.FILE_OPERATION: [
                r'create\s+file',
                r'delete\s+file',
                r'copy\s+file',
                r'move\s+file',
                r'read\s+file',
            ],
            TaskType.SYSTEM_COMMAND: [
                r'shutdown',
                r'restart',
                r'sleep',
                r'lock\s+screen',
            ],
            TaskType.WEB_SEARCH: [
                r'search\s+for',
                r'find\s+information',
                r'look\s+up',
                r'google',
            ],
            TaskType.CALCULATION: [
                r'calculate',
                r'compute',
                r'what\s+is\s+\d+',
                r'solve',
            ],
            TaskType.TEXT_PROCESSING: [
                r'summarize',
                r'translate',
                r'format',
                r'convert',
            ],
        }
    
    def recognize_task(self, user_input: str) -> Tuple[TaskType, str, Dict[str, Any]]:
        """Recognize task type and extract parameters."""
        user_input_lower = user_input.lower().strip()
        
        for task_type, patterns in self.task_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, user_input_lower)
                if match:
                    # Extract parameters from the match
                    params = {
                        'original_input': user_input,
                        'matched_pattern': pattern,
                        'extracted_groups': match.groups() if match.groups() else [],
                    }
                    
                    # Generate task description
                    task_description = self._generate_task_description(task_type, user_input, params)
                    
                    return task_type, task_description, params
        
        # Default to unknown task
        return TaskType.UNKNOWN, user_input, {'original_input': user_input}
    
    def _generate_task_description(self, task_type: TaskType, user_input: str, params: Dict) -> str:
        """Generate a standardized task description."""
        if task_type == TaskType.APPLICATION_LAUNCH:
            app_name = params['extracted_groups'][0] if params['extracted_groups'] else 'application'
            return f"Launch {app_name}"
        elif task_type == TaskType.WEB_SEARCH:
            return f"Search for: {user_input}"
        elif task_type == TaskType.CALCULATION:
            return f"Calculate: {user_input}"
        else:
            return user_input

class SelfImprovingAI:
    """Main self-improving AI system."""
    
    def __init__(self, data_dir: str = "data/self_improving_ai"):
        """Initialize the self-improving AI system."""
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Component initialization
        self.task_recognizer = TaskRecognizer()
        self.code_executor = SafeCodeExecutor()
        
        # Storage files
        self.solutions_file = self.data_dir / "task_solutions.json"
        self.executions_file = self.data_dir / "task_executions.json"
        self.learning_stats_file = self.data_dir / "learning_stats.json"
        
        # Load existing data
        self.task_solutions: Dict[str, TaskSolution] = self._load_solutions()
        self.task_executions: List[TaskExecution] = self._load_executions()
        self.learning_stats = self._load_learning_stats()
        
        # Performance tracking
        self.session_stats = {
            'tasks_attempted': 0,
            'tasks_successful': 0,
            'new_solutions_learned': 0,
            'solutions_improved': 0,
            'session_start': datetime.now()
        }
        
        logger.info("Self-improving AI system initialized")
    
    def _load_solutions(self) -> Dict[str, TaskSolution]:
        """Load task solutions from storage."""
        if not self.solutions_file.exists():
            return {}
        
        try:
            with open(self.solutions_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            solutions = {}
            for task_id, solution_data in data.items():
                # Convert datetime strings back to datetime objects
                solution_data['last_used'] = datetime.fromisoformat(solution_data['last_used'])
                solution_data['created_at'] = datetime.fromisoformat(solution_data['created_at'])
                solution_data['updated_at'] = datetime.fromisoformat(solution_data['updated_at'])
                solution_data['task_type'] = TaskType(solution_data['task_type'])
                
                solutions[task_id] = TaskSolution(**solution_data)
            
            return solutions
            
        except Exception as e:
            logger.error(f"Error loading solutions: {e}")
            return {}
    
    def _save_solutions(self) -> bool:
        """Save task solutions to storage."""
        try:
            data = {}
            for task_id, solution in self.task_solutions.items():
                solution_dict = asdict(solution)
                # Convert datetime objects to strings
                solution_dict['last_used'] = solution.last_used.isoformat()
                solution_dict['created_at'] = solution.created_at.isoformat()
                solution_dict['updated_at'] = solution.updated_at.isoformat()
                solution_dict['task_type'] = solution.task_type.value
                data[task_id] = solution_dict
            
            with open(self.solutions_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving solutions: {e}")
            return False
    
    def _load_executions(self) -> List[TaskExecution]:
        """Load task executions from storage."""
        if not self.executions_file.exists():
            return []
        
        try:
            with open(self.executions_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            executions = []
            for execution_data in data:
                execution_data['status'] = ExecutionStatus(execution_data['status'])
                execution_data['timestamp'] = datetime.fromisoformat(execution_data['timestamp'])
                executions.append(TaskExecution(**execution_data))
            
            return executions
            
        except Exception as e:
            logger.error(f"Error loading executions: {e}")
            return []
    
    def _save_executions(self) -> bool:
        """Save task executions to storage."""
        try:
            data = []
            for execution in self.task_executions[-1000:]:  # Keep only last 1000 executions
                execution_dict = asdict(execution)
                execution_dict['status'] = execution.status.value
                execution_dict['timestamp'] = execution.timestamp.isoformat()
                data.append(execution_dict)
            
            with open(self.executions_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving executions: {e}")
            return False
    
    def _load_learning_stats(self) -> Dict[str, Any]:
        """Load learning statistics."""
        if not self.learning_stats_file.exists():
            return {
                'total_tasks_learned': 0,
                'total_executions': 0,
                'success_rate': 0.0,
                'learning_efficiency': 0.0,
                'last_updated': datetime.now().isoformat()
            }
        
        try:
            with open(self.learning_stats_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading learning stats: {e}")
            return {}
    
    def _save_learning_stats(self) -> bool:
        """Save learning statistics."""
        try:
            self.learning_stats['last_updated'] = datetime.now().isoformat()
            
            with open(self.learning_stats_file, 'w', encoding='utf-8') as f:
                json.dump(self.learning_stats, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            logger.error(f"Error saving learning stats: {e}")
            return False
    
    def _generate_task_id(self, task_description: str, task_type: TaskType) -> str:
        """Generate a unique task ID."""
        content = f"{task_type.value}:{task_description.lower().strip()}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _generate_solution_code(self, task_type: TaskType, task_description: str, params: Dict) -> str:
        """Generate initial solution code for a task."""
        if task_type == TaskType.APPLICATION_LAUNCH:
            app_name = params.get('extracted_groups', [''])[0] if params.get('extracted_groups') else ''
            
            # Extract app name from task description if not in params
            if not app_name:
                import re
                match = re.search(r'open\s+(\w+)|launch\s+(\w+)|start\s+(\w+)', task_description.lower())
                if match:
                    app_name = match.group(1) or match.group(2) or match.group(3)
            
            if app_name.lower() in ['notepad']:
                return '''
try:
    # Try to launch Notepad using Windows command
    subprocess.run(["notepad.exe"], check=True)
    print("Notepad opened successfully!")
except:
    try:
        # Alternative method using start command
        subprocess.run(["start", "notepad"], shell=True, check=True)
        print("Notepad opened using start command!")
    except Exception as e:
        print(f"Failed to open Notepad: {e}")
'''
            elif app_name.lower() in ['whatsapp', 'whats app']:
                return '''
# Try multiple common paths for WhatsApp
whatsapp_paths = [
    r"C:\\Users\\{username}\\AppData\\Local\\WhatsApp\\WhatsApp.exe",
    r"C:\\Program Files\\WhatsApp\\WhatsApp.exe",
    r"C:\\Program Files (x86)\\WhatsApp\\WhatsApp.exe"
]

username = os.getenv('USERNAME')
for path in whatsapp_paths:
    full_path = path.format(username=username)
    if os.path.exists(full_path):
        subprocess.Popen([full_path])
        print(f"WhatsApp launched from: {full_path}")
        break
else:
    # Try using start command
    subprocess.run(["start", "whatsapp:"], shell=True)
    print("WhatsApp launched using protocol handler")
'''
            elif app_name.lower() in ['spotify']:
                return '''
# Try multiple common paths for Spotify
spotify_paths = [
    r"C:\\Users\\{username}\\AppData\\Roaming\\Spotify\\Spotify.exe",
    r"C:\\Program Files\\Spotify\\Spotify.exe",
    r"C:\\Program Files (x86)\\Spotify\\Spotify.exe"
]

username = os.getenv('USERNAME')
for path in spotify_paths:
    full_path = path.format(username=username)
    if os.path.exists(full_path):
        subprocess.Popen([full_path])
        print(f"Spotify launched from: {full_path}")
        break
else:
    # Try using start command
    subprocess.run(["start", "spotify:"], shell=True)
    print("Spotify launched using protocol handler")
'''
            elif app_name.lower() in ['chrome', 'google chrome']:
                return '''
try:
    # Try to launch Chrome
    chrome_paths = [
        r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        r"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    ]
    
    for path in chrome_paths:
        if os.path.exists(path):
            subprocess.Popen([path])
            print(f"Chrome launched from: {path}")
            break
    else:
        # Try using start command
        subprocess.run(["start", "chrome"], shell=True)
        print("Chrome launched using start command")
except Exception as e:
    print(f"Failed to launch Chrome: {e}")
'''
            else:
                return f'''
# Generic application launcher
try:
    # Try direct execution first
    subprocess.run(["{app_name}.exe"], check=True)
    print(f"{app_name} launched successfully!")
except:
    try:
        # Try using start command
        subprocess.run(["start", "{app_name}"], shell=True, check=True)
        print(f"{app_name} launched using start command!")
    except Exception as e:
        print(f"Failed to launch {app_name}: {{e}}")
'''
        
        elif task_type == TaskType.CALCULATION:
            return '''
import re
import math

# Extract mathematical expression from input
expression = input_text.lower()
# Simple calculator logic here
print("Calculation result would be computed here")
'''
        
        elif task_type == TaskType.WEB_SEARCH:
            return '''
import webbrowser

# Open web search
search_query = input_text.replace("search for", "").strip()
search_url = f"https://www.google.com/search?q={search_query}"
webbrowser.open(search_url)
print(f"Opened web search for: {search_query}")
'''
        
        else:
            return '''
# Generic task handler
print(f"Handling task: {task_description}")
print("This is a placeholder solution that needs to be implemented")
'''
    
    def find_existing_solution(self, task_description: str, task_type: TaskType) -> Optional[TaskSolution]:
        """Find an existing solution for a task."""
        task_id = self._generate_task_id(task_description, task_type)
        return self.task_solutions.get(task_id)
    
    def learn_new_solution(self, task_description: str, task_type: TaskType, params: Dict) -> TaskSolution:
        """Learn a new solution for a task."""
        task_id = self._generate_task_id(task_description, task_type)
        
        # Generate initial solution code
        solution_code = self._generate_solution_code(task_type, task_description, params)
        
        # Create new solution
        solution = TaskSolution(
            task_id=task_id,
            task_type=task_type,
            task_description=task_description,
            solution_code=solution_code,
            success_rate=0.0,
            execution_count=0,
            last_used=datetime.now(),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata=params,
            user_feedback=[],
            performance_metrics={}
        )
        
        self.task_solutions[task_id] = solution
        self.session_stats['new_solutions_learned'] += 1
        
        logger.info(f"Learned new solution for task: {task_description}")
        return solution
    
    def execute_task(self, user_input: str) -> Tuple[bool, str, Optional[TaskSolution]]:
        """Execute a task based on user input."""
        self.session_stats['tasks_attempted'] += 1
        
        # Recognize the task
        task_type, task_description, params = self.task_recognizer.recognize_task(user_input)
        
        # Check for existing solution
        existing_solution = self.find_existing_solution(task_description, task_type)
        
        if existing_solution:
            logger.info(f"Found existing solution for: {task_description}")
            success, output, error = self._execute_solution(existing_solution, user_input)
            
            if success:
                self._update_solution_success(existing_solution)
                self.session_stats['tasks_successful'] += 1
                return True, output or "Task completed successfully", existing_solution
            else:
                # Try to improve the solution
                improved_solution = self._improve_solution(existing_solution, error, user_input)
                if improved_solution:
                    success, output, error = self._execute_solution(improved_solution, user_input)
                    if success:
                        self.session_stats['tasks_successful'] += 1
                        self.session_stats['solutions_improved'] += 1
                        return True, output or "Task completed with improved solution", improved_solution
                
                return False, f"Task failed: {error}", existing_solution
        else:
            # Learn new solution
            logger.info(f"Learning new solution for: {task_description}")
            new_solution = self.learn_new_solution(task_description, task_type, params)
            
            success, output, error = self._execute_solution(new_solution, user_input)
            
            if success:
                self._update_solution_success(new_solution)
                self.session_stats['tasks_successful'] += 1
                return True, output or "Task completed with new solution", new_solution
            else:
                return False, f"Failed to execute new solution: {error}", new_solution
    
    def _execute_solution(self, solution: TaskSolution, user_input: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Execute a solution and record the execution."""
        execution_id = str(uuid.uuid4())[:8]
        start_time = time.time()
        
        try:
            # Prepare execution environment
            execution_globals = {
                'input_text': user_input,
                'task_description': solution.task_description,
                'task_type': solution.task_type.value
            }
            
            # Execute the solution code
            status, output, error = self.code_executor.execute_code(solution.solution_code)
            
            execution_time = time.time() - start_time
            
            # Record execution
            execution = TaskExecution(
                execution_id=execution_id,
                task_id=solution.task_id,
                status=status,
                execution_time=execution_time,
                error_message=error,
                output=output,
                timestamp=datetime.now(),
                user_feedback=None
            )
            
            self.task_executions.append(execution)
            solution.execution_count += 1
            solution.last_used = datetime.now()
            
            # Update performance metrics
            if 'avg_execution_time' not in solution.performance_metrics:
                solution.performance_metrics['avg_execution_time'] = execution_time
            else:
                # Running average
                current_avg = solution.performance_metrics['avg_execution_time']
                solution.performance_metrics['avg_execution_time'] = (
                    (current_avg * (solution.execution_count - 1) + execution_time) / solution.execution_count
                )
            
            success = status == ExecutionStatus.SUCCESS
            return success, output, error
            
        except Exception as e:
            error_msg = f"Execution error: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
    
    def _update_solution_success(self, solution: TaskSolution):
        """Update solution success rate."""
        successful_executions = sum(
            1 for exec in self.task_executions 
            if exec.task_id == solution.task_id and exec.status == ExecutionStatus.SUCCESS
        )
        
        if solution.execution_count > 0:
            solution.success_rate = successful_executions / solution.execution_count
        
        solution.updated_at = datetime.now()
    
    def _improve_solution(self, solution: TaskSolution, error: str, user_input: str) -> Optional[TaskSolution]:
        """Attempt to improve a failed solution."""
        logger.info(f"Attempting to improve solution for: {solution.task_description}")
        
        # Simple improvement strategies
        improved_code = solution.solution_code
        
        # Strategy 1: Add error handling
        if "try:" not in improved_code:
            improved_code = f'''
try:
{improved_code}
except Exception as e:
    print(f"Error occurred: {{e}}")
    # Fallback strategy here
'''
        
        # Strategy 2: Add alternative paths for application launching
        if solution.task_type == TaskType.APPLICATION_LAUNCH and "subprocess.run" in improved_code:
            improved_code += '''

# Alternative launch method
try:
    import os
    os.startfile(app_name)
    print(f"Launched {app_name} using os.startfile")
except:
    print(f"All launch methods failed for {app_name}")
'''
        
        # Create improved solution
        solution.solution_code = improved_code
        solution.updated_at = datetime.now()
        
        return solution
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics."""
        total_executions = len(self.task_executions)
        successful_executions = sum(
            1 for exec in self.task_executions 
            if exec.status == ExecutionStatus.SUCCESS
        )
        
        overall_success_rate = (
            successful_executions / total_executions if total_executions > 0 else 0.0
        )
        
        return {
            'session_stats': self.session_stats,
            'total_solutions': len(self.task_solutions),
            'total_executions': total_executions,
            'overall_success_rate': overall_success_rate,
            'learning_efficiency': self.session_stats['new_solutions_learned'] / max(1, self.session_stats['tasks_attempted']),
            'improvement_rate': self.session_stats['solutions_improved'] / max(1, len(self.task_solutions)),
        }
    
    def save_all_data(self) -> bool:
        """Save all data to storage."""
        try:
            self._save_solutions()
            self._save_executions()
            self._save_learning_stats()
            logger.info("All self-improving AI data saved successfully")
            return True
        except Exception as e:
            logger.error(f"Error saving self-improving AI data: {e}")
            return False
    
    def get_solution_by_id(self, task_id: str) -> Optional[TaskSolution]:
        """Get a solution by its task ID."""
        return self.task_solutions.get(task_id)
    
    def list_learned_tasks(self) -> List[Dict[str, Any]]:
        """List all learned tasks."""
        tasks = []
        for solution in self.task_solutions.values():
            tasks.append({
                'task_id': solution.task_id,
                'description': solution.task_description,
                'type': solution.task_type.value,
                'success_rate': solution.success_rate,
                'execution_count': solution.execution_count,
                'last_used': solution.last_used.isoformat(),
                'created_at': solution.created_at.isoformat()
            })
        
        # Sort by last used (most recent first)
        tasks.sort(key=lambda x: x['last_used'], reverse=True)
        return tasks
    
    def forget_task(self, task_id: str) -> bool:
        """Remove a learned task solution."""
        if task_id in self.task_solutions:
            del self.task_solutions[task_id]
            logger.info(f"Forgot task solution: {task_id}")
            return True
        return False
    
    def add_user_feedback(self, task_id: str, feedback: str, rating: int) -> bool:
        """Add user feedback for a task solution."""
        if task_id in self.task_solutions:
            feedback_entry = {
                'feedback': feedback,
                'rating': rating,
                'timestamp': datetime.now().isoformat()
            }
            self.task_solutions[task_id].user_feedback.append(feedback_entry)
            return True
        return False

# Integration function for existing AI system
def integrate_with_existing_ai(ai_instance, self_improving_ai: SelfImprovingAI):
    """Integrate self-improving AI with existing AI system."""
    
    # Store original get_response method
    original_get_response = ai_instance.get_response
    
    async def enhanced_get_response(messages, stream_to_terminal=True, use_internet_search=False):
        """Enhanced get_response with self-improving capabilities."""
        
        # Get the latest user message
        user_message = messages[-1]['content'] if messages else ""
        
        # Check if this looks like a task that can be automated
        task_keywords = ['open', 'launch', 'start', 'run', 'calculate', 'search for']
        is_task = any(keyword in user_message.lower() for keyword in task_keywords)
        
        if is_task:
            try:
                # Try to execute with self-improving AI
                success, output, solution = self_improving_ai.execute_task(user_message)
                
                if success:
                    # Task was executed successfully
                    response = f"Task completed successfully!\n\n{output}"
                    
                    if solution:
                        if solution.execution_count == 1:
                            response += "\n\nI've learned how to do this task and will remember it for next time!"
                        else:
                            response += f"\n\nI remembered how to do this from {solution.execution_count} previous executions."
                    
                    return response
                else:
                    # Task failed, fall back to normal AI response but mention the attempt
                    normal_response = await original_get_response(messages, stream_to_terminal, use_internet_search)
                    return f"I tried to execute this task automatically but encountered an issue: {output}\n\nLet me help you in another way:\n\n{normal_response}"
                    
            except Exception as e:
                logger.error(f"Self-improving AI error: {e}")
                # Fall back to normal response
                pass
        
        # Use original AI response for non-task messages
        return await original_get_response(messages, stream_to_terminal, use_internet_search)
    
    # Replace the method
    ai_instance.get_response = enhanced_get_response
    
    # Add new methods to the AI instance
    ai_instance.self_improving_ai = self_improving_ai
    ai_instance.get_learning_stats = self_improving_ai.get_performance_stats
    ai_instance.list_learned_tasks = self_improving_ai.list_learned_tasks
    ai_instance.forget_task = self_improving_ai.forget_task
    ai_instance.add_task_feedback = self_improving_ai.add_user_feedback
    
    logger.info("Self-improving AI integrated with existing AI system")

# Example usage and testing
if __name__ == "__main__":
    # Initialize the self-improving AI
    ai = SelfImprovingAI()
    
    # Test tasks
    test_tasks = [
        "Open WhatsApp",
        "Launch Spotify", 
        "Search for Python tutorials",
        "Calculate 15 * 23",
    ]
    
    print("Testing Self-Improving AI System")
    print("=" * 50)
    
    for task in test_tasks:
        print(f"\nTesting: {task}")
        success, output, solution = ai.execute_task(task)
        print(f"Success: {success}")
        print(f"Output: {output}")
        if solution:
            print(f"Solution ID: {solution.task_id}")
            print(f"Execution count: {solution.execution_count}")
    
    # Show performance stats
    print("\nPerformance Statistics:")
    print("=" * 30)
    stats = ai.get_performance_stats()
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    # Show learned tasks
    print("\nLearned Tasks:")
    print("=" * 20)
    for task in ai.list_learned_tasks():
        print(f"- {task['description']} (Success rate: {task['success_rate']:.2%})")
    
    # Save data
    ai.save_all_data()
    print("\nData saved successfully!")