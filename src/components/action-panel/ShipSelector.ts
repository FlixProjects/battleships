import { Player } from "../../../shared";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { ShipRow } from "./ShipRow";
import { getComponents } from "../component-helper";

interface Props {
    player: Player;
}

export class ShipSelector extends BaseComponent {
    private deployed = 0;
    private maxDeployment = 2;
    private selectedShip?: string;
    private shipRows: Map<string, ShipRow> = new Map();
    private globalClickHandler = (e: MouseEvent) => this.handleGlobalClick(e);

    constructor(private props: Props) {
        super();
    }

    updateState(_state?: IAppState): void {
        this.remove();
        this.build();
    }

    remove(): void {
        document.removeEventListener("click", this.globalClickHandler);
        super.remove();
    }

    public build() {
        this.ref = document.createElement("div");
        this.addStyles();

        this.buildTitle();
        this.buildCounter();

        this.renderShipRows();
        
        document.addEventListener("click", this.globalClickHandler);

        return this.ref;
    }

    private renderShipRows() {
        this.props.player?.ships?.forEach(({ id }) => {
            if (!this.shipRows.has(id)) {
                const shipRow = new ShipRow({
                    shipId: id,
                    selected: this.selectedShip === id,
                    onSelect: (shipId: string) => this.setSelected(shipId),
                });
                this.shipRows.set(id, shipRow);
                this.addChild(shipRow);
            }
            this.ref.appendChild(this.shipRows.get(id)!.build());
        });
    }

    private setSelected(id: string) {
        this.selectedShip = id;
        this.shipRows.forEach((row, rowId) => {
            row.setSelected(rowId === id);
        });
    }

    private clearSelection() {
        this.selectedShip = undefined;
        this.shipRows.forEach((row) => row.setSelected(false));
        getComponents().div.gameBoard.updateSelectableTiles([]);
    }

    private handleGlobalClick(e: MouseEvent) {
        if (!this.selectedShip) return;
        
        const target = e.target as HTMLElement;
        const clickedTile = target.closest(".tile");
        const clickedShipRow = target.closest(".ship-row");
        
        if (!clickedTile && !clickedShipRow) {
            this.clearSelection();
        }
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
}
