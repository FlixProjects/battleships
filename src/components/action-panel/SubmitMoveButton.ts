import { FP_GAME_STATE } from "@shared/constants";
import { GameStateManager } from "@shared/models";
import { AppStatus } from "@shared/types";
import { gameManager } from "../..";
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
        if (this.isOver) return "Game Over";
        if (this.isSubmitted) return "Awaiting other player";
        return "Submit Move";
    }

    async onClick() {
        try {
            this.setDisabled(true);
            const { gameState, gameStateForLocal } = await submitAction(gameManager.getPlayer().pendingActions);

            // Re-resolve locally so the player sees the resolved board while
            // they wait for the opponent. Server's stored state stays raw.
            const gsm = new GameStateManager(gameState);
            gsm.resolveLocalActionsForPlayer(gameManager.getCurrentPlayerId());

            if (isLocal && !!gameState) {
                // DO NOT DELETE: this item simulates Object in S3
                sessionStorage.setItem(FP_GAME_STATE, JSON.stringify(gameStateForLocal));
            }

            gameManager.saveAppState(
                {
                    status: isWaitingForOtherPlayer(gameState)
                        ? AppStatus.WaitingForOtherPlayer
                        : AppStatus.ReadyToSubmit,
                    loading: false,
                    gameState: gsm.gameState.toPlain(),
                },
                { saveWithMerge: false },
            );

            updateComponents();
        } catch (error) {
            console.log("[Error] Submission failed", error);
            this.setDisabled(false);
            updateComponents({ status: AppStatus.Error });
        }
    }
}
