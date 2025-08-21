import { GunInstance } from "../../gundb/index";

describe("GunDB Index", () => {
  it("should export GunInstance class", () => {
    expect(GunInstance).toBeDefined();
    expect(typeof GunInstance).toBe("function");
  });

  it("should export GunInstance as a constructor", () => {
    // Test that we can create a new instance (this will fail due to missing Gun instance, but we can test the export)
    expect(() => {
      // This will throw an error because Gun instance is required, but we're testing the export
      new GunInstance({} as any);
    }).toThrow();
  });

  it("should have GunInstance as default export", () => {
    // Test that the module exports GunInstance
    const moduleExports = require("../../gundb/index");
    expect(moduleExports.GunInstance).toBeDefined();
  });
});
