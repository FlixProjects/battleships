import { EFFECT_REF_NO, SHIP_REF_NO } from "@shared/config/constants";
import { ArmorPiercingRoundsEffect } from "@shared/models/effects/ArmorPiercingRoundsEffect";
import { GameCreateEffectSignal } from "@shared/models/signals/GameCreateEffectSignal";
import { EffectKind, IBasicShipDeploySignalHandleCtx } from "@shared/types/types";
import type { ShipConstructor } from "@shared/utils/ship-helper";
import { v7 as uuidv7 } from "uuid";

export function TUDF_Destroyer<TBase extends ShipConstructor>(Base: TBase) {
    return class extends Base {
        refNo = SHIP_REF_NO.tudf_destroyer0;

        protected onDeploy(ctx: IBasicShipDeploySignalHandleCtx) {
            const { emitter, gsm } = ctx;

            const createdOnRound = gsm.getCurrentRound();
            const effect = new ArmorPiercingRoundsEffect({
                id: uuidv7(),
                attachedEntityId: this.id,
                refNo: EFFECT_REF_NO.armorPiercingRounds,
                kind: EffectKind.AttackBuff,
                playerId: this.playerId,
                isActive: true,
                createdOnRound,
                existsOnBoard: false,
            });
            emitter([new GameCreateEffectSignal({ payload: { effect } })]);
            return;
        }
    };
}
