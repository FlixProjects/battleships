import { HullBuilder } from "../../factories/hull-builder";
import { PlayerBuilder } from "../../factories/player-builder";
import { ShipBuilder } from "../../factories/ship-builder";
import { IGameStateData } from "../../types";
import { GameStateManager } from "../GameStateManager";

const buildPlayer1 = () =>
    new PlayerBuilder({
        id: "player1",
        name: "Player 1",
    }).build();

const buildPlayer2 = () =>
    new PlayerBuilder({
        id: "player2",
        name: "Player 2",
        order: 1,
    }).build();

const shipBuilder = new ShipBuilder({
    deployed: true,
    destroyed: false,
});

const hullBuilder = new HullBuilder({
    visionRange: 2,
    remainingHealth: 1,
    maxHealth: 1,
});

describe("GameStateManager", () => {
    it("should get visible tiles for player with deployed ship", () => {
        const gameState: IGameStateData = {
            code: "TEST",
            currentRound: 1,
            players: [buildPlayer1()],
            ships: [
                shipBuilder.build({
                    id: "ship1",
                    playerId: "player1",
                }),
            ],
            hulls: [
                hullBuilder.build({
                    id: "hull1",
                    shipId: "ship1",
                    location: [1, 1],
                }),
            ],
            cards: [],
            decks: [],
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
        const gameState: IGameStateData = {
            code: "TEST",
            currentRound: 1,
            players: [buildPlayer1(), buildPlayer2()],
            ships: [
                shipBuilder.build({
                    id: "ship2",
                    playerId: "player2",
                }),
            ],
            hulls: [
                hullBuilder.build({
                    id: "hull2",
                    shipId: "ship2",
                    location: [2, 2],
                }),
            ],
            cards: [],
            decks: [],
            winners: [],
            isOver: false,
        };

        const gsm = new GameStateManager(gameState);
        const visibleTiles = new Set<string>();
        const obscuredState = gsm.gameState.removeInvisibleFromPlayer(visibleTiles, "player1");

        const player2 = obscuredState.players.find((p) => p.id === "player2");
        expect(player2?.ships.length).toBe(0);
    });

    it("should keep visible ships in player view", () => {
        const gameState: IGameStateData = {
            code: "TEST",
            currentRound: 1,
            players: [buildPlayer1(), buildPlayer2()],
            ships: [
                shipBuilder.build({
                    id: "ship2",
                    playerId: "player2",
                }),
            ],
            hulls: [
                hullBuilder.build({
                    id: "hull2",
                    shipId: "ship2",
                    location: [2, 2],
                }),
            ],
            cards: [],
            decks: [],
            winners: [],
            isOver: false,
        };

        const gsm = new GameStateManager(gameState);
        const visibleTiles = new Set<string>(["2/2"]);
        const obscuredState = gsm.gameState.removeInvisibleFromPlayer(visibleTiles, "player1");

        const player2 = obscuredState.players.find((p) => p.id === "player2");
        expect(player2?.ships.length).toBe(1);
    });
});
