import { isLocal } from "../config/app-config";
import { HTMLButton } from "./native/Button";

export class ResetLocalGameButton extends HTMLButton {
    constructor() {
        super();
        if (isLocal) {
            this.build();
        }
    }

    public build(): HTMLElement {
        const hasExisting = document.getElementById("resetLocalGameButtonContainer");

        if (hasExisting) {
            return;
        }

        const resetLocalGameButtonContainer = document.createElement("div");
        resetLocalGameButtonContainer.id = "resetLocalGameButtonContainer";

        const resetLocalGameButton = document.createElement("button");
        this.ref = resetLocalGameButton;

        resetLocalGameButton.id = "resetLocalGameBtn";
        resetLocalGameButton.innerText = "Reset";
        resetLocalGameButton.className = "btn secondary";

        this.addClickEventListener();

        resetLocalGameButtonContainer.appendChild(resetLocalGameButton);
        document.getElementById("controls").appendChild(resetLocalGameButtonContainer);

        return this.ref;
    }

    public remove() {
        document.getElementById("resetLocalGameButtonContainer")?.remove();
    }

    private resetLocalGame() {
        sessionStorage.clear();
        location.reload();
    }

    async onClick() {
        await this.resetLocalGame();
    }
}
