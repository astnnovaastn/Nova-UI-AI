"""
Nova AI Task Management System
Comprehensive task management with scheduling, natural language processing, and memory integration
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass, asdict
import pytz
import re
import threading
import time
from pathlib import Path

# Configure logging
logger = logging.getLogger("NovaAI.TaskManager")

class TaskStatus(Enum):
    """Task status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"

class TaskPriority(Enum):
    """Task priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class RecurrenceType(Enum):
    """Task recurrence types"""
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

@dataclass
class Task:
    """Task data structure"""
    id: str
    title: str
    description: str
    due_date: datetime
    status: TaskStatus
    priority: TaskPriority = TaskPriority.MEDIUM
    recurrence: RecurrenceType = RecurrenceType.NONE
    created_at: datetime = None
    updated_at: datetime = None
    completed_at: Optional[datetime] = None
    reminder_sent: bool = False
    user_location: str = "Italy"
    tags: List[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(pytz.timezone('Europe/Rome'))
        if self.updated_at is None:
            self.updated_at = self.created_at
        if self.tags is None:
            self.tags = []
        if self.metadata is None:
            self.metadata = {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert task to dictionary for storage"""
        data = asdict(self)
        # Convert datetime objects to ISO strings
        for field in ['due_date', 'created_at', 'updated_at', 'completed_at']:
            if data[field] is not None:
                data[field] = data[field].isoformat()
        # Convert enums to strings
        data['status'] = self.status.value
        data['priority'] = self.priority.value
        data['recurrence'] = self.recurrence.value
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Create task from dictionary"""
        # Convert ISO strings back to datetime objects
        for field in ['due_date', 'created_at', 'updated_at', 'completed_at']:
            if data.get(field):
                data[field] = datetime.fromisoformat(data[field])
        
        # Convert strings back to enums
        data['status'] = TaskStatus(data['status'])
        data['priority'] = TaskPriority(data['priority'])
        data['recurrence'] = RecurrenceType(data['recurrence'])
        
        return cls(**data)

    def is_due(self) -> bool:
        """Check if task is due"""
        now = datetime.now(pytz.timezone('Europe/Rome'))
        return now >= self.due_date and self.status == TaskStatus.PENDING

    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        now = datetime.now(pytz.timezone('Europe/Rome'))
        return now > self.due_date and self.status == TaskStatus.PENDING

    def mark_completed(self):
        """Mark task as completed"""
        self.status = TaskStatus.COMPLETED
        self.completed_at = datetime.now(pytz.timezone('Europe/Rome'))
        self.updated_at = self.completed_at

    def mark_cancelled(self):
        """Mark task as cancelled"""
        self.status = TaskStatus.CANCELLED
        self.updated_at = datetime.now(pytz.timezone('Europe/Rome'))

class TaskManager:
    """Core task management system"""
    
    def __init__(self, memory_system=None):
        self.memory_system = memory_system
        self.tasks: Dict[str, Task] = {}
        self.scheduler_running = False
        self.scheduler_thread = None
        self.italy_tz = pytz.timezone('Europe/Rome')

        # Load existing tasks from memory
        self._load_tasks_from_memory()

    def _get_memory_data_and_system(self):
        """Helper method to get memory data and system objects, handling different memory system types"""
        if not self.memory_system:
            return None, None

        # Handle both NovaMemoryIntegration and NovaMemoryInterface
        if hasattr(self.memory_system, 'memory_system'):
            # NovaMemoryIntegration -> NovaMemoryInterface -> NovaMemoryAI
            memory_data = self.memory_system.memory_system.memory_system.data
            memory_system = self.memory_system.memory_system.memory_system
        else:
            # Direct NovaMemoryInterface -> NovaMemoryAI
            memory_data = self.memory_system.memory_system.data
            memory_system = self.memory_system.memory_system

        return memory_data, memory_system
        
        # Start the task scheduler
        self.start_scheduler()

    def _load_tasks_from_memory(self):
        """Load tasks from memory system"""
        if not self.memory_system:
            return

        try:
            # Get tasks from the TASK_PROJECT_TRACKING category
            memory_data, memory_system = self._get_memory_data_and_system()
            if not memory_data:
                return

            task_data = memory_data["memory_categories"].get("task_project_tracking", {})

            # Look for tasks in the task management subcategory
            if "task_management" in task_data:
                tasks_info = task_data["task_management"]
                if isinstance(tasks_info, dict) and "tasks" in tasks_info:
                    for task_dict in tasks_info["tasks"]:
                        task = Task.from_dict(task_dict)
                        self.tasks[task.id] = task
                    logger.info(f"Loaded {len(self.tasks)} tasks from memory")
        except Exception as e:
            logger.error(f"Error loading tasks from memory: {e}")

    def _save_tasks_to_memory(self):
        """Save tasks to memory system"""
        if not self.memory_system:
            return

        try:
            task_list = [task.to_dict() for task in self.tasks.values()]
            task_data = {
                "tasks": task_list,
                "last_updated": datetime.now(self.italy_tz).isoformat(),
                "total_tasks": len(task_list),
                "statistics": self.get_task_statistics()
            }

            # Store in the TASK_PROJECT_TRACKING category
            memory_data, memory_system = self._get_memory_data_and_system()
            if not memory_data:
                return

            current_data = memory_data["memory_categories"].get("task_project_tracking", {})
            current_data["task_management"] = task_data
            memory_data["memory_categories"]["task_project_tracking"] = current_data

            # Save the memory system
            memory_system.save_memory()
            logger.debug(f"Saved {len(task_list)} tasks to memory")
        except Exception as e:
            logger.error(f"Error saving tasks to memory: {e}")

    def create_task(self, title: str, description: str, due_date: datetime, 
                   priority: TaskPriority = TaskPriority.MEDIUM,
                   recurrence: RecurrenceType = RecurrenceType.NONE,
                   tags: List[str] = None) -> Task:
        """Create a new task"""
        import uuid
        
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            title=title,
            description=description,
            due_date=due_date,
            status=TaskStatus.PENDING,
            priority=priority,
            recurrence=recurrence,
            tags=tags or []
        )
        
        self.tasks[task_id] = task
        self._save_tasks_to_memory()
        
        logger.info(f"Created task: {title} (due: {due_date})")
        return task

    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a task by ID"""
        return self.tasks.get(task_id)

    def get_all_tasks(self) -> List[Task]:
        """Get all tasks"""
        return list(self.tasks.values())

    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        """Get tasks by status"""
        return [task for task in self.tasks.values() if task.status == status]

    def get_due_tasks(self) -> List[Task]:
        """Get tasks that are due"""
        return [task for task in self.tasks.values() if task.is_due()]

    def get_overdue_tasks(self) -> List[Task]:
        """Get overdue tasks"""
        return [task for task in self.tasks.values() if task.is_overdue()]

    def update_task(self, task_id: str, **kwargs) -> bool:
        """Update a task"""
        task = self.tasks.get(task_id)
        if not task:
            return False
            
        for key, value in kwargs.items():
            if hasattr(task, key):
                setattr(task, key, value)
        
        task.updated_at = datetime.now(self.italy_tz)
        self._save_tasks_to_memory()
        return True

    def complete_task(self, task_id: str) -> bool:
        """Mark a task as completed"""
        task = self.tasks.get(task_id)
        if not task:
            return False
            
        task.mark_completed()
        self._save_tasks_to_memory()
        
        # Handle recurring tasks
        if task.recurrence != RecurrenceType.NONE:
            self._create_recurring_task(task)
            
        logger.info(f"Completed task: {task.title}")
        return True

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a task"""
        task = self.tasks.get(task_id)
        if not task:
            return False
            
        task.mark_cancelled()
        self._save_tasks_to_memory()
        
        logger.info(f"Cancelled task: {task.title}")
        return True

    def delete_task(self, task_id: str) -> bool:
        """Delete a task"""
        if task_id in self.tasks:
            task = self.tasks[task_id]
            del self.tasks[task_id]
            self._save_tasks_to_memory()
            logger.info(f"Deleted task: {task.title}")
            return True
        return False

    def _create_recurring_task(self, completed_task: Task):
        """Create next occurrence of a recurring task"""
        if completed_task.recurrence == RecurrenceType.NONE:
            return
            
        # Calculate next due date
        next_due = completed_task.due_date
        if completed_task.recurrence == RecurrenceType.DAILY:
            next_due += timedelta(days=1)
        elif completed_task.recurrence == RecurrenceType.WEEKLY:
            next_due += timedelta(weeks=1)
        elif completed_task.recurrence == RecurrenceType.MONTHLY:
            next_due += timedelta(days=30)  # Approximate
        elif completed_task.recurrence == RecurrenceType.YEARLY:
            next_due += timedelta(days=365)  # Approximate
            
        # Create new task
        self.create_task(
            title=completed_task.title,
            description=completed_task.description,
            due_date=next_due,
            priority=completed_task.priority,
            recurrence=completed_task.recurrence,
            tags=completed_task.tags
        )

    def start_scheduler(self):
        """Start the task scheduler"""
        if self.scheduler_running:
            return
            
        self.scheduler_running = True
        self.scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self.scheduler_thread.start()
        logger.info("Task scheduler started")

    def stop_scheduler(self):
        """Stop the task scheduler"""
        self.scheduler_running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        logger.info("Task scheduler stopped")

    def _scheduler_loop(self):
        """Main scheduler loop"""
        while self.scheduler_running:
            try:
                self._check_due_tasks()
                self._update_overdue_tasks()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                time.sleep(60)

    def _check_due_tasks(self):
        """Check for due tasks and trigger reminders"""
        due_tasks = self.get_due_tasks()
        for task in due_tasks:
            if not task.reminder_sent:
                self._trigger_task_reminder(task)
                task.reminder_sent = True
                self._save_tasks_to_memory()

    def _update_overdue_tasks(self):
        """Update status of overdue tasks"""
        for task in self.tasks.values():
            if task.is_overdue() and task.status == TaskStatus.PENDING:
                task.status = TaskStatus.OVERDUE
                self._save_tasks_to_memory()

    def _trigger_task_reminder(self, task: Task):
        """Trigger a task reminder through Nova AI's messaging system"""
        logger.info(f"Task reminder triggered: {task.title}")

        try:
            # Create a reminder message
            due_str = task.due_date.strftime("%A, %B %d at %I:%M %p")
            priority_str = f" (Priority: {task.priority.value.title()})" if task.priority != TaskPriority.MEDIUM else ""

            reminder_message = f"⏰ **Task Reminder**\n\n📋 **{task.title}**\n\n"
            if task.description:
                reminder_message += f"📝 {task.description}\n\n"
            reminder_message += f"⏰ Due: {due_str}{priority_str}\n\n"
            reminder_message += "Would you like to mark this task as completed, or do you need more time?"

            # Store the reminder in memory for Nova AI to pick up
            if self.memory_system:
                reminder_data = {
                    "type": "task_reminder",
                    "task_id": task.id,
                    "task_title": task.title,
                    "task_description": task.description,
                    "due_date": task.due_date.isoformat(),
                    "priority": task.priority.value,
                    "reminder_message": reminder_message,
                    "timestamp": datetime.now(self.italy_tz).isoformat(),
                    "status": "pending"
                }

                # Store in task project tracking category
                memory_data, memory_system = self._get_memory_data_and_system()
                if not memory_data:
                    return

                current_data = memory_data["memory_categories"].get("task_project_tracking", {})
                if "pending_reminders" not in current_data:
                    current_data["pending_reminders"] = []

                current_data["pending_reminders"].append(reminder_data)

                # Keep only last 50 pending reminders
                if len(current_data["pending_reminders"]) > 50:
                    current_data["pending_reminders"] = current_data["pending_reminders"][-50:]

                memory_data["memory_categories"]["task_project_tracking"] = current_data
                memory_system.save_memory()

                logger.info(f"Task reminder stored in memory: {task.title}")

        except Exception as e:
            logger.error(f"Error triggering task reminder: {e}")

    def get_pending_reminders(self) -> List[Dict[str, Any]]:
        """Get pending task reminders"""
        try:
            if not self.memory_system:
                return []

            memory_data, memory_system = self._get_memory_data_and_system()
            if not memory_data:
                return []

            current_data = memory_data["memory_categories"].get("task_project_tracking", {})
            pending_reminders = current_data.get("pending_reminders", [])

            # Filter for pending reminders only
            return [r for r in pending_reminders if r.get("status") == "pending"]

        except Exception as e:
            logger.error(f"Error getting pending reminders: {e}")
            return []

    def mark_reminder_sent(self, task_id: str):
        """Mark a reminder as sent"""
        try:
            if not self.memory_system:
                return

            memory_data, memory_system = self._get_memory_data_and_system()
            if not memory_data:
                return

            current_data = memory_data["memory_categories"].get("task_project_tracking", {})
            pending_reminders = current_data.get("pending_reminders", [])

            # Update the reminder status
            for reminder in pending_reminders:
                if reminder.get("task_id") == task_id:
                    reminder["status"] = "sent"
                    reminder["sent_at"] = datetime.now(self.italy_tz).isoformat()
                    break

            current_data["pending_reminders"] = pending_reminders
            memory_data["memory_categories"]["task_project_tracking"] = current_data
            memory_system.save_memory()

        except Exception as e:
            logger.error(f"Error marking reminder as sent: {e}")

    def get_task_statistics(self) -> Dict[str, Any]:
        """Get task statistics"""
        total_tasks = len(self.tasks)
        completed_tasks = len(self.get_tasks_by_status(TaskStatus.COMPLETED))
        pending_tasks = len(self.get_tasks_by_status(TaskStatus.PENDING))
        overdue_tasks = len(self.get_overdue_tasks())
        
        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "overdue_tasks": overdue_tasks,
            "completion_rate": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        }


class TaskNLPProcessor:
    """Natural Language Processing for task creation and management"""

    def __init__(self, task_manager: TaskManager):
        self.task_manager = task_manager
        self.italy_tz = pytz.timezone('Europe/Rome')

        # Task creation patterns
        self.task_patterns = [
            # Remind me patterns
            r"remind me to (.+?) (?:at|on|by) (.+)",
            r"remind me (.+?) (?:at|on|by) (.+)",
            r"set a reminder (?:to|for) (.+?) (?:at|on|by) (.+)",

            # Task creation patterns
            r"create a task (?:to|for) (.+?) (?:due|by) (.+)",
            r"add task (.+?) (?:due|by) (.+)",
            r"schedule (.+?) (?:for|at|on) (.+)",

            # Direct action patterns
            r"(.+?) (?:tomorrow|today|next week|next month) (?:at|by) (.+)",
            r"(.+?) (?:on|at) (.+)",
        ]

        # Time parsing patterns
        self.time_patterns = {
            'tomorrow': lambda: datetime.now(self.italy_tz) + timedelta(days=1),
            'today': lambda: datetime.now(self.italy_tz),
            'next week': lambda: datetime.now(self.italy_tz) + timedelta(weeks=1),
            'next month': lambda: datetime.now(self.italy_tz) + timedelta(days=30),
            'monday': lambda: self._get_next_weekday(0),
            'tuesday': lambda: self._get_next_weekday(1),
            'wednesday': lambda: self._get_next_weekday(2),
            'thursday': lambda: self._get_next_weekday(3),
            'friday': lambda: self._get_next_weekday(4),
            'saturday': lambda: self._get_next_weekday(5),
            'sunday': lambda: self._get_next_weekday(6),
        }

        # Priority keywords
        self.priority_keywords = {
            'urgent': TaskPriority.URGENT,
            'high': TaskPriority.HIGH,
            'important': TaskPriority.HIGH,
            'medium': TaskPriority.MEDIUM,
            'low': TaskPriority.LOW,
        }

    def parse_task_from_message(self, message: str) -> Optional[Dict[str, Any]]:
        """Parse a task from natural language message"""
        message_lower = message.lower().strip()

        # Check if this is a task-related message
        if not self._is_task_message(message_lower):
            return None

        # Try to extract task information
        for pattern in self.task_patterns:
            match = re.search(pattern, message_lower, re.IGNORECASE)
            if match:
                try:
                    task_description = match.group(1).strip()
                    time_str = match.group(2).strip()

                    # Parse the due date/time
                    due_date = self._parse_datetime(time_str)
                    if not due_date:
                        continue

                    # Extract priority if mentioned
                    priority = self._extract_priority(message_lower)

                    # Extract tags
                    tags = self._extract_tags(message_lower)

                    return {
                        'title': self._clean_task_title(task_description),
                        'description': task_description,
                        'due_date': due_date,
                        'priority': priority,
                        'tags': tags
                    }
                except Exception as e:
                    logger.debug(f"Error parsing task pattern: {e}")
                    continue

        return None

    def _is_task_message(self, message: str) -> bool:
        """Check if message contains task-related keywords"""
        task_keywords = [
            'remind me', 'reminder', 'task', 'schedule', 'appointment',
            'meeting', 'deadline', 'due', 'tomorrow', 'today', 'next week',
            'next month', 'at', 'on', 'by', 'create task', 'add task'
        ]

        return any(keyword in message for keyword in task_keywords)

    def _parse_datetime(self, time_str: str) -> Optional[datetime]:
        """Parse datetime from natural language"""
        time_str = time_str.lower().strip()

        # Handle relative time expressions
        for pattern, func in self.time_patterns.items():
            if pattern in time_str:
                base_date = func()

                # Try to extract specific time
                time_match = re.search(r'(\d{1,2}):?(\d{2})?\s*(am|pm)?', time_str)
                if time_match:
                    hour = int(time_match.group(1))
                    minute = int(time_match.group(2)) if time_match.group(2) else 0
                    am_pm = time_match.group(3)

                    if am_pm == 'pm' and hour != 12:
                        hour += 12
                    elif am_pm == 'am' and hour == 12:
                        hour = 0

                    return base_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                else:
                    # Default to 9 AM if no specific time
                    return base_date.replace(hour=9, minute=0, second=0, microsecond=0)

        # Try to parse specific dates
        try:
            # Handle formats like "March 15th", "15/03", "2024-03-15"
            date_patterns = [
                r'(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?',  # March 15th
                r'(\d{1,2})/(\d{1,2})',                # 15/03
                r'(\d{4})-(\d{1,2})-(\d{1,2})',       # 2024-03-15
            ]

            for pattern in date_patterns:
                match = re.search(pattern, time_str)
                if match:
                    # This is a simplified parser - could be enhanced
                    now = datetime.now(self.italy_tz)
                    return now.replace(hour=9, minute=0, second=0, microsecond=0)

        except Exception as e:
            logger.debug(f"Error parsing datetime: {e}")

        return None

    def _get_next_weekday(self, weekday: int) -> datetime:
        """Get next occurrence of a weekday (0=Monday, 6=Sunday)"""
        now = datetime.now(self.italy_tz)
        days_ahead = weekday - now.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        return now + timedelta(days=days_ahead)

    def _extract_priority(self, message: str) -> TaskPriority:
        """Extract priority from message"""
        for keyword, priority in self.priority_keywords.items():
            if keyword in message:
                return priority
        return TaskPriority.MEDIUM

    def _extract_tags(self, message: str) -> List[str]:
        """Extract tags from message"""
        tags = []

        # Common task categories
        if any(word in message for word in ['work', 'office', 'meeting', 'project']):
            tags.append('work')
        if any(word in message for word in ['personal', 'home', 'family']):
            tags.append('personal')
        if any(word in message for word in ['study', 'learn', 'exam', 'course']):
            tags.append('study')
        if any(word in message for word in ['health', 'doctor', 'exercise', 'gym']):
            tags.append('health')

        return tags

    def _clean_task_title(self, description: str) -> str:
        """Clean and format task title"""
        # Remove common prefixes
        prefixes = ['to ', 'that i ', 'i need to ', 'i should ']
        title = description.lower()

        for prefix in prefixes:
            if title.startswith(prefix):
                title = title[len(prefix):]
                break

        # Capitalize first letter
        return title.capitalize() if title else description

    def create_task_from_message(self, message: str) -> Optional[Task]:
        """Create a task from natural language message"""
        task_info = self.parse_task_from_message(message)
        if not task_info:
            return None

        try:
            task = self.task_manager.create_task(
                title=task_info['title'],
                description=task_info['description'],
                due_date=task_info['due_date'],
                priority=task_info['priority'],
                tags=task_info['tags']
            )

            logger.info(f"Created task from NLP: {task.title}")
            return task

        except Exception as e:
            logger.error(f"Error creating task from message: {e}")
            return None

    def get_task_confirmation_message(self, task: Task) -> str:
        """Generate confirmation message for created task"""
        due_str = task.due_date.strftime("%A, %B %d at %I:%M %p")
        priority_str = f" (Priority: {task.priority.value.title()})" if task.priority != TaskPriority.MEDIUM else ""

        return f"✅ Task created: '{task.title}' due {due_str}{priority_str}"
