import { DEFAULT_APP_STATE, FP_CURRENT_PLAYER, LOCAL_TEMP_PLAYER_ID } from "@shared/constants";
import { IAppState } from "@shared/types";
import { gameManager } from "..";
import { isLocal } from "../config/app-config";
import { transformPlainAppStateToFEDomain } from "../utils/transformers";
import { updateComponents } from "./component-helper";
import { HTMLButton } from "./native/Button";

export class SwitchPlayerButton extends HTMLButton {
    constructor() {
        super();
        if (isLocal) {
            this.build();
        }
    }

    build() {
        const hasExisting = document.getElementById("switchPlayerButtonContainer");

        if (hasExisting) {
            return;
        }

        const switchPlayerButtonContainer = document.createElement("div");
        switchPlayerButtonContainer.id = "switchPlayerButtonContainer";

        const switchPlayerButton = document.createElement("button");
        this.ref = switchPlayerButton;
        switchPlayerButton.id = "switchPlayerBtn";
        switchPlayerButton.innerText = "Switch Player";
        switchPlayerButton.className = "btn secondary";

        this.addClickEventListener();

        switchPlayerButtonContainer.appendChild(switchPlayerButton);
        document.getElementById("status-bar").appendChild(switchPlayerButtonContainer);
        return this.ref;
    }

    remove() {
        document.getElementById("switchPlayerButtonContainer")?.remove();
    }

    switchCurrentPlayer(): string | undefined {
        const currentPlayerId = sessionStorage.getItem(FP_CURRENT_PLAYER);

        if (!currentPlayerId) {
            // new game
            return;
        }

        const playerIds = gameManager.getAllPlayerIds();

        if (playerIds.length === 1) {
            // second player have yet to join
            sessionStorage.setItem(FP_CURRENT_PLAYER, LOCAL_TEMP_PLAYER_ID);
            return LOCAL_TEMP_PLAYER_ID;
        }
        const foundPlayer = playerIds.findIndex((id) => id === currentPlayerId);

        if (foundPlayer == null) {
            // some error in the playerGameState;
            return;
        }

        const nextPlayerId = foundPlayer === 0 ? playerIds[1] : playerIds[0];

        sessionStorage.setItem(FP_CURRENT_PLAYER, nextPlayerId);
        gameManager.switchLocalPlayerAuthToken(nextPlayerId);

        return nextPlayerId;
    }

    async onClick() {
        const nextPlayerId = this.switchCurrentPlayer();

        if (!nextPlayerId || nextPlayerId === LOCAL_TEMP_PLAYER_ID) {
            updateComponents(transformPlainAppStateToFEDomain(DEFAULT_APP_STATE));
            return;
        }

        updateComponents();
    }

    updateState(_state?: IAppState): void {}
}
