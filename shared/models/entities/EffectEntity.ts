import { IEffect, TEffectKind, TEffectPayload } from "../../types";
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

    constructor(props: Readonly<IEffect>) {
        super();
        this.id = props.id;
        this.refNo = props.refNo;
        this.kind = props.kind;
        this.sourceCardId = props.sourceCardId;
        this.playerId = props.playerId;
        this.createdOnRound = props.createdOnRound;
        this.expiresAfterRound = props.expiresAfterRound;
        this.payload = props.payload;
    }
}
