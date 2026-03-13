import { ICellLoc } from "../shared";
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

export interface IMoveAnimationProps extends IAnimationProps {
    elementId: string;
    fromCell: ICellLoc;
    toCell: ICellLoc;
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
