import { ShipBuilder } from "../../factories/ship-builder";
import { Ship } from "../../models/Ship";
import { IShip, TShipRefNo } from "../../types";
import { getFactionMixin, refNoToFactionMixin } from "../ship-helper";

const buildShip = (refNo: TShipRefNo): IShip =>
    new ShipBuilder({ id: "ship1", playerId: "player1", refNo }).build();

describe("ship-helper / getFactionMixin", () => {
    it("returns the mapped mixin for every known refNo", () => {
        (Object.keys(refNoToFactionMixin) as TShipRefNo[]).forEach((refNo) => {
            expect(getFactionMixin(refNo)).toBe(refNoToFactionMixin[refNo]);
        });
    });

    it("throws on an unknown refNo", () => {
        expect(() => getFactionMixin("nope" as TShipRefNo)).toThrow("Unknown ship refNo 'nope'");
    });

    describe("faction mixin composed over Ship (backend base)", () => {
        it("wraps Ship in a distinct subclass, not Ship itself", () => {
            const Ctor = getFactionMixin("tudf_flagship0")(Ship);

            expect(Ctor).not.toBe(Ship);
            expect(new Ctor(buildShip("frigate0"))).toBeInstanceOf(Ship);
        });

        // The assertions below deliberately seed props with a *different* refNo than
        // the faction's, so they can only pass if the faction mixin's class-field
        // initializer actually ran (and overrode the props the base ctor assigned).
        // A plain `Ship`/identity base would leave the seeded refNo untouched.
        it("stamps the TUDF flagship refNo over a mismatched props refNo", () => {
            const Ctor = getFactionMixin("tudf_flagship0")(Ship);
            expect(new Ctor(buildShip("frigate0")).refNo).toBe("tudf_flagship0");
        });

        it("stamps the TUDF frigate refNo over a mismatched props refNo", () => {
            const Ctor = getFactionMixin("tudf_frigate0")(Ship);
            expect(new Ctor(buildShip("flagship0")).refNo).toBe("tudf_frigate0");
        });

        it("retains Ship behaviour", () => {
            const ship = new (getFactionMixin("tudf_flagship0")(Ship))(buildShip("frigate0"));

            expect(typeof ship.move).toBe("function");
            expect(typeof ship.attack).toBe("function");
            expect(typeof ship.deploy).toBe("function");
        });
    });

    describe("identity mixin for non-faction base ships", () => {
        it("returns the base ctor unchanged", () => {
            expect(getFactionMixin("flagship0")(Ship)).toBe(Ship);
            expect(getFactionMixin("frigate0")(Ship)).toBe(Ship);
        });

        // Contrast with the faction cases: identity has no field initializer, so the
        // props refNo survives. Seeding a faction refNo here proves identity does NOT
        // stamp anything of its own.
        it("preserves the props refNo (no faction override)", () => {
            const Ctor = getFactionMixin("frigate0")(Ship);
            expect(new Ctor(buildShip("tudf_flagship0")).refNo).toBe("tudf_flagship0");
        });
    });
});
