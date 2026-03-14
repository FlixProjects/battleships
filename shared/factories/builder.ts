import { mergician } from "mergician";

export abstract class Builder<T extends object, K extends T> {
    protected defaultProps: T;
    protected EntityClass: new (props: T) => K;

    constructor(defaultProps: T, defaultOverrides: Partial<T> = {}, EntityClass: new (props: T) => K) {
        this.defaultProps = mergician(defaultProps, defaultOverrides) as T;
        this.EntityClass = EntityClass;
    }

    build(overrides: Partial<T> = {}): K {
        const merged = mergician(this.defaultProps, overrides) as T;
        return new this.EntityClass(merged);
    }
}
