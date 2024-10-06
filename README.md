# YouTube to Cheatsheet Backend

This project is a NestJS-based backend application that generates custom cheatsheets from YouTube videos. It uses TypeORM to connect to a PostgreSQL database and Redis for Bull event queue processing.

## Project Purpose

The main purpose of this application is to:

1. Process YouTube videos by extracting audio and generating transcripts.
2. Analyze the video content to identify key discussion topics.
3. Generate customized cheatsheets based on user-specified topics and language preferences.

## Features

- YouTube video processing
- Transcript generation
- Topic identification
- Customized cheatsheet generation
- RESTful API for frontend integration

## Prerequisites

Before running the application, make sure you have the following installed:

- Node.js (v14 or later)
- npm (v6 or later)
- Docker and Docker Compose

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd youtube-to-cheatsheet_backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory based on the `.env.sample` file.


## Running the Application

1. Start the PostgreSQL and Redis services using Docker Compose:
```bash
docker-compose up -d
```

2. Run database migrations:
```bash
npm run migration:run
```

3. Start the application in development mode:
```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

- `POST /youtube-videos`: Add a new YouTube video for processing
- `GET /youtube-videos`: Get a list of all processed videos
- `GET /youtube-videos/:id/discussion-topics`: Get discussion topics for a specific video
- `POST /cheatsheets`: Create a new cheatsheet for a processed video
- `GET /cheatsheets`: Get a list of all cheatsheets
- `GET /cheatsheets/:id`: Get a specific cheatsheet
