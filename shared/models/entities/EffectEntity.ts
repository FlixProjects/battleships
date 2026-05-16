import { ICellLoc, IEffect, TEffectKind, TEffectPayload } from "../../types";
import { Entity } from "./Entity";

export class EffectEntity extends Entity<EffectEntity> implements IEffect {
    id: string;
    refNo: string;
    kind: TEffectKind;
    sourceCardId: string;
    playerId: string;
    createdOnRound: number;
    expiresAfterRound?: number;
    payload: TEffectPayload;
    existsOnBoard: boolean;
    // extra
    isVisible = false;
    location?: ICellLoc;

    constructor(props: Readonly<IEffect>) {
        super();
        Object.assign(this, props);
    }
}
