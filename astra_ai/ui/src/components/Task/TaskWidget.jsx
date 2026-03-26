import React, { useState, useEffect } from 'react';
import './TaskWidget.css';

const TaskWidget = ({ onClose }) => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('astraTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    localStorage.setItem('astraTasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (inputValue.trim()) {
      const newTask = {
        id: Date.now(),
        text: inputValue,
        completed: false,
        createdAt: new Date().toLocaleDateString(),
        priority: 'normal'
      };
      setTasks([...tasks, newTask]);
      setInputValue('');
    }
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const setPriority = (id, priority) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, priority } : task
    ));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="task-widget">
      <div className="task-header">
        <div className="task-logo">
          <i className="fas fa-check-square"></i>
        </div>
        <div>
          <h3 className="task-title">Tasks</h3>
          <p className="task-brand">Task Manager</p>
        </div>
        <div className="task-status">
          <div className="status-indicator active"></div>
        </div>
      </div>

      <div className="task-content">
        <div className="task-tabs">
          <button 
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button 
            className={`tab-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </button>
          <button 
            className={`tab-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Done ({completedCount})
          </button>
        </div>

        <div className="task-input-area">
          <input
            type="text"
            className="task-input"
            placeholder="Add a new task..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button className="add-task-btn" onClick={addTask}>
            <i className="fas fa-plus"></i>
          </button>
        </div>

        <div className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="task-empty">
              <i className="fas fa-inbox"></i>
              <p>No tasks {filter !== 'all' ? `(${filter})` : ''}</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <div className="task-content-item">
                  <p className="task-text">{task.text}</p>
                  <span className="task-date">{task.createdAt}</span>
                </div>
                <select
                  className={`task-priority ${task.priority}`}
                  value={task.priority}
                  onChange={(e) => setPriority(task.id, e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
                <button 
                  className="task-delete-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="task-stats">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{tasks.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{completedCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Progress</span>
            <span className="stat-value">{tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskWidget;
