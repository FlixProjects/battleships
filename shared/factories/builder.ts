import { mergician } from "mergician";

export class Builder<T extends object> {
    protected defaultProps: T; // define in subclass

    constructor(defaultProps: T, defaultOverrides: Partial<T> = {}) {
        this.defaultProps = mergician(defaultProps, defaultOverrides) as T;
    }

    build(overrides: Partial<T> = {}): T {
        return mergician(this.defaultProps, overrides) as T;
    }
}
