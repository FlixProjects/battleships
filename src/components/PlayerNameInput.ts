import { FP_AUTH_TOKEN, FP_CURRENT_PLAYER } from "@shared/constants";
import { IAppState } from "@shared/types";
import { isLocal } from "../config/app-config";
import { getCookie } from "../utils/cookie-helper";
import { HTMLInput } from "./native/Input";

export class PlayerNameInput extends HTMLInput {
    public ref = document.getElementById("playerName") as HTMLInputElement;

    shakeForAwhile() {
        this.shake();
        setTimeout(() => this.stopShake(), 2000);
    }

    shake() {
        this.ref.classList.add("shake");
    }

    stopShake() {
        this.ref.classList.remove("shake");
        this.ref.focus();
    }

    reset() {
        this.ref.value = "";
        this.ref.disabled = false;
    }

    updateState(_state?: IAppState): void {
        const playerId = isLocal ? sessionStorage.getItem(FP_CURRENT_PLAYER) : getCookie(FP_AUTH_TOKEN);

        let playerName = "";

        if (playerId) {
            playerName = _state.gameState?.players.find((p) => p.id === playerId)?.name;
        }

        if (playerName) {
            this.ref.value = playerName;
            this.ref.disabled = true;
        } else {
            this.reset();
        }
    }
}
