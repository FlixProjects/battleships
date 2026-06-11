import { IBasicShipMoveSignalHandleCtx } from "@shared/types/types";
import { SignalHandler } from "./SignalHandler";

export class BasicShipMoveSignalHandler extends SignalHandler {
    handle(ctx: IBasicShipMoveSignalHandleCtx) {
        const { gsm, saveNewState } = ctx;
        const { shipId } = ctx.signal.payload;

        const ship = gsm.getShip(shipId);

        const newState = ship.move(ctx);

        saveNewState(newState);
    }
}
