import React from 'react';

interface A380AltimeterProps {
  altitudeM: number;       // Altitude in meters
  verticalSpeedMps: number;// Vertical speed in m/s
  targetAltitudeFt?: number; // FCU Selected altitude in feet (e.g. 35,000 or 7,000)
  qnh?: number;            // QNH in hPa (default 1013 or 1027)
  className?: string;
  height?: number;         // Overall height of tape in px (default 168)
}

/**
 * Authentic Airbus A380 Primary Flight Display (PFD) Altimeter & VSI Instrument
 * Faithfully styled after the genuine Airbus A380 PFD:
 * - Slate-blue moving altitude tape with chevron >020- major markers and 100ft ticks
 * - Target altitude in cyan at the top (with shelf line)
 * - Center yellow-bordered altitude readout box with rolling drum / tumbler
 * - Yellow horizon reference index tabs
 * - Ground reference red ribbon at low altitudes
 * - Adjacent Airbus A380 Vertical Speed Indicator (VSI) with beveled gauge
 * - Lime green dynamic VSI needle and digital readout box (e.g. "14" for +1400 fpm)
 * - Barometric setting readout (e.g. QNH 1027 / 1013) and metric altitude display
 */
export const A380Altimeter: React.FC<A380AltimeterProps> = ({
  altitudeM,
  verticalSpeedMps,
  targetAltitudeFt = 35000,
  qnh = 1013,
  className = '',
  height = 176,
}) => {
  // Conversions
  const altitudeFt = Math.max(0, Math.round(altitudeM * 3.28084));
  const verticalSpeedFpm = Math.round(verticalSpeedMps * 196.85);

  // Tape geometry: 100 ft = 18 px (so 1 ft = 0.18 px)
  const pxPerFoot = 0.18;
  const centerY = height / 2;
  const tapeWidth = 68;
  const vsiWidth = 38;

  // Visible altitude range on tape
  const rangeFt = Math.ceil((height / 2) / pxPerFoot) + 100;
  const minAlt = Math.max(0, Math.floor((altitudeFt - rangeFt) / 100) * 100);
  const maxAlt = Math.ceil((altitudeFt + rangeFt) / 100) * 100;

  // Generate tick marks
  const ticks = [];
  for (let alt = minAlt; alt <= maxAlt; alt += 100) {
    const dy = (alt - altitudeFt) * pxPerFoot;
    const y = centerY - dy;
    if (y >= -15 && y <= height + 15) {
      const isMajor = alt % 500 === 0;
      // Airbus format: altitude in hundreds (e.g. 20 for 2,000ft, 15 for 1,500ft, 350 for 35,000ft)
      const label = isMajor ? Math.floor(alt / 100).toString().padStart(alt < 10000 ? 3 : 3, '0') : '';
      ticks.push({ alt, y, isMajor, label });
    }
  }

  // Tumbler / rolling drum calculations for tens and units
  // Hundreds and thousands:
  const hundredsAndThousands = Math.floor(altitudeFt / 100);
  const remainder = altitudeFt % 100; // 0 to 99
  // Step in 20ft increments: 00, 20, 40, 60, 80
  const drumStep = 20;
  const drumIndex = Math.floor(remainder / drumStep);
  const drumFraction = (remainder % drumStep) / drumStep; // 0 to 1 smooth transition
  const baseTens = drumIndex * drumStep;
  const nextTens = (baseTens + drumStep) % 100;
  const prevTens = (baseTens - drumStep + 100) % 100;

  // VSI Non-Linear needle position calculation:
  // Airbus A380 VSI scale: 0 at center, ±1 (1000 fpm), ±2 (2000 fpm), ±6 (6000 fpm)
  const getVsiY = (fpm: number) => {
    const sign = fpm >= 0 ? 1 : -1;
    const absFpm = Math.abs(fpm);
    const maxHalfH = height * 0.44;

    let norm = 0;
    if (absFpm <= 1000) {
      norm = (absFpm / 1000) * 0.42;
    } else if (absFpm <= 2000) {
      norm = 0.42 + ((absFpm - 1000) / 1000) * 0.28;
    } else {
      norm = 0.70 + (Math.min(6000, absFpm - 2000) / 4000) * 0.30;
    }

    return centerY - sign * norm * maxHalfH;
  };

  const needleY = getVsiY(verticalSpeedFpm);
  const isVsiActive = Math.abs(verticalSpeedFpm) >= 200;
  const vsiBadgeValue = Math.round(Math.abs(verticalSpeedFpm) / 100);

  // Red ribbon for ground elevation
  const groundY = centerY + (altitudeFt * pxPerFoot);

  return (
    <div className={`flex flex-col items-center bg-slate-950/95 border border-slate-800/90 rounded-xl p-1.5 backdrop-blur-md shadow-2xl select-none ${className}`}>
      {/* Top Header: Airbus A380 FCU Target Altitude (Cyan) */}
      <div className="flex items-center justify-between w-full px-1 pb-1 mb-1 border-b border-slate-800/60 font-mono text-[9px]">
        <span className="text-slate-400 font-semibold tracking-wider">ALT / VSI</span>
        <div className="flex items-center gap-1">
          <span className="text-cyan-400 font-bold text-[10px] tracking-tight">
            {targetAltitudeFt.toLocaleString()}
          </span>
          <span className="text-[8px] text-cyan-500/80">FT</span>
        </div>
      </div>

      {/* Main Dual Tape Container (Altitude Tape + VSI Gauge) */}
      <div 
        className="relative flex items-center justify-center bg-black/90 rounded-lg overflow-hidden border border-slate-800"
        style={{ width: tapeWidth + vsiWidth + 4, height }}
      >
        {/* ========================================================= */}
        {/* LEFT COLUMN: THE AIRBUS A380 ALTITUDE TAPE */}
        {/* ========================================================= */}
        <div 
          className="relative h-full bg-[#384252] overflow-hidden border-r border-slate-900"
          style={{ width: tapeWidth }}
        >
          {/* Ground Reference Red Ribbon (Extends up when approaching ground) */}
          {groundY < height + 50 && (
            <div 
              className="absolute left-0 bottom-0 w-3 bg-red-600 border-r border-red-400 z-10 transition-all duration-75"
              style={{
                top: Math.max(0, groundY),
                height: Math.max(0, height - groundY),
              }}
              title="Ground Elevation / Terrain Reference"
            />
          )}

          {/* Target Altitude Bug (Cyan Bracket when in range) */}
          {targetAltitudeFt && (
            (() => {
              const targetY = centerY - (targetAltitudeFt - altitudeFt) * pxPerFoot;
              if (targetY >= 0 && targetY <= height) {
                return (
                  <div 
                    className="absolute right-0 w-4 h-3 border-t-2 border-b-2 border-r-2 border-cyan-400 z-20 pointer-events-none"
                    style={{ top: targetY - 6 }}
                  />
                );
              }
              return null;
            })()
          )}

          {/* Scale Tick Marks and Chevron Labels */}
          {ticks.map((t) => (
            <div
              key={t.alt}
              className="absolute right-0 flex items-center pointer-events-none transition-transform duration-75"
              style={{
                top: `${t.y}px`,
                transform: 'translateY(-50%)',
              }}
            >
              {t.isMajor && t.label && (
                <div className="flex items-center text-[10.5px] font-mono font-bold text-slate-100 tracking-tighter mr-0.5">
                  <span className="text-slate-300 font-extrabold text-[9px] mr-[1px]">&gt;</span>
                  <span>{t.label}</span>
                </div>
              )}
              {/* Tick line */}
              <div 
                className={`bg-white ${t.isMajor ? 'w-3 h-[1.5px]' : 'w-1.5 h-[1px] bg-slate-300'}`}
              />
            </div>
          ))}

          {/* Top Edge Target Altitude Shelf indicator */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-20 flex items-center justify-end pr-1">
            <span className="text-[8.5px] font-mono font-bold text-cyan-400 tracking-tight">
              {targetAltitudeFt >= 10000 ? `${targetAltitudeFt}` : `0${targetAltitudeFt}`}
            </span>
          </div>

          {/* Bottom Edge Gradient Shadow */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20" />
        </div>

        {/* ========================================================= */}
        {/* CENTER AIRBUS YELLOW HORIZON WINGS & CURRENT ALTITUDE BOX */}
        {/* ========================================================= */}
        {/* Extended Left Yellow Horizon Reference Wing Bar */}
        <div 
          className="absolute left-[-2px] w-2.5 h-[3px] bg-yellow-400 z-30 pointer-events-none shadow-sm"
          style={{ top: centerY - 1.5 }}
        />

        {/* Central Yellow Altitude Readout Window */}
        <div 
          className="absolute z-30 pointer-events-none flex items-center bg-black border-[2px] border-yellow-400 shadow-2xl rounded-[3px] px-1 py-0.5"
          style={{
            left: 2,
            top: centerY,
            transform: 'translateY(-50%)',
            height: 30,
            width: tapeWidth - 2,
          }}
        >
          {/* Thousands & Hundreds in Airbus Lime Green */}
          <div className="flex-1 flex justify-end items-center pr-1 text-[#22c55e] font-mono font-black text-sm tracking-tighter drop-shadow-[0_0_3px_rgba(34,197,94,0.6)]">
            {hundredsAndThousands}
          </div>

          {/* Rolling Drum / Tumbler Window for Tens & Units (Green in slot) */}
          <div className="relative w-5 h-6 bg-[#0a1017] border border-[#22c55e]/50 rounded-[2px] overflow-hidden flex flex-col justify-center items-center">
            {/* Smooth Rolling Digits Container */}
            <div 
              className="absolute flex flex-col items-center transition-transform duration-75"
              style={{
                transform: `translateY(${-drumFraction * 14}px)`,
              }}
            >
              {/* Next upcoming number */}
              <div className="h-[14px] flex items-center justify-center text-[10px] font-mono font-bold text-[#22c55e]/60">
                {nextTens.toString().padStart(2, '0')}
              </div>
              {/* Current number */}
              <div className="h-[14px] flex items-center justify-center text-[11px] font-mono font-black text-[#22c55e] drop-shadow-[0_0_2px_rgba(34,197,94,0.8)]">
                {baseTens.toString().padStart(2, '0')}
              </div>
              {/* Previous number */}
              <div className="h-[14px] flex items-center justify-center text-[10px] font-mono font-bold text-[#22c55e]/60">
                {prevTens.toString().padStart(2, '0')}
              </div>
            </div>

            {/* Tumbler Glass Reflection Highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none" />
          </div>
        </div>

        {/* Center Yellow Horizon Reference Line connecting Tape to VSI */}
        <div 
          className="absolute z-30 pointer-events-none bg-yellow-400 h-[2.5px]"
          style={{
            left: tapeWidth - 1,
            top: centerY - 1.25,
            width: 7,
          }}
        />

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AIRBUS A380 VERTICAL SPEED INDICATOR (VSI) */}
        {/* ========================================================= */}
        <div 
          className="relative h-full bg-[#1e2530] overflow-hidden border-l border-slate-900"
          style={{ 
            width: vsiWidth,
            clipPath: 'polygon(0% 0%, 82% 0%, 100% 8%, 100% 92%, 82% 100%, 0% 100%)',
          }}
        >
          {/* VSI Scale Markings matching genuine A380 PFD (6, 2, 1, 0, 1, 2, 6) */}
          <div className="absolute inset-0 pointer-events-none font-mono text-slate-200 text-[8px] font-bold">
            {/* +6,000 fpm */}
            <div className="absolute right-1.5 flex items-center gap-1" style={{ top: centerY - height * 0.44 - 4 }}>
              <span className="text-slate-400">6</span>
              <div className="w-1.5 h-[1.5px] bg-slate-200" />
            </div>

            {/* +2,000 fpm */}
            <div className="absolute right-1.5 flex items-center gap-1" style={{ top: centerY - height * 0.31 - 4 }}>
              <span className="text-slate-300">2</span>
              <div className="w-2 h-[1.5px] bg-slate-200" />
            </div>

            {/* +1,000 fpm */}
            <div className="absolute right-1.5 flex items-center gap-1" style={{ top: centerY - height * 0.18 - 4 }}>
              <span className="text-slate-200">1</span>
              <div className="w-2.5 h-[1.5px] bg-white" />
            </div>

            {/* Intermediate Dots for 200, 400, 600, 800 fpm */}
            <div className="absolute right-2 w-1 h-1 rounded-full bg-slate-400" style={{ top: centerY - height * 0.09 }} />

            {/* Zero Index (Aligned with yellow horizon line) */}
            <div className="absolute right-1.5 w-3 h-[2px] bg-white" style={{ top: centerY - 1 }} />

            {/* Negative Intermediate Dot */}
            <div className="absolute right-2 w-1 h-1 rounded-full bg-slate-400" style={{ top: centerY + height * 0.09 }} />

            {/* -1,000 fpm */}
            <div className="absolute right-1.5 flex items-center gap-1" style={{ top: centerY + height * 0.18 - 4 }}>
              <span className="text-slate-200">1</span>
              <div className="w-2.5 h-[1.5px] bg-white" />
            </div>

            {/* -2,000 fpm */}
            <div className="absolute right-1.5 flex items-center gap-1" style={{ top: centerY + height * 0.31 - 4 }}>
              <span className="text-slate-300">2</span>
              <div className="w-2 h-[1.5px] bg-slate-200" />
            </div>

            {/* -6,000 fpm */}
            <div className="absolute right-1.5 flex items-center gap-1" style={{ top: centerY + height * 0.44 - 4 }}>
              <span className="text-slate-400">6</span>
              <div className="w-1.5 h-[1.5px] bg-slate-200" />
            </div>
          </div>

          {/* Dynamic Lime Green VSI Needle SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
            <line
              x1="0"
              y1={centerY}
              x2={vsiWidth - 6}
              y2={needleY}
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </svg>

          {/* Genuine Airbus Green Digital Box Badge (e.g. "14" for +1400 fpm) */}
          {isVsiActive && (
            <div 
              className="absolute right-0.5 z-30 bg-[#22c55e] text-slate-950 font-mono font-black text-[9px] px-1 py-0.2 rounded-sm shadow-md transition-all duration-75 pointer-events-none"
              style={{
                top: Math.max(2, Math.min(height - 14, needleY - 6)),
              }}
              title={`Vertical Speed: ${verticalSpeedFpm > 0 ? `+${verticalSpeedFpm}` : verticalSpeedFpm} FPM`}
            >
              {vsiBadgeValue}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Barometric Setting (QNH) & Metric Altitude */}
      <div className="flex items-center justify-between w-full px-1 pt-1 mt-1 border-t border-slate-800/60 font-mono text-[9px]">
        <div className="flex items-center gap-1">
          <span className="text-slate-400">QNH</span>
          <span className="text-cyan-400 font-bold tracking-tight">{qnh}</span>
        </div>
        <div className="text-slate-300 font-semibold tracking-tight">
          {Math.round(altitudeM).toLocaleString()} <span className="text-[8px] text-slate-400">M</span>
        </div>
      </div>
    </div>
  );
};
