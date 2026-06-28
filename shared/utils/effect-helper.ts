import { EFFECTS_CONFIG } from "../config/constants";
import { Effect } from "../models/effects/Effect";
import { IEffect, IEffectOverride, IEffectTemplate, TEffectRefNo } from "../types";

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
 * Only used at game creation time to create plain effects
 */
export const resolveEffectTemplate = (override: IEffectOverride): IEffectTemplate => {
    const base = EFFECTS_CONFIG[override.refNo as TEffectRefNo];
    if (!base) {
        throw new Error(`resolveEffectTemplate: unknown effect refNo '${override.refNo}'`);
    }
    return { ...base, ...override } as IEffectTemplate;
};