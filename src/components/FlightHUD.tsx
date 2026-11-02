import React from 'react';
import { CameraMode, FlightState } from '../types/flight';
import { AttitudeIndicator } from './AttitudeIndicator';
import { 
  Volume2, 
  VolumeX, 
  Eye, 
  Compass, 
  Gauge, 
  ArrowUpRight, 
  Layers, 
  AlertTriangle,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  ClipboardList,
  CheckCircle2,
  Globe,
  Wind,
  BookOpen
} from 'lucide-react';

interface FlightHUDProps {
  flightState: FlightState;
  cameraMode?: CameraMode;
  onCameraChange?: (mode: CameraMode) => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  isMuted: boolean;
  onToggleAudio: () => void;
  onTimeScaleChange: (scale: number) => void;
  onResetFlight: () => void;
  logCount: number;
  onToggleFlightLog: () => void;
  latestMilestoneNotification?: string | null;
  onToggleGravity?: () => void;
  onUpdateState?: (partial: Partial<FlightState>) => void;
  onOpenUserGuide?: () => void;
  isCurvaturePanelOpen?: boolean;
  onToggleCurvaturePanel?: () => void;
}

export const FlightHUD: React.FC<FlightHUDProps> = ({
  flightState,
  showVectors,
  onToggleVectors,
  isMuted,
  onToggleAudio,
  onTimeScaleChange,
  onResetFlight,
  logCount,
  onToggleFlightLog,
  latestMilestoneNotification,
  onToggleGravity,
  onUpdateState,
  onOpenUserGuide,
  isCurvaturePanelOpen,
  onToggleCurvaturePanel,
}) => {
  const { altitude, airspeed, verticalSpeed, pitch, roll, heading, forces, isStalled, isOverspeed, timeScale } = flightState;

  // Conversions
  const altitudeFt = Math.round(altitude * 3.28084);
  const airspeedKts = Math.round(airspeed * 1.94384);
  const verticalSpeedFpm = Math.round(verticalSpeed * 196.85);
  const mach = (airspeed / 295).toFixed(2);

  // Ground Speed & Wind Calculations
  // Headwind (+) reduces ground speed, Tailwind (-) increases ground speed
  const headwindMps = flightState.headwind || 0;
  const headwindKts = Math.round(headwindMps * 1.94384);
  const pitchRad = (pitch * Math.PI) / 180;
  const horizontalAirspeedMps = airspeed * Math.cos(pitchRad);
  const groundSpeedMps = horizontalAirspeedMps - headwindMps;
  const groundSpeedKmh = Math.round(groundSpeedMps * 3.6);
  const groundSpeedKts = Math.round(groundSpeedMps * 1.94384);

  const handleAdjustWind = (deltaKts: number) => {
    if (!onUpdateState) return;
    const currentKts = Math.round((flightState.headwind || 0) * 1.94384);
    const newKts = currentKts + deltaKts;
    onUpdateState({ headwind: newKts / 1.94384 });
  };

  const handleSetWind = (targetKts: number) => {
    if (!onUpdateState) return;
    onUpdateState({ headwind: targetKts / 1.94384 });
  };

  // Force Deltas
  const liftVsWeight = forces.lift - forces.weight;
  const thrustVsDrag = forces.thrust - forces.drag;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5 text-slate-100 select-none">
      {/* Top Bar: Flight Telemetry & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Title and Live Route Coordinates */}
        <div 
          className="pointer-events-auto flex items-center gap-3 bg-slate-950/85 border border-slate-800/80 rounded-xl px-4 py-2.5 backdrop-blur-md shadow-2xl"
          style={{ height: '50.1875px', width: '399.913px', marginTop: '-73px' }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <h1 className="text-sm font-semibold tracking-wide text-white uppercase">
                AeroForces: Boeing A380
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold">
                A380 DOUBLE-DECK QUAD-JET
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400">
              <span>LAT: {flightState.latitude.toFixed(2)}°</span>
              <span>LON: {flightState.longitude.toFixed(2)}°</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Compass className="w-3 h-3 text-cyan-400" />
                HDG: {Math.round(heading).toString().padStart(3, '0')}°
              </span>
              <span className="hidden md:inline text-cyan-400">R_Earth: 6,371 km</span>
              <span className="hidden lg:inline text-emerald-300">
                FBW Trim: {(flightState.elevatorMicroTrim ?? -0.08) > 0 ? '+' : ''}{(flightState.elevatorMicroTrim ?? -0.08).toFixed(2)}°
              </span>
            </div>
          </div>
        </div>

        {/* Center: Flight Alerts (Stall / Overspeed) and Milestone Notification */}
        <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
          {latestMilestoneNotification && (
            <button
              onClick={onToggleFlightLog}
              className="flex items-center gap-2 bg-cyan-950/95 border border-cyan-400/80 text-cyan-200 px-3 py-1 rounded-lg font-mono text-xs shadow-2xl hover:bg-cyan-900/90 transition animate-fadeIn"
              title="Click to view in Flight Log"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{latestMilestoneNotification}</span>
              <span className="text-[10px] text-cyan-400 underline ml-1">View Log</span>
            </button>
          )}

          {isStalled && (
            <div className="flex items-center gap-2 bg-red-950/90 border border-red-500/80 text-red-200 px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg animate-bounce">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>STALL WARNING! PULL THROTTLE / NOSE DOWN</span>
            </div>
          )}
          {isOverspeed && !isStalled && (
            <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-500/80 text-amber-200 px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>OVERSPEED: {airspeedKts} KTS (MACH {mach})</span>
            </div>
          )}
        </div>

        {/* Right: Camera Mode, Audio, Vector Toggle, Sim Speed, Flight Log, Gravity Toggle */}
        <div 
          className="pointer-events-auto flex items-center gap-2 bg-slate-950/85 border border-slate-800/80 rounded-xl p-1.5 backdrop-blur-md shadow-2xl"
          style={{ marginRight: '480px', marginTop: '64px' }}
        >
          {/* Earth Curvature & Micro-Trim Monitor Toggle */}
          {onToggleCurvaturePanel && (
            <button
              onClick={onToggleCurvaturePanel}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow ${
                isCurvaturePanelOpen
                  ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-cyan-500/30'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Toggle Earth Curvature & Fly-By-Wire Micro-Adjustments Monitor"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-mono">Curvature FBW</span>
              <span className="text-[9px] font-mono font-bold px-1 rounded bg-cyan-900/80 text-cyan-200">
                {(flightState.curvaturePitchRate ?? -0.0022).toFixed(3)}°/s
              </span>
            </button>
          )}

          {/* Zero-G / Gravity Toggle Button */}
          {onToggleGravity && (
            <button
              onClick={onToggleGravity}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all shadow ${
                flightState.gravityEnabled
                  ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/80 hover:text-white'
                  : 'bg-fuchsia-950 border-fuchsia-400 text-fuchsia-200 shadow-lg shadow-fuchsia-500/30 animate-pulse hover:bg-fuchsia-900'
              }`}
              title={
                flightState.gravityEnabled
                  ? 'Turn OFF Gravity [Key G]: Aeroplane will react to 0G weightlessness and unconstrained wing lift'
                  : 'Turn ON Gravity [Key G]: Restore standard 1G Earth gravity'
              }
            >
              <Globe className={`w-3.5 h-3.5 ${flightState.gravityEnabled ? 'text-emerald-400' : 'text-fuchsia-400'}`} />
              <span className="font-mono">{flightState.gravityEnabled ? 'Gravity: ON' : '0-G ACTIVE'}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                flightState.gravityEnabled ? 'bg-emerald-800/80 text-emerald-100' : 'bg-fuchsia-500 text-slate-950'
              }`}>
                {flightState.gravityEnabled ? '1.0G' : '0G'}
              </span>
            </button>
          )}

          {/* Flight Log Button with Counter Badge */}
          <button
            onClick={onToggleFlightLog}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border bg-cyan-950/80 border-cyan-700/80 text-cyan-300 hover:bg-cyan-900 hover:text-white transition shadow"
            title="Open Persistent Flight Log (Milestones & Session Records)"
          >
            <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Flight Log</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-mono font-bold text-[10px]">
              {logCount}
            </span>
          </button>

          {/* Pilot User Guide Button */}
          {onOpenUserGuide && (
            <button
              onClick={onOpenUserGuide}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border bg-indigo-950/80 border-indigo-700/80 text-indigo-300 hover:bg-indigo-900 hover:text-white transition shadow"
              title="Open Detailed Pilot User Guide with Diagrams & Dynamics Analysis"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">User Guide</span>
            </button>
          )}



          {/* Sim Speed (Pause / 1x / 2x / 5x) */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => onTimeScaleChange(timeScale === 0 ? 1 : 0)}
              className={`p-1.5 rounded text-xs transition-all ${timeScale === 0 ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              title={timeScale === 0 ? 'Resume flight' : 'Pause flight'}
            >
              {timeScale === 0 ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onTimeScaleChange(1)}
              className={`px-2 py-1 text-xs font-mono rounded ${timeScale === 1 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="1x Real-time Speed"
            >
              1x
            </button>
            <button
              onClick={() => onTimeScaleChange(timeScale === 2 ? 5 : 2)}
              className={`flex items-center gap-0.5 px-2 py-1 text-xs font-mono rounded ${timeScale > 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Fast Forward Simulation"
            >
              <FastForward className="w-3 h-3" />
              <span>{timeScale > 1 ? `${timeScale}x` : '2x'}</span>
            </button>
          </div>

          {/* Reset Flight */}
          <button
            onClick={onResetFlight}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Reset flight to cruise equilibrium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-1.5 rounded-lg border transition-all ${
              !isMuted
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          >
            {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Far-Left Avionics Cluster: Attitude Indicator with Speed and Altitude Centred Underneath */}
      <div className="pointer-events-none absolute top-18 left-3 sm:left-5 z-20 flex flex-col items-center max-w-[235px]">
        {/* Actual Aircraft Attitude Indicator (ADI) */}
        <div 
          className="pointer-events-auto bg-slate-950/90 border border-slate-800/90 rounded-2xl p-2.5 backdrop-blur-md shadow-2xl flex flex-col items-center mb-2"
          style={{ height: '207.6px', marginTop: '-2px', marginRight: '45px' }}
        >
          <div className="text-[9px] tracking-wider text-slate-400 uppercase font-mono mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            ATTITUDE DIRECTOR (ADI)
          </div>
          <AttitudeIndicator pitch={pitch} roll={roll} size={152} />
        </div>

        {/* Speed and Altitude Boxes Centred Underneath Attitude Indicator */}
        <div className="pointer-events-auto flex items-stretch justify-center gap-2 w-full">
          {/* Airspeed Indicator (KTS) with Ground Speed Underneath */}
          <div className="flex-1 bg-slate-950/90 border border-slate-800/90 rounded-xl px-2 py-2 backdrop-blur-md shadow-xl flex flex-col items-center justify-between min-w-[102px]">
            <div className="flex flex-col items-center w-full">
              <div className="text-[9px] tracking-wider text-slate-400 uppercase font-mono flex items-center gap-1">
                <Gauge className="w-3 h-3 text-cyan-400" />
                AIRSPEED
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5 leading-tight">
                {airspeedKts}
                <span className="text-[10px] font-normal text-slate-400 ml-1">KTS</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Mach {mach}
              </div>
            </div>

            {/* Ground Speed directly under Airspeed */}
            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 w-full flex flex-col items-center">
              <div className="text-[9px] tracking-wider text-amber-400 uppercase font-mono flex items-center gap-0.5">
                <span>GROUND SPEED</span>
              </div>
              <div className="text-base font-bold font-mono text-amber-300 leading-tight mt-0.5">
                {groundSpeedKmh}
                <span className="text-[10px] font-normal text-slate-400 ml-1">KM/H</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                {groundSpeedKts} kts ({Math.round(groundSpeedMps)} m/s)
              </div>
              {/* Wind Component Tag */}
              <div className="mt-1">
                <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  headwindKts > 2 ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60' :
                  headwindKts < -2 ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60' :
                  'bg-slate-900 text-slate-400'
                }`}>
                  {headwindKts > 0 ? `HW −${headwindKts} KT` : headwindKts < 0 ? `TW +${Math.abs(headwindKts)} KT` : '0 KT WIND'}
                </span>
              </div>
            </div>
          </div>

          {/* Altitude & Vertical Speed Indicator */}
          <div className="flex-1 bg-slate-950/90 border border-slate-800/90 rounded-xl px-2 py-2 backdrop-blur-md shadow-xl flex flex-col items-center justify-between min-w-[105px]">
            <div className="flex flex-col items-center w-full">
              <div className="text-[9px] tracking-wider text-slate-400 uppercase font-mono flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ALTITUDE
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 leading-tight">
                {altitudeFt.toLocaleString()}
                <span className="text-[10px] font-normal text-slate-400 ml-1">FT</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {Math.round(altitude).toLocaleString()} M
              </div>
            </div>

            {/* Vertical Speed */}
            <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 w-full flex flex-col items-center">
              <div className="text-[9px] tracking-wider text-slate-400 uppercase font-mono">
                VERTICAL SPD
              </div>
              <div className={`text-base font-bold font-mono leading-tight mt-0.5 ${
                verticalSpeedFpm > 50 ? 'text-emerald-400' : verticalSpeedFpm < -50 ? 'text-amber-400' : 'text-slate-200'
              }`}>
                {verticalSpeedFpm > 0 ? `+${verticalSpeedFpm}` : verticalSpeedFpm}
                <span className="text-[10px] font-normal text-slate-400 ml-1">FPM</span>
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                {verticalSpeed.toFixed(1)} m/s
              </div>
            </div>
          </div>
        </div>

        {/* Headwind & Tailwind Options Panel */}
        <div className="pointer-events-auto mt-2 w-full bg-slate-950/95 border border-slate-800/90 rounded-xl p-2.5 backdrop-blur-md shadow-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" />
              WIND OPTIONS
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
              headwindKts > 0 ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
              headwindKts < 0 ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' :
              'bg-slate-900 text-slate-400 border border-slate-800'
            }`}>
              {headwindKts > 0 ? `⮜ HW ${headwindKts} KT` : headwindKts < 0 ? `⮞ TW ${Math.abs(headwindKts)} KT` : 'CALM 0 KT'}
            </span>
          </div>

          {/* Stepper Buttons for Headwind & Tailwind */}
          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
            <button
              onClick={() => handleAdjustWind(-25)}
              className="py-1 px-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded text-cyan-300 font-bold transition flex items-center justify-center gap-0.5"
              title="Add 25 kts Tailwind (Tailwind pushes plane forward -> Ground Speed increases)"
            >
              <span>+TW 25kt ⮞</span>
            </button>
            <button
              onClick={() => handleSetWind(0)}
              className="py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-white transition text-center"
              title="Reset to Calm Air (0 kts wind: GS equals Airspeed)"
            >
              Calm 0kt
            </button>
            <button
              onClick={() => handleAdjustWind(25)}
              className="py-1 px-1 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded text-amber-300 font-bold transition flex items-center justify-center gap-0.5"
              title="Add 25 kts Headwind (Headwind pushes against nose -> Ground Speed decreases)"
            >
              <span>⮜ +HW 25kt</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
            <button
              onClick={() => handleSetWind(40)}
              className={`py-1 rounded text-center border transition ${
                headwindKts === 40 ? 'bg-amber-600 text-slate-950 font-bold border-amber-400' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
              }`}
              title="40 kts Headwind"
            >
              40kt HW
            </button>
            <button
              onClick={() => handleSetWind(80)}
              className={`py-1 rounded text-center border transition ${
                headwindKts === 80 ? 'bg-amber-600 text-slate-950 font-bold border-amber-400' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
              }`}
              title="80 kts Heavy Headwind"
            >
              80kt HW
            </button>
            <button
              onClick={() => handleSetWind(-50)}
              className={`py-1 rounded text-center border transition ${
                headwindKts === -50 ? 'bg-cyan-600 text-slate-950 font-bold border-cyan-400' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-cyan-300'
              }`}
              title="50 kts Tailwind (Faster flight across Earth)"
            >
              50kt TW
            </button>
            <button
              onClick={() => handleSetWind(-120)}
              className={`py-1 rounded text-center border transition ${
                headwindKts === -120 ? 'bg-indigo-600 text-white font-bold border-indigo-400' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-indigo-300'
              }`}
              title="120 kts Transatlantic Jetstream Tailwind"
            >
              120kt TW
            </button>
          </div>

          {/* Interactive Hover Test Button */}
          <button
            onClick={() => handleSetWind(Math.round(airspeed * 1.94384))}
            className="w-full py-1 bg-red-950/60 hover:bg-red-900/60 border border-red-700/60 rounded text-[9px] font-mono font-bold text-red-200 transition flex items-center justify-center gap-1 shadow"
            title="Set Headwind equal to Airspeed -> Ground Speed becomes 0 KTS (Hover Demo: wings fly, Earth stands still)"
          >
            <span>🛬 HOVER DEMO (HW = TAS, GS = 0)</span>
          </button>

          {/* Physics Effect Explanation */}
          <div className="text-[8.5px] font-mono text-slate-400 bg-slate-900/60 p-1.5 rounded border border-slate-800/60 leading-tight">
            <span className="text-cyan-300">Airspeed ({airspeedKts} kt)</span> governs Lift/Drag.
            <br />
            <span className="text-amber-300">Ground Speed ({groundSpeedKts} kt)</span> governs Earth track speed.
          </div>
        </div>
      </div>

      {/* Middle Center: Compact Live 4-Forces Status Cards */}
      <div className="flex items-center justify-center gap-3 w-full my-auto">
        <div 
          className="pointer-events-auto flex flex-wrap items-center justify-center gap-2.5 bg-slate-950/85 border border-slate-800/80 rounded-2xl p-2.5 backdrop-blur-md shadow-2xl"
          style={{ marginTop: '-837px', marginRight: '-658px', marginBottom: '0px', height: '58.5px' }}
        >
          {/* Thrust Card */}
          <div className="flex items-center gap-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-emerald-300 tracking-wider font-semibold">THRUST (FORWARD)</span>
              <span className="text-sm font-mono font-bold text-white">{forces.thrust} <span className="text-[10px] text-emerald-400">kN</span></span>
            </div>
          </div>

          {/* Drag Card */}
          <div className="flex items-center gap-2.5 bg-red-950/40 border border-red-500/30 rounded-xl px-3 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/50" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-red-300 tracking-wider font-semibold">DRAG (REARWARD)</span>
              <span className="text-sm font-mono font-bold text-white">{forces.drag} <span className="text-[10px] text-red-400">kN</span></span>
            </div>
          </div>

          <div className="hidden sm:block text-xs font-mono text-slate-400 px-1">
            {Math.abs(thrustVsDrag) < 5 ? (
              <span className="text-emerald-400">T ≈ D (Cruise)</span>
            ) : thrustVsDrag > 0 ? (
              <span className="text-emerald-300">T &gt; D (+{Math.round(thrustVsDrag)} kN Accel)</span>
            ) : (
              <span className="text-red-300">T &lt; D ({Math.round(thrustVsDrag)} kN Decel)</span>
            )}
          </div>

          {/* Lift Card */}
          <div className="flex items-center gap-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-3 py-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-cyan-300 tracking-wider font-semibold">LIFT (UPWARD)</span>
              <span className="text-sm font-mono font-bold text-white">{forces.lift} <span className="text-[10px] text-cyan-400">kN</span></span>
            </div>
          </div>

          {/* Weight Card / Zero-G Status */}
          <button
            onClick={onToggleGravity}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 border transition cursor-pointer text-left ${
              flightState.gravityEnabled
                ? 'bg-amber-950/40 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/60'
                : 'bg-fuchsia-950/70 border-fuchsia-400 hover:border-fuchsia-300 hover:bg-fuchsia-900/70 shadow-lg shadow-fuchsia-500/30'
            }`}
            title={flightState.gravityEnabled ? 'Click to turn OFF gravity (0-G)' : 'Click to restore Earth gravity (1G)'}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${
              flightState.gravityEnabled 
                ? 'bg-amber-400 shadow-sm shadow-amber-400/50' 
                : 'bg-fuchsia-400 shadow-sm shadow-fuchsia-400/80 animate-ping'
            }`} />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-mono tracking-wider font-semibold ${
                  flightState.gravityEnabled ? 'text-amber-300' : 'text-fuchsia-300'
                }`}>
                  {flightState.gravityEnabled ? 'WEIGHT (GRAVITY)' : 'WEIGHT (0-G)'}
                </span>
                {!flightState.gravityEnabled && (
                  <span className="text-[8px] font-mono font-bold px-1 rounded bg-fuchsia-500 text-slate-950">
                    WEIGHTLESS
                  </span>
                )}
              </div>
              <span className="text-sm font-mono font-bold text-white">
                {flightState.gravityEnabled ? forces.weight : '0.0'}{' '}
                <span className={`text-[10px] ${flightState.gravityEnabled ? 'text-amber-400' : 'text-fuchsia-400'}`}>kN</span>
              </span>
            </div>
          </button>

          <div className="hidden sm:block text-xs font-mono text-slate-400 px-1">
            {!flightState.gravityEnabled ? (
              <span className="text-fuchsia-300 font-semibold">
                0-G Active: Net +{Math.round(forces.lift)} kN Upward Lift Acceleration!
              </span>
            ) : Math.abs(liftVsWeight) < 15 ? (
              <span className="text-cyan-400">L ≈ W (Level)</span>
            ) : liftVsWeight > 0 ? (
              <span className="text-cyan-300">L &gt; W (+{Math.round(liftVsWeight)} kN Climb)</span>
            ) : (
              <span className="text-amber-300">L &lt; W ({Math.round(liftVsWeight)} kN Sink)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
