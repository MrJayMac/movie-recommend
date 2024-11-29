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
        setSuggestions(response.data.results.slice(0, 5).map((movie) => ({
          title: movie.title,
          poster_path: movie.poster_path,
        })));
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
      const response = await axios.get(`http://localhost:5000/search`, {
        params: { query: movieTitle }
      });
      const movie = response.data.results[0]; // Assuming the first result is the correct movie
      const movieWithPoster = {
        title: movie.title,
        poster_path: movie.poster_path
      };

      setMovieList([...movieList, movieWithPoster]);

      await axios.post(`http://localhost:5000/watched`, {
        movie: movie.title,
        user_id: userId,
        poster_path: movie.poster_path,
      });

      setSuggestions([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error adding movie to database:', error);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion.title);
    await addMovieToListAndDB(suggestion.title);
  };

  const handleDelete = async (movieTitle) => {
    try {
      await axios.delete(`http://localhost:5000/delete`, {
        data: { movie: movieTitle, user_id: userId },
      });

      setMovieList(movieList.filter((movie) => movie.title !== movieTitle));
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  };

  const fetchSavedMovies = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/added`, {
        params: { user_id: userId },
      });

      if (response.data) {
        setMovieList(response.data.map(movie => ({
          title: movie.movie,
          poster_path: movie.poster_path
        })));
      }
    } catch (error) {
      console.error('Error fetching saved movies:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSavedMovies();
    }
  }, [userId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="home-container">
      <header className="header">
        <h1 className="title">Movie Recommender</h1>
        <button className="sign-out" onClick={handleSignOut}>Sign Out</button>
      </header>

      <div className="search-section">
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
                  <img
                    src={`https://image.tmdb.org/t/p/w200${suggestion.poster_path}`}
                    alt={suggestion.title}
                    className="suggestion-poster"
                  />
                  {suggestion.title}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="movie-list">
        {movieList.map((movie) => (
          <div key={movie.title} className="movie-item">
            <img 
              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
              alt={movie.title} 
              className="movie-poster" 
            />
            <span className="movie-title">{movie.title}</span>
            <button 
              className="delete-btn" 
              onClick={() => handleDelete(movie.title)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <Recommend />
    </div>
  );
};

export default Home;
