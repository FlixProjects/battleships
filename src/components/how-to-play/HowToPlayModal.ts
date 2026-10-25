import { Z_INDEX } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { getAppScreen } from "../../utils/screen-helper";
import { BaseComponent } from "../BaseComponent";
import { applyButtonStyles } from "../styles/inline-styles";
import { HOW_TO_PLAY_SLIDES, IHowToPlaySlide } from "./slides";

const MUTED_WHITE = "rgba(255, 255, 255, 0.6)";

/**
 * Body-mounted carousel of How to Play slides. Built once, then toggled via
 * open() / close(); every open starts from the first slide.
 */
export class HowToPlayModal extends BaseComponent {
    private card: HTMLDivElement;
    private title: HTMLHeadingElement;
    private mediaFrame: HTMLDivElement;
    private description: HTMLParagraphElement;
    private backButton: HTMLButtonElement;
    private nextButton: HTMLButtonElement;
    private dots: HTMLButtonElement[] = [];
    private index = 0;
    private isOpen = false;

    constructor() {
        super();
        this.build();
    }

    updateState(_state?: IAppState): void {
        const screen = _state?.screen ?? getAppScreen();
        if (screen !== GameConfig.AppScreen.Games) {
            this.close();
        }
    }

    build() {
        if (this.ref) {
            return this.ref;
        }

        this.ref = document.createElement("div");
        this.ref.id = "howToPlayModal";
        this.ref.setAttribute("role", "dialog");
        this.ref.setAttribute("aria-modal", "true");
        this.ref.setAttribute("aria-labelledby", "howToPlayTitle");
        this.addStyles();
        this.ref.addEventListener("click", (e) => {
            e.stopPropagation();
            if (e.target === this.ref) {
                this.close();
            }
        });

        this.card = this.buildCard();
        this.ref.appendChild(this.card);
        document.body.appendChild(this.ref);
        this.watchViewportWidth();

        return this.ref;
    }

    public open() {
        this.isOpen = true;
        this.ref.style.display = "flex";
        this.showSlide(0);
        document.addEventListener("keydown", this.onKeyDown);
    }

    public close() {
        if (!this.isOpen) {
            return;
        }
        this.isOpen = false;
        this.ref.style.display = "none";
        this.mediaFrame.replaceChildren();
        document.removeEventListener("keydown", this.onKeyDown);
    }

    public get opened() {
        return this.isOpen;
    }

    protected addStyles() {
        const style = this.ref.style;
        style.display = "none";
        style.position = "fixed";
        style.inset = "0";
        style.zIndex = Z_INDEX.MODAL;
        style.alignItems = "center";
        style.justifyContent = "center";
        style.padding = "16px";
        style.background = "rgba(2, 6, 23, 0.72)";
        style.backdropFilter = "blur(4px)";
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            this.close();
        } else if (e.key === "ArrowLeft") {
            this.showSlide(this.index - 1);
        } else if (e.key === "ArrowRight") {
            this.showSlide(this.index + 1);
        }
    };

    private showSlide(index: number) {
        if (index < 0 || index >= HOW_TO_PLAY_SLIDES.length) {
            return;
        }
        this.index = index;
        const slide = HOW_TO_PLAY_SLIDES[index];

        this.title.textContent = slide.title;
        this.description.textContent = slide.description;
        this.mediaFrame.replaceChildren(this.buildMedia(slide));

        this.backButton.disabled = index === 0;
        this.nextButton.disabled = index === HOW_TO_PLAY_SLIDES.length - 1;
        this.dots.forEach((dot, i) => this.styleDot(dot, i === index));
    }

    private buildCard() {
        const card = document.createElement("div");
        card.id = "howToPlayCard";
        const style = card.style;
        style.display = "flex";
        style.flexDirection = "column";
        style.gap = "14px";
        style.width = "min(760px, 100%)";
        style.maxHeight = "100%";
        style.overflowY = "auto";
        style.padding = "18px";
        style.borderRadius = "var(--radius)";
        style.background = "var(--bg)";
        style.border = "1px solid var(--glass-border)";
        style.boxShadow = "0 24px 60px rgba(2, 6, 23, 0.7)";
        style.color = "#eaf6ff";

        card.append(this.buildHeader(), this.buildStage(), this.buildDots(), this.buildDescription());
        return card;
    }

    private buildHeader() {
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.gap = "8px";

        this.title = document.createElement("h2");
        this.title.id = "howToPlayTitle";
        this.title.style.margin = "0";
        this.title.style.fontSize = "18px";
        this.title.style.fontWeight = "700";

        header.append(this.title, this.buildCloseButton());
        return header;
    }

    private buildCloseButton() {
        const btn = document.createElement("button");
        btn.id = "howToPlayClose";
        btn.textContent = "✕";
        btn.setAttribute("aria-label", "Close How to Play");
        btn.style.background = "transparent";
        btn.style.border = "none";
        btn.style.color = MUTED_WHITE;
        btn.style.fontSize = "18px";
        btn.style.lineHeight = "1";
        btn.style.cursor = "pointer";
        btn.style.padding = "4px 6px";
        btn.addEventListener("mouseenter", () => (btn.style.color = "#ffffff"));
        btn.addEventListener("mouseleave", () => (btn.style.color = MUTED_WHITE));
        btn.addEventListener("click", () => this.close());
        return btn;
    }

    // Back arrow, media, next arrow
    private buildStage() {
        const stage = document.createElement("div");
        stage.style.display = "flex";
        stage.style.alignItems = "center";
        stage.style.gap = "10px";

        this.backButton = this.buildArrow("howToPlayBack", "‹", "Previous slide", () => this.showSlide(this.index - 1));
        this.nextButton = this.buildArrow("howToPlayNext", "›", "Next slide", () => this.showSlide(this.index + 1));

        this.mediaFrame = document.createElement("div");
        const style = this.mediaFrame.style;
        style.position = "relative";
        style.flex = "1";
        style.minWidth = "0";
        style.aspectRatio = "16 / 10";
        style.borderRadius = "10px";
        style.overflow = "hidden";
        style.background = "rgba(0, 0, 0, 0.35)";
        style.border = "1px solid var(--glass-border)";

        stage.append(this.backButton, this.mediaFrame, this.nextButton);
        return stage;
    }

    private buildArrow(id: string, label: string, ariaLabel: string, onClick: () => void) {
        const btn = document.createElement("button");
        btn.id = id;
        btn.textContent = label;
        btn.setAttribute("aria-label", ariaLabel);
        applyButtonStyles(btn);
        btn.style.flexShrink = "0";
        btn.style.width = "40px";
        btn.style.height = "40px";
        btn.style.padding = "0";
        btn.style.fontSize = "24px";
        btn.style.lineHeight = "1";
        btn.addEventListener("click", onClick);
        return btn;
    }

    private buildMedia(slide: IHowToPlaySlide) {
        const media =
            slide.media.kind === "video" ? this.buildVideo(slide.media.src) : this.buildImage(slide.media.src, slide);
        media.id = "howToPlayMedia";
        media.style.display = "block";
        media.style.width = "100%";
        media.style.height = "100%";
        media.style.objectFit = "contain";
        media.addEventListener("error", () => this.showMissingMedia(media));
        return media;
    }

    private buildVideo(src: string) {
        const video = document.createElement("video");
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute("src", src);
        return video;
    }

    private buildImage(src: string, slide: IHowToPlaySlide) {
        const image = document.createElement("img");
        image.alt = slide.title;
        image.setAttribute("src", src);
        return image;
    }

    // Keeps the media element (and its src) in place, with a note over it
    private showMissingMedia(media: HTMLElement) {
        media.style.visibility = "hidden";
        const note = document.createElement("span");
        note.textContent = "Clip coming soon";
        note.style.position = "absolute";
        note.style.inset = "0";
        note.style.display = "flex";
        note.style.alignItems = "center";
        note.style.justifyContent = "center";
        note.style.color = "var(--muted)";
        note.style.fontSize = "13px";
        this.mediaFrame.appendChild(note);
    }

    private buildDots() {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexWrap = "wrap";
        row.style.justifyContent = "center";
        row.style.gap = "6px";

        this.dots = HOW_TO_PLAY_SLIDES.map((slide, i) => {
            const dot = document.createElement("button");
            dot.className = "how-to-play-dot";
            dot.setAttribute("aria-label", `Go to slide ${i + 1}: ${slide.title}`);
            dot.style.width = "10px";
            dot.style.height = "10px";
            dot.style.padding = "0";
            dot.style.borderRadius = "50%";
            dot.style.border = "none";
            dot.style.cursor = "pointer";
            dot.style.transition = "background var(--transition), transform var(--transition)";
            dot.addEventListener("click", () => this.showSlide(i));
            row.appendChild(dot);
            return dot;
        });

        return row;
    }

    private styleDot(dot: HTMLButtonElement, isActive: boolean) {
        dot.setAttribute("aria-current", String(isActive));
        dot.style.background = isActive ? "var(--accent)" : "rgba(255, 255, 255, 0.2)";
        dot.style.transform = isActive ? "scale(1.25)" : "";
    }

    private buildDescription() {
        this.description = document.createElement("p");
        this.description.id = "howToPlayDescription";
        this.description.style.margin = "0";
        this.description.style.fontSize = "14px";
        this.description.style.lineHeight = "1.6";
        this.description.style.color = "rgba(234, 246, 255, 0.85)";
        this.description.style.minHeight = "4.8em";
        return this.description;
    }

    // Inline styles can't hold a media query, so swap sizes by hand (as GameActions does)
    private watchViewportWidth() {
        const narrowViewport = window.matchMedia("(max-width: 520px)");
        this.applyViewportStyles(narrowViewport.matches);
        narrowViewport.addEventListener("change", (event) => this.applyViewportStyles(event.matches));
    }

    private applyViewportStyles(isNarrow: boolean) {
        const arrowSize = isNarrow ? "32px" : "40px";
        [this.backButton, this.nextButton].forEach((btn) => {
            btn.style.width = arrowSize;
            btn.style.height = arrowSize;
            btn.style.fontSize = isNarrow ? "20px" : "24px";
        });
        this.card.style.padding = isNarrow ? "12px" : "18px";
        this.ref.style.padding = isNarrow ? "8px" : "16px";
    }
}
