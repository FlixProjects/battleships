import { GameStateBuilder } from "@shared/factories/game-state-builder";
import { HullBuilder } from "@shared/factories/hull-builder";
import { PlayerBuilder } from "@shared/factories/player-builder";
import { ShipBuilder } from "@shared/factories/ship-builder";
import { EFFECT_REF_NO } from "@shared/config/constants";
import {
    EffectKind,
    ICellLoc,
    IPlainGameState,
    IShipMovedEvent,
    ITurnEvent,
    TurnEventKind,
} from "@shared/types";
import clone from "lodash.clonedeep";
import { PlaybackStateApplier } from "../PlaybackStateApplier";

// Factory (not an inline literal) so the damage-effect fields aren't
// excess-property-checked against the IEffect union.
const airstrikeEffect = () => ({
    id: "fx1",
    refNo: EFFECT_REF_NO.airstrike,
    kind: EffectKind.Damage,
    playerId: "player2",
    duration: 1,
    isActive: true,
    createdOnRound: 1,
    expiresAfterRound: 2,
    existsOnBoard: true,
    location: [2, 2] as ICellLoc,
    damage: 1,
});

const buildFinalPlainState = (): IPlainGameState => {
    const hull = new HullBuilder({ remainingHealth: 1, maxHealth: 1, armor: 0 }).build({
        id: "hull1",
        shipId: "ship1",
        location: [2, 2],
        orientation: 180,
        front: true,
    });
    const ship = new ShipBuilder({ refNo: "frigate0", name: "Frigate", deployed: true }).build({
        id: "ship1",
        playerId: "player1",
        hulls: [hull],
    });
    return new GameStateBuilder()
        .build({
            players: [
                new PlayerBuilder({ id: "player1", name: "P1" }).build({ ships: [ship] }),
                new PlayerBuilder({ id: "player2", name: "P2", order: 1 }).build(),
            ],
            ships: [ship],
            hulls: [hull],
            effects: [airstrikeEffect()],
        })
        .toPlain();
};

const moveEvent = (from: ICellLoc, to: ICellLoc): IShipMovedEvent => ({
    kind: TurnEventKind.ShipMoved,
    playerId: "player1",
    visibleToPlayerIds: ["player1", "player2"],
    shipId: "ship1",
    startingOrientation: 0,
    hulls: [{ hullId: "hull1", from, to }],
    route: [from, to],
});

describe("PlaybackStateApplier", () => {
    it("moves the hull to the event's `to` and takes the final orientation", () => {
        const finalState = buildFinalPlainState();
        const playback = clone(finalState);
        playback.hulls[0].location = [2, 0];
        playback.hulls[0].orientation = 0;
        const events: ITurnEvent[] = [moveEvent([2, 0], [2, 2])];

        new PlaybackStateApplier(finalState, events).apply(playback, 0);

        expect(playback.hulls[0].location).toEqual([2, 2]);
        expect(playback.hulls[0].orientation).toBe(180);
    });

    it("spawns a missing ship at its move's `from` (entering vision mid-turn)", () => {
        const finalState = buildFinalPlainState();
        const playback = clone(finalState);
        // The ship was hidden at round start: absent from the viewer's snapshot.
        playback.ships = [];
        playback.hulls = [];
        playback.players[0].ships = [];
        const events: ITurnEvent[] = [moveEvent([2, 0], [2, 2])];
        const applier = new PlaybackStateApplier(finalState, events);

        expect(applier.ensurePresence(playback, 0)).toBe(true);

        expect(playback.ships.map((s) => s.id)).toEqual(["ship1"]);
        expect(playback.hulls[0].location).toEqual([2, 0]);
        expect(playback.hulls[0].orientation).toBe(0); // the move's startingOrientation
        expect(playback.players[0].ships).toContain("ship1");

        // Already present → nothing to spawn.
        expect(applier.ensurePresence(playback, 0)).toBe(false);
    });

    it("spawns a deploy at the later move's `from`, not the final location", () => {
        const finalState = buildFinalPlainState();
        const playback = clone(finalState);
        playback.ships = [];
        playback.hulls = [];
        playback.players[0].ships = [];
        const events: ITurnEvent[] = [
            {
                kind: TurnEventKind.ShipDeployed,
                playerId: "player1",
                visibleToPlayerIds: ["player1"],
                shipId: "ship1",
                location: [2, 0],
            },
            moveEvent([2, 0], [2, 2]),
        ];

        new PlaybackStateApplier(finalState, events).apply(playback, 0);

        expect(playback.hulls[0].location).toEqual([2, 0]);
    });

    it("marks the ship destroyed and drops the detonated effect", () => {
        const finalState = buildFinalPlainState();
        const playback = clone(finalState);
        const events: ITurnEvent[] = [
            {
                kind: TurnEventKind.EffectDetonated,
                playerId: "player2",
                visibleToPlayerIds: ["player1", "player2"],
                effectId: "fx1",
                refNo: EFFECT_REF_NO.airstrike,
                location: [2, 2],
            },
            {
                kind: TurnEventKind.ShipDestroyed,
                playerId: "player1",
                visibleToPlayerIds: ["player1", "player2"],
                shipId: "ship1",
                hullIds: ["hull1"],
                locations: [[2, 2]],
            },
        ];
        const applier = new PlaybackStateApplier(finalState, events);

        applier.apply(playback, 0);
        expect(playback.effects.map((e) => e.id)).toEqual([]);

        applier.apply(playback, 1);
        expect(playback.ships[0].destroyed).toBe(true);
    });
});
