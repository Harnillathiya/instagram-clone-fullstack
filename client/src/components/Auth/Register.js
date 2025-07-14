import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/users/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('token', res.data.token);
      history.push('/chats');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="logo-container">
            <div className="logo-icon">
              <i className="chat-icon">💬</i>
            </div>
            <h1 className="logo-text">InstaChat</h1>
          </div>
          <p className="tagline">Join the conversation today</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username" className="floating-label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-input"
              placeholder=" "
            />
          </div>
          
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
              placeholder=" "
              required
              className="form-input"
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword" className="floating-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
              minLength="6"
              placeholder=" "
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/" className="auth-link">Log In</Link></p>
        </div>

        <div className="auth-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>

      <div className="auth-showcase">
        <div className="features-list">
          <div className="feature-item">
            <div className="feature-icon">📱</div>
            <div className="feature-text">
              <h3>Real-time Messaging</h3>
              <p>Chat instantly with friends and family</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🖼️</div>
            <div className="feature-text">
              <h3>Screenshot & Edit</h3>
              <p>Capture, customize and share your conversations</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🔒</div>
            <div className="feature-text">
              <h3>Secure Messaging</h3>
              <p>Your conversations stay private and secure</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🌐</div>
            <div className="feature-text">
              <h3>Connect Anywhere</h3>
              <p>Stay in touch on any device, anywhere</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;