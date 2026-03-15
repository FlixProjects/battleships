export class Entity<T extends Entity<T>> {
    public id: string;

    update(entity: Partial<T>) {
        if (entity.id && entity.id !== this.id) return this as unknown as T;
        Object.assign(this, entity);
        return this as unknown as T;
    }
}
