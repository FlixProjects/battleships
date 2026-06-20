import { DEPLOYED_HULL_PREFIX, TColor } from "@shared/constants";
import { interactionManager } from "../../index";
import { IMEventType } from "../../models/interaction-manager/types";
import { Selectable } from "../Selectable";
import { HullIcon } from "./HullIcon";

interface Props {
    hullId: string;
    shipId: string;
    playerId: string;
    imgSrc: string;
    color?: TColor;
    refNo?: string;
    rotation?: number;
    mouseEnter?: (hullIconRef?: HTMLElement, defaultMouseEnter?: () => void) => void;
    mouseLeave?: (hullIconRef?: HTMLElement, defaultMouseLeave?: () => void) => void;
}

export class DeployedHullIcon extends Selectable {
    constructor(private props: Props) {
        const id = `${DEPLOYED_HULL_PREFIX}${props.hullId}`;
        super(id);
    }
    public build(): HTMLElement {
        const hullContainer = document.createElement("div");
        hullContainer.id = this.id;
        this.ref = hullContainer;

        const hullIcon = new HullIcon(this.props);

        hullContainer.appendChild(hullIcon.build());
        
        this.isSelectable = true;
        this.setState();

        return this.ref;
    }

    public async onClick(_e?: MouseEvent): Promise<void> {
        interactionManager.handleEvent({
            type: IMEventType.SELECT_SHIP,
            tileId: this.id,
            hullId: this.props.hullId,
            shipId: this.props.shipId,
            selectableId: "select-ship", // FIXME: should this be dynamic?
        });
    }

    /**
     * A hull only intercepts a click (to open its ActionMenu) when idle. During
     * an active targeting flow (deploy/move/attack/support resolve via a
     * document-level listener) it defers, so clicking any ship is handled by that
     * flow — e.g. clicking a ship while deploying registers as an invalid click.
     */
    private onGuardedClick = async (e: MouseEvent): Promise<void> => {
        if (interactionManager.isInteracting()) return; // defer to the active flow
        e.stopPropagation();
        await this.onClick(e);
    };

    public onSelectable(): void {
        this.ref.addEventListener("click", this.onGuardedClick);
        this.ref.addEventListener("mouseenter", this.mouseEnter);
        this.ref.addEventListener("mouseleave", this.mouseLeave);
    }

    public onUnselectable(): void {
        this.ref.removeEventListener("click", this.onGuardedClick);
        this.ref.removeEventListener("mouseenter", this.mouseEnter);
        this.ref.removeEventListener("mouseleave", this.mouseLeave);
    }

    private mouseEnter = () => {
        this.props.mouseEnter?.(this.ref, this._mouseEnter) ?? this._mouseEnter();
    };

    private mouseLeave = () => {
        this.props.mouseLeave?.(this.ref, this._mouseLeave) ?? this._mouseLeave();
    };

    private _mouseEnter = () => {
        this.ref.style.transform = `scale(1.1, 1.1)`;
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.9)";
    };

    private _mouseLeave = () => {
        this.ref.style.transform = `scale(1, 1)`;
        this.ref.style.borderBottomColor = "rgba(110, 231, 183, 0.6)";
    };
}
