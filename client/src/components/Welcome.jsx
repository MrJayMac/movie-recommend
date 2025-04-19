import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const [isLogIn, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home');
    }
  }, [navigate]);

  const viewLogin = (status) => {
    setError(null);
    setIsLogin(status);
    // Reset form fields when switching between login and register
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFormSubmitted(true);

    if (isLogIn) {
      if (!username || !password) {
        return setError('Username and password are required.');
      }
    } else {
      if (!username || !email || !password || !confirmPassword) {
        return setError('All fields are required.');
      }
      if (password !== confirmPassword) {
        return setError('Passwords do not match.');
      }
      if (password.length < 6) {
        return setError('Password must be at least 6 characters.');
      }
    }

    const url = isLogIn ? '/login' : '/register';
    const data = isLogIn
      ? { username, password }
      : { username, email, password };

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      if (isLogIn) {
        localStorage.setItem('token', result.token);
        navigate('/home');
      } else {
        setIsLogin(true);
        setError(null);
        setEmail('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        // Show success message before redirecting
        setError({ success: true, message: 'Registration successful! You can now log in.' });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="page-title">Movie Recommender</h1>
        <div className="welcome-box">
          <div className="welcome-tabs">
            <button 
              className={`tab-button ${isLogIn ? 'active' : ''}`}
              onClick={() => viewLogin(true)}
            >
              Sign In
            </button>
            <button 
              className={`tab-button ${!isLogIn ? 'active' : ''}`}
              onClick={() => viewLogin(false)}
            >
              Register
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="welcome-form">
            <h2 className="welcome-heading">{isLogIn ? 'Welcome Back' : 'Create Account'}</h2>
            
            {!isLogIn && (
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`input-field ${formSubmitted && !email ? 'input-error' : ''}`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className={`input-field ${formSubmitted && !username ? 'input-error' : ''}`}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`input-field ${formSubmitted && !password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {!isLogIn && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={`input-field ${formSubmitted && !confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span>{isLogIn ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                isLogIn ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {error && typeof error === 'string' && (
            <div className="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}
          
          {error && typeof error === 'object' && error.success && (
            <div className="success-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {error.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
