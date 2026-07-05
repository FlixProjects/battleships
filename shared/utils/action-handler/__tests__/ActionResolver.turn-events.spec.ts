import { EFFECT_REF_NO } from "../../../config/constants";
import { GameStateBuilder } from "../../../factories/game-state-builder";
import { HullBuilder } from "../../../factories/hull-builder";
import { PlayerBuilder } from "../../../factories/player-builder";
import { ShipBuilder } from "../../../factories/ship-builder";
import { GameState } from "../../../models/GameState";
import { ActionTypes, EffectKind, IMoveAction, TurnEventKind, isShipMovedEvent } from "../../../types";
import { ActionResolver } from "../ActionResolver";

const gameStateBuilder = new GameStateBuilder();
const hullBuilder = new HullBuilder({ remainingHealth: 1, maxHealth: 1, armor: 0 });
const shipBuilder = new ShipBuilder({ refNo: "frigate0", name: "Frigate", deployed: true });

const buildPlayer1 = new PlayerBuilder({ id: "player1", name: "P1" });
const buildPlayer2 = new PlayerBuilder({ id: "player2", name: "P2", order: 1 });

const airstrikeEffectAt = (location: [number, number]) => ({
    id: `airstrike-${location.join("-")}`,
    refNo: EFFECT_REF_NO.airstrike,
    kind: EffectKind.Damage,
    playerId: "player1",
    duration: 1,
    isActive: true,
    createdOnRound: 1,
    expiresAfterRound: 2,
    existsOnBoard: true,
    location,
    damage: 1,
});

describe("ActionResolver — turn-event recording (authoritative path)", () => {
    const buildDetonationState = () => {
        const victimHull = hullBuilder.build({ id: "victim", shipId: "victimShip", location: [2, 3], front: true });
        const victimShip = shipBuilder.build({ id: "victimShip", playerId: "player2", hulls: [victimHull] });
        return gameStateBuilder.build({
            currentRound: 2,
            players: [buildPlayer1.build(), buildPlayer2.build({ ships: [victimShip] })],
            ships: [victimShip],
            hulls: [victimHull],
            effects: [airstrikeEffectAt([2, 3])],
        });
    };

    it("stamps lastTurnEvents + lastResolvedRound on the resolved state when recording", () => {
        const { gameState } = new ActionResolver("player1", buildDetonationState(), {
            recordTurnEvents: true,
        }).resolve();

        expect(gameState.lastResolvedRound).toBe(2);
        expect(gameState.lastTurnEvents.map((e) => e.kind)).toEqual([
            TurnEventKind.EffectDetonated,
            TurnEventKind.HullDamaged,
            TurnEventKind.ShipDestroyed,
        ]);
        // Victim's hull grants vision over its own tile → both players see it all.
        gameState.lastTurnEvents.forEach((event) => {
            expect(event.visibleToPlayerIds).toEqual(expect.arrayContaining([event.playerId]));
        });
    });

    it("events survive a toPlain → rehydrate round trip", () => {
        const { gameState } = new ActionResolver("player1", buildDetonationState(), {
            recordTurnEvents: true,
        }).resolve();

        const rehydrated = GameState.toDomain(gameState.toPlain());

        expect(rehydrated.lastResolvedRound).toBe(2);
        expect(rehydrated.lastTurnEvents).toEqual(gameState.lastTurnEvents);
    });

    it("records nothing on the recorder-less (optimistic) path", () => {
        const { gameState } = new ActionResolver("player1", buildDetonationState()).resolve();

        expect(gameState.lastTurnEvents).toEqual([]);
        expect(gameState.lastResolvedRound).toBeUndefined();
    });

    it("prunes events the viewer could not see; the caster keeps their own", () => {
        // Strike lands far outside player2's vision; player2's only hull sits at [0,0].
        const farHull = hullBuilder.build({
            id: "far",
            shipId: "farShip",
            location: [0, 0],
            front: true,
            visionRange: 1,
        });
        const farShip = shipBuilder.build({ id: "farShip", playerId: "player2", hulls: [farHull] });
        const gameState = gameStateBuilder.build({
            currentRound: 2,
            players: [buildPlayer1.build(), buildPlayer2.build({ ships: [farShip] })],
            ships: [farShip],
            hulls: [farHull],
            effects: [airstrikeEffectAt([4, 6])],
        });

        const { gameState: resolved, obscuredGameState } = new ActionResolver("player1", gameState, {
            recordTurnEvents: true,
        }).resolve();

        // The caster (resolving as player1) keeps their own detonation…
        expect(obscuredGameState.lastTurnEvents.map((e) => e.kind)).toEqual([TurnEventKind.EffectDetonated]);

        // …while player2's view of the same authoritative state drops it (get-game path).
        const { obscuredGameState: player2View } = new ActionResolver("player2", resolved).resolveVisibility();
        expect(player2View.lastTurnEvents).toEqual([]);
    });

    it("truncates a partially-seen opponent move and strips the per-viewer map", () => {
        const route: [number, number][] = [
            [2, 0],
            [2, 1],
            [2, 2],
        ];
        const moverHull = hullBuilder.build({ id: "mover", shipId: "moverShip", location: [2, 0], front: true });
        const moverShip = shipBuilder.build({
            id: "moverShip",
            playerId: "player1",
            hulls: [moverHull],
            remainingMovement: 2,
        });
        // Player2's watcher sees only [2,2] (vision 1 from [2,3], minus its own tile ring).
        const watcherHull = hullBuilder.build({
            id: "watcher",
            shipId: "watcherShip",
            location: [2, 3],
            front: true,
            visionRange: 1,
        });
        const watcherShip = shipBuilder.build({ id: "watcherShip", playerId: "player2", hulls: [watcherHull] });

        const moveAction: IMoveAction = {
            id: "move-1",
            type: ActionTypes.MOVE,
            playerId: "player1",
            round: 1,
            order: 0,
            commandPointCost: 1,
            shipId: "moverShip",
            targetCell: [2, 2],
            route,
        };
        const gameState = gameStateBuilder.build({
            players: [
                buildPlayer1.build({ ships: [moverShip], pendingActions: [moveAction] }),
                buildPlayer2.build({ ships: [watcherShip] }),
            ],
            ships: [moverShip, watcherShip],
            hulls: [moverHull, watcherHull],
            // pendingActions hydrate as FK ids resolved against `actions`.
            actions: [moveAction],
        });

        const { gameState: resolved } = new ActionResolver("player1", gameState, {
            recordTurnEvents: true,
        }).resolve();

        const { obscuredGameState: player2View } = new ActionResolver("player2", resolved).resolveVisibility();
        const moved = player2View.lastTurnEvents.find(isShipMovedEvent);
        if (!moved) throw new Error("expected player2 to receive the ShipMoved event");

        expect(moved.route).toEqual([[2, 2]]); // only the visible segment
        expect(moved.hulls).toEqual([{ hullId: "mover", from: [2, 2], to: [2, 2] }]); // clamped onto it
        expect(moved.visibleRouteByPlayer).toBeUndefined(); // per-viewer map never leaves the server

        // The authoritative state keeps the full story.
        const authoritative = resolved.lastTurnEvents.find(isShipMovedEvent);
        expect(authoritative?.route).toEqual(route);
    });
});
