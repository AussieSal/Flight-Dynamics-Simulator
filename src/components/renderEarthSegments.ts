// Exact Earth Volumetric Radius (MKS Units)
const R_EARTH = 6371000; // 6,371,000 meters
const SEGMENT_ARC_M = 500000; // Exact 500 km per segment
const DELTA_THETA_RAD = SEGMENT_ARC_M / R_EARTH; // ~0.0784806 rad ≈ 4.49661°
const NUM_SEGMENTS_TOTAL = Math.round((2 * Math.PI) / DELTA_THETA_RAD); // ~80 segments around globe

export interface EarthSegmentsOptions {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  earthCenterX: number;
  earthCenterY: number;
  earthRadiusPixels: number;
  groundY: number;
  basePlaneScreenX: number;
  basePlaneScreenY: number;
  ppm: number;
  planeLonDeg: number;
  isGlobalView: boolean;
  minSurfaceY: number;
}

/**
 * Renders exact 500 km segments across the Earth with radial spoke lines that
 * all mathematically converge directly into the Earth's physical center (earthCenterX, earthCenterY).
 *
 * Employs pure circular trigonometry (sin/cos on Earth radius) across all zoom levels
 * to guarantee 100% exact metric scale with ZERO distortion, ZERO flaring, and ZERO fanning out.
 */
export function draw500KmEarthSegments({
  ctx,
  w,
  h,
  earthCenterX,
  earthCenterY,
  earthRadiusPixels,
  groundY,
  basePlaneScreenX,
  ppm,
  planeLonDeg,
  isGlobalView,
}: EarthSegmentsOptions) {
  ctx.save();

  const radPerDeg = Math.PI / 180;
  const planeAngleRad = planeLonDeg * radPerDeg;

  // =========================================================================
  // REGIME 1: GLOBAL ORBIT VIEW
  // Entire circular Earth globe is displayed. All radial spokes converge at center.
  // =========================================================================
  if (isGlobalView) {
    // A. Draw Alternating 500 km Sector Wedges
    for (let k = 0; k < NUM_SEGMENTS_TOTAL; k++) {
      const phiStart = -Math.PI / 2 + k * DELTA_THETA_RAD - planeAngleRad;
      const phiEnd = phiStart + DELTA_THETA_RAD;

      ctx.beginPath();
      ctx.moveTo(earthCenterX, earthCenterY);
      ctx.arc(earthCenterX, earthCenterY, earthRadiusPixels, phiStart, phiEnd);
      ctx.closePath();
      // Alternating deep mantle shades to highlight the 500 km sectors
      ctx.fillStyle = k % 2 === 0 ? 'rgba(7, 54, 99, 0.40)' : 'rgba(4, 29, 59, 0.40)';
      ctx.fill();
    }

    // B. Draw Converging Radial Spokes & Surface Markers
    for (let k = 0; k < NUM_SEGMENTS_TOTAL; k++) {
      const phi = -Math.PI / 2 + k * DELTA_THETA_RAD - planeAngleRad;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const surfaceX = earthCenterX + cosPhi * earthRadiusPixels;
      const surfaceY = earthCenterY + sinPhi * earthRadiusPixels;

      // Radial spoke line: from Earth center to surface
      ctx.beginPath();
      ctx.moveTo(earthCenterX, earthCenterY);
      ctx.lineTo(surfaceX, surfaceY);
      ctx.strokeStyle = k % 2 === 0 ? 'rgba(56, 189, 248, 0.65)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Surface tick mark extending outward
      const tickLen = Math.max(4, Math.min(10, 8000 * ppm));
      ctx.beginPath();
      ctx.moveTo(surfaceX, surfaceY);
      ctx.lineTo(surfaceX + cosPhi * tickLen, surfaceY + sinPhi * tickLen);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Periodic Distance Badge (every 4th segment = 2,000 km, or when large enough)
      if (earthRadiusPixels > 90 && (k % 4 === 0 || k === 0)) {
        const distKm = k * 500;
        const badgeX = surfaceX + cosPhi * (tickLen + 5);
        const badgeY = surfaceY + sinPhi * (tickLen + 5);

        ctx.font = '8px monospace';
        ctx.fillStyle = '#bae6fd';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${distKm}k`, badgeX, badgeY);
      }
    }

    // C. Glowing Earth Core / Convergence Point
    const coreRPx = Math.max(3.5, Math.min(16, 1200000 * ppm));
    ctx.beginPath();
    ctx.arc(earthCenterX, earthCenterY, coreRPx, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center Convergence Label
    if (earthRadiusPixels > 100) {
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('CONVERGENCE CENTER', earthCenterX, earthCenterY - coreRPx - 3);
      ctx.font = '8px monospace';
      ctx.fillStyle = '#bae6fd';
      ctx.textBaseline = 'top';
      ctx.fillText('Earth Core (R = 6,371 km)', earthCenterX, earthCenterY + coreRPx + 3);
    }
  }

  // =========================================================================
  // REGIME 2: REGIONAL ARC & HORIZON VIEW
  // Earth horizon curves across the viewport; spokes pierce down to center.
  // Uses exact circular trigonometry: NO flat approximations, NO fanning out.
  // =========================================================================
  else {
    const yBot = h + 80; // Bottom boundary of Earth interior canvas

    // Determine the exact angular range visible across screen bounds [-150, w + 150]
    const clampedSinMin = Math.max(-0.95, Math.min(0.95, (-150 - earthCenterX) / earthRadiusPixels));
    const clampedSinMax = Math.max(-0.95, Math.min(0.95, (w + 150 - earthCenterX) / earthRadiusPixels));

    const thetaMin = Math.asin(clampedSinMin);
    const thetaMax = Math.asin(clampedSinMax);

    // Visible segment indices
    const firstSeg = Math.floor((thetaMin + planeAngleRad) / DELTA_THETA_RAD) - 1;
    const lastSeg = Math.ceil((thetaMax + planeAngleRad) / DELTA_THETA_RAD) + 1;

    // Helper: compute surface and spoke coordinates for segment k using pure circular geometry
    const getSegData = (segIdx: number) => {
      const deltaTheta = segIdx * DELTA_THETA_RAD - planeAngleRad;
      const sinTheta = Math.sin(deltaTheta);
      const cosTheta = Math.cos(deltaTheta);

      // Surface point strictly on circle of radius earthRadiusPixels
      const sx = earthCenterX + earthRadiusPixels * sinTheta;
      const sy = earthCenterY - earthRadiusPixels * cosTheta;

      // Convergence Line toward Earth Center (earthCenterX, earthCenterY)
      let botX = earthCenterX;
      if (earthCenterY > yBot) {
        const t = (yBot - sy) / (earthCenterY - sy);
        botX = sx + t * (earthCenterX - sx);
      }

      return { segIdx, deltaTheta, sinTheta, cosTheta, sx, sy, botX };
    };

    // A. Alternating 500 km Mantle Sectors (curved surface arc + converging spoke walls)
    for (let k = firstSeg; k < lastSeg; k++) {
      const d1 = getSegData(k);
      const d2 = getSegData(k + 1);

      if (d2.sx < -120 || d1.sx > w + 120) continue;

      // Sample curved horizon between d1.deltaTheta and d2.deltaTheta
      const subSteps = 8;
      ctx.beginPath();
      ctx.moveTo(d1.sx, Math.min(yBot, d1.sy));

      for (let s = 1; s <= subSteps; s++) {
        const th = d1.deltaTheta + (s / subSteps) * (d2.deltaTheta - d1.deltaTheta);
        const subX = earthCenterX + earthRadiusPixels * Math.sin(th);
        const subY = earthCenterY - earthRadiusPixels * Math.cos(th);
        ctx.lineTo(subX, Math.min(yBot, subY));
      }

      ctx.lineTo(d2.botX, yBot);
      ctx.lineTo(d1.botX, yBot);
      ctx.closePath();

      ctx.fillStyle = ((k % 2 + 2) % 2) === 0 ? 'rgba(7, 54, 99, 0.30)' : 'rgba(4, 29, 59, 0.30)';
      ctx.fill();

      // Mid-segment Arc Distance Label (e.g. ◄── 500 KM ──►)
      const midTheta = (d1.deltaTheta + d2.deltaTheta) * 0.5;
      const midSx = earthCenterX + earthRadiusPixels * Math.sin(midTheta);
      const midSy = earthCenterY - earthRadiusPixels * Math.cos(midTheta);
      const spanPx = Math.abs(d2.sx - d1.sx);

      if (spanPx > 90 && midSx > 50 && midSx < w - 50 && midSy < h + 20) {
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('◄── 500 KM SEGMENT ──►', midSx, midSy - 4);
      }
    }

    // B. Converging Radial Spoke Lines & Surface Beacon Markers
    for (let k = firstSeg; k <= lastSeg; k++) {
      const d = getSegData(k);

      if (d.sx < -120 || d.sx > w + 120) continue;

      // 1. Radial Spoke Line penetrating down toward the Earth core
      ctx.beginPath();
      ctx.moveTo(d.sx, d.sy);
      ctx.lineTo(d.botX, yBot);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.lineWidth = Math.max(1.2, Math.min(2.5, 200 * ppm));
      ctx.stroke();

      // Deep Mantle Convergence Label pointing down to center
      if (d.sy < yBot - 50 && d.sx > 60 && d.sx < w - 60) {
        const midT = 0.5;
        const arrowX = d.sx + midT * (d.botX - d.sx);
        const arrowY = d.sy + midT * (yBot - d.sy);
        if (arrowY < h + 30) {
          ctx.font = '8px monospace';
          ctx.fillStyle = 'rgba(186, 230, 253, 0.60)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▼ TO EARTH CENTER (6,371 km)', arrowX, arrowY);
        }
      }

      // 2. Surface Spoke Pillar & Distance Beacon
      const pillarHPx = Math.max(18, Math.min(50, 1800 * ppm));
      // Outward surface normal vector (pointing out from sphere into space)
      const normX = d.sinTheta;
      const normY = -d.cosTheta;
      const topX = d.sx + normX * pillarHPx;
      const topY = d.sy + normY * pillarHPx;

      if (topY <= h + 60 && topY >= -60) {
        // Glowing vertical pillar along surface normal
        ctx.beginPath();
        ctx.moveTo(d.sx, d.sy);
        ctx.lineTo(topX, topY);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Beacon cap dot
        ctx.beginPath();
        ctx.arc(topX, topY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        // 500 km Distance Badge (wrapped to [0, 40,000 km])
        let kmValue = ((k % NUM_SEGMENTS_TOTAL + NUM_SEGMENTS_TOTAL) % NUM_SEGMENTS_TOTAL) * 500;
        const kmText = `${kmValue.toLocaleString()} KM`;

        ctx.font = 'bold 9px monospace';
        const textMetrics = ctx.measureText(kmText);
        const badgeW = textMetrics.width + 12;
        const badgeH = 17;
        const badgeX = topX - badgeW * 0.5;
        const badgeY = topY - badgeH - 3;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.94)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(kmText, topX, badgeY + badgeH * 0.5);
      }
    }
  }

  ctx.restore();
}
