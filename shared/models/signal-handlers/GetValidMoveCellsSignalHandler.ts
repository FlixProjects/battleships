import { IGetValidMoveCellsQueryCtx } from "@shared/types/types";
import { QuerySignalHandler } from "./QuerySignalHandler";

export class GetValidMoveCellsSignalHandler extends QuerySignalHandler<IGetValidMoveCellsQueryCtx> {
    handle(ctx: IGetValidMoveCellsQueryCtx) {
        const ship = ctx.gsm.getShip(ctx.signal.payload.shipId);
        ship.getValidMoveCells(ctx);
    }
}
