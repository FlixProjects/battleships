import { v7 as uuidv7 } from "uuid";
import { Effect } from "../models/effects/Effect";
import { EffectKind, IEffect, IEffectConfig, IVisionEffectPayload } from "../types";

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

export const buildInactiveEffect = (args: {
    effectConfig: IEffectConfig;
    playerId: string;
    cardId: string;
}): Effect => {
    const { effectConfig, playerId, cardId } = args;

    const payload =
        effectConfig.kind === EffectKind.Vision
            ? ({ kind: EffectKind.Vision, range: effectConfig.range } as IVisionEffectPayload)
            : ({ kind: EffectKind.CommandPoint, amount: 0 } as const);

    const plain: IEffect = {
        id: uuidv7(),
        refNo: effectConfig.refNo,
        kind: effectConfig.kind,
        sourceCardId: cardId,
        playerId,
        duration: effectConfig.duration,
        isActive: false,
        createdOnRound: 0,
        expiresAfterRound: undefined,
        existsOnBoard: effectConfig.existsOnBoard,
        payload,
        location: undefined,
    };
    return createEffect(plain);
};
