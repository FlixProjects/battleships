import { HTMLSpan } from "../native/Span";

export class InitiativeName extends HTMLSpan {
    constructor(private playerName: string, private hasInitiative: boolean) {
        super();
    }

    build() {
        this.ref = document.createElement("span");
        this.addStyles();
        this.ref.textContent = this.playerName;
        return this.ref;
    }

    protected addStyles() {
        this.ref.style.color = this.hasInitiative ? "#6ee7b7" : "#fbbf24";
        this.ref.style.fontSize = "14px";
        this.ref.style.fontWeight = "600";
    }
}
