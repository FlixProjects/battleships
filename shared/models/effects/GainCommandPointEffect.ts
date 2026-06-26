import { EFFECT_REF_NO } from "@shared/config/constants";
import { ICommandPointEffectPayload, IEffect, ISignalHandleCtx } from "@shared/index";
import { registerEffect } from "@shared/utils/effect-helper";
import { Effect } from "./Effect";

export class GainCommandPointEffect extends Effect {
    constructor(props: Readonly<IEffect>) {
        super(props);
    }

    public resolve(ctx: ISignalHandleCtx): void {
        const { gsm } = ctx;
        const { amount } = this.payload as ICommandPointEffectPayload;

        const player = gsm.getPlayer(this.playerId);
        player.gainCommandPoints(amount);
    }
}

registerEffect(EFFECT_REF_NO.gainCommandPoint, GainCommandPointEffect);
