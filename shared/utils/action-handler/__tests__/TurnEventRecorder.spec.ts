import { CardKind, EFFECT_REF_NO, Faction, SUPPORT_REF_NO } from "../../../config/constants";
import { GameStateBuilder } from "../../../factories/game-state-builder";
import { HullBuilder } from "../../../factories/hull-builder";
import { PlayerBuilder } from "../../../factories/player-builder";
import { ShipBuilder } from "../../../factories/ship-builder";
import { GameEngine } from "../../../models/GameEngine";
import { GameStateManager } from "../../../models/GameStateManager";
import { BasicShipMoveSignal } from "../../../models/signals/BasicShipMoveSignal";
import { GamePersistentEffectsTickSignal } from "../../../models/signals/GamePersistentEffectsTickSignal";
import { PlayCardSignal } from "../../../models/signals/PlayCardSignal";
import { EffectAnchor, EffectKind, ICard, IDeck, TurnEventKind, isShipMovedEvent } from "../../../types";
import { TurnEventRecorder } from "../TurnEventRecorder";

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

const buildRecordingEngine = (gameState: ReturnType<GameStateBuilder["build"]>) => {
    const recorder = new TurnEventRecorder();
    const engine = new GameEngine(gameState, GameStateManager);
    engine.setSignalObserver(recorder.observe);
    return { recorder, engine };
};

describe("TurnEventRecorder — airstrike detonation cascade", () => {
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

    it("records EffectDetonated → HullDamaged → ShipDestroyed, in cascade order", () => {
        const { recorder, engine } = buildRecordingEngine(buildDetonationState());

        engine.runWithSignal(new GamePersistentEffectsTickSignal());

        expect(recorder.collect().map((e) => e.kind)).toEqual([
            TurnEventKind.EffectDetonated,
            TurnEventKind.HullDamaged,
            TurnEventKind.ShipDestroyed,
        ]);
    });

    it("enriches each event from the signal + pre-mutation state", () => {
        const { recorder, engine } = buildRecordingEngine(buildDetonationState());

        engine.runWithSignal(new GamePersistentEffectsTickSignal());

        const [detonated, damaged, destroyed] = recorder.collect();
        expect(detonated).toMatchObject({
            playerId: "player1",
            effectId: "airstrike-2-3",
            refNo: EFFECT_REF_NO.airstrike,
            location: [2, 3],
        });
        expect(damaged).toMatchObject({
            playerId: "player2", // the hull's owner, not the strike's caster
            shipId: "victimShip",
            hullId: "victim",
            location: [2, 3],
        });
        expect(destroyed).toMatchObject({ shipId: "victimShip", hullIds: ["victim"], locations: [[2, 3]] });
    });

    it("does not record ShipDestroyed while the ship still has live hulls", () => {
        const frontHull = hullBuilder.build({ id: "front", shipId: "flagship", location: [2, 3], front: true });
        const rearHull = hullBuilder.build({ id: "rear", shipId: "flagship", location: [2, 4] });
        const flagship = shipBuilder.build({
            id: "flagship",
            playerId: "player2",
            isFlagship: true,
            hulls: [frontHull, rearHull],
        });
        const gameState = gameStateBuilder.build({
            currentRound: 2,
            players: [buildPlayer1.build(), buildPlayer2.build({ ships: [flagship] })],
            ships: [flagship],
            hulls: [frontHull, rearHull],
            effects: [airstrikeEffectAt([2, 3])], // hits only the front hull
        });
        const { recorder, engine } = buildRecordingEngine(gameState);

        engine.runWithSignal(new GamePersistentEffectsTickSignal());

        const kinds = recorder.collect().map((e) => e.kind);
        expect(kinds).toContain(TurnEventKind.HullDamaged);
        expect(kinds).not.toContain(TurnEventKind.ShipDestroyed);
    });
});

describe("TurnEventRecorder — ship movement", () => {
    const buildMoveState = () => {
        const hull = hullBuilder.build({ id: "h1", shipId: "s1", location: [2, 3], front: true });
        const ship = shipBuilder.build({ id: "s1", playerId: "player1", hulls: [hull], remainingMovement: 2 });
        return gameStateBuilder.build({
            players: [buildPlayer1.build({ ships: [ship] }), buildPlayer2.build()],
            ships: [ship],
            hulls: [hull],
        });
    };

    const route: [number, number][] = [
        [2, 3],
        [2, 4],
    ];

    const runMove = (engine: GameEngine) =>
        engine.runWithSignal(
            new BasicShipMoveSignal({
                targetId: "s1",
                payload: { shipId: "s1", targetCell: [2, 4], route },
            }),
        );

    it("records ShipMoved with per-hull from/to filled by the HullMove cascade", () => {
        const { recorder, engine } = buildRecordingEngine(buildMoveState());

        runMove(engine);

        const events = recorder.collect();
        expect(events.map((e) => e.kind)).toEqual([TurnEventKind.ShipMoved]);
        expect(events[0]).toMatchObject({
            playerId: "player1",
            shipId: "s1",
            startingOrientation: 0,
            hulls: [{ hullId: "h1", from: [2, 3], to: [2, 4] }],
            route,
        });
    });

    it("stamps visibility per viewer and truncates the route to the visible segment", () => {
        const { recorder, engine } = buildRecordingEngine(buildMoveState());
        runMove(engine);

        recorder.stampVisibility({
            player1: new Set(), // owner: sees own event regardless of tiles
            player2: new Set(["2/4"]), // sees only the destination tile
        });

        const [moved] = recorder.collect();
        expect(moved.visibleToPlayerIds).toEqual(["player1", "player2"]);
        if (!isShipMovedEvent(moved)) throw new Error("expected a ShipMoved event");
        expect(moved.visibleRouteByPlayer).toEqual({ player2: [[2, 4]] });
    });

    it("excludes a viewer who saw none of the move", () => {
        const { recorder, engine } = buildRecordingEngine(buildMoveState());
        runMove(engine);

        recorder.stampVisibility({ player1: new Set(), player2: new Set(["0/0"]) });

        const [moved] = recorder.collect();
        expect(moved.visibleToPlayerIds).toEqual(["player1"]);
        if (!isShipMovedEvent(moved)) throw new Error("expected a ShipMoved event");
        expect(moved.visibleRouteByPlayer).toBeUndefined();
    });

    it("stamps each event only once (later stamps cover only newer events)", () => {
        const { recorder, engine } = buildRecordingEngine(buildMoveState());
        runMove(engine);
        recorder.stampVisibility({ player1: new Set(), player2: new Set(["2/4"]) });

        // A later, blind stamp must not overwrite the earlier per-event snapshot.
        recorder.stampVisibility({ player1: new Set(), player2: new Set() });

        expect(recorder.collect()[0].visibleToPlayerIds).toEqual(["player1", "player2"]);
    });
});

describe("TurnEventRecorder — card play", () => {
    it("records CardPlayed (owner-only visibility) when a support card resolves", () => {
        const card: ICard = {
            id: "card-airstrike",
            deckId: "deck-1",
            instanceId: "card-airstrike",
            kind: CardKind.Support,
            refNo: SUPPORT_REF_NO.airstrike,
            name: "Airstrike",
            commandPointCost: 1,
            effectTemplates: [
                {
                    refNo: EFFECT_REF_NO.airstrike,
                    kind: EffectKind.Damage,
                    anchor: EffectAnchor.AnyTile,
                    range: 1,
                    damage: 1,
                    duration: 1,
                    existsOnBoard: true,
                },
            ],
        };
        const deck: IDeck = {
            id: "deck-1",
            playerId: "player1",
            faction: Faction.THE_UNITED_DEFENSE_FLEET,
            cards: [],
            played: [],
        };
        const gameState = gameStateBuilder.build({
            players: [
                buildPlayer1.build({ hand: ["card-airstrike"], deck: "deck-1", commandPoints: 2, maxCommandPoints: 2 }),
                buildPlayer2.build(),
            ],
            cards: [card],
            decks: [deck],
        });
        const { recorder, engine } = buildRecordingEngine(gameState);

        engine.runWithSignal(
            new PlayCardSignal({
                targetId: "card-airstrike",
                payload: {
                    playerId: "player1",
                    cardPayload: { kind: "Support", targetCell: [2, 3], orientation: "horizontal" },
                },
            }),
        );
        recorder.stampVisibility({ player1: new Set(), player2: new Set(["2/3"]) });

        const cardPlayed = recorder.collect().find((e) => e.kind === TurnEventKind.CardPlayed);
        expect(cardPlayed).toMatchObject({ playerId: "player1", cardId: "card-airstrike", cardName: "Airstrike" });
        expect(cardPlayed?.visibleToPlayerIds).toEqual(["player1"]); // no location → hand-private
    });
});
