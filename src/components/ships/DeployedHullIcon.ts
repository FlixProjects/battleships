import { DEPLOYED_HULL_PREFIX, TColor } from "@shared/constants";
import { gameManager, interactionManager } from "../../index";
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

    private isOwnShip(): boolean {
        return gameManager.getPlayer().id === this.props.playerId;
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
     * Opponent hulls must not swallow clicks belonging to an active targeting
     * flow (attack/support resolve via a document-level listener). So they only
     * intercept — opening the opponent's tooltip-only ActionMenu — when idle.
     */
    private onOpponentClick = async (e: MouseEvent): Promise<void> => {
        if (interactionManager.isInteracting()) return; // defer to the active flow
        e.stopPropagation();
        await this.onClick(e);
    };

    public onSelectable(): void {
        if (this.isOwnShip()) {
            this.addClickEventListener();
        } else {
            this.ref.addEventListener("click", this.onOpponentClick);
        }
        this.ref.addEventListener("mouseenter", this.mouseEnter);
        this.ref.addEventListener("mouseleave", this.mouseLeave);
    }

    public onUnselectable(): void {
        if (this.isOwnShip()) {
            this.removeClickEventListener();
        } else {
            this.ref.removeEventListener("click", this.onOpponentClick);
        }
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
