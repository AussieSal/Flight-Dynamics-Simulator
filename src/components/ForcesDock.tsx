import React, { useState } from 'react';
import { FlightState, Waypoint } from '../types/flight';
import { WORLD_WAYPOINTS } from './FlightPhysics';
import { flightAudio } from '../utils/audio';
import { 
  Flame, 
  Wind, 
  TrendingUp, 
  Anchor, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  MapPin, 
  BookOpen, 
  CheckCircle2,
  Compass,
  Zap,
  ArrowUp,
  ArrowDown,
  Plus,
  Minus,
  ClipboardList
} from 'lucide-react';

interface ForcesDockProps {
  flightState: FlightState;
  onUpdateState: (partial: Partial<FlightState>) => void;
  onSelectWaypoint: (wp: Waypoint) => void;
  onApplyScenario: (scenario: 'cruise' | 'climb' | 'descent' | 'stall') => void;
  onOpenFlightLog?: () => void;
  logCount?: number;
  onToggleGravity?: () => void;
  onOpenUserGuide?: () => void;
}

export const ForcesDock: React.FC<ForcesDockProps> = ({
  flightState,
  onUpdateState,
  onSelectWaypoint,
  onApplyScenario,
  onOpenFlightLog,
  logCount = 0,
  onToggleGravity,
  onOpenUserGuide,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'forces' | 'flightdeck' | 'routes' | 'academy'>('forces');

  // Ground Speed & Wind Conversions
  const headwindKts = Math.round((flightState.headwind || 0) * 1.94384);
  const airspeedKts = Math.round(flightState.airspeed * 1.94384);
  const pitchRad = (flightState.pitch * Math.PI) / 180;
  const groundSpeedMps = (flightState.airspeed * Math.cos(pitchRad)) - (flightState.headwind || 0);
  const groundSpeedKmh = Math.round(groundSpeedMps * 3.6);
  const groundSpeedKts = Math.round(groundSpeedMps * 1.94384);

  // Sound click wrapper
  const click = () => flightAudio.playClick();

  // Force button handlers - adjusting Thrust and Drag moves their respective sliders in direct synchronization
  const adjustThrust = (amount: number) => {
    click();
    if (amount > 0) {
      if (flightState.throttle < 1.0) {
        const nextThrottle = Math.min(1.0, Number((flightState.throttle + 0.05).toFixed(2)));
        onUpdateState({ throttle: nextThrottle, autopilotLevel: false });
      } else {
        // At 100% throttle, increase additional thrust trim
        onUpdateState({ thrustTrim: flightState.thrustTrim + 25, autopilotLevel: false });
      }
    } else {
      if (flightState.thrustTrim > 0) {
        onUpdateState({ thrustTrim: Math.max(0, flightState.thrustTrim - 25), autopilotLevel: false });
      } else {
        const nextThrottle = Math.max(0.0, Number((flightState.throttle - 0.05).toFixed(2)));
        onUpdateState({ throttle: nextThrottle, autopilotLevel: false });
      }
    }
  };

  const adjustDrag = (amount: number) => {
    click();
    if (amount > 0) {
      if (flightState.spoilers < 1.0) {
        const nextSpoilers = Math.min(1.0, Number((flightState.spoilers + 0.10).toFixed(2)));
        onUpdateState({ spoilers: nextSpoilers, autopilotLevel: false });
      } else {
        // At 100% spoilers, increase additional drag trim
        onUpdateState({ dragTrim: flightState.dragTrim + 20, autopilotLevel: false });
      }
    } else {
      if (flightState.dragTrim > 0) {
        onUpdateState({ dragTrim: Math.max(0, flightState.dragTrim - 20), autopilotLevel: false });
      } else {
        const nextSpoilers = Math.max(0.0, Number((flightState.spoilers - 0.10).toFixed(2)));
        onUpdateState({ spoilers: nextSpoilers, autopilotLevel: false });
      }
    }
  };

  const adjustLift = (amount: number) => {
    click();
    onUpdateState({ liftTrim: flightState.liftTrim + amount, autopilotLevel: false });
  };

  const adjustWeight = (amount: number) => {
    click();
    onUpdateState({ weightTrim: flightState.weightTrim + amount, autopilotLevel: false });
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96vw] max-w-4xl select-none">
      <div className="flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => {
            click();
            setIsCollapsed(!isCollapsed);
          }}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 rounded-t-xl text-slate-300 text-xs font-medium tracking-wide shadow-xl transition-all"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Show Flight Controls Dock</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hide Controls Dock</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div
          className={`pointer-events-auto w-full bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 overflow-hidden ${
            isCollapsed ? 'max-h-0 opacity-0 pointer-events-none py-0' : 'max-h-[500px] opacity-100 p-4'
          }`}
        >
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { click(); setActiveTab('forces'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'forces'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Forces of Flight</span>
              </button>

              <button
                onClick={() => { click(); setActiveTab('flightdeck'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'flightdeck'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Flight Deck & Presets</span>
              </button>

              <button
                onClick={() => { click(); setActiveTab('routes'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'routes'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Global Routes</span>
              </button>

              <button
                onClick={() => { click(); setActiveTab('academy'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'academy'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Aerodynamics Academy</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onOpenFlightLog && (
                <button
                  onClick={() => {
                    click();
                    onOpenFlightLog();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-cyan-950/70 border-cyan-800/80 text-cyan-300 hover:bg-cyan-900/80 text-xs font-mono font-medium transition-all shadow"
                  title="Open Persistent Flight Log"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LOG ({logCount})</span>
                </button>
              )}

              {/* Quick Autopilot Level Status */}
              <button
                onClick={() => {
                  click();
                  onUpdateState({ autopilotLevel: !flightState.autopilotLevel });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all ${
                  flightState.autopilotLevel
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Toggle Auto Level Flight Hold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>LEVEL AP: {flightState.autopilotLevel ? 'ACTIVE' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* TAB 1: THE FOUR FORCES OF FLIGHT CONTROLLERS */}
          {activeTab === 'forces' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. THRUST CONTROLLER */}
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      THRUST (T)
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">{flightState.forces.thrust} kN</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Forward motive force produced by 4x high-bypass turbofans (Trent 900 / GP7200). Overcomes drag.
                  </p>

                  {/* Buttons to control Thrust */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      onClick={() => adjustThrust(-25)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 active:scale-95 transition"
                      title="Decrease Throttle by 5% (-25 kN)"
                    >
                      <Minus className="w-3 h-3 text-red-400" />
                      <span>- Thrust</span>
                    </button>
                    <button
                      onClick={() => adjustThrust(25)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg active:scale-95 transition shadow"
                      title="Increase Throttle by 5% (+25 kN)"
                    >
                      <Plus className="w-3 h-3 text-slate-950" />
                      <span>+ Thrust</span>
                    </button>
                  </div>

                  {/* Throttle Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>THROTTLE</span>
                      <span>{Math.round(flightState.throttle * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={flightState.throttle}
                      onChange={(e) => onUpdateState({ throttle: parseFloat(e.target.value), autopilotLevel: false })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 mt-2">
                  <button
                    onClick={() => { click(); onUpdateState({ throttle: 0, thrustTrim: 0, autopilotLevel: false }); }}
                    className="py-1 text-[10px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                  >
                    Idle
                  </button>
                  <button
                    onClick={() => { click(); onUpdateState({ throttle: 0.68, thrustTrim: 0, autopilotLevel: false }); }}
                    className="py-1 text-[10px] font-mono rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/40"
                  >
                    Cruise 68%
                  </button>
                  <button
                    onClick={() => { click(); onUpdateState({ throttle: 1.0, thrustTrim: 50 }); }}
                    className="py-1 text-[10px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-amber-300"
                  >
                    TOGA Max
                  </button>
                </div>
              </div>

              {/* 2. DRAG CONTROLLER */}
              <div className="bg-slate-900/80 border border-red-500/30 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-red-400 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5" />
                      DRAG (D)
                    </span>
                    <span className="font-mono text-red-300 font-bold">{flightState.forces.drag} kN</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Aerodynamic resistance retarding forward flight. Parasitic + Induced.
                  </p>

                  {/* Buttons to control Drag */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      onClick={() => adjustDrag(-20)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 active:scale-95 transition"
                      title="Retract Speed Brakes by 10% (-20 kN Drag)"
                    >
                      <Minus className="w-3 h-3 text-emerald-400" />
                      <span>- Drag</span>
                    </button>
                    <button
                      onClick={() => adjustDrag(20)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg active:scale-95 transition shadow"
                      title="Deploy Speed Brakes by 10% (+20 kN Drag)"
                    >
                      <Plus className="w-3 h-3 text-white" />
                      <span>+ Drag</span>
                    </button>
                  </div>

                  {/* Spoilers / Speed Brakes Control */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>SPEED BRAKES</span>
                      <span>{Math.round(flightState.spoilers * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={flightState.spoilers}
                      onChange={(e) => onUpdateState({ spoilers: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-slate-800 mt-2">
                  <button
                    onClick={() => { click(); onUpdateState({ spoilers: 0, dragTrim: 0 }); }}
                    className="py-1 text-[10px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                  >
                    Clean Aerofoil
                  </button>
                  <button
                    onClick={() => { click(); onUpdateState({ spoilers: 1.0, dragTrim: 30 }); }}
                    className="py-1 text-[10px] font-mono rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/40"
                  >
                    Deploy Spoilers
                  </button>
                </div>
              </div>

              {/* 3. LIFT CONTROLLER */}
              <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      LIFT (L)
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">{flightState.forces.lift} kN</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    Upward aerodynamic force perpendicular to airflow. Generated by wings.
                  </p>

                  {/* Buttons to control Lift */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      onClick={() => adjustLift(-50)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 active:scale-95 transition"
                      title="Decrease Lift by 50 kN"
                    >
                      <Minus className="w-3 h-3 text-red-400" />
                      <span>- Lift</span>
                    </button>
                    <button
                      onClick={() => adjustLift(50)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg active:scale-95 transition shadow"
                      title="Increase Lift by 50 kN"
                    >
                      <Plus className="w-3 h-3 text-slate-950" />
                      <span>+ Lift</span>
                    </button>
                  </div>

                  {/* Pitch Trim / Angle of Attack (0.25° increments) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { click(); onUpdateState({ pitch: Math.max(-25, Number((flightState.pitch - 0.25).toFixed(2))), autopilotLevel: false }); }}
                      className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded font-mono flex items-center justify-center gap-0.5"
                      title="Pitch Down -0.25° (Key W)"
                    >
                      <ArrowDown className="w-3 h-3 text-red-400" /> Pitch -0.25°
                    </button>
                    <button
                      onClick={() => { click(); onUpdateState({ pitch: Math.min(25, Number((flightState.pitch + 0.25).toFixed(2))), autopilotLevel: false }); }}
                      className="flex-1 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-[10px] text-cyan-300 rounded font-mono flex items-center justify-center gap-0.5"
                      title="Pitch Up +0.25° (Key S)"
                    >
                      <ArrowUp className="w-3 h-3 text-cyan-400" /> Pitch +0.25°
                    </button>
                  </div>
                </div>

                {/* Flaps Setting */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 mt-2">
                  <button
                    onClick={() => { click(); onUpdateState({ flaps: 0.0, liftTrim: 0 }); }}
                    className={`py-1 text-[10px] font-mono rounded ${flightState.flaps === 0 ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Flaps 0°
                  </button>
                  <button
                    onClick={() => { click(); onUpdateState({ flaps: 0.5, liftTrim: 40 }); }}
                    className={`py-1 text-[10px] font-mono rounded ${flightState.flaps === 0.5 ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Flaps 15°
                  </button>
                  <button
                    onClick={() => { click(); onUpdateState({ flaps: 1.0, liftTrim: 90 }); }}
                    className={`py-1 text-[10px] font-mono rounded ${flightState.flaps === 1.0 ? 'bg-cyan-600 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}
                  >
                    Flaps 30°
                  </button>
                </div>
              </div>

              {/* 4. WEIGHT (GRAVITY) CONTROLLER */}
              <div className={`border rounded-xl p-3 flex flex-col justify-between transition ${
                flightState.gravityEnabled 
                  ? 'bg-slate-900/80 border-amber-500/30' 
                  : 'bg-fuchsia-950/40 border-fuchsia-500/60 shadow-lg shadow-fuchsia-500/20'
              }`}>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-bold flex items-center gap-1 ${
                      flightState.gravityEnabled ? 'text-amber-400' : 'text-fuchsia-400'
                    }`}>
                      <Anchor className="w-3.5 h-3.5" />
                      {flightState.gravityEnabled ? 'WEIGHT (W = mg)' : 'WEIGHT (0-G)'}
                    </span>
                    <span className={`font-mono font-bold ${
                      flightState.gravityEnabled ? 'text-amber-300' : 'text-fuchsia-300'
                    }`}>
                      {flightState.gravityEnabled ? `${flightState.forces.weight} kN` : '0.0 kN'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    {flightState.gravityEnabled 
                      ? 'Earth gravitational downward pull (mass × 9.81 m/s²). Balances wing lift in cruise.'
                      : 'Gravity disabled (g = 0 m/s²). Wings generate upward lift with no weight to counter it!'}
                  </p>

                  {/* Primary Toggle: Turn Off / On Gravity */}
                  <button
                    onClick={() => {
                      click();
                      if (onToggleGravity) {
                        onToggleGravity();
                      } else {
                        onUpdateState({ gravityEnabled: !flightState.gravityEnabled, autopilotLevel: false });
                      }
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 mb-2.5 shadow ${
                      flightState.gravityEnabled
                        ? 'bg-red-950/80 hover:bg-red-900 border border-red-500/80 text-red-200'
                        : 'bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-400 text-emerald-200 animate-pulse shadow-emerald-500/30'
                    }`}
                    title={flightState.gravityEnabled ? 'Turn OFF Gravity (Key G)' : 'Restore Earth 1G Gravity (Key G)'}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{flightState.gravityEnabled ? 'TURN OFF GRAVITY (0-G)' : 'RESTORE 1G GRAVITY'}</span>
                  </button>

                  {/* Buttons to control Weight Trim */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      onClick={() => adjustWeight(-50)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 active:scale-95 transition"
                      title="Decrease Aircraft Mass / Trim (-50 kN)"
                    >
                      <Minus className="w-3 h-3 text-cyan-400" />
                      <span>- Mass</span>
                    </button>
                    <button
                      onClick={() => adjustWeight(50)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg active:scale-95 transition shadow"
                      title="Increase Aircraft Mass / Trim (+50 kN)"
                    >
                      <Plus className="w-3 h-3 text-slate-950" />
                      <span>+ Mass</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>A380 MASS</span>
                    <span>{Math.round(380 + flightState.weightTrim / 9.81)} Tonnes</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-2 gap-1 pt-2 border-t border-slate-800 mt-2">
                  <button
                    onClick={() => { click(); onUpdateState({ weightTrim: -600, autopilotLevel: false }); }}
                    className="py-1 text-[10px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                  >
                    Light Fuel (320t)
                  </button>
                  <button
                    onClick={() => { click(); onUpdateState({ weightTrim: 1765, autopilotLevel: false }); }}
                    className="py-1 text-[10px] font-mono rounded bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40"
                  >
                    Max Gross (560t MTOW)
                  </button>
                </div>
              </div>
            </div>

            {/* Atmospheric Wind & Ground Speed Dynamics Bar */}
            <div className="mt-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <span>Atmospheric Wind:</span>
                    <span className={`font-mono px-2 py-0.5 rounded text-xs font-bold ${
                      headwindKts > 2 ? 'bg-amber-950 text-amber-300 border border-amber-800/60' :
                      headwindKts < -2 ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {headwindKts > 0 ? `⮜ HEADWIND: ${headwindKts} KTS` :
                       headwindKts < 0 ? `⮞ TAILWIND: ${Math.abs(headwindKts)} KTS` :
                       'CALM AIR (0 KTS)'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Airspeed (TAS): <strong className="text-cyan-300">{airspeedKts} kts</strong> • Ground Speed (GS): <strong className="text-amber-300">{groundSpeedKmh} km/h</strong> ({groundSpeedKts} kts)
                  </div>
                </div>
              </div>

              {/* Headwind & Tailwind Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                <button
                  onClick={() => { click(); onUpdateState({ headwind: -50 / 1.94384 }); }}
                  className="px-2 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 transition"
                  title="50 kts Tailwind"
                >
                  +50 kt Tailwind
                </button>
                <button
                  onClick={() => { click(); onUpdateState({ headwind: 0 }); }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Reset to Calm Air (0 kts)"
                >
                  Calm (0 kt)
                </button>
                <button
                  onClick={() => { click(); onUpdateState({ headwind: 50 / 1.94384 }); }}
                  className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 transition"
                  title="50 kts Headwind"
                >
                  +50 kt Headwind
                </button>
                <button
                  onClick={() => { click(); onUpdateState({ headwind: flightState.airspeed * Math.cos(flightState.pitch * Math.PI / 180) }); }}
                  className="px-2 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 font-bold transition shadow"
                  title="Hover Demo: Headwind equals Airspeed, Ground Speed drops to exactly 0 kts"
                >
                  Hover Demo (0 GS)
                </button>
              </div>
            </div>

            {/* Live Earth Curvature Fly-By-Wire Micro-Trim Bar */}
            <div className="mt-2 bg-slate-900/60 border border-cyan-500/30 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-bold">Earth Curvature FBW:</span>
                <span className="text-slate-300">
                  ω = <strong className="text-white">{(flightState.curvaturePitchRate ?? -0.0022).toFixed(4)}°/s</strong> ({((flightState.curvaturePitchRate ?? -0.0022) * 3600).toFixed(1)}°/hr)
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  Drop: <strong className="text-amber-300">{flightState.earthDropRatePerMin ?? 17.3} m/min</strong>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">
                  Elevator Trim: <strong className="text-emerald-300">{(flightState.elevatorMicroTrim ?? -0.08) > 0 ? '+' : ''}{(flightState.elevatorMicroTrim ?? -0.08).toFixed(2)}°</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  click();
                  onUpdateState({ curvatureTrackingEnabled: flightState.curvatureTrackingEnabled === false });
                }}
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition border ${
                  flightState.curvatureTrackingEnabled !== false
                    ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300 hover:bg-cyan-900'
                    : 'bg-amber-950 border-amber-600 text-amber-200 animate-pulse'
                }`}
                title="Toggle between spherical altitude-hold and tangent inertial drift"
              >
                {flightState.curvatureTrackingEnabled !== false ? 'FBW Curvature: LOCKED' : 'TANGENT DRIFT'}
              </button>
            </div>
          </div>
        )}

          {/* TAB 2: FLIGHT DECK & SCENARIO PRESETS */}
          {activeTab === 'flightdeck' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Flight Attitude Controls */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  Manual Flight Control Surfaces
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono mb-1 block">
                      Elevators (Pitch: {flightState.pitch >= 0 ? `+${flightState.pitch.toFixed(2)}` : flightState.pitch.toFixed(2)}°)
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { click(); onUpdateState({ pitch: Math.max(-25, Number((flightState.pitch - 0.25).toFixed(2))), autopilotLevel: false }); }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-mono flex items-center justify-center gap-0.5"
                        title="Pitch Down -0.25° (W or Down Arrow)"
                      >
                        <ArrowDown className="w-3 h-3 text-red-400" /> -0.25°
                      </button>
                      <button
                        onClick={() => { click(); onUpdateState({ pitch: Math.min(25, Number((flightState.pitch + 0.25).toFixed(2))), autopilotLevel: false }); }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-cyan-300 font-mono flex items-center justify-center gap-0.5"
                        title="Pitch Up +0.25° (S or Up Arrow)"
                      >
                        <ArrowUp className="w-3 h-3 text-cyan-400" /> +0.25°
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono mb-1 block">Ailerons (Bank / Roll)</label>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { click(); onUpdateState({ roll: Math.max(-45, flightState.roll - 10) }); }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-mono"
                      >
                        Bank Left ⮌
                      </button>
                      <button
                        onClick={() => { click(); onUpdateState({ roll: Math.min(45, flightState.roll + 10) }); }}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-mono"
                      >
                        Bank Right ⮎
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono mb-1 block">Rudder / Wings Level</label>
                    <button
                      onClick={() => { click(); onUpdateState({ roll: 0, autopilotLevel: true }); }}
                      className="w-full py-1.5 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 rounded font-mono"
                    >
                      Center Wings (0° Roll)
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 font-mono">
                  KEYBOARD HOTKEYS: [W/S or Up/Down] Pitch ±0.25° • [A/D] Bank Left/Right • [Shift/Ctrl] Throttle Up/Down • [B] Speed Brakes • [F] Flaps • [G] 0G/1G • [Space] Level AP
                </div>
              </div>

              {/* Four Forces Scenario Demonstrations */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Interactive Force Equilibrium Scenarios
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { click(); onApplyScenario('cruise'); }}
                    className="p-2 text-left bg-slate-800/70 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
                  >
                    <div className="text-xs font-bold text-cyan-300">✈️ Steady Level Cruise</div>
                    <div className="text-[10px] text-slate-400">Lift = Weight, Thrust = Drag</div>
                  </button>

                  <button
                    onClick={() => { click(); onApplyScenario('climb'); }}
                    className="p-2 text-left bg-emerald-950/40 hover:bg-emerald-900/40 rounded-lg border border-emerald-800/40 transition"
                  >
                    <div className="text-xs font-bold text-emerald-300">↗️ Max Rate Climb</div>
                    <div className="text-[10px] text-slate-400">Thrust &gt; Drag, Lift &gt; Weight</div>
                  </button>

                  <button
                    onClick={() => { click(); onApplyScenario('descent'); }}
                    className="p-2 text-left bg-sky-950/40 hover:bg-sky-900/40 rounded-lg border border-sky-800/40 transition"
                  >
                    <div className="text-xs font-bold text-sky-300">↘️ Clean Descent</div>
                    <div className="text-[10px] text-slate-400">Thrust &lt; Drag, Controlled descent</div>
                  </button>

                  <button
                    onClick={() => { click(); onApplyScenario('stall'); }}
                    className="p-2 text-left bg-red-950/40 hover:bg-red-900/40 rounded-lg border border-red-800/40 transition"
                  >
                    <div className="text-xs font-bold text-red-300">⚠️ Aerodynamic Stall</div>
                    <div className="text-[10px] text-slate-400">Critical AoA exceeded, loss of lift</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GLOBAL ROUTES & WAYPOINTS */}
          {activeTab === 'routes' && (
            <div>
              <div className="text-xs text-slate-400 mb-2">
                Select a global destination or major airway to position the commercial aeroplane across Earth:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {WORLD_WAYPOINTS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => {
                      click();
                      onSelectWaypoint(wp);
                    }}
                    className="p-2 bg-slate-900/80 hover:bg-slate-850 hover:border-cyan-500/60 border border-slate-800 rounded-xl text-left transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400 group-hover:text-cyan-300">{wp.code}</span>
                      <span className="text-[10px] text-slate-400">{wp.country}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-200 truncate">{wp.city}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {wp.lat.toFixed(1)}°, {wp.lon.toFixed(1)}°
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AERODYNAMICS ACADEMY */}
          {activeTab === 'academy' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> 1. THRUST
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Produced by turbofan engines ejecting high-velocity exhaust rearward. Newton's 3rd Law pushes the aircraft forward. At high altitude, thinner air reduces available thrust.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-emerald-300/80">Equation: T = ṁ × (v_exhaust - v_air)</div>
                </div>

                <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-3">
                  <div className="font-bold text-red-400 mb-1 flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5" /> 2. DRAG
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Parasitic drag (skin friction and form drag) grows with the square of speed. Induced drag is the penalty for generating lift. Spoilers dramatically spike drag to brake or descend.
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-red-300/80">Equation: D = ½ ρ v² S C_d</div>
                </div>

                <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-3">
                  <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> 3. LIFT
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Generated by air deflection and cambered aerofoils. High Angle of Attack boosts lift up to ~16°, beyond which flow separates and the wing stalls, causing an abrupt loss of lift!
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-cyan-300/80">Equation: L = ½ ρ v² S C_l</div>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3">
                  <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Anchor className="w-3.5 h-3.5" /> 4. WEIGHT
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Downward force pulling towards Earth center. A commercial widebody jet weighs ~150 tonnes with passengers and fuel. In steady level flight, Lift exactly equals Weight!
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-amber-300/80">Equation: W = mass × 9.81 m/s²</div>
                </div>
              </div>

              {/* Launch User Guide Banner */}
              {onOpenUserGuide && (
                <div className="mt-3 flex items-center justify-between p-2.5 bg-indigo-950/40 border border-indigo-700/50 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-200 font-medium">Looking for complete button documentation, flight formulas, and cockpit diagrams?</span>
                  </div>
                  <button
                    onClick={() => { click(); onOpenUserGuide(); }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition shadow"
                  >
                    Open Full Pilot User Guide
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
