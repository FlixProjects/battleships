import { ICellLoc, IGameState } from "../shared";
import type { HTMLImage } from "./components/native/Image";
import { SwitchPlayerButton } from "./components/SwitchPlayerButton";
import { AnimationLayer } from "./models/AnimationLayer";

export const AppStatus = {
    NewGame: "NewGame",
    Initialising: "Initialising",
    Initialised: "Initialised",
    Error: "Error",
    WaitingForPlayers: "WaitingForPlayers",
    GameOver: "GameOver",
} as const;

type TAppStatus = (typeof AppStatus)[keyof typeof AppStatus];

export interface IAppState {
    status: TAppStatus;
    loading: boolean;
    gameState: IGameState;
    currentPlayer?: string;
}

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

export interface IHitAnimationProps extends IAnimationProps {
    id: string;
    elements?: HTMLElement[];
}

export interface IDestroyedAnimationProps extends IAnimationProps {
    id: string;
    elements?: HTMLElement[];
}

export interface IconProps {
    id?: string;
    src: string;
    addStyles?: (ref: HTMLImage) => void;
}
