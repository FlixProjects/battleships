import { gameManager } from "../..";
import { AppStatus, FP_GAME_STATE } from "../../../shared";
import { transformPlainAppStateToDomain } from "../../../shared/transformers";
import { submitAction } from "../../apis/submit-action";
import { isLocal } from "../../config/app-config";
import { isWaitingForOtherPlayer } from "../../utils/game-helper";
import { updateComponents } from "../component-helper";
import { HTMLButton } from "../native/Button";

export class SubmitMoveButton extends HTMLButton {
    private isSubmitted = false;
    private isOver = false;
    constructor() {
        super();
    }

    public build() {
        this.isSubmitted = gameManager.getPlayer().ready;
        this.isOver = gameManager.state.gameState.isOver && !this.isSubmitted;

        this.ref = document.createElement("button");

        this.ref.textContent = this.getTextcontent();
        this.ref.className = "btn primary";
        this.ref.style.marginTop = "12px";
        this.setDisabled(this.hasFlagshipNotDeployed || this.isSubmitted || this.isOver);
        this.addClickEventListener();

        return this.ref;
    }

    setDisabled(isDisabled: boolean) {
        this.ref.disabled = isDisabled;
    }

    private get hasFlagshipNotDeployed() {
        const player = gameManager.getPlayer();
        const flagshipIndex = player.ships.findIndex((s) => s.isFlagship);
        return flagshipIndex > -1 && !player.ships[flagshipIndex].deployed;
    }

    private getTextcontent() {
        return this.isOver ? "Game Over" : this.isSubmitted ? "Awaiting other player" : "Submit Move";
    }

    async onClick() {
        try {
            this.setDisabled(true);
            const { gameState, gameStateForLocal } = await submitAction(gameManager.getPlayer().pendingActions);

            const newState = transformPlainAppStateToDomain({
                status: isWaitingForOtherPlayer(gameState) ? AppStatus.WaitingForOtherPlayer : AppStatus.ReadyToSubmit,
                loading: false,
                gameState,
            });

            if (isLocal && !!gameState) {
                // DO NOT DELETE: this item simulates Object in S3
                sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameStateForLocal));
            }

            gameManager.saveCurrentPlayerStateV2(newState, { saveWithMerge: false });

            updateComponents();
        } catch (error) {
            this.setDisabled(false);
            updateComponents({ status: AppStatus.Error });
        }
    }
}
