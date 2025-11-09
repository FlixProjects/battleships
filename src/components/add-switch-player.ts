import { gameManager } from "..";
import { DEFAULT_APP_STATE, FP_AUTH_TOKEN, FP_CURRENT_PLAYER } from "../../shared";
import { getCookie } from "../utils/cookie-helper";
import { updateComponents } from "./component-helper";
import { HTMLButton } from "./native/Button";

export class SwitchPlayerButton extends HTMLButton {
    constructor() {
        super();
        this.build();
    }

    build() {
        const switchPlayerButtonContainer = document.createElement("div");
        switchPlayerButtonContainer.id = "switchPlayerButtonContainer";

        const switchPlayerButton = document.createElement("button");
        this.ref = switchPlayerButton;
        switchPlayerButton.id = "switchPlayerBtn";
        switchPlayerButton.innerText = "Switch Player";
        switchPlayerButton.className = "btn secondary";

        switchPlayerButton.addEventListener("click", () => this.onClick());

        switchPlayerButtonContainer.appendChild(switchPlayerButton);
        document.getElementById("controls").appendChild(switchPlayerButtonContainer);
    }

    remove() {
        document.getElementById("switchPlayerButtonContainer")?.remove();
    }

    onClick() {
        const playerIds = gameManager.getAllPlayerIds();
        const currentPlayerId = getCookie(FP_AUTH_TOKEN);

        if (playerIds.length === 0) return;
        console.log("playerIds", playerIds);
        if (playerIds.length === 1) {
            sessionStorage.removeItem(FP_CURRENT_PLAYER);
            updateComponents(DEFAULT_APP_STATE);
        }

        const currentIndex = playerIds.indexOf(currentPlayerId);
        const nextIndex = (currentIndex + 1) % playerIds.length;
        const nextPlayerId = playerIds[nextIndex];

        gameManager.switchToPlayer(nextPlayerId);
        updateComponents(gameManager.loadPlayerState(nextPlayerId));
    }
}
