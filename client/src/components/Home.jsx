import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Recommend from './Recommend';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [movieList, setMovieList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).id : null;
  const username = token ? jwtDecode(token).username : null;

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/search`, {
        params: { query: query.trim() },
      });

      if (response.data && response.data.results && response.data.results.length > 0) {
        setSuggestions(response.data.results.slice(0, 5).map((movie) => ({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average
        })));
      } else {
        setSuggestions([]);
      }
      setError(null);
    } catch (error) {
      console.error('Search error:', error);
      setError('Error fetching suggestions. Please try again.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;

    await addMovieToListAndDB(searchQuery);
  };

  const addMovieToListAndDB = async (movieTitle) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/search`, {
        params: { query: movieTitle }
      });
      
      if (!response.data.results || response.data.results.length === 0) {
        setError('Movie not found. Please try another title.');
        return;
      }
      
      const movie = response.data.results[0];
      const movieWithPoster = {
        title: movie.title,
        poster_path: movie.poster_path,
        id: movie.id
      };

      // Check if movie already exists in list
      const movieExists = movieList.some(m => m.title === movie.title);
      if (movieExists) {
        setError('This movie is already in your list.');
        return;
      }

      setMovieList(prevList => [...prevList, movieWithPoster]);

      await axios.post(`http://localhost:5000/watched`, {
        movie: movie.title,
        user_id: userId,
        poster_path: movie.poster_path,
      });

      setSuggestions([]);
      setSearchQuery('');
      setError(null);
      setShowSuggestions(false);
    } catch (error) {
      setError('Error adding movie to your list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion.title);
    await addMovieToListAndDB(suggestion.title);
  };

  const handleDelete = async (movieTitle) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/delete`, {
        data: { movie: movieTitle, user_id: userId },
      });

      setMovieList(movieList.filter((movie) => movie.title !== movieTitle));
    } catch (error) {
      setError('Error removing movie. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedMovies = async () => {
    try {
      setLoading(true);
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
      setError('Error fetching your movies. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMovies = async () => {
      if (userId) {
        await fetchSavedMovies();
      } else {
        navigate('/');
      }
    };
    
    loadMovies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, navigate]);

  useEffect(() => {
    // Only fetch suggestions if we have a search query and suggestions are showing
    if (!showSuggestions || searchQuery.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-form')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const formatReleaseYear = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  return (
    <div className="home-container">
      <header className="header">
        <h1 className="title">Movie Recommender</h1>
        <div className="user-controls">
          <span className="username">Hello, {username || 'User'}</span>
          <button className="sign-out" onClick={handleSignOut}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      <div className="search-section">
        <div className="container">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-container">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Search for a movie to add to your list..."
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
              />
              {loading && <span className="search-spinner"></span>}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${suggestion.poster_path}`}
                        alt={suggestion.title}
                        className="suggestion-poster"
                      />
                    ) : (
                      <div className="suggestion-poster-placeholder"></div>
                    )}
                    <div className="suggestion-info">
                      <span className="suggestion-title">{suggestion.title}</span>
                      <div className="suggestion-details">
                        {suggestion.release_date && (
                          <span className="suggestion-year">{formatReleaseYear(suggestion.release_date)}</span>
                        )}
                        {suggestion.vote_average > 0 && (
                          <span className="suggestion-rating">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            {suggestion.vote_average.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>

      <div className="content-container">
        <div className="container">
          <section className="watched-section">
            <h2 className="section-title">My Watched Movies</h2>
            {loading && movieList.length === 0 ? (
              <div className="loading-container">
                <div className="loading-spinner dark"></div>
                <p>Loading your movies...</p>
              </div>
            ) : movieList.length === 0 ? (
              <div className="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <line x1="2" y1="7" x2="7" y2="7"></line>
                  <line x1="2" y1="17" x2="7" y2="17"></line>
                  <line x1="17" y1="17" x2="22" y2="17"></line>
                  <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
                <p>You haven't added any movies yet</p>
                <p className="empty-state-subtitle">Search for movies to add them to your list</p>
              </div>
            ) : (
              <div className="movie-list">
                {movieList.map((movie) => (
                  <div key={movie.title} className="movie-item">
                    {movie.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} 
                        alt={movie.title} 
                        className="movie-poster" 
                      />
                    ) : (
                      <div className="movie-poster-placeholder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                          <line x1="7" y1="2" x2="7" y2="22"></line>
                          <line x1="17" y1="2" x2="17" y2="22"></line>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <line x1="2" y1="7" x2="7" y2="7"></line>
                          <line x1="2" y1="17" x2="7" y2="17"></line>
                          <line x1="17" y1="17" x2="22" y2="17"></line>
                          <line x1="17" y1="7" x2="22" y2="7"></line>
                        </svg>
                      </div>
                    )}
                    <div className="movie-content">
                      <h3 className="movie-title">{movie.title}</h3>
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDelete(movie.title)}
                        disabled={loading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Recommend />
        </div>
      </div>
    </div>
  );
};

export default Home;
