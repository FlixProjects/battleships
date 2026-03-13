import { GameStateManager } from "../GameStateManager";
import { IGameState, IHull, IShip } from "../../types";

describe("GameStateManager", () => {
    it("should get visible tiles for player with deployed ship", () => {
        const gameState: IGameState = {
            code: "TEST",
            currentRound: 1,
            players: [{
                id: "player1",
                name: "Player 1",
                order: 0,
                ready: false,
                commandPoints: 2,
                maxCommandPoints: 2,
            }],
            ships: [{
                id: "ship1",
                playerId: "player1",
                deployed: true,
                destroyed: false,
                remainingMovement: 0,
                remainingAttacks: 0,
            } as IShip],
            hulls: [{
                id: "hull1",
                shipId: "ship1",
                location: [1, 1],
                visionRange: 2,
                remainingHealth: 1,
                remainingArmor: 0,
                destroyed: false,
            } as IHull],
            winners: [],
            isOver: false,
        };

        const gsm = new GameStateManager(gameState);
        const visibleTiles = gsm.gameState.getVisibleTilesforPlayer("player1");

        expect(visibleTiles.has("1/1")).toBe(true);
        expect(visibleTiles.has("1/0")).toBe(true);
        expect(visibleTiles.has("0/1")).toBe(true);
        expect(visibleTiles.has("2/1")).toBe(true);
        expect(visibleTiles.has("1/2")).toBe(true);
        expect(visibleTiles.has("1/3")).toBe(true);
        expect(visibleTiles.has("0/0")).toBe(true);
    });

    it("should remove invisible ships from player view", () => {
        const gameState: IGameState = {
            code: "TEST",
            currentRound: 1,
            players: [
                {
                    id: "player1",
                    name: "Player 1",
                    order: 0,
                    ready: false,
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
                {
                    id: "player2",
                    name: "Player 2",
                    order: 1,
                    ready: false,
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
            ],
            ships: [{
                id: "ship2",
                playerId: "player2",
                deployed: true,
                destroyed: false,
                remainingMovement: 0,
                remainingAttacks: 0,
            } as IShip],
            hulls: [{
                id: "hull2",
                shipId: "ship2",
                location: [2, 2],
                visionRange: 2,
                remainingHealth: 1,
                remainingArmor: 0,
                destroyed: false,
            } as IHull],
            winners: [],
            isOver: false,
        };

        const gsm = new GameStateManager(gameState);
        const visibleTiles = new Set<string>();
        const obscuredState = gsm.gameState.removeInvisibleFromPlayer(visibleTiles, "player1");

        const player2 = obscuredState.players.find(p => p.id === "player2");
        expect(player2?.ships.length).toBe(0);
    });

    it("should keep visible ships in player view", () => {
        const gameState: IGameState = {
            code: "TEST",
            currentRound: 1,
            players: [
                {
                    id: "player1",
                    name: "Player 1",
                    order: 0,
                    ready: false,
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
                {
                    id: "player2",
                    name: "Player 2",
                    order: 1,
                    ready: false,
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
            ],
            ships: [{
                id: "ship2",
                playerId: "player2",
                deployed: true,
                destroyed: false,
                remainingMovement: 0,
                remainingAttacks: 0,
            } as IShip],
            hulls: [{
                id: "hull2",
                shipId: "ship2",
                location: [2, 2],
                visionRange: 2,
                remainingHealth: 1,
                remainingArmor: 0,
                destroyed: false,
            } as IHull],
            winners: [],
            isOver: false,
        };

        const gsm = new GameStateManager(gameState);
        const visibleTiles = new Set<string>(["2/2"]);
        const obscuredState = gsm.gameState.removeInvisibleFromPlayer(visibleTiles, "player1");

        const player2 = obscuredState.players.find(p => p.id === "player2");
        expect(player2?.ships.length).toBe(1);
    });
});
