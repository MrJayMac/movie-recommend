import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Recommend from './Recommend';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [movieList, setMovieList] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).id : null;

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/search`, {
        params: { query },
      });

      if (response.data.results) {
        setSuggestions(response.data.results.slice(0, 5).map((movie) => movie.title));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;

    await addMovieToListAndDB(searchQuery);
  };

  const addMovieToListAndDB = async (movieTitle) => {
    try {
      setMovieList([...movieList, movieTitle]);

      await axios.post(`http://localhost:5000/watched`, {
        movie: movieTitle,
        user_id: userId,
      });

      setSuggestions([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding movie to database:', error);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion);
    await addMovieToListAndDB(suggestion);
  };

  const handleDelete = async (movieTitle) => {
    try {
      await axios.delete(`http://localhost:5000/delete`, {
        data: { movie: movieTitle, user_id: userId },
      });

      setMovieList(movieList.filter((movie) => movie !== movieTitle));
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1 className="home-title">Movie Recommender</h1>
        <button className="sign-out-button" onClick={handleSignOut}>Sign Out</button>
      </header>
      
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a movie..."
          onFocus={() => fetchSuggestions(searchQuery)}
        />
        {suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </form>
      
      <div className="movie-list">
        {movieList.map((movie) => (
          <div key={movie} className="movie-item">
            <span className="movie-title">{movie}</span>
            <button className="delete-button" onClick={() => handleDelete(movie)}>Delete</button>
          </div>
        ))}
      </div>

      <Recommend />
    </div>
  );
};

export default Home;
