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

      if (selectedGenre !== 'All') {
        filteredRecommendations = filteredRecommendations.filter(rec =>
          rec.genre_names.includes(selectedGenre)
        );
      }
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
      <div className="genre-selection">
        <select onChange={(e) => setSelectedGenre(e.target.value)} value={selectedGenre}>
          <option value="All">All Genres</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.name}>{genre.name}</option>
          ))}
        </select>
        <button onClick={fetchRecommendations} disabled={loading}>
          {loading ? 'Loading...' : 'Get Recommendations'}
        </button>
      </div>

      <div className="recommendation-list">
        {error && <p className="error-message">{error}</p>}
        {!loading && recommendations.length === 0 && <p>No recommendations available</p>}
        <div className="recommendation-items">
          {recommendations.map((movie, index) => (
            <div key={index} className="recommendation-item">
              <img 
                src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                alt={movie.title} 
                className="recommendation-poster" 
              />
              <span className="recommendation-title">{movie.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recommend;
