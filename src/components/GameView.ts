import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { GameCodeText } from "./GameCodeText";

export class GameView extends BaseComponent {
    public ref = document.querySelector("main.card") as HTMLElement;

    private gameBlocks = [
        document.getElementById("status-bar"),
        document.getElementById("gameArea"),
    ];

    private gameCode = new GameCodeText(document.getElementById("status-bar"));

    updateState(_state?: IAppState): void {
        const screen = _state?.screen ?? getAppScreen();

        // Empty string defers back to the stylesheet's display value.
        this.ref.style.display = screen === GameConfig.AppScreen.Login ? "none" : "";

        const inGame = screen === GameConfig.AppScreen.InGame;
        this.gameBlocks.forEach((block) => {
            if (block) {
                block.style.display = inGame ? "" : "none";
            }
        });

        this.gameCode.updateState(_state);
    }
}
