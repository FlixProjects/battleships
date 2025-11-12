import { BOARD_COLUMNS, BOARD_ROWS_PER_PLAYER, ICell } from "../../../shared";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { Tile } from "./Tile";

export class GameBoard extends BaseComponent {
    private container = document.getElementById("gameArea") as HTMLDivElement;
    private tiles: Record<string, Tile> = {};

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.remove();
        if (_state?.gameState?.players?.length === 2) {
             this.build();
             return
        }
    }

    renderTile(key: string) {
        const tile = new Tile();
        this.tiles[key] = tile;
        this.ref.appendChild(tile.build());
    }

    build() {
        this.ref = document.createElement("div");

        this.addStyles();

        for (let row = 0; row < BOARD_ROWS_PER_PLAYER * 2; row++) {
            for (let col = 0; col < BOARD_COLUMNS; col++) {
                this.renderTile(`${col},${row}`);
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

    updateSelectableTiles(validCells: [number, number][]) {
        validCells.forEach((cell: ICell) => {
            this.tiles[this.locationToKey(cell)]?.setSelectable(true);
        });
    }

    locationToKey(location: ICell) {
        return `${location[0]},${location[1]}`;
    }
}
