import { IReceiveEffectAttackLocationSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

/**
 * The struck Ship receives the effect hit and re-enters the standard damage
 * cascade (delegates to `Ship.receiveEffectAttack`, mirroring how
 * `ReceiveShipAttack` delegates to `Ship.receiveAttack`).
 */
export class ReceiveEffectAttackLocationSignalHandler extends SignalHandler {
    handle(ctx: IReceiveEffectAttackLocationSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { shipId } = ctx.signal.payload;

        const ship = gsm.getShip(shipId);
        const newState = ship.receiveEffectAttack(ctx);

        saveNewState(newState);
    }
}
