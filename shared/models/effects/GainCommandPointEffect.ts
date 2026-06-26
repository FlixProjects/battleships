import { EFFECT_REF_NO } from "@shared/config/constants";
import { EffectKind, ICommandPointEffect, IEffect, ISignalHandleCtx } from "@shared/index";
import { registerEffect } from "@shared/utils/effect-helper";
import { Effect } from "./Effect";

export class GainCommandPointEffect extends Effect {
    public commandPointAmount: number;

    constructor(props: Readonly<IEffect>) {
        super(props);
    }

    public resolve(ctx: ISignalHandleCtx): void {
        const { gsm } = ctx;
        const player = gsm.getPlayer(this.playerId);
        player.gainCommandPoints(this.commandPointAmount);
    }

    public toPlain(): ICommandPointEffect {
        return { ...super.toPlain(), kind: EffectKind.CommandPoint, commandPointAmount: this.commandPointAmount };
    }
}

registerEffect(EFFECT_REF_NO.gainCommandPoint, GainCommandPointEffect);
