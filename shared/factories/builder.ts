import { mergician } from "mergician";

export abstract class Builder<T extends object> {
    protected defaultProps: T;
    protected EntityClass: new (props: T) => T;

    constructor(defaultProps: T, defaultOverrides: Partial<T> = {}, EntityClass: new (props: T) => T) {
        this.defaultProps = mergician(defaultProps, defaultOverrides) as T;
        this.EntityClass = EntityClass;
    }

    build(overrides: Partial<T> = {}): T {
        const merged = mergician(this.defaultProps, overrides) as T;
        return new this.EntityClass(merged);
    }
}
