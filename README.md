# Recipe Finder and Meal Planner

A MEAN stack application for CS402 that allows users to search for recipes based on ingredients, dietary preferences, and meal types. Features user authentication, recipe search/save functionality, and meal planning capabilities.

## Features

- User authentication (login/register)
- Recipe search using Edamam API
- Save favorite recipes
- Create weekly meal plans
- Admin dashboard for user management

## Tech Stack

- MongoDB: Database
- Express.js: Backend framework
- Angular: Frontend framework
- Node.js: Server environment
- JWT: Authentication

## Development Setup

### Prerequisites

- Node.js & npm
- MongoDB
- Angular CLI

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/recipe-app.git
   cd recipe-app
   ```

2. Install server dependencies
   ```
   npm install
   ```

3. Install client dependencies
   ```
   cd client
   npm install
   cd ..
   ```

4. Set up environment variables
   Create a `.env` file in the root directory with:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/recipe-app
   JWT_SECRET=yoursecretkey
   EDAMAM_API_ID=yourapikeyid
   EDAMAM_API_KEY=yourapikey
   ```

5. Seed the database with test users
   ```
   node server/scripts/seedUsers.js
   ```

6. Run development server
   ```
   npm run dev
   ```

The app will be running at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000

## Testing Accounts

- Admin: username: `user0`, password: `password123`
- Regular user: username: `user10`, password: `password123`