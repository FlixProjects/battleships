import {
    ITurnEvent,
    TurnEventKind,
    isCardPlayedEvent,
    isEffectDetonatedEvent,
    isHullDamagedEvent,
    isShipAttackedEvent,
    isShipDeployedEvent,
    isShipDestroyedEvent,
    isShipMovedEvent,
} from "../turn-event-types";

const sampleEvents: ITurnEvent[] = [
    {
        kind: TurnEventKind.ShipDeployed,
        playerId: "p1",
        visibleToPlayerIds: ["p1"],
        shipId: "s1",
        location: [0, 0],
    },
    {
        kind: TurnEventKind.ShipMoved,
        playerId: "p1",
        visibleToPlayerIds: ["p1", "p2"],
        shipId: "s1",
        startingOrientation: 0,
        hulls: [{ hullId: "h1", from: [0, 0], to: [0, 1] }],
        route: [
            [0, 0],
            [0, 1],
        ],
        visibleRouteByPlayer: { p2: [[0, 1]] },
    },
    {
        kind: TurnEventKind.ShipAttacked,
        playerId: "p2",
        visibleToPlayerIds: ["p2"],
        shipId: "s2",
        origin: [3, 3],
        targetLocations: [[0, 1]],
    },
    {
        kind: TurnEventKind.HullDamaged,
        playerId: "p2",
        visibleToPlayerIds: ["p1", "p2"],
        shipId: "s1",
        hullId: "h1",
        location: [0, 1],
    },
    {
        kind: TurnEventKind.ShipDestroyed,
        playerId: "p2",
        visibleToPlayerIds: ["p1", "p2"],
        shipId: "s1",
        hullIds: ["h1"],
        locations: [[0, 1]],
    },
    {
        kind: TurnEventKind.EffectDetonated,
        playerId: "p1",
        visibleToPlayerIds: ["p1", "p2"],
        effectId: "e1",
        refNo: "airstrike",
        location: [2, 3],
    },
    {
        kind: TurnEventKind.CardPlayed,
        playerId: "p1",
        visibleToPlayerIds: ["p1"],
        cardId: "c1",
        cardName: "Airstrike",
    },
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
            isShipAttackedEvent,
            isHullDamagedEvent,
            isShipDestroyedEvent,
            isEffectDetonatedEvent,
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
                case TurnEventKind.ShipAttacked:
                    return event.shipId;
                case TurnEventKind.HullDamaged:
                    return event.hullId;
                case TurnEventKind.ShipDestroyed:
                    return event.shipId;
                case TurnEventKind.EffectDetonated:
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

        expect(sampleEvents.map(describeEvent)).toEqual(["s1", "s1", "s2", "h1", "s1", "airstrike", "c1"]);
    });
});
