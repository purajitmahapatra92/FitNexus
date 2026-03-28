# FitNexus

FitNexus is a fullstack web application built with a React/Vite frontend and a Node.js Express backend, powered by a PostgreSQL database.

## Project Structure

This is a monorepo containing both the client and server applications:

- `/client` - React frontend built with Vite and Tailwind CSS.
- `/server` - Node.js backend using Express and jsonwebtoken.
- `/database` - Contains the PostgreSQL database schema `schema.sql`.

## Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/)

## Local Development Setup

### 1. Database Configuration
Ensure your local PostgreSQL instance is running. Create a new database named `fitnexus` and execute the schema provided in `/database/schema.sql` to set up your tables.

### 2. Environment Variables
You need to set up your environment variables before starting the server.
1. Copy the `.env.example` file and rename it to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and replace the placeholder values (like `YOUR_USERNAME`, `YOUR_PASSWORD`, and `YOUR_JWT_SECRET_HERE`) with your actual local credentials.

### 3. Install Dependencies
Install dependencies for both the frontend and backend.

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 4. Running the Application
You can run the development servers for both the client and server.

**Start the Backend (Server):**
```bash
cd server
npm run dev
```
By default, the backend runs on `http://localhost:5000`.

**Start the Frontend (Client):**
```bash
cd client
npm run dev
```
By default, the Vite frontend runs on `http://localhost:5173`.

## Security Notice
Do not commit your `.env` file to version control. If you add new dependencies or temporary files, ensure they are covered by `.gitignore`.

## Contributors

- [@purajitmahapatra92](https://github.com/purajitmahapatra92)
- [@Sushant-1806](https://github.com/Sushant-1806)
