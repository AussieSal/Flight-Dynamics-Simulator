import * as THREE from 'three';
import { FlightForces } from '../types/flight';

export interface AirplaneParts {
  root: THREE.Group;
  planeBody: THREE.Group;
  leftTurbine: THREE.Mesh;
  rightTurbine: THREE.Mesh;
  leftContrail: THREE.Line;
  rightContrail: THREE.Line;
  spoilersLeft: THREE.Mesh;
  spoilersRight: THREE.Mesh;
  navLightLeft: THREE.PointLight;
  navLightRight: THREE.PointLight;
  strobeLight: THREE.PointLight;
  forceVectorsGroup: THREE.Group;
  thrustArrow: THREE.ArrowHelper;
  dragArrow: THREE.ArrowHelper;
  liftArrow: THREE.ArrowHelper;
  weightArrow: THREE.ArrowHelper;
  updateForces: (forces: FlightForces, visible: boolean) => void;
  updateAnimations: (delta: number, throttle: number, altitude: number, spoilers: number) => void;
  dispose: () => void;
}

export function createCommercialAirplane(): AirplaneParts {
  const root = new THREE.Group();
  root.name = 'AirplaneRoot';

  const planeBody = new THREE.Group();
  planeBody.name = 'AirplaneBody';
  root.add(planeBody);

  // Materials with physical rendering fidelity
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // Clean aviation pearl white
    metalness: 0.35,
    roughness: 0.25,
  });

  const bellyStripeMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Commercial livery airline blue
    metalness: 0.4,
    roughness: 0.3,
  });

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Aircraft light grey alloy
    metalness: 0.45,
    roughness: 0.28,
  });

  const wingletMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Blue winglets matching livery
    metalness: 0.4,
    roughness: 0.3,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Brushed titanium/nickel alloy
    metalness: 0.9,
    roughness: 0.15,
  });

  const engineExhaustMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // Heat-treated engine core
    metalness: 0.85,
    roughness: 0.45,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // Aircraft scale: ~3.0 units length
  const lengthScale = 1.0;

  // 1. PRIMARY SILHOUETTE: Main Fuselage Tube
  // Fuselage cylinder along Z-axis (pointing towards -Z as forward)
  const fuselageGeo = new THREE.CylinderGeometry(0.32, 0.32, 2.6 * lengthScale, 32);
  fuselageGeo.rotateX(Math.PI / 2); // Align with Z
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  fuselage.position.set(0, 0, 0);
  planeBody.add(fuselage);

  // Belly aerodynamic fairing / lower stripe
  const bellyGeo = new THREE.CylinderGeometry(0.325, 0.325, 1.8 * lengthScale, 32, 1, false, Math.PI * 0.7, Math.PI * 0.6);
  bellyGeo.rotateX(Math.PI / 2);
  bellyGeo.rotateZ(Math.PI);
  const belly = new THREE.Mesh(bellyGeo, bellyStripeMat);
  belly.position.set(0, -0.01, 0.1);
  planeBody.add(belly);

  // Aerodynamic Nose Radome Cone
  const noseGeo = new THREE.ConeGeometry(0.32, 0.85 * lengthScale, 32);
  noseGeo.rotateX(-Math.PI / 2);
  const nose = new THREE.Mesh(noseGeo, fuselageMat);
  nose.position.set(0, -0.02, -1.725 * lengthScale);
  planeBody.add(nose);

  // Cockpit Windscreen Windows (Dark Glass wrap-around)
  const cockpitGeo = new THREE.BoxGeometry(0.38, 0.14, 0.45);
  const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
  cockpit.position.set(0, 0.21, -1.35 * lengthScale);
  cockpit.rotation.x = -0.35;
  planeBody.add(cockpit);

  // Dual-Deck Cabin passenger windows strips (Upper Deck & Main Deck)
  const windowStripGeo = new THREE.BoxGeometry(0.66, 0.045, 1.6);
  const mainDeckWindows = new THREE.Mesh(windowStripGeo, glassMat);
  mainDeckWindows.position.set(0, -0.02, -0.1);
  planeBody.add(mainDeckWindows);

  const upperDeckWindows = new THREE.Mesh(windowStripGeo, glassMat);
  upperDeckWindows.position.set(0, 0.14, -0.1);
  planeBody.add(upperDeckWindows);

  // Tail Taper / APU Cone
  const tailConeGeo = new THREE.ConeGeometry(0.32, 0.9 * lengthScale, 32);
  tailConeGeo.rotateX(Math.PI / 2);
  const tailCone = new THREE.Mesh(tailConeGeo, fuselageMat);
  tailCone.position.set(0, 0.04, 1.75 * lengthScale);
  planeBody.add(tailCone);

  // 2. SECONDARY READ: Swept Wings
  // Main Wing: High aspect-ratio commercial swept wing
  const wingShape = new THREE.Shape();
  // Center root
  wingShape.moveTo(0, -0.45);
  wingShape.lineTo(2.3, 0.45);   // Left wingtip
  wingShape.lineTo(2.2, 0.75);   // Left trailing edge tip
  wingShape.lineTo(0, 0.25);     // Center trailing root
  wingShape.lineTo(-2.2, 0.75);  // Right trailing edge tip
  wingShape.lineTo(-2.3, 0.45);  // Right wingtip
  wingShape.closePath();

  const extrudeSettings = {
    depth: 0.06,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.015,
    bevelThickness: 0.015,
  };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  wingGeo.rotateX(Math.PI / 2); // Lay flat on XZ plane
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, -0.08, -0.1);
  // Slight dihedral angle (wings canted up slightly)
  planeBody.add(wings);

  // Winglets (upturned tips for drag reduction)
  const wingletGeo = new THREE.BoxGeometry(0.04, 0.28, 0.3);
  
  const leftWinglet = new THREE.Mesh(wingletGeo, wingletMat);
  leftWinglet.position.set(2.25, 0.06, 0.48);
  leftWinglet.rotation.z = -0.25;
  planeBody.add(leftWinglet);

  const rightWinglet = new THREE.Mesh(wingletGeo, wingletMat);
  rightWinglet.position.set(-2.25, 0.06, 0.48);
  rightWinglet.rotation.z = 0.25;
  planeBody.add(rightWinglet);

  // Spoilers / Flight Air Brakes on top of wings (animated on drag increase)
  const spoilerGeo = new THREE.BoxGeometry(0.65, 0.02, 0.2);
  const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
  
  const spoilersLeft = new THREE.Mesh(spoilerGeo, spoilerMat);
  spoilersLeft.position.set(1.0, 0.02, 0.2);
  planeBody.add(spoilersLeft);

  const spoilersRight = new THREE.Mesh(spoilerGeo, spoilerMat);
  spoilersRight.position.set(-1.0, 0.02, 0.2);
  planeBody.add(spoilersRight);

  // Vertical Tailfin (Vertical Stabilizer)
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0.7, 0);
  tailShape.lineTo(0.35, 1.05);
  tailShape.lineTo(0.1, 1.05);
  tailShape.closePath();

  const tailGeo = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.01,
    bevelThickness: 0.01,
  });
  tailGeo.rotateY(Math.PI / 2);
  const verticalTail = new THREE.Mesh(tailGeo, bellyStripeMat);
  verticalTail.position.set(0.025, 0.25, 1.15);
  planeBody.add(verticalTail);

  // Horizontal Tail Stabilizers (Elevators)
  const hStabShape = new THREE.Shape();
  hStabShape.moveTo(0, -0.2);
  hStabShape.lineTo(0.85, 0.15);
  hStabShape.lineTo(0.8, 0.3);
  hStabShape.lineTo(0, 0.1);
  hStabShape.lineTo(-0.8, 0.3);
  hStabShape.lineTo(-0.85, 0.15);
  hStabShape.closePath();

  const hStabGeo = new THREE.ExtrudeGeometry(hStabShape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  hStabGeo.rotateX(Math.PI / 2);
  const horizontalTail = new THREE.Mesh(hStabGeo, wingMat);
  horizontalTail.position.set(0, 0.32, 1.75);
  planeBody.add(horizontalTail);

  // 3. ACCENT DETAIL: Twin High-Bypass Turbofan Engines
  const createEngine = (xOffset: number) => {
    const engineGroup = new THREE.Group();
    
    // Engine Nacelle Outer Cowling
    const nacelleGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.75, 24, 1, true);
    nacelleGeo.rotateX(Math.PI / 2);
    const nacelle = new THREE.Mesh(nacelleGeo, fuselageMat);
    engineGroup.add(nacelle);

    // Chrome Intake Lip Ring
    const lipGeo = new THREE.TorusGeometry(0.18, 0.022, 16, 24);
    const lip = new THREE.Mesh(lipGeo, metalMat);
    lip.position.set(0, 0, -0.375);
    engineGroup.add(lip);

    // Engine Core / Exhaust Cone
    const exhaustGeo = new THREE.ConeGeometry(0.1, 0.3, 16);
    exhaustGeo.rotateX(-Math.PI / 2);
    const exhaust = new THREE.Mesh(exhaustGeo, engineExhaustMat);
    exhaust.position.set(0, 0, 0.45);
    engineGroup.add(exhaust);

    // Spinning Turbine Fan Blades Disk
    const fanGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 16);
    fanGeo.rotateX(Math.PI / 2);
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.1,
    });
    const fan = new THREE.Mesh(fanGeo, fanMat);
    fan.position.set(0, 0, -0.2);
    engineGroup.add(fan);

    // Engine Pylon Mount to wing
    const pylonGeo = new THREE.BoxGeometry(0.04, 0.14, 0.4);
    const pylon = new THREE.Mesh(pylonGeo, metalMat);
    pylon.position.set(0, 0.12, 0);
    engineGroup.add(pylon);

    engineGroup.position.set(xOffset, -0.28, -0.05);
    planeBody.add(engineGroup);
    return fan;
  };

  // Quad High-Bypass Turbofans (4 engines for A380 superjumbo)
  const leftTurbine = createEngine(0.85); // Inboard Left
  const rightTurbine = createEngine(-0.85); // Inboard Right
  createEngine(1.55); // Outboard Left
  createEngine(-1.55); // Outboard Right

  // Navigation Wingtip Lights
  const navLightLeft = new THREE.PointLight(0xef4444, 2.0, 3.5); // Port: Red
  navLightLeft.position.set(2.28, 0.04, 0.48);
  planeBody.add(navLightLeft);

  const navLightRight = new THREE.PointLight(0x22c55e, 2.0, 3.5); // Starboard: Green
  navLightRight.position.set(-2.28, 0.04, 0.48);
  planeBody.add(navLightRight);

  // White tail strobe beacon
  const strobeLight = new THREE.PointLight(0xffffff, 0, 6.0);
  strobeLight.position.set(0, 1.35, 1.45);
  planeBody.add(strobeLight);

  // Contrails (Vapor trails behind both engines)
  const maxTrailPoints = 60;
  const leftTrailGeo = new THREE.BufferGeometry();
  const rightTrailGeo = new THREE.BufferGeometry();
  
  const leftPositions = new Float32Array(maxTrailPoints * 3);
  const rightPositions = new Float32Array(maxTrailPoints * 3);

  // Fill initial trail points straight back
  for (let i = 0; i < maxTrailPoints; i++) {
    const z = 0.5 + i * 0.35;
    leftPositions[i * 3] = 0.95;
    leftPositions[i * 3 + 1] = -0.28;
    leftPositions[i * 3 + 2] = z;

    rightPositions[i * 3] = -0.95;
    rightPositions[i * 3 + 1] = -0.28;
    rightPositions[i * 3 + 2] = z;
  }
  leftTrailGeo.setAttribute('position', new THREE.BufferAttribute(leftPositions, 3));
  rightTrailGeo.setAttribute('position', new THREE.BufferAttribute(rightPositions, 3));

  const contrailMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.65,
    linewidth: 2,
  });

  const leftContrail = new THREE.Line(leftTrailGeo, contrailMat);
  const rightContrail = new THREE.Line(rightTrailGeo, contrailMat);
  planeBody.add(leftContrail);
  planeBody.add(rightContrail);

  // 4. THE FOUR FORCES OF FLIGHT: 3D DYNAMIC FORCE VECTORS
  // Centered at Aircraft Center of Gravity (0, 0, 0)
  const forceVectorsGroup = new THREE.Group();
  forceVectorsGroup.name = 'ForceVectors';
  planeBody.add(forceVectorsGroup);

  // Forward Vector: THRUST (Green) - Points along aircraft forward axis (-Z)
  const thrustDir = new THREE.Vector3(0, 0, -1);
  const thrustArrow = new THREE.ArrowHelper(thrustDir, new THREE.Vector3(0, 0, 0), 1.5, 0x10b981, 0.35, 0.22);
  forceVectorsGroup.add(thrustArrow);

  // Backward Vector: DRAG (Red) - Points opposite forward (+Z)
  const dragDir = new THREE.Vector3(0, 0, 1);
  const dragArrow = new THREE.ArrowHelper(dragDir, new THREE.Vector3(0, 0, 0), 1.5, 0xef4444, 0.35, 0.22);
  forceVectorsGroup.add(dragArrow);

  // Upward Vector: LIFT (Cyan) - Points along aircraft lift normal (+Y)
  const liftDir = new THREE.Vector3(0, 1, 0);
  const liftArrow = new THREE.ArrowHelper(liftDir, new THREE.Vector3(0, 0, 0), 2.0, 0x06b6d4, 0.35, 0.22);
  forceVectorsGroup.add(liftArrow);

  // Downward Vector: WEIGHT (Amber/Yellow) - Points towards Earth Center (-Y)
  const weightDir = new THREE.Vector3(0, -1, 0);
  const weightArrow = new THREE.ArrowHelper(weightDir, new THREE.Vector3(0, 0, 0), 2.0, 0xf59e0b, 0.35, 0.22);
  forceVectorsGroup.add(weightArrow);

  // Function to update vector lengths based on real physics forces (in kN)
  const updateForces = (forces: FlightForces, visible: boolean) => {
    forceVectorsGroup.visible = visible;
    if (!visible) return;

    // Standard scaling: 100 kN ≈ 0.5 units length in 3D
    const thrustLen = Math.max(0.2, (forces.thrust / 350) * 1.8);
    const dragLen = Math.max(0.2, (forces.drag / 350) * 1.8);
    const liftLen = Math.max(0.2, (forces.lift / 1500) * 2.2);
    const weightLen = Math.max(0.2, (forces.weight / 1500) * 2.2);

    thrustArrow.setLength(thrustLen, 0.35, 0.22);
    dragArrow.setLength(dragLen, 0.35, 0.22);
    liftArrow.setLength(liftLen, 0.35, 0.22);
    weightArrow.setLength(weightLen, 0.35, 0.22);
  };

  let strobeTimer = 0;

  // Animation update per frame
  const updateAnimations = (delta: number, throttle: number, altitude: number, spoilers: number) => {
    // 1. Turbine blade spin
    const spinSpeed = delta * (15 + throttle * 45);
    leftTurbine.rotation.z += spinSpeed;
    rightTurbine.rotation.z -= spinSpeed;

    // 2. Spoiler deployment deflection
    const spoilerAngle = -spoilers * 0.7; // up to ~40 deg
    spoilersLeft.rotation.x = spoilerAngle;
    spoilersRight.rotation.x = spoilerAngle;

    // 3. Strobe beacon flash (every 1.2s brief double pulse)
    strobeTimer = (strobeTimer + delta) % 1.2;
    if (strobeTimer < 0.08 || (strobeTimer > 0.2 && strobeTimer < 0.28)) {
      strobeLight.intensity = 4.0;
    } else {
      strobeLight.intensity = 0.0;
    }

    // 4. Contrails only visible at high cruise altitude (> 7,500m / 25,000ft) and throttle > 0.25
    const isContrailAlt = altitude > 7500 && throttle > 0.25;
    leftContrail.visible = isContrailAlt;
    rightContrail.visible = isContrailAlt;
  };

  const dispose = () => {
    fuselageGeo.dispose();
    bellyGeo.dispose();
    noseGeo.dispose();
    cockpitGeo.dispose();
    windowStripGeo.dispose();
    tailConeGeo.dispose();
    wingGeo.dispose();
    wingletGeo.dispose();
    spoilerGeo.dispose();
    tailGeo.dispose();
    hStabGeo.dispose();
    leftTrailGeo.dispose();
    rightTrailGeo.dispose();
    fuselageMat.dispose();
    bellyStripeMat.dispose();
    wingMat.dispose();
    wingletMat.dispose();
    metalMat.dispose();
    engineExhaustMat.dispose();
    glassMat.dispose();
    contrailMat.dispose();
  };

  return {
    root,
    planeBody,
    leftTurbine,
    rightTurbine,
    leftContrail,
    rightContrail,
    spoilersLeft,
    spoilersRight,
    navLightLeft,
    navLightRight,
    strobeLight,
    forceVectorsGroup,
    thrustArrow,
    dragArrow,
    liftArrow,
    weightArrow,
    updateForces,
    updateAnimations,
    dispose,
  };
}
