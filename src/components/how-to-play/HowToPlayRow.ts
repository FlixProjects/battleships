import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../../utils/screen-helper";
import { BaseComponent } from "../BaseComponent";
import { getComponents } from "../component-helper";
import { applyButtonStyles } from "../styles/inline-styles";

export const HOW_TO_PLAY_ROW_ID = "howToPlayRow";

// Lobby-only row between the create/join controls and the games list
export class HowToPlayRow extends BaseComponent {
    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        this.build();

        if (!this.ref) {
            return;
        }

        const screen = _state?.screen ?? getAppScreen();
        this.ref.style.display = screen === GameConfig.AppScreen.Games ? "flex" : "none";
    }

    build() {
        const card = document.querySelector(".card");
        const controls = card?.querySelector("#controls");

        if (!controls || card?.querySelector(`#${HOW_TO_PLAY_ROW_ID}`)) {
            return this.ref;
        }

        this.ref = document.createElement("div");
        this.ref.id = HOW_TO_PLAY_ROW_ID;
        this.ref.style.display = "flex";
        this.ref.style.justifyContent = "center";
        this.ref.style.padding = "4px 0";

        const button = document.createElement("button");
        button.id = "howToPlayBtn";
        button.textContent = "How to Play";
        applyButtonStyles(button);
        button.style.padding = "8px 20px";
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            getComponents().div.howToPlayModal.open();
        });

        this.ref.appendChild(button);
        controls.insertAdjacentElement("afterend", this.ref);

        return this.ref;
    }
}
