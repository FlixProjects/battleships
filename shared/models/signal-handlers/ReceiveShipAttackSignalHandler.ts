import { IReceiveShipAttackSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class ReceiveShipAttackSignalHandler extends SignalHandler {
    handle(ctx: IReceiveShipAttackSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { attackedShipId } = ctx.signal.payload;

        const ship = gsm.getShip(attackedShipId);

        const newState = ship.receiveAttack(ctx);

        saveNewState(newState);
    }
}
