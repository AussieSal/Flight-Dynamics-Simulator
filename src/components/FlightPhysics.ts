import { FlightState, Waypoint } from '../types/flight';

// World Waypoints for routes
export const WORLD_WAYPOINTS: Waypoint[] = [
  { id: 'jfk', name: 'John F. Kennedy Intl', code: 'JFK', city: 'New York', country: 'USA', lat: 40.64, lon: -73.78 },
  { id: 'lhr', name: 'Heathrow Airport', code: 'LHR', city: 'London', country: 'UK', lat: 51.47, lon: -0.45 },
  { id: 'hnd', name: 'Haneda Airport', code: 'HND', city: 'Tokyo', country: 'Japan', lat: 35.54, lon: 139.77 },
  { id: 'sfo', name: 'San Francisco Intl', code: 'SFO', city: 'San Francisco', country: 'USA', lat: 37.62, lon: -122.37 },
  { id: 'cdg', name: 'Charles de Gaulle', code: 'CDG', city: 'Paris', country: 'France', lat: 49.00, lon: 2.55 },
  { id: 'dxb', name: 'Dubai International', code: 'DXB', city: 'Dubai', country: 'UAE', lat: 25.25, lon: 55.36 },
  { id: 'syd', name: 'Kingsford Smith', code: 'SYD', city: 'Sydney', country: 'Australia', lat: -33.94, lon: 151.17 },
  { id: 'sin', name: 'Changi Airport', code: 'SIN', city: 'Singapore', country: 'Singapore', lat: 1.36, lon: 103.99 },
  { id: 'gig', name: 'Galeão International', code: 'GIG', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.81, lon: -43.25 },
];

export const INITIAL_FLIGHT_STATE: FlightState = {
  altitude: 10600,         // 10,600 meters (~34,800 ft standard cruise)
  latitude: 48.0,          // European flight corridor
  longitude: 0.0,          // Prime Meridian corridor (over Greenwich / European mainland)
  heading: 90,             // Heading 090° Eastbound (forward in 2D profile)

  airspeed: 245,           // m/s (~476 knots, Mach 0.82)
  groundSpeed: 245,        // m/s (~476 knots)
  headwind: 0,             // m/s (+ = Headwind against nose, - = Tailwind from behind)
  verticalSpeed: 0,        // Level flight
  pitch: 1.9,              // Trimmed level flight pitch for A380 cruise (L ≈ W ≈ 3726 kN)
  roll: 0,
  angleOfAttack: 1.9,

  throttle: 0.38,          // Balanced 4-engine cruise thrust
  spoilers: 0.0,
  flaps: 0.0,
  gearDown: false,
  autopilotLevel: false,   // Manual aerodynamic control so lift/airspeed changes immediately affect altitude

  forces: {
    thrust: 235,           // kN (4 engines cruise thrust)
    drag: 235,             // kN
    lift: 3726,            // kN (balances 380 tonnes A380 cruise weight)
    weight: 3726,          // kN
  },

  thrustTrim: 0,
  dragTrim: 0,
  liftTrim: 0,
  weightTrim: 0,

  curvatureTrackingEnabled: true,
  curvaturePitchRate: -0.00220,
  earthDropRatePerMin: 17.3,
  elevatorMicroTrim: -0.08,
  eotvosReliefKN: 35.8,
  microAdjustActivity: 'stabilized',
  microAdjustHistory: [-0.08, -0.07, -0.09, -0.08, -0.08, -0.07, -0.08, -0.09, -0.08, -0.08, -0.07, -0.08],

  gravityEnabled: true,
  isStalled: false,
  isOverspeed: false,
  isGrounded: false,
  timeScale: 1.0,
};

// Earth radius in physical simulation meters
const R_EARTH_METERS = 6371000;

// Standard atmospheric air density at altitude (barometric formula)
export function getAirDensity(altitudeMeters: number): number {
  const seaLevelDensity = 1.225; // kg/m^3
  const scaleHeight = 8500;      // meters
  return seaLevelDensity * Math.exp(-Math.max(0, altitudeMeters) / scaleHeight);
}

// Update simulation step
export function stepFlightPhysics(current: FlightState, dt: number): FlightState {
  if (current.timeScale <= 0) return current;

  const simDt = dt * current.timeScale;
  const state: FlightState = { ...current, forces: { ...current.forces } };

  const wingArea = 845;       // m^2 (Boeing / Airbus A380 Superjumbo massive 845 m^2 wing area)
  const baseMass = 380000;    // kg (~380 tonnes mid-cruise mass for A380)
  const stdG = 9.80665;       // Standard Earth gravity (m/s^2)
  const isGravityOn = state.gravityEnabled ?? true;
  const g = isGravityOn ? stdG : 0; // Exactly 0 m/s^2 in zero-G

  // Mass remains constant invariant inertia (kg) regardless of gravitational field
  const effectiveMass = Math.max(220000, baseMass + (state.weightTrim * 1000) / stdG);
  // Weight force: W = m * g. When gravity is turned OFF (g = 0), Weight = 0 kN!
  const totalWeightN = effectiveMass * g;
  const totalWeightKN = totalWeightN / 1000;

  // Air density
  const rho = getAirDensity(state.altitude);
  const seaLevelRho = 1.225;
  const densityRatio = rho / seaLevelRho;

  // Quad-Engine Thrust (4x Rolls-Royce Trent 900 / GP7200 turbofans)
  const maxThrustKN = 1250; // Total 4 engines TOGA thrust (~1250 kN)
  const baseThrustKN = maxThrustKN * state.throttle * Math.pow(Math.max(0.02, densityRatio), 0.55);
  const totalThrustKN = Math.max(0, baseThrustKN + state.thrustTrim);

  // Aerodynamic coefficients
  const flapBonusCl = state.flaps * 0.7;
  const flapBonusCd = state.flaps * 0.035;
  const spoilerBonusCd = state.spoilers * 0.05;

  // Effective Angle of Attack
  const aoaDeg = state.pitch - (Math.atan2(state.verticalSpeed, Math.max(state.airspeed, 1)) * 180 / Math.PI);
  state.angleOfAttack = aoaDeg;

  // Stall dynamics: critical AoA is ~15.5 deg (or airspeed < 62 m/s)
  const isStalled = aoaDeg > 15.5 || state.airspeed < 62;
  state.isStalled = isStalled;

  let cl = 0;
  if (!isStalled) {
    cl = 0.25 + (aoaDeg * 0.09) + flapBonusCl;
  } else {
    // Post-stall lift breakdown
    cl = Math.max(0.15, (0.25 + 15.5 * 0.09) * 0.45);
  }

  // Drag polar: Cd = Cd0 + k*Cl^2 + extras
  const cd0 = 0.022;
  const inducedDragFactor = 0.045;
  const stallDragPenalty = isStalled ? 0.14 : 0;
  const cd = cd0 + (inducedDragFactor * cl * cl) + flapBonusCd + spoilerBonusCd + stallDragPenalty;

  // Lift Force (kN) - Generated by airflow across wing surface
  // Notice: In zero-G, wings STILL generate lift as long as moving through air!
  const dynamicPressure = 0.5 * rho * state.airspeed * state.airspeed;
  const calculatedLiftKN = (dynamicPressure * wingArea * cl) / 1000;
  const totalLiftKN = Math.max(0, calculatedLiftKN + state.liftTrim);

  // Drag Force (kN) - in vacuum / outer space, drag realistically vanishes to 0
  const calculatedDragKN = (dynamicPressure * wingArea * cd) / 1000;
  const minDrag = densityRatio < 0.005 ? 0 : 5;
  const totalDragKN = Math.max(minDrag, calculatedDragKN + state.dragTrim);

  // Record active forces
  state.forces.thrust = Number(totalThrustKN.toFixed(1));
  state.forces.drag = Number(totalDragKN.toFixed(1));
  state.forces.lift = Number(totalLiftKN.toFixed(1));
  state.forces.weight = Number(totalWeightKN.toFixed(1));

  // Accelerations
  // Longitudinal (along flight path): T - D - W * sin(pitch)
  // In zero-G, W = 0, so pitch climbing has zero gravitational drag penalty!
  const pitchRad = (state.pitch * Math.PI) / 180;
  const netForwardForceN = (totalThrustKN - totalDragKN) * 1000 - totalWeightN * Math.sin(pitchRad * 0.5);
  const forwardAccel = netForwardForceN / effectiveMass;

  state.airspeed = Math.max(0, state.airspeed + forwardAccel * simDt);

  // Vertical dynamics: L * cos(pitch) - W
  // Dynamic pressure q = 0.5 * rho * airspeed^2.
  // 1) Higher airspeed increases dynamic pressure -> Lift exceeds Weight -> vertical acceleration > 0 -> climbs.
  // 2) Lower airspeed decreases dynamic pressure -> Weight exceeds Lift -> vertical acceleration < 0 -> descends.
  // 3) Increased lift setting (+ Lift) directly increases total Lift -> climbs.
  // 4) Decreased lift setting (- Lift) directly decreases total Lift -> descends.
  const netVerticalForceN = (totalLiftKN * Math.cos(pitchRad) - totalWeightKN) * 1000;
  const centrifugalAccel = isGravityOn ? 0 : ((state.airspeed * Math.cos(pitchRad)) ** 2) / (R_EARTH_METERS + state.altitude);
  const stallDrop = (isStalled && isGravityOn) ? 8.0 : 0;
  const verticalAccel = (netVerticalForceN / effectiveMass) + centrifugalAccel - stallDrop;

  // Integrate vertical acceleration directly into vertical speed
  state.verticalSpeed += verticalAccel * simDt;

  // Natural aerodynamic heave damping (motion vertically through air induces opposing aerodynamic resistance)
  const heaveDampingRate = Math.min(2.0, (0.5 * rho * wingArea * 3.5 * Math.max(state.airspeed, 20)) / effectiveMass);
  state.verticalSpeed *= Math.exp(-heaveDampingRate * simDt);

  // Earth Curvature & Fly-By-Wire Micro-Adjustments (holding altitude around spherical Earth)
  const currentR = R_EARTH_METERS + state.altitude;
  const isCurvatureTracking = state.curvatureTrackingEnabled !== false;
  const groundSpeedForCurvature = Math.max(state.groundSpeed || (state.airspeed * Math.cos(pitchRad)), 10);

  // Angular rate required to rotate local horizontal around Earth: omega = v / R
  // Negative because aircraft pitches down relative to fixed space to follow curvature
  const curvatureOmegaRad = groundSpeedForCurvature / currentR;
  const curvaturePitchRateDeg = -(curvatureOmegaRad * 180) / Math.PI; // e.g. -0.00220 deg/s (-7.92 deg/hr)
  state.curvaturePitchRate = Number(curvaturePitchRateDeg.toFixed(5));

  // Tangent Horizon Drop Rate: drop = (v * 60)^2 / (2 * R) (meters/min)
  const distInOneMin = groundSpeedForCurvature * 60;
  const earthDropPerMin = (distInOneMin * distInOneMin) / (2 * currentR);
  state.earthDropRatePerMin = Number(earthDropPerMin.toFixed(1));

  // Centrifugal / Eötvös relief force: F = m * v^2 / R (kN)
  const eotvosN = (effectiveMass * (groundSpeedForCurvature ** 2)) / currentR;
  state.eotvosReliefKN = Number((eotvosN / 1000).toFixed(1));

  // Continuous Fly-by-wire micro-adjustments:
  if (isCurvatureTracking && isGravityOn && !isStalled) {
    // 1. Curvature nose-down rate keeps velocity vector tangential to local spherical geoid
    state.pitch += curvaturePitchRateDeg * simDt;

    // 2. High-frequency Fly-by-wire elevator micro-trim damping
    // Senses subtle vertical speed or altitude deviation and applies elevator trim nudges
    const trimDamping = -state.verticalSpeed * 0.05;
    const fbwOscillation = Math.sin(Date.now() * 0.0035) * 0.022; // subtle fly-by-wire servo cycle
    const baseCurvatureTrim = (curvaturePitchRateDeg / 0.0022) * -0.08;
    const liveElevatorDeflection = Number((baseCurvatureTrim + trimDamping + fbwOscillation).toFixed(3));
    state.elevatorMicroTrim = liveElevatorDeflection;

    // Micro vertical stabilization
    state.verticalSpeed *= Math.exp(-0.06 * simDt);

    if (Math.abs(state.verticalSpeed) < 0.15) {
      state.microAdjustActivity = 'stabilized';
    } else if (state.verticalSpeed > 0) {
      state.microAdjustActivity = 'trim-down';
    } else {
      state.microAdjustActivity = 'trim-up';
    }
  } else if (!isCurvatureTracking && isGravityOn) {
    // Tangent Inertial Flight Mode (Test Experiment):
    // Aircraft maintains fixed inertial orientation and does NOT pitch down to follow curvature.
    // As Earth curves away beneath, apparent vertical climb develops!
    const tangentClimbRateMps = (groundSpeedForCurvature ** 2 * simDt) / currentR;
    state.verticalSpeed += tangentClimbRateMps * 2.0;
    state.elevatorMicroTrim = 0.0;
    state.microAdjustActivity = 'inertial-climb';
  }

  // Update rolling history of micro-adjustments
  const history = state.microAdjustHistory ? [...state.microAdjustHistory] : [];
  if (history.length === 0 || Math.random() < 0.3) {
    history.push(state.elevatorMicroTrim ?? -0.08);
    if (history.length > 25) history.shift();
    state.microAdjustHistory = history;
  }

  // If autopilot level hold is explicitly active (user pressed Spacebar):
  // Flight director gently adjusts pitch trim to seek level flight, rather than overriding physics
  if (state.autopilotLevel && isGravityOn && !isStalled) {
    const error = 0 - state.verticalSpeed;
    state.pitch += Math.max(-0.4, Math.min(0.4, error * 0.12)) * simDt * 1.5;
  }

  // Update Altitude
  state.altitude += state.verticalSpeed * simDt;
  if (state.altitude <= 0) {
    state.altitude = 0;
    state.verticalSpeed = Math.max(0, state.verticalSpeed);
    state.isGrounded = true;
  } else {
    state.isGrounded = false;
  }

  // Overspeed check (> Mach 0.89 ≈ 275 m/s at altitude)
  state.isOverspeed = state.airspeed > 275;

  // Coordinates on Earth Sphere:
  // Roll banking directs lift laterally to produce turn rate:
  const rollRad = (state.roll * Math.PI) / 180;
  const turnRateRadPerSec = (totalLiftKN * 1000 * Math.sin(rollRad)) / (effectiveMass * Math.max(state.airspeed, 30));
  const turnRateDegPerSec = turnRateRadPerSec * (180 / Math.PI);
  state.heading = (state.heading + turnRateDegPerSec * simDt + 360) % 360;

  // Move aircraft across globe
  const headingRad = (state.heading * Math.PI) / 180;
  const horizontalAirspeed = state.airspeed * Math.cos(pitchRad); // m/s
  const headwindMps = state.headwind || 0;
  // Ground Speed: Horizontal Airspeed minus Headwind (+ reduces GS, - increases GS)
  const groundSpeed = horizontalAirspeed - headwindMps;
  state.groundSpeed = groundSpeed;
  const distanceMoved = groundSpeed * simDt;

  const currentSphereR = R_EARTH_METERS + state.altitude;
  const dLatRad = (distanceMoved * Math.cos(headingRad)) / currentSphereR;
  const dLonRad = (distanceMoved * Math.sin(headingRad)) / (currentSphereR * Math.cos((state.latitude * Math.PI) / 180));

  state.latitude += (dLatRad * 180) / Math.PI;
  state.longitude += (dLonRad * 180) / Math.PI;

  // Clamp latitude to [-89.5, 89.5] and wrap longitude to [-180, 180]
  state.latitude = Math.max(-89.5, Math.min(89.5, state.latitude));
  if (state.longitude > 180) state.longitude -= 360;
  if (state.longitude < -180) state.longitude += 360;

  return state;
}

// Convert spherical (latitude, longitude, altitude) to 3D Cartesian coordinates
export function geoToCartesian(latDeg: number, lonDeg: number, altitudeNorm: number, earthRadius: number) {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lonDeg + 180) * (Math.PI / 180);
  const r = earthRadius + altitudeNorm;

  const x = -r * Math.sin(phi) * Math.cos(theta);
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return { x, y, z };
}
