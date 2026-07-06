import { IAppState } from "@shared/types/types";
import { BaseComponent } from "./BaseComponent";

export class HeroSection extends BaseComponent {
    private heroBanner?: HTMLElement;

    updateState(_state?: IAppState): void {
        // this.remove();
        this.build();
    }

    build() {
        const page = document.getElementById("page-container");
        if (!page?.querySelector("#hero-section")) {
            this.ref = document.createElement("header");
            this.ref.id = "hero-section";
            this.addStyles();
            this.buildHeroBanner();
            page?.prepend(this.ref);
        }

        return this.ref;
    }

    private buildHeroBanner() {
        const heroBanner = document.createElement("div");
        this.heroBanner = heroBanner;

        this.addHeroBannerStyles();

        this.buildTitle();
        this.buildVersion();

        this.ref.appendChild(heroBanner);
    }

    private buildTitle() {
        const title = document.createElement("h1");
        title.classList.add("title");
        title.textContent = "Battleships";
        title.style.marginRight = "16px";
        this.heroBanner?.appendChild(title);
    }

    private buildVersion() {
        const version = document.createElement("p");
        version.classList.add("version");
        version.textContent = `v${APP_VERSION}`;
        this.heroBanner?.appendChild(version);
    }

    private addHeroBannerStyles() {
        const banner = this.heroBanner;

        if (banner) {
            banner.style.display = "flex";
            banner.style.flexDirection = "row";
            banner.style.alignItems = "flex-start";
            banner.style.justifyContent = "flex-start";
        }
    }

    addStyles() {
        this.ref.style.display = "flex";
        this.ref.style.flexDirection = "row";
        this.ref.style.alignItems = "flex-start";
        this.ref.style.justifyContent = "flex-start";
    }
}
