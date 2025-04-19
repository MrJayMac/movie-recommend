import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Recommend = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).id : null;

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api-key');
        setApiKey(response.data.api_key);
      } catch (error) {
        setError('Failed to fetch API key');
      }
    };

    fetchApiKey();
  }, []);

  useEffect(() => {
    if (!apiKey) return;

    const fetchGenres = async () => {
      try {
        const response = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
          params: {
            api_key: apiKey,
            language: 'en-US',
          },
        });
        setGenres(response.data.genres);
      } catch (error) {
        setError('Failed to fetch genres');
      }
    };

    fetchGenres();
  }, [apiKey]);

  const shuffleArray = (array) => {
    const arrayCopy = [...array];
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
  };

  const fetchRecommendations = useCallback(async () => {
    if (!userId) {
      setError('User not logged in');
      return;
    }

    if (!apiKey) {
      setError('API key not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:5000/recommendations', {
        params: { user_id: userId },
      });

      if (response.data.length === 0) {
        setHasRecommendations(false);
        setRecommendations([]);
        return;
      }

      setHasRecommendations(true);
      let filteredRecommendations = response.data;

      if (selectedGenre !== 'All') {
        filteredRecommendations = filteredRecommendations.filter(rec =>
          rec.genre_names && rec.genre_names.includes(selectedGenre)
        );
      }
      const randomizedRecommendations = shuffleArray(filteredRecommendations);

      setRecommendations(randomizedRecommendations);
    } catch (error) {
      setError('Error fetching recommendations');
    } finally {
      setLoading(false);
    }
  }, [userId, apiKey, selectedGenre]);

  // Format the release date to show only the year
  const formatReleaseYear = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  return (
    <section className="recommend-container">
      <h2 className="section-title">Movie Recommendations</h2>
      
      <div className="genre-selection">
        <div className="genre-filter">
          <label htmlFor="genre-select">Filter by genre:</label>
          <select 
            id="genre-select"
            onChange={(e) => setSelectedGenre(e.target.value)} 
            value={selectedGenre}
            disabled={loading}
          >
            <option value="All">All Genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.name}>{genre.name}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={fetchRecommendations} 
          disabled={loading}
          className="recommend-button"
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              <span>Loading...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10 8 16 12 10 16 10 8"></polygon>
              </svg>
              Get Recommendations
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="empty-recommendations">
          {hasRecommendations === false ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Add movies to your watched list to get recommendations</p>
            </div>
          ) : (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <p>No recommendations found for the selected genre</p>
              <p className="empty-state-subtitle">Try selecting a different genre or click "Get Recommendations" again</p>
            </div>
          )}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="recommendation-list">
          <div className="recommendation-items">
            {recommendations.map((movie) => (
              <div key={movie.id} className="recommendation-item">
                {movie.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} 
                    alt={movie.title} 
                    className="recommendation-poster" 
                    loading="lazy"
                  />
                ) : (
                  <div className="recommendation-poster-placeholder">
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
                <div className="recommendation-content">
                  <h3 className="recommendation-title">{movie.title}</h3>
                  <div className="recommendation-details">
                    {movie.release_date && (
                      <span className="recommendation-year">{formatReleaseYear(movie.release_date)}</span>
                    )}
                    {movie.vote_average > 0 && (
                      <span className="recommendation-rating">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Recommend;
