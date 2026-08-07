import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createSecureRandomId, getGuestSessionId } from "../utils/guestSession";

describe("guest session secure randomness", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("uses randomUUID when available", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "uuid-value") });

    expect(getGuestSessionId()).toBe("uuid-value");
    expect(localStorage.getItem("isa_guest_session_id")).toBe("uuid-value");
  });

  test("uses crypto.getRandomValues when randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes) => bytes.fill(7),
    });

    expect(createSecureRandomId("guest-")).toMatch(/^guest-[0-9a-f-]{36}$/);
  });

  test("fails closed when no secure random source exists", () => {
    vi.stubGlobal("crypto", undefined);

    expect(() => createSecureRandomId()).toThrow("Secure random number generation is unavailable.");
  });
});
