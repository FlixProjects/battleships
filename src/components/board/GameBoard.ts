import { BOARD_COLUMNS, BOARD_ROWS_PER_PLAYER } from "../../../shared";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { Tile } from "./Tile";

export class GameBoard extends BaseComponent {
    private container = document.getElementById("gameArea") as HTMLDivElement;

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        if (_state?.gameState?.players?.length === 2) {
            return this.show();
        }

        this.hide();
    }

    renderTile() {
        const tile = new Tile().build();
        this.ref.appendChild(tile);
    }

    build() {
        this.ref = document.createElement("div");

        this.addStyles();

        for (let row = 0; row < BOARD_ROWS_PER_PLAYER * 2; row++) {
            for (let col = 0; col < BOARD_COLUMNS; col++) {
                this.renderTile();
            }
        }

        this.container.appendChild(this.ref);

        return this.ref;
    }

    protected addStyles(): void {
        this.ref.innerHTML = "";
        this.ref.style.display = "grid";
        this.ref.style.gridTemplateColumns = "repeat(7, 48px)";
        this.ref.style.gap = "2px";
        this.ref.style.padding = "12px";
    }

    private show() {
        this.ref.style.display = "grid";
    }
}
