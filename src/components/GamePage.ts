import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { GameCodeText } from "./GameCodeText";

export class GamePage extends BaseComponent {
    private statusBar: HTMLDivElement;
    private gameArea: HTMLDivElement;
    private gameCode: GameCodeText;

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.build();

        const screen = _state?.screen ?? getAppScreen();

        // Empty string defers back to the stylesheet's display value.
        this.ref.style.display = screen === GameConfig.AppScreen.Login ? "none" : "";

        const inGame = screen === GameConfig.AppScreen.Game;
        [this.statusBar, this.gameArea].forEach((block) => {
            block.style.display = inGame ? "" : "none";
        });

        this.gameCode.updateState(_state);
    }

    // Never unmounted — the status bar's children, GameBoard and PlayerCards hold refs into this subtree.
    build() {
        const page = document.getElementById("page-container");

        if (!page || page.querySelector("main.card")) {
            return this.ref;
        }

        this.ref = document.createElement("main");
        this.ref.className = "card";
        // Hidden until updateState knows the screen.
        this.ref.style.display = "none";

        this.statusBar = document.createElement("div");
        this.statusBar.id = "status-bar";
        this.statusBar.className = "status-bar";

        this.gameArea = document.createElement("div");
        this.gameArea.id = "gameArea";
        this.gameArea.className = "game-area";

        this.ref.append(this.statusBar, this.gameArea);
        this.gameCode = new GameCodeText(this.statusBar);

        page.appendChild(this.ref);

        return this.ref;
    }
}
