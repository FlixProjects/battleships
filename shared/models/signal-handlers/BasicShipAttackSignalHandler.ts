import { IBasicShipAttackSignalHandleCtx } from "@shared/types/types";
import { IShipAttackSignalPayload } from "../signals/types";
import { SignalHandler } from "./SignalHandler";

export class BasicShipAttackSignalHandler extends SignalHandler {
    handle(ctx: IBasicShipAttackSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { senderId } = ctx.signal.payload as IShipAttackSignalPayload;

        const ship = gsm.getShip(senderId);

        const newState = ship.attack(ctx);

        saveNewState(newState);
    }
}
