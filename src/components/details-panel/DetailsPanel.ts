import { COLOR_RGBA, SELECTABLE_ID, Z_INDEX } from "@shared/constants";
import { IAppState } from "@shared/types";
import { BaseComponent } from "../BaseComponent";
import { StatBadge } from "../ships/StatBadge";
import { DetailsViewModel } from "../../models/details/DetailsViewModel";

const HIDDEN_TRANSFORM = "translateY(-50%) translateX(115%)";
const SHOWN_TRANSFORM = "translateY(-50%) translateX(0)";

/**
 * Right-side slide-out mirroring ActionPanel. Read-only and decoupled from the
 * domain: it renders a generic DetailsViewModel (ship or effect). Coexists with
 * the left ActionPanel. Built once, then toggled via open(vm) / close().
 */
export class DetailsPanel extends BaseComponent {
    private built = false;

    public updateState(_state?: IAppState): void {
        if (!this.built) this.build();
    }

    public build(): HTMLElement {
        this.ref = document.createElement("div");
        this.ref.id = SELECTABLE_ID.DETAILS_PANEL;
        this.addStyles();
        document.body.appendChild(this.ref);
        this.built = true;
        return this.ref;
    }

    public open(vm: DetailsViewModel): void {
        if (!this.built) this.build();
        this.render(vm);
        this.ref.style.display = "flex";
        // Force reflow so the transform transition animates from the hidden state.
        void this.ref.offsetWidth;
        this.ref.style.transform = SHOWN_TRANSFORM;
    }

    public close(): void {
        if (!this.built) return;
        this.ref.style.transform = HIDDEN_TRANSFORM;
        window.setTimeout(() => {
            if (this.ref.style.transform === HIDDEN_TRANSFORM) {
                this.ref.style.display = "none";
            }
        }, 250);
    }

    private render(vm: DetailsViewModel): void {
        const borderColor = COLOR_RGBA[vm.color as keyof typeof COLOR_RGBA] ?? COLOR_RGBA.teal;
        this.ref.style.border = `1px solid ${borderColor}`;
        this.ref.style.borderRight = "none";
        this.ref.replaceChildren();

        this.ref.appendChild(this.renderTitle(vm.title, borderColor));
        if (vm.description) {
            this.ref.appendChild(this.renderDescription(vm.description));
        }
        if (vm.stats.length > 0) {
            this.ref.appendChild(this.renderStats(vm));
        }
        if (vm.healthRows && vm.healthRows.length > 0) {
            this.ref.appendChild(this.renderHealth(vm));
        }
    }

    private renderTitle(title: string, borderColor: string): HTMLElement {
        const el = document.createElement("div");
        el.textContent = title;
        el.style.color = "#ffffff";
        el.style.fontSize = "18px";
        el.style.fontWeight = "bold";
        el.style.borderBottom = `1px solid ${borderColor}`;
        el.style.paddingBottom = "8px";
        return el;
    }

    private renderDescription(description: string): HTMLElement {
        const el = document.createElement("div");
        el.textContent = description;
        el.style.color = "rgba(255, 255, 255, 0.75)";
        el.style.fontSize = "12px";
        el.style.lineHeight = "1.5";
        return el;
    }

    private renderStats(vm: DetailsViewModel): HTMLElement {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexWrap = "wrap";
        row.style.gap = "12px";

        vm.stats.forEach((stat) => {
            const cell = document.createElement("div");
            cell.style.display = "flex";
            cell.style.flexDirection = "column";
            cell.style.gap = "2px";

            const badge = new StatBadge({ iconSrc: stat.iconSrc, value: stat.value, size: 16 });
            this.addChild(badge);
            cell.appendChild(badge.build());

            const label = document.createElement("span");
            label.textContent = stat.label;
            label.style.color = "rgba(255, 255, 255, 0.5)";
            label.style.fontSize = "10px";
            cell.appendChild(label);

            row.appendChild(cell);
        });
        return row;
    }

    private renderHealth(vm: DetailsViewModel): HTMLElement {
        const section = document.createElement("div");
        section.style.display = "flex";
        section.style.flexDirection = "column";
        section.style.gap = "4px";

        const heading = document.createElement("span");
        heading.textContent = "Health";
        heading.style.color = "rgba(255, 255, 255, 0.5)";
        heading.style.fontSize = "10px";
        heading.style.textTransform = "uppercase";
        section.appendChild(heading);

        (vm.healthRows ?? []).forEach((hp) => {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.color = "#ffffff";
            row.style.fontSize = "12px";

            const label = document.createElement("span");
            label.textContent = hp.label;
            const value = document.createElement("span");
            value.textContent = `${hp.current}/${hp.max}`;
            value.style.fontWeight = "bold";

            row.appendChild(label);
            row.appendChild(value);
            section.appendChild(row);
        });
        return section;
    }

    protected addStyles(): void {
        this.ref.style.position = "fixed";
        this.ref.style.right = "0";
        this.ref.style.top = "50%";
        this.ref.style.transform = HIDDEN_TRANSFORM;
        this.ref.style.width = "240px";
        this.ref.style.background =
            "linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01))";
        this.ref.style.border = "1px solid rgba(255, 255, 255, 0.06)";
        this.ref.style.borderRight = "none";
        this.ref.style.borderRadius = "14px 0 0 14px";
        this.ref.style.padding = "20px";
        this.ref.style.boxShadow = "0 10px 30px rgba(3, 7, 18, 0.6)";
        this.ref.style.display = "none";
        this.ref.style.flexDirection = "column";
        this.ref.style.gap = "14px";
        this.ref.style.zIndex = Z_INDEX.DETAILS_PANEL;
        this.ref.style.transition = "transform 0.25s ease";
    }
}
