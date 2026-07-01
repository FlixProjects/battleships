import {
    IHull,
    IHullMoveSignalHandleCtx,
    IHullReceiveAttackSignalHandleCtx,
    IHullReceiveDamageSignalHandleCtx,
} from "../types";
import { locationToKey, reduceToZero } from "../utils";
import type { Attack } from "./Attack";
import { HullEntity } from "./entities/HullEntity";
import { Resolver } from "./resolvers/Resolver";
import { HullDestroyedSignal } from "./signals/HullDestroyedSignal";
import { HullReceiveDamageSignal } from "./signals/HullReceiveDamageSignal";

export class Hull extends HullEntity {
    constructor(props: Readonly<IHull>) {
        super(props);
    }

    updateVisibility(visibleTiles: Set<string>) {
        this.isVisible = visibleTiles.has(locationToKey(this.location));
        return this.isVisible;
    }

    getDamaged(attack: Attack) {
        const damageToHealth = attack.isIgnoreArmor ? attack.damage : this.absorbWithArmor(attack.damage);
        this.remainingHealth = reduceToZero(this.remainingHealth, damageToHealth).value;
        if (this.remainingHealth <= 0) {
            this.destroyed = true;
        }
    }

    // Armor soaks damage first; returns the overflow that reaches the hull's health.
    private absorbWithArmor(incomingDamage: number): number {
        const armorResult = reduceToZero(this.armor, incomingDamage);
        this.armor = armorResult.value;
        return armorResult.leftover;
    }

    // ===============================================================================
    // signal functions
    // ===============================================================================

    // The attack reaches this hull — the interceptable moment (shields / wards
    // would transform the incoming Attack here). Default behaviour forwards the
    // Attack unchanged to a HullReceiveDamage signal.
    receiveAttack(ctx: IHullReceiveAttackSignalHandleCtx) {
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { attack } = signal.payload;

            emitter([
                new HullReceiveDamageSignal({
                    targetId: this.id,
                    senderId: this.id,
                    originId: signal.id,
                    payload: { hullId: this.id, attack },
                }),
            ]);

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    // The committed damage mutation. When this kills the hull, tell the owning
    // ship so it can re-derive its destroyed state (cross-boundary → signal).
    receiveDamage(ctx: IHullReceiveDamageSignalHandleCtx) {
        const { gsm, signal, emitter } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { attack } = signal.payload;

            this.getDamaged(attack);

            if (this.destroyed) {
                emitter([
                    new HullDestroyedSignal({
                        targetId: this.shipId,
                        senderId: this.id,
                        originId: signal.id,
                        payload: { hullId: this.id, shipId: this.shipId },
                    }),
                ]);
            }

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    // The ship computes the layout and emits per-hull positions; the hull just
    // stores its own location / orientation.
    move(ctx: IHullMoveSignalHandleCtx) {
        const { gsm, signal } = ctx;

        const resolver = new Resolver(gsm.gameState, () => {
            const { location, orientation } = signal.payload;

            this.location = location;
            this.orientation = orientation;

            return gsm.gameState;
        });

        return resolver.resolve();
    }

    /** IHull is its own plain shape — no children to flatten. */
    public toPlain(): IHull {
        return { ...this };
    }

    public static toDomain(plain: IHull): Hull {
        return new Hull(plain);
    }
}
