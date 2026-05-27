import { IReceiveShipAttackSignalHandleCtx, ISignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";
import { IShipReceiveAttackSignalPayload } from "../signals/types";

export class ReceiveShipAttackSignalHandler extends SignalHandler {
    handle(ctx: IReceiveShipAttackSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { senderId } = ctx.signal.payload as IShipReceiveAttackSignalPayload;

        const ship = gsm.getShip(senderId);

        const newState = ship.receiveAttack(ctx);

        saveNewState(newState);
    }
}
