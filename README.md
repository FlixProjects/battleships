# Battleships

A turn-based tactical naval combat game built with TypeScript, featuring card-driven ship deployment, movement, combat, and fog of war.

## Overview

Battleships is a two-player strategy game. Each player commands a faction fleet, drawing cards to deploy ships and play support abilities, manoeuvring around islands, and engaging in combat to destroy the opponent's flagship.

## Game Mechanics

### Board
- 7 × 5 grid with impassable **islands** that ships must route around
- Ships occupy one or more tiles (the flagship spans two)

### Cards & Hand
- Each player draws from a faction deck, holding up to 4 cards; the hand refills every turn
- **Ship cards** deploy a ship onto your side of the board
- **Support cards** create effects:
  - **Flare**: reveals an area for 2 turns
  - **Inspire**: grants +1 command point
  - **Airstrike**: marks an area that detonates next turn, damaging friend and foe

### Ships (TUDF faction)
| Ship | Hulls | Move | Attack range | Notes |
| --- | --- | --- | --- | --- |
| S12-Warrior Frigate | 1 | 3 | 3 | |
| M07-Knight Destroyer | 1 (2 HP, 1 armor) | 2 | 3 | Gains armor-piercing rounds on deploy |
| L03-Kingmaker Flagship | 2 | 1 | 3–5 | Deals 2 damage; losing it loses the game |

### Turns
- **Simultaneous submission**: both players plan and submit actions each round
- **Initiative**: actions resolve in initiative order, which rotates every round
- **Command Points**: deploying, moving, attacking and playing cards spend command points
- **Movement**: ships path around islands and other ships within their movement range
- **Attack**: hits damage hulls; armor reduces incoming damage
- **Fog of War**: you only see enemies within your ships' vision range (or revealed by effects)
- **Replay**: after each round resolves, the turn is replayed as an animation

### Victory Condition
- Destroy the opponent's flagship to win the game

## Tech Stack

**Frontend:**
- TypeScript, vanilla DOM (no framework)
- Webpack (bundling & dev server)
- IndexedDB (client signing keys), sessionStorage (game state)

**Backend:**
- AWS Lambda + API Gateway (AWS SAM for local development)
- S3 (game state), DynamoDB (users & games)
- Account and guest login with proof-of-possession (DPoP) signed requests

**Infrastructure:**
- Terraform (Lambda, CloudFront, S3, DynamoDB, SSM, IAM)
- CloudFront (CDN)
- Docker (local SAM + DynamoDB Local)

**Testing:**
- Jest (unit)
- Playwright (end-to-end)

## Local Development

See [README-setup.md](./README-setup.md) for detailed setup instructions. Quick reference:

```bash
npm --prefix battleships-lambda run start   # backend on :3000 (needs Docker)
npm run dev                                 # frontend on :8080
npm test                                    # unit tests
npm run test:e2e                            # end-to-end tests
```

## Project Structure

```
battleships/
├── src/                    # Frontend
│   ├── components/         # UI components (board, hand, action panel, pages)
│   ├── models/             # Game manager, interaction, animations, playback
│   ├── apis/               # API client (signed requests)
│   └── db/                 # IndexedDB key store
├── shared/                 # Shared code (frontend & backend)
│   ├── models/             # Signal-driven game engine, state & entities
│   ├── auth/               # JWT / DPoP / password helpers
│   ├── config/             # Game tunables (ships, cards, effects, board)
│   ├── types/              # TypeScript interfaces
│   └── utils/              # Action resolution, pathfinding, validators
├── battleships-lambda/     # Backend Lambda functions
│   ├── sign-up/  login/
│   ├── get-games/  create-game/  join-game/
│   ├── get-game/  submit-action/
│   └── lib/                # Auth wrapper, DynamoDB client, responses
├── terraform/              # AWS infrastructure
├── e2e/                    # Playwright tests
├── docs/                   # Design notes
└── public/                 # Static assets & bundle
```

## License

MIT
