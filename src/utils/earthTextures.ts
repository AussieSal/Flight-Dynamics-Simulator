import * as THREE from 'three';

// Procedural generation of Earth Day, Night, and Cloud textures using Canvas 2D
export function generateEarthTextures() {
  const width = 2048;
  const height = 1024;

  // 1. EARTH DAY ALBEDO TEXTURE
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = width;
  dayCanvas.height = height;
  const ctx = dayCanvas.getContext('2d')!;

  // Deep ocean background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#0a2342'); // Arctic ocean
  oceanGrad.addColorStop(0.2, '#0c356a');
  oceanGrad.addColorStop(0.5, '#072448'); // Equatorial deep ocean
  oceanGrad.addColorStop(0.8, '#0c356a');
  oceanGrad.addColorStop(1, '#0a2342'); // Antarctic
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Continental landmass definitions in normalized UV coords (x: 0..1 => -180..180 deg, y: 0..1 => +90..-90 deg)
  // Converting (lat, lon) -> (x, y)
  const toUV = (lon: number, lat: number): [number, number] => {
    const u = ((lon + 180) / 360) * width;
    const v = ((90 - lat) / 180) * height;
    return [u, v];
  };

  const drawPoly = (points: [number, number][], fillStyle: string, strokeStyle?: string) => {
    ctx.beginPath();
    const [startX, startY] = toUV(points[0][0], points[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = toUV(points[i][0], points[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // North America
  drawPoly([
    [-168, 65], [-140, 70], [-125, 75], [-85, 70], [-60, 50],
    [-65, 45], [-75, 35], [-80, 25], [-90, 20], [-100, 20],
    [-105, 23], [-115, 30], [-124, 38], [-125, 48], [-140, 58],
    [-165, 60]
  ], '#2d5a27', '#1e3f1a');

  // Central America
  drawPoly([
    [-100, 20], [-90, 18], [-83, 10], [-77, 8], [-80, 7], [-85, 12], [-95, 16]
  ], '#205018');

  // South America
  drawPoly([
    [-77, 8], [-60, 10], [-50, 4], [-35, -5], [-38, -15],
    [-45, -23], [-53, -33], [-65, -45], [-70, -55], [-75, -50],
    [-72, -35], [-78, -15], [-80, -2], [-78, 5]
  ], '#235e23', '#194519');

  // Amazon rainforest patch
  drawPoly([
    [-70, 2], [-55, 3], [-48, -5], [-55, -12], [-68, -8]
  ], '#164816');

  // Eurasia (Europe + Asia)
  drawPoly([
    [-10, 36], [0, 42], [5, 52], [10, 58], [25, 71],
    [50, 68], [80, 73], [120, 74], [160, 70], [170, 65],
    [140, 50], [130, 40], [120, 32], [108, 20], [100, 10],
    [98, 22], [90, 22], [80, 10], [75, 22], [65, 25],
    [55, 25], [50, 30], [35, 32], [28, 40], [15, 40],
    [-5, 36]
  ], '#3d6332', '#2a4722');

  // Scandinavia
  drawPoly([
    [5, 58], [15, 56], [22, 60], [28, 70], [20, 71], [10, 64]
  ], '#2d4d29');

  // British Isles
  drawPoly([
    [-10, 52], [-5, 58], [-2, 58], [1, 51], [-5, 50]
  ], '#355e2b');

  // Africa
  drawPoly([
    [-17, 15], [-12, 28], [-5, 36], [10, 37], [25, 32],
    [32, 31], [43, 12], [51, 10], [42, -5], [35, -25],
    [26, -34], [18, -34], [12, -18], [9, 4], [0, 6],
    [-15, 11]
  ], '#3f5d2d', '#2c431e');

  // Sahara Desert
  drawPoly([
    [-15, 28], [5, 33], [30, 30], [35, 22], [25, 17], [5, 17], [-12, 20]
  ], '#c89d58');

  // Arabian Peninsula Desert
  drawPoly([
    [36, 28], [50, 30], [58, 24], [55, 16], [45, 13], [42, 17]
  ], '#c49a52');

  // Indian Subcontinent
  drawPoly([
    [68, 24], [78, 30], [88, 25], [82, 12], [76, 8], [72, 18]
  ], '#2a632a');

  // Australia
  drawPoly([
    [114, -22], [125, -15], [136, -12], [142, -11], [150, -22],
    [153, -28], [148, -37], [138, -35], [130, -32], [116, -34],
    [114, -26]
  ], '#8d683a', '#6e512c');

  // Australian Outback (red sand center)
  drawPoly([
    [122, -22], [138, -20], [140, -28], [128, -30]
  ], '#b85d28');

  // Japan
  drawPoly([
    [130, 32], [136, 35], [141, 42], [145, 44], [141, 38], [132, 33]
  ], '#2d612e');

  // Greenland (ice sheet)
  drawPoly([
    [-55, 60], [-40, 60], [-20, 70], [-25, 80], [-45, 83], [-60, 76]
  ], '#e8f1f5', '#c8dbe6');

  // Antarctica (polar ice)
  ctx.fillStyle = '#f0f6fa';
  ctx.fillRect(0, height * 0.9, width, height * 0.1);

  // Arctic Sea Ice
  ctx.fillStyle = '#e5eff5';
  ctx.fillRect(0, 0, width, height * 0.06);

  // Subtle Lat/Lon navigation graticule (semi-transparent)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  // Parallels (every 30 degrees)
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = toUV(0, lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // Meridians (every 45 degrees)
  for (let lon = -180; lon < 180; lon += 45) {
    const [x] = toUV(lon, 0);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Equator highlight
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
  const [, eqY] = toUV(0, 0);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(width, eqY);
  ctx.stroke();

  // 2. EARTH NIGHT LIGHTS TEXTURE
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = width;
  nightCanvas.height = height;
  const nCtx = nightCanvas.getContext('2d')!;

  nCtx.fillStyle = '#010308';
  nCtx.fillRect(0, 0, width, height);

  // Major global metropolitan clusters and flight corridors
  const cityClusters: [number, number, number, number][] = [
    // [lon, lat, radius, count]
    [-74, 40.7, 18, 55],    // New York / East Coast Megalopolis
    [-87.6, 41.8, 14, 35],  // Chicago / Great Lakes
    [-118, 34, 16, 45],     // Los Angeles / California Coast
    [-122, 37.7, 12, 30],   // San Francisco Bay
    [-95, 29.7, 12, 28],    // Texas / Houston / Dallas
    [-0.1, 51.5, 22, 65],   // London / UK
    [2.3, 48.8, 20, 60],    // Paris / Western Europe
    [13.4, 52.5, 18, 50],   // Berlin / Central Europe
    [37.6, 55.7, 16, 40],   // Moscow
    [55.3, 25.2, 14, 38],   // Dubai / UAE / Persian Gulf
    [77.2, 28.6, 18, 50],   // New Delhi / North India
    [72.8, 19.0, 16, 45],   // Mumbai / West India
    [116.4, 39.9, 20, 60],  // Beijing
    [121.4, 31.2, 22, 65],  // Shanghai / Yangtze Delta
    [113.2, 23.1, 20, 55],  // Pearl River Delta / HK
    [139.7, 35.6, 24, 75],  // Tokyo / Kanto Plain
    [126.9, 37.5, 16, 45],  // Seoul
    [103.8, 1.3, 12, 30],   // Singapore
    [151.2, -33.8, 14, 35], // Sydney
    [144.9, -37.8, 12, 30], // Melbourne
    [-46.6, -23.5, 18, 50], // Sao Paulo / Rio
    [-58.3, -34.6, 14, 35], // Buenos Aires
    [31.2, 30.0, 14, 35],   // Cairo / Nile Delta
    [28.0, -26.2, 12, 30]   // Johannesburg
  ];

  for (const [cLon, cLat, rad, count] of cityClusters) {
    const [cx, cy] = toUV(cLon, cLat);
    const grad = nCtx.createRadialGradient(cx, cy, 1, cx, cy, rad * 2);
    grad.addColorStop(0, 'rgba(255, 220, 140, 0.85)');
    grad.addColorStop(0.3, 'rgba(255, 180, 80, 0.4)');
    grad.addColorStop(0.7, 'rgba(230, 130, 40, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    nCtx.fillStyle = grad;
    nCtx.beginPath();
    nCtx.arc(cx, cy, rad * 2, 0, Math.PI * 2);
    nCtx.fill();

    // Speckled city points
    nCtx.fillStyle = '#fffae0';
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.6) * rad * 1.5;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      nCtx.fillRect(px, py, 1.5, 1.5);
    }
  }

  // 3. CLOUDS TEXTURE (Swirling cloud bands & weather systems)
  const cloudsCanvas = document.createElement('canvas');
  cloudsCanvas.width = width;
  cloudsCanvas.height = height;
  const cCtx = cloudsCanvas.getContext('2d')!;

  cCtx.fillStyle = '#000000';
  cCtx.fillRect(0, 0, width, height);

  // Generate fractal clouds using sine/cosine harmonics
  const imgData = cCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  for (let y = 0; y < height; y++) {
    const latFactor = Math.sin((y / height) * Math.PI); // More clouds around ITCZ (equator) and temperate storms
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * 12;
      const ny = (y / height) * 6;
      
      const v1 = Math.sin(nx * 1.8 + Math.cos(ny * 2.2));
      const v2 = Math.sin(nx * 3.5 + ny * 3.1 + Math.sin(nx * 0.8));
      const v3 = Math.cos(nx * 7.1 - ny * 5.4);
      const v4 = Math.sin(nx * 14.0 + ny * 11.0) * 0.5;
      
      let sum = (v1 * 0.4 + v2 * 0.3 + v3 * 0.2 + v4 * 0.1) * latFactor;
      // Threshold for distinct cloud patches
      let alpha = 0;
      if (sum > 0.05) {
        alpha = Math.min(255, Math.floor(((sum - 0.05) / 0.5) * 230));
      }

      const idx = (y * width + x) * 4;
      data[idx] = 255;     // R
      data[idx + 1] = 255; // G
      data[idx + 2] = 255; // B
      data[idx + 3] = alpha; // Alpha
    }
  }
  cCtx.putImageData(imgData, 0, 0);

  // Create Three.js textures
  const dayTexture = new THREE.CanvasTexture(dayCanvas);
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.wrapS = THREE.RepeatWrapping;
  dayTexture.wrapT = THREE.ClampToEdgeWrapping;

  const nightTexture = new THREE.CanvasTexture(nightCanvas);
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.wrapS = THREE.RepeatWrapping;
  nightTexture.wrapT = THREE.ClampToEdgeWrapping;

  const cloudsTexture = new THREE.CanvasTexture(cloudsCanvas);
  cloudsTexture.wrapS = THREE.RepeatWrapping;
  cloudsTexture.wrapT = THREE.ClampToEdgeWrapping;

  return { dayTexture, nightTexture, cloudsTexture };
}

// Custom Earth Shader Material blending Day and Night textures based on Sun Direction
export function createEarthMaterial(
  dayTexture: THREE.Texture,
  nightTexture: THREE.Texture,
  sunDirection: THREE.Vector3
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: dayTexture },
      nightMap: { value: nightTexture },
      sunDirection: { value: sunDirection.clone().normalize() }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D dayMap;
      uniform sampler2D nightMap;
      uniform vec3 sunDirection;

      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      void main() {
        vec3 norm = normalize(vNormal);
        // Sun dot product
        float sunDot = dot(norm, sunDirection);
        
        // Smooth transition around terminator
        float dayFactor = smoothstep(-0.2, 0.25, sunDot);

        vec4 dayColor = texture2D(dayMap, vUv);
        vec4 nightColor = texture2D(nightMap, vUv);

        // Diffuse shading on day side + subtle ambient light
        vec3 litDay = dayColor.rgb * (max(0.12, sunDot * 0.95 + 0.1));
        
        // Boost night city lights when on the dark hemisphere
        vec3 nightGlow = nightColor.rgb * 1.5;

        vec3 finalColor = mix(nightGlow, litDay, dayFactor);

        // Subtle atmospheric limb tint at grazing angles
        float limb = 1.0 - max(0.0, dot(norm, vec3(0.0, 0.0, 1.0)));
        vec3 atmosphereGlow = vec3(0.2, 0.5, 0.9) * pow(limb, 3.5) * 0.6 * dayFactor;

        gl_FragColor = vec4(finalColor + atmosphereGlow, 1.0);
      }
    `
  });
}

// Atmospheric Glow Outer Shell
export function createAtmosphereGlowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0x38bdf8) }
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 glowColor;
      varying vec3 vNormal;
      void main() {
        // Fresnel glow strongest at horizon edge
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
        gl_FragColor = vec4(glowColor, intensity * 0.75);
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
}
