import { v7 as uuidv7 } from "uuid";
import { SUPPORT_REF_NO } from "../../config/constants";
import {
    ICardSelectionHandlers,
} from "../Card";
import {
    ICellLoc,
    IGetValidSupportCellsQueryCtx,
    IMEvent,
    IMEventType,
    LineOrientation,
    PlaySupportLineIMEvent,
} from "../../types";
import { keyToLocation } from "../../utils/helpers";
import { createEffect } from "../../utils/effect-helper";
import { registerSupportCard } from "../../utils/support-card-helper";
import { Effect } from "../effects/Effect";
import { ICreateEffectsArgs, SupportCard } from "../SupportCard";

/**
 * Line-targeted bombardment. The player picks a center tile they can see and an
 * orientation; this mints one delayed-damage Effect per on-board tile of the
 * resulting 3-tile line (center ± 1). Each Effect detonates once on the next
 * persistent-effects tick.
 */
export class AirstrikeCard extends SupportCard {
    protected createEffects({
        playerId,
        targetCell,
        orientation,
        currentRound,
        boardDimensions,
    }: ICreateEffectsArgs): Effect[] {
        if (!targetCell) return [];

        const template = this.effectTemplates[0];
        if (!template) return [];

        const lineTiles = this.expandLine(targetCell, orientation, boardDimensions);

        return lineTiles.map((location) =>
            createEffect({
                id: uuidv7(),
                sourceCardId: this.id,
                playerId,
                isActive: true,
                createdOnRound: currentRound,
                expiresAfterRound:
                    template.duration && template.duration > 0 ? currentRound + template.duration : undefined,
                ...(location ? { location } : {}),
                ...template,
            }),
        );
    }

    /** center ± 1 along the chosen axis, dropping tiles that fall off the board. */
    private expandLine(
        center: ICellLoc,
        orientation: ICreateEffectsArgs["orientation"],
        { rows, cols }: { rows: number; cols: number },
    ): ICellLoc[] {
        const [cx, cy] = center;
        const offsets: ICellLoc[] =
            orientation === LineOrientation.Vertical
                ? [
                      [0, -1],
                      [0, 0],
                      [0, 1],
                  ]
                : [
                      [-1, 0],
                      [0, 0],
                      [1, 0],
                  ];

        return offsets
            .map(([dx, dy]) => [cx + dx, cy + dy] as ICellLoc)
            .filter(([x, y]) => x >= 0 && x < cols && y >= 0 && y < rows);
    }

    /** Any tile the player currently has vision on is a valid strike center. */
    public getValidTargetCells(ctx: IGetValidSupportCellsQueryCtx) {
        const { gsm, resolve } = ctx;
        const { playerId } = ctx.signal.payload;

        const visibleTiles = gsm.gameState.getVisibleTilesforPlayer(playerId);
        const validCells = Array.from(visibleTiles).map((key) => keyToLocation(key));

        resolve({ validCells, requiresTarget: true });
    }

    public getSelectionEvent(handlers: ICardSelectionHandlers): IMEvent {
        const event: PlaySupportLineIMEvent = {
            type: IMEventType.PLAY_SUPPORT_LINE,
            cardId: this.id,
            effectIndex: 0,
            ...handlers,
        };
        return event;
    }
}

registerSupportCard(SUPPORT_REF_NO.airstrike, AirstrikeCard);
