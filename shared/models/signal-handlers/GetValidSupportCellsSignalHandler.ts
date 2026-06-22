import { CardKind } from "@shared/config/constants";
import { IGetValidSupportCellsQueryCtx } from "@shared/types/types";
import type { SupportCard } from "../SupportCard";
import { QuerySignalHandler } from "./QuerySignalHandler";

export class GetValidSupportCellsSignalHandler extends QuerySignalHandler<IGetValidSupportCellsQueryCtx> {
    handle(ctx: IGetValidSupportCellsQueryCtx) {
        // type-only SupportCard import (erased at runtime) avoids the
        // CardEntity → handler → SupportCard → Card → CardEntity import cycle.
        const card = ctx.gsm.gameState.cards.find((c) => c.id === ctx.signal.payload.cardId);
        if (!card || card.kind !== CardKind.Support) {
            return ctx.resolve({ validCells: [], requiresTarget: false });
        }
        (card as SupportCard).getValidTargetCells(ctx);
    }
}
