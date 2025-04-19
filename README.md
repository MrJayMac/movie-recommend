# Movie Recommender

A modern web application that helps users track their watched movies and get personalized recommendations based on their viewing history. Built with a React frontend and Node.js/Express backend, featuring a stunning Synthwave '84 inspired UI design.

## Screenshots

### Login Page
![Login Page](https://raw.githubusercontent.com/MrJayMac/movie-recommend/main/client/public/Login.png)

### Home Page
![Home Page](https://raw.githubusercontent.com/MrJayMac/movie-recommend/main/client/public/Home.png)

## Features

- **User Authentication**: Secure login and registration system
- **Movie Search**: Search for movies using The Movie Database (TMDB) API
- **Watched List**: Track movies you've watched
- **Smart Recommendations**: Get personalized movie recommendations based on your watched movies
- **Genre Filtering**: Filter recommendations by genre
- **Synthwave UI**: Modern, neon-inspired design with animations and visual effects

## Tech Stack

### Frontend
- React 18
- React Router for navigation
- Axios for API requests
- JWT for authentication
- Custom CSS with Synthwave '84 theme

### Backend
- Node.js with Express
- PostgreSQL database
- bcryptjs for password encryption
- jsonwebtoken for authentication
- TMDB API integration

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (v6 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v12 or higher)
- [Git](https://git-scm.com/)

## Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/MrJayMac/movie-recommend.git
cd movie-recommend
```

### 2. Set up the database

- Create a PostgreSQL database for the application
- Create the following tables:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE watched (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  movie VARCHAR(255) NOT NULL,
  poster_path VARCHAR(255)
);
```

### 3. Configure environment variables

#### Backend (.env file in server directory)

Create a `.env` file in the server directory with the following variables:

```
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=your_database_name
JWT_SECRET_KEY=your_jwt_secret
TMDB_API_KEY=your_tmdb_api_key
```

You'll need to obtain an API key from [The Movie Database (TMDB)](https://www.themoviedb.org/documentation/api).

#### Frontend (.env file in client directory)

Create a `.env` file in the client directory with:

```
REACT_APP_API_URL=http://localhost:5000
```

### 4. Install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 5. Run the application

#### Start the backend server

```bash
cd server
node server.js
```

The server will run on http://localhost:5000

#### Start the frontend development server

```bash
cd client
npm start
```

The application will open in your browser at http://localhost:3000

## Usage

1. **Register/Login**: Create an account or log in to an existing account
2. **Search for Movies**: Use the search bar to find movies you've watched
3. **Add to Watched List**: Click on a movie from the search results to add it to your watched list
4. **Get Recommendations**: Click the "Get Recommendations" button to receive personalized movie suggestions
5. **Filter by Genre**: Use the genre dropdown to filter recommendations by genre

## Features in Detail

### Smart Recommendation System

The recommendation system:
- Analyzes your watched movies to find similar content
- Limits recommendations to 10 movies for a focused experience
- Excludes movies you've already watched
- Randomizes recommendations for variety
- Allows filtering by genre

### Synthwave '84 UI

The application features a custom-designed UI with:
- Neon color palette with glowing effects
- Animated elements and hover states
- Grid backgrounds and gradient effects
- Responsive design for all screen sizes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for providing the movie data API
- [Synthwave '84](https://github.com/robb0wen/synthwave-vscode) for design inspiration
