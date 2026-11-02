import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FlightState, ViewMode2D, Waypoint } from '../types/flight';
import { WORLD_WAYPOINTS } from './FlightPhysics';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Crosshair, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { drawRealisticAirliner } from './renderAirliner2D';
import { drawEarthFeatures } from './renderEarthFeatures';
import { draw500KmEarthSegments } from './renderEarthSegments';

interface FlightSimulator2DProps {
  flightState: FlightState;
  showVectors?: boolean;
  onSelectWaypoint?: (wp: Waypoint) => void;
}

// Exact Physical Constants (MKS Units)
const R_EARTH = 6371000;      // Earth volumetric mean radius: 6,371,000 meters
const PLANE_LENGTH_M = 72.7;  // Boeing A380 Superjumbo length: 72.7 meters
const PLANE_FUSELAGE_H = 8.41;// Boeing A380 double-deck fuselage height: 8.41 meters
const PLANE_FIN_HEIGHT = 24.1;// Boeing A380 vertical stabilizer height: 24.1 meters

export const FlightSimulator2D: React.FC<FlightSimulator2DProps> = ({
  flightState,
  showVectors = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Exact Physical Scale (pixels per meter)
  // Default: ~25 km vertical span (cruise altitude at ~42% of screen)
  const [pixelsPerMeter, setPixelsPerMeter] = useState<number>(0.024);
  const [viewMode, setViewMode] = useState<ViewMode2D>('atmosphere');
  const [panOffsetX, setPanOffsetX] = useState<number>(0);
  const [panOffsetY, setPanOffsetY] = useState<number>(0);
  const [followPlane, setFollowPlane] = useState<boolean>(true);
  const [showCurvatureInfo, setShowCurvatureInfo] = useState<boolean>(true);
  const [showLoupe, setShowLoupe] = useState<boolean>(true);
  const [show500KmSegments, setShow500KmSegments] = useState<boolean>(true);

  // References for 60fps render loop
  const stateRef = useRef<FlightState>(flightState);
  stateRef.current = flightState;
  const ppmRef = useRef<number>(pixelsPerMeter);
  ppmRef.current = pixelsPerMeter;
  const panXRef = useRef<number>(panOffsetX);
  panXRef.current = panOffsetX;
  const panYRef = useRef<number>(panOffsetY);
  panYRef.current = panOffsetY;
  const followRef = useRef<boolean>(followPlane);
  followRef.current = followPlane;
  const showSegmentsRef = useRef<boolean>(show500KmSegments);
  showSegmentsRef.current = show500KmSegments;
  const showVectorsRef = useRef<boolean>(showVectors);
  showVectorsRef.current = showVectors;

  // Preset Exact Physical Zoom Levels
  const setPresetZoom = useCallback((mode: ViewMode2D) => {
    setViewMode(mode);
    setFollowPlane(true);
    setPanOffsetX(0);
    setPanOffsetY(0);

    const canvas = canvasRef.current;
    const h = canvas ? canvas.clientHeight : 700;

    let targetPpm = 0.024;
    switch (mode) {
      case 'closeup': // 1:1 Aircraft Scale (~320 m field, 73m airliner is ~160px)
        targetPpm = h / 320;
        break;
      case 'atmosphere': // Atmospheric Flight Profile (~25 km vertical span to scale)
        targetPpm = h / 25000;
        break;
      case 'regional': // Curvature Horizon Arc (~200 km span, horizon drop ~780m)
        targetPpm = h / 200000;
        break;
      case 'global': // Global Earth Orbit (entire 12,742 km Earth circle in view)
        targetPpm = h / (R_EARTH * 2.25);
        break;
    }
    setPixelsPerMeter(targetPpm);
    ppmRef.current = targetPpm;
  }, []);

  // Smooth continuous wheel zoom with immediate frame sync
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Smooth proportional zoom based on actual wheel / trackpad delta
      const delta = Math.max(-60, Math.min(60, e.deltaY));
      const factor = Math.exp(-delta * 0.0022);
      setPixelsPerMeter((prev) => {
        // Continuous range: from 1:1 close-up (3.5 px/m) to global Earth orbit (0.00002 px/m)
        const next = Math.max(0.00002, Math.min(3.5, prev * factor));
        ppmRef.current = next; // Immediate sync for buttery 60fps rendering without React 1-frame lag
        return next;
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // Pointer Drag Pan
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    setPanOffsetX((prev) => prev + dx);
    setPanOffsetY((prev) => prev + dy);
    setFollowPlane(false);
  };

  const onPointerUp = () => {
    isDraggingRef.current = false;
  };

  // Main 2D Canvas Render Loop: 100% STRICT PHYSICAL SCALE
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let strobeTimer = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0 && (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr))) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = (now: number) => {
      animId = requestAnimationFrame(render);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      strobeTimer = (strobeTimer + dt) % 1.2;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Simulation parameters
      const st = stateRef.current;
      const ppm = ppmRef.current; // THE EXACT UNIFIED SCALE FACTOR (pixels per meter)
      const showVectors = showVectorsRef.current;
      const altM = Math.max(0, st.altitude);
      const pitchRad = (st.pitch * Math.PI) / 180;

      // 1. DYNAMIC ALTITUDE SKY BACKGROUND (Troposphere daylight to Orbital deep space)
      const spaceFactor = Math.min(1.0, Math.max(0, (altM - 11000) / 60000));
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (spaceFactor < 1.0) {
        // Smooth transition from tropospheric cyan/azure daylight to orbital space
        const topR = Math.round(2 + (2 - 2) * spaceFactor);
        const topG = Math.round(100 + (6 - 100) * spaceFactor);
        const topB = Math.round(160 + (23 - 160) * spaceFactor);
        const botR = Math.round(56 + (2 - 56) * spaceFactor);
        const botG = Math.round(180 + (6 - 180) * spaceFactor);
        const botB = Math.round(245 + (23 - 245) * spaceFactor);
        skyGrad.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
        skyGrad.addColorStop(1, `rgb(${botR}, ${botG}, ${botB})`);
      } else {
        skyGrad.addColorStop(0, '#020617');
        skyGrad.addColorStop(1, '#020617');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant stars fade in when climbing into high stratosphere / space (alt > 15,000m)
      if (spaceFactor > 0.1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, (spaceFactor - 0.1) * 1.2)})`;
        for (let i = 0; i < 80; i++) {
          const sx = ((i * 137.5 + 40) % w);
          const sy = ((i * 229.3 + 25) % (h * 0.75));
          ctx.fillRect(sx, sy, 1.2, 1.2);
        }
      }

      // Atmospheric Wind Streamlines (Visualizing Headwind / Tailwind velocity vectors)
      const headwindMps = st.headwind || 0;
      const headwindKts = Math.round(headwindMps * 1.94384);
      if (Math.abs(headwindMps) > 1 && ppm > 0.0003) {
        ctx.save();
        ctx.strokeStyle = headwindMps > 0 ? 'rgba(251, 191, 36, 0.22)' : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.2;
        const speedKts = Math.abs(headwindKts);
        const animSpeed = headwindMps * 25; // px/sec
        const streamCount = 14;
        for (let s = 0; s < streamCount; s++) {
          const laneY = 40 + (s * (h - 120)) / streamCount;
          const offset = (now * 0.001 * animSpeed + s * 137.5) % (w + 240);
          // Headwind blows from right to left (+headwind) against nose; Tailwind blows from left to right (-headwind)
          const sx = headwindMps > 0 ? (w + 120 - offset) : (-120 + offset);
          const len = Math.max(25, Math.min(100, speedKts * 0.7));
          ctx.beginPath();
          ctx.moveTo(sx, laneY);
          ctx.lineTo(sx + (headwindMps > 0 ? len : -len), laneY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Camera Positioning:
      // When following plane, position plane around center (slightly right of left avionics HUD)
      const basePlaneScreenX = w * 0.52 + (followRef.current ? 0 : panXRef.current);
      const basePlaneScreenY = h * 0.44 + (followRef.current ? 0 : panYRef.current);

      // 2. EXACT MATHEMATICAL EARTH SCALING
      // Absolute rule: 1 real-world meter = ppm pixels on screen!
      const earthRadiusPixels = R_EARTH * ppm;
      const distToCenterPixels = (R_EARTH + altM) * ppm;
      const earthCenterX = basePlaneScreenX;
      const earthCenterY = basePlaneScreenY + distToCenterPixels;
      const groundY = basePlaneScreenY + altM * ppm; // Screen Y of Earth surface directly under aircraft

      const atmoLayers = [
        { maxAlt: 100000, color: 'rgba(56, 189, 248, 0.04)' },
        { maxAlt: 85000,  color: 'rgba(59, 130, 246, 0.08)' },
        { maxAlt: 50000,  color: 'rgba(14, 165, 233, 0.15)' },
        { maxAlt: 20000,  color: 'rgba(34, 211, 238, 0.28)' },
        { maxAlt: 12000,  color: 'rgba(56, 189, 248, 0.45)' },
        { maxAlt: 6000,   color: 'rgba(125, 211, 252, 0.55)' },
      ];

      const planeLonDeg = st.longitude;
      const radPerDeg = Math.PI / 180;

      // 100% STRICT PHYSICAL SCALE:
      // The whole Earth sphere is rendered via full sphere circular primitives whenever
      // the globe fits comfortably within the viewport or the Earth center is on/near screen.
      // At larger scales (Regional Arc / Atmosphere / 1:1 Close-Up), exact circular geometry
      // calculates the curved horizon and concentric atmospheric limb with zero distortion.
      const isGlobalView = earthRadiusPixels < Math.max(w, h) * 1.6 || earthCenterY < h + 250;

      if (isGlobalView) {
        // ==========================================
        // REGIME 1: GLOBAL ORBIT VIEW
        // ==========================================
        // Continuous, photorealistic atmospheric halo glow around Earth sphere
        const atmoHaloR = earthRadiusPixels + 85000 * ppm;
        const atmoGrad = ctx.createRadialGradient(
          earthCenterX,
          earthCenterY,
          Math.max(0, earthRadiusPixels - 5000 * ppm),
          earthCenterX,
          earthCenterY,
          atmoHaloR
        );
        atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
        atmoGrad.addColorStop(0.25, 'rgba(56, 189, 248, 0.45)');
        atmoGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.2)');
        atmoGrad.addColorStop(0.85, 'rgba(34, 211, 238, 0.08)');
        atmoGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, atmoHaloR, 0, Math.PI * 2);
        ctx.fillStyle = atmoGrad;
        ctx.fill();

        // Earth globe sphere
        ctx.save();
        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, earthRadiusPixels, 0, Math.PI * 2);
        const earthGrad = ctx.createRadialGradient(
          earthCenterX,
          earthCenterY,
          Math.max(0, earthRadiusPixels - 120000 * ppm),
          earthCenterX,
          earthCenterY,
          earthRadiusPixels
        );
        earthGrad.addColorStop(0, '#041d3b');
        earthGrad.addColorStop(0.7, '#073663');
        earthGrad.addColorStop(0.96, '#0b4d82');
        earthGrad.addColorStop(1, '#1e6f5c');
        ctx.fillStyle = earthGrad;
        ctx.fill();

        ctx.lineWidth = Math.max(1.5, Math.min(3.5, 200 * ppm));
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
        ctx.restore();

        // Exact 500 km Earth Segments converging at physical center (Global View)
        if (showSegmentsRef.current) {
          draw500KmEarthSegments({
            ctx,
            w,
            h,
            earthCenterX,
            earthCenterY,
            earthRadiusPixels,
            groundY,
            basePlaneScreenX,
            basePlaneScreenY,
            ppm,
            planeLonDeg,
            isGlobalView: true,
            minSurfaceY: 0,
          });
        }

        // Orbital waypoints
        WORLD_WAYPOINTS.forEach((wp) => {
          let deltaLonDeg = wp.lon - planeLonDeg;
          while (deltaLonDeg > 180) deltaLonDeg -= 360;
          while (deltaLonDeg < -180) deltaLonDeg += 360;

          const deltaAngleRad = deltaLonDeg * radPerDeg;
          const waypointAngle = -Math.PI / 2 + deltaAngleRad;

          const wpX = earthCenterX + Math.cos(waypointAngle) * earthRadiusPixels;
          const wpY = earthCenterY + Math.sin(waypointAngle) * earthRadiusPixels;

          if (wpX > -80 && wpX < w + 80 && wpY > -80 && wpY < h + 80) {
            const normX = (wpX - earthCenterX) / earthRadiusPixels;
            const normY = (wpY - earthCenterY) / earthRadiusPixels;
            const beaconHeight = Math.max(12, 5000 * ppm);
            const topX = wpX + normX * beaconHeight;
            const topY = wpY + normY * beaconHeight;

            ctx.beginPath();
            ctx.moveTo(wpX, wpY);
            ctx.lineTo(topX, topY);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(topX, topY, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();

            ctx.font = '9px monospace';
            ctx.fillStyle = '#bae6fd';
            ctx.fillText(wp.code, topX + 4, topY - 2);
          }
        });
      } else {
        // ==========================================
        // REGIME 2: EXACT VISIBLE HORIZON & ATMOSPHERE
        // ==========================================
        // Continuous samples across visible canvas span [-80, w + 80]
        const numSamples = 100;
        const xStep = (w + 160) / numSamples;
        const sampleXs: number[] = [];
        const sampleSurfaceYs: number[] = [];
        const sampleDistM: number[] = [];
        const sampleAtmoYs: number[] = [];

        const atmoTopM = 85000; // 85 km mesopause / Karman line
        const atmoR = earthRadiusPixels + atmoTopM * ppm;

        for (let i = 0; i <= numSamples; i++) {
          const sx = -80 + i * xStep;
          sampleXs.push(sx);
          const dx = sx - earthCenterX;
          sampleDistM.push(dx / ppm);

          // Exact circle equation on screen: (sx - cx)^2 + (cy - sy)^2 = R_px^2
          // sy = cy - sqrt(max(0, R_px^2 - dx^2))
          const radSq = earthRadiusPixels * earthRadiusPixels;
          const dxSq = dx * dx;
          const dy = Math.sqrt(Math.max(0, radSq - dxSq));
          const sy = earthCenterY - dy;
          sampleSurfaceYs.push(sy);

          const atmoRadSq = atmoR * atmoR;
          const atmoDy = Math.sqrt(Math.max(0, atmoRadSq - dxSq));
          sampleAtmoYs.push(earthCenterY - atmoDy);
        }

        const minSurfaceY = Math.min(...sampleSurfaceYs);

        // A. Atmospheric Shell Limb (Continuous curved halo above Earth surface)
        const atmoH = atmoTopM * ppm;
        if (minSurfaceY < h + 150 && minSurfaceY - atmoH < h + 80) {
          ctx.save();
          ctx.beginPath();
          // Top curved boundary of atmosphere
          for (let i = 0; i <= numSamples; i++) {
            const atmoY = Math.max(-100, sampleAtmoYs[i]);
            if (i === 0) {
              ctx.moveTo(sampleXs[i], atmoY);
            } else {
              ctx.lineTo(sampleXs[i], atmoY);
            }
          }
          // Bottom boundary follows ground surface
          for (let i = numSamples; i >= 0; i--) {
            ctx.lineTo(sampleXs[i], Math.min(h + 80, sampleSurfaceYs[i]));
          }
          ctx.closePath();

          const gradTop = Math.max(-100, groundY - atmoH);
          const gradBottom = Math.min(h + 80, groundY);
          const atmoGrad = ctx.createLinearGradient(0, gradTop, 0, Math.max(gradTop + 50, gradBottom));
          atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          atmoGrad.addColorStop(0.35, 'rgba(56, 189, 248, 0.08)');
          atmoGrad.addColorStop(0.65, 'rgba(59, 130, 246, 0.20)');
          atmoGrad.addColorStop(0.85, 'rgba(34, 211, 238, 0.35)');
          atmoGrad.addColorStop(1, 'rgba(125, 211, 252, 0.50)');
          ctx.fillStyle = atmoGrad;
          ctx.fill();
          ctx.restore();
        }

        // B. Earth Crust & Interior (Rendered whenever surface enters screen bounds)
        if (minSurfaceY <= h + 80) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(sampleXs[0], Math.min(h + 80, Math.max(-100, sampleSurfaceYs[0])));
          for (let i = 1; i <= numSamples; i++) {
            ctx.lineTo(sampleXs[i], Math.min(h + 80, Math.max(-100, sampleSurfaceYs[i])));
          }
          ctx.lineTo(w + 80, h + 80);
          ctx.lineTo(-80, h + 80);
          ctx.closePath();

          const peakY = Math.max(-50, minSurfaceY);
          const earthGrad = ctx.createLinearGradient(0, peakY, 0, Math.max(peakY + 150, h + 80));
          earthGrad.addColorStop(0, '#1e6f5c');   // Crust / vegetation
          earthGrad.addColorStop(0.12, '#0b4d82');// Coastal shelf / ocean
          earthGrad.addColorStop(0.5, '#073663'); // Continental shelf
          earthGrad.addColorStop(1, '#041d3b');   // Deep mantle
          ctx.fillStyle = earthGrad;
          ctx.fill();

          // Top Horizon Glow Line (Continuous path without chord jumps)
          ctx.beginPath();
          let lineStarted = false;
          for (let i = 0; i <= numSamples; i++) {
            const sy = sampleSurfaceYs[i];
            const sx = sampleXs[i];
            if (sy <= h + 50 && sy >= -50) {
              if (!lineStarted) {
                ctx.moveTo(sx, sy);
                lineStarted = true;
              } else {
                ctx.lineTo(sx, sy);
              }
            } else if (lineStarted) {
              ctx.lineTo(sx, Math.min(h + 50, Math.max(-50, sy)));
              lineStarted = false;
            }
          }
          if (lineStarted) {
            ctx.lineWidth = Math.max(1.5, Math.min(3.5, 200 * ppm));
            ctx.strokeStyle = '#38bdf8';
            ctx.stroke();
          }
          ctx.restore();

          // Exact 500 km Earth Segments converging at physical center (Regional / Horizon View)
          if (showSegmentsRef.current) {
            draw500KmEarthSegments({
              ctx,
              w,
              h,
              earthCenterX,
              earthCenterY,
              earthRadiusPixels,
              groundY,
              basePlaneScreenX,
              basePlaneScreenY,
              ppm,
              planeLonDeg,
              isGlobalView: false,
              minSurfaceY,
            });
          }

          // C. Mountains & Terrain Relief (Detailed topographic elevation)
          if (ppm > 0.0003) {
            ctx.save();
            ctx.beginPath();
            let terrainStarted = false;
            for (let i = 0; i <= numSamples; i++) {
              const xM = sampleDistM[i];
              const ang = xM / R_EARTH;
              const lonDeg = planeLonDeg + (ang * 180) / Math.PI;
              const terrainNoise = Math.sin(lonDeg * 12.0) * Math.cos(lonDeg * 26.0);
              const elevM = Math.max(0, terrainNoise * 2600); // Mountain peaks up to 2600m
              const ty = sampleSurfaceYs[i] - elevM * ppm;
              if (ty <= h + 50 && ty >= -50) {
                if (!terrainStarted) {
                  ctx.moveTo(sampleXs[i], ty);
                  terrainStarted = true;
                } else {
                  ctx.lineTo(sampleXs[i], ty);
                }
              } else if (terrainStarted) {
                ctx.lineTo(sampleXs[i], Math.min(h + 50, Math.max(-50, ty)));
                terrainStarted = false;
              }
            }
            if (terrainStarted) {
              ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
            ctx.restore();
          }

          // D. Exact-Scale Physical Ground Features (Parcels, Runways, Cities, Rivers, Wind Turbines, Towers)
          drawEarthFeatures({
            ctx,
            w,
            h,
            basePlaneScreenX,
            groundY,
            ppm,
            planeLonDeg,
            planeLatDeg: st.latitude,
            waypoints: WORLD_WAYPOINTS,
            animTimer: now / 1000,
          });

          // E. World Waypoints in visible horizon
          WORLD_WAYPOINTS.forEach((wp) => {
            let deltaLonDeg = wp.lon - planeLonDeg;
            while (deltaLonDeg > 180) deltaLonDeg -= 360;
            while (deltaLonDeg < -180) deltaLonDeg += 360;

            const deltaAngleRad = (deltaLonDeg * Math.PI) / 180;
            const wpX = earthCenterX + earthRadiusPixels * Math.sin(deltaAngleRad);
            const wpY = earthCenterY - earthRadiusPixels * Math.cos(deltaAngleRad);

            if (wpX > -80 && wpX < w + 80) {
              if (wpY <= h + 60 && wpY >= -80) {
                const beaconHeight = Math.max(14, Math.min(60, 5000 * ppm));
                const normX = Math.sin(deltaAngleRad);
                const normY = -Math.cos(deltaAngleRad);
                const topX = wpX + normX * beaconHeight;
                const topY = wpY + normY * beaconHeight;

                ctx.beginPath();
                ctx.moveTo(wpX, wpY);
                ctx.lineTo(topX, topY);
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(topX, topY, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#38bdf8';
                ctx.fill();

                ctx.font = '9px monospace';
                ctx.fillStyle = '#bae6fd';
                ctx.fillText(wp.code, topX + 4, topY - 2);
              }
            }
          });
        }

        // F. Weather Clouds (Sparse, realistic high-altitude cumulus / cirrus - reduced density)
        const cloudAltM = 5500;
        const cloudCenterY = groundY - cloudAltM * ppm;
        if (ppm > 0.0006 && cloudCenterY >= -100 && cloudCenterY <= h + 100) {
          ctx.save();
          // Increased grid spacing to 48 km and hash-filtering out ~70% of clouds
          const cloudGridM = 48000;
          const minWorldXM = (-150 - basePlaneScreenX) / ppm;
          const maxWorldXM = (w + 150 - basePlaneScreenX) / ppm;
          const firstCloudIdx = Math.floor(minWorldXM / cloudGridM);
          const lastCloudIdx = Math.ceil(maxWorldXM / cloudGridM);

          for (let c = firstCloudIdx; c <= lastCloudIdx; c++) {
            // Deterministic hash filter: only ~30% of candidate slots generate a cloud
            const cloudHash = Math.abs(Math.sin(c * 127.31 + 19.1) * 43758.5453) % 1;
            if (cloudHash > 0.30) continue;

            const cOffsetM = c * cloudGridM + (cloudHash - 0.5) * 8000;
            const cx = basePlaneScreenX + cOffsetM * ppm;
            if (cx < -200 || cx > w + 200) continue;

            const cDropM = (cOffsetM * cOffsetM) / (2 * R_EARTH);
            // Slight natural altitude variation (5000m to 6200m)
            const localCloudAltM = cloudAltM + (cloudHash - 0.5) * 1200;
            const cy = groundY + cDropM * ppm - localCloudAltM * ppm;
            if (cy < -80 || cy > h + 80) continue;

            const cloudW = Math.max(20, Math.min(220, (3200 + cloudHash * 2000) * ppm));
            const cloudH = Math.max(6, Math.min(55, (900 + cloudHash * 600) * ppm));

            // Soft multi-lobed cloud puff with subtle radial transparency
            const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cloudW);
            cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
            cloudGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.14)');
            cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = cloudGrad;

            // Main cloud body
            ctx.beginPath();
            ctx.ellipse(cx, cy, cloudW, cloudH, 0, 0, Math.PI * 2);
            ctx.fill();

            // Upper soft puffs
            ctx.beginPath();
            ctx.ellipse(cx - cloudW * 0.28, cy - cloudH * 0.3, cloudW * 0.45, cloudH * 0.65, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + cloudW * 0.24, cy - cloudH * 0.25, cloudW * 0.5, cloudH * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // 6. DRAW THE COMMERCIAL AEROPLANE TO 100% EXACT PHYSICAL SCALE
      // Absolute rule: 1 meter in real world = ppm pixels on screen!
      // Boeing A380 length = exactly 72.7 meters * ppm pixels!
      // Double-deck fuselage height = exactly 8.41 meters * ppm pixels!
      // Tailfin height = exactly 24.1 meters * ppm pixels!
      const planePixels = PLANE_LENGTH_M * ppm;

      drawRealisticAirliner({
        ctx,
        x: basePlaneScreenX,
        y: basePlaneScreenY,
        scale: ppm,
        flightState: st,
        strobeTimer,
      });

      // 6b. EARTH CURVATURE MICRO-ADJUSTMENT VISUALIZATION VECTORS
      // Shows the tangent straight line projecting into space vs the curved flight path following the Earth geoid
      if (showVectors || ppm > 0.0003) {
        ctx.save();
        const tangentSpanM = Math.min(80000, Math.max(12000, 220 / ppm));
        const tangentSpanPx = tangentSpanM * ppm;

        const noseX = basePlaneScreenX + (PLANE_LENGTH_M * 0.45) * ppm;
        const noseY = basePlaneScreenY;

        // 1. Amber dashed line: Tangent direction (straight Euclidean inertial path without pitch down)
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(noseX, noseY);
        ctx.lineTo(noseX + tangentSpanPx, noseY);
        ctx.stroke();

        // 2. Cyan line: Spherical geoid trajectory (A380 pitching down to stay at constant altitude)
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(noseX, noseY);
        const curveSteps = 24;
        for (let s = 1; s <= curveSteps; s++) {
          const dxM = (s / curveSteps) * tangentSpanM;
          // Curvature drop equation: dy = dx^2 / (2 * R)
          const dyDropM = (dxM * dxM) / (2 * R_EARTH);
          ctx.lineTo(noseX + dxM * ppm, noseY + dyDropM * ppm);
        }
        ctx.stroke();

        // End drop bracket between tangent line and curvature path
        const endDxM = tangentSpanM;
        const endDropM = (endDxM * endDxM) / (2 * R_EARTH);
        const endX = noseX + tangentSpanPx;
        const endTangentY = noseY;
        const endCurveY = noseY + endDropM * ppm;

        if (endDropM * ppm > 6) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(endX, endTangentY);
          ctx.lineTo(endX, endCurveY);
          ctx.stroke();

          // Drop distance label
          ctx.font = '8.5px monospace';
          ctx.fillStyle = '#fde68a';
          ctx.fillText(`Drop: ${Math.round(endDropM)}m (${Math.round(endDxM / Math.max(st.airspeed, 1))}s)`, endX + 4, (endTangentY + endCurveY) / 2 + 3);
        }

        // Live Micro-Trim annotation above aircraft
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = st.curvatureTrackingEnabled !== false ? '#38bdf8' : '#fbbf24';
        const trimText = st.curvatureTrackingEnabled !== false 
          ? `FBW Micro-Trim: ${st.elevatorMicroTrim && st.elevatorMicroTrim > 0 ? '+' : ''}${st.elevatorMicroTrim?.toFixed(2) ?? '-0.08'}° (Curvature ω: ${st.curvaturePitchRate?.toFixed(4) ?? '-0.0022'}°/s)`
          : `⚠️ TANGENT DRIFT (No Curvature Micro-Trim)`;
        ctx.fillText(trimText, basePlaneScreenX - 70, basePlaneScreenY - Math.max(22, 18 * ppm * 1.5));

        ctx.restore();
      }

      // 7. TRACKING RETICLE (Displayed when plane is small to keep track of exact position)
      if (planePixels < 24) {
        ctx.save();
        ctx.translate(basePlaneScreenX, basePlaneScreenY);
        
        // Dashed target bracket around exact aircraft position
        const boxR = 10;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-boxR, -boxR, boxR * 2, boxR * 2);

        // Center reticle dot exactly on aircraft position
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();

        // Small tag with physical size
        ctx.font = '8px monospace';
        ctx.fillStyle = '#7dd3fc';
        ctx.fillText(`A380 (${planePixels.toFixed(1)}px)`, boxR + 4, 3);
        ctx.restore();
      }

      // 8. LIVE 1:1 AIRLINER CLOSE-UP SCOPE (Corner Loupe)
      // Displays the aircraft at 1:1 scale so pilot can inspect controls even when zoomed out!
      if (showLoupe) {
        const loupeW = 168;
        const loupeH = 108;
        const loupeX = w - loupeW - 16;
        const loupeY = h - loupeH - 120;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(loupeX, loupeY, loupeW, loupeH, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('1:1 BOEING A380 SCOPE', loupeX + 8, loupeY + 13);
        ctx.font = '8px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('Double-Deck Quad-Jet (72.7m)', loupeX + 8, loupeY + 23);
        ctx.font = '8px monospace';
        ctx.fillStyle = '#38bdf8';
        const trimSign = st.elevatorMicroTrim && st.elevatorMicroTrim > 0 ? '+' : '';
        ctx.fillText(`FBW Trim: ${trimSign}${st.elevatorMicroTrim?.toFixed(2) ?? '-0.08'}° | ω: ${st.curvaturePitchRate?.toFixed(4) ?? '-0.0022'}°/s`, loupeX + 8, loupeY + 33);

        // Draw photorealistic preview airliner inside scope
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(loupeX, loupeY, loupeW, loupeH, 10);
        ctx.clip();

        drawRealisticAirliner({
          ctx,
          x: loupeX + loupeW * 0.54,
          y: loupeY + loupeH * 0.65,
          scale: 1.25,
          flightState: st,
          strobeTimer,
          isLoupe: true,
        });
        ctx.restore();
        ctx.restore();
      }

      // 9. DYNAMIC TO-SCALE METRIC SCALE BAR & EXACT SCALE TELEMETRY
      ctx.save();
      const targetPixels = 120;
      const metersPerTarget = targetPixels / ppm;

      // Metric steps covering close-up aircraft inspection (1m) up to global orbital view (10,000 km)
      const metricSteps = [
        1, 2, 5,
        10, 20, 50,
        100, 200, 500,
        1000, 2000, 5000,
        10000, 20000, 50000,
        100000, 200000, 500000,
        1000000, 2000000, 5000000, 10000000
      ];
      let chosenStep = metricSteps[0];
      for (const step of metricSteps) {
        if (step <= metersPerTarget) {
          chosenStep = step;
        } else {
          break;
        }
      }

      // Exact physical width in canvas pixels: barWidth = chosenStep (meters) * ppm (pixels/meter)
      const barWidth = chosenStep * ppm;
      const barX = 24;
      const barY = h - 135;
      const stepLabel = chosenStep >= 1000 
        ? `${(chosenStep / 1000).toLocaleString()} km` 
        : `${chosenStep} m`;

      // Exact Scale Metrics Display & Scale Bar
      if (showCurvatureInfo) {
        // High-contrast clean white backdrop card for black telemetry and scale bar
        const cardX = barX - 10;
        const cardY = barY - 22;
        const cardW = Math.max(barWidth + 30, 560);
        const cardH = 110;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 8);
        ctx.fill();
        ctx.stroke();

        // Draw Scale Bar in black with end ticks and midpoint tick
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barX, barY - 4);
        ctx.lineTo(barX, barY + 4);
        ctx.moveTo(barX, barY);
        ctx.lineTo(barX + barWidth, barY);
        ctx.moveTo(barX + barWidth / 2, barY - 2.5);
        ctx.lineTo(barX + barWidth / 2, barY + 2.5);
        ctx.moveTo(barX + barWidth, barY - 4);
        ctx.lineTo(barX + barWidth, barY + 4);
        ctx.stroke();

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(stepLabel, barX + barWidth / 2, barY - 6);

        // Exact Scale & Curvature Telemetry Text in black
        ctx.textAlign = 'left';
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(`100% EXACT PHYSICAL SCALE (NO DISTORTION)`, barX, barY + 16);
        ctx.font = '9px monospace';
        ctx.fillStyle = '#000000';
        const onePxM = 1 / ppm;
        const onePxStr = onePxM >= 1000 ? `${(onePxM / 1000).toFixed(1)} km` : `${onePxM.toFixed(1)} m`;
        ctx.fillText(`1 px = ${onePxStr} | Boeing A380 (72.7m) = ${planePixels.toFixed(1)} px | Alt (${Math.round(altM)}m) = ${(altM * ppm).toFixed(1)} px`, barX, barY + 28);
        const distDrop50km = Math.round(Math.pow(50000, 2) / (2 * R_EARTH));
        ctx.fillText(`Earth Curvature: R = 6,371 km (${(R_EARTH * ppm).toFixed(0)} px) | Horizon Drop at 50km: ${distDrop50km} m`, barX, barY + 40);

        const cardWindKts = Math.round((st.headwind || 0) * 1.94384);
        const cardWindText = Math.abs(cardWindKts) <= 1 ? 'Calm (0 kt)' : cardWindKts > 0 ? `Headwind ${cardWindKts} kt` : `Tailwind ${Math.abs(cardWindKts)} kt`;
        const cardTasKts = Math.round(st.airspeed * 1.94384);
        const cardGsMps = (st.airspeed * Math.cos(pitchRad)) - (st.headwind || 0);
        const cardGsKmh = Math.round(cardGsMps * 3.6);
        const cardGsKts = Math.round(cardGsMps * 1.94384);
        ctx.fillText(`Wind: ${cardWindText} | Airspeed: ${cardTasKts} kts | Ground Speed: ${cardGsKmh} km/h (${cardGsKts} kts)`, barX, barY + 52);
        ctx.fillText(`500 km Earth Segments: ~80 sectors (${(500000 * ppm).toFixed(1)} px) converging to physical center`, barX, barY + 64);
        const trimSign = st.elevatorMicroTrim && st.elevatorMicroTrim > 0 ? '+' : '';
        ctx.fillText(`FBW Curvature Tracking: ω = ${st.curvaturePitchRate ?? -0.0022}°/s (${((st.curvaturePitchRate ?? -0.0022) * 3600).toFixed(1)}°/hr) | Drop: ${st.earthDropRatePerMin ?? 17.3} m/min | Trim: ${trimSign}${st.elevatorMicroTrim?.toFixed(2) ?? '-0.08'}°`, barX, barY + 76);
      } else {
        // Standalone high-contrast HUD pill for dark/light sky readability
        const pillX = barX - 10;
        const pillY = barY - 18;
        const pillW = barWidth + 20;
        const pillH = 30;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barX, barY - 4);
        ctx.lineTo(barX, barY + 4);
        ctx.moveTo(barX, barY);
        ctx.lineTo(barX + barWidth, barY);
        ctx.moveTo(barX + barWidth / 2, barY - 2.5);
        ctx.lineTo(barX + barWidth / 2, barY + 2.5);
        ctx.moveTo(barX + barWidth, barY - 4);
        ctx.lineTo(barX + barWidth, barY + 4);
        ctx.stroke();

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(stepLabel, barX + barWidth / 2, barY - 6);
        ctx.textAlign = 'left';
      }

      // Vertical Altitude Gauge on Right Edge
      const rulerX = w - 35;
      const rulerTopY = 85;
      const rulerBotY = h - 140;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rulerX, rulerTopY);
      ctx.lineTo(rulerX, rulerBotY);
      ctx.stroke();

      const altMarks = [
        { alt: 0, label: '0m Sea' },
        { alt: 3048, label: '10k ft' },
        { alt: 10668, label: '35k ft' },
        { alt: 13106, label: '43k ft' },
        { alt: 25000, label: '25 km' },
        { alt: 50000, label: '50 km' },
        { alt: 100000, label: '100 km Space' },
      ];

      altMarks.forEach((mk) => {
        const dy = (mk.alt - altM) * ppm;
        const markY = basePlaneScreenY - dy;
        if (markY >= rulerTopY && markY <= rulerBotY) {
          ctx.beginPath();
          ctx.moveTo(rulerX - 5, markY);
          ctx.lineTo(rulerX + 5, markY);
          ctx.strokeStyle = mk.alt === 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.4)';
          ctx.stroke();

          ctx.font = '8px monospace';
          ctx.fillStyle = mk.alt === 0 ? '#38bdf8' : 'rgba(255, 255, 255, 0.6)';
          ctx.fillText(mk.label, rulerX - 60, markY + 3);
        }
      });

      // Aircraft Altitude Marker on ruler
      ctx.beginPath();
      ctx.moveTo(rulerX + 8, basePlaneScreenY);
      ctx.lineTo(rulerX + 2, basePlaneScreenY - 4);
      ctx.lineTo(rulerX + 2, basePlaneScreenY + 4);
      ctx.closePath();
      ctx.fillStyle = '#38bdf8';
      ctx.fill();

      ctx.restore();
      ctx.restore();
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      ro.disconnect();
    };
  }, [showCurvatureInfo, showLoupe, show500KmSegments]);

  const activeMode: ViewMode2D =
    pixelsPerMeter >= 0.5 ? 'closeup' :
    pixelsPerMeter >= 0.005 ? 'atmosphere' :
    pixelsPerMeter >= 0.00015 ? 'regional' : 'global';

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      {/* 2D HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Floating 2D View Scale Controls: Pinned to TOP-RIGHT under the HUD buttons */}
      <div className="absolute top-20 right-4 sm:right-6 z-20 flex flex-col items-end gap-2 pointer-events-auto">
        {/* Scale Presets Pill Bar */}
        <div 
          className="flex items-center gap-1 bg-slate-950/90 border border-slate-800/90 rounded-xl p-1 backdrop-blur-md shadow-2xl text-xs font-mono"
          style={{ width: '479.469px', marginRight: '-10px', marginTop: '0px' }}
        >
          <span className="text-[10px] text-cyan-400 px-2 uppercase tracking-wider font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Exact Scale:
          </span>
          <button
            onClick={() => setPresetZoom('closeup')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeMode === 'closeup'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="1:1 Aircraft Scale: Boeing A380 Superjumbo (72.7m length, ~320m field)"
          >
            A380 1:1
          </button>
          <button
            onClick={() => setPresetZoom('atmosphere')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeMode === 'atmosphere'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Atmosphere Scale: 10.6 km Cruise Altitude & Troposphere to Scale (~25 km)"
          >
            Atmosphere
          </button>
          <button
            onClick={() => setPresetZoom('regional')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeMode === 'regional'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Regional Arc: Earth Curvature Drop (~200 km field)"
          >
            Regional Arc
          </button>
          <button
            onClick={() => setPresetZoom('global')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeMode === 'global'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Global Earth Orbit: Entire 12,742 km Globe to Scale"
          >
            Global Orbit
          </button>
        </div>

        {/* Zoom Controls & Toggles */}
        <div 
          className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-800/90 rounded-xl p-1 backdrop-blur-md shadow-2xl text-xs"
          style={{ marginRight: '-4px', marginTop: '0px' }}
        >
          <button
            onClick={() => setFollowPlane(!followPlane)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono transition-all ${
              followPlane
                ? 'bg-cyan-950/80 border-cyan-500/70 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Lock camera to follow the aircraft"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Follow Plane</span>
          </button>

          <button
            onClick={() => setShow500KmSegments(!show500KmSegments)}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
              show500KmSegments
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle 500 km Earth segments converging at center"
          >
            500km Sectors
          </button>

          <button
            onClick={() => setShowLoupe(!showLoupe)}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
              showLoupe
                ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle 1:1 Airliner Inspection Scope"
          >
            Scope Inset
          </button>

          <button
            onClick={() => setShowCurvatureInfo(!showCurvatureInfo)}
            className={`p-1.5 rounded-lg border transition-all ${
              showCurvatureInfo
                ? 'bg-cyan-950/80 border-cyan-800 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Exact Scale & Curvature Telemetry"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Continuous Zoom In / Out Buttons */}
          <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1.5 ml-0.5">
            <button
              onClick={() => setPixelsPerMeter((p) => {
                const n = Math.min(3.5, p * 1.3);
                ppmRef.current = n;
                return n;
              })}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Zoom In (Scroll Up)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPixelsPerMeter((p) => {
                const n = Math.max(0.00002, p * 0.77);
                ppmRef.current = n;
                return n;
              })}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Zoom Out (Scroll Down)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPresetZoom('atmosphere')}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
              title="Reset View to Atmosphere Scale"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
