import { Waypoint } from '../types/flight';

// Exact Earth Volumetric Radius (MKS Units)
const R_EARTH = 6371000; // 6,371,000 meters
const TWO_PI = Math.PI * 2;

export interface EarthFeaturesRenderOptions {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  basePlaneScreenX: number;
  groundY: number;
  ppm: number; // Pixels per meter (THE exact scale factor: 1 meter = ppm pixels)
  planeLonDeg: number;
  planeLatDeg: number;
  waypoints: Waypoint[];
  animTimer: number; // Seconds elapsed for smooth rotations and strobes
}

/**
 * Deterministic pseudo-random number generator for coordinate-anchored features.
 * Returns a float in [0, 1).
 */
function hashCoord(seed: number): number {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return s - Math.floor(s);
}

/**
 * Renders physical ground features on the Earth to 100% exact metric scale.
 * 1 physical meter = ppm pixels on screen.
 * Features curve mathematically with Earth's radius and scroll smoothly under
 * the aircraft as it flies forward.
 */
export function drawEarthFeatures({
  ctx,
  w,
  h,
  basePlaneScreenX,
  groundY,
  ppm,
  planeLonDeg,
  animTimer,
}: EarthFeaturesRenderOptions) {
  // If zoomed out so far that 100 meters is less than 0.005 pixels, skip micro-features
  if (ppm < 0.0001) return;

  // Viewport visible range in physical world meters relative to aircraft position
  // Feature world offset xM = (screenX - basePlaneScreenX) / ppm
  const minWorldXM = (-150 - basePlaneScreenX) / ppm;
  const maxWorldXM = (w + 150 - basePlaneScreenX) / ppm;

  // Arc distance from Prime Meridian in meters:
  const planeArcDistM = (planeLonDeg * Math.PI / 180) * R_EARTH;

  ctx.save();

  // =========================================================================
  // 1. AGRICULTURAL PARCELS & GROUND BIOMES (Exact 800-meter parcels)
  // Visible at ppm > 0.002 (atmosphere and closer zooms)
  // =========================================================================
  if (ppm > 0.002) {
    const parcelM = 800; // Each parcel is 800 meters across
    const firstParcel = Math.floor((planeArcDistM + minWorldXM) / parcelM);
    const lastParcel = Math.ceil((planeArcDistM + maxWorldXM) / parcelM);

    for (let p = firstParcel; p <= lastParcel; p++) {
      const pStartWorldM = p * parcelM - planeArcDistM;
      const pEndWorldM = (p + 1) * parcelM - planeArcDistM;

      const sx1 = basePlaneScreenX + pStartWorldM * ppm;
      const sx2 = basePlaneScreenX + pEndWorldM * ppm;

      if (sx2 < -20 || sx1 > w + 20) continue;

      // Earth drop from tangent: dropM = x^2 / (2 * R)
      const dropM1 = (pStartWorldM * pStartWorldM) / (2 * R_EARTH);
      const dropM2 = (pEndWorldM * pEndWorldM) / (2 * R_EARTH);
      const sy1 = groundY + dropM1 * ppm;
      const sy2 = groundY + dropM2 * ppm;

      if (Math.min(sy1, sy2) > h + 50) continue;

      const parcelSeed = p * 0.173 + 42.1;
      const h1 = hashCoord(parcelSeed);

      // Biome palette (natural Earth colors)
      let fieldColor = '#1e6f5c'; // Default meadow
      if (h1 < 0.22) {
        fieldColor = '#15803d'; // Lush clover / emerald crop
      } else if (h1 < 0.44) {
        fieldColor = '#854d0e'; // Ripe amber wheat
      } else if (h1 < 0.64) {
        fieldColor = '#3f2e1e'; // Rich plowed loam / soil
      } else if (h1 < 0.82) {
        fieldColor = '#a16207'; // Golden barley
      } else {
        fieldColor = '#14532d'; // Pine / oak woodland
      }

      // Draw parcel ground band (top 45 meters of crust to exact scale)
      const bandHeightM = Math.max(25, 45);
      const bandHeightPx = Math.max(1.8, bandHeightM * ppm);

      ctx.fillStyle = fieldColor;
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.lineTo(sx2, sy2);
      ctx.lineTo(sx2, sy2 + bandHeightPx);
      ctx.lineTo(sx1, sy1 + bandHeightPx);
      ctx.closePath();
      ctx.fill();

      // Parcel boundary hedge / tree line (when ppm > 0.15)
      if (ppm > 0.15) {
        const treeCount = Math.min(12, Math.floor(parcelM / 80));
        ctx.fillStyle = '#14532d';
        for (let t = 0; t < treeCount; t++) {
          const tRelM = pStartWorldM + (t / treeCount) * parcelM;
          const tx = basePlaneScreenX + tRelM * ppm;
          const tDropM = (tRelM * tRelM) / (2 * R_EARTH);
          const ty = groundY + tDropM * ppm;

          const treeHM = 12 + hashCoord(p * 11 + t) * 6; // 12m to 18m tall trees
          const treeWM = 7 + hashCoord(p * 13 + t) * 4;  // 7m to 11m canopy width

          const treeHPx = treeHM * ppm;
          const treeWPx = treeWM * ppm;

          if (treeHPx >= 2 && tx > -20 && tx < w + 20) {
            // Foliage cone / dome
            ctx.beginPath();
            ctx.arc(tx, ty - treeHPx * 0.6, treeWPx * 0.5, 0, TWO_PI);
            ctx.fill();
            // Trunk
            ctx.fillStyle = '#292524';
            ctx.fillRect(tx - Math.max(0.7, 0.6 * ppm), ty - treeHPx * 0.35, Math.max(1.2, 1.2 * ppm), treeHPx * 0.35);
            ctx.fillStyle = '#14532d';
          }
        }
      }
    }
  }

  // =========================================================================
  // 2. RIVERS & SUSPENSION BRIDGES (Every 24,000 meters)
  // =========================================================================
  {
    const riverIntervalM = 24000;
    const firstRiver = Math.floor((planeArcDistM + minWorldXM) / riverIntervalM);
    const lastRiver = Math.ceil((planeArcDistM + maxWorldXM) / riverIntervalM);

    for (let r = firstRiver; r <= lastRiver; r++) {
      const riverCenterWorldM = r * riverIntervalM + 4200 - planeArcDistM;
      const rx = basePlaneScreenX + riverCenterWorldM * ppm;
      if (rx < -150 || rx > w + 150) continue;

      const rDropM = (riverCenterWorldM * riverCenterWorldM) / (2 * R_EARTH);
      const ry = groundY + rDropM * ppm;
      if (ry > h + 80) continue;

      const riverWidthM = 240; // 240 meters wide river
      const riverWidthPx = riverWidthM * ppm;

      // River Water Channel
      ctx.fillStyle = '#0284c7';
      const rLeftX = rx - riverWidthPx * 0.5;
      const rRightX = rx + riverWidthPx * 0.5;
      const riverDepthPx = Math.max(2, 18 * ppm);
      ctx.fillRect(rLeftX, ry, riverWidthPx, riverDepthPx);

      // Specular river sheen
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.fillRect(rLeftX + riverWidthPx * 0.2, ry + 1, riverWidthPx * 0.6, Math.max(1, 2 * ppm));

      // Suspension Bridge across River (when ppm > 0.01)
      if (ppm > 0.01) {
        const deckHeightM = 16; // 16m clearance above water
        const towerHeightM = 65; // 65m tall bridge towers
        const deckY = ry - deckHeightM * ppm;
        const towerTopY = ry - towerHeightM * ppm;

        // Bridge Deck
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = Math.max(1.5, 3.5 * ppm);
        ctx.beginPath();
        ctx.moveTo(rLeftX - 30 * ppm, deckY);
        ctx.lineTo(rRightX + 30 * ppm, deckY);
        ctx.stroke();

        // Twin Towers (spaced at 25% and 75% of river span)
        const t1X = rLeftX + riverWidthPx * 0.28;
        const t2X = rLeftX + riverWidthPx * 0.72;

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = Math.max(1.2, 4.0 * ppm);
        ctx.beginPath();
        ctx.moveTo(t1X, ry);
        ctx.lineTo(t1X, towerTopY);
        ctx.moveTo(t2X, ry);
        ctx.lineTo(t2X, towerTopY);
        ctx.stroke();

        // Suspension Cable Arc
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = Math.max(0.8, 1.5 * ppm);
        ctx.beginPath();
        ctx.moveTo(rLeftX - 25 * ppm, deckY);
        ctx.lineTo(t1X, towerTopY);
        ctx.quadraticCurveTo(rx, deckY - 4 * ppm, t2X, towerTopY);
        ctx.lineTo(rRightX + 25 * ppm, deckY);
        ctx.stroke();
      }
    }
  }

  // =========================================================================
  // 3. WIND TURBINE FARMS (Every 30,000 meters)
  // Rotating 3-blade aerodynamic turbines to exact physical dimensions
  // =========================================================================
  {
    const farmIntervalM = 30000;
    const firstFarm = Math.floor((planeArcDistM + minWorldXM) / farmIntervalM);
    const lastFarm = Math.ceil((planeArcDistM + maxWorldXM) / farmIntervalM);

    for (let f = firstFarm; f <= lastFarm; f++) {
      const farmStartM = f * farmIntervalM + 9000 - planeArcDistM;
      const numTurbines = 5;
      const turbineSpacingM = 380; // 380m between turbines

      for (let t = 0; t < numTurbines; t++) {
        const turbRelM = farmStartM + t * turbineSpacingM;
        const tx = basePlaneScreenX + turbRelM * ppm;
        if (tx < -80 || tx > w + 80) continue;

        const tDropM = (turbRelM * turbRelM) / (2 * R_EARTH);
        const ty = groundY + tDropM * ppm;
        if (ty > h + 100) continue;

        // Exact Physical Dimensions
        const towerHM = 105; // 105 meters hub height
        const bladeRadiusM = 52; // 52 meters blade length
        const towerHPx = towerHM * ppm;
        const bladeRPx = bladeRadiusM * ppm;

        if (towerHPx < 1.5) continue; // Sub-pixel, skip

        const hubY = ty - towerHPx;

        // Tapered White Steel Tower
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = Math.max(1.2, 4.5 * ppm);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx, hubY);
        ctx.stroke();

        // Nacelle Hub
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(tx, hubY, Math.max(1.5, 3.5 * ppm), 0, TWO_PI);
        ctx.fill();

        // Red Obstruction Light (blinking once per second)
        const isBlinking = (Math.floor(animTimer * 1.5) % 2) === 0;
        if (isBlinking) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(tx, hubY - Math.max(1.5, 2.5 * ppm), Math.max(1.2, 1.8 * ppm), 0, TWO_PI);
          ctx.fill();
        }

        // Rotating Aerodynamic 3-Blade Rotor
        if (bladeRPx >= 2) {
          const rotationAngle = (animTimer * 1.4 + t * 0.8) % TWO_PI;
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = Math.max(1.0, 2.2 * ppm);

          for (let b = 0; b < 3; b++) {
            const angle = rotationAngle + (b * TWO_PI) / 3;
            const tipX = tx + Math.cos(angle) * bladeRPx;
            const tipY = hubY + Math.sin(angle) * bladeRPx;

            ctx.beginPath();
            ctx.moveTo(tx, hubY);
            ctx.lineTo(tipX, tipY);
            ctx.stroke();
          }
        }
      }
    }
  }

  // =========================================================================
  // 4. TELECOMMUNICATION / RADIO TRANSMISSION MAST (Every 38,000 meters)
  // 240m tall lattice mast with guy wires and xenon obstruction strobes
  // =========================================================================
  {
    const towerIntervalM = 38000;
    const firstTower = Math.floor((planeArcDistM + minWorldXM) / towerIntervalM);
    const lastTower = Math.ceil((planeArcDistM + maxWorldXM) / towerIntervalM);

    for (let tw = firstTower; tw <= lastTower; tw++) {
      const twRelM = tw * towerIntervalM + 16500 - planeArcDistM;
      const tx = basePlaneScreenX + twRelM * ppm;
      if (tx < -80 || tx > w + 80) continue;

      const twDropM = (twRelM * twRelM) / (2 * R_EARTH);
      const ty = groundY + twDropM * ppm;
      if (ty > h + 100) continue;

      const towerHM = 240; // 240 meters tall
      const towerHPx = towerHM * ppm;
      if (towerHPx < 2) continue;

      const topY = ty - towerHPx;

      // Diagonal Guy Wires (anchored 85m to left and right)
      if (ppm > 0.005) {
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
        ctx.lineWidth = 0.8;
        const anchorLeftX = tx - 85 * ppm;
        const anchorRightX = tx + 85 * ppm;

        ctx.beginPath();
        // Lower guy-wire set (at 100m)
        const midY = ty - 100 * ppm;
        ctx.moveTo(anchorLeftX, ty);
        ctx.lineTo(tx, midY);
        ctx.lineTo(anchorRightX, ty);
        // Upper guy-wire set (at 200m)
        const upperY = ty - 200 * ppm;
        ctx.moveTo(anchorLeftX, ty);
        ctx.lineTo(tx, upperY);
        ctx.lineTo(anchorRightX, ty);
        ctx.stroke();
      }

      // Alternating Red & White Lattice Mast
      const segments = 8;
      const segHPx = towerHPx / segments;
      for (let s = 0; s < segments; s++) {
        ctx.fillStyle = (s % 2 === 0) ? '#dc2626' : '#f8fafc';
        const sy = ty - (s + 1) * segHPx;
        ctx.fillRect(tx - Math.max(1.0, 1.8 * ppm), sy, Math.max(2.0, 3.6 * ppm), segHPx);
      }

      // Flashing Xenon Warning Strobe at top
      const strobeOn = (Math.floor(animTimer * 2.0) % 2) === 0;
      if (strobeOn) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(tx, topY - 2, Math.max(2, 3.5 * ppm), 0, TWO_PI);
        ctx.fill();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(tx, topY - 2, Math.max(5, 9 * ppm), 0, TWO_PI);
        ctx.fill();
      }
    }
  }

  // =========================================================================
  // 5. CITIES & URBAN METROPOLITAN SKYLINES (Every 46,000 meters)
  // Exact-scale skyscrapers and commercial districts (35m to 260m heights)
  // =========================================================================
  {
    const cityIntervalM = 46000;
    const firstCity = Math.floor((planeArcDistM + minWorldXM) / cityIntervalM);
    const lastCity = Math.ceil((planeArcDistM + maxWorldXM) / cityIntervalM);

    for (let c = firstCity; c <= lastCity; c++) {
      const cityCenterRelM = c * cityIntervalM + 25000 - planeArcDistM;
      const cx = basePlaneScreenX + cityCenterRelM * ppm;
      if (cx < -300 || cx > w + 300) continue;

      const cDropM = (cityCenterRelM * cityCenterRelM) / (2 * R_EARTH);
      const cy = groundY + cDropM * ppm;
      if (cy > h + 150) continue;

      // 14 distinct buildings spanning 4,200 meters of urban footprint
      const numBldgs = 14;
      const cityWidthM = 4200;
      const bldgSpacingM = cityWidthM / numBldgs;

      for (let b = 0; b < numBldgs; b++) {
        const bldgRelM = cityCenterRelM - cityWidthM * 0.5 + b * bldgSpacingM;
        const bx = basePlaneScreenX + bldgRelM * ppm;
        if (bx < -60 || bx > w + 60) continue;

        const bDropM = (bldgRelM * bldgRelM) / (2 * R_EARTH);
        const by = groundY + bDropM * ppm;

        const bSeed = c * 37.1 + b * 19.3;
        const bRand = hashCoord(bSeed);

        // Skyscraper height distribution: tallest in center (up to 260m)
        const distFromCenter = Math.abs(b - numBldgs / 2) / (numBldgs / 2);
        const maxH = 260 * (1 - distFromCenter * 0.7);
        const bldgHM = Math.max(28, 40 + bRand * maxH); // 28m to 260m
        const bldgWM = Math.max(35, 30 + hashCoord(bSeed + 5) * 45); // 35m to 75m wide

        const bldgHPx = bldgHM * ppm;
        const bldgWPx = bldgWM * ppm;

        if (bldgHPx < 1.5) continue;

        const topY = by - bldgHPx;

        // Skyscraper facade
        const facadeColors = ['#0f172a', '#1e293b', '#0369a1', '#334155'];
        ctx.fillStyle = facadeColors[b % facadeColors.length];
        ctx.fillRect(bx - bldgWPx * 0.5, topY, bldgWPx, bldgHPx);

        // Lit office window grid (when ppm > 0.04)
        if (ppm > 0.04 && bldgWPx > 6 && bldgHPx > 10) {
          ctx.fillStyle = 'rgba(253, 230, 138, 0.65)'; // Warm interior light
          const winCols = Math.min(6, Math.floor(bldgWPx / 6));
          const winRows = Math.min(10, Math.floor(bldgHPx / 8));
          for (let r = 0; r < winRows; r++) {
            for (let col = 0; col < winCols; col++) {
              if (hashCoord(bSeed + r * 7 + col) > 0.35) {
                const wx = bx - bldgWPx * 0.45 + (col / winCols) * bldgWPx * 0.9;
                const wy = topY + 4 + (r / winRows) * (bldgHPx - 8);
                ctx.fillRect(wx, wy, Math.max(1, 2 * ppm), Math.max(1, 2.5 * ppm));
              }
            }
          }
        }

        // Rooftop Red Aircraft Warning Light on towers taller than 60 meters
        if (bldgHM > 60) {
          const redStrobe = (Math.floor(animTimer * 1.6 + b) % 2) === 0;
          if (redStrobe) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bx, topY - 2, Math.max(1.5, 2.5 * ppm), 0, TWO_PI);
            ctx.fill();
          }
        }
      }
    }
  }

  // =========================================================================
  // 6. INTERNATIONAL AIRPORT HUBS & RUNWAYS (Exact 3,500m x 60m Runway)
  // Positioned at Prime Meridian (S = 0m, right under / ahead of initial flight)
  // and spaced at major route intervals
  // =========================================================================
  {
    const airportIntervalM = 120000; // Major aerodrome every 120 km
    const firstAirport = Math.floor((planeArcDistM + minWorldXM) / airportIntervalM);
    const lastAirport = Math.ceil((planeArcDistM + maxWorldXM) / airportIntervalM);

    for (let a = firstAirport; a <= lastAirport; a++) {
      // a = 0 is centered right near the initial takeoff/cruise corridor
      const runwayCenterWorldM = a * airportIntervalM - planeArcDistM;
      const ax = basePlaneScreenX + runwayCenterWorldM * ppm;

      if (ax < -400 || ax > w + 400) continue;

      const aDropM = (runwayCenterWorldM * runwayCenterWorldM) / (2 * R_EARTH);
      const ay = groundY + aDropM * ppm;
      if (ay > h + 100) continue;

      // Exact Metric Runway Specifications
      const runwayLengthM = 3500; // 3,500 meters long CAT III runway
      const runwayLengthPx = runwayLengthM * ppm;
      const rLeftX = ax - runwayLengthPx * 0.5;
      const rRightX = ax + runwayLengthPx * 0.5;

      // A. Runway Asphalt Surface
      ctx.fillStyle = '#0f172a'; // Deep asphalt black
      const runwayThickPx = Math.max(2, 4.0 * ppm);
      ctx.fillRect(rLeftX, ay - runwayThickPx, runwayLengthPx, runwayThickPx);

      // Concrete Shoulder Edges
      ctx.fillStyle = '#475569';
      ctx.fillRect(rLeftX, ay, runwayLengthPx, Math.max(1, 1.5 * ppm));

      // B. Runway Threshold Piano Keys (30m long stripes at runway ends)
      if (ppm > 0.005) {
        ctx.fillStyle = '#f8fafc';
        const threshLenPx = Math.max(3, 30 * ppm);
        // Left threshold
        ctx.fillRect(rLeftX, ay - runwayThickPx, threshLenPx, runwayThickPx);
        // Right threshold
        ctx.fillRect(rRightX - threshLenPx, ay - runwayThickPx, threshLenPx, runwayThickPx);
      }

      // C. Runway Centerline Dashes (30m stripes with 20m gaps)
      if (ppm > 0.015) {
        ctx.fillStyle = '#f8fafc';
        const dashLenPx = Math.max(2, 30 * ppm);
        const gapPx = Math.max(2, 20 * ppm);
        const totalStep = dashLenPx + gapPx;
        for (let dx = rLeftX + 50 * ppm; dx < rRightX - 50 * ppm; dx += totalStep) {
          ctx.fillRect(dx, ay - runwayThickPx * 0.7, dashLenPx, Math.max(1, 1.2 * ppm));
        }
      }

      // D. PAPI Precision Approach Path Indicators (Touchdown glide path lights)
      if (ppm > 0.004) {
        const papiLeftX = rLeftX + 300 * ppm;
        ctx.fillStyle = '#f59e0b'; // Amber / White approach lights
        ctx.beginPath();
        ctx.arc(papiLeftX, ay - runwayThickPx - 2, Math.max(1.5, 2.5 * ppm), 0, TWO_PI);
        ctx.fill();
      }

      // E. Air Traffic Control Tower (62 meters tall)
      const towerOffsetM = -450; // Located 450m from runway center
      const tox = ax + towerOffsetM * ppm;
      const towerHM = 62; // 62 meters tall
      const towerHPx = towerHM * ppm;

      if (towerHPx >= 2 && tox > -50 && tox < w + 50) {
        const tTopY = ay - towerHPx;

        // Tapered Concrete Shaft
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(tox - Math.max(1.5, 4 * ppm), tTopY + towerHPx * 0.25, Math.max(3, 8 * ppm), towerHPx * 0.75);

        // Glass Observation Cab
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(tox - Math.max(2.5, 7 * ppm), tTopY, Math.max(5, 14 * ppm), towerHPx * 0.25);

        // Rotating 360° Aerodrome Beacon (Green & White alternating)
        const beaconPhase = (animTimer * 1.8) % TWO_PI;
        const isGreen = beaconPhase < Math.PI;
        ctx.fillStyle = isGreen ? '#22c55e' : '#f8fafc';
        ctx.beginPath();
        ctx.arc(tox, tTopY - 2, Math.max(2, 3.5 * ppm), 0, TWO_PI);
        ctx.fill();

        // Airport Label
        if (ppm > 0.005) {
          ctx.font = '9px monospace';
          ctx.fillStyle = '#7dd3fc';
          ctx.fillText(`AIRPORT RWY 09/27 (3,500m)`, tox - 40, tTopY - 8);
        }
      }

      // F. Passenger Terminal Building (280m long, 20m high)
      const termOffsetM = 200;
      const termX = ax + termOffsetM * ppm;
      const termLenPx = Math.max(4, 280 * ppm);
      const termHPx = Math.max(2, 20 * ppm);

      if (termLenPx >= 3 && termX > -100 && termX < w + 100) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(termX, ay - termHPx, termLenPx, termHPx);
        // Glass roof clerestory
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(termX + 4, ay - termHPx - Math.max(1, 2 * ppm), termLenPx - 8, Math.max(1, 2 * ppm));
      }
    }
  }

  ctx.restore();
}
