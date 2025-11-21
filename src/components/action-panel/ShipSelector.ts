import { interactionManager } from "../..";
import { Player } from "../../../shared";
import { IMEventType } from "../../models/InteractionManager";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";
import { ShipRow } from "./ShipRow";

interface Props {
    player: Player;
}

export class ShipSelector extends BaseComponent {
    private selectedShip?: string;
    private shipRows: ShipRow[] = [];

    constructor(private props: Props) {
        super();
    }

    updateState(_state?: IAppState): void {
        this.remove();
        this.build();
    }

    public build() {
        this.ref = document.createElement("div");

        this.addStyles();

        this.renderShipRows();

        return this.ref;
    }

    private renderShipRows() {
        const player = this.props.player;
        player?.ships?.forEach(({ id, refNo, deployed, commandPointCost }) => {
            if (!deployed) {
                const shipRow = new ShipRow({
                    shipId: id,
                    selected: this.selectedShip === id,
                    onSelect: (shipId: string) => this.setSelected(shipId),
                    selectable: player.commandPoints >= commandPointCost && !player.ready,
                    refNo,
                });
                this.shipRows.push(shipRow);
                this.addChild(shipRow);
                this.ref.appendChild(shipRow.build());
            }
        });
    }

    private setSelected(id: string) {
        this.selectedShip = id;
        this.shipRows.forEach((row) => {
            const isSelected = row.props.shipId === id;
            row.setSelected(isSelected);
        });

        interactionManager.handleEvent({
            type: IMEventType.DEPLOYING_SHIP,
            shipId: this.selectedShip,
            onGlobalDeselect: () => this.clearSelection(),
        });
    }

    private clearSelection() {
        this.selectedShip = undefined;
        this.shipRows.forEach((row) => row.setSelected(false));
        getComponents().div.gameBoard.updateSelectableTiles([]);
    }

    protected addStyles(): void {
        this.ref.style.display = "flex";
        this.ref.style.flexDirection = "column";
    }
}
