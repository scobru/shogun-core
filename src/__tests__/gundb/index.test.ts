import { DataBase, RxJS, createGun, derive } from "../../gundb/index";

describe("GunDB Index", () => {
  it("should export DataBase class", () => {
    expect(DataBase).toBeDefined();
    expect(typeof DataBase).toBe("function");
  });

  it("should export RxJS class", () => {
    expect(RxJS).toBeDefined();
    expect(typeof RxJS).toBe("function");
  });

  it("should export createGun function", () => {
    expect(createGun).toBeDefined();
    expect(typeof createGun).toBe("function");
  });

  it("should export derive function", () => {
    expect(derive).toBeDefined();
    expect(typeof derive).toBe("function");
  });

  it("should have all expected exports", () => {
    const moduleExports = require("../../gundb/index");
    expect(moduleExports.DataBase).toBeDefined();
    expect(moduleExports.RxJS).toBeDefined();
    expect(moduleExports.createGun).toBeDefined();
    expect(moduleExports.derive).toBeDefined();
  });
});
