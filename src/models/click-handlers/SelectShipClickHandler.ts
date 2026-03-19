import { DEPLOYED_HULL_PREFIX, IShip, SELECTABLE_ID } from "../../../shared";
import { FEActionMenuCloseCommand } from "../../../shared/models/commands/FEActionMenuCloseCommand";
import { FESelectShipCommand } from "../../../shared/models/commands/FESelectShipCommand";
import { ActionMenu } from "../../components/ships/ActionMenu";
import { queueCommand } from "../../utils/game-helper";
import { SelectShipActionIMEvent } from "../interaction-manager/types";
import { ClickHandler } from "./ClickHandler";

export class SelectShipClickHandler extends ClickHandler {
    private actionMenu: ActionMenu;
    private hullRef: HTMLElement;
    constructor(protected event: SelectShipActionIMEvent) {
        super();
    }

    public handleEvent() {
        const { shipId, hullId } = this.event;
        
        this.removePreviousActionMenu();
        
        const hull = this.selectables[`${DEPLOYED_HULL_PREFIX}${hullId}`];
        this.hullRef = hull.ref;
        
        const getActionMenu = (ship: IShip) => {
            this.actionMenu = new ActionMenu({ ship });
            return this.actionMenu;
        };
        // FIXME: should this be async?
        queueCommand(new FESelectShipCommand(this.hullRef, shipId, getActionMenu));
        
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

    private closeActionMenu() {
        queueCommand(new FEActionMenuCloseCommand(this.hullRef, this.actionMenu));
    }

    private removePreviousActionMenu() {
        const oldActionMenu = this.selectables[SELECTABLE_ID.ACTION_MENU];
        // TODO: should change this to use command instead
        if (oldActionMenu) {
            oldActionMenu.ref.remove();
        }
    }
}
