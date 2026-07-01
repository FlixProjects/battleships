import { EFFECT_REF_NO, SHIP_REF_NO } from "../../config/constants";
import { GameStateBuilder } from "../../factories/game-state-builder";
import { HullBuilder } from "../../factories/hull-builder";
import { PlayerBuilder } from "../../factories/player-builder";
import { ShipBuilder } from "../../factories/ship-builder";
import { EffectKind, IDeployAction, IEffect, IHullTemplate, IPlayer, IShipAttackAction, TShipRefNo } from "../../types";
import { ActionTypes } from "../../types/action-types";
import { createEffect } from "../../utils/effect-helper";
import { ActionResolver } from "../../utils/action-handler/ActionResolver";
import { Attack } from "../Attack";
import { ArmorPiercingRoundsEffect } from "../effects/ArmorPiercingRoundsEffect";

const buildPlayer1 = (overrides?: Partial<IPlayer>) => new PlayerBuilder({ id: "player1", name: "Player 1" }).build(overrides);
const buildPlayer2 = (overrides?: Partial<IPlayer>) =>
    new PlayerBuilder({ id: "player2", name: "Player 2", order: 1 }).build(overrides);

const shipBuilder = new ShipBuilder({ refNo: "frigate0", name: "Frigate", deployed: true });
const hullBuilder = new HullBuilder({ visionRange: 2 });
const gameStateBuilder = new GameStateBuilder();

const frigateTemplate: IHullTemplate = {
    templateLocation: [0, 0],
    maxHealth: 1,
    armor: 0,
    visionRange: 2,
    orientation: 0,
    front: true,
};

const buildArmorPiercingEffect = (attachedEntityId: string): IEffect & { attachedEntityId: string } => ({
    id: `ap-${attachedEntityId}`,
    refNo: EFFECT_REF_NO.armorPiercingRounds,
    kind: EffectKind.AttackBuff,
    playerId: "player1",
    duration: 999,
    isActive: true,
    createdOnRound: 1,
    existsOnBoard: false,
    attachedEntityId,
});

// Run a single frigate-on-frigate attack, optionally seeding board effects.
const resolveAttack = (opts: { effects?: IEffect[]; targetArmor: number; targetHealth: number }) => {
    const attackerHull = hullBuilder.build({ id: "hullA", shipId: "shipA", location: [1, 1], front: true });
    const targetHull = hullBuilder.build({
        id: "hullB",
        shipId: "shipB",
        location: [0, 0],
        front: true,
        armor: opts.targetArmor,
        remainingHealth: opts.targetHealth,
        maxHealth: opts.targetHealth,
    });
    const attackerShip = shipBuilder.build({ id: "shipA", playerId: "player1", hulls: [attackerHull] });
    const targetShip = shipBuilder.build({ id: "shipB", playerId: "player2", hulls: [targetHull] });

    const attackAction: IShipAttackAction = {
        id: "atk",
        type: ActionTypes.ATTACK,
        playerId: "player1",
        shipId: "shipA",
        round: 1,
        order: 0,
        commandPointCost: 1,
        attackLocations: [[0, 0]],
    };

    const gameState = gameStateBuilder.build({
        players: [buildPlayer1({ ships: [attackerShip], commandPoints: 2, maxCommandPoints: 2 }), buildPlayer2({ ships: [targetShip] })],
        ships: [attackerShip, targetShip],
        hulls: [attackerHull, targetHull],
        effects: opts.effects,
    });

    return new ActionResolver("player1", gameState).resolveAction(attackAction);
};

describe("ArmorPiercingRoundsEffect", () => {
    describe("Hull.getDamaged", () => {
        it("bypasses armor and reduces health directly when the attack ignores armor", () => {
            const hull = hullBuilder.build({ id: "h", shipId: "s", armor: 2, remainingHealth: 3, maxHealth: 3 });

            hull.getDamaged(new Attack({ originId: "s", targetId: "h", damage: 2, isIgnoreArmor: true }));

            expect(hull.armor).toBe(2); // untouched — the round passed through
            expect(hull.remainingHealth).toBe(1);
            expect(hull.destroyed).toBe(false);
        });

        it("depletes armor before health for a normal attack", () => {
            const hull = hullBuilder.build({ id: "h", shipId: "s", armor: 2, remainingHealth: 3, maxHealth: 3 });

            hull.getDamaged(new Attack({ originId: "s", targetId: "h", damage: 3 }));

            expect(hull.armor).toBe(0); // 2 of the 3 damage soaked by armor
            expect(hull.remainingHealth).toBe(2); // 1 overflow reached health
        });
    });

    describe("serialization", () => {
        it("preserves attachedEntityId through a toPlain → createEffect round-trip", () => {
            const effect = new ArmorPiercingRoundsEffect({
                ...buildArmorPiercingEffect("shipX"),
                id: "ap",
            });

            const plain = effect.toPlain();
            expect(plain.attachedEntityId).toBe("shipX");

            const rehydrated = createEffect(plain);
            expect(rehydrated).toBeInstanceOf(ArmorPiercingRoundsEffect);
            expect((rehydrated as ArmorPiercingRoundsEffect).appliesToAttacker("shipX")).toBe(true);
        });
    });

    describe("attack cascade", () => {
        it("pierces the target's armor when the buff is attached to the attacking ship", () => {
            const next = resolveAttack({ effects: [buildArmorPiercingEffect("shipA")], targetArmor: 1, targetHealth: 1 });

            const target = next.hulls?.find((h) => h.id === "hullB");
            expect(target?.armor).toBe(1); // armor intact
            expect(target?.remainingHealth).toBe(0); // health hit directly
            expect(target?.destroyed).toBe(true);
        });

        it("is absorbed by armor when the attacker has no buff", () => {
            const next = resolveAttack({ targetArmor: 1, targetHealth: 1 });

            const target = next.hulls?.find((h) => h.id === "hullB");
            expect(target?.armor).toBe(0); // armor soaked the hit
            expect(target?.remainingHealth).toBe(1);
            expect(target?.destroyed).toBe(false);
        });

        it("does not pierce when the buff is attached to a different ship", () => {
            const next = resolveAttack({ effects: [buildArmorPiercingEffect("shipZ")], targetArmor: 1, targetHealth: 1 });

            const target = next.hulls?.find((h) => h.id === "hullB");
            expect(target?.armor).toBe(0);
            expect(target?.remainingHealth).toBe(1);
            expect(target?.destroyed).toBe(false);
        });
    });

    describe("destroyer deploy", () => {
        it("grants the deploying tudf_destroyer0 an ArmorPiercingRoundsEffect bound to it", () => {
            const destroyer = shipBuilder.build({
                id: "shipDestroyer",
                playerId: "player1",
                refNo: SHIP_REF_NO.tudf_destroyer0 as TShipRefNo,
                deployed: false,
                hulls: [],
                commandPointCost: 1,
                hullTemplates: [frigateTemplate],
            });

            const deployAction: IDeployAction = {
                id: "dep-destroyer",
                type: ActionTypes.DEPLOY,
                playerId: "player1",
                shipId: "shipDestroyer",
                round: 1,
                order: 0,
                commandPointCost: 1,
                location: [1, 0],
            };

            const gameState = gameStateBuilder.build({
                players: [buildPlayer1({ ships: [destroyer], commandPoints: 2, maxCommandPoints: 2 }), buildPlayer2({ ships: [] })],
                ships: [destroyer],
            });

            const next = new ActionResolver("player1", gameState).resolveAction(deployAction);

            const buff = next.effects?.find((e) => e.refNo === EFFECT_REF_NO.armorPiercingRounds);
            expect(buff).toBeInstanceOf(ArmorPiercingRoundsEffect);
            expect((buff as ArmorPiercingRoundsEffect).appliesToAttacker("shipDestroyer")).toBe(true);
        });
    });
});
