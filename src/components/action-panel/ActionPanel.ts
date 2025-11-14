import { gameManager } from "../..";
import { IAppState } from "../../types";
import { BaseComponent } from "../BaseComponent";
import { ShipSelector } from "./ShipSelector";
import { SubmitMoveButton } from "./SubmitMoveButton";

export class ActionPanel extends BaseComponent {
    constructor() {
        super();
    }

    updateState(_state?: IAppState): void {
        if (this.ref) {
            this.remove();
        }
        if (_state?.gameState?.players?.length === 2) {
            this.build();
            this.show();
            return;
        }
    }

    build() {
        this.ref = document.createElement("div");
        this.addStyles();

        this.renderOptions();
        this.renderSubmitButton();

        document.body.appendChild(this.ref); // TODO: Move to component-helper
        return this.ref;
    }

    renderOptions() {
        this.renderShipSelector();
    }

    renderShipSelector() {
        const player = gameManager.getPlayer();
        const shipSelector = new ShipSelector({ player });
        this.addChild(shipSelector);
        this.ref.appendChild(shipSelector.build());
    }

    private renderSubmitButton() {
        const submitBtn = new SubmitMoveButton();
        this.ref.appendChild(submitBtn.build());
    }

    protected addStyles() {
        this.ref.style.position = "fixed";
        this.ref.style.left = "0";
        this.ref.style.top = "50%";
        this.ref.style.transform = "translateY(-50%)";
        this.ref.style.width = "220px";
        this.ref.style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.06)";
        this.ref.style.borderLeft = "none";
        this.ref.style.borderRadius = "0 14px 14px 0";
        this.ref.style.padding = "20px";
        this.ref.style.boxShadow = "0 10px 30px rgba(3, 7, 18, 0.6)";
        this.ref.style.display = "none";
        this.ref.style.flexDirection = "column";
        this.ref.style.gap = "16px";
        this.ref.style.zIndex = "100";
    }

    private show() {
        this.ref.style.display = "flex";
    }
}
