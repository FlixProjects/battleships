import { IHull } from "../types";
import {
    ITurnEvent,
    TurnEventKind,
    isCardPlayedEvent,
    isEffectAppliedEvent,
    isHullsDamagedEvent,
    isShipDeployedEvent,
    isShipDestroyedEvent,
    isShipMovedEvent,
} from "../turn-event-types";

// Minimal serializable hull stub — this is a types test, not a domain test.
const hullStub = { id: "h1", shipId: "s1", location: [0, 0], destroyed: false } as unknown as IHull;

const sampleEvents: ITurnEvent[] = [
    { kind: TurnEventKind.ShipDeployed, playerId: "p1", shipId: "s1", hulls: [hullStub] },
    {
        kind: TurnEventKind.ShipMoved,
        playerId: "p1",
        shipId: "s1",
        hulls: [{ hullId: "h1", from: [0, 0], to: [0, 1] }],
        route: [
            [0, 0],
            [0, 1],
        ],
    },
    { kind: TurnEventKind.HullsDamaged, playerId: "p2", shipsHit: { s1: ["h1", "h2"] } },
    { kind: TurnEventKind.ShipDestroyed, playerId: "p2", shipId: "s1" },
    { kind: TurnEventKind.EffectApplied, playerId: "p1", effectId: "e1", refNo: "flare" },
    { kind: TurnEventKind.CardPlayed, playerId: "p1", cardId: "c1" },
];

describe("turn-event-types", () => {
    it("survives a JSON serialization round-trip unchanged", () => {
        for (const event of sampleEvents) {
            expect(JSON.parse(JSON.stringify(event))).toEqual(event);
        }
    });

    it("type guards match exactly one event kind each", () => {
        const guards = [
            isShipDeployedEvent,
            isShipMovedEvent,
            isHullsDamagedEvent,
            isShipDestroyedEvent,
            isEffectAppliedEvent,
            isCardPlayedEvent,
        ];
        // sampleEvents is ordered to match the guard order one-to-one.
        sampleEvents.forEach((event, eventIndex) => {
            guards.forEach((guard, guardIndex) => {
                expect(guard(event)).toBe(eventIndex === guardIndex);
            });
        });
    });

    it("is exhaustively switchable on `kind`", () => {
        const describeEvent = (event: ITurnEvent): string => {
            switch (event.kind) {
                case TurnEventKind.ShipDeployed:
                    return event.shipId;
                case TurnEventKind.ShipMoved:
                    return event.shipId;
                case TurnEventKind.HullsDamaged:
                    return Object.keys(event.shipsHit).join();
                case TurnEventKind.ShipDestroyed:
                    return event.shipId;
                case TurnEventKind.EffectApplied:
                    return event.refNo;
                case TurnEventKind.CardPlayed:
                    return event.cardId;
                default: {
                    // Compile-time exhaustiveness: a new kind without a case
                    // makes this assignment fail to type-check.
                    const _exhaustive: never = event;
                    return _exhaustive;
                }
            }
        };

        expect(sampleEvents.map(describeEvent)).toEqual(["s1", "s1", "s1", "s1", "flare", "c1"]);
    });
});
