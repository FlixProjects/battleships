import { appConfig } from "../../config/app-config";
import { IAnimation, IAnimationProps } from "../../types";

const DEFAULT_CANCEL_CLICK = () => {
    if (appConfig.deployEnv === "local") {
        console.log("no animation to cancel");
    }
};

type TResolve = (value: void | PromiseLike<void>) => void;

export class BaseAnimation implements IAnimation {
    protected onCancelClick: () => void = DEFAULT_CANCEL_CLICK;
    protected duration: number;

    constructor(props: IAnimationProps) {
        this.duration = props.duration || 750;
    }
    public async execute(): Promise<void> {
        // To be implemented by subclasses
    }

    protected animate(runAnimation: () => void): Promise<void> {
        return new Promise((resolve) => this.runAnimationFlow(resolve, runAnimation));
    }

    private runAnimationFlow(resolve: TResolve, runAnimation: () => void) {
        this.loadCancelClickHandler(resolve);
        this.addCancelAnimationListener();
        runAnimation();
        this.startAnimationTimer();
    }

    private loadCancelClickHandler(resolve: TResolve) {
        const onCancelClick = this.getEndAnimation(resolve);
        this.onCancelClick = onCancelClick;
        return onCancelClick;
    }

    private startAnimationTimer() {
        setTimeout(() => {
            this.onCancelClick();
        }, this.duration);
    }

    private getEndAnimation(resolve: TResolve) {
        const onCancelClick = () => {
            resolve();
            this.resetCancelClickListener();
            document.removeEventListener("click", onCancelClick);
        };
        return onCancelClick;
    }

    private resetCancelClickListener() {
        this.onCancelClick = DEFAULT_CANCEL_CLICK;
    }

    private addCancelAnimationListener() {
        document.addEventListener("click", this.onCancelClick);
    }
}
