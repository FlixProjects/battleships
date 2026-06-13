import { v7 as uuidv7 } from "uuid";
import { appConfig } from "../../config/app-config";
import { IAnimation, IAnimationProps } from "../../types/animations/types";
import { AnimationLayer } from "../AnimationLayer";

const DEFAULT_CANCEL_CLICK = () => {
    if (appConfig.deployEnv === "local") {
        console.log("no animation to cancel");
    }
};

type TResolve = (value: void | PromiseLike<void>) => void;

export class BaseAnimation implements IAnimation {
    public id: string = uuidv7();
    public elements: HTMLElement[];
    public animationLayer: AnimationLayer;
    public duration: number;

    protected onCancelClicks: (() => void)[] = [DEFAULT_CANCEL_CLICK];
    protected onCancelClick: () => void = () => this.onCancelClicks.forEach((cc) => cc());

    constructor(props: IAnimationProps) {
        this.duration = props.duration || 750;
        this.animationLayer = new AnimationLayer();
    }
    public async execute(): Promise<void> {
        // To be implemented by subclasses
    }

    public loadLayer(layer: AnimationLayer) {
        layer.reloadLayer();
        this.animationLayer = layer;
    }

    protected animate(runAnimation: () => void): Promise<void> {
        return new Promise((resolve) => this.runAnimationFlow(resolve, runAnimation));
    }

    protected durationToSeconds(): string {
        return (this.duration / 1000).toFixed(2);
    }

    private runAnimationFlow(resolve: TResolve, runAnimation: () => void) {
        this.loadCancelClickHandler(resolve);
        this.addCancelAnimationListener();
        runAnimation();
        this.startAnimationTimer();
    }

    private loadCancelClickHandler(resolve: TResolve) {
        const onCancelClick = this.getEndAnimation(resolve);
        this.onCancelClicks.push(onCancelClick);
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
        this.onCancelClicks = [DEFAULT_CANCEL_CLICK];
    }

    private addCancelAnimationListener() {
        document.addEventListener("click", this.onCancelClick);
    }
}
