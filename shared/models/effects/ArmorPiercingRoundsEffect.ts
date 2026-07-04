import type { IPlainEffect, ISignalHandleCtx } from "../../types";
import { EFFECT_REF_NO } from "../../config/constants";
import { registerEffect } from "../../utils/effect-helper";
import { Effect } from "./Effect";

/** Persisted shape carries the owning ship so the buff re-binds after hydration. */
export interface IPlainArmorPiercingRoundsEffect extends IPlainEffect {
    attachedEntityId: string;
}

/**
 * Innate ship buff (e.g. `tudf_destroyer0`): attacks from the ship it is
 * attached to bypass the target's armor. Passive — it shapes the attack at
 * fire time (read in `Ship.attack`), so there is no on-play or per-round impact.
 */
export class ArmorPiercingRoundsEffect extends Effect {
    attachedEntityId: string;

    constructor(props: Readonly<IPlainEffect & { attachedEntityId?: string }>) {
        super(props);
        if (props.attachedEntityId === undefined) {
            throw new Error(`ArmorPiercingRoundsEffect ${props.id} created without attachedEntityId`);
        }
        this.attachedEntityId = props.attachedEntityId;
    }

    public appliesToAttacker(shipId: string): boolean {
        return this.attachedEntityId === shipId;
    }

    public resolve(_ctx: ISignalHandleCtx): void {
        // Passive — no on-play impact to emit.
    }

    public resolveTick(_ctx: ISignalHandleCtx): void {
        // Passive — applied at attack time, no per-round mutation.
    }

    public toPlain(): IPlainArmorPiercingRoundsEffect {
        return { ...super.toPlain(), attachedEntityId: this.attachedEntityId };
    }
}

registerEffect(EFFECT_REF_NO.armorPiercingRounds, ArmorPiercingRoundsEffect);
