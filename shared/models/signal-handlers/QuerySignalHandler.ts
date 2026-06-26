// Base for read-only query handlers. Parallels SignalHandler, but the ctx is a
// narrower IQuerySignalHandleCtx (resolve only — no saveNewState/emitter), so a
// query handler cannot mutate state or start a cascade.
export abstract class QuerySignalHandler<C> {
    abstract handle(ctx: C): void;
}
