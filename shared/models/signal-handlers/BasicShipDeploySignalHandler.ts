import { IBasicShipDeploySignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class BasicShipDeploySignalHandler extends SignalHandler {
    handle(ctx: IBasicShipDeploySignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { shipId } = ctx.signal.payload;

        const ship = gsm.getShip(shipId);

        const newState = ship.deploy(ctx);

        saveNewState(newState);
    }
}
