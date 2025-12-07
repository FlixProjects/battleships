import { BaseComponent } from "./BaseComponent";

interface ToastOptions {
    message: string;
    duration?: number;
    type?: "info" | "error" | "success" | "warning";
}

export class Toast extends BaseComponent {
    private static container: HTMLDivElement;
    private timeout: NodeJS.Timeout;

    constructor(private options: ToastOptions) {
        super();
        this.ensureContainer();
    }

    private ensureContainer() {
        if (!Toast.container) {
            Toast.container = document.createElement("div");
            Toast.container.id = "toast-container";
            this.styleContainer();
            document.body.appendChild(Toast.container);
        }
    }

    private styleContainer() {
        const c = Toast.container;
        c.style.position = "fixed";
        c.style.top = "20px";
        c.style.left = "50%";
        c.style.transform = "translateX(-50%)";
        c.style.zIndex = "100";
        c.style.display = "flex";
        c.style.width = "100%";
        c.style.flexDirection = "column";
        c.style.gap = "8px";
        c.style.padding = "16px";
    }

    public build() {
        this.ref = document.createElement("div");
        this.ref.className = "toast"; // for animation
        this.ref.textContent = this.options.message;
        this.addStyles();
        Toast.container.appendChild(this.ref);

        const duration = this.options.duration ?? 3000;
        this.timeout = setTimeout(() => this.remove(), duration);

        return this.ref;
    }

    protected addStyles() {
        const colors = {
            info: { bg: "rgba(110, 231, 183, 0.5)", border: "rgba(110, 231, 183, 0.8)" },
            error: { bg: "rgba(255, 110, 110, 0.5)", border: "rgba(255, 110, 110, 0.8)" },
            success: { bg: "rgba(110, 231, 183, 0.5)", border: "rgba(110, 231, 183, 0.8)" },
            warning: { bg: "rgba(255, 193, 7, 0.5)", border: "rgba(255, 193, 7, 0.8)" },
        };

        const type = this.options.type ?? "info";
        const color = colors[type];

        this.ref.style.background = color.bg;
        this.ref.style.border = `1px solid ${color.border}`;
        this.ref.style.borderRadius = "8px";
        this.ref.style.padding = "12px 16px";
        this.ref.style.color = "#ffffffff";
        this.ref.style.fontSize = "14px";
        this.ref.style.minWidth = "200px";
        this.ref.style.maxWidth = "400px";
        this.ref.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
        this.ref.style.boxSizing = "content-box";
    }

    protected remove() {
        clearTimeout(this.timeout);
        super.remove();
    }

    public static show(options: ToastOptions) {
        const toast = new Toast(options);
        toast.build();
        return toast;
    }
}
