import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const [isLogIn, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const viewLogin = (status) => {
    setError(null);
    setIsLogin(status);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
    }

    const url = isLogIn ? '/login' : '/register';
    const data = isLogIn
      ? { username, password }
      : { username, email, password, confirmPassword };

    try {
      const response = await fetch(`http://localhost:5000${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      if (isLogIn) {
        console.log('Login successful:', result.token);
        localStorage.setItem('token', result.token);
        navigate('/home'); 
      } else {
        console.log('Registration successful:', result);
        setIsLogin(true);  
        navigate('/'); 
      }
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <form onSubmit={handleSubmit} className="welcome-form">
          <h2 className="welcome-heading">{isLogIn ? 'Login' : 'Register'}</h2>
          {!isLogIn && (
            <input
              type="email"
              className="input-field"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
          <input
            type="text"
            className="input-field"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!isLogIn && (
            <input
              type="password"
              className="input-field"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}
          <button type="submit" className="submit-button">
            {isLogIn ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="welcome-options">
          <button
            className="toggle-button"
            onClick={() => viewLogin(false)}
          >
            Create an account
          </button>
          <button
            className="toggle-button"
            onClick={() => viewLogin(true)}
          >
            Have an account?
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Welcome;
