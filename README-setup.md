# Battleships - Local Setup Guide

## Prerequisites

- Node.js (v18+)
- Docker Desktop (for AWS SAM local development)
- AWS SAM CLI
- Git

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
```

### 2. Install Dependencies

Install dependencies for the frontend:

```bash
npm install
```

Install dependencies for the backend:

```bash
cd battleships-lambda
npm install
cd ..
```

### 3. Setup .env file

Create a `.env` file in the project root:

```bash
DEPLOY_ENV=local
BASE_API_URL=http://localhost:3000/api
```

**Environment Variables:**
- `DEPLOY_ENV`: Set to `local` for local development
- `BASE_API_URL`: Local backend API endpoint

## Backend Setup (AWS SAM)

The local backend uses AWS SAM (Serverless Application Model) located in the `battleships-lambda` directory.

### AWS SAM Installation

If you don't have AWS SAM CLI installed:

https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html


### Backend Configuration

The backend is configured via `battleships-lambda/template.yaml` which defines:
- Lambda functions (GetGame, CreateGame, JoinGame, SubmitAction)
- API Gateway endpoints
- Local development settings

## Running the Project

### 1. Start Docker

Ensure Docker Desktop is running before starting the backend.

### 2. Start the Backend (AWS SAM)

```bash
cd battleships-lambda
npm run start
```

This command:
- Builds the Lambda functions using `sam build`
- Starts a local API Gateway at `http://127.0.0.1:3000`

### 3. Start the Frontend

In a separate terminal, from the project root:

```bash
npm run dev
```

This starts the webpack dev server, typically at `http://localhost:8080`.

## Development Workflow

- Frontend runs on `http://localhost:8080`
- Backend API runs on `http://127.0.0.1:3000`
- Make sure both are running simultaneously for full functionality
