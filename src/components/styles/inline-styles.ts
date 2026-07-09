/**
 * Inline equivalents of the stylesheet's `.btn` / `.btn.primary` / `.input`
 * rules, for components that build their own DOM with inline styles
 * (LoginPage, GameActions). The interactive states (:hover, :active, :focus,
 * :disabled) cannot be expressed inline, so they are emulated with event
 * listeners and a `disabled`-attribute observer.
 */

const BTN_REST_SHADOW = "0 6px 18px rgba(2, 6, 23, 0.45)";
const BTN_HOVER_SHADOW = "0 18px 40px rgba(3, 7, 18, 0.65)";
const BTN_BACKGROUND = "linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))";
const BTN_PRIMARY_BACKGROUND = "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)";

export interface IButtonStyleOptions {
    primary?: boolean;
}

export const applyButtonStyles = (btn: HTMLButtonElement, options: IButtonStyleOptions = {}) => {
    const style = btn.style;
    style.padding = "8px";
    style.borderRadius = "12px";
    style.fontWeight = "600";
    style.letterSpacing = "0.4px";
    style.transition = "transform var(--transition), box-shadow var(--transition), background var(--transition)";

    applyButtonRestStyles(btn, options);
    addButtonStateListeners(btn);
    // Other components (CreateGameButton/JoinGameButton) toggle `disabled`
    // directly on the ref, so restyle whenever the attribute flips.
    observeDisabled(btn, {
        onDisable: () => applyButtonDisabledStyles(btn),
        onEnable: () => applyButtonRestStyles(btn, options),
    });
};

export const applyInputStyles = (input: HTMLInputElement) => {
    const style = input.style;
    style.padding = "10px 12px";
    style.borderRadius = "10px";
    style.width = "160px";
    style.outline = "none";
    style.transition = "box-shadow var(--transition), transform var(--transition)";

    applyInputRestStyles(input);
    addInputFocusListeners(input);
    // The stylesheet's `input:disabled` rule (an element selector, still
    // active) must not be masked by the inline background/border/color.
    observeDisabled(input, {
        onDisable: () => clearInputRestStyles(input),
        onEnable: () => applyInputRestStyles(input),
    });
};

const applyButtonRestStyles = (btn: HTMLButtonElement, { primary = false }: IButtonStyleOptions) => {
    const style = btn.style;
    style.cursor = "pointer";
    style.opacity = "";
    style.transform = "";
    style.boxShadow = BTN_REST_SHADOW;

    if (primary) {
        style.background = BTN_PRIMARY_BACKGROUND;
        style.color = "#04212a";
        style.border = "1px solid rgba(255, 255, 255, 0.06)";
        style.textShadow = "0 1px 0 rgba(255, 255, 255, 0.05)";
    } else {
        style.background = BTN_BACKGROUND;
        style.color = "#ddebff";
        style.border = "1px solid transparent";
    }
};

const applyButtonDisabledStyles = (btn: HTMLButtonElement) => {
    const style = btn.style;
    style.cursor = "not-allowed";
    style.opacity = "0.6";
    style.background = "#9ca3af";
    style.boxShadow = "none";
    style.transform = "none";
};

const addButtonStateListeners = (btn: HTMLButtonElement) => {
    btn.addEventListener("mouseenter", () => {
        if (btn.disabled) {
            return;
        }
        btn.style.transform = "translateY(-4px)";
        btn.style.boxShadow = BTN_HOVER_SHADOW;
    });

    btn.addEventListener("mouseleave", () => {
        if (btn.disabled) {
            return;
        }
        btn.style.transform = "";
        btn.style.boxShadow = BTN_REST_SHADOW;
    });

    btn.addEventListener("mousedown", () => {
        if (btn.disabled) {
            return;
        }
        btn.style.transform = "translateY(-1px)";
    });

    btn.addEventListener("mouseup", () => {
        if (btn.disabled) {
            return;
        }
        btn.style.transform = "translateY(-4px)";
    });
};

const applyInputRestStyles = (input: HTMLInputElement) => {
    const style = input.style;
    style.background = "var(--glass)";
    style.border = "1px solid var(--glass-border)";
    style.color = "#eaf6ff";
};

const clearInputRestStyles = (input: HTMLInputElement) => {
    const style = input.style;
    style.background = "";
    style.border = "";
    style.color = "";
};

const addInputFocusListeners = (input: HTMLInputElement) => {
    input.addEventListener("focus", () => {
        input.style.boxShadow = "0 6px 18px rgba(96, 165, 250, 0.06)";
        input.style.transform = "translateY(-2px)";
    });

    input.addEventListener("blur", () => {
        input.style.boxShadow = "";
        input.style.transform = "";
    });
};

interface IDisabledCallbacks {
    onDisable: () => void;
    onEnable: () => void;
}

const observeDisabled = (el: HTMLButtonElement | HTMLInputElement, { onDisable, onEnable }: IDisabledCallbacks) => {
    const observer = new MutationObserver(() => {
        if (el.disabled) {
            onDisable();
        } else {
            onEnable();
        }
    });

    observer.observe(el, { attributes: true, attributeFilter: ["disabled"] });
};
