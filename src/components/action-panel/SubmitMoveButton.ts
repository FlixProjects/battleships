import { gameManager } from "../..";
import { FP_GAME_STATE } from "../../../shared";
import { submitAction } from "../../apis/submit-action";
import { isLocal } from "../../config/app-config";
import { AppStatus, IAppState } from "../../types";
import { updateComponents } from "../component-helper";
import { HTMLButton } from "../native/Button";

export class SubmitMoveButton extends HTMLButton {
    constructor() {
        super();
    }

    updateState(_state?: IAppState): void {
        this.setDisabled(!gameManager.getPlayer().ready);
    }

    public build() {
        this.ref = document.createElement("button");
        this.ref.textContent = "Submit Move";
        this.ref.className = "btn primary";
        this.ref.style.marginTop = "12px";

        this.addClickEventListener();

        return this.ref;
    }

    setDisabled(isDisabled: boolean) {
        this.ref.disabled = isDisabled;
    }

    async onClick() {
        try {
            this.setDisabled(true);
            const { results, gameState } = await submitAction(gameManager.getPlayer().pendingActions);
            const newState = { loading: false, gameState };
            if (isLocal) {
                // DO NOT DELETE: this item simulates Object in S3
                sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameState));
            }

            gameManager.saveCurrentPlayerStateV2(newState);

            updateComponents();
        } catch (error) {
            this.setDisabled(false);
            updateComponents({ status: AppStatus.Error });
        }
    }
}
