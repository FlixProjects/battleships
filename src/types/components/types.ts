import type { HTMLImage } from "../../components/native/Image";

export interface IconProps {
    id?: string;
    src: string;
    addStyles?: (ref: HTMLImage) => void;
}
