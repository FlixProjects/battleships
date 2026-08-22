import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { guestLogin } from "../apis/guest-login";
import { login } from "../apis/login";
import { signUp } from "../apis/sign-up";
import LoginInCssAnimStyle from "../css-anim-styles/models/login-in-style";
import { getAppScreen, setAppScreen } from "../utils/screen-helper";
import { BaseComponent } from "./BaseComponent";
import { getComponents, updateComponents } from "./component-helper";
import { LoginButton } from "./LoginButton";
import { SignUpLink } from "./SignUpLink";
import { applyButtonStyles, applyInputStyles } from "./styles/inline-styles";

export class LoginPage extends BaseComponent {
    private card: HTMLDivElement;
    private usernameInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;
    private loginBtn: LoginButton;
    private signUpLink: SignUpLink;
    private hint: HTMLParagraphElement;

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        const screen = _state?.screen ?? getAppScreen();

        if (screen === GameConfig.AppScreen.Login) {
            this.ref.style.display = "flex";
        } else {
            this.ref.style.display = "none";
        }
    }

    build() {
        const page = document.getElementById("page-container");

        if (!page || page.querySelector("#login-page")) {
            return this.ref;
        }

        this.ref = document.createElement("section");
        this.ref.id = "login-page";
        this.addStyles();

        this.buildCard();

        const mainCard = page.querySelector("main.card");
        page.insertBefore(this.ref, mainCard);

        return this.ref;
    }

    addStyles() {
        this.ref.style.display = "flex";
        this.ref.style.justifyContent = "center";
        this.ref.style.padding = "24px 0 8px";
    }

    private buildCard() {
        this.card = document.createElement("div");
        this.card.id = "login-card";
        this.addCardStyles();
        new LoginInCssAnimStyle().attachTo(this.card);

        this.buildAccentStrip();
        this.buildRadarGlow();
        this.buildHeading();
        this.buildLoginForm();
        this.buildDivider();
        this.buildGuestButton();

        this.ref.appendChild(this.card);
    }

    private addCardStyles() {
        const style = this.card.style;
        style.position = "relative";
        style.overflow = "hidden";
        style.width = "100%";
        style.maxWidth = "400px";
        style.padding = "32px 28px 28px";
        style.display = "flex";
        style.flexDirection = "column";
        style.gap = "12px";
        style.background = "linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))";
        style.border = "1px solid var(--glass-border)";
        style.borderRadius = "var(--radius)";
        style.boxShadow = "0 10px 30px rgba(3, 7, 18, 0.6)";
    }

    // Thin beacon gradient along the card's top edge.
    private buildAccentStrip() {
        const strip = document.createElement("div");
        const style = strip.style;
        style.position = "absolute";
        style.top = "0";
        style.left = "0";
        style.right = "0";
        style.height = "2px";
        style.background = "linear-gradient(90deg, transparent, var(--accent) 30%, var(--accent-2) 70%, transparent)";
        style.opacity = "0.85";

        this.card.appendChild(strip);
    }

    // Soft radial glow bleeding in from above the card content.
    private buildRadarGlow() {
        const glow = document.createElement("div");
        const style = glow.style;
        style.position = "absolute";
        style.top = "-120px";
        style.left = "50%";
        style.width = "320px";
        style.height = "220px";
        style.transform = "translateX(-50%)";
        style.background = "radial-gradient(closest-side, rgba(96, 165, 250, 0.12), transparent)";
        style.pointerEvents = "none";

        this.card.appendChild(glow);
    }

    private buildHeading() {
        const title = document.createElement("h2");
        title.textContent = "Welcome aboard, Commander";
        title.style.margin = "0";
        title.style.fontSize = "20px";
        title.style.letterSpacing = "0.4px";
        title.style.color = "#fff";
        title.style.textShadow = "0 4px 18px rgba(0, 0, 0, 0.5)";

        const subtitle = document.createElement("p");
        subtitle.textContent = "Sign in to command your fleet";
        subtitle.style.margin = "0 0 10px";
        subtitle.style.color = "var(--muted)";
        subtitle.style.fontSize = "13px";

        this.card.append(title, subtitle);
    }

    private buildLoginForm() {
        this.usernameInput = this.buildInput("loginUsername", "text", "Username");
        this.passwordInput = this.buildInput("loginPassword", "password", "Password");

        this.loginBtn = new LoginButton(() => this.onLoginClick());
        this.signUpLink = new SignUpLink(() => this.onSignUpClick());
        this.addChild(this.loginBtn);
        this.addChild(this.signUpLink);

        this.buildHint();

        this.card.append(this.usernameInput, this.passwordInput, this.buildActionRow(), this.hint);
    }

    // Log In takes the remaining width; the sign-up link sits alongside it.
    private buildActionRow() {
        const row = document.createElement("div");
        const style = row.style;
        style.display = "flex";
        style.alignItems = "center";
        style.gap = "12px";
        style.marginTop = "4px";

        row.append(this.loginBtn.ref, this.signUpLink.ref);

        return row;
    }

    private buildHint() {
        this.hint = document.createElement("p");
        this.hint.textContent = "Account login is coming soon — continue as guest for now";

        const style = this.hint.style;
        style.margin = "0";
        style.maxHeight = "0";
        style.overflow = "hidden";
        style.opacity = "0";
        style.textAlign = "center";
        style.fontSize = "12px";
        style.color = "var(--accent)";
        style.textShadow = "0 0 12px rgba(110, 231, 183, 0.35)";
        style.transition = "opacity var(--transition), max-height var(--transition)";
    }

    private buildDivider() {
        const divider = document.createElement("div");
        const style = divider.style;
        style.display = "flex";
        style.alignItems = "center";
        style.gap = "12px";
        style.margin = "6px 0";
        style.color = "var(--muted)";
        style.fontSize = "12px";
        style.textTransform = "uppercase";
        style.letterSpacing = "1.5px";

        const label = document.createElement("span");
        label.textContent = "or";

        divider.append(this.buildDividerLine("left"), label, this.buildDividerLine("right"));
        this.card.appendChild(divider);
    }

    private buildDividerLine(side: "left" | "right") {
        const line = document.createElement("div");
        line.style.flex = "1";
        line.style.height = "1px";

        if (side === "left") {
            line.style.background = "linear-gradient(90deg, transparent, var(--glass-border))";
        } else {
            line.style.background = "linear-gradient(90deg, var(--glass-border), transparent)";
        }

        return line;
    }

    private buildGuestButton() {
        const guestBtn = document.createElement("button");
        guestBtn.id = "guestBtn";
        guestBtn.textContent = "Continue as Guest";
        applyButtonStyles(guestBtn, { primary: true });
        guestBtn.style.width = "100%";
        guestBtn.style.padding = "13px";
        guestBtn.style.fontSize = "15px";
        guestBtn.style.letterSpacing = "0.6px";
        guestBtn.addEventListener("click", () => this.onGuestClick());

        this.card.appendChild(guestBtn);
    }

    private buildInput(id: string, type: string, placeholder: string) {
        const input = document.createElement("input");
        input.id = id;
        input.type = type;
        input.placeholder = placeholder;
        input.maxLength = 20;
        applyInputStyles(input);
        input.style.width = "100%";

        return input;
    }

    // Stage C stub: no auth backend yet — nudge towards the guest path.
    private async onLoginClick() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username) {
            this.rejectWithHint("Enter your username!");
            this.usernameInput.focus();
            return;
        }

        if (!password) {
            this.rejectWithHint("Enter your password!");
            this.passwordInput.focus();
            return;
        }

        const { statusCode } = await login(username, password);

        if (statusCode === 200) {
            setAppScreen(GameConfig.AppScreen.Lobby);
            updateComponents();
        }
    }

    // Stage C stub: sign-up has an API but no screen to host it yet.
    private async onSignUpClick() {
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (!username) {
            this.rejectWithHint("Enter a username to sign up");
            this.usernameInput.focus();
            return;
        }

        if (!password) {
            this.rejectWithHint("Enter a password to sign up");
            this.passwordInput.focus();
            return;
        }

        const { statusCode } = await signUp(username, password);

        if (statusCode === 200) {
            setAppScreen(GameConfig.AppScreen.Lobby);
            updateComponents();
        }
    }

    private rejectWithHint(message: string) {
        this.hint.textContent = message;
        this.hint.style.maxHeight = "40px";
        this.hint.style.opacity = "1";

        // `shake` keyframes are global (styles.css); entrance anim has already
        // finished, so borrowing the animation property is safe.
        this.card.style.animation = "shake 360ms ease-in-out";
        setTimeout(() => {
            this.card.style.animation = "";
        }, 600);
    }

    private async onGuestClick() {
        const username = this.usernameInput.value.trim();

        // Carry a typed username into the lobby's name field as a courtesy.
        if (username) {
            getComponents().input.playerName.setValue(username);
        }

        const { statusCode } = await guestLogin();
        if (statusCode === 200) {
            setAppScreen(GameConfig.AppScreen.Lobby);
            updateComponents();
        }
    }
}
