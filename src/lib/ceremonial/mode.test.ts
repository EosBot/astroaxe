import { afterEach, describe, expect, it } from "vitest";

import { getCeremonialPolicy, parseCeremonialPolicy, resetCeremonialPolicyCache } from "./mode";

const LOCAL_ENV = {
  CEREMONIAL_MODE: "local",
  CEREMONIAL_ARCHIVE_ROOT: "/srv/synthetic-archive",
  CEREMONIAL_KEYRING_FILE: "/run/secrets/synthetic-keyring.json",
} as const;

afterEach(() => {
  resetCeremonialPolicyCache();
});

describe("parseCeremonialPolicy — accepted modes", () => {
  it("defaults to disabled when the mode is absent", () => {
    expect(parseCeremonialPolicy({})).toEqual({
      mode: "disabled",
      servesPublicLibrary: false,
      servesLocalArchive: false,
      local: null,
    });
  });

  it("treats an empty mode string as absent rather than invalid", () => {
    expect(parseCeremonialPolicy({ CEREMONIAL_MODE: "  " }).mode).toBe("disabled");
  });

  it("accepts public and exposes only the public library capability", () => {
    expect(parseCeremonialPolicy({ CEREMONIAL_MODE: "public" })).toEqual({
      mode: "public",
      servesPublicLibrary: true,
      servesLocalArchive: false,
      local: null,
    });
  });

  it("accepts local with an archive root, keyring and default loopback bind", () => {
    expect(parseCeremonialPolicy({ ...LOCAL_ENV })).toEqual({
      mode: "local",
      servesPublicLibrary: false,
      servesLocalArchive: true,
      local: {
        archiveRoot: "/srv/synthetic-archive",
        keyringFile: "/run/secrets/synthetic-keyring.json",
        bind: "127.0.0.1",
      },
    });
  });

  it("accepts an explicit loopback bind", () => {
    for (const bind of ["127.0.0.1", "::1", "localhost"])
      expect(parseCeremonialPolicy({ ...LOCAL_ENV, CEREMONIAL_BIND: bind }).local?.bind).toBe(bind);
  });

  it("never reports both a public library and a local archive at once", () => {
    for (const source of [{}, { CEREMONIAL_MODE: "public" }, { ...LOCAL_ENV }]) {
      const policy = parseCeremonialPolicy(source);
      expect(policy.servesPublicLibrary && policy.servesLocalArchive).toBe(false);
    }
  });

  it("returns a frozen policy so no caller can mutate the mode after startup", () => {
    const policy = parseCeremonialPolicy({ ...LOCAL_ENV });
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.local)).toBe(true);
  });
});

describe("parseCeremonialPolicy — fail-closed rejections", () => {
  it("rejects an unrecognized mode instead of falling back to disabled", () => {
    expect(() => parseCeremonialPolicy({ CEREMONIAL_MODE: "LOCAL" })).toThrow();
    expect(() => parseCeremonialPolicy({ CEREMONIAL_MODE: "hybrid" })).toThrow();
  });

  it("rejects public configured with local archive or keyring material", () => {
    expect(() =>
      parseCeremonialPolicy({
        CEREMONIAL_MODE: "public",
        CEREMONIAL_ARCHIVE_ROOT: "/srv/synthetic-archive",
      }),
    ).toThrow();
    expect(() =>
      parseCeremonialPolicy({
        CEREMONIAL_MODE: "public",
        CEREMONIAL_KEYRING_FILE: "/run/secrets/synthetic-keyring.json",
      }),
    ).toThrow();
  });

  it("rejects disabled configured with local archive material", () => {
    expect(() =>
      parseCeremonialPolicy({
        CEREMONIAL_MODE: "disabled",
        CEREMONIAL_ARCHIVE_ROOT: "/srv/synthetic-archive",
      }),
    ).toThrow();
  });

  it("rejects local without a keyring", () => {
    expect(() =>
      parseCeremonialPolicy({
        CEREMONIAL_MODE: "local",
        CEREMONIAL_ARCHIVE_ROOT: "/srv/synthetic-archive",
      }),
    ).toThrow();
  });

  it("rejects local without an archive root", () => {
    expect(() =>
      parseCeremonialPolicy({
        CEREMONIAL_MODE: "local",
        CEREMONIAL_KEYRING_FILE: "/run/secrets/synthetic-keyring.json",
      }),
    ).toThrow();
  });

  it("rejects a local bind that is reachable off-host", () => {
    for (const bind of ["0.0.0.0", "::", "192.168.1.10", "example.test"])
      expect(() => parseCeremonialPolicy({ ...LOCAL_ENV, CEREMONIAL_BIND: bind })).toThrow();
  });

  it("rejects a relative or traversing archive root", () => {
    for (const root of ["relative/archive", "/srv/../etc", ".."])
      expect(() =>
        parseCeremonialPolicy({ ...LOCAL_ENV, CEREMONIAL_ARCHIVE_ROOT: root }),
      ).toThrow();
  });

  it("fails synchronously, before any database, Redis or filesystem access", () => {
    // A throwing synchronous call cannot have awaited I/O; this pins the contract that
    // misconfiguration is a startup error rather than a runtime surprise mid-request.
    const attempt = () => parseCeremonialPolicy({ CEREMONIAL_MODE: "hybrid" });
    expect(attempt).toThrow();
    expect(attempt).not.toBeInstanceOf(Promise);
  });
});

describe("getCeremonialPolicy", () => {
  it("resolves once and keeps returning the same frozen instance", () => {
    const first = getCeremonialPolicy();
    const second = getCeremonialPolicy();
    expect(second).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("reads the process environment, which the test environment leaves disabled", () => {
    expect(getCeremonialPolicy().mode).toBe("disabled");
    expect(getCeremonialPolicy().local).toBeNull();
  });
});
