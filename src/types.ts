import type { INewOldHullLocMap } from "@shared/index";
import { ICellLoc } from "@shared/types";
import type { HTMLImage } from "./components/native/Image";
import { SwitchPlayerButton } from "./components/SwitchPlayerButton";
import { AnimationLayer } from "./models/AnimationLayer";

export interface IDynamicComponents {
    button: {
        switchPlayerBtn?: SwitchPlayerButton;
    };
    span: {};
    div: {};
    input: {};
}

export interface IAnimation {
    id: string;
    duration: number; // in milliseconds
    elements: HTMLElement[];
    execute(): Promise<void>;
    loadLayer(layer: AnimationLayer): void;
}

// TODO: Consider if props separated from actual class properties is necessary
export interface IAnimationProps {
    duration?: number;
}

export interface IMoveShipAnimationProps extends IAnimationProps {
    shipId: string;
    startingOrientation: number;
    hullMap: Map<string, INewOldHullLocMap>;
}

export interface IMoveAnimationProps extends IAnimationProps {
    fromCell: ICellLoc;
    toCell: ICellLoc;
    removeAfterComplete?: boolean;
    element: HTMLElement;
}

export interface IRotateAnimationProps extends IAnimationProps {
    element: HTMLElement;
    degrees: number;
    removeAfterComplete?: boolean;
}

export interface IProjectileAnimationProps extends IMoveAnimationProps {
    element: HTMLElement;
}

export interface IHitAnimationProps extends IHullBaseAnimationProps {}

export interface IDestroyedAnimationProps extends IHullBaseAnimationProps {}

export interface IHullBaseAnimationProps extends IAnimationProps {
    id?: string;
    elements?: { el: HTMLElement; rect: DOMRect }[];
}

export interface IconProps {
    id?: string;
    src: string;
    addStyles?: (ref: HTMLImage) => void;
}
