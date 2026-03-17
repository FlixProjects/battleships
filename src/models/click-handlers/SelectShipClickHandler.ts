import { gameManager } from "../..";
import { IShip, keyToLocation, SELECTABLE_ID } from "../../../shared";
import { FEActionMenuCloseCommand } from "../../../shared/models/commands/FEActionMenuCloseCommand";
import { FEActionMenuOpenCommand } from "../../../shared/models/commands/FEActionMenuOpenCommand";
import { ActionMenu } from "../../components/ships/ActionMenu";
import { queueCommand } from "../../utils/game-helper";
import { SelectShipActionIMEvent } from "../interaction-manager/types";
import { ClickHandler } from "./ClickHandler";

export class SelectShipClickHandler extends ClickHandler {
    private actionMenu: ActionMenu;
    private tileRef: HTMLElement;
    constructor(protected event: SelectShipActionIMEvent) {
        super();
    }

    public handleEvent() {
        const { tileId } = this.event;
        this.removePreviousActionMenu();
        const player = gameManager.getPlayer();
        const location = keyToLocation(tileId);
        const shipAtLocation = player.ships.find(
            (ship) =>
                ship.deployed &&
                ship.hulls?.some((hull) => hull.location[0] === location[0] && hull.location[1] === location[1]),
        );
        const tile = this.selectables[tileId];
        this.tileRef = tile.ref;

        this.showActionMenu(shipAtLocation);

        return { nextClickhandler: async (e: MouseEvent) => await this.handler(e) };
    }

    protected async handler(e: MouseEvent) {
        const { onGlobalDeselect, selectableId, tileId } = this.event;
        const target = e.target as HTMLElement;
        const clickedTile = target.closest(".tile") as HTMLElement;
        const id = this.addGetIdOfClick(e);

        // if not select-ship or not on the tile, we deselect
        const isInvalidClick = id !== selectableId && clickedTile?.id !== tileId;

        if (isInvalidClick) {
            this.closeActionMenu();
            return this.handleInvalidClick(onGlobalDeselect);
        }
    }

    private showActionMenu(ship: IShip) {
        this.actionMenu = new ActionMenu({ ship });
        queueCommand(new FEActionMenuOpenCommand(this.tileRef, this.actionMenu));
    }

    private closeActionMenu() {
        queueCommand(new FEActionMenuCloseCommand(this.tileRef, this.actionMenu));
    }

    private removePreviousActionMenu() {
        const oldActionMenu = this.selectables[SELECTABLE_ID.ACTION_MENU];
        if (oldActionMenu) {
            oldActionMenu.ref.remove();
        }
    }
}
