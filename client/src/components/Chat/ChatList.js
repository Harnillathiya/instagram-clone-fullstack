import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import './ChatList.css';

function ChatList() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const history = useHistory();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      history.push('/');
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
        localStorage.removeItem('token');
        history.push('/');
      }
    };

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        setLoading(false);
      }
    };

    fetchCurrentUser();
    fetchUsers();
  }, [history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/');
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <div className="user-profile">
          {currentUser && (
            <>
              <div className="avatar">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="username">{currentUser.username}</span>
            </>
          )}
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="users-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <Link 
              to={`/chat/${user._id}`} 
              key={user._id} 
              className="user-item"
            >
              <div className="user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h3 className="user-name">{user.username}</h3>
                <p className="user-status">
                  {user.online ? 'Online' : 'Offline'}
                </p>
              </div>
              {user.unreadCount > 0 && (
                <div className="unread-badge">{user.unreadCount}</div>
              )}
            </Link>
          ))
        ) : (
          <div className="no-results">
            {searchTerm ? 'No users found matching your search' : 'No users available'}
          </div>
        )}
      </div>

      <div className="chat-list-footer">
        <div className="app-info">
          <div className="logo-container">
            <div className="logo-icon">
              <i className="chat-icon">💬</i>
            </div>
            <h1 className="logo-text">InstaChat</h1>
          </div>
          <p className="app-version">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

export default ChatList;