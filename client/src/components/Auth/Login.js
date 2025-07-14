import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/users/login', formData);
      localStorage.setItem('token', res.data.token);
      history.push('/chats');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo-icon">
              <i className="chat-icon">💬</i>
            </div>
            <h1 className="logo-text">InstaChat</h1>
          </div>
          <p className="tagline">Connect with friends through instant messaging</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email" className="floating-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder=" "
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="floating-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              placeholder=" "
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="auth-link">Sign Up</Link></p>
        </div>

        <div className="auth-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>

      <div className="auth-showcase">
        <div className="phone-mockup">
          <div className="phone-screen">
            <div className="chat-preview">
              <div className="chat-message received">Hey there! 👋</div>
              <div className="chat-message received">Welcome to InstaChat!</div>
              <div className="chat-message sent">Thanks! Excited to be here 😊</div>
              <div className="chat-message received">Share photos and chat with friends</div>
              <div className="chat-message sent">This looks amazing!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;