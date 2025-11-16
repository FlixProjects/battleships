import { interactionManager } from "../..";
import { Player } from "../../../shared";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";
import { ShipRow } from "./ShipRow";

interface Props {
    player: Player;
}

export class ShipSelector extends BaseComponent {
    private deployed = 0; // is this deployment per turn?
    private maxDeployment = 2;
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

        this.buildTitle();
        this.buildCounter();

        this.renderShipRows();

        return this.ref;
    }

    private renderShipRows() {
        this.props.player?.ships?.forEach(({ id, deployed }) => {
            if (!deployed) {
                const shipRow = new ShipRow({
                    shipId: id,
                    selected: this.selectedShip === id,
                    onSelect: (shipId: string) => this.setSelected(shipId),
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
        
        interactionManager.handleDeployingShipEvent({
            shipId: this.selectedShip,
            onGlobalDeselect: () => this.clearSelection(),
            onSuccessfulSelect: () => {
                this.deployed++;
            },
        });
    }

    private clearSelection() {
        this.selectedShip = undefined;
        this.shipRows.forEach((row) => row.setSelected(false));
        getComponents().div.gameBoard.updateSelectableTiles([]);
    }

    private buildTitle() {
        const title = document.createElement("h3");
        title.textContent = "Deploy Ships";
        title.style.margin = "0";
        title.style.fontSize = "16px";
        title.style.color = "#e6eef6";
        this.ref.appendChild(title);
    }

    private buildCounter() {
        const counter = document.createElement("div");
        counter.textContent = `Deployed: ${this.deployed} / ${this.maxDeployment}`;
        counter.style.fontSize = "14px";
        counter.style.color = "#9aa4b2";
        this.ref.appendChild(counter);
    }

    protected addStyles(): void {
        this.ref.style.display = "flex";
        this.ref.style.flexDirection = "column";
    }
}
