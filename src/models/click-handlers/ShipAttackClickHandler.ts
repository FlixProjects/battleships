import { ASSET_PATHS, CELL_SEPARATOR, COLOR, COLOR_FILTER, Z_INDEX } from "@shared/constants";
import { FEHighlightLocationsCommand } from "@shared/models/commands/FEHighlightLocationsCommand";
import { FEShipAttackCommand } from "@shared/models/commands/FEShipAttackCommand";
import { GetValidAttackCellsSignal } from "@shared/models/signals/GetValidAttackCellsSignal";
import { ICellLoc } from "@shared/types";
import { locationToKey } from "@shared/utils";
import { gameManager } from "../..";
import { getComponents } from "../../components/component-helper";
import { HTMLImage } from "../../components/native/Image";
import { Selectable } from "../../components/Selectable";
import { Icon } from "../../components/ships/Icon";
import { getEngine, queueCommand } from "../../utils/game-helper";
import { ShipAttackActionIMEvent } from "../interaction-manager/types";
import { ClickHandler } from "./ClickHandler";

const TARGET_ICON_ID_PREFIX = "target-icon";

export class ShipAttackClickHandler extends ClickHandler {
    private validCells: ICellLoc[] = [];
    private origin: ICellLoc;
    constructor(protected event: ShipAttackActionIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId } = this.event;
        const playerId = gameManager.getPlayer().id;

        const result = getEngine().query(
            new GetValidAttackCellsSignal({ targetId: shipId, payload: { shipId, playerId } }),
        );
        const validCells = result?.validCells ?? [];
        const origin = result?.origin ?? this.origin;

        const onSelectable = (selectable: Selectable) => {
            this.loadRedStyle(selectable);
            this.loadTargetIcon(selectable);
        };

        const onUnselectable = (selectable: Selectable) => {
            this.removeTargetIcon(selectable);
        };

        queueCommand(
            new FEHighlightLocationsCommand(getComponents().div.gameBoard, validCells, {
                onSelectable,
                onUnselectable,
            }),
        );

        this.validCells = validCells;
        this.origin = origin;

        return {
            nextClickhandler: async (e: MouseEvent) => await this.handler(e),
        };
    }

    protected async handler(e: MouseEvent) {
        const { shipId, onGlobalDeselect, onSuccessfulSelect } = this.event;
        
        const id = this.getTileIdAtPoint(e);

        const validCellIndices = this.validCells.map((cell) => locationToKey(cell));

        const isInvalidClick =
            !id || (!validCellIndices.includes(id) && !(this.origin && locationToKey(this.origin) === id));

        if (isInvalidClick) {
            return this.handleInvalidClick(onGlobalDeselect);
        }

        this.clearPriorOnSelects(validCellIndices);
        this.loadOnSelects(validCellIndices, onGlobalDeselect);

        if (validCellIndices.includes(id)) {
            await this.handleShipAttackClick(id, shipId, onSuccessfulSelect);
        }
    }

    // FIXME: should we handle multiple location hits?
    private async handleShipAttackClick(attackTileId: string, shipId: string, onSuccessCb?: () => void) {
        const player = gameManager.getPlayer();

        await queueCommand(
            new FEShipAttackCommand({
                tileId: attackTileId,
                shipId,
                playerId: player.id,
                locationElement: this.selectables[attackTileId],
                attackOrigin: this.origin,
                onSuccessCb,
            }),
        );
    }

    private loadRedStyle(selectable: Selectable) {
        selectable.ref.style.background = "rgba(255, 110, 110, 0.2)";
        selectable.ref.style.border = "1px solid rgba(255, 110, 110, 0.5)";
    }

    private loadTargetIcon(selectable: Selectable) {
        const iconId = `${TARGET_ICON_ID_PREFIX}-${selectable.id.replace(CELL_SEPARATOR, "-")}`;
        const existingIcon = selectable.ref.querySelector(`#${iconId}`);

        if (!existingIcon) {
            const icon = new Icon({
                id: iconId,
                src: ASSET_PATHS.TARGET_ICON,
                addStyles: (icon) => this.addTargetStyles(icon),
            });

            selectable.addChild(icon);
            selectable.ref.appendChild(icon.build());
        }
    }

    private addTargetStyles(icon: HTMLImage) {
        const ref = icon.ref;
        ref.style.position = "absolute";
        ref.style.opacity = "0.5";
        ref.style.filter = COLOR_FILTER[COLOR.RED];
        ref.style.zIndex = Z_INDEX.TARGET_ATTACK_ICON;
    }

    private removeTargetIcon(selectable: Selectable) {
        const iconId = `${TARGET_ICON_ID_PREFIX}-${selectable.id.replace(CELL_SEPARATOR, "-")}`;
        const existingIcon = selectable.ref.children.namedItem(iconId);

        if (existingIcon) {
            existingIcon.remove();
        }
    }
}
