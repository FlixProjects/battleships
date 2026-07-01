import type { IEffect } from "@shared/types";

export interface IAttackProps {
    originId: string;
    targetId: string;
    damage: number;
    effects?: IEffect[];
    isIgnoreArmor?: boolean;
}

/**
 * A single hull-targeted hit. Built in `Ship.attack`, threaded through the
 * attack signal cascade, and discarded once the cascade drains — it is never
 * part of `GameState` and never serialized. Bundling the shaping `effects` and
 * derived flags here keeps damage resolution on `Hull` a pure read of the hit.
 */
export class Attack {
    originId: string; // attacking Ship.id
    targetId: string; // target Hull.id — an AoE hit spawns one Attack per hull
    damage: number;
    effects: IEffect[];
    isIgnoreArmor: boolean;

    constructor(props: IAttackProps) {
        this.originId = props.originId;
        this.targetId = props.targetId;
        this.damage = props.damage;
        this.effects = props.effects ?? [];
        this.isIgnoreArmor = props.isIgnoreArmor ?? false;
    }
}
