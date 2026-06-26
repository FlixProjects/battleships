import { IGetValidAttackCellsQueryCtx } from "@shared/types/types";
import { QuerySignalHandler } from "./QuerySignalHandler";

export class GetValidAttackCellsSignalHandler extends QuerySignalHandler<IGetValidAttackCellsQueryCtx> {
    handle(ctx: IGetValidAttackCellsQueryCtx) {
        const ship = ctx.gsm.getShip(ctx.signal.payload.shipId);
        ship.getValidAttackCells(ctx);
    }
}
