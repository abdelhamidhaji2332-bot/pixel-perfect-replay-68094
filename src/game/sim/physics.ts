export type SensorEffects = {
  noise: boolean;
  hysteresis: boolean;
  nonlinearity: boolean;
  temperature: number;
  direction: 1 | -1;
};

export type SensorReading = {
  distanceCm: number;
  measuredCm: number;
  timeOfFlightMs: number;
  voltage: number;
  sensitivityMvPerCm: number;
  speedOfSound: number;
  zone: "dead" | "linear" | "saturation";
};

export const MIN_DISTANCE_CM = 0;
export const MAX_DISTANCE_CM = 120;
export const DEAD_ZONE_CM = 5;
export const SATURATION_CM = 80;
export const OUTPUT_MAX_V = 10;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function zoneForDistance(distanceCm: number): SensorReading["zone"] {
  if (distanceCm < DEAD_ZONE_CM) return "dead";
  if (distanceCm >= SATURATION_CM) return "saturation";
  return "linear";
}

export function outputVoltage(distanceCm: number, nonlinearity = false): number {
  if (distanceCm < DEAD_ZONE_CM) return 0;
  const ideal = ((distanceCm - DEAD_ZONE_CM) / (SATURATION_CM - DEAD_ZONE_CM)) * OUTPUT_MAX_V;
  if (!nonlinearity) return clamp(ideal, 0, OUTPUT_MAX_V);
  if (distanceCm <= 75) return clamp(ideal, 0, OUTPUT_MAX_V);
  const atKnee = ((75 - DEAD_ZONE_CM) / (SATURATION_CM - DEAD_ZONE_CM)) * OUTPUT_MAX_V;
  return clamp(atKnee + (OUTPUT_MAX_V - atKnee) * (1 - Math.exp(-(distanceCm - 75) / 8)), 0, OUTPUT_MAX_V);
}

export function sensitivityMvPerCm(distanceCm: number, nonlinearity = false): number {
  const delta = 0.01;
  return ((outputVoltage(distanceCm + delta, nonlinearity) - outputVoltage(distanceCm - delta, nonlinearity)) / (2 * delta)) * 1000;
}

export function readSensor(distanceCm: number, effects: SensorEffects, noiseSample = 0): SensorReading {
  const distance = clamp(distanceCm, MIN_DISTANCE_CM, MAX_DISTANCE_CM);
  const speedOfSound = 331.3 + 0.606 * effects.temperature;
  const hysteresisOffset = effects.hysteresis ? effects.direction * 0.45 : 0;
  const noiseOffset = effects.noise ? noiseSample * 0.22 : 0;
  const measuredCm = clamp(distance + hysteresisOffset + noiseOffset, 0, MAX_DISTANCE_CM);
  const voltage = outputVoltage(measuredCm, effects.nonlinearity);
  const timeOfFlightMs = (2 * (distance / 100) / speedOfSound) * 1000;

  return {
    distanceCm: distance,
    measuredCm,
    timeOfFlightMs,
    voltage,
    sensitivityMvPerCm: sensitivityMvPerCm(measuredCm, effects.nonlinearity),
    speedOfSound,
    zone: zoneForDistance(distance),
  };
}