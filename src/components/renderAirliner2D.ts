import { FlightState } from '../types/flight';

export interface AirlinerRenderOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  scale: number; // Pixels per meter (ppm)
  flightState: FlightState;
  strobeTimer?: number;
  isLoupe?: boolean;
}

/**
 * Renders an aeronautical-grade, photorealistic 2D Boeing A380 Superjumbo
 * (Double-Deck Quad-Jet Heavy Commercial Airliner) to exact 1:1 metric scale.
 *
 * Physical Boeing A380 Aircraft Dimensions:
 * - Total Length: 72.72 meters (Nose radome tip at +24.2m, APU tailcone at -48.5m)
 * - Double-Deck Fuselage: 8.41m total height, 7.14m width (Crown at -4.2m, Keel at +4.2m)
 * - Full Upper Passenger Deck and Full Main Passenger Deck (Dual window rows)
 * - Intermediate-Level Cockpit between upper and lower deck
 * - Vertical Tailfin Height: 24.09 meters from belly keel (Fin tip at -19.89m)
 * - Quad-Engine Powerplant: 4x Rolls-Royce Trent 900 / GP7200 turbofans
 *   (Two visible nacelles in side profile: Inboard at +6.5m and Outboard at -3.5m)
 * - Wingtip Fences: Iconic double-pointed A380 arrowhead fences
 *
 * 100% strict scale invariance: (0,0) is center of gravity.
 * 1 real-world meter = `scale` pixels on screen.
 */
export function drawRealisticAirliner({
  ctx,
  x,
  y,
  scale: m,
  flightState: st,
  strobeTimer,
  isLoupe = false,
}: AirlinerRenderOptions) {
  const pitchRad = (st.pitch * Math.PI) / 180;
  const planePixelLength = 72.7 * m;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-pitchRad); // Counter-clockwise for nose-up pitch

  // In global overview when zoomed out to sub-pixel scale (< 2.8px),
  // render an exact physical length micro-silhouette to respect strict 1:1 scale.
  if (planePixelLength < 2.8 && !isLoupe) {
    ctx.fillStyle = '#f8fafc';
    const subL = Math.max(1.2, planePixelLength);
    ctx.fillRect(-subL * 0.65, -0.8, subL, 1.6);
    ctx.restore();
    return;
  }

  // Exact physical metric landmarks for Boeing A380 (in meters)
  const NOSE_M = 24.2;
  const TAIL_M = -48.5;
  const R_TOP_M = 4.2; // Crown height above centerline: 4.2m
  const R_BOT_M = 4.2; // Keel depth below centerline: 4.2m
  const FIN_TOP_M = -19.89; // Top of massive A380 vertical stabilizer (24.1m total tail height)

  // Scaled pixel coordinates
  const noseX = NOSE_M * m;
  const tailX = TAIL_M * m;
  const rTop = R_TOP_M * m;
  const rBot = R_BOT_M * m;
  const finTopY = FIN_TOP_M * m;

  // =========================================================================
  // 1. HORIZONTAL STABILIZER & ARTICULATED ELEVATOR (Drawn behind tail)
  // A380 trimmable horizontal stabilizer (THS) span is 30.4m
  // =========================================================================
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tailX + 16.0 * m, -0.6 * m);
  ctx.lineTo(tailX + 1.8 * m, -3.8 * m);  // Stabilizer tip leading edge
  ctx.lineTo(tailX - 1.2 * m, -3.0 * m);  // Stabilizer tip trailing edge
  ctx.lineTo(tailX + 8.5 * m, 1.2 * m);   // Root trailing edge
  ctx.closePath();

  // Dual-tone titanium alloy gradient
  const hStabGrad = ctx.createLinearGradient(0, -4.0 * m, 0, 1.5 * m);
  hStabGrad.addColorStop(0, '#e2e8f0');
  hStabGrad.addColorStop(0.5, '#cbd5e1');
  hStabGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = hStabGrad;
  ctx.fill();

  // Animated Elevator Surface (deflects with pitch trim)
  if (planePixelLength > 35) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(0.7, 0.1 * m);
    ctx.beginPath();
    ctx.moveTo(tailX + 10.5 * m, 0.4 * m);
    ctx.lineTo(tailX + 1.8 * m, -3.1 * m);
    ctx.stroke();

    const elevDeflection = (st.pitch - 1.5) * 0.05;
    ctx.beginPath();
    ctx.moveTo(tailX + 10.5 * m, 0.4 * m);
    ctx.lineTo(tailX - 1.2 * m, (-3.0 + elevDeflection * 14) * m);
    ctx.strokeStyle = '#475569';
    ctx.stroke();
  }
  ctx.restore();

  // =========================================================================
  // 2. MASSIVE A380 VERTICAL STABILIZER & DUAL-HINGE RUDDER
  // Towering 24.1m tailfin with deep dorsal fairing
  // =========================================================================
  ctx.save();
  ctx.beginPath();
  // Dorsal fairing blend into upper double-deck fuselage crown
  ctx.moveTo(tailX + 33.0 * m, -rTop);
  ctx.bezierCurveTo(
    tailX + 24.0 * m, -rTop * 1.15,
    tailX + 16.0 * m, -8.5 * m,
    tailX + 9.5 * m, finTopY * 0.65
  );
  // Swept leading edge to fin tip
  ctx.lineTo(tailX + 3.8 * m, finTopY);
  // Aerodynamic fin tip cap with HF antenna fairing
  ctx.lineTo(tailX - 2.8 * m, finTopY);
  // Trailing edge down through double-hinge rudder to APU tailcone
  ctx.lineTo(tailX + 2.2 * m, 0.2 * m);
  ctx.closePath();

  // Deep Blue Aviation Livery Gradient
  const finGrad = ctx.createLinearGradient(0, finTopY, 0, -rTop);
  finGrad.addColorStop(0, '#0284c7');    // Sky blue tip
  finGrad.addColorStop(0.35, '#0369a1'); // Airline navy mid
  finGrad.addColorStop(0.75, '#075985'); // Deep navy
  finGrad.addColorStop(1, '#0c4a6e');    // Base fuselage root
  ctx.fillStyle = finGrad;
  ctx.fill();

  if (planePixelLength > 30) {
    // Leading Edge Titanium Erosion Shield
    ctx.beginPath();
    ctx.moveTo(tailX + 9.5 * m, finTopY * 0.65);
    ctx.lineTo(tailX + 3.8 * m, finTopY);
    ctx.lineTo(tailX + 2.2 * m, finTopY);
    ctx.lineTo(tailX + 7.4 * m, finTopY * 0.65);
    ctx.closePath();
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    // Rudder Hinge Split Line (A380 dual-segment high-authority rudder)
    ctx.beginPath();
    ctx.moveTo(tailX - 1.2 * m, finTopY + 2.5 * m);
    ctx.lineTo(tailX + 1.6 * m, -rTop * 0.85);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.lineWidth = Math.max(0.7, 0.12 * m);
    ctx.stroke();

    // "A380" Superjumbo Tail Emblem / Decal
    if (planePixelLength > 55) {
      ctx.save();
      ctx.font = `bold ${Math.max(7, 3.2 * m)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('A380', tailX + 5.5 * m, finTopY * 0.52);

      // Tail Logo Swoop Line
      ctx.beginPath();
      ctx.moveTo(tailX + 6.0 * m, finTopY + 5.5 * m);
      ctx.bezierCurveTo(
        tailX + 14.0 * m, finTopY + 9.5 * m,
        tailX + 4.0 * m, finTopY + 14.0 * m,
        tailX - 1.0 * m, finTopY + 15.5 * m
      );
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = Math.max(1.0, 0.5 * m);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();

  // =========================================================================
  // 3. FULL DOUBLE-DECK FUSELAGE (Iconic A380 Oval / Double-Decker Hull)
  // Height: 8.41m (Crown at -4.2m, Keel at +4.2m), Length: 72.7m
  // =========================================================================
  ctx.save();
  ctx.beginPath();
  // Nose Radome Tip (at +24.2m)
  ctx.moveTo(noseX, 0.2 * m);
  // Nose bottom contour to main deck keel
  ctx.bezierCurveTo(
    noseX - 3.2 * m, rBot * 0.55,
    noseX - 7.5 * m, rBot * 0.95,
    noseX - 12.0 * m, rBot
  );
  // Lower keel to wing-body belly fairing
  ctx.lineTo(10.5 * m, rBot);
  // Enormous A380 Wing-Body Fairing (Kevlar composite pod holding main gear)
  ctx.bezierCurveTo(
    5.5 * m, rBot * 1.32,
    -14.5 * m, rBot * 1.32,
    -21.0 * m, rBot
  );
  // Lower keel to aft tailcone upsweep
  ctx.lineTo(tailX + 22.0 * m, rBot);
  // Tailcone upsweep to APU exhaust orifice
  ctx.bezierCurveTo(
    tailX + 11.5 * m, rBot * 0.82,
    tailX + 3.5 * m, 0.4 * m,
    tailX, -0.5 * m
  );
  // APU exhaust nozzle face
  ctx.lineTo(tailX, -1.6 * m);
  // Upper fuselage spine from tail forward (tapers from upper deck)
  ctx.bezierCurveTo(
    tailX + 7.5 * m, -rTop * 0.92,
    tailX + 18.0 * m, -rTop,
    tailX + 30.0 * m, -rTop
  );
  // Full-length straight upper deck crown
  ctx.lineTo(noseX - 14.5 * m, -rTop);
  // Characteristic A380 forehead droop down past intermediate cockpit to nose radome
  ctx.bezierCurveTo(
    noseX - 9.5 * m, -rTop * 0.98,
    noseX - 4.2 * m, -rTop * 0.45,
    noseX, 0.2 * m
  );
  ctx.closePath();

  // Photorealistic Pearl White & Metallic Airline Livery
  const fuseGrad = ctx.createLinearGradient(0, -rTop, 0, rBot * 1.32);
  fuseGrad.addColorStop(0, '#ffffff');    // Top crown sunlight specular
  fuseGrad.addColorStop(0.32, '#f8fafc'); // Upper deck clean pearl white
  fuseGrad.addColorStop(0.55, '#f1f5f9'); // Intermediate floor belt
  fuseGrad.addColorStop(0.68, '#e2e8f0'); // Main deck lower shoulder
  fuseGrad.addColorStop(0.72, '#0284c7'); // Livery cheatline
  fuseGrad.addColorStop(0.90, '#0369a1'); // Airline blue underbelly
  fuseGrad.addColorStop(1, '#075985');    // Keel shadow
  ctx.fillStyle = fuseGrad;
  ctx.fill();

  if (planePixelLength > 25) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = Math.max(0.6, 0.08 * m);
    ctx.stroke();
  }

  // =========================================================================
  // 4. BOEING A380 SUPERJUMBO BRANDING / TITLES
  // =========================================================================
  if (planePixelLength > 70) {
    ctx.save();
    ctx.font = `bold ${Math.max(7, 1.9 * m)}px sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText('BOEING A380', noseX - 22.0 * m, -rTop * 0.72);
    ctx.font = `${Math.max(5, 1.0 * m)}px sans-serif`;
    ctx.fillStyle = '#0284c7';
    ctx.fillText('SUPERJUMBO • DOUBLE DECK', noseX - 22.0 * m, -rTop * 0.48);
    ctx.restore();
  }

  // =========================================================================
  // 5. APU EXHAUST NOZZLE CORE (Titanium Alloy Heat-Treated)
  // =========================================================================
  if (planePixelLength > 30) {
    ctx.beginPath();
    ctx.moveTo(tailX, -0.5 * m);
    ctx.lineTo(tailX - 0.9 * m, -0.65 * m);
    ctx.lineTo(tailX - 0.9 * m, -1.45 * m);
    ctx.lineTo(tailX, -1.6 * m);
    ctx.closePath();
    ctx.fillStyle = '#334155';
    ctx.fill();
  }

  // =========================================================================
  // 6. NOSE RADOME SEAM & PITOT STATIC SENSORS
  // =========================================================================
  if (planePixelLength > 45) {
    ctx.beginPath();
    ctx.arc(noseX - 4.8 * m, 0.2 * m, rBot * 0.78, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
    ctx.lineWidth = Math.max(0.6, 0.08 * m);
    ctx.stroke();

    // Dual Heated Pitot static probes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(0.8, 0.12 * m);
    ctx.beginPath();
    ctx.moveTo(noseX - 7.2 * m, -0.8 * m);
    ctx.lineTo(noseX - 6.0 * m, -0.8 * m);
    ctx.moveTo(noseX - 8.2 * m, 0.8 * m);
    ctx.lineTo(noseX - 7.0 * m, 0.8 * m);
    ctx.stroke();
  }

  // =========================================================================
  // 7. COCKPIT WINDSCREEN (Intermediate Deck Level - Unique A380 Design)
  // Positioned lower than the upper deck, giving the A380 its signature forehead
  // =========================================================================
  if (planePixelLength > 28) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(noseX - 11.8 * m, -rTop * 0.52);
    ctx.lineTo(noseX - 6.8 * m, -0.15 * m); // Front pillar
    ctx.lineTo(noseX - 7.6 * m, 0.35 * m);  // Brow slope
    ctx.lineTo(noseX - 13.0 * m, -0.05 * m);// Rear pillar
    ctx.closePath();

    const glassGrad = ctx.createLinearGradient(0, -rTop * 0.6, 0, 0.4 * m);
    glassGrad.addColorStop(0, '#020617');
    glassGrad.addColorStop(0.5, '#0f172a');
    glassGrad.addColorStop(0.85, '#0369a1');
    glassGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = glassGrad;
    ctx.fill();

    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = Math.max(0.7, 0.12 * m);
    ctx.stroke();

    // Center pillar
    ctx.beginPath();
    ctx.moveTo(noseX - 9.2 * m, -rTop * 0.32);
    ctx.lineTo(noseX - 10.1 * m, 0.18 * m);
    ctx.stroke();
    ctx.restore();
  }

  // =========================================================================
  // 8. DUAL-ROW PASSENGER WINDOWS (Upper Deck & Main Deck)
  // The unmistakable signature of the A380: TWO FULL ROWS OF CABIN WINDOWS!
  // =========================================================================
  if (planePixelLength > 40) {
    ctx.save();
    const winW = 0.85 * m;
    const winH = 1.15 * m;

    // A. UPPER DECK WINDOW ROW (Top floor cabin)
    const upperWinY = -2.5 * m;
    for (let wx = tailX + 22.0 * m; wx < noseX - 14.0 * m; wx += 2.05 * m) {
      // Omit windows at Upper Deck emergency exit doors
      if (Math.abs(wx - (noseX - 15.5 * m)) < 1.4 * m ||
          Math.abs(wx - (-3.0 * m)) < 1.4 * m ||
          Math.abs(wx - (-25.0 * m)) < 1.4 * m) {
        continue;
      }
      ctx.beginPath();
      ctx.roundRect(wx, upperWinY, winW, winH, [0.3 * m]);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)'; // Soft upper deck sky reflection
      ctx.fillRect(wx + 0.12 * m, upperWinY + 0.15 * m, winW * 0.65, winH * 0.55);
    }

    // B. MAIN DECK WINDOW ROW (Lower floor cabin)
    const mainWinY = 1.1 * m;
    for (let wx = tailX + 20.0 * m; wx < noseX - 13.0 * m; wx += 2.05 * m) {
      // Omit windows at Main Deck passenger doors (1L, 2L, 3L, 4L, 5L)
      if (Math.abs(wx - (noseX - 14.5 * m)) < 1.4 * m ||
          Math.abs(wx - 2.5 * m) < 1.4 * m ||
          Math.abs(wx - (-17.5 * m)) < 1.4 * m ||
          Math.abs(wx - (tailX + 24.5 * m)) < 1.4 * m) {
        continue;
      }
      ctx.beginPath();
      ctx.roundRect(wx, mainWinY, winW, winH, [0.3 * m]);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.fillStyle = 'rgba(254, 240, 138, 0.75)'; // Warm main deck passenger cabin glow
      ctx.fillRect(wx + 0.12 * m, mainWinY + 0.15 * m, winW * 0.65, winH * 0.55);
    }
    ctx.restore();
  }

  // =========================================================================
  // 9. DUAL-DECK PASSENGER & SERVICE DOORS (Main Deck & Upper Deck)
  // =========================================================================
  if (planePixelLength > 65) {
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.65)';
    ctx.lineWidth = Math.max(0.6, 0.1 * m);

    // Main Deck doors
    const mainDoors = [noseX - 14.5 * m, 2.5 * m, -17.5 * m, tailX + 24.5 * m];
    mainDoors.forEach((dx) => {
      ctx.beginPath();
      ctx.roundRect(dx - 0.75 * m, 0.3 * m, 1.5 * m, 2.8 * m, [0.35 * m]);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(dx - 0.3 * m, 0.8 * m, 0.6 * m, 0.8 * m, [0.18 * m]);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    });

    // Upper Deck doors
    const upperDoors = [noseX - 15.5 * m, -3.0 * m, -25.0 * m];
    upperDoors.forEach((dx) => {
      ctx.beginPath();
      ctx.roundRect(dx - 0.7 * m, -3.4 * m, 1.4 * m, 2.5 * m, [0.3 * m]);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(dx - 0.28 * m, -2.8 * m, 0.56 * m, 0.75 * m, [0.18 * m]);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    });
    ctx.restore();
  }
  ctx.restore(); // Restore main fuselage block

  // =========================================================================
  // 10. MASSIVE A380 SWEPT WINGS & DOUBLE-ARROW WINGTIP FENCE
  // 845 m^2 wing area, 79.8m wingspan
  // =========================================================================
  ctx.save();
  ctx.beginPath();
  // Wing Root Leading Edge (blended into massive belly fairing)
  ctx.moveTo(9.5 * m, rBot * 0.5);
  // Swept leading edge to wingtip
  ctx.lineTo(-8.5 * m, (rBot + 6.8) * m);

  // A380 Iconic Double-Pointed Wingtip Fence (Arrows up and down!)
  ctx.lineTo(-9.8 * m, (rBot + 4.8) * m);   // Upper fence point
  ctx.lineTo(-12.8 * m, (rBot + 7.2) * m);  // Fence center notch
  ctx.lineTo(-11.5 * m, (rBot + 9.5) * m);  // Lower fence point
  ctx.lineTo(-14.2 * m, (rBot + 6.5) * m);  // Trailing fence edge

  // Wing trailing edge back to root
  ctx.lineTo(-18.5 * m, rBot * 0.95);
  ctx.closePath();

  const wingGrad = ctx.createLinearGradient(0, 0, 0, (rBot + 7) * m);
  wingGrad.addColorStop(0, '#e2e8f0');
  wingGrad.addColorStop(0.7, '#cbd5e1');
  wingGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = wingGrad;
  ctx.fill();

  if (planePixelLength > 30) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = Math.max(0.6, 0.08 * m);
    ctx.stroke();

    // Wingtip Fence Sky Blue Livery & Starboard Green Nav Light
    ctx.beginPath();
    ctx.arc(-11.5 * m, (rBot + 7.0) * m, Math.max(1.8, 0.35 * m), 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
  }

  // Multi-Panel Flight Spoilers
  if (st.spoilers > 0.04 && planePixelLength > 30) {
    ctx.save();
    const spoilerAngle = -st.spoilers * 0.65;
    ctx.translate(-5.5 * m, (rBot + 1.8) * m);
    ctx.rotate(spoilerAngle);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, -0.7 * m, 7.5 * m, 0.55 * m);
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = Math.max(0.6, 0.08 * m);
    ctx.strokeRect(0, -0.7 * m, 7.5 * m, 0.55 * m);
    ctx.restore();
  }

  // Double-Slotted Heavy Fowler Flaps
  if (st.flaps > 0 && planePixelLength > 30) {
    ctx.save();
    const flapAngle = st.flaps * 0.55;
    ctx.translate(-14.5 * m, (rBot + 1.8) * m);
    ctx.rotate(flapAngle);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-5.5 * m, 0, 7.0 * m, 1.4 * m, [0.35 * m]);
    ctx.fill();
    ctx.strokeStyle = '#0369a1';
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore(); // Restore wing

  // =========================================================================
  // 11. QUAD-ENGINE TURBOFAN POWERPLANT (2 Nacelles Visible in Side Profile)
  // Rolls-Royce Trent 900 / Engine Alliance GP7200 High-Bypass Turbofans
  // =========================================================================

  // Helper function to render a Trent 900 turbofan nacelle with pylon and exhaust
  const drawTrent900Engine = (engCenterX: number, engCenterY: number, pylonAttachY: number, isOutboard: boolean) => {
    ctx.save();
    const cowlHalfL = 3.6 * m;
    const cowlR = 1.85 * m;

    // A. Titanium Pylon Strut
    ctx.beginPath();
    ctx.moveTo(engCenterX + 1.6 * m, engCenterY - cowlR);
    ctx.lineTo(engCenterX - 2.8 * m, engCenterY - cowlR);
    ctx.lineTo(engCenterX - 4.8 * m, pylonAttachY);
    ctx.lineTo(engCenterX + 0.4 * m, pylonAttachY);
    ctx.closePath();
    ctx.fillStyle = '#64748b';
    ctx.fill();

    // B. Nacelle Outer Cowling (Aerodynamic barrel with aft chevrons)
    ctx.beginPath();
    ctx.moveTo(engCenterX + cowlHalfL - 0.5 * m, engCenterY - cowlR);
    ctx.lineTo(engCenterX - cowlHalfL + 0.8 * m, engCenterY - cowlR * 0.95);
    ctx.lineTo(engCenterX - cowlHalfL, engCenterY);
    ctx.lineTo(engCenterX - cowlHalfL + 0.8 * m, engCenterY + cowlR * 0.95);
    ctx.lineTo(engCenterX + cowlHalfL - 0.5 * m, engCenterY + cowlR);
    ctx.bezierCurveTo(
      engCenterX + cowlHalfL + 0.4 * m, engCenterY + cowlR,
      engCenterX + cowlHalfL + 0.4 * m, engCenterY - cowlR,
      engCenterX + cowlHalfL - 0.5 * m, engCenterY - cowlR
    );
    ctx.closePath();

    const cowlGrad = ctx.createLinearGradient(0, engCenterY - cowlR, 0, engCenterY + cowlR);
    cowlGrad.addColorStop(0, '#f8fafc');
    cowlGrad.addColorStop(0.5, '#e2e8f0');
    cowlGrad.addColorStop(0.85, '#94a3b8');
    cowlGrad.addColorStop(1, '#475569');
    ctx.fillStyle = cowlGrad;
    ctx.fill();

    if (planePixelLength > 30) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = Math.max(0.6, 0.08 * m);
      ctx.stroke();

      // Mirror Chrome Titanium Intake Lip
      ctx.beginPath();
      ctx.ellipse(
        engCenterX + cowlHalfL - 0.3 * m,
        engCenterY,
        0.65 * m,
        cowlR * 0.98,
        0,
        0,
        Math.PI * 2
      );
      const lipGrad = ctx.createLinearGradient(0, engCenterY - cowlR, 0, engCenterY + cowlR);
      lipGrad.addColorStop(0, '#ffffff');
      lipGrad.addColorStop(0.3, '#94a3b8');
      lipGrad.addColorStop(0.7, '#cbd5e1');
      lipGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = lipGrad;
      ctx.fill();

      // Deep Black Intake Shadow & Spinner
      ctx.beginPath();
      ctx.ellipse(
        engCenterX + cowlHalfL - 0.6 * m,
        engCenterY,
        0.35 * m,
        cowlR * 0.88,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = '#020617';
      ctx.fill();

      // Titanium Spinner Cone with Spiral Swirl
      ctx.beginPath();
      ctx.moveTo(engCenterX + cowlHalfL - 0.3 * m, engCenterY);
      ctx.lineTo(engCenterX + cowlHalfL - 1.2 * m, engCenterY - 0.45 * m);
      ctx.lineTo(engCenterX + cowlHalfL - 1.2 * m, engCenterY + 0.45 * m);
      ctx.closePath();
      ctx.fillStyle = '#334155';
      ctx.fill();

      // Spiral swirl
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(0.7, 0.1 * m);
      ctx.beginPath();
      ctx.arc(
        engCenterX + cowlHalfL - 0.7 * m,
        engCenterY,
        0.25 * m,
        0,
        Math.PI * 1.5
      );
      ctx.stroke();

      // Primary Exhaust Core Spike
      ctx.beginPath();
      ctx.moveTo(engCenterX - cowlHalfL + 0.2 * m, engCenterY - cowlR * 0.55);
      ctx.lineTo(engCenterX - cowlHalfL - 1.8 * m, engCenterY);
      ctx.lineTo(engCenterX - cowlHalfL + 0.2 * m, engCenterY + cowlR * 0.55);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
    }

    // Photorealistic Turbofan Exhaust Plume (Core Heat Glow)
    if (st.throttle > 0.08 && planePixelLength > 20) {
      ctx.save();
      const exhaustLen = (2.8 + st.throttle * 7.5) * m;
      const exhaustGrad = ctx.createLinearGradient(
        engCenterX - cowlHalfL,
        engCenterY,
        engCenterX - cowlHalfL - exhaustLen,
        engCenterY
      );
      exhaustGrad.addColorStop(0, `rgba(255, 237, 213, ${0.45 + st.throttle * 0.5})`);
      exhaustGrad.addColorStop(0.35, `rgba(249, 115, 22, ${0.25 + st.throttle * 0.35})`);
      exhaustGrad.addColorStop(0.7, `rgba(56, 189, 248, ${0.12 + st.throttle * 0.15})`);
      exhaustGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.beginPath();
      ctx.ellipse(
        engCenterX - cowlHalfL - exhaustLen * 0.45,
        engCenterY,
        exhaustLen * 0.55,
        cowlR * 0.65,
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = exhaustGrad;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  // ENGINE 1 (Outboard Turbofan - further forward along swept wing)
  drawTrent900Engine(-3.5 * m, (rBot + 6.8) * m, (rBot + 3.8) * m, true);

  // ENGINE 2 (Inboard Turbofan - primary near engine)
  drawTrent900Engine(6.5 * m, (rBot + 5.2) * m, (rBot + 1.2) * m, false);

  ctx.restore(); // Restore root translation and pitch
}
