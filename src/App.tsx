import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraMode, FlightLogEntry, FlightState, Waypoint } from './types/flight';
import { INITIAL_FLIGHT_STATE, stepFlightPhysics } from './components/FlightPhysics';
import { FlightSimulator2D } from './components/FlightSimulator2D';
import { FlightHUD } from './components/FlightHUD';
import { ForcesDock } from './components/ForcesDock';
import { FlightLog } from './components/FlightLog';
import { UserGuideModal } from './components/UserGuideModal';
import { CurvatureMicroAdjustPanel } from './components/CurvatureMicroAdjustPanel';
import { flightAudio } from './utils/audio';
import { 
  getStoredFlightLog, 
  saveFlightLog, 
  clearStoredFlightLog, 
  createLogEntry, 
  FlightMilestoneTracker 
} from './utils/flightLogManager';

export default function App() {
  const [flightState, setFlightState] = useState<FlightState>(INITIAL_FLIGHT_STATE);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCurvaturePanelOpen, setIsCurvaturePanelOpen] = useState<boolean>(true);

  // Persistent Flight Log & Milestone tracking
  const [flightLog, setFlightLog] = useState<FlightLogEntry[]>(() => {
    const stored = getStoredFlightLog();
    if (stored.length > 0) return stored;
    // Initial start entry
    return [
      createLogEntry(
        INITIAL_FLIGHT_STATE,
        0,
        'system',
        'Flight Session Initialized',
        'Commercial airliner established in level cruise on continental flight corridor (Heading 090° East). Real-scale Earth terrain active.',
        false
      ),
    ];
  });
  const [isFlightLogOpen, setIsFlightLogOpen] = useState<boolean>(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [latestMilestoneNotification, setLatestMilestoneNotification] = useState<string | null>(null);

  // Milestone tracker ref
  const milestoneTrackerRef = useRef<FlightMilestoneTracker>(
    new FlightMilestoneTracker(INITIAL_FLIGHT_STATE.altitude, INITIAL_FLIGHT_STATE.airspeed)
  );
  const sessionSecondsRef = useRef<number>(0);
  const notificationTimeoutRef = useRef<number | null>(null);

  // Mutable state reference for high-frequency physics update loop
  const stateRef = useRef<FlightState>(INITIAL_FLIGHT_STATE);
  stateRef.current = flightState;

  // Partial state updater
  const updateState = useCallback((partial: Partial<FlightState>) => {
    setFlightState((prev) => {
      const updated = { ...prev, ...partial };
      stateRef.current = updated;
      return updated;
    });
  }, []);

  // Audio mute toggle
  const toggleAudio = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    flightAudio.setMuted(nextMuted);
    if (!nextMuted) {
      flightAudio.init();
    }
  }, [isMuted]);

  // Toggle Earth Gravity vs 0-G Space Physics
  const handleToggleGravity = useCallback(() => {
    flightAudio.playClick();
    const currentGravity = stateRef.current.gravityEnabled ?? true;
    const nextGravity = !currentGravity;

    if (!nextGravity) {
      // Disabling gravity: disengage autopilot so aircraft reacts to zero-G
      updateState({ gravityEnabled: false, autopilotLevel: false });
      const entry = createLogEntry(
        stateRef.current,
        sessionSecondsRef.current,
        'alert',
        'Zero-Gravity Physics Engaged (0G)',
        'Earth gravitational pull disabled (W = 0 kN). Unbalanced wing lift accelerates aircraft upward away from Earth curvature!',
        true
      );
      setFlightLog((prev) => {
        const updated = [...prev, entry];
        saveFlightLog(updated);
        return updated;
      });
      setLatestMilestoneNotification('ZERO-G ACTIVE: Weight = 0 kN. Wing lift accelerating plane upward!');
    } else {
      // Restoring 1G Earth gravity
      updateState({ gravityEnabled: true });
      const entry = createLogEntry(
        stateRef.current,
        sessionSecondsRef.current,
        'system',
        'Earth Gravity Restored (1G)',
        'Standard 1G (9.81 m/s²) gravitational acceleration re-engaged. Normal weight forces active.',
        false
      );
      setFlightLog((prev) => {
        const updated = [...prev, entry];
        saveFlightLog(updated);
        return updated;
      });
      setLatestMilestoneNotification('1G GRAVITY RESTORED: Standard 9.81 m/s² gravitational pull active.');
    }

    if (notificationTimeoutRef.current) window.clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = window.setTimeout(() => setLatestMilestoneNotification(null), 5000);
  }, [updateState]);

  // Global Keyboard shortcuts for flight control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Initialize audio on first user key interaction if not yet started
      flightAudio.init();

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const st = stateRef.current;
      switch (e.key.toLowerCase()) {
        case 'w': // Pitch Down (-0.25°)
        case 'arrowdown':
          e.preventDefault();
          updateState({ pitch: Math.max(-25, Number((st.pitch - 0.25).toFixed(2))), autopilotLevel: false });
          break;
        case 's': // Pitch Up (+0.25°)
        case 'arrowup':
          e.preventDefault();
          updateState({ pitch: Math.min(25, Number((st.pitch + 0.25).toFixed(2))), autopilotLevel: false });
          break;
        case 'a': // Bank Left
          updateState({ roll: Math.max(-50, st.roll - 5), autopilotLevel: false });
          break;
        case 'd': // Bank Right
          updateState({ roll: Math.min(50, st.roll + 5), autopilotLevel: false });
          break;
        case 'shift': // Throttle Up
          updateState({ throttle: Math.min(1.0, st.throttle + 0.05) });
          break;
        case 'control': // Throttle Down
          updateState({ throttle: Math.max(0.0, st.throttle - 0.05) });
          break;
        case 'b': // Toggle Spoilers / Speed Brakes
          updateState({ spoilers: st.spoilers > 0.1 ? 0 : 1.0 });
          break;
        case 'f': // Cycle Flaps (0, 0.5, 1.0)
          updateState({ flaps: st.flaps >= 1.0 ? 0 : st.flaps + 0.5 });
          break;
        case 'g': // Toggle Zero-Gravity (0G vs 1G)
          handleToggleGravity();
          break;
        case ' ': // Autopilot Level Hold
          e.preventDefault();
          updateState({ autopilotLevel: !st.autopilotLevel, roll: 0 });
          break;
        case 'v': // Toggle 3D Force Vectors
          setShowVectors((prev) => !prev);
          break;
        case 'l': // Toggle Flight Log
          setIsFlightLogOpen((prev) => !prev);
          break;
        case 'h': // Toggle User Guide
        case '?':
          setIsUserGuideOpen((prev) => !prev);
          break;
        case '1':
          setCameraMode('chase');
          break;
        case '2':
          setCameraMode('cockpit');
          break;
        case '3':
          setCameraMode('wing');
          break;
        case '4':
          setCameraMode('satellite');
          break;
        case '5':
          setCameraMode('orbit');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [updateState, handleToggleGravity]);

  // Main Physics Simulation Loop (60 Hz)
  useEffect(() => {
    let animId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      animId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Track session time
      if (stateRef.current.timeScale > 0) {
        sessionSecondsRef.current += dt * stateRef.current.timeScale;
      }

      // Compute physics step
      const nextState = stepFlightPhysics(stateRef.current, dt);
      setFlightState(nextState);

      // Audio feedback update
      flightAudio.update(nextState.throttle, nextState.airspeed, nextState.isStalled);

      // Check Altitude & Airspeed Milestones
      const detectedMilestones = milestoneTrackerRef.current.checkMilestones(
        nextState,
        sessionSecondsRef.current
      );

      if (detectedMilestones.length > 0) {
        setFlightLog((prev) => {
          const updated = [...prev, ...detectedMilestones];
          saveFlightLog(updated);
          return updated;
        });

        // Set live toast banner for the most prominent detected milestone
        const latest = detectedMilestones[detectedMilestones.length - 1];
        setLatestMilestoneNotification(`${latest.title}: ${latest.altitudeFt.toLocaleString()} ft / ${latest.airspeedKts} kts`);

        if (notificationTimeoutRef.current) {
          window.clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = window.setTimeout(() => {
          setLatestMilestoneNotification(null);
        }, 5000);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      if (notificationTimeoutRef.current) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Manual pilot snapshot
  const handleTakeSnapshot = useCallback((customNote?: string) => {
    flightAudio.playClick();
    const st = stateRef.current;
    const entry = createLogEntry(
      st,
      sessionSecondsRef.current,
      'maneuver',
      'Pilot Telemetry Snapshot',
      customNote || `Manual telemetry recording over (${st.latitude.toFixed(2)}°, ${st.longitude.toFixed(2)}°).`,
      true
    );

    setFlightLog((prev) => {
      const updated = [...prev, entry];
      saveFlightLog(updated);
      return updated;
    });

    setLatestMilestoneNotification(`Snapshot Recorded: ${entry.altitudeFt.toLocaleString()} ft / ${entry.airspeedKts} kts`);
    if (notificationTimeoutRef.current) window.clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = window.setTimeout(() => setLatestMilestoneNotification(null), 4000);
  }, []);

  // Clear flight log
  const handleClearLog = useCallback(() => {
    flightAudio.playClick();
    clearStoredFlightLog();
    const resetEntry = createLogEntry(
      stateRef.current,
      sessionSecondsRef.current,
      'system',
      'Flight Log Cleared',
      'Session milestone history was reset by the pilot.',
      false
    );
    setFlightLog([resetEntry]);
    saveFlightLog([resetEntry]);
  }, []);

  // Waypoint jump
  const handleSelectWaypoint = (wp: Waypoint) => {
    updateState({
      latitude: wp.lat,
      longitude: wp.lon,
      altitude: 10600,
      airspeed: 245,
      verticalSpeed: 0,
      pitch: 1.5,
      roll: 0,
      autopilotLevel: false,
    });

    // Record route jump milestone
    const entry = createLogEntry(
      { ...stateRef.current, latitude: wp.lat, longitude: wp.lon },
      sessionSecondsRef.current,
      'system',
      `Route Waypoint: ${wp.name} (${wp.code})`,
      `Commercial aircraft established on arrival corridor to ${wp.city}, ${wp.country}.`,
      true
    );
    setFlightLog((prev) => {
      const updated = [...prev, entry];
      saveFlightLog(updated);
      return updated;
    });
  };

  // Scenario presets
  const handleApplyScenario = (scenario: 'cruise' | 'climb' | 'descent' | 'stall') => {
    switch (scenario) {
      case 'cruise':
        updateState({
          altitude: 10600,
          airspeed: 245,
          throttle: 0.42,
          spoilers: 0,
          flaps: 0,
          pitch: 1.5,
          roll: 0,
          verticalSpeed: 0,
          thrustTrim: 0,
          dragTrim: 0,
          liftTrim: 0,
          weightTrim: 0,
          autopilotLevel: false,
        });
        break;
      case 'climb':
        updateState({
          throttle: 0.95,
          pitch: 7.5,
          verticalSpeed: 12.0,
          thrustTrim: 45,
          dragTrim: 0,
          liftTrim: 60,
          autopilotLevel: false,
        });
        break;
      case 'descent':
        updateState({
          throttle: 0.25,
          spoilers: 0.6,
          pitch: -2.0,
          verticalSpeed: -10.0,
          dragTrim: 35,
          thrustTrim: -50,
          autopilotLevel: false,
        });
        break;
      case 'stall':
        // Provoke stall by cutting power and pulling nose high
        updateState({
          throttle: 0.15,
          pitch: 18.0,
          airspeed: 55,
          verticalSpeed: -15.0,
          thrustTrim: -100,
          liftTrim: -150,
          autopilotLevel: false,
        });
        break;
    }
  };

  // Reset to initial flight state
  const handleResetFlight = () => {
    setFlightState(INITIAL_FLIGHT_STATE);
    milestoneTrackerRef.current = new FlightMilestoneTracker(
      INITIAL_FLIGHT_STATE.altitude,
      INITIAL_FLIGHT_STATE.airspeed
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 2D Earth Curvature Flight Profile Layer */}
      <FlightSimulator2D
        flightState={flightState}
        showVectors={showVectors}
        onSelectWaypoint={handleSelectWaypoint}
      />

      {/* Flight Telemetry & Navigation HUD */}
      <FlightHUD
        flightState={flightState}
        cameraMode={cameraMode}
        onCameraChange={setCameraMode}
        showVectors={showVectors}
        onToggleVectors={() => setShowVectors(!showVectors)}
        isMuted={isMuted}
        onToggleAudio={toggleAudio}
        onTimeScaleChange={(scale) => updateState({ timeScale: scale })}
        onResetFlight={handleResetFlight}
        logCount={flightLog.length}
        onToggleFlightLog={() => setIsFlightLogOpen(!isFlightLogOpen)}
        latestMilestoneNotification={latestMilestoneNotification}
        onToggleGravity={handleToggleGravity}
        onUpdateState={updateState}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        isCurvaturePanelOpen={isCurvaturePanelOpen}
        onToggleCurvaturePanel={() => setIsCurvaturePanelOpen(!isCurvaturePanelOpen)}
      />

      {/* Real-Time Earth Curvature Fly-By-Wire Micro-Adjustments Monitor */}
      <CurvatureMicroAdjustPanel
        flightState={flightState}
        onUpdateState={updateState}
        isOpen={isCurvaturePanelOpen}
        onClose={() => setIsCurvaturePanelOpen(false)}
      />

      {/* Unified Bottom Controls Dock for the Four Forces of Flight */}
      <ForcesDock
        flightState={flightState}
        onUpdateState={updateState}
        onSelectWaypoint={handleSelectWaypoint}
        onApplyScenario={handleApplyScenario}
        onOpenFlightLog={() => setIsFlightLogOpen(true)}
        logCount={flightLog.length}
        onToggleGravity={handleToggleGravity}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
      />

      {/* Persistent Flight Log Component Modal / Drawer */}
      <FlightLog
        isOpen={isFlightLogOpen}
        onClose={() => setIsFlightLogOpen(false)}
        entries={flightLog}
        onClearLog={handleClearLog}
        onTakeSnapshot={handleTakeSnapshot}
      />

      {/* Pilot User Guide with Screenshots & Flight Dynamics Breakdown */}
      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />
    </div>
  );
}
