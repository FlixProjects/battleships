import { ASSET_PATHS, COLOR_RGBA, SELECTABLE_ID, Z_INDEX } from "@shared/constants";
import { GameConfig } from "@shared/index";
import { IAppState } from "@shared/types";
import { interactionManager } from "../..";
import { getAppScreen } from "../../utils/screen-helper";
import { BaseComponent } from "../BaseComponent";
import { Icon } from "../ships/Icon";
import { StatBadge } from "../ships/StatBadge";
import { DetailsHullRow, DetailsHullValue, DetailsViewModel } from "../../models/details/DetailsViewModel";

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

        // Body-mounted like ActionPanel: close when leaving the InGame screen
        // so an open panel doesn't linger over the lobby.
        const screen = _state?.screen ?? getAppScreen();

        if (screen !== GameConfig.AppScreen.InGame) {
            this.close();
        }
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

        this.ref.appendChild(this.renderHeader(vm.title, borderColor));
        if (vm.description) {
            this.ref.appendChild(this.renderDescription(vm.description));
        }
        if (vm.stats.length > 0) {
            this.ref.appendChild(this.renderStats(vm));
        }
        if (vm.hullRows && vm.hullRows.length > 0) {
            this.ref.appendChild(this.renderHullRows(vm.hullRows));
        }
    }

    private renderHeader(title: string, borderColor: string): HTMLElement {
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.gap = "8px";
        header.style.borderBottom = `1px solid ${borderColor}`;
        header.style.paddingBottom = "8px";

        const heading = document.createElement("div");
        heading.textContent = title;
        heading.style.color = "#ffffff";
        heading.style.fontSize = "18px";
        heading.style.fontWeight = "bold";
        header.appendChild(heading);

        header.appendChild(this.renderCloseButton());
        return header;
    }

    private renderCloseButton(): HTMLElement {
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.setAttribute("aria-label", "Close details");
        btn.style.background = "transparent";
        btn.style.border = "none";
        btn.style.color = "rgba(255, 255, 255, 0.6)";
        btn.style.fontSize = "16px";
        btn.style.lineHeight = "1";
        btn.style.cursor = "pointer";
        btn.style.padding = "2px 4px";
        btn.addEventListener("mouseenter", () => (btn.style.color = "#ffffff"));
        btn.addEventListener("mouseleave", () => (btn.style.color = "rgba(255, 255, 255, 0.6)"));
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.close();
            interactionManager.clearInteraction();
        });
        return btn;
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

    /** Per-hull section: `Hull 1/2   <armor> [armor] | <health> [health]`. */
    private renderHullRows(rows: DetailsHullRow[]): HTMLElement {
        const section = document.createElement("div");
        section.style.display = "flex";
        section.style.flexDirection = "column";
        section.style.gap = "4px";

        const heading = document.createElement("span");
        heading.textContent = "Health & Armor";
        heading.style.color = "rgba(255, 255, 255, 0.5)";
        heading.style.fontSize = "10px";
        heading.style.textTransform = "uppercase";
        section.appendChild(heading);

        rows.forEach((hull) => {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.style.color = "#ffffff";
            row.style.fontSize = "12px";

            const label = document.createElement("span");
            label.textContent = hull.label;

            const values = document.createElement("div");
            values.style.display = "flex";
            values.style.alignItems = "center";
            values.style.gap = "6px";
            values.appendChild(this.renderValueWithIcon(hull.armor, ASSET_PATHS.ARMOR_ICON));
            values.appendChild(this.renderValueDivider());
            values.appendChild(this.renderValueWithIcon(hull.health, ASSET_PATHS.HEALTH_ICON));

            row.appendChild(label);
            row.appendChild(values);
            section.appendChild(row);
        });
        return section;
    }

    /** `<current/max> <icon>` pair (StatBadge is icon-first, this format is value-first). */
    private renderValueWithIcon(value: DetailsHullValue, iconSrc: string): HTMLElement {
        const wrap = document.createElement("div");
        wrap.style.display = "flex";
        wrap.style.alignItems = "center";
        wrap.style.gap = "3px";

        const text = document.createElement("span");
        text.textContent = `${value.current}/${value.max}`;
        text.style.fontWeight = "bold";
        wrap.appendChild(text);

        const icon = new Icon({
            src: iconSrc,
            addStyles: (img) => {
                img.ref.style.width = "14px";
                img.ref.style.height = "14px";
            },
        });
        this.addChild(icon);
        wrap.appendChild(icon.build());
        return wrap;
    }

    private renderValueDivider(): HTMLElement {
        const divider = document.createElement("span");
        divider.textContent = "|";
        divider.style.color = "rgba(255, 255, 255, 0.3)";
        return divider;
    }

    protected addStyles(): void {
        this.ref.style.position = "fixed";
        this.ref.style.right = "0";
        this.ref.style.top = "50%";
        this.ref.style.transform = HIDDEN_TRANSFORM;
        this.ref.style.width = "240px";
        this.ref.style.background =
            "linear-gradient(180deg, rgba(15, 23, 36, 0.97), rgba(10, 15, 28, 0.97))";
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
