import { IGetValidDeployCellsQueryCtx } from "@shared/types/types";
import { QuerySignalHandler } from "./QuerySignalHandler";

export class GetValidDeployCellsSignalHandler extends QuerySignalHandler<IGetValidDeployCellsQueryCtx> {
    handle(ctx: IGetValidDeployCellsQueryCtx) {
        const ship = ctx.gsm.getShip(ctx.signal.payload.shipId);
        ship.getValidDeployCells(ctx);
    }
}
