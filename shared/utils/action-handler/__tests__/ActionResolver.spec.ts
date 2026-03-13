import { ActionResolver } from "../ActionResolver";
import { IMoveAction, IShipAttackAction } from "../../../types";
import { ActionTypes } from "../../../types/action-types";
import { Player, Ship, Hull, GameState } from "../../../models";

describe("ActionResolver", () => {
    describe("initiative and action resolution order", () => {
        it("should resolve player1 actions before player2 when player1 has initiative", () => {
            // Setup: Create hulls
            const player1Hull = new Hull({
                id: "hull1",
                shipId: "ship1",
                location: [1, 1],
                visionRange: 2,
                remainingHealth: 1,
                remainingArmor: 0,
                destroyed: false,
                templateLocation: [0, 0],
                maxHealth: 1,
                armor: 0,
            });

            const player2Hull = new Hull({
                id: "hull2",
                shipId: "ship2",
                location: [0, 1],
                visionRange: 2,
                remainingHealth: 1,
                remainingArmor: 0,
                destroyed: false,
                templateLocation: [0, 0],
                maxHealth: 1,
                armor: 0,
            });

            // Setup: Create ships
            const player1Ship = new Ship({
                id: "ship1",
                playerId: "player1",
                refNo: "frigate0",
                name: "Frigate",
                dimensions: [1, 1],
                deployed: true,
                destroyed: false,
                commandPointCost: 1,
                movementRange: 2,
                movementCommandPointCost: 1,
                attackCountMax: 1,
                attackCommandPointCost: 1,
                attackRange: 3,
                attackDamage: 1,
                attackMinRange: 0,
                hullTemplates: [],
                isFlagship: false,
                remainingMovement: 2,
                remainingAttacks: 1,
                hulls: [player1Hull],
            });

            const player2Ship = new Ship({
                id: "ship2",
                playerId: "player2",
                refNo: "frigate0",
                name: "Frigate",
                dimensions: [1, 1],
                deployed: true,
                destroyed: false,
                commandPointCost: 1,
                movementRange: 2,
                movementCommandPointCost: 1,
                attackCountMax: 1,
                attackCommandPointCost: 1,
                attackRange: 3,
                attackDamage: 1,
                attackMinRange: 0,
                hullTemplates: [],
                isFlagship: false,
                remainingMovement: 2,
                remainingAttacks: 1,
                hulls: [player2Hull],
            });

            // Setup: Create player1's move action (move to [2, 1])
            const player1MoveAction: IMoveAction = {
                id: "action1",
                type: ActionTypes.MOVE,
                playerId: "player1",
                shipId: "ship1",
                round: 1,
                order: 0,
                commandPointCost: 1,
                hullLocations: [
                    {
                        id: "hull1",
                        shipId: "ship1",
                        location: [2, 1],
                        visionRange: 2,
                        remainingHealth: 1,
                        remainingArmor: 0,
                        destroyed: false,
                        templateLocation: [0, 0],
                        maxHealth: 1,
                        armor: 0,
                    },
                ],
            };

            // Setup: Create player1's attack action (fire at [0, 0])
            const player1AttackAction: IShipAttackAction = {
                id: "action2",
                type: ActionTypes.ATTACK,
                playerId: "player1",
                shipId: "ship1",
                round: 1,
                order: 1,
                commandPointCost: 1,
                attackLocations: [[0, 0]],
            };

            // Setup: Create player2's move action (move to [0, 0])
            const player2MoveAction: IMoveAction = {
                id: "action3",
                type: ActionTypes.MOVE,
                playerId: "player2",
                shipId: "ship2",
                round: 1,
                order: 0,
                commandPointCost: 1,
                hullLocations: [
                    {
                        id: "hull2",
                        shipId: "ship2",
                        location: [0, 0],
                        visionRange: 2,
                        remainingHealth: 1,
                        remainingArmor: 0,
                        destroyed: false,
                        templateLocation: [0, 0],
                        maxHealth: 1,
                        armor: 0,
                    },
                ],
            };

            // Setup: Create players
            const player1 = new Player({
                id: "player1",
                name: "Player 1",
                order: 0,
                ready: true,
                commandPoints: 10,
                maxCommandPoints: 10,
                ships: [player1Ship],
                pendingActions: [player1MoveAction, player1AttackAction],
            });

            const player2 = new Player({
                id: "player2",
                name: "Player 2",
                order: 1,
                ready: true,
                commandPoints: 10,
                maxCommandPoints: 10,
                ships: [player2Ship],
                pendingActions: [player2MoveAction],
            });

            // Setup: Create game state with player1 having initiative
            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [player1Ship, player2Ship],
                hulls: [player1Hull, player2Hull],
                winners: [],
                isOver: false,
            });

            // Execute: Resolve actions
            const resolver = new ActionResolver("player1", gameState);
            const result = resolver.resolve();

            // Assert: Player1's move action was executed correctly
            const player1HullAfter = result.gameState.hulls?.find((h) => h.id === "hull1");
            expect(player1HullAfter?.location).toEqual([2, 1]);

            // Assert: Player2's hull should be destroyed after being hit by attack
            const player2HullAfter = result.gameState.hulls?.find((h) => h.id === "hull2");
            expect(player2HullAfter?.destroyed).toBe(true);
            expect(player2HullAfter?.remainingHealth).toBe(0);

            // Assert: Player2's ship location should be at [0, 0] after move
            const player2HullLocationAfter = result.gameState.hulls?.find((h) => h.id === "hull2")?.location;
            expect(player2HullLocationAfter).toEqual([0, 0]);

            // Assert: Player2's ship should be destroyed
            const player2ShipAfter = result.gameState.ships.find((s) => s.id === "ship2");
            expect(player2ShipAfter?.destroyed).toBe(true);
            expect(player2ShipAfter?.hulls?.every((h) => h.destroyed)).toBe(true);

            // Assert: Player1's ship should not be destroyed
            const player1ShipAfter = result.gameState.ships.find((s) => s.id === "ship1");
            expect(player1ShipAfter?.destroyed).toBe(false);
        });

        it("should resolve actions in initiative order within a turn", () => {
            const moveAction1: IMoveAction = {
                id: "action1",
                type: ActionTypes.MOVE,
                playerId: "player1",
                shipId: "ship1",
                round: 1,
                order: 0,
                commandPointCost: 1,
                hullLocations: [],
            };

            const moveAction2: IMoveAction = {
                id: "action2",
                type: ActionTypes.MOVE,
                playerId: "player2",
                shipId: "ship2",
                round: 1,
                order: 0,
                commandPointCost: 1,
                hullLocations: [],
            };

            const player1 = new Player({
                id: "player1",
                name: "Player 1",
                order: 0,
                ready: true,
                commandPoints: 10,
                maxCommandPoints: 10,
                ships: [],
                pendingActions: [moveAction1],
            });

            const player2 = new Player({
                id: "player2",
                name: "Player 2",
                order: 1,
                ready: true,
                commandPoints: 10,
                maxCommandPoints: 10,
                ships: [],
                pendingActions: [moveAction2],
            });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [],
                hulls: [],
                winners: [],
                isOver: false,
            });

            const resolver = new ActionResolver("player1", gameState);

            // Test that player1's action is resolved first
            const [first, second] = resolver["resolveIntiative"](moveAction1, moveAction2, "player1");
            expect(first?.playerId).toBe("player1");
            expect(second?.playerId).toBe("player2");
        });

        it("should resolve actions in reverse order when player2 has initiative", () => {
            const moveAction1: IMoveAction = {
                id: "action1",
                type: ActionTypes.MOVE,
                playerId: "player1",
                shipId: "ship1",
                round: 1,
                order: 0,
                commandPointCost: 1,
                hullLocations: [],
            };

            const moveAction2: IMoveAction = {
                id: "action2",
                type: ActionTypes.MOVE,
                playerId: "player2",
                shipId: "ship2",
                round: 1,
                order: 0,
                commandPointCost: 1,
                hullLocations: [],
            };

            const player1 = new Player({
                id: "player1",
                name: "Player 1",
                order: 0,
                ready: true,
                commandPoints: 10,
                maxCommandPoints: 10,
                ships: [],
                pendingActions: [moveAction1],
            });

            const player2 = new Player({
                id: "player2",
                name: "Player 2",
                order: 1,
                ready: true,
                commandPoints: 10,
                maxCommandPoints: 10,
                ships: [],
                pendingActions: [moveAction2],
            });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player2",
                players: [player1, player2],
                ships: [],
                hulls: [],
                winners: [],
                isOver: false,
            });

            const resolver = new ActionResolver("player1", gameState);
            
            // Test that player2's action is resolved first
            const [first, second] = resolver["resolveIntiative"](moveAction1, moveAction2, "player2");
            expect(first?.playerId).toBe("player2");
            expect(second?.playerId).toBe("player1");
        });
    });
});
