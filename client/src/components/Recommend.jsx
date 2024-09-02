import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Recommend = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const token = localStorage.getItem('token');
  const userId = token ? jwtDecode(token).id : null;

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api-key');
        setApiKey(response.data.api_key);
      } catch (error) {
        console.error('Error fetching API key:', error);
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
        console.error('Error fetching genres:', error);
        setError('Failed to fetch genres');
      }
    };

    fetchGenres();
  }, [apiKey]);

  const shuffleArray = (array) => {
    // Create a copy of the array to avoid modifying the original array
    const arrayCopy = [...array];
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
  };

  const fetchRecommendations = async () => {
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

      let filteredRecommendations = response.data;

      // Filter recommendations based on selected genre
      if (selectedGenre !== 'All') {
        filteredRecommendations = filteredRecommendations.filter(rec =>
          rec.genre_names.includes(selectedGenre)
        );
      }

      // Randomize the recommendations
      const randomizedRecommendations = shuffleArray(filteredRecommendations);

      setRecommendations(randomizedRecommendations);
    } catch (error) {
      setError('Error fetching recommendations');
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommend-container">
      <button 
        className="recommend-button"
        onClick={fetchRecommendations} 
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Get Recommendations'}
      </button>

      {error && <p className="error-message">{error}</p>}

      <div className="genre-filter">
        <label htmlFor="genre-select" className="filter-label">Filter by Genre:</label>
        <select
          id="genre-select"
          value={selectedGenre}
          onChange={(e) => setSelectedGenre(e.target.value)}
          className="filter-select"
        >
          <option value="All">All</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.name}>{genre.name}</option>
          ))}
        </select>
      </div>

      <div className="recommendations-box">
        {recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div key={rec.id} className="recommendation-item">
              <img 
                src={`https://image.tmdb.org/t/p/w200${rec.poster_path}`} 
                alt={rec.title} 
                className="recommendation-poster"
              />
              <h3 className="recommendation-title">{rec.title}</h3>
              <p className="recommendation-genres">{rec.genre_names.join(', ')}</p>
            </div>
          ))
        ) : (
          <p className="no-recommendations">No recommendations available</p>
        )}
      </div>
    </div>
  );
};

export default Recommend;
