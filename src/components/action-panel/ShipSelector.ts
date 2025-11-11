import { Player } from "../../../shared";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { ShipRow } from "./ShipRow";

interface Props {
    player: Player;
}

export class ShipSelector extends BaseComponent {
    private deployed = 0;
    private maxDeployment = 2;

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
        return this.props.player?.ships?.forEach(({ id }) => {
            return this.renderShipRow(id);
        });
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

    private renderShipRow(shipId: string) {
        const shipRow = new ShipRow({ shipId }).build();
        this.ref.appendChild(shipRow);
    }
}
