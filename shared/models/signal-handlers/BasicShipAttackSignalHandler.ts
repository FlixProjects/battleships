import { IBasicShipAttackSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class BasicShipAttackSignalHandler extends SignalHandler {
    handle(ctx: IBasicShipAttackSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { attackingShipId } = ctx.signal.payload;

        const ship = gsm.getShip(attackingShipId);

        const newState = ship.attack(ctx);

        saveNewState(newState);
    }
}
