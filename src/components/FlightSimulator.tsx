import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CameraMode, FlightState } from '../types/flight';
import { createCommercialAirplane, AirplaneParts } from './AirplaneModel';
import { 
  generateEarthTextures, 
  createEarthMaterial, 
  createAtmosphereGlowMaterial 
} from '../utils/earthTextures';
import { geoToCartesian, WORLD_WAYPOINTS } from './FlightPhysics';

interface FlightSimulatorProps {
  flightState: FlightState;
  cameraMode: CameraMode;
  showVectors: boolean;
}

// Module-level pre-allocated math objects to ensure zero GC in the render loop per Three.js directives
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _planePos = new THREE.Vector3();
const _earthCenter = new THREE.Vector3(0, 0, 0);
const _upNormal = new THREE.Vector3();
const _forwardDir = new THREE.Vector3();
const _rightDir = new THREE.Vector3();
const _rotMatrix = new THREE.Matrix4();
const _targetCamPos = new THREE.Vector3();
const _targetCamLook = new THREE.Vector3();
const _quatCurrent = new THREE.Quaternion();
const _quatTarget = new THREE.Quaternion();

const EARTH_RADIUS = 35.0; // 3D units for Earth sphere

export const FlightSimulator: React.FC<FlightSimulatorProps> = ({
  flightState,
  cameraMode,
  showVectors,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<FlightState>(flightState);
  stateRef.current = flightState;

  const cameraModeRef = useRef<CameraMode>(cameraMode);
  cameraModeRef.current = cameraMode;

  const showVectorsRef = useRef<boolean>(showVectors);
  showVectorsRef.current = showVectors;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Deep space dark slate

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 2. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Lighting Rig: Directional Sun Key Light + Hemisphere Fill
    const sunDirection = new THREE.Vector3(1.2, 0.6, 1.0).normalize();
    const sunLight = new THREE.DirectionalLight(0xfffdf5, 2.5);
    sunLight.position.copy(sunDirection.clone().multiplyScalar(150));
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.8);
    scene.add(hemiLight);

    // 4. Distant Starfield
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 800 + Math.random() * 200;
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. Earth Globe & Procedural Textures
    const { dayTexture, nightTexture, cloudsTexture } = generateEarthTextures();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    dayTexture.anisotropy = maxAniso;
    nightTexture.anisotropy = maxAniso;
    cloudsTexture.anisotropy = maxAniso;

    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthMat = createEarthMaterial(dayTexture, nightTexture, sunDirection);
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.receiveShadow = true;
    scene.add(earthMesh);

    // Clouds Sphere (slightly larger than Earth, rotating with atmospheric currents)
    const cloudsGeo = new THREE.SphereGeometry(EARTH_RADIUS + 0.18, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // Atmospheric Glow Outer Shell (Rayleigh scattering rim)
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS + 1.2, 48, 48);
    const atmoMat = createAtmosphereGlowMaterial();
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 6. Global Waypoint Beacons on Earth
    const waypointGroup = new THREE.Group();
    scene.add(waypointGroup);

    const pinGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    pinGeo.rotateX(Math.PI / 2);
    const pinHeadGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pinHeadMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });

    WORLD_WAYPOINTS.forEach((wp) => {
      const pos = geoToCartesian(wp.lat, wp.lon, 0.2, EARTH_RADIUS);
      const wpMesh = new THREE.Mesh(pinGeo, pinMat);
      const wpHead = new THREE.Mesh(pinHeadGeo, pinHeadMat);
      wpMesh.position.set(pos.x, pos.y, pos.z);
      wpMesh.lookAt(0, 0, 0);
      wpHead.position.set(pos.x, pos.y, pos.z);
      waypointGroup.add(wpMesh);
      waypointGroup.add(wpHead);
    });

    // 7. Global Flight Path Ribbon (Historical breadcrumb trail around Earth)
    const maxPathPoints = 400;
    const pathPositions = new Float32Array(maxPathPoints * 3);
    const pathGeo = new THREE.BufferGeometry();
    pathGeo.setAttribute('position', new THREE.BufferAttribute(pathPositions, 3));
    const pathMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    const pathLine = new THREE.Line(pathGeo, pathMat);
    scene.add(pathLine);
    let pathCount = 0;
    let pathTimer = 0;

    // 8. Commercial Jetliner Model
    const airplane: AirplaneParts = createCommercialAirplane();
    scene.add(airplane.root);

    // Pre-warm WebGL shaders once per Three.js directives
    renderer.compile(scene, camera);

    // Initial camera placement
    camera.position.set(0, EARTH_RADIUS + 12, 35);
    camera.lookAt(0, EARTH_RADIUS, 0);

    // 9. Interactive Drag / Orbit in 'orbit' mode
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitAzimuth = 0;
    let orbitPolar = 0.3;
    let orbitDist = 8.0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isMouseDown = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isMouseDown) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - prevMouseX;
      const dy = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      orbitAzimuth -= dx * 0.008;
      orbitPolar = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, orbitPolar + dy * 0.008));
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    const onWheel = (e: WheelEvent) => {
      orbitDist = Math.max(3.0, Math.min(65.0, orbitDist + e.deltaY * 0.015));
    };

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation & Render Loop
    const clock = new THREE.Clock();
    let animId = 0;

    const renderTick = () => {
      animId = requestAnimationFrame(renderTick);
      const delta = Math.min(clock.getDelta(), 0.1);

      const st = stateRef.current;
      const camMode = cameraModeRef.current;

      // Rotate Clouds slightly for atmospheric life
      cloudsMesh.rotation.y += delta * 0.002;

      // Calculate Aircraft 3D Cartesian Position on Earth
      // Scale: 10,000 meters altitude maps to ~0.8 units above Earth surface
      const alt3D = (st.altitude / 10000) * 0.8 + 0.1;
      const currentRadius = EARTH_RADIUS + alt3D;
      const cartPos = geoToCartesian(st.latitude, st.longitude, alt3D, EARTH_RADIUS);
      _planePos.set(cartPos.x, cartPos.y, cartPos.z);

      // Airplane Root Position
      airplane.root.position.copy(_planePos);

      // Up vector is the local normal from Earth center through the airplane
      _upNormal.copy(_planePos).sub(_earthCenter).normalize();

      // Heading orientation: compute Local North and East tangent vectors
      const latRad = (st.latitude * Math.PI) / 180;
      const lonRad = (st.longitude * Math.PI) / 180;

      // North tangent unit vector
      _v1.set(
        -Math.sin(latRad) * Math.cos(lonRad),
        Math.cos(latRad),
        -Math.sin(latRad) * Math.sin(lonRad)
      ).normalize();

      // East tangent unit vector
      _v2.set(
        -Math.sin(lonRad),
        0,
        Math.cos(lonRad)
      ).normalize();

      // Forward direction based on heading angle
      const headingRad = (st.heading * Math.PI) / 180;
      _forwardDir.copy(_v1).multiplyScalar(Math.cos(headingRad))
        .addScaledVector(_v2, Math.sin(headingRad))
        .normalize();

      // Local Right vector
      _rightDir.crossVectors(_forwardDir, _upNormal).normalize();

      // Build rotation matrix for local tangential coordinates
      // Airplane model convention: Forward is -Z, Up is +Y, Right is +X
      _rotMatrix.makeBasis(
        _rightDir,
        _upNormal,
        _forwardDir.clone().negate()
      );
      _quatTarget.setFromRotationMatrix(_rotMatrix);

      // Apply Pitch, Roll, and Yaw angles relative to the local flight plane
      const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -(st.pitch * Math.PI) / 180);
      const rollQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -(st.roll * Math.PI) / 180);
      
      _quatTarget.multiply(pitchQuat).multiply(rollQuat);

      // Smooth orientation dampening
      _quatCurrent.copy(airplane.root.quaternion);
      _quatCurrent.slerp(_quatTarget, 1 - Math.exp(-12 * delta));
      airplane.root.quaternion.copy(_quatCurrent);

      // Update Airplane internal animations (turbines, spoilers, contrails)
      airplane.updateAnimations(delta, st.throttle, st.altitude, st.spoilers);

      // Update 3D Force Vectors
      airplane.updateForces(st.forces, showVectorsRef.current);

      // Update flight path history breadcrumbs (every ~0.2s)
      pathTimer += delta;
      if (pathTimer > 0.25) {
        pathTimer = 0;
        const attr = pathGeo.getAttribute('position') as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;

        // Shift existing coordinates back
        if (pathCount < maxPathPoints) {
          pathCount++;
        }
        for (let i = (pathCount - 1) * 3; i >= 3; i--) {
          arr[i] = arr[i - 3];
          arr[i + 1] = arr[i - 2];
          arr[i + 2] = arr[i - 1];
        }
        // Write newest position at head
        arr[0] = _planePos.x;
        arr[1] = _planePos.y;
        arr[2] = _planePos.z;
        attr.needsUpdate = true;
        pathGeo.setDrawRange(0, pathCount);
      }

      // Camera Positioning based on CameraMode
      if (camMode === 'chase') {
        // Chase view: Behind and slightly above aircraft, looking forward along flight path
        _v1.copy(_forwardDir).multiplyScalar(-6.5);
        _v2.copy(_upNormal).multiplyScalar(1.8);
        _targetCamPos.copy(_planePos).add(_v1).add(_v2);
        _targetCamLook.copy(_planePos).addScaledVector(_forwardDir, 10.0);

        camera.position.lerp(_targetCamPos, 1 - Math.exp(-8 * delta));
        camera.up.lerp(_upNormal, 1 - Math.exp(-8 * delta));
        camera.lookAt(_targetCamLook);
      } else if (camMode === 'cockpit') {
        // Cockpit view: Located at forward nose cockpit window looking ahead
        _v1.copy(_forwardDir).multiplyScalar(1.4);
        _v2.copy(_upNormal).multiplyScalar(0.25);
        _targetCamPos.copy(_planePos).add(_v1).add(_v2);
        _targetCamLook.copy(_targetCamPos).addScaledVector(_forwardDir, 25.0);

        camera.position.copy(_targetCamPos);
        camera.up.copy(_upNormal);
        camera.lookAt(_targetCamLook);
      } else if (camMode === 'wing') {
        // Wing view: Mounted on starboard wing tip looking inward past turbine toward cockpit and Earth horizon
        _v1.copy(_rightDir).multiplyScalar(-2.8);
        _v2.copy(_forwardDir).multiplyScalar(-0.5);
        _v3.copy(_upNormal).multiplyScalar(0.35);
        _targetCamPos.copy(_planePos).add(_v1).add(_v2).add(_v3);
        _targetCamLook.copy(_planePos).addScaledVector(_forwardDir, 3.0);

        camera.position.lerp(_targetCamPos, 1 - Math.exp(-10 * delta));
        camera.up.lerp(_upNormal, 1 - Math.exp(-10 * delta));
        camera.lookAt(_targetCamLook);
      } else if (camMode === 'satellite') {
        // Global Satellite view: Far outside in space looking down upon Earth and the plane
        _v1.copy(_upNormal).multiplyScalar(28.0);
        _v2.copy(_rightDir).multiplyScalar(15.0);
        _targetCamPos.copy(_planePos).add(_v1).add(_v2);
        _targetCamLook.copy(_planePos);

        camera.position.lerp(_targetCamPos, 1 - Math.exp(-4 * delta));
        camera.up.set(0, 1, 0);
        camera.lookAt(_targetCamLook);
      } else if (camMode === 'orbit') {
        // Free user orbit around aircraft using mouse drag
        const cosP = Math.cos(orbitPolar);
        const sinP = Math.sin(orbitPolar);
        const cosA = Math.cos(orbitAzimuth);
        const sinA = Math.sin(orbitAzimuth);

        _v1.set(cosP * sinA, sinP, cosP * cosA).multiplyScalar(orbitDist);
        _targetCamPos.copy(_planePos).add(_v1);
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-12 * delta));
        camera.up.lerp(_upNormal, 1 - Math.exp(-8 * delta));
        camera.lookAt(_planePos);
      }

      renderer.render(scene, camera);
    };

    renderTick();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      container.removeEventListener('wheel', onWheel);

      airplane.dispose();
      earthGeo.dispose();
      cloudsGeo.dispose();
      atmoGeo.dispose();
      starGeo.dispose();
      pathGeo.dispose();
      pinGeo.dispose();
      pinHeadGeo.dispose();
      dayTexture.dispose();
      nightTexture.dispose();
      cloudsTexture.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden" 
    />
  );
};
