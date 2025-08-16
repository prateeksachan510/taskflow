// src/App.jsx

import React, { useState, useEffect } from 'react';
import Register from './Register';
import Login from './Login';
import Dashboard from './Dashboard'; // Import the Dashboard
import './App.css';

function App() {
  const [token, setToken] = useState(null);

  // This effect runs when the component first loads
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // A simple way to handle login without prop drilling for now
  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  // The view changes based on whether a token exists
  return (
    <div className="App">
      {/* Changed header to a more generic div to avoid semantic confusion */}
      <div className="App-header">
        <h1>Welcome to TaskFlow</h1>
        {token ? (
          <Dashboard />
        ) : (
          // This div now uses a CSS class instead of inline styles
          <div className="auth-forms">
            <Register />
            <Login onLogin={handleLogin} /> 
          </div>
        )}
      </div>
    </div>
  );
}

export default App;