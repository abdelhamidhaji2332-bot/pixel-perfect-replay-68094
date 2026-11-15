import { describe, expect, it } from "vitest";
import { DEAD_ZONE_CM, OUTPUT_MAX_V, SATURATION_CM, outputVoltage, readSensor, sensitivityMvPerCm, zoneForDistance } from "./physics";

describe("sensor metrology", () => {
  const effects = { noise: false, hysteresis: false, nonlinearity: false, temperature: 20, direction: 1 as const };

  it("classifies the specified dead, linear, and saturation ranges", () => {
    expect(zoneForDistance(4.99)).toBe("dead");
    expect(zoneForDistance(DEAD_ZONE_CM)).toBe("linear");
    expect(zoneForDistance(SATURATION_CM)).toBe("saturation");
  });

  it("maps the linear operating range to 0–10 V and clips at 10 V", () => {
    expect(outputVoltage(5)).toBe(0);
    expect(outputVoltage(42.5)).toBe(5);
    expect(outputVoltage(120)).toBe(OUTPUT_MAX_V);
  });

  it("computes round-trip flight time using the temperature-adjusted sound speed", () => {
    expect(readSensor(10, effects).speedOfSound).toBeCloseTo(343.42, 2);
    expect(readSensor(10, effects).timeOfFlightMs).toBeCloseTo(0.5824, 3);
  });

  it("reports the linear sensitivity as 133.33 mV/cm", () => {
    expect(sensitivityMvPerCm(42.5)).toBeCloseTo(133.333, 1);
  });

  it("applies optional noise and directional hysteresis to the measured distance", () => {
    const reading = readSensor(30, { ...effects, noise: true, hysteresis: true }, 1);
    expect(reading.measuredCm).toBeCloseTo(30.67, 2);
  });

  it("compresses output beyond the nonlinearity knee", () => {
    expect(outputVoltage(80, true)).toBeLessThan(outputVoltage(80));
    expect(outputVoltage(120, true)).toBeLessThanOrEqual(OUTPUT_MAX_V);
  });
});