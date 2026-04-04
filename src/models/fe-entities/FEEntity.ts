export abstract class FEEntity<T> {
    constructor(
        protected entityProps: T,
        protected parentElement?: HTMLElement,
    ) {}
}
