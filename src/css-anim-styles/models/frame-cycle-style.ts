import { BaseAnimStyle } from "./base-anim-style";

/**
 * Cycles an element's background-image through sprite frames — a pure-CSS
 * "GIF" (background-image is a discrete animatable property), so sprites
 * rebuilt on every re-render never leak JS timers. Each frame holds an equal
 * slice of the loop; the paired stops pin the flip to the slice boundary.
 *
 * Deliberately NOT exported from models/index.ts: `loadStyles()` constructs
 * every export without args at boot, and this style needs its frames — it
 * loads itself lazily in `attachTo`.
 */
export default class FrameCycleAnimStyle extends BaseAnimStyle {
    constructor(
        name: string,
        private frameUrls: string[],
        private durationSeconds = 0.9,
    ) {
        super();
        this.name = name;
        const slice = 100 / frameUrls.length;
        const stops = frameUrls.map((url, i) => {
            const from = (i * slice).toFixed(2);
            const to = ((i + 1) * slice - 0.01).toFixed(2);
            return `${from}%, ${to}% { background-image: url("${url}"); }`;
        });
        this.textContent = `@keyframes ${name} {\n${stops.join("\n")}\n}`;
    }

    attachTo(ref: HTMLElement) {
        this.load();
        // Append rather than replace: FLICKER/PULSE own transform/opacity on
        // ref.style.animation; this animation only flips background-image.
        const anim = `${this.name} ${this.durationSeconds}s linear infinite`;
        ref.style.animation = ref.style.animation ? `${ref.style.animation}, ${anim}` : anim;
        // Warm the cache so the first loop doesn't flash empty frames.
        this.frameUrls.forEach((url) => {
            new Image().src = url;
        });
    }
}
