// src/Dashboard.jsx

import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  
  // State for the form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // --- NEW STATE: To track which task we are editing ---
  const [editingTaskId, setEditingTaskId] = useState(null); // null means we are creating, not editing

  const token = localStorage.getItem('token');

  const fetchTasks = async () => { /* ... (this function remains the same) ... */ 
    if (!token) { setError('You are not logged in.'); return; }
    try {
      const response = await fetch('http://localhost:5000/api/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) { setError(err.message); }
  };

  useEffect(() => { fetchTasks(); }, []);

  // --- NEW FUNCTION: To handle starting an edit ---
  const handleEditClick = (task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
  };

  // --- NEW FUNCTION: To cancel an edit ---
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
  };

  // --- MODIFIED: This form now handles BOTH create and update ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setError('Title is required.');
      return;
    }

    const url = editingTaskId
      ? `http://localhost:5000/api/tasks/${editingTaskId}` // UPDATE URL
      : 'http://localhost:5000/api/tasks';              // CREATE URL

    const method = editingTaskId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) throw new Error(`Failed to ${editingTaskId ? 'update' : 'create'} task`);
      
      handleCancelEdit(); // Reset form state
      fetchTasks();     // Refresh list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => { /* ... (this function remains the same) ... */ 
     try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      fetchTasks();
    } catch (err) { setError(err.message); }
  };

  const handleDeleteTask = async (taskId) => { /* ... (this function remains the same) ... */ 
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}`},
        });
        if (!response.ok) throw new Error('Failed to delete task');
        fetchTasks();
      } catch (err) { setError(err.message); }
    }
  };
  
  const handleLogout = () => { /* ... (this function remains the same) ... */ 
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header"><h2>Dashboard</h2><button onClick={handleLogout}>Logout</button></div>
      <hr />

      {/* --- MODIFIED: The form's title and submit button text now change based on mode --- */}
      <h3>{editingTaskId ? 'Edit Task' : 'Create New Task'}</h3>
      <form onSubmit={handleFormSubmit}>
        <div><input type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><textarea placeholder="Task Description" value={description} onChange={(e) => setDescription(e.target.value)}></textarea></div>
        <button type="submit">{editingTaskId ? 'Update Task' : 'Add Task'}</button>
        {editingTaskId && <button type="button" onClick={handleCancelEdit} style={{backgroundColor: '#6c757d', marginTop: '10px'}}>Cancel Edit</button>}
      </form>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <hr />

      <h3>Your Tasks</h3>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-item">
            <h4>{task.title} <span style={{fontSize: '0.8em', color: '#666'}}>({task.status})</span></h4>
            <p>{task.description || 'No description'}</p>
            <div className="actions">
              {/* --- NEW EDIT BUTTON --- */}
              <button onClick={() => handleEditClick(task)} style={{backgroundColor: '#ffc107'}}>Edit</button>

              {task.status !== 'DONE' && (<button onClick={() => handleUpdateStatus(task.id, 'DONE')} className="update">Mark as Done</button>)}
              <button onClick={() => handleDeleteTask(task.id)} className="delete">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;