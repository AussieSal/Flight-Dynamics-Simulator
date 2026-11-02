import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Gauge, 
  Wind, 
  Sliders, 
  Compass, 
  Keyboard, 
  Flame, 
  TrendingUp, 
  Anchor, 
  ArrowUp, 
  ArrowDown, 
  Globe, 
  RotateCcw, 
  Layers, 
  CheckCircle2,
  AlertTriangle,
  Calculator,
  FileText
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hud' | 'forces' | 'wind' | 'controls' | 'shortcuts' | 'calculations'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[88vh] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                  Boeing A380 Flight Simulator • Pilot User Guide
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                  SYSTEM MANUAL v3.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive guide to cockpit controls, telemetry displays, aerodynamics formulas, and flight dynamics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="Close Guide [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Overview & A380</span>
            </button>

            <button
              onClick={() => setActiveTab('hud')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'hud'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>HUD & Avionics</span>
            </button>

            <button
              onClick={() => setActiveTab('forces')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'forces'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>4 Forces of Flight</span>
            </button>

            <button
              onClick={() => setActiveTab('wind')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'wind'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Wind & Ground Speed</span>
            </button>

            <button
              onClick={() => setActiveTab('controls')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'controls'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Buttons & Flight Dynamics</span>
            </button>

            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'shortcuts'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard & Gestures</span>
            </button>

            <button
              onClick={() => setActiveTab('calculations')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'calculations'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>Background Math & Formulas</span>
            </button>
          </div>

          <div className="w-48 sm:w-64">
            <input
              type="text"
              placeholder="Search buttons or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-sm text-slate-300">
          
          {/* TAB 1: OVERVIEW & BOEING A380 */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    Boeing A380 Double-Deck Quad-Jet Simulation
                  </h3>
                  <p className="mt-2 text-slate-300 leading-relaxed">
                    This simulator implements a mathematically rigorous, to-scale 2D and 3D aerodynamic flight engine above the true curvature of planet Earth (<span className="text-cyan-300 font-mono">Radius = 6,371 km</span>).
                  </p>
                  <p className="mt-2 text-slate-400 leading-relaxed">
                    Every aircraft dimension, force vector, atmospheric pressure gradient, and gravitational acceleration vector is modeled to real-world metric standards. The aircraft depicted is the massive double-decker superjumbo configured with four high-bypass turbofan engines.
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Fuselage Length</span>
                      <span className="text-cyan-300 font-bold text-sm">72.7 meters</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Double-Deck Height</span>
                      <span className="text-cyan-300 font-bold text-sm">8.41 meters</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Wing Surface Area</span>
                      <span className="text-cyan-300 font-bold text-sm">845.0 m²</span>
                    </div>
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase">Powerplant</span>
                      <span className="text-cyan-300 font-bold text-sm">4x Turbofans (1,250 kN)</span>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
                  <img 
                    src="/src/assets/images/cockpit_controls_panel_1793250298243.jpg" 
                    alt="Boeing A380 Flight Deck Controls Console" 
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-950/95 border-t border-slate-800 text-xs">
                    <span className="font-bold text-white block">Figure 1: Boeing A380 Glass Flight Deck Console</span>
                    <span className="text-slate-400 text-[11px]">Direct controls for Pitch Elevation, Throttle/Thrust Trim, Flaps, Spoilers, and Zero-Gravity switch.</span>
                  </div>
                </div>
              </div>

              {/* Real Scale Earth Curvature Section */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Real-Scale Earth Curvature & 500 km Segment Grid
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unlike flat-Earth flight games, the simulator renders the authentic spherical arc of planet Earth. The flight path curves constantly around the planetary center.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">500 km Radial Spokes</span>
                    <p className="text-slate-400 text-[11px]">
                      Drawn on the globe every 500 km of surface arc. Each spoke projects directly downward, converging precisely at the Earth core ($R = 0$).
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">Atmospheric Stratification</span>
                    <p className="text-slate-400 text-[11px]">
                      Air density ρ decreases exponentially with altitude (ρ = ρ₀ · e^(-h/H)), reducing drag at high altitudes but requiring higher true airspeeds to maintain lift.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">Smooth Zoom Hierarchy</span>
                    <p className="text-slate-400 text-[11px]">
                      From microscopic 1:1 aircraft scale up to planetary orbit (100,000 km altitude), Earth curvature maintains pristine mathematical accuracy without fanning or geometric distortion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HUD & AVIONICS */}
          {activeTab === 'hud' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
                  <img 
                    src="/src/assets/images/a380_hud_avionics_1793250297200.jpg" 
                    alt="Boeing A380 HUD Primary Flight Display" 
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-950/95 border-t border-slate-800 text-xs">
                    <span className="font-bold text-white block">Figure 2: Primary Flight Display & Heads-Up Avionics</span>
                    <span className="text-slate-400 text-[11px]">Attitude Director Indicator (ADI), Airspeed tape, Ground Speed readout, and Vertical Speed.</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    Avionics Cluster & HUD Breakdown
                  </h3>
                  <p className="mt-2 text-slate-300 leading-relaxed text-xs">
                    The top-left avionics cluster gives the pilot instant, high-contrast situational awareness. It sits directly above the simulator horizon:
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
                      <span className="font-bold text-cyan-400 block font-mono">1. ATTITUDE DIRECTOR INDICATOR (ADI)</span>
                      <p className="text-slate-300 mt-1">
                        Artificial horizon displaying aircraft pitch ladder (in 0.25° increments) and roll/bank angles. The cyan sky dome and terracotta ground disk show aircraft attitude relative to Earth horizontal.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
                      <span className="font-bold text-cyan-400 block font-mono">2. AIRSPEED INDICATOR (KTS & MACH)</span>
                      <p className="text-slate-300 mt-1">
                        Indicated/True Airspeed ($v$) measured in knots (KTS) and Mach number ($M = v / a$). Airspeed directly drives wing dynamic pressure ($q = \frac{1}{2}\rho v^2$) which generates Lift and Drag.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
                      <span className="font-bold text-amber-400 block font-mono">3. GROUND SPEED INDICATOR (KM/H & KTS)</span>
                      <p className="text-slate-300 mt-1">
                        Located directly beneath Airspeed. Displays the aircraft's horizontal speed across the physical surface of Earth in <strong className="text-amber-300">KM/H</strong> and knots, incorporating Headwind or Tailwind.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800">
                      <span className="font-bold text-emerald-400 block font-mono">4. ALTITUDE & VERTICAL SPEED (FT & FPM)</span>
                      <p className="text-slate-300 mt-1">
                        Barometric/geometric altitude above mean sea level in feet and meters, plus instantaneous rate of climb or descent in feet per minute (FPM).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THE 4 FORCES OF FLIGHT */}
          {activeTab === 'forces' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    Aerodynamic Equilibrium of the Four Forces
                  </h3>
                  <p className="mt-2 text-slate-300 leading-relaxed text-xs">
                    Flight dynamics is governed by Newton's second law (F = m · a) acting on four opposing force vectors:
                  </p>

                  <div className="mt-4 space-y-2.5 text-xs font-mono">
                    <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60">
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> THRUST (T)</span>
                        <span>Propulsion Forward</span>
                      </div>
                      <p className="text-slate-300 mt-1 font-sans text-xs">
                        Generated by 4x Trent 900 / GP7200 high-bypass turbofans. Accelerates aircraft forward along its longitudinal flight axis. Max rated TOGA: <strong>1,250 kN</strong>.
                      </p>
                    </div>

                    <div className="p-3 bg-red-950/40 rounded-xl border border-red-800/60">
                      <div className="flex items-center justify-between text-red-300 font-bold">
                        <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5" /> DRAG (D)</span>
                        <span>Aerodynamic Resistance Rearward</span>
                      </div>
                      <p className="text-slate-300 mt-1 font-sans text-xs">
                        Resistance opposing motion (D = 0.5 · ρ · v² · S · Cd). Induced by lift generation and skin friction. Deploying spoilers or flaps increases drag significantly.
                      </p>
                    </div>

                    <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-800/60">
                      <div className="flex items-center justify-between text-cyan-300 font-bold">
                        <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> LIFT (L)</span>
                        <span>Aerodynamic Force Upward</span>
                      </div>
                      <p className="text-slate-300 mt-1 font-sans text-xs">
                        Generated by air flowing over the 845 m² supercritical wings (L = 0.5 · ρ · v² · S · Cl). Acts perpendicular to the relative airflow to overcome aircraft weight.
                      </p>
                    </div>

                    <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/60">
                      <div className="flex items-center justify-between text-indigo-300 font-bold">
                        <span className="flex items-center gap-1.5"><Anchor className="w-3.5 h-3.5" /> WEIGHT (W)</span>
                        <span>Gravitational Force Downward</span>
                      </div>
                      <p className="text-slate-300 mt-1 font-sans text-xs">
                        Earth gravitational pull directed precisely toward Earth's center of mass (W = m · g(r)). For a 380,000 kg A380 at cruise: W ≈ 3,726 kN.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
                  <img 
                    src="/src/assets/images/a380_four_forces_1793250297436.jpg" 
                    alt="Technical Flight Physics Diagram: The Four Forces of Flight in Cruise" 
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-950/95 border-t border-slate-800 text-xs">
                    <span className="font-bold text-white block">Figure 3: Four Forces Vector Equilibrium</span>
                    <span className="text-slate-400 text-[11px]">When $T = D$ and $L = W$, the airliner maintains steady level cruise with zero acceleration.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WIND & GROUND SPEED */}
          {activeTab === 'wind' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl">
                  <img 
                    src="/src/assets/images/wind_dynamics_diagram_1793250298081.jpg" 
                    alt="Airspeed vs Ground Speed Wind Dynamics Vector Diagram" 
                    className="w-full h-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-3 bg-slate-950/95 border-t border-slate-800 text-xs">
                    <span className="font-bold text-white block">Figure 4: Wind Vector Effects on True Airspeed vs Ground Speed</span>
                    <span className="text-slate-400 text-[11px]">Demonstrating Headwind (GS &lt; TAS), Tailwind (GS &gt; TAS), and Hover Equilibrium (GS = 0).</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wind className="w-5 h-5 text-cyan-400" />
                    How Wind Affects Flight Dynamics
                  </h3>
                  <p className="mt-2 text-slate-300 leading-relaxed text-xs">
                    One of the most crucial concepts in aviation is distinguishing between <strong>Airspeed</strong> (speed through the air mass) and <strong>Ground Speed</strong> (speed across the Earth surface):
                  </p>

                  <div className="mt-4 space-y-3 text-xs">
                    <div className="p-3 bg-amber-950/50 rounded-xl border border-amber-800/60">
                      <span className="font-bold text-amber-300 block font-mono">1. HEADWIND (+HW KT)</span>
                      <p className="text-slate-300 mt-1">
                        Wind blows directly against the nose of the plane.
                        <br />
                        <span className="font-mono text-cyan-300">Ground Speed = True Airspeed - Headwind</span>
                        <br />
                        <strong>Effect:</strong> The wings feel full high-speed airflow, producing ample lift and maintaining flight, but the aircraft takes longer to travel between cities across Earth.
                      </p>
                    </div>

                    <div className="p-3 bg-cyan-950/50 rounded-xl border border-cyan-800/60">
                      <span className="font-bold text-cyan-300 block font-mono">2. TAILWIND (+TW KT / -HW)</span>
                      <p className="text-slate-300 mt-1">
                        Wind blows from behind the aircraft (e.g. Jetstream).
                        <br />
                        <span className="font-mono text-cyan-300">Ground Speed = True Airspeed + Tailwind</span>
                        <br />
                        <strong>Effect:</strong> The plane crosses continents rapidly at ground speeds up to 1,100+ km/h while burning normal fuel.
                      </p>
                    </div>

                    <div className="p-3 bg-red-950/50 rounded-xl border border-red-800/60">
                      <span className="font-bold text-red-300 block font-mono">3. HOVER DEMO EQUILIBRIUM (GS = 0 KM/H)</span>
                      <p className="text-slate-300 mt-1">
                        When headwind exactly equals true airspeed (V_Headwind = V_Airspeed), ground speed becomes exactly zero:
                        <br />
                        <span className="font-mono text-white">GS = 0 km/h · 0 kts</span>
                        <br />
                        <strong>Dynamic Result:</strong> The Boeing A380 hovers stationary in mid-air over a single point on Earth while its wings generate full aerodynamic lift!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BUTTONS & FLIGHT DYNAMICS */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                Comprehensive Button Index & Flight Dynamics Effects
              </h3>
              <p className="text-xs text-slate-300">
                Detailed reference of every interactive button, toggle, and slider in the simulator and exactly how clicking it alters aircraft physics:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Control 1: Pitch Steppers */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 font-mono">PITCH UP / DOWN (0.25° Increments)</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">W / S or Arrows</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Adjusts elevator angle to tilt nose up (+0.25°) or down (-0.25°).
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Directly changes the Angle of Attack ($\alpha$). Increasing pitch raises wing $C_L$ causing climb ($L &gt; W$). Exceeding 15° triggers aerodynamic wing stall!
                  </p>
                </div>

                {/* Control 2: Throttle Steppers */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 font-mono">THROTTLE (0% – 100%)</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">Shift / Ctrl</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Governs fuel flow to the 4 Trent 900 turbofans in 5% steps.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Thrust increases linearly. When T &gt; D, the aircraft accelerates (dv/dt &gt; 0). Higher airspeed multiplies wing dynamic pressure, increasing both lift and drag.
                  </p>
                </div>

                {/* Control 3: Flaps Stepper */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 font-mono">FLAPS (0° Clean / 15° Takeoff / 35° Land)</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">F key</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Cycles wing trailing edge Fowler flaps between 0.0, 0.5, and 1.0.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Increases wing camber and effective surface area. Provides high lift at low takeoff/landing speeds, but introduces high parasite drag.
                  </p>
                </div>

                {/* Control 4: Spoilers / Speed Brakes */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-400 font-mono">SPOILERS / SPEEDBRAKES</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">B key</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Deploys 16 upper-wing spoiler panels into the airflow.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> "Spoils" laminar airflow over the wing top, dumping 40% of wing lift and quadrupling parasite drag. Used for rapid emergency descent without overspeeding.
                  </p>
                </div>

                {/* Control 5: Zero-Gravity Toggle */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-fuchsia-400 font-mono">ZERO-GRAVITY TOGGLE (0G / 1G)</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">G key</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Disables or restores Earth gravitational attraction (g = 0 m/s²).
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Weight drops instantly to 0 kN (W = 0). Unbalanced aerodynamic lift catapults the superjumbo upwards into the upper stratosphere and outer space!
                  </p>
                </div>

                {/* Control 6: Autopilot Level Hold */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 font-mono">AUTOPILOT LEVEL HOLD</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">Spacebar</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Engages automatic fly-by-wire flight control computer.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Continuously modulates pitch trim to maintain vertical speed at 0 fpm ($V_z = 0$), holding steady cruise altitude over Earth curvature.
                  </p>
                </div>

                {/* Control 7: Force Trim Buttons */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 font-mono">FORCE TRIM ADJUSTERS (±50 kN)</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">Forces Dock</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Injects direct manual force bias into Thrust, Drag, Lift, or Weight.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Demonstrates physics thought experiments—e.g. inject +100 kN Lift to watch the aircraft climb without changing pitch angle or airspeed.
                  </p>
                </div>

                {/* Control 8: Scenario Presets */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 font-mono">SCENARIO PRESETS (Cruise, Climb, Descent, Stall)</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">Dock &gt; Presets</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Instant one-click configuration of flight surface trims.
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Instantly initializes the A380 into 35,000 ft Cruise ($L=W$), full-power high-rate Climb, rapid spoiler Descent, or critical 18° Stall emergency.
                  </p>
                </div>

                {/* Control 9: Global Waypoint Jumps */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 font-mono">GLOBAL WAYPOINT JUMPS</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">Routes Tab</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Relocates the aircraft across international flight corridors (JFK, LHR, HND, DXB, SYD, SIN).
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Repositions coordinate latitude/longitude over Earth curvature and resets local ground reference.
                  </p>
                </div>

                {/* Control 10: Time Scale (Pause, 1x, 2x, 5x) */}
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400 font-mono">SIMULATION TIME SCALE</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300">Top HUD</span>
                  </div>
                  <p className="text-slate-300">
                    <strong>Action:</strong> Pauses physics ($dt=0$) or accelerates time integration ($2\times$ or $5\times$).
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <strong>Flight Dynamic:</strong> Enables rapid long-distance transoceanic flights over Earth curvature or freeze-frame inspection of aerodynamic force vectors.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: KEYBOARD & GESTURES */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-cyan-400" />
                Flight Deck Keyboard & Mouse Controls Cheat Sheet
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-cyan-400 font-bold block text-sm border-b border-slate-800 pb-2">
                    Primary Flight Controls
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Pitch Down (-0.25°)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">W / ↓</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Pitch Up (+0.25°)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">S / ↑</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bank Left (-5°)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">A</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bank Right (+5°)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">D</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Throttle Up (+5%)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">Shift</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Throttle Down (-5%)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">Ctrl</kbd>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-emerald-400 font-bold block text-sm border-b border-slate-800 pb-2">
                    Avionics & Simulation Functions
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Autopilot Level Hold</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Zero-Gravity Toggle (0G / 1G)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">G</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Cycle Flaps (0, 0.5, 1.0)</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">F</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Toggle Spoilers / Speedbrakes</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">B</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Toggle 3D Force Vectors</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">V</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Open Persistent Flight Log</span>
                    <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-white font-bold">L</kbd>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3 md:col-span-2">
                  <span className="text-amber-400 font-bold block text-sm border-b border-slate-800 pb-2">
                    Canvas & Camera Navigation
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-white font-bold block mb-1">Mouse Scroll Wheel</span>
                      <p className="text-slate-400 font-sans text-xs">
                        Zooms smoothly from 1:1 metric superjumbo detail (0.05 m/px) out to whole planetary orbit (100,000 km altitude).
                      </p>
                    </div>
                    <div>
                      <span className="text-white font-bold block mb-1">Click & Drag</span>
                      <p className="text-slate-400 font-sans text-xs">
                        Pans the 2D viewport across the Earth's curvature. Center reticle snaps back with the "1:1 A380 Reticle" button.
                      </p>
                    </div>
                    <div>
                      <span className="text-white font-bold block mb-1">Hover Scope Loupe</span>
                      <p className="text-slate-400 font-sans text-xs">
                        Hovering over the aircraft reveals a high-magnification 1:1 metric inspection loupe showing wingtip fences, engine pods, and cabin decks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BACKGROUND CALCULATIONS & MATH SPECIFICATION */}
          {activeTab === 'calculations' && (
            <div className="space-y-6">
              {/* Header Banner with Document Reference */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/80 rounded-2xl border border-cyan-800/60 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                      Background Flight Physics Engine • Mathematical Specification
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Every frame executes a 60 Hz numerical integration loop that resolves 6-DOF aerodynamic forces, barometric air density, turbofan thrust lapse, and spherical Earth geodesics.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    docs/FLIGHT_SIMULATOR_MATHEMATICAL_SPECIFICATION.md
                  </span>
                </div>
              </div>

              {/* Fundamental Physical Constants */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">1.</span> FUNDAMENTAL PHYSICAL CONSTANTS (MKS UNITS)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Earth Mean Radius (R_E)</span>
                    <span className="text-cyan-300 font-bold">6,371,000 m</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">IUGG Volumetric Mean</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Standard Gravity (g₀)</span>
                    <span className="text-cyan-300 font-bold">9.80665 m/s²</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">1.0G Surface Field</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Sea-Level Density (ρ₀)</span>
                    <span className="text-cyan-300 font-bold">1.225 kg/m³</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">ISA 15°C, 1013.25 hPa</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Atmospheric Scale Height (H)</span>
                    <span className="text-cyan-300 font-bold">8,500 m</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">e-Folding Height</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Boeing A380 Wing Area (S)</span>
                    <span className="text-emerald-300 font-bold">845.0 m²</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">Supercritical Planform</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Mid-Cruise Mass (m₀)</span>
                    <span className="text-emerald-300 font-bold">380,000 kg</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">380 Metric Tonnes</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Total 4-Engine TOGA Thrust</span>
                    <span className="text-emerald-300 font-bold">1,250.0 kN</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">4x Trent 900 / GP7200</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">500 km Segment Arc</span>
                    <span className="text-amber-300 font-bold">500,000 m</span>
                    <span className="text-slate-500 block text-[9px] mt-0.5">Δθ ≈ 4.4966° (80 Segments)</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Atmosphere & Dynamic Pressure */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">2.</span> BAROMETRIC ATMOSPHERIC DENSITY & DYNAMIC PRESSURE
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono space-y-1.5">
                    <span className="text-cyan-400 font-bold block text-[11px]">Barometric Density Law</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200 text-xs">
                      ρ(h) = ρ₀ · exp(-max(0, h) / H)
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Air density decreases exponentially with altitude. At standard cruise altitude of 10,600 m, air density drops to approximately <strong>0.352 kg/m³</strong> (28.7% of sea level).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono space-y-1.5">
                    <span className="text-cyan-400 font-bold block text-[11px]">Dynamic Pressure (q)</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200 text-xs">
                      q = 0.5 · ρ(h) · v²  [N/m² or Pa]
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Directly measures the kinetic energy per unit volume of moving air. Drives all aerodynamic forces: Lift and Drag are directly proportional to q.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Powerplant & Turbofan Thrust Lapse */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">3.</span> QUAD-TURBOFAN ENGINE THRUST & ALTITUDE LAPSE
                </h4>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded text-slate-200">
                    T = max(0, T_max · throttle · max(0.02, ρ / ρ₀)^0.55 + T_trim)  [kN]
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans text-[11px] text-slate-300">
                    <div>
                      <strong className="text-emerald-400 block font-mono">Throttle Setting:</strong>
                      Pilot throttle variable between 0.0 (Idle) and 1.0 (TOGA Max).
                    </div>
                    <div>
                      <strong className="text-emerald-400 block font-mono">Altitude Lapse (σ^0.55):</strong>
                      Thinner air reduces mass airflow entering the turbofan compressors.
                    </div>
                    <div>
                      <strong className="text-emerald-400 block font-mono">Cruise Equilibrium:</strong>
                      At 38% throttle at 10,600 m, Thrust generates 235 kN, precisely matching total drag.
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Aerodynamic Angles & Force Polar */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">4.</span> AERODYNAMIC ANGLES, COEFFICIENTS & DRAG POLAR
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-cyan-300 font-bold block text-[11px]">Angle of Attack (α) & Flight Path (γ)</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      γ = arctan(V_z / max(v, 1)) · (180 / π) [deg]
                      <br />
                      α = pitch - γ [deg]
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Angle of attack represents the angle between the wing chord and the relative wind vector. Critical stall threshold is set at <strong>α = 15.5°</strong> or airspeed &lt; 62 m/s.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-cyan-300 font-bold block text-[11px]">Lift Coefficient (C_L)</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      Clean / Normal: C_L = 0.25 + 0.09 · α + 0.70 · flaps
                      <br />
                      Stall: C_L = max(0.15, 1.645 · 0.45) ≈ 0.74
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Flaps add camber (+0.70 C_L at full 35° extension). Exceeding 15.5° causes boundary layer separation and catastrophic lift collapse.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 md:col-span-2">
                    <span className="text-red-300 font-bold block text-[11px]">Parabolic Drag Polar (C_D)</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      C_D = 0.022 + (0.045 · C_L²) + (0.035 · flaps) + (0.050 · spoilers) + stallPenalty
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 font-sans text-[11px] text-slate-300">
                      <div><strong className="text-red-400 font-mono">C_D0 = 0.022:</strong> Parasite skin friction & profile drag.</div>
                      <div><strong className="text-red-400 font-mono">k = 0.045:</strong> Induced drag factor from wing vortex creation.</div>
                      <div><strong className="text-red-400 font-mono">Spoilers (+0.05):</strong> Quadruples drag to brake aircraft.</div>
                      <div><strong className="text-red-400 font-mono">Stall (+0.14):</strong> Extreme form drag from separated turbulent wake.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: The Four Forces in Equilibrium */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">5.</span> THE FOUR FORCES CALCULATIONS (KILONEWTONS)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/50">
                    <div className="text-emerald-400 font-bold mb-1">THRUST (T) = 235 kN [Cruise]</div>
                    <div className="text-slate-300">T = T_base + T_trim</div>
                    <div className="text-slate-400 text-[11px] mt-1 font-sans">Propels aircraft forward along longitudinal axis.</div>
                  </div>

                  <div className="p-3 bg-red-950/30 rounded-xl border border-red-800/50">
                    <div className="text-red-400 font-bold mb-1">DRAG (D) = 235 kN [Cruise]</div>
                    <div className="text-slate-300">D = max(D_min, (q · S · C_D) / 1000 + D_trim)</div>
                    <div className="text-slate-400 text-[11px] mt-1 font-sans">Total air resistance. When T = D, acceleration is zero.</div>
                  </div>

                  <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/50">
                    <div className="text-cyan-400 font-bold mb-1">LIFT (L) = 3,726 kN [Cruise]</div>
                    <div className="text-slate-300">L = max(0, (q · S · C_L) / 1000 + L_trim)</div>
                    <div className="text-slate-400 text-[11px] mt-1 font-sans">Generated by wings. In steady level cruise, L exactly balances Weight.</div>
                  </div>

                  <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-800/50">
                    <div className="text-indigo-400 font-bold mb-1">WEIGHT (W) = 3,726 kN [1.0G] / 0 kN [0-G]</div>
                    <div className="text-slate-300">W = (m_effective · g) / 1000</div>
                    <div className="text-slate-400 text-[11px] mt-1 font-sans">m = 380,000 kg. In Zero-G mode, g = 0 m/s² making W = 0 kN!</div>
                  </div>
                </div>
              </div>

              {/* Section 6: Equations of Motion & Numerical Integration */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">6.</span> 60 HZ SEMI-IMPLICIT EQUATIONS OF MOTION
                </h4>
                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-cyan-400 font-bold block text-[11px]">Longitudinal Forward Acceleration</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      F_forward = (T - D) · 1000 - W_Newton · sin(pitch_rad / 2) [N]
                      <br />
                      a_forward = F_forward / m_effective [m/s²]
                      <br />
                      v(t + Δt) = max(0, v(t) + a_forward · Δt_sim)
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-emerald-400 font-bold block text-[11px]">Vertical Acceleration & Aerodynamic Heave Damping</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      F_vertical = (L · cos(pitch_rad) - W) · 1000 [N]
                      <br />
                      a_vertical = (F_vertical / m_effective) + a_centrifugal - a_stallDrop [m/s²]
                      <br />
                      V_z_intermediate = V_z(t) + a_vertical · Δt_sim
                      <br />
                      ζ_heave = min(2.0, (0.5 · ρ · S · 3.5 · max(v, 20)) / m_effective) [s⁻¹]
                      <br />
                      V_z(t + Δt) = V_z_intermediate · exp(-ζ_heave · Δt_sim)
                      <br />
                      altitude(t + Δt) = max(0, altitude(t) + V_z · Δt_sim)
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7: Wind, Airspeed vs Ground Speed, and Hover Demo */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">7.</span> WIND DYNAMICS & GROUND SPEED
                </h4>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono space-y-2 text-xs">
                  <div className="p-2 bg-slate-950 rounded text-slate-200">
                    V_TAS_horizontal = v · cos(pitch_rad) [m/s]
                    <br />
                    V_ground = V_TAS_horizontal - V_headwind [m/s]
                    <br />
                    GroundSpeed_kmh = round(V_ground · 3.6)
                    <br />
                    GroundSpeed_kts = round(V_ground · 1.94384)
                  </div>
                  <div className="p-2 bg-amber-950/40 rounded border border-amber-800/60 text-amber-200 text-[11px] font-sans">
                    <strong>Hover Equilibrium Condition:</strong> When Headwind equals True Airspeed (V_headwind = V_TAS_horizontal), Ground Speed becomes exactly <strong>0 km/h (0 kts)</strong>. The Boeing A380 remains suspended in mid-air over a fixed Earth point while generating full 3,726 kN lift!
                  </div>
                </div>
              </div>

              {/* Section 8: Spherical Great Circle Geodesics & Curvature Drop */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">8.</span> SPHERICAL EARTH CURVATURE & 500 KM CONVERGING RADIAL SPOKES
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-cyan-300 font-bold block text-[11px]">Earth Horizon Drop Formula</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      Δy_drop(x) = R_E - sqrt(R_E² - x²) ≈ x² / (2 · R_E)
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Drop is 7.85 cm at 1 km, 784.8 m at 100 km, and 19.66 km at 500 km.
                      <br />
                      Line-of-Sight horizon distance at 10,600 m: <strong>d = sqrt(2 · R_E · h + h²) ≈ 367.7 km</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-amber-300 font-bold block text-[11px]">500 km Radial Spokes Convergence</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      Δθ_segment = 500,000 / 6,371,000 ≈ 0.0784806 rad (4.4966°)
                      <br />
                      Ray: (X_core, Y_core) ➔ (X_surface, Y_surface)
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Every radial spoke originates from the physical center of planet Earth at (X_core, Y_core) and terminates at the crust, ensuring true geometrical convergence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 9: Earth Curvature Micro-Adjustments & FBW Geoid Tracking */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <span className="text-cyan-400">9.</span> EARTH CURVATURE MICRO-ADJUSTMENTS & FLY-BY-WIRE GEOID TRACKING
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-cyan-300 font-bold block text-[11px]">Curvature Pitch-Down Angular Velocity (ω)</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      ω = v_ground / (R_E + altitude) [rad/s]
                      <br />
                      ω_deg/s = -(ω · 180 / π) ≈ -0.00220°/s
                      <br />
                      ω_deg/hr = ω_deg/s · 3600 ≈ -7.92°/hour
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      Because gravity continuously rotates towards Earth's planetary core, the local horizontal rotates. The Boeing A380 Fly-By-Wire system applies continuous micro pitch-down corrections of -0.0022°/s so the velocity vector remains parallel to the spherical geoid.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-amber-300 font-bold block text-[11px]">Tangent Horizon Drop & Elevator Micro-Trim</span>
                    <div className="p-2 bg-slate-950 rounded text-slate-200">
                      Drop_rate = (v_ground · 60)² / (2 · (R_E + h)) ≈ 17.3 m/min
                      <br />
                      δ_elevator = δ_curvature + δ_damping + δ_oscillation
                      <br />
                      Nominal Trim: -0.08° (±0.03° FBW servo cycle)
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      If an airliner flew in a straight Euclidean line without curvature micro-trimming, Earth's surface would drop away at <strong>17.3 m/min</strong> (over 1,000 meters in 8 minutes!). You can toggle <strong>Tangent Drift Mode</strong> in the cockpit monitor to observe this physical effect firsthand!
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/90 text-xs">
          <span className="text-slate-400">
            AeroForces Flight Dynamics Engine • Boeing A380 Quad-Jet Edition
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow"
          >
            Ready to Fly
          </button>
        </div>

      </div>
    </div>
  );
};
