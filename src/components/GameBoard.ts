import { BOARD_COLUMNS, BOARD_ROWS_PER_PLAYER } from "../../shared";
import { IAppState } from "../types";
import { BaseComponent } from "./BaseComponent";

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

    build() {
        this.ref = document.createElement("div");

        this.ref.innerHTML = "";
        this.ref.style.display = "grid";
        this.ref.style.gridTemplateColumns = "repeat(7, 48px)";
        this.ref.style.gap = "2px";
        this.ref.style.padding = "12px";

        for (let row = 0; row < BOARD_ROWS_PER_PLAYER * 2; row++) {
            for (let col = 0; col < BOARD_COLUMNS; col++) {
                const tile = document.createElement("div");
                tile.style.aspectRatio = "1";
                tile.style.background = "rgba(255, 255, 255, 0.04)";
                tile.style.border = "1px solid rgba(255, 255, 255, 0.08)";
                tile.style.borderRadius = "6px";
                tile.style.transition = "all 0.2s ease";
                tile.style.cursor = "pointer";

                tile.addEventListener("mouseenter", () => {
                    tile.style.background = "rgba(110, 231, 183, 0.1)";
                    tile.style.transform = "scale(1.05)";
                });

                tile.addEventListener("mouseleave", () => {
                    tile.style.background = "rgba(255, 255, 255, 0.04)";
                    tile.style.transform = "scale(1)";
                });

                this.ref.appendChild(tile);
            }
        }

        this.container.appendChild(this.ref);
    }

    private hide() {
        this.ref.style.display = "none";
    }

    private show() {
        this.ref.style.display = "grid";
    }
}
