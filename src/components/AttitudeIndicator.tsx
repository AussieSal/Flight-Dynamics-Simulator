import React from 'react';

interface AttitudeIndicatorProps {
  pitch: number; // in degrees (-30 to +30)
  roll: number;  // in degrees (-60 to +60)
  size?: number; // diameter in pixels (default 160)
}

export const AttitudeIndicator: React.FC<AttitudeIndicatorProps> = ({
  pitch,
  roll,
  size = 160,
}) => {
  // Pixels per degree of pitch
  const pxPerDeg = 2.4;
  const horizonOffsetY = pitch * pxPerDeg;

  // Roll scale tick marks at 0, +-10, +-20, +-30, +-45, +-60 degrees
  const rollTicks = [
    { deg: -60, major: true },
    { deg: -45, major: true },
    { deg: -30, major: true },
    { deg: -20, major: false },
    { deg: -10, major: false },
    { deg: 0,   major: true, triangle: true },
    { deg: 10,  major: false },
    { deg: 20,  major: false },
    { deg: 30,  major: true },
    { deg: 45,  major: true },
    { deg: 60,  major: true },
  ];

  // Pitch ladder markings (+20 to -20 degrees)
  const pitchMarks = [
    { deg: 20, width: 36, label: '20', dashed: false },
    { deg: 15, width: 20, label: '',   dashed: false },
    { deg: 10, width: 32, label: '10', dashed: false },
    { deg: 5,  width: 16, label: '',   dashed: false },
    { deg: -5, width: 16, label: '',   dashed: true },
    { deg: -10, width: 32, label: '10', dashed: true },
    { deg: -15, width: 20, label: '',   dashed: true },
    { deg: -20, width: 36, label: '20', dashed: true },
  ];

  const radius = size / 2;
  const innerRadius = radius - 8;

  return (
    <div className="flex flex-col items-center select-none">
      {/* Outer Aviation Instrument Bezel */}
      <div 
        className="relative rounded-full border-4 border-slate-700 bg-slate-950 shadow-2xl flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* Metal Bezel Screws and Texture Effect */}
        <div className="absolute inset-0 rounded-full border border-slate-600/60 pointer-events-none" />

        {/* Gyro Horizon Ball (Rotates with -Roll and Translates with Pitch) */}
        <div
          className="absolute w-[240%] h-[240%] rounded-full overflow-hidden transition-transform duration-75 ease-out"
          style={{
            transform: `rotate(${-roll}deg) translateY(${horizonOffsetY}px)`,
          }}
        >
          {/* Top Half: Aviation Sky Blue */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#0284c7] to-[#0ea5e9] flex flex-col justify-end items-center">
            {/* Upper Pitch Ladder */}
            <div className="w-full flex flex-col items-center">
              {pitchMarks.filter(m => m.deg > 0).reverse().map((mark) => (
                <div
                  key={mark.deg}
                  className="flex items-center justify-center gap-1.5"
                  style={{
                    height: `${5 * pxPerDeg}px`,
                  }}
                >
                  {mark.label && (
                    <span className="text-[9px] font-mono font-bold text-white tracking-tighter drop-shadow-sm">
                      {mark.label}
                    </span>
                  )}
                  <div
                    className="h-[2px] bg-white shadow-sm"
                    style={{ width: `${mark.width}px` }}
                  />
                  {mark.label && (
                    <span className="text-[9px] font-mono font-bold text-white tracking-tighter drop-shadow-sm">
                      {mark.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* White Horizon Reference Line */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2.5px] bg-white shadow-md z-10" />

          {/* Bottom Half: Aviation Ground Earth Brown */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#582900] to-[#78350f] flex flex-col justify-start items-center">
            {/* Lower Pitch Ladder (Dashed markings for ground) */}
            <div className="w-full flex flex-col items-center">
              {pitchMarks.filter(m => m.deg < 0).map((mark) => (
                <div
                  key={mark.deg}
                  className="flex items-center justify-center gap-1.5"
                  style={{
                    height: `${5 * pxPerDeg}px`,
                  }}
                >
                  {mark.label && (
                    <span className="text-[9px] font-mono font-bold text-white/90 tracking-tighter drop-shadow-sm">
                      {mark.label}
                    </span>
                  )}
                  <div
                    className="h-[2px] border-b-2 border-dashed border-white shadow-sm"
                    style={{ width: `${mark.width}px` }}
                  />
                  {mark.label && (
                    <span className="text-[9px] font-mono font-bold text-white/90 tracking-tighter drop-shadow-sm">
                      {mark.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Roll Pointer (White triangle attached to top of moving horizon sphere) */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ width: size, height: size }}
          >
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-white drop-shadow" />
          </div>
        </div>

        {/* Bank Angle Roll Scale Arc (Fixed along top inside bezel) */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
            {/* Bank arc tick marks */}
            {rollTicks.map((tick) => {
              const rad = (tick.deg - 90) * (Math.PI / 180);
              const rOut = innerRadius;
              const rIn = tick.major ? innerRadius - 7 : innerRadius - 4;
              const x1 = radius + Math.cos(rad) * rIn;
              const y1 = radius + Math.sin(rad) * rIn;
              const x2 = radius + Math.cos(rad) * rOut;
              const y2 = radius + Math.sin(rad) * rOut;

              return (
                <line
                  key={tick.deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ffffff"
                  strokeWidth={tick.major ? 2 : 1.2}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Zero Bank Index (Inverted Amber/Yellow Triangle at 0°) */}
            <polygon
              points={`${radius - 5},8 ${radius + 5},8 ${radius},16`}
              fill="#facc15"
              stroke="#0f172a"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        {/* Fixed Aircraft Reference Symbol (The Classic Yellow Reticle) */}
        <div className="relative z-20 pointer-events-none flex items-center justify-center">
          {/* Left Wing Bar with downturned tip */}
          <div className="relative flex items-center">
            <div className="w-8 h-[3.5px] bg-yellow-400 shadow-md border-t border-b border-yellow-200" />
            <div className="absolute right-0 bottom-[-4px] w-[3.5px] h-2 bg-yellow-400 border-r border-yellow-600" />
          </div>

          {/* Center Reference Dot */}
          <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-slate-950 shadow-md mx-2 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-slate-950" />
          </div>

          {/* Right Wing Bar with downturned tip */}
          <div className="relative flex items-center">
            <div className="absolute left-0 bottom-[-4px] w-[3.5px] h-2 bg-yellow-400 border-l border-yellow-600" />
            <div className="w-8 h-[3.5px] bg-yellow-400 shadow-md border-t border-b border-yellow-200" />
          </div>
        </div>

        {/* Glass Reflection Arc */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />

        {/* Slip / Skid Turn Inclinometer Tube at Bottom */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-2.5 bg-slate-900/90 rounded-full border border-slate-700/80 flex items-center justify-center overflow-hidden">
          {/* Centering guide lines */}
          <div className="absolute left-1/2 -translate-x-1/2 w-3 h-full border-l border-r border-white/60 pointer-events-none" />
          {/* Ball (moves slightly with roll rate or stays centered in coordinated level flight) */}
          <div 
            className="w-2 h-2 rounded-full bg-slate-200 border border-slate-900 shadow transition-transform duration-100"
            style={{
              transform: `translateX(${Math.max(-5, Math.min(5, roll * -0.15))}px)`,
            }}
          />
        </div>
      </div>

      {/* Digital Pitch & Roll Telemetry Strip */}
      <div className="flex items-center justify-between w-full mt-1.5 px-1 text-[11px] font-mono text-slate-300">
        <span className="flex items-center gap-1">
          <span className="text-slate-400">PITCH:</span>
          <span className={`font-bold ${Math.abs(pitch) > 12 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {pitch > 0 ? `+${pitch.toFixed(2)}°` : `${pitch.toFixed(2)}°`}
          </span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="flex items-center gap-1">
          <span className="text-slate-400">BANK:</span>
          <span className={`font-bold ${Math.abs(roll) > 25 ? 'text-amber-400' : 'text-cyan-400'}`}>
            {Math.abs(roll) < 0.5 ? 'LEVEL' : `${roll > 0 ? `R ${roll.toFixed(1)}°` : `L ${Math.abs(roll).toFixed(1)}°`}`}
          </span>
        </span>
      </div>
    </div>
  );
};
