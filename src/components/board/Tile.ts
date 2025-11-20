import { gameManager, interactionManager } from "../..";
import { keyToLocation } from "../../../shared";
import { IAppState } from "../../types";
import { getComponents } from "../component-helper";
import { Selectable } from "../Selectable";

interface Props {
    id: string;
}

export class Tile extends Selectable {
    private isSelectable = false;

    constructor(props: Props) {
        super(props.id);
    }

    updateState(_state?: IAppState): void {
        if (this.isSelectable) {
            this.setSelectableStyle();
        } else {
            this.setUnselectableStyle();
        }
    }

    build() {
        this.ref = document.createElement("div");
        this.ref.id = this.id;
        this.ref.classList.add("tile");
        this.addStyles();
        return this.ref;
    }

    protected addStyles(): void {
        this.ref.style.aspectRatio = "1";
        this.ref.style.background = "rgba(255, 255, 255, 0.04)";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        this.ref.style.borderRadius = "6px";
        this.ref.style.transition = "all 0.2s ease";
        this.ref.style.cursor = "pointer";
        this.ref.style.height = "100%";
        this.ref.style.width = "100%";
        this.ref.style.display = "flex";
        this.ref.style.alignItems = "center";
        this.ref.style.justifyContent = "center";
        this.ref.style.padding = "4px";
    }

    setSelectable(selectable: boolean) {
        this.isSelectable = selectable;
        this.updateState();
    }

    private setSelectableStyle() {
        this.ref.style.background = "rgba(110, 231, 183, 0.2)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.5)";
        this.ref.style.animation = "pulse 1.5s ease-in-out infinite";

        this.ref.addEventListener("mouseenter", this.mouseEnterStyle);
        this.ref.addEventListener("mouseleave", this.mouseLeaveStyle);
    }

    mouseEnterStyle = () => {
        this.ref.style.transform = "scale(1.05)";
    };

    mouseLeaveStyle = () => {
        this.ref.style.transform = "scale(1)";
    };

    private setUnselectableStyle() {
        this.ref.style.background = "rgba(255, 255, 255, 0.04)";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        this.ref.style.animation = "";

        this.ref.removeEventListener("mouseenter", this.mouseEnterStyle);
        this.ref.removeEventListener("mouseleave", this.mouseLeaveStyle);
    }

    public addShipClickHandler() {
        this.ref.addEventListener("click", () => {
            const location = keyToLocation(this.id);

            const player = gameManager.getPlayer();
            const shipAtLocation = player.ships.find(
                (ship) =>
                    ship.deployed &&
                    ship.hullLocations?.some(
                        (hull) => hull.location[0] === location[0] && hull.location[1] === location[1],
                    ),
            );

            if (shipAtLocation && player.commandPoints >= 1) {
                interactionManager.handleMovingShipEvent({
                    shipId: shipAtLocation.id,
                    onGlobalDeselect: () => this.clearSelection(),
                });
            }
        });
    }

    private clearSelection() {
        getComponents().div.gameBoard.updateSelectableTiles([]);
    }
}
