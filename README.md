# Battleships

A turn-based tactical naval combat game built with TypeScript, featuring strategic ship deployment, movement, and combat mechanics.

## Overview

Battleships is a multiplayer strategy game where two players compete in naval warfare. Players deploy ships, maneuver them across the battlefield, and engage in tactical combat to destroy the opponent's flagship.

## Game Mechanics

### Setup Phase
- Players deploy ships on their side of the board
- Each player has a fleet including a flagship and various ship types
- Ships must be strategically positioned before combat begins

### Combat Phase
- **Turn-Based**: Players alternate turns with initiative system
- **Command Points**: Each turn provides command points to execute actions
- **Movement**: Ships can move orthogonally within their movement range
  - Movement costs 1 command point
  - Ships cannot move through other ships or board boundaries
  - Movement range is configurable per ship type
- **Attack**: Ships can attack enemy vessels within range
  - Attack costs command points
  - Successful hits damage ship hulls
- **Fog of War**: Limited visibility of enemy positions

### Victory Condition
- Destroy the opponent's flagship to win the game

## Tech Stack

**Frontend:**
- TypeScript
- Webpack (bundling & dev server)
- Vanilla JS/DOM manipulation

**Backend:**
- AWS Lambda (serverless functions)
- AWS SAM (local development)
- API Gateway
- S3 (game state storage)

**Infrastructure:**
- CloudFront (CDN)
- Docker (local backend)

## Local Development

To run this project locally, see [README-setup.md](./README-setup.md) for detailed setup instructions.

## Project Structure

```
battleships/
├── src/                    # Frontend source code
│   ├── components/         # UI components
│   ├── models/            # Game logic & managers
│   └── apis/              # API client functions
├── shared/                # Shared code (frontend & backend)
│   ├── models/            # Game engine & state
│   ├── types/             # TypeScript interfaces
│   └── utils/             # Helper functions
├── battleships-lambda/    # Backend Lambda functions
│   ├── create-game/
│   ├── get-game/
│   ├── join-game/
│   └── submit-action/
└── public/                # Static assets
```

## License

MIT
