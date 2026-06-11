import { v7 as uuidv7 } from "uuid";
import { Effect } from "../models/effects/Effect";
import { EffectKind, ICellLoc, IEffect, IEffectConfig, IVisionEffectPayload } from "../types";

type EffectConstructor = new (props: Readonly<IEffect>) => Effect;

/**
 * Registry mapping each persisted Effect `refNo` to its concrete Effect
 * subclass. Concrete Effects register themselves here so the system stays
 * open for extension (Flare, FlarePersistent, GrantCommandPoint, …) without
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
 * Build a concrete Effect from its config + the play context. Pure (no gsm) so
 * both the legacy resolver path and `SupportCard.play` (signal cascade) can use
 * it. `expiresAfterRound` is set only for effects with a positive duration.
 */
export const buildEffect = (args: {
    effectConfig: IEffectConfig;
    playerId: string;
    cardId: string;
    targetCell?: ICellLoc;
    currentRound: number;
}): Effect => {
    const { effectConfig, playerId, cardId, targetCell, currentRound } = args;
    const expiresAfterRound = effectConfig.duration > 0 ? currentRound + effectConfig.duration : undefined;

    const payload =
        effectConfig.kind === EffectKind.Vision
            ? buildVisionPayload(effectConfig, targetCell)
            : ({ kind: EffectKind.CommandPoint, amount: 0 } as const);

    const plain: IEffect = {
        id: uuidv7(),
        refNo: effectConfig.refNo,
        kind: effectConfig.kind,
        sourceCardId: cardId,
        playerId,
        createdOnRound: currentRound,
        expiresAfterRound,
        existsOnBoard: effectConfig.existsOnBoard,
        payload,
        location: targetCell,
    };
    return createEffect(plain);
};

const buildVisionPayload = (effectConfig: IEffectConfig, targetCell?: ICellLoc): IVisionEffectPayload => {
    if (!targetCell) {
        throw new Error(`Vision Effect '${effectConfig.refNo}' requires a targetCell`);
    }
    return {
        kind: EffectKind.Vision,
        center: targetCell,
        range: effectConfig.range,
    };
};
