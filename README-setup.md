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

## TypeScript Configuration Decisions

### `moduleResolution: "bundler"` (not `"node16"`)

`node16` resolution is designed for Node.js 20 native runtime — it enforces strict `exports` map checking and requires explicit file extensions in ESM imports. This project uses webpack as its bundler, not Node.js module resolution at runtime. `bundler` (available since TS 5.0) is the purpose-built option for this case: it respects `exports` fields without the strict Node.js ESM requirements, and allows extensionless imports the way bundlers expect.

### `module: "ESNext"` (not `"node20"`)

`module: "node20"` implies Node.js 20 ESM semantics and is only a valid pairing with `moduleResolution: "node16"` or `"node20"`. Since we use `moduleResolution: "bundler"`, the compatible and correct pairing is `module: "ESNext"`. TypeScript's `module` setting here mainly affects what syntax the type checker allows — webpack's `ts-loader` handles the actual module bundling.

### `skipLibCheck: true`

Third-party packages `@sinclair/typebox` (v0.34, a jest transitive dependency) and `uuid` (v13) have `.d.ts` files that import internal subpaths not listed in their `exports` maps. Both `node16` and `bundler` resolution check the exports map for non-relative package imports, so these declaration files produce errors that cannot be fixed in our codebase. `skipLibCheck: true` is the standard solution for webpack/bundler projects (included by default in CRA, Vite templates, etc.) — it skips type-checking all `.d.ts` files in `node_modules` without affecting type-checking of our own source.
