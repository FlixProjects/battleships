import { v7 as uuidv7 } from "uuid";
import { EFFECTS_CONFIG } from "../config/constants";
import { Effect } from "../models/effects/Effect";
import { ICellLoc, IEffect, IEffectOverride, IEffectTemplate, TEffectPayload, TEffectRefNo } from "../types";

type EffectConstructor = new (props: Readonly<IEffect>) => Effect;

/**
 * Registry mapping each persisted Effect `refNo` to its concrete Effect
 * subclass. Concrete Effects register themselves here so the system stays
 * open for extension (Flare, FlarePersistent, GainCommandPoint, …) without
 * touching the base Effect class.
 */
const effectConstructors = new Map<string, EffectConstructor>();

export const registerEffect = (refNo: string, ctor: EffectConstructor): void => {
    effectConstructors.set(refNo, ctor);
};

export const createEffect = (props: Readonly<IEffect>): Effect => {
    const Ctor = effectConstructors.get(props.refNo);
    if (!Ctor) {
        throw new Error(`Unknown effect refNo '${props.refNo}' for effect ${props.id}`);
    }
    return new Ctor(props);
};

export const hasEffect = (refNo: string): boolean => effectConstructors.has(refNo);

/**
 * Resolve a Support's effect reference into a concrete template: the
 * `EFFECTS_CONFIG` default merged with the Support's kind-typed overrides.
 * Persisted on the SupportCard at game creation.
 */
export const resolveEffectTemplate = (override: IEffectOverride): IEffectTemplate => {
    const base = EFFECTS_CONFIG[override.refNo as TEffectRefNo];
    if (!base) {
        throw new Error(`resolveEffectTemplate: unknown effect refNo '${override.refNo}'`);
    }
    if (base.kind !== override.kind) {
        throw new Error(
            `resolveEffectTemplate: effect '${override.refNo}' is kind '${base.kind}' but its override declares '${override.kind}'`,
        );
    }
    return { ...base, ...override.overrides } as IEffectTemplate;
};

/**
 * Mint a live, active Effect from a resolved template when its Support card is
 * played. The caller (a SupportCard subclass) supplies the kind-specific
 * payload; expiry is derived from the template's duration (0 = one-shot).
 */
export const buildEffect = (args: {
    template: IEffectTemplate;
    payload: TEffectPayload;
    playerId: string;
    sourceCardId: string;
    currentRound: number;
    targetCell?: ICellLoc;
}): Effect => {
    const { template, payload, playerId, sourceCardId, currentRound, targetCell } = args;

    const plain: IEffect = {
        id: uuidv7(),
        refNo: template.refNo,
        kind: template.kind,
        sourceCardId,
        playerId,
        duration: template.duration,
        isActive: true,
        createdOnRound: currentRound,
        expiresAfterRound: template.duration > 0 ? currentRound + template.duration : undefined,
        existsOnBoard: template.existsOnBoard,
        payload,
        location: targetCell,
    };
    return createEffect(plain);
};
