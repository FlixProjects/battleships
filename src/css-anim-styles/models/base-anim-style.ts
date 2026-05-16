export class BaseAnimStyle {
    name: string = "";
    id = this.name + "-style";
    textContent: string = "";
    load() {
        if (this.name.length === 0) {
            console.warn("Css anim name not initialised");
            return;
        }

        if (document.getElementById(this.id)) return;
        const style = document.createElement("style");
        style.id = this.id;
        style.textContent = this.textContent;

        document.head.appendChild(style);
    }
    attachTo(ref: HTMLElement) {
        ref.style.animation = `${this.name} 1.8s ease-in-out infinite`;
        ref.style.transformOrigin = "center center";
    }
}
