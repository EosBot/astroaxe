import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { checkJsonRequest } from "./json-body";

describe("checkJsonRequest", () => {
  it("accepts a small JSON request", () => {
    const request = new NextRequest("http://localhost/api/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expect(checkJsonRequest(request)).toEqual({ ok: true });
  });

  it("rejects a non-JSON content type as 415", () => {
    const request = new NextRequest("http://localhost/api/x", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });
    expect(checkJsonRequest(request)).toEqual({ ok: false, status: 415 });
  });

  it("rejects a payload over the byte limit as 413", () => {
    const request = new NextRequest("http://localhost/api/x", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "16385" },
      body: "{}",
    });
    expect(checkJsonRequest(request)).toEqual({ ok: false, status: 413 });
  });

  it("respects a custom byte limit", () => {
    const request = new NextRequest("http://localhost/api/x", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "10" },
      body: "{}",
    });
    expect(checkJsonRequest(request, 8)).toEqual({ ok: false, status: 413 });
  });
});
