import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { GameCodeText } from "./GameCodeText";

export class GamePage extends BaseComponent {
    public ref = document.querySelector("main.card") as HTMLElement;

    private gameBlocks = [document.getElementById("status-bar"), document.getElementById("gameArea")];

    private gameCode: GameCodeText;

    constructor() {
        super();
        const statusBarElement = document.getElementById("status-bar");
        if (statusBarElement) {
            this.gameCode = new GameCodeText(statusBarElement);
        }
    }

    updateState(_state?: IAppState): void {
        const screen = _state?.screen ?? getAppScreen();

        // Empty string defers back to the stylesheet's display value.
        this.ref.style.display = screen === GameConfig.AppScreen.Login ? "none" : "";

        const inGame = screen === GameConfig.AppScreen.Game;
        this.gameBlocks.forEach((block) => {
            if (block) {
                block.style.display = inGame ? "" : "none";
            }
        });

        this.gameCode.updateState(_state);
    }
}
