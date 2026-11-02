import React, { useState } from 'react';
import { FlightState } from '../types/flight';
import { 
  Globe, 
  TrendingDown, 
  Gauge, 
  Activity, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  Compass
} from 'lucide-react';
import { flightAudio } from '../utils/audio';

interface CurvatureMicroAdjustPanelProps {
  flightState: FlightState;
  onUpdateState: (partial: Partial<FlightState>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CurvatureMicroAdjustPanel: React.FC<CurvatureMicroAdjustPanelProps> = ({
  flightState,
  onUpdateState,
  isOpen,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!isOpen) return null;

  const isTracking = flightState.curvatureTrackingEnabled !== false;
  const pitchRate = flightState.curvaturePitchRate ?? -0.0022;
  const pitchRatePerHour = (pitchRate * 3600).toFixed(2);
  const dropRatePerMin = flightState.earthDropRatePerMin ?? 17.3;
  const dropRateFtPerMin = Math.round(dropRatePerMin * 3.28084);
  const elevatorTrim = flightState.elevatorMicroTrim ?? -0.08;
  const eotvosRelief = flightState.eotvosReliefKN ?? 35.8;
  const activity = flightState.microAdjustActivity ?? 'stabilized';
  const history = flightState.microAdjustHistory || [-0.08, -0.08, -0.07, -0.09, -0.08];

  const handleToggleTracking = () => {
    flightAudio.playClick();
    onUpdateState({ curvatureTrackingEnabled: !isTracking });
  };

  // Sparkline coordinates for elevator trim history
  const svgW = 220;
  const svgH = 38;
  const minVal = -0.20;
  const maxVal = 0.10;
  const range = maxVal - minVal;

  const points = history.map((val, idx) => {
    const x = (idx / Math.max(1, history.length - 1)) * svgW;
    const clampedVal = Math.max(minVal, Math.min(maxVal, val));
    const y = svgH - ((clampedVal - minVal) / range) * svgH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Zero-line Y in sparkline
  const zeroY = svgH - ((0 - minVal) / range) * svgH;

  return (
    <div className="fixed top-18 right-4 sm:right-6 z-30 select-none animate-fadeIn">
      <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl w-[340px] sm:w-[380px] overflow-hidden text-slate-100 border-t-2 border-t-cyan-400">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Globe className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                  Earth Curvature Dynamics
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'
                }`} />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                A380 Fly-By-Wire Micro-Adjustments
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title={isMinimized ? 'Expand panel' : 'Minimize panel'}
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Active Status Banner */}
        <div className={`px-3 py-1.5 flex items-center justify-between text-[11px] font-mono border-b ${
          isTracking 
            ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300' 
            : 'bg-amber-950/70 border-amber-800/60 text-amber-300'
        }`}>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {isTracking ? 'FBW CURVATURE TRACKING: ACTIVE' : 'TANGENT DRIFT MODE (NO CORRECTION)'}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
            {activity === 'stabilized' ? 'TRIMMED' : activity === 'trim-down' ? '▼ NOSE-DOWN' : activity === 'trim-up' ? '▲ NOSE-UP' : 'DRIFTING'}
          </span>
        </div>

        {!isMinimized && (
          <div className="p-3.5 space-y-3">
            {/* Primary Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Tile 1: Required Pitch-Down Angular Rate */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-cyan-400" />
                    PITCH RATE (ω)
                  </span>
                  <span className="text-cyan-400 font-bold">dθ/dt</span>
                </div>
                <div className="mt-1">
                  <div className="text-lg font-bold font-mono text-cyan-300 leading-tight">
                    {pitchRate.toFixed(4)}°/s
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {pitchRatePerHour}° per hour
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 leading-tight">
                  Continuous nose-down rotation matching Earth's 6,371 km radius
                </div>
              </div>

              {/* Tile 2: Tangent Horizon Drop */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-400" />
                    EARTH DROP RATE
                  </span>
                  <span className="text-amber-400 font-bold">d²/2R</span>
                </div>
                <div className="mt-1">
                  <div className="text-lg font-bold font-mono text-amber-300 leading-tight">
                    {dropRatePerMin} m/min
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {dropRateFtPerMin} ft/min drop
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 leading-tight">
                  Distance Earth surface drops away under a straight tangent line
                </div>
              </div>

              {/* Tile 3: Elevator Micro-Trim Angle */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    ELEVATOR TRIM
                  </span>
                  <span className="text-emerald-400 font-bold">THS</span>
                </div>
                <div className="mt-1">
                  <div className="text-lg font-bold font-mono text-emerald-300 leading-tight">
                    {elevatorTrim > 0 ? `+${elevatorTrim.toFixed(2)}` : elevatorTrim.toFixed(2)}°
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    FBW Stabilizer Command
                  </div>
                </div>
                {/* Visual Analog Deflection Bar */}
                <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 relative overflow-hidden border border-slate-800">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600" />
                  <div 
                    className="absolute top-0 bottom-0 bg-emerald-400 rounded-full transition-all duration-150"
                    style={{
                      left: elevatorTrim < 0 ? `${Math.max(0, 50 + elevatorTrim * 100)}%` : '50%',
                      width: `${Math.min(50, Math.abs(elevatorTrim) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Tile 4: Centrifugal Eötvös Relief */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-fuchsia-400" />
                    EÖTVÖS RELIEF
                  </span>
                  <span className="text-fuchsia-400 font-bold">mv²/R</span>
                </div>
                <div className="mt-1">
                  <div className="text-lg font-bold font-mono text-fuchsia-300 leading-tight">
                    +{eotvosRelief} kN
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Orbital velocity relief
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 leading-tight">
                  Centrifugal speed counters ~0.1% of aircraft weight
                </div>
              </div>
            </div>

            {/* Live 30-Second Rolling Oscilloscope (Sparkline) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span className="flex items-center gap-1 text-slate-300">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  LIVE FLY-BY-WIRE MICRO-TRIM OSCILLATIONS
                </span>
                <span className="text-cyan-400 text-[9px]">Last 25 Cycles</span>
              </div>

              <div className="relative w-full h-[38px] bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
                {/* Zero Reference Line */}
                <div 
                  className="absolute left-0 right-0 border-b border-dashed border-slate-700/60"
                  style={{ top: `${zeroY}px` }}
                />

                <svg className="w-full h-full">
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>

                <div className="absolute right-1.5 bottom-0.5 text-[8.5px] font-mono text-slate-500">
                  Datum: FL350 Geoid
                </div>
              </div>
            </div>

            {/* Interactive Flight Experiment: Curvature Tracking vs Tangent Drift */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Autopilot Curvature Lock
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isTracking 
                      ? 'Nose pitches down -0.0022°/s to track Earth curvature'
                      : 'Disabled: plane drifts along straight tangent into space'
                    }
                  </div>
                </div>
                <button
                  onClick={handleToggleTracking}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all shadow ${
                    isTracking
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                      : 'bg-amber-600 hover:bg-amber-500 text-slate-950 animate-pulse'
                  }`}
                >
                  {isTracking ? 'Active (Level)' : 'Tangent Drift!'}
                </button>
              </div>

              {!isTracking && (
                <div className="mt-2 p-2 bg-amber-950/80 border border-amber-500/40 rounded-lg text-[10px] font-mono text-amber-200 leading-snug">
                  ⚠️ <strong>TANGENT EXPERIMENT ACTIVE</strong>: Without curvature micro-trimming, 
                  the aircraft flies in a straight Euclidean line. Earth is curving away beneath it 
                  at <strong>+{dropRatePerMin} m/min</strong>! Watch altitude gradually climb.
                </div>
              )}
            </div>

            {/* Educational Accordion Toggle */}
            <div className="border-t border-slate-800/80 pt-2">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center justify-between w-full text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  Physics of Flying Around a Spherical Earth
                </span>
                {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showExplanation && (
                <div className="mt-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[10px] text-slate-300 space-y-1.5 leading-relaxed font-sans">
                  <p>
                    <strong className="text-white">1. Rotating Downward Vector:</strong> As the A380 cruises at 900 km/h (250 m/s), 
                    Earth's gravitational vector continuously rotates toward the planetary core at 
                    <span className="text-cyan-300 font-mono"> ω = v/R ≈ 0.0022°/s (~8° per hour)</span>.
                  </p>
                  <p>
                    <strong className="text-white">2. Tangential Horizon Drop:</strong> In Euclidean flat space, a straight line 
                    drops beneath a sphere by <span className="text-amber-300 font-mono">Δh ≈ d²/(2R)</span>. 
                    At 900 km/h, Earth curves downward by 17.3 meters every minute.
                  </p>
                  <p>
                    <strong className="text-white">3. Fly-By-Wire Micro-Adjustments:</strong> Modern airliners use their Trimmable 
                    Horizontal Stabilizer (THS) to apply continuous micro pitch-down nudges (~0.05° to 0.1°), 
                    pegging barometric altitude smoothly to the spherical geoid.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
