import { EFFECT_REF_NO } from "../../config/constants";
import { GameStateBuilder } from "../../factories/game-state-builder";
import { HullBuilder } from "../../factories/hull-builder";
import { PlayerBuilder } from "../../factories/player-builder";
import { ShipBuilder } from "../../factories/ship-builder";
import { EffectKind, ISignalHandleCtx } from "../../types";
import { GameStateManager } from "../GameStateManager";
import { GameEngine } from "../GameEngine";
import { GamePersistentEffectsTickSignal } from "../signals/GamePersistentEffectsTickSignal";
import { SignalType } from "../signals/types";

const gameStateBuilder = new GameStateBuilder();
const hullBuilder = new HullBuilder({ remainingHealth: 1, maxHealth: 1, armor: 0 });
const shipBuilder = new ShipBuilder({ refNo: "frigate0", name: "Frigate", deployed: true });

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

const buildTickableState = () => {
    const victimHull = hullBuilder.build({ id: "victim", shipId: "victimShip", location: [2, 3], front: true });
    const victimShip = shipBuilder.build({ id: "victimShip", playerId: "player2", hulls: [victimHull] });
    return gameStateBuilder.build({
        currentRound: 2,
        players: [
            new PlayerBuilder({ id: "player1", name: "P1" }).build(),
            new PlayerBuilder({ id: "player2", name: "P2", order: 1 }).build({ ships: [victimShip] }),
        ],
        ships: [victimShip],
        hulls: [victimHull],
        effects: [airstrikeEffectAt([2, 3])],
    });
};

describe("GameEngine signal observer", () => {
    it("sees every drained cascade signal exactly once, in resolution order", () => {
        const observed: ISignalHandleCtx[] = [];
        const engine = new GameEngine(buildTickableState(), GameStateManager);
        engine.setSignalObserver((ctx) => observed.push(ctx));

        engine.runWithSignal(new GamePersistentEffectsTickSignal());

        const types = observed.map((ctx) => ctx.signal.type);
        expect(types[0]).toBe(SignalType.GamePersistentEffectsTick);
        expect(types).toContain(SignalType.EffectAttackLocation);
        expect(types).toContain(SignalType.HullReceiveDamage);
        expect(types.indexOf(SignalType.EffectAttackLocation)).toBeLessThan(
            types.indexOf(SignalType.HullReceiveDamage),
        );

        const ids = observed.map((ctx) => ctx.signal.id);
        expect(new Set(ids).size).toBe(ids.length); // each signal observed once
    });

    it("observes each signal with its pre-mutation state", () => {
        let hullDestroyedAtDamageTime: boolean | undefined;
        const engine = new GameEngine(buildTickableState(), GameStateManager);
        engine.setSignalObserver((ctx) => {
            if (ctx.signal.type !== SignalType.HullReceiveDamage) return;
            hullDestroyedAtDamageTime = ctx.gsm.getHull("victim").destroyed;
        });

        const resolved = engine.runWithSignal(new GamePersistentEffectsTickSignal());

        expect(hullDestroyedAtDamageTime).toBe(false); // damage not yet applied when observed
        expect(resolved.hulls?.find((h) => h.id === "victim")?.destroyed).toBe(true); // …but it does apply
    });

    it("is a no-op when unset and detachable via setSignalObserver(undefined)", () => {
        const observed: ISignalHandleCtx[] = [];
        const engine = new GameEngine(buildTickableState(), GameStateManager);
        engine.setSignalObserver((ctx) => observed.push(ctx));
        engine.setSignalObserver(undefined);

        const resolved = engine.runWithSignal(new GamePersistentEffectsTickSignal());

        expect(observed).toHaveLength(0);
        expect(resolved.hulls?.find((h) => h.id === "victim")?.destroyed).toBe(true);
    });
});
