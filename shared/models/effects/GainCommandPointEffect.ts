import { EFFECT_REF_NO } from "@shared/config/constants";
import { IEffect, ISignalHandleCtx } from "@shared/index";
import { registerEffect } from "@shared/utils/effect-helper";
import { Effect } from "./Effect";

export class GainCommandPointEffect extends Effect {
    constructor(props: Readonly<IEffect>) {
        super(props);
    }

    public resolve(_ctx: ISignalHandleCtx): void {
        const { gsm } = _ctx;

        const player = gsm.getPlayer(this.playerId);
        player.gainCommandPoints(1);
    }
}

registerEffect(EFFECT_REF_NO.gainCommandPoint, GainCommandPointEffect);
