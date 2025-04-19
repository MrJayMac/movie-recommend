const express = require('express');
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const pool = require('./db');
const axios = require('axios');
const port = 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());

const SECRET_KEY = process.env.JWT_SECRET_KEY;
const TMDB_API_KEY = process.env.TMDB_API_KEY;


app.get('/api-key', (req, res) => {
  res.json({ api_key: process.env.TMDB_API_KEY });
});


app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const usernameCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body; 
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/search', async (req, res) => {
  const { query } = req.query;

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from TMDB API:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

app.post('/watched', async (req, res) => {
  const { user_id, movie } = req.body;

  if (!user_id || !movie) {
    return res.status(400).json({ error: 'User ID and movie are required' });
  }

  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: movie,
      },
    });

    const movieDetails = response.data.results[0]; 
    const posterPath = movieDetails.poster_path;  

    await pool.query(
      'INSERT INTO watched (movie, user_id, poster_path) VALUES ($1, $2, $3)',
      [movie, user_id, posterPath]
    );

    res.status(200).json({ message: 'Movie added to watched list' });
  } catch (error) {
    console.error('Error adding movie to watched list:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



app.delete('/delete', async (req, res) => {
  const { movie, user_id } = req.body;

  try {
    const result = await pool.query(
      'DELETE FROM watched WHERE movie = $1 AND user_id = $2',
      [movie, user_id]
    );

    if (result.rowCount > 0) {
      res.status(200).send('Movie deleted successfully');
    } else {
      res.status(404).send('Movie not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


const fetchMovieDetails = async (movieId) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return {};
  }
};

// Utility function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  const arrayCopy = [...array];
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
};

app.get('/recommendations', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const watchedMoviesResult = await pool.query(
      'SELECT movie FROM watched WHERE user_id = $1',
      [user_id]
    );

    const watchedMovies = watchedMoviesResult.rows.map(row => row.movie);

    if (watchedMovies.length === 0) {
      return res.json([]); 
    }

    const allRecommendations = [];

    for (const movie of watchedMovies) {
      const movieDetails = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
        params: {
          api_key: TMDB_API_KEY,
          query: movie,
        },
      });

      if (movieDetails.data.results.length > 0) {
        const movieId = movieDetails.data.results[0].id;
        const movieData = await fetchMovieDetails(movieId);
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/recommendations`, {
          params: {
            api_key: TMDB_API_KEY,
          },
        });

        response.data.results.forEach((rec) => {
          rec.genre_names = movieData.genres.map((g) => g.name); 
          rec.poster_path = rec.poster_path || movieData.poster_path;
        });

        allRecommendations.push(...response.data.results);
      }
    }

    // Get watched movie titles and IDs to exclude from recommendations
    const watchedMovieTitles = watchedMovies.map(title => title.toLowerCase());
    
    // Get movie IDs for the watched movies
    const watchedMovieIds = [];
    for (const movie of watchedMovies) {
      try {
        const searchResult = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: movie,
          },
        });
        
        if (searchResult.data.results.length > 0) {
          watchedMovieIds.push(searchResult.data.results[0].id);
        }
      } catch (error) {
        console.error(`Error fetching ID for watched movie ${movie}:`, error);
      }
    }
    
    // Get unique recommendations by ID and filter out watched movies
    const uniqueRecommendations = Array.from(new Set(allRecommendations.map(r => r.id)))
      .map(id => allRecommendations.find(r => r.id === id))
      .filter(movie => {
        // Filter out movies that are in the watched list (by ID or by title)
        return !watchedMovieIds.includes(movie.id) && 
               !watchedMovieTitles.includes(movie.title.toLowerCase());
      });
    
    // Shuffle the recommendations for randomness
    const shuffledRecommendations = shuffleArray(uniqueRecommendations);
    
    // Limit to a maximum of 10 recommendations
    const limitedRecommendations = shuffledRecommendations.slice(0, 10);

    res.json(limitedRecommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/added', async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const result = await pool.query(
      'SELECT movie, poster_path FROM watched WHERE user_id = $1',
      [user_id]
    );

    res.json(result.rows); 
  } catch (error) {
    console.error('Error fetching added movies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
