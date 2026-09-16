import { describe, expect, it } from "vitest";
import { validateEventInput, canRegister } from "./events";

describe("validateEventInput", () => {
  it("accepts a valid event", () => {
    // Arrange
    const input = {
      name: "Semana Acadêmica",
      date: "2026-09-16",
      capacity: 30,
    };

    // Act
    const result = validateEventInput(input);

    // Assert
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.each([
    [{ name: "", date: "2026-09-16", capacity: 10 }, "name is required"],
    [{ name: "JS Day", capacity: 10 }, "date is required"],
    [
      { name: "JS Day", date: "2026-09-16", capacity: 0 },
      "capacity must be greater than zero",
    ],
    [
      { name: "JS Day", date: "2026-09-16", capacity: -1 },
      "capacity must be greater than zero",
    ],
    [
      { name: "JS Day", date: "2026-09-16", capacity: "10" },
      "capacity must be greater than zero",
    ],
  ])("rejects invalid event input %#", (input, expectedError) => {
    const result = validateEventInput(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expectedError);
  });
});

describe("canRegister", () => {
  it("allows registration when there is capacity and no duplicate", () => {
    const result = canRegister({
      capacity: 3,
      registrations: [{ userId: 1 }],
      userId: 2,
    });

    expect(result).toEqual({ allowed: true });
  });

  it("rejects when the event is full", () => {
    const result = canRegister({
      capacity: 2,
      registrations: [{ userId: 1 }, { userId: 2 }],
      userId: 3,
    });

    expect(result).toEqual({ allowed: false, reason: "full" });
  });
});
