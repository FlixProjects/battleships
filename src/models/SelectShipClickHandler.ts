import { gameManager } from "..";
import { IShip, keyToLocation } from "../../shared";
import { ActionMenu } from "../components/ships/ActionMenu";
import { ClickHandler } from "./ClickHandler";
import { ShipActionIMEvent } from "./InteractionManager";

export class SelectShipClickHandler extends ClickHandler {
    private shipAtLocation: IShip;
    constructor(protected event: ShipActionIMEvent) {
        super();
    }

    protected handler(e: MouseEvent) {
        const { onGlobalDeselect } = this.event;
        const target = e.target as HTMLElement;
        const tileId = target.closest(".tile")?.id;

        if (!(tileId && this.shipAtLocation)) {
            return this.handleInvalidClick(onGlobalDeselect);
        }
    }

    public handleEvent() {
        const { tileId } = this.event;
        const player = gameManager.getPlayer();
        const location = keyToLocation(tileId);
        const shipAtLocation = player.ships.find(
            (ship) =>
                ship.deployed &&
                ship.hullLocations?.some(
                    (hull) => hull.location[0] === location[0] && hull.location[1] === location[1],
                ),
        );
        this.shipAtLocation = shipAtLocation;
        this.showActionMenu(tileId, shipAtLocation);

        return { nextClickhandler: (e: MouseEvent) => this.handler(e) };
    }

    private showActionMenu(tileId: string, ship: IShip) {
        const tile = this.selectables[tileId];
        const actionMenu = new ActionMenu({ ship });

        tile.ref.appendChild(actionMenu.build());
    }
}
