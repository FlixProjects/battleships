import { Z_INDEX } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { gameManager } from "../..";
import { getAppScreen } from "../../utils/screen-helper";
import { BaseComponent } from "../BaseComponent";
import { Hand } from "../hand/Hand";
import { InitiativeDisplay } from "./InitiativeDisplay";
import { PlaybackButton } from "./PlaybackButton";
import { SubmitMoveButton } from "./SubmitMoveButton";

const SHOWN_TRANSFORM = "translateY(-50%) translateX(0)";
// -100% (not -115%) so the toggle handle hanging off the right edge stays on screen.
const HIDDEN_TRANSFORM = "translateY(-50%) translateX(-100%)";

export class ActionPanel extends BaseComponent {
    private isOpen = true;
    private handleRef?: HTMLButtonElement;

    constructor() {
        super();
    }

    updateState(_state?: IAppState): void {
        if (this.ref) this.remove();

        // Body-mounted and fixed-positioned, so GameView's screen gating never
        // reaches it — it must gate itself on the InGame screen.
        const screen = _state?.screen ?? getAppScreen();

        if (screen !== GameConfig.AppScreen.InGame) {
            return;
        }

        if (_state?.gameState?.players?.length === 2) {
            this.build();
            this.show();
        }
    }

    build() {
        this.ref = document.createElement("div");
        // Rebuilds (every state change) always present the panel open; a
        // mid-targeting close survives only until the next updateComponents.
        this.isOpen = true;
        this.addStyles();

        const initiativeDisplay = new InitiativeDisplay();
        const initiativeElement = initiativeDisplay.build();
        if (initiativeElement) {
            this.addChild(initiativeDisplay);
            this.ref.appendChild(initiativeElement);
        }

        this.renderCommandPoints();
        this.renderOptions();
        this.renderSubmitButton();
        this.renderToggleHandle();

        document.body.appendChild(this.ref); // TODO: Move to component-helper
        return this.ref;
    }

    /** Slide the panel off-screen so the board is visible (mobile targeting). */
    public close() {
        this.setOpen(false);
    }

    public open() {
        this.setOpen(true);
    }

    private setOpen(open: boolean) {
        this.isOpen = open;
        this.ref.style.transform = open ? SHOWN_TRANSFORM : HIDDEN_TRANSFORM;
        if (this.handleRef) {
            this.handleRef.textContent = open ? "‹" : "›";
        }
    }

    /** Grab-tab on the panel's right edge — stays on screen when the panel is
     *  slid away, so the player can always pull it back. */
    private renderToggleHandle() {
        const handle = document.createElement("button");
        handle.textContent = "‹";
        handle.setAttribute("aria-label", "Toggle action panel");
        handle.style.position = "absolute";
        handle.style.right = "-28px";
        handle.style.top = "50%";
        handle.style.transform = "translateY(-50%)";
        handle.style.width = "28px";
        handle.style.height = "56px";
        handle.style.border = "1px solid rgba(255, 255, 255, 0.06)";
        handle.style.borderLeft = "none";
        handle.style.borderRadius = "0 10px 10px 0";
        handle.style.background = "rgba(15, 23, 36, 0.95)";
        handle.style.color = "rgba(255, 255, 255, 0.7)";
        handle.style.fontSize = "18px";
        handle.style.cursor = "pointer";
        handle.addEventListener("click", (e) => {
            e.stopPropagation();
            this.setOpen(!this.isOpen);
        });

        this.handleRef = handle;
        this.ref.appendChild(handle);
    }

    renderOptions() {
        this.renderHand();
    }

    renderHand() {
        const player = gameManager.getPlayer();
        const isGameOver = !!gameManager.state.gameState.isOver;
        const hand = new Hand({ player, isGameOver });
        this.addChild(hand);
        this.ref.appendChild(hand.build());
    }

    private renderSubmitButton() {
        const submitBtn = new SubmitMoveButton();
        this.addChild(submitBtn);
        this.ref.appendChild(submitBtn.build());

        const playbackBtn = new PlaybackButton();
        this.addChild(playbackBtn);
        this.ref.appendChild(playbackBtn.build());
    }

    private renderCommandPoints() {
        const player = gameManager.getPlayer();
        const commandPointsDiv = document.createElement("div");
        commandPointsDiv.style.padding = "12px";
        commandPointsDiv.style.background = "rgba(255, 255, 255, 0.05)";
        commandPointsDiv.style.borderRadius = "8px";
        commandPointsDiv.style.marginBottom = "8px";
        commandPointsDiv.style.textAlign = "center";
        commandPointsDiv.style.color = "#ffffff";
        commandPointsDiv.style.fontSize = "14px";
        commandPointsDiv.style.fontWeight = "bold";
        commandPointsDiv.innerHTML = `Command Points: ${player.commandPoints}/${player.maxCommandPoints}`;

        this.ref.appendChild(commandPointsDiv);
    }

    protected addStyles() {
        this.ref.style.position = "fixed";
        this.ref.style.left = "0";
        this.ref.style.top = "50%";
        this.ref.style.transform = SHOWN_TRANSFORM;
        this.ref.style.transition = "transform 0.25s ease";
        this.ref.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.06)";
        this.ref.style.borderLeft = "none";
        this.ref.style.borderRadius = "0 14px 14px 0";
        this.ref.style.padding = "20px";
        this.ref.style.boxShadow = "0 10px 30px rgba(3, 7, 18, 0.6)";
        this.ref.style.display = "none";
        this.ref.style.flexDirection = "column";
        this.ref.style.gap = "16px";
        this.ref.style.zIndex = Z_INDEX.ACTION_PANEL;
    }

    private show() {
        this.ref.style.display = "flex";
    }
}
