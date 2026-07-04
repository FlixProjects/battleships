export * from "./Effect";
// Side-effect imports register concrete Effects in the registry. Anyone
// hydrating GameState (transformers, server entry points) needs this import
// path loaded so `createEffect(plain)` knows about the concrete classes.
export * from "./AirstrikeEffect";
export * from "./ArmorPiercingRoundsEffect";
export * from "./FlareEffect";
export * from "./GainCommandPointEffect";
