import { CardKind, Faction, MAX_HAND_SIZE } from "../../../config/constants";
import { HullBuilder } from "../../../factories/hull-builder";
import { PlayerBuilder } from "../../../factories/player-builder";
import { ShipBuilder } from "../../../factories/ship-builder";
import { GameState } from "../../../models";
import {
    ICard,
    IDeck,
    IDeployAction,
    IHullTemplate,
    IMoveAction,
    IPlayCardAction,
    IPlayer,
    IShipAttackAction,
} from "../../../types";
import { ActionTypes } from "../../../types/action-types";
import { ActionResolver } from "../ActionResolver";

const buildPlayer1 = (overrides?: Partial<IPlayer>) =>
    new PlayerBuilder({
        id: "player1",
        name: "Player 1",
    }).build(overrides);

const buildPlayer2 = (overrides?: Partial<IPlayer>) =>
    new PlayerBuilder({
        id: "player2",
        name: "Player 2",
        order: 1,
    }).build(overrides);

const shipBuilder = new ShipBuilder({
    refNo: "frigate0",
    name: "Frigate",
    deployed: true,
});

const hullBuilder = new HullBuilder({
    visionRange: 2,
    remainingHealth: 1,
    maxHealth: 1,
    templateLocation: [0, 0],
});

const frigateTemplate: IHullTemplate = {
    templateLocation: [0, 0],
    maxHealth: 1,
    armor: 0,
    visionRange: 2,
    orientation: 0,
    front: true,
};

describe("ActionResolver", () => {
    describe("initiative and action resolution order", () => {
        it("should resolve player1 actions before player2 when player1 has initiative", () => {
            // Setup: Create hulls
            const player1Hull = hullBuilder.build({
                id: "hull1",
                shipId: "ship1",
                location: [1, 1],
                front: true,
            });

            const player2Hull = hullBuilder.build({
                id: "hull2",
                shipId: "ship2",
                location: [0, 1],
                front: true,
            });

            // Setup: Create ships
            const player1Ship = shipBuilder.build({
                id: "ship1",
                playerId: "player1",
                hulls: [player1Hull],
            });

            const player2Ship = shipBuilder.build({
                id: "ship2",
                playerId: "player2",
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
                targetCell: [2, 1],
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
                targetCell: [0, 0],
            };

            // Setup: Create players
            const player1 = buildPlayer1({
                ships: [player1Ship],
                pendingActions: [player1MoveAction, player1AttackAction],
            });
            const player2 = buildPlayer2({ ships: [player2Ship], pendingActions: [player2MoveAction] });

            // Setup: Create game state with player1 having initiative.
            // Just after resolution, GameState will have both pendingActions and actions
            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [player1Ship, player2Ship],
                hulls: [player1Hull, player2Hull],
                cards: [],
                decks: [],
                actions: [player1MoveAction, player1AttackAction, player2MoveAction],
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

        it("deducts the attacker's command points via the PlayerSpendCommandPoints signal", () => {
            const attackerHull = hullBuilder.build({ id: "hullA", shipId: "shipA", location: [1, 1], front: true });
            const targetHull = hullBuilder.build({ id: "hullB", shipId: "shipB", location: [0, 0], front: true });
            const attackerShip = shipBuilder.build({ id: "shipA", playerId: "player1", hulls: [attackerHull] });
            const targetShip = shipBuilder.build({ id: "shipB", playerId: "player2", hulls: [targetHull] });

            const attackAction: IShipAttackAction = {
                id: "atk-1",
                type: ActionTypes.ATTACK,
                playerId: "player1",
                shipId: "shipA",
                round: 1,
                order: 0,
                commandPointCost: 1,
                attackLocations: [[0, 0]],
            };

            // commandPoints 2, attackCommandPointCost 1 (builder defaults)
            const player1 = buildPlayer1({ ships: [attackerShip], commandPoints: 2, maxCommandPoints: 2 });
            const player2 = buildPlayer2({ ships: [targetShip] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [attackerShip, targetShip],
                hulls: [attackerHull, targetHull],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            });

            const resolver = new ActionResolver("player1", gameState);
            const next = resolver.resolveAction(attackAction);

            // CP spent through the signal cascade, not by direct mutation in Ship.attack
            const attackerAfter = next.players.find((p) => p.id === "player1");
            expect(attackerAfter?.commandPoints).toBe(1);

            // the rest of the cascade still lands: the targeted hull takes damage
            const targetHullAfter = next.hulls?.find((h) => h.id === "hullB");
            expect(targetHullAfter?.remainingHealth).toBe(0);
        });

        it("applies hull damage via the hull signal cascade without destroying a surviving hull", () => {
            const attackerHull = hullBuilder.build({ id: "hullA", shipId: "shipA", location: [1, 1], front: true });
            // 2 HP hull vs default attackDamage 1 → damaged but not destroyed
            const targetHull = hullBuilder.build({
                id: "hullB",
                shipId: "shipB",
                location: [0, 0],
                front: true,
                remainingHealth: 2,
                maxHealth: 2,
            });
            const attackerShip = shipBuilder.build({ id: "shipA", playerId: "player1", hulls: [attackerHull] });
            const targetShip = shipBuilder.build({ id: "shipB", playerId: "player2", hulls: [targetHull] });

            const attackAction: IShipAttackAction = {
                id: "atk-survive",
                type: ActionTypes.ATTACK,
                playerId: "player1",
                shipId: "shipA",
                round: 1,
                order: 0,
                commandPointCost: 1,
                attackLocations: [[0, 0]],
            };

            const player1 = buildPlayer1({ ships: [attackerShip] });
            const player2 = buildPlayer2({ ships: [targetShip] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [attackerShip, targetShip],
                hulls: [attackerHull, targetHull],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            });

            const next = new ActionResolver("player1", gameState).resolveAction(attackAction);

            const hullAfter = next.hulls?.find((h) => h.id === "hullB");
            expect(hullAfter?.remainingHealth).toBe(1);
            expect(hullAfter?.destroyed).toBe(false);

            // HullDestroyed never fires → ship's destroyed stays false
            const shipAfter = next.ships.find((s) => s.id === "shipB");
            expect(shipAfter?.destroyed).toBe(false);
        });

        it("moves the ship and deducts CP via signals through GameEngineV2", () => {
            const movingHull = hullBuilder.build({ id: "hullM", shipId: "shipM", location: [0, 1], front: true });
            const movingShip = shipBuilder.build({ id: "shipM", playerId: "player1", hulls: [movingHull] });

            const moveAction: IMoveAction = {
                id: "mv-1",
                type: ActionTypes.MOVE,
                playerId: "player1",
                shipId: "shipM",
                round: 1,
                order: 0,
                commandPointCost: 1,
                targetCell: [2, 1],
            };

            // commandPoints 2, movementCommandPointCost 1 (builder defaults)
            const player1 = buildPlayer1({ ships: [movingShip], commandPoints: 2, maxCommandPoints: 2 });
            const player2 = buildPlayer2({ ships: [] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [movingShip],
                hulls: [movingHull],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            });

            const resolver = new ActionResolver("player1", gameState);
            const next = resolver.resolveAction(moveAction);

            // hull moved to the target location (flat gameState.hulls stays in sync)
            const movedHull = next.hulls?.find((h) => h.id === "hullM");
            expect(movedHull?.location).toEqual([2, 1]);

            // movement consumed and CP spent through the PlayerSpendCommandPoints signal
            const movedShip = next.ships.find((s) => s.id === "shipM");
            expect(movedShip?.remainingMovement).toBe(0);
            const mover = next.players.find((p) => p.id === "player1");
            expect(mover?.commandPoints).toBe(1);

            // action recorded by the engine
            expect(mover?.pendingActions?.map((a) => a.id)).toContain("mv-1");
        });

        it("rejects a move onto an occupied destination via the engine validator (no mutation, no CP spent)", () => {
            const movingHull = hullBuilder.build({ id: "hullM", shipId: "shipM", location: [0, 1], front: true });
            const movingShip = shipBuilder.build({ id: "shipM", playerId: "player1", hulls: [movingHull] });
            // opponent ship sits on the destination tile, so the move must be rejected
            const blockerHull = hullBuilder.build({ id: "hullX", shipId: "shipX", location: [2, 1], front: true });
            const blockerShip = shipBuilder.build({ id: "shipX", playerId: "player2", hulls: [blockerHull] });

            const moveAction: IMoveAction = {
                id: "mv-invalid",
                type: ActionTypes.MOVE,
                playerId: "player1",
                shipId: "shipM",
                round: 1,
                order: 0,
                commandPointCost: 1,
                targetCell: [2, 1],
            };

            const player1 = buildPlayer1({ ships: [movingShip], commandPoints: 2, maxCommandPoints: 2 });
            const player2 = buildPlayer2({ ships: [blockerShip] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [movingShip, blockerShip],
                hulls: [movingHull, blockerHull],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            });

            const next = new ActionResolver("player1", gameState).resolveAction(moveAction);

            // invalid → engine.run is a no-op: hull stays, movement intact, CP untouched
            expect(next.hulls?.find((h) => h.id === "hullM")?.location).toEqual([0, 1]);
            expect(next.ships.find((s) => s.id === "shipM")?.remainingMovement).toBe(3);
            const mover = next.players.find((p) => p.id === "player1");
            expect(mover?.commandPoints).toBe(2);
            // rejected action is not recorded
            expect(mover?.pendingActions?.map((a) => a.id)).not.toContain("mv-invalid");
        });

        it("deploys a ship via the engine: hulls materialise, CP spent by signal, action recorded", () => {
            // undeployed ship with no hulls — deploy supplies them via the action
            const ship = shipBuilder.build({
                id: "shipD",
                playerId: "player1",
                deployed: false,
                hulls: [],
                commandPointCost: 1,
                hullTemplates: [frigateTemplate],
            });

            const deployAction: IDeployAction = {
                id: "dep-1",
                type: ActionTypes.DEPLOY,
                playerId: "player1",
                shipId: "shipD",
                round: 1,
                order: 0,
                commandPointCost: 1,
                location: [1, 0],
            };

            const player1 = buildPlayer1({ ships: [ship], commandPoints: 2, maxCommandPoints: 2 });
            const player2 = buildPlayer2({ ships: [] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [ship],
                hulls: [],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            });

            const next = new ActionResolver("player1", gameState).resolveAction(deployAction);

            const deployedShip = next.ships.find((s) => s.id === "shipD");
            expect(deployedShip?.deployed).toBe(true);
            // hull derived from the ship's template (anchor [1,0] + template [0,0]) and
            // materialised into the flat gameState.hulls (serialised source of truth)
            const createdHull = next.hulls?.find((h) => h.shipId === "shipD");
            expect(createdHull?.location).toEqual([1, 0]);
            // …and GameState.createHull linked that same hull to the ship
            expect(deployedShip?.hulls?.some((h) => h.id === createdHull?.id)).toBe(true);

            const mover = next.players.find((p) => p.id === "player1");
            expect(mover?.commandPoints).toBe(1); // 2 - commandPointCost(1) via PlayerSpendCommandPoints
            expect(mover?.pendingActions?.map((a) => a.id)).toContain("dep-1");
        });

        it("rejects a deploy onto an occupied tile via the engine validator (no hull created, no CP spent, not recorded)", () => {
            // player1 already occupies [1,0] in its own deploy row
            const occupyingHull = hullBuilder.build({
                id: "hullOcc",
                shipId: "shipOcc",
                location: [1, 0],
                front: true,
            });
            const occupyingShip = shipBuilder.build({
                id: "shipOcc",
                playerId: "player1",
                deployed: true,
                hulls: [occupyingHull],
            });

            const ship = shipBuilder.build({
                id: "shipD",
                playerId: "player1",
                deployed: false,
                hulls: [],
                commandPointCost: 1,
                hullTemplates: [frigateTemplate],
            });

            const deployAction: IDeployAction = {
                id: "dep-occupied",
                type: ActionTypes.DEPLOY,
                playerId: "player1",
                shipId: "shipD",
                round: 1,
                order: 0,
                commandPointCost: 1,
                location: [1, 0],
            };

            const player1 = buildPlayer1({ ships: [occupyingShip, ship], commandPoints: 2, maxCommandPoints: 2 });
            const player2 = buildPlayer2({ ships: [] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [occupyingShip, ship],
                hulls: [occupyingHull],
                cards: [],
                decks: [],
                winners: [],
                isOver: false,
            });

            const next = new ActionResolver("player1", gameState).resolveAction(deployAction);

            // invalid → engine.run is a no-op: nothing deployed, no hull, CP untouched, not recorded
            const attempted = next.ships.find((s) => s.id === "shipD");
            expect(attempted?.deployed).toBe(false);
            expect(next.hulls?.some((h) => h.shipId === "shipD")).toBe(false);
            const player = next.players.find((p) => p.id === "player1");
            expect(player?.commandPoints).toBe(2);
            expect(player?.pendingActions?.map((a) => a.id)).not.toContain("dep-occupied");
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
                targetCell: [0, 0],
            };

            const moveAction2: IMoveAction = {
                id: "action2",
                type: ActionTypes.MOVE,
                playerId: "player2",
                shipId: "ship2",
                round: 1,
                order: 0,
                commandPointCost: 1,
                targetCell: [0, 0],
            };

            const player1 = buildPlayer1({ ships: [], pendingActions: [moveAction1] });
            const player2 = buildPlayer2({ ships: [], pendingActions: [moveAction2] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [],
                hulls: [],
                cards: [],
                decks: [],
                actions: [moveAction1, moveAction2],
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
                targetCell: [0, 0],
            };

            const moveAction2: IMoveAction = {
                id: "action2",
                type: ActionTypes.MOVE,
                playerId: "player2",
                shipId: "ship2",
                round: 1,
                order: 0,
                commandPointCost: 1,
                targetCell: [0, 0],
            };

            const player1 = buildPlayer1({ ships: [], pendingActions: [moveAction1, moveAction2] });
            const player2 = buildPlayer2({ ships: [], pendingActions: [moveAction2] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player2",
                players: [player1, player2],
                ships: [],
                hulls: [],
                cards: [],
                decks: [],
                actions: [moveAction1, moveAction2],
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

    describe("hand refill on round resolution", () => {
        const makeCard = (id: string, deckId: string): ICard => ({
            id,
            deckId,
            instanceId: `${id}-instance`,
            kind: CardKind.Ship,
            refNo: "frigate0",
        });

        it("refills both players' hands to MAX_HAND_SIZE when resolve completes", () => {
            const p1Cards = ["p1-c1", "p1-c2", "p1-c3", "p1-c4", "p1-c5"].map((id) => makeCard(id, "deck-1"));
            const p2Cards = ["p2-c1", "p2-c2"].map((id) => makeCard(id, "deck-2"));

            const p1Deck: IDeck = {
                id: "deck-1",
                playerId: "player1",
                faction: Faction.THE_UNITED_DEFENSE_FLEET,
                cards: p1Cards,
                played: [],
            };
            const p2Deck: IDeck = {
                id: "deck-2",
                playerId: "player2",
                faction: Faction.THE_UNITED_DEFENSE_FLEET,
                cards: p2Cards,
                played: [],
            };

            const player1 = buildPlayer1({ deck: "deck-1", hand: [] });
            const player2 = buildPlayer2({ deck: "deck-2", hand: [] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [],
                hulls: [],
                cards: [...p1Cards, ...p2Cards],
                decks: [p1Deck, p2Deck],
                winners: [],
                isOver: false,
            });

            const { gameState: resolved } = new ActionResolver("player1", gameState).resolve();

            const refilledP1 = resolved.players.find((p) => p.id === "player1");
            const refilledP2 = resolved.players.find((p) => p.id === "player2");
            expect(refilledP1?.hand).toEqual(["p1-c1", "p1-c2", "p1-c3", "p1-c4"]);
            // p2 deck only has 2 cards — draws what's available, no error
            expect(refilledP2?.hand).toEqual(["p2-c1", "p2-c2"]);
            expect(refilledP1?.hand.length).toBe(MAX_HAND_SIZE);

            const refilledP1Deck = resolved.decks.find((d) => d.id === "deck-1");
            expect(refilledP1Deck?.cards.map((c) => c.id)).toEqual(["p1-c5"]);
            const refilledP2Deck = resolved.decks.find((d) => d.id === "deck-2");
            expect(refilledP2Deck?.cards).toEqual([]);
        });

        it("does not refill when the game is over", () => {
            const cards = ["c1", "c2"].map((id) => makeCard(id, "deck-1"));
            const deck: IDeck = {
                id: "deck-1",
                playerId: "player1",
                faction: Faction.THE_UNITED_DEFENSE_FLEET,
                cards,
                played: [],
            };

            const player1 = buildPlayer1({ deck: "deck-1", hand: [] });
            const player2 = buildPlayer2({ deck: "", hand: [] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [],
                hulls: [],
                cards,
                decks: [deck],
                winners: ["player2"],
                isOver: true,
            });

            new ActionResolver("player1", gameState).resolveHandRefill();

            const p1 = gameState.players.find((p) => p.id === "player1");
            expect(p1?.hand).toEqual([]);
            expect(gameState.decks[0].cards.map((c) => c.id)).toEqual(["c1", "c2"]);
        });
    });

    describe("resolveAction (PlayCard: Ship card → Deploy)", () => {
        const buildPlayCardAction = (overrides: Partial<IPlayCardAction> = {}): IPlayCardAction => ({
            id: "play-action-1",
            type: ActionTypes.PLAY_CARD,
            playerId: "player1",
            round: 1,
            order: 0,
            commandPointCost: 1,
            cardId: "card-ship",
            payload: {
                kind: "Ship",
                location: [1, 0],
            },
            ...overrides,
        });

        const buildShipCardEntities = () => {
            const card: ICard = {
                id: "card-ship",
                deckId: "deck-1",
                instanceId: "ship1",
                kind: CardKind.Ship,
                refNo: "frigate0",
            };
            const deck: IDeck = {
                id: "deck-1",
                playerId: "player1",
                faction: Faction.THE_UNITED_DEFENSE_FLEET,
                cards: [],
                played: [],
            };
            // Undeployed ship — no hulls yet. Deploy derives them from the template.
            const ship = shipBuilder.build({
                id: "ship1",
                playerId: "player1",
                deployed: false,
                hulls: [],
                commandPointCost: 1,
                hullTemplates: [frigateTemplate],
            });
            return { card, deck, ship };
        };

        it("deploys the ship, removes the card from hand, and pushes it onto the deck's played pile", () => {
            const { card, deck, ship } = buildShipCardEntities();
            const player1 = buildPlayer1({
                ships: [ship],
                hand: ["card-ship"],
                deck: "deck-1",
            });
            const player2 = buildPlayer2();

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [ship],
                hulls: [],
                cards: [card],
                decks: [deck],
                winners: [],
                isOver: false,
            });

            const action = buildPlayCardAction({
                payload: {
                    kind: "Ship",
                    location: [1, 0],
                },
            });

            const resolver = new ActionResolver("player1", gameState);
            const next = resolver.resolveAction(action);

            const resolvedShip = next.ships.find((s) => s.id === "ship1");
            expect(resolvedShip?.deployed).toBe(true);
            expect(resolvedShip?.hulls?.[0].location).toEqual([1, 0]);

            const resolvedPlayer = next.players.find((p) => p.id === "player1");
            expect(resolvedPlayer?.hand).toEqual([]);
            expect(resolvedPlayer?.pendingActions?.map((a) => a.id)).toEqual([action.id]);
            expect(resolvedPlayer?.pendingActions?.[0].type).toBe(ActionTypes.PLAY_CARD);

            const resolvedDeck = next.decks.find((d) => d.id === "deck-1");
            expect(resolvedDeck?.played.map((c) => c.id)).toEqual(["card-ship"]);

            // Audit trail keeps the PlayCardAction; the deploy is signals, not an action.
            expect(next.actions?.map((a) => a.type)).toEqual([ActionTypes.PLAY_CARD]);
        });

        it("no-ops a ship-card play onto an occupied tile (PlayCardValidator): card stays in hand, nothing deployed", () => {
            const { card, deck, ship } = buildShipCardEntities();
            // player1 already occupies the target tile [1,0] in its own deploy row
            const occupyingHull = hullBuilder.build({
                id: "hullOcc",
                shipId: "shipOcc",
                location: [1, 0],
                front: true,
            });
            const occupyingShip = shipBuilder.build({
                id: "shipOcc",
                playerId: "player1",
                deployed: true,
                hulls: [occupyingHull],
            });

            const player1 = buildPlayer1({ ships: [occupyingShip, ship], hand: ["card-ship"], deck: "deck-1" });
            const player2 = buildPlayer2();

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [occupyingShip, ship],
                hulls: [occupyingHull],
                cards: [card],
                decks: [deck],
                winners: [],
                isOver: false,
            });

            const action = buildPlayCardAction({ payload: { kind: "Ship", location: [1, 0] } });
            const next = new ActionResolver("player1", gameState).resolveAction(action);

            // invalid → engine.run is a clean no-op: card retained, nothing deployed/played/recorded
            expect(next.ships.find((s) => s.id === "ship1")?.deployed).toBe(false);
            expect(next.players.find((p) => p.id === "player1")?.hand).toEqual(["card-ship"]);
            expect(next.decks.find((d) => d.id === "deck-1")?.played).toEqual([]);
            expect(next.actions ?? []).toEqual([]);
        });

        it("no-ops a play of a card that is not in the player's hand (PlayCardValidator)", () => {
            const { card, deck, ship } = buildShipCardEntities();
            const player1 = buildPlayer1({ ships: [ship], hand: [], deck: "deck-1" });
            const player2 = buildPlayer2();

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [ship],
                hulls: [],
                cards: [card],
                decks: [deck],
                winners: [],
                isOver: false,
            });

            const action = buildPlayCardAction();
            const next = new ActionResolver("player1", gameState).resolveAction(action);

            // card-in-hand check now lives in PlayCardValidator → invalid play is a clean no-op
            expect(next.ships.find((s) => s.id === "ship1")?.deployed).toBe(false);
            expect(next.actions ?? []).toEqual([]);
        });
    });

    describe("resolveAction (PlayCard: Support card → Flare)", () => {
        const buildFlareCardEntities = () => {
            const card: ICard = {
                id: "card-flare",
                deckId: "deck-1",
                instanceId: "card-flare",
                kind: CardKind.Support,
                refNo: "flare",
            };
            const deck: IDeck = {
                id: "deck-1",
                playerId: "player1",
                faction: Faction.THE_UNITED_DEFENSE_FLEET,
                cards: [],
                played: [],
            };
            return { card, deck };
        };

        it("plays Flare, persists a vision Effect, deducts CP, and reveals the target tile to the playing player", () => {
            const { card, deck } = buildFlareCardEntities();
            // Place an opponent hull at [1,1] so we can verify visibility leakage
            // through the persisted Flare Effect.
            const opponentHull = hullBuilder.build({
                id: "opp-hull",
                shipId: "opp-ship",
                location: [1, 1],
                front: true,
            });
            const opponentShip = shipBuilder.build({
                id: "opp-ship",
                playerId: "player2",
                deployed: true,
                hulls: [opponentHull],
            });
            const player1 = buildPlayer1({
                hand: ["card-flare"],
                deck: "deck-1",
                commandPoints: 2,
                maxCommandPoints: 2,
            });
            const player2 = buildPlayer2({ ships: [opponentShip] });

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [opponentShip],
                hulls: [opponentHull],
                cards: [card],
                decks: [deck],
                winners: [],
                isOver: false,
            });

            const action: IPlayCardAction = {
                id: "play-flare-1",
                type: ActionTypes.PLAY_CARD,
                playerId: "player1",
                round: 1,
                order: 0,
                commandPointCost: 1,
                cardId: "card-flare",
                payload: {
                    kind: "Support",
                    targetCell: [1, 1],
                },
            };

            const resolver = new ActionResolver("player1", gameState);
            const next = resolver.resolveAction(action);

            // Effect is persisted with the right ownership, kind, and lifetime.
            expect(next.effects).toHaveLength(1);
            const effect = next.effects[0];
            expect(effect.refNo).toBe("flare_persistent");
            expect(effect.playerId).toBe("player1");
            expect(effect.kind).toBe("vision");
            expect(effect.createdOnRound).toBe(1);
            expect(effect.expiresAfterRound).toBe(3); // duration 2 → currentRound + (duration)

            // CP deducted, card moved hand → played.
            const resolvedPlayer = next.players.find((p) => p.id === "player1");
            expect(resolvedPlayer?.commandPoints).toBe(1);
            expect(resolvedPlayer?.hand).toEqual([]);
            const resolvedDeck = next.decks.find((d) => d.id === "deck-1");
            expect(resolvedDeck?.played.map((c) => c.id)).toEqual(["card-flare"]);

            // Player1 sees the centered tile via the Flare Effect.
            const visibleTiles = next.getVisibleTilesforPlayer("player1");
            expect(visibleTiles.has("1/1")).toBe(true);
        });

        it("expires the persistent Flare Effect after its lifetime is up", () => {
            const { card, deck } = buildFlareCardEntities();
            const player1 = buildPlayer1({
                hand: ["card-flare"],
                deck: "deck-1",
                commandPoints: 2,
                maxCommandPoints: 2,
            });
            const player2 = buildPlayer2();

            const gameState = new GameState({
                code: "TEST",
                currentRound: 1,
                initiative: "player1",
                players: [player1, player2],
                ships: [],
                hulls: [],
                cards: [card],
                decks: [deck],
                winners: [],
                isOver: false,
            });

            const action: IPlayCardAction = {
                id: "play-flare-1",
                type: ActionTypes.PLAY_CARD,
                playerId: "player1",
                round: 1,
                order: 0,
                commandPointCost: 1,
                cardId: "card-flare",
                payload: { kind: "Support", targetCell: [0, 0] },
            };

            const resolver = new ActionResolver("player1", gameState);
            resolver.resolveAction(action);
            expect(resolver.gameState.effects).toHaveLength(1);

            // Simulate the round advancing past expiry.
            resolver.gameState.update({});
            resolver.gameState.currentRound = 4;
            resolver.resolveExpiredEffects();
            expect(resolver.gameState.effects).toHaveLength(0);
        });
    });
});
