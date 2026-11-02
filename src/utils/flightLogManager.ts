import { FlightLogEntry, FlightState, LogCategory } from '../types/flight';

const STORAGE_KEY = 'aeroforces_flight_log_session';

export function getStoredFlightLog(): FlightLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore storage parse failure
  }
  return [];
}

export function saveFlightLog(entries: FlightLogEntry[]): void {
  try {
    // Keep up to 200 recent entries to preserve storage performance
    const capped = entries.slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredFlightLog(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// Format Zulu time e.g. "19:24:05Z"
export function formatZuluTime(date: Date = new Date()): string {
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  const s = date.getUTCSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}Z`;
}

// Format session elapsed string e.g. "+05:32"
export function formatSessionTime(seconds: number): string {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `+${mins}:${secs}`;
}

export function createLogEntry(
  st: FlightState,
  sessionSeconds: number,
  category: LogCategory,
  title: string,
  description: string,
  highlight = false
): FlightLogEntry {
  const now = new Date();
  const altitudeFt = Math.round(st.altitude * 3.28084);
  const airspeedKts = Math.round(st.airspeed * 1.94384);
  const verticalSpeedFpm = Math.round(st.verticalSpeed * 196.85);
  const mach = (st.airspeed / 295).toFixed(2);

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.getTime(),
    timeString: formatZuluTime(now),
    sessionTimeStr: formatSessionTime(sessionSeconds),
    category,
    title,
    description,
    altitudeFt,
    altitudeM: Math.round(st.altitude),
    airspeedKts,
    mach,
    verticalSpeedFpm,
    forcesSnapshot: {
      thrust: st.forces.thrust,
      drag: st.forces.drag,
      lift: st.forces.lift,
      weight: st.forces.weight,
    },
    coordinates: {
      lat: Number(st.latitude.toFixed(2)),
      lon: Number(st.longitude.toFixed(2)),
    },
    highlight,
  };
}

// Milestone Tracker Class with hysteresis to prevent duplicate milestone spam
export class FlightMilestoneTracker {
  private passedAltitudes = new Set<number>();
  private passedAirspeeds = new Set<number>();
  private lastStallState = false;
  private lastOverspeedState = false;
  private lastSpoilersState = 0;
  private lastFlapsState = 0;
  private prevAltitude = 0;
  private prevAirspeed = 0;

  // Tracked altitude thresholds in feet
  private readonly ALT_THRESHOLDS = [1000, 5000, 10000, 18000, 25000, 30000, 35000, 40000, 43000];
  // Tracked airspeed thresholds in knots
  private readonly SPD_THRESHOLDS = [150, 250, 300, 400, 480, 540];

  constructor(initialAltitudeM: number, initialAirspeedMs: number) {
    this.prevAltitude = initialAltitudeM * 3.28084;
    this.prevAirspeed = initialAirspeedMs * 1.94384;

    // Pre-populate thresholds already passed at start so we don't immediately trigger them
    for (const alt of this.ALT_THRESHOLDS) {
      if (this.prevAltitude >= alt) {
        this.passedAltitudes.add(alt);
      }
    }
    for (const spd of this.SPD_THRESHOLDS) {
      if (this.prevAirspeed >= spd) {
        this.passedAirspeeds.add(spd);
      }
    }
  }

  public checkMilestones(st: FlightState, sessionSeconds: number): FlightLogEntry[] {
    const newEntries: FlightLogEntry[] = [];
    const currentAltFt = Math.round(st.altitude * 3.28084);
    const currentSpdKts = Math.round(st.airspeed * 1.94384);

    // 1. Altitude Milestones (Climbing & Descending)
    for (const threshold of this.ALT_THRESHOLDS) {
      // Climbing through threshold
      if (this.prevAltitude < threshold && currentAltFt >= threshold && !this.passedAltitudes.has(threshold)) {
        this.passedAltitudes.add(threshold);
        let desc = `Ascended past ${threshold.toLocaleString()} ft (FL${Math.round(threshold / 100)}).`;
        if (threshold === 10000) desc += ' Terminal area 250-knot speed restriction lifted.';
        if (threshold === 18000) desc += ' Transition altitude: Altimeters calibrated to Standard 29.92 inHg.';
        if (threshold === 25000) desc += ' High flight level entered; engine exhaust contrail formation active.';
        if (threshold === 35000) desc += ' Optimal commercial long-haul cruise flight level reached.';
        if (threshold === 43000) desc += ' Maximum operational service ceiling reached.';

        newEntries.push(
          createLogEntry(st, sessionSeconds, 'altitude', `Climb Milestone: FL${Math.round(threshold / 100)}`, desc, threshold >= 30000)
        );
      }
      // Descending below threshold (with 600 ft hysteresis)
      else if (this.prevAltitude > threshold && currentAltFt < (threshold - 600) && this.passedAltitudes.has(threshold)) {
        this.passedAltitudes.delete(threshold);
        newEntries.push(
          createLogEntry(
            st,
            sessionSeconds,
            'altitude',
            `Descent Milestone: Below FL${Math.round(threshold / 100)}`,
            `Descended below ${threshold.toLocaleString()} ft (${Math.round(st.altitude)} m).`,
            false
          )
        );
      }
    }

    // Touchdown ground alert
    if (this.prevAltitude > 200 && currentAltFt <= 5) {
      newEntries.push(
        createLogEntry(st, sessionSeconds, 'maneuver', 'Touchdown Ground Contact', 'Aircraft touched down at 0 ft altitude.', true)
      );
    }

    // 2. Airspeed Milestones
    for (const spd of this.SPD_THRESHOLDS) {
      if (this.prevAirspeed < spd && currentSpdKts >= spd && !this.passedAirspeeds.has(spd)) {
        this.passedAirspeeds.add(spd);
        let desc = `Airspeed reached ${spd} KTS (Mach ${(st.airspeed / 295).toFixed(2)}).`;
        if (spd === 150) desc += ' Rotation speed Vr exceeded; sufficient dynamic pressure for takeoff.';
        if (spd === 250) desc += ' High-speed corridor unlocked above FL100.';
        if (spd === 480) desc += ' High subsonic cruise velocity reached.';

        newEntries.push(
          createLogEntry(st, sessionSeconds, 'airspeed', `Airspeed Milestone: ${spd} KTS`, desc, spd >= 480)
        );
      } else if (this.prevAirspeed > spd && currentSpdKts < (spd - 15) && this.passedAirspeeds.has(spd)) {
        this.passedAirspeeds.delete(spd);
      }
    }

    // 3. Stall Alert Milestone
    if (!this.lastStallState && st.isStalled) {
      newEntries.push(
        createLogEntry(
          st,
          sessionSeconds,
          'alert',
          'AERODYNAMIC STALL DETECTED',
          `Critical angle of attack exceeded (${st.angleOfAttack.toFixed(1)}°) or airspeed collapsed (${currentSpdKts} KTS). Immediate nose-down recovery needed!`,
          true
        )
      );
    } else if (this.lastStallState && !st.isStalled) {
      newEntries.push(
        createLogEntry(
          st,
          sessionSeconds,
          'maneuver',
          'Stall Recovery Completed',
          `Aerodynamic laminar airflow restored across wings. Airspeed: ${currentSpdKts} KTS.`,
          true
        )
      );
    }
    this.lastStallState = st.isStalled;

    // 4. Overspeed Milestone
    if (!this.lastOverspeedState && st.isOverspeed) {
      newEntries.push(
        createLogEntry(
          st,
          sessionSeconds,
          'alert',
          'Vmo/Mmo Overspeed Warning',
          `Exceeded maximum operating velocity (${currentSpdKts} KTS / Mach ${(st.airspeed / 295).toFixed(2)}). Airframe stress threshold exceeded.`,
          true
        )
      );
    }
    this.lastOverspeedState = st.isOverspeed;

    // 5. Flight Surface Transitions
    if (st.spoilers >= 0.8 && this.lastSpoilersState < 0.8) {
      newEntries.push(
        createLogEntry(
          st,
          sessionSeconds,
          'forces',
          'Speed Brakes Deployed',
          `Spoilers fully raised. Aerodynamic drag increased to ${st.forces.drag} kN.`,
          false
        )
      );
    }
    this.lastSpoilersState = st.spoilers;

    if (st.flaps !== this.lastFlapsState) {
      const flapDeg = Math.round(st.flaps * 30);
      newEntries.push(
        createLogEntry(
          st,
          sessionSeconds,
          'forces',
          `Flaps Configuration: ${flapDeg}°`,
          `Wing camber altered. Lift boosted to ${st.forces.lift} kN.`,
          false
        )
      );
      this.lastFlapsState = st.flaps;
    }

    this.prevAltitude = currentAltFt;
    this.prevAirspeed = currentSpdKts;

    return newEntries;
  }
}
