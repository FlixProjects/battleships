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

        switchPlayerButtonContainer.appendChild(switchPlayerButton);

        document.getElementById("controls").appendChild(switchPlayerButtonContainer);
    }

    remove() {
        document.getElementById("switchPlayerButtonContainer").remove();
    }

    onClick() {

    }
}
