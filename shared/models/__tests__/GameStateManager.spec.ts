import { handleActions } from "../../utils/action-handler";
import { ActionResolver } from "../../utils/action-handler/ActionResolver";
import { GameEngine } from "../GameEngine";
import { GameStateManager } from "../GameStateManager";

const body = {
    gameCode: "EJQ5",
    actions: [
        {
            type: "deploy",
            shipId: "019b2418-55d5-74fe-b3bb-2a5ce993da34",
            hullLocations: [
                {
                    templateLocation: [0, 0],
                    maxHealth: 1,
                    armor: 0,
                    visionRange: 2,
                    id: "019b2419-00ff-72eb-a0ae-e22f9dba8ea8",
                    shipId: "019b2418-55d5-74fe-b3bb-2a5ce993da34",
                    remainingArmor: 0,
                    remainingHealth: 1,
                    location: [0, 0],
                    destroyed: false,
                },
            ],
            playerId: "5ac903bc-6cf3-4a90-815c-6c6bd14364e9",
            commandPointCost: 0,
        },
        {
            type: "move",
            shipId: "019b2418-55d5-74fe-b3bb-2a5ce993da34",
            hullLocations: [
                {
                    templateLocation: [0, 0],
                    maxHealth: 1,
                    armor: 0,
                    visionRange: 2,
                    id: "019b2419-00ff-72eb-a0ae-e22f9dba8ea8",
                    shipId: "019b2418-55d5-74fe-b3bb-2a5ce993da34",
                    remainingArmor: 0,
                    remainingHealth: 1,
                    location: [0, 1],
                    destroyed: false,
                },
            ],
            playerId: "5ac903bc-6cf3-4a90-815c-6c6bd14364e9",
            commandPointCost: 1,
        },
    ],
    gameState: {
        code: "EJQ5",
        players: [
            {
                name: "km",
                id: "5ac903bc-6cf3-4a90-815c-6c6bd14364e9",
                ready: false,
                ships: [
                    {
                        refNo: "flagship0",
                        name: "Flagship",
                        deployed: false,
                        dimensions: [1, 1],
                        commandPointCost: 0,
                        movementRange: 1,
                        movementCommandPointCost: 1,
                        attackCountMax: 1,
                        attackCommandPointCost: 1,
                        attackRange: 5,
                        attackDamage: 1,
                        attackMinRange: 1,
                        hullTemplates: [
                            {
                                templateLocation: [0, 0],
                                maxHealth: 1,
                                armor: 0,
                                visionRange: 2,
                            },
                        ],
                        isFlagship: true,
                        id: "019b2418-55d5-74fe-b3bb-2a5ce993da34",
                        playerId: "5ac903bc-6cf3-4a90-815c-6c6bd14364e9",
                        remainingMovement: 1,
                        remainingAttacks: 1,
                        destroyed: false,
                    },
                ],
                pendingActions: [],
                maxCommandPoints: 2,
                commandPoints: 2,
            },
            {
                name: "km2",
                id: "27874c66-d0e2-4375-a88e-7f8af21f5a62",
                ready: true,
                ships: [
                    {
                        refNo: "flagship0",
                        name: "Flagship",
                        deployed: false,
                        dimensions: [1, 1],
                        commandPointCost: 0,
                        movementRange: 1,
                        movementCommandPointCost: 1,
                        attackCountMax: 1,
                        attackCommandPointCost: 1,
                        attackRange: 5,
                        attackDamage: 1,
                        attackMinRange: 1,
                        hullTemplates: [
                            {
                                templateLocation: [0, 0],
                                maxHealth: 1,
                                armor: 0,
                                visionRange: 2,
                            },
                        ],
                        isFlagship: true,
                        id: "019b2418-991f-739c-8927-fd70bb8c5d4d",
                        playerId: "27874c66-d0e2-4375-a88e-7f8af21f5a62",
                        remainingMovement: 1,
                        remainingAttacks: 1,
                        destroyed: false,
                    },
                    {
                        refNo: "frigate0",
                        name: "Frigate",
                        deployed: false,
                        dimensions: [1, 1],
                        commandPointCost: 1,
                        movementRange: 2,
                        movementCommandPointCost: 1,
                        attackCountMax: 1,
                        attackCommandPointCost: 1,
                        attackRange: 3,
                        attackDamage: 1,
                        attackMinRange: 1,
                        hullTemplates: [
                            {
                                templateLocation: [0, 0],
                                maxHealth: 1,
                                armor: 0,
                                visionRange: 2,
                            },
                        ],
                        isFlagship: false,
                        id: "019b2418-991f-739c-8928-045f0a5e76b0",
                        playerId: "27874c66-d0e2-4375-a88e-7f8af21f5a62",
                        remainingMovement: 2,
                        remainingAttacks: 1,
                        destroyed: false,
                    },
                ],
                pendingActions: [
                    {
                        type: "deploy",
                        shipId: "019b2418-991f-739c-8927-fd70bb8c5d4d",
                        hullLocations: [
                            {
                                templateLocation: [0, 0],
                                maxHealth: 1,
                                armor: 0,
                                visionRange: 2,
                                id: "019b2418-b41b-7194-ae0d-82afd76a461b",
                                shipId: "019b2418-991f-739c-8927-fd70bb8c5d4d",
                                remainingArmor: 0,
                                remainingHealth: 1,
                                location: [0, 3],
                                destroyed: false,
                            },
                        ],
                        playerId: "27874c66-d0e2-4375-a88e-7f8af21f5a62",
                        commandPointCost: 0,
                    },
                    {
                        type: "deploy",
                        shipId: "019b2418-991f-739c-8928-045f0a5e76b0",
                        hullLocations: [
                            {
                                templateLocation: [0, 0],
                                maxHealth: 1,
                                armor: 0,
                                visionRange: 2,
                                id: "019b2418-c023-70ad-bcfa-2b2c2ef35629",
                                shipId: "019b2418-991f-739c-8928-045f0a5e76b0",
                                remainingArmor: 0,
                                remainingHealth: 1,
                                location: [2, 3],
                                destroyed: false,
                            },
                        ],
                        playerId: "27874c66-d0e2-4375-a88e-7f8af21f5a62",
                        commandPointCost: 1,
                    },
                ],
                maxCommandPoints: 2,
                commandPoints: 2,
            },
        ],
        initiative: "5ac903bc-6cf3-4a90-815c-6c6bd14364e9",
        winners: [] as any,
        isOver: false,
    },
};

describe("visibility", () => {
    it("should get visible tiles for player with deployed ship", () => {
        const gameState = {
            code: "TEST",
            players: [{
                id: "player1",
                name: "Player 1",
                ready: false,
                ships: [{
                    id: "ship1",
                    playerId: "player1",
                    deployed: true,
                    destroyed: false,
                    hullLocations: [{
                        id: "hull1",
                        shipId: "ship1",
                        location: [1, 1],
                        visionRange: 2,
                    }],
                }],
                commandPoints: 2,
                maxCommandPoints: 2,
            }],
            winners: [] as any,
            isOver: false,
        };

        const gsm = new GameStateManager(gameState as any);
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
        const gameState = {
            code: "TEST",
            players: [
                {
                    id: "player1",
                    name: "Player 1",
                    ready: false,
                    ships: [],
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
                {
                    id: "player2",
                    name: "Player 2",
                    ready: false,
                    ships: [{
                        id: "ship2",
                        playerId: "player2",
                        deployed: true,
                        destroyed: false,
                        hullLocations: [{
                            id: "hull2",
                            shipId: "ship2",
                            location: [2, 2],
                            visionRange: 2,
                        }],
                    }],
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
            ],
            winners: [] as any,
            isOver: false,
        };

        const gsm = new GameStateManager(gameState as any);
        const visibleTiles = new Set<string>();
        const obscuredState = gsm.gameState.removeInvisibleFromPlayer(visibleTiles, "player1");

        const player2 = obscuredState.players.find(p => p.id === "player2");
        expect(player2.ships.length).toBe(0);
    });

    it("should keep visible ships in player view", () => {
        const gameState = {
            code: "TEST",
            players: [
                {
                    id: "player1",
                    name: "Player 1",
                    ready: false,
                    ships: [],
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
                {
                    id: "player2",
                    name: "Player 2",
                    ready: false,
                    ships: [{
                        id: "ship2",
                        playerId: "player2",
                        deployed: true,
                        destroyed: false,
                        hullLocations: [{
                            id: "hull2",
                            shipId: "ship2",
                            location: [2, 2],
                            visionRange: 2,
                        }],
                    }],
                    commandPoints: 2,
                    maxCommandPoints: 2,
                },
            ],
            winners: [] as any,
            isOver: false,
        };

        const gsm = new GameStateManager(gameState as any);
        const visibleTiles = new Set<string>(["2/2"]);
        const obscuredState = gsm.gameState.removeInvisibleFromPlayer(visibleTiles, "player1");

        const player2 = obscuredState.players.find(p => p.id === "player2");
        expect(player2.ships.length).toBe(1);
    });
});
