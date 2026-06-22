import { IGetValidMoveRoutesQueryCtx } from "@shared/types/types";
import { QuerySignalHandler } from "./QuerySignalHandler";

export class GetValidMoveRoutesSignalHandler extends QuerySignalHandler<IGetValidMoveRoutesQueryCtx> {
    handle(ctx: IGetValidMoveRoutesQueryCtx) {
        const ship = ctx.gsm.getShip(ctx.signal.payload.shipId);
        ship.getValidMoveRoutes(ctx);
    }
}
