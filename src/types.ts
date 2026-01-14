import { ICellLoc, IGameState } from "../shared";
import type { HTMLImage } from "./components/native/Image";
import { SwitchPlayerButton } from "./components/SwitchPlayerButton";

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
    execute(): Promise<void>;
}

export interface IAnimationProps {
    duration?: number;
}

export interface IMoveAnimationProps extends IAnimationProps {
    id: string;
    fromCell: ICellLoc;
    toCell: ICellLoc;
    removeAfterComplete?: boolean;
}

export interface IconProps {
    id?: string;
    src: string;
    addStyles?: (ref: HTMLImage) => void;
}
