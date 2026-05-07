import { SELECTABLE_ID, Z_INDEX } from "@shared/constants";
import { ICellLoc } from "@shared/types";
import { Selectable } from "../Selectable";
import { PathMenuButton } from "./PathMenuButton";

interface Props {
    paths: ICellLoc[][];
    initialIndex?: number;
    onCycle: (index: number) => void;
    onConfirm: () => void;
    onBack: () => void;
    onDismiss: () => void;
}

export class PathMenu extends Selectable {
    private currentIndex: number = 0;
    private leftBtn: PathMenuButton;
    private rightBtn: PathMenuButton;
    private confirmBtn: PathMenuButton;
    private backBtn: PathMenuButton;
    private outsideClickHandler: (e: MouseEvent) => void;

    constructor(private props: Props) {
        super(SELECTABLE_ID.PATH_MENU);
        this.currentIndex = props.initialIndex ?? 0;
    }

    public build(): HTMLElement {
        this.ref = document.createElement("div");
        this.ref.id = SELECTABLE_ID.PATH_MENU;
        this.addStyles();

        this.backBtn = new PathMenuButton("path-menu-back", {
            label: "Back",
            onClick: () => this.props.onBack(),
        });
        this.leftBtn = new PathMenuButton("path-menu-left", {
            label: "<",
            onClick: () => this.cycle(-1),
            disabled: this.shouldDisableCycling(),
        });
        this.confirmBtn = new PathMenuButton("path-menu-confirm", {
            label: "Confirm",
            onClick: () => this.props.onConfirm(),
        });
        this.rightBtn = new PathMenuButton("path-menu-right", {
            label: ">",
            onClick: () => this.cycle(1),
            disabled: this.shouldDisableCycling(),
        });

        [this.backBtn, this.leftBtn, this.confirmBtn, this.rightBtn].forEach((btn) => {
            this.addChild(btn);
            this.ref.appendChild(btn.build());
        });

        this.attachOutsideClickHandler();

        return this.ref;
    }

    public cycle(direction: 1 | -1) {
        const total = this.props.paths.length;
        if (total === 0) return;
        this.currentIndex = (this.currentIndex + direction + total) % total;
        this.props.onCycle(this.currentIndex);
    }

    public getCurrentIndex() {
        return this.currentIndex;
    }

    public close() {
        this.detachOutsideClickHandler();
        this.removeChildren();
        this.ref.remove();
    }

    private shouldDisableCycling() {
        return this.props.paths.length <= 1;
    }

    private attachOutsideClickHandler() {
        this.outsideClickHandler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (this.ref.contains(target)) return;
            this.props.onDismiss();
        };
        // Defer so the click that opened the menu doesn't immediately close it.
        setTimeout(() => {
            document.addEventListener("click", this.outsideClickHandler);
        }, 0);
    }

    private detachOutsideClickHandler() {
        if (this.outsideClickHandler) {
            document.removeEventListener("click", this.outsideClickHandler);
        }
    }

    protected addStyles() {
        this.ref.style.position = "fixed";
        this.ref.style.bottom = "24px";
        this.ref.style.left = "50%";
        this.ref.style.transform = "translateX(-50%)";
        this.ref.style.background = "rgba(15, 23, 36, 0.95)";
        this.ref.style.border = "1px solid rgba(110, 231, 183, 0.3)";
        this.ref.style.borderRadius = "8px";
        this.ref.style.padding = "8px";
        this.ref.style.display = "flex";
        this.ref.style.gap = "8px";
        this.ref.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.4)";
        this.ref.style.zIndex = Z_INDEX.ACTION_MENU;
        this.ref.style.animation = "fadeIn 0.2s ease";
    }
}
