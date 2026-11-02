export type CameraMode = 'chase' | 'cockpit' | 'wing' | 'orbit' | 'satellite';
export type ViewMode2D = 'atmosphere' | 'closeup' | 'regional' | 'global';
export type ScaleMode = 'exact-metric' | 'aviation-profile';

export interface FlightForces {
  thrust: number; // in kN (0 to 600 kN)
  drag: number;   // in kN (computed + user trim offset)
  lift: number;   // in kN (computed + user trim offset)
  weight: number; // in kN (standard ~ 1500 kN for widebody, adjustable payload/fuel)
}

export interface FlightState {
  // Positional & spherical coordinates
  altitude: number;       // meters above sea level (e.g. 10,000 m = ~33,000 ft)
  latitude: number;       // degrees (-90 to +90)
  longitude: number;      // degrees (-180 to +180)
  heading: number;        // degrees (0 to 360)
  
  // Velocity & Dynamics
  airspeed: number;       // m/s (e.g. 250 m/s = ~485 knots = ~Mach 0.82)
  groundSpeed?: number;   // m/s (speed relative to Earth surface)
  headwind?: number;      // m/s (+ = Headwind against nose, - = Tailwind from behind)
  verticalSpeed: number;  // m/s (climb/descent rate)
  pitch: number;          // degrees (-30 to +30)
  roll: number;           // degrees (-60 to +60)
  angleOfAttack: number;  // degrees
  
  // Aerodynamic controls & surfaces
  throttle: number;       // 0.0 to 1.0 (0% to 100%)
  spoilers: number;       // 0.0 to 1.0 (Speed brakes deployed)
  flaps: number;          // 0, 15, 30 degrees (0.0, 0.5, 1.0)
  gearDown: boolean;      // Landing gear
  autopilotLevel: boolean;// Auto level flight
  
  // Forces in kN
  forces: FlightForces;
  
  // User overrides / manual force trim buttons (-100 to +100 kN)
  thrustTrim: number;
  dragTrim: number;
  liftTrim: number;
  weightTrim: number;

  // Earth Curvature & Fly-By-Wire Micro-Adjustments Telemetry
  curvatureTrackingEnabled?: boolean;  // Autopilot actively holding altitude around Earth curvature (true) vs Tangent inertial drift (false)
  curvaturePitchRate?: number;         // deg/s angular pitch rate required to follow Earth sphere (e.g. -0.00220°/s = -7.92°/hr)
  earthDropRatePerMin?: number;        // m/min of horizon curvature drop beneath a straight tangent line (~17.3 m/min)
  elevatorMicroTrim?: number;          // Live elevator deflection in degrees (e.g. -0.08° with real-time fly-by-wire micro-damping)
  eotvosReliefKN?: number;             // Centrifugal / Eötvös lift relief in kN due to orbital speed around Earth (+35.8 kN)
  microAdjustActivity?: 'trim-down' | 'trim-up' | 'stabilized' | 'inertial-climb'; // Current active micro-action
  microAdjustHistory?: number[];       // Rolling history of recent elevator micro-trim deflections for oscilloscope waveform

  // Status flags
  gravityEnabled: boolean;// Standard 1G vs 0G weightless simulation
  isStalled: boolean;
  isOverspeed: boolean;
  isGrounded: boolean;
  timeScale: number;      // 0 = paused, 1 = normal, 2 = 2x, 5 = 5x
}

export interface Waypoint {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

export type LogCategory = 'altitude' | 'airspeed' | 'forces' | 'maneuver' | 'alert' | 'system';

export interface FlightLogEntry {
  id: string;
  timestamp: number;       // Unix epoch ms
  timeString: string;      // UTC Zulu string e.g. "14:22:05Z"
  sessionTimeStr: string;  // e.g. "+04:12"
  category: LogCategory;
  title: string;
  description: string;
  altitudeFt: number;
  altitudeM: number;
  airspeedKts: number;
  mach: string;
  verticalSpeedFpm: number;
  forcesSnapshot: {
    thrust: number;
    drag: number;
    lift: number;
    weight: number;
  };
  coordinates: {
    lat: number;
    lon: number;
  };
  highlight?: boolean;
}
