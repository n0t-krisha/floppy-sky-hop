import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('.game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
function resizeRenderer() {
  const width = Math.min(640, Math.max(1, Math.floor(innerWidth / 4)));
  renderer.setSize(width, Math.max(1, Math.floor(width * innerHeight / innerWidth)), false);
}
resizeRenderer();
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#b9e5fb');
scene.fog = new THREE.Fog('#c8eafb', 26, 102);

const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 130);
camera.position.set(0, 7, 12);
camera.lookAt(0, 1, 0);
const cameraTarget = new THREE.Vector3();
let cameraYaw = 0;
let cameraPitch = .44;
let pointerDrag = null;

scene.add(new THREE.HemisphereLight('#f5fcff', '#b9cfce', 2.05));
const sun = new THREE.DirectionalLight('#fff3d6', 2.5);
sun.position.set(-8, 15, 9);
scene.add(sun);

const mats = {
  cloud: new THREE.MeshStandardMaterial({ color: '#fffefa', roughness: 1, flatShading: true }),
  cloudShade: new THREE.MeshStandardMaterial({ color: '#e8f5f6', roughness: 1, flatShading: true }),
  beige: new THREE.MeshStandardMaterial({ color: '#dcbf99', roughness: 1, flatShading: true }),
  beigeLight: new THREE.MeshStandardMaterial({ color: '#eddbbf', roughness: 1, flatShading: true }),
  beigeDark: new THREE.MeshStandardMaterial({ color: '#bd9b78', roughness: 1, flatShading: true }),
  pink: new THREE.MeshStandardMaterial({ color: '#ecabbc', roughness: 1, flatShading: true }),
  ink: new THREE.MeshStandardMaterial({ color: '#6b6470', roughness: 1, flatShading: true }),
  green: new THREE.MeshStandardMaterial({ color: '#a9cb9b', roughness: 1, flatShading: true }),
  honey: new THREE.MeshStandardMaterial({ color: '#f4cb79', roughness: .62, flatShading: true }),
  honeyLight: new THREE.MeshStandardMaterial({ color: '#ffe8a1', roughness: .5, flatShading: true }),
  yarnPink: new THREE.MeshStandardMaterial({ color: '#f5bccb', roughness: 1, flatShading: true }),
  yarnBlue: new THREE.MeshStandardMaterial({ color: '#b6e1ef', roughness: 1, flatShading: true }),
  yarnCream: new THREE.MeshStandardMaterial({ color: '#fff3d9', roughness: 1, flatShading: true }),
};

function box(parent, material, x, y, z, sx, sy, sz) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sphere(parent, material, x, y, z, sx, sy, sz, detail = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 5 + detail, 3 + detail), material);
  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const baseRoute = [
  { x: 0, z: 2.5, y: 0, w: 5.6, d: 8.3 },
  { x: -1.4, z: -3.5, y: .25, w: 3.7, d: 3.7 },
  { x: .4, z: -8.5, y: .65, w: 3.5, d: 3.6 },
  { x: 1.7, z: -13.6, y: .25, w: 3.6, d: 3.8 },
  { x: .1, z: -18.7, y: .65, w: 3.6, d: 3.7 },
  { x: -1.5, z: -23.5, y: .1, w: 3.6, d: 3.6 },
  { x: .1, z: -28.3, y: .6, w: 3.8, d: 3.7 },
  { x: 1.5, z: -33.1, y: .15, w: 5.6, d: 5.6 },
  { x: -.1, z: -38.1, y: .7, w: 3.8, d: 3.7 },
  { x: -1.7, z: -42.9, y: .15, w: 3.7, d: 3.7 },
  { x: -.1, z: -47.8, y: .6, w: 3.9, d: 3.8 },
  { x: 1.5, z: -52.7, y: .2, w: 4.1, d: 3.9 },
  { x: 0, z: -58.1, y: .65, w: 6.6, d: 6.2 },
];
const BASE_LEVEL_THEMES = [
  { sky: '#b9e5fb', fog: '#c8eafb', cloud: '#fffefa', shade: '#e8f5f6' },
  { sky: '#f5cbdc', fog: '#f8dfdf', cloud: '#fff0f4', shade: '#eed2df' },
  { sky: '#bfe8cc', fog: '#d4eed6', cloud: '#efffe8', shade: '#d2e7c7' },
  { sky: '#f2d79f', fog: '#f5e5bb', cloud: '#fff0d6', shade: '#eddbb9' },
  { sky: '#acdfe5', fog: '#d0edf0', cloud: '#ecfcfc', shade: '#cee5e8' },
  { sky: '#f2c1a9', fog: '#f5ded0', cloud: '#ffebe0', shade: '#ebcfc0' },
];
const LEVEL_COUNT = 50;
function themeColor(hue, saturation, lightness) {
  return `#${new THREE.Color().setHSL(hue, saturation, lightness).getHexString()}`;
}
const LEVEL_THEMES = Array.from({ length: LEVEL_COUNT }, (_, levelIndex) => {
  if (levelIndex < BASE_LEVEL_THEMES.length) return BASE_LEVEL_THEMES[levelIndex];
  const hue = (levelIndex * .61803398875 + .137) % 1;
  return {
    sky: themeColor(hue, .55, .83),
    fog: themeColor(hue, .39, .89),
    cloud: themeColor(hue, .2, .95),
    shade: themeColor(hue, .27, .83),
  };
});
const BASE_LEVEL_PATHS = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, -.75, .9, 1.45, -.6, -1.45, .75, 1.35, .2, -1.15, -.55, 1.25, 0],
  [0, 1.35, -.7, -1.4, 1.15, .7, -1.45, -.35, 1.35, 1.4, -.95, -1.3, 0],
  [0, -1.3, -1.4, .9, 1.4, -.25, -1.35, -1.1, 1.25, 1.4, .25, -1.2, 0],
  [0, 1.35, .35, -1.2, -1.35, 1, -.65, 1.35, .95, -1.3, -1.1, .85, 0],
  [0, -1.3, 1.3, .75, -1.4, -1.3, -.55, 1.4, 1.2, -.75, -1.3, 1.25, 0],
];
function makeLevelPath(seed) {
  let state = (seed + 1) * 2654435761 >>> 0;
  let lane = 0;
  const path = Array(baseRoute.length).fill(0);
  for (let index = 1; index < baseRoute.length - 1; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    lane = THREE.MathUtils.clamp(lane + ((state % 3) - 1) * .4, -1.6, 1.6);
    path[index] = lane;
  }
  return path;
}
const LEVEL_PATHS = [
  ...BASE_LEVEL_PATHS,
  ...Array.from({ length: LEVEL_COUNT - BASE_LEVEL_PATHS.length }, (_, index) => makeLevelPath(index + BASE_LEVEL_PATHS.length)),
];
const BASE_LEVEL_TYPES = ['cloud-run', 'glass-bridge', 'stepping-stones', 'honey-maze', 'yarn-alley', 'moving-clouds'];
const EXTRA_LEVEL_TYPES = ['switchback', 'split-bridge', 'honey-weave', 'yarn-crossings', 'island-chain', 'mixed-hazards', 'cloud-run', 'glass-bridge', 'stepping-stones', 'honey-maze', 'yarn-alley', 'finale'];
const LEVEL_TYPES = Array.from({ length: LEVEL_COUNT }, (_, levelIndex) => {
  if (levelIndex < BASE_LEVEL_TYPES.length) return BASE_LEVEL_TYPES[levelIndex];
  const extraIndex = levelIndex - BASE_LEVEL_TYPES.length;
  return EXTRA_LEVEL_TYPES[(extraIndex * 7 + Math.floor(extraIndex / EXTRA_LEVEL_TYPES.length)) % EXTRA_LEVEL_TYPES.length];
});
const LEVEL_FEATURES = Array.from({ length: LEVEL_COUNT }, (_, levelIndex) => ({
  wind: levelIndex >= 2 && levelIndex % 2 === 0,
  fading: levelIndex >= 2 && levelIndex % 4 === 2,
  bounce: levelIndex % 4 === 0,
  boulders: levelIndex >= 4 && levelIndex % 5 === 4,
  moving: levelIndex === 5,
}));
function stageIndexFor(level) {
  return THREE.MathUtils.clamp(Math.floor(level) - 1, 0, LEVEL_COUNT - 1);
}
const PLATFORMS_PER_LEVEL = baseRoute.length;
const route = [];
let levelStartZ = baseRoute[0].z;
for (let levelIndex = 0; levelIndex < LEVEL_COUNT; levelIndex += 1) {
  const difficulty = levelIndex / (LEVEL_COUNT - 1);
  for (let platformIndex = 0; platformIndex < baseRoute.length; platformIndex += 1) {
    const platform = baseRoute[platformIndex];
    const distance = baseRoute[0].z - platform.z;
    const levelType = LEVEL_TYPES[levelIndex];
    const spec = {
      ...platform,
      x: platform.x + LEVEL_PATHS[levelIndex][platformIndex] + difficulty * .12 + Math.sin(levelIndex * Math.PI / 3) * .16,
      z: levelStartZ - distance * (1 + difficulty * .025),
      y: platform.y + difficulty * .08,
      w: platform.w * (1 - difficulty * .1),
      d: platform.d * (1 - difficulty * .1),
      level: levelIndex + 1,
      type: levelType,
      fading: LEVEL_FEATURES[levelIndex].fading && levelType !== 'glass-bridge' && levelType !== 'split-bridge' && [3, 6, 9].includes(platformIndex),
    };
    if (levelType === 'cloud-run') {
      spec.x = levelIndex === 0 ? 0 : Math.sin((platformIndex + 1) * (levelIndex + 2) * 1.618) * .5;
      spec.y = 0;
      spec.w = levelIndex === 0 ? 10.2 : 9.2 + (platformIndex + levelIndex) % 3 * .35;
      spec.d = levelIndex === 0 ? 6.1 : 6.1 + (platformIndex * 2 + levelIndex) % 3 * .25;
      spec.z = levelStartZ - distance;
    } else if (levelType === 'moving-clouds') {
      const courseClouds = [
        { x: 0, z: levelStartZ, y: 0, w: 5.6, d: 8.3 },
        { x: 2.2, z: levelStartZ - 4.5, y: .15, w: 3.9, d: 4 },
        { x: -2.2, z: levelStartZ - 7.5, y: .15, w: 3.9, d: 4 },
        { x: 0, z: levelStartZ - 11.5, y: .15, w: 4, d: 4 },
        { x: 0, z: levelStartZ - 15.5, y: .15, w: 3.9, d: 4 },
        { x: 0, z: levelStartZ - 19.5, y: 2.8, w: 4, d: 4 },
        { x: 0, z: levelStartZ - 23.5, y: 2.8, w: 5.8, d: 5.8 },
      ];
      if (platformIndex < courseClouds.length) Object.assign(spec, courseClouds[platformIndex]);
      else spec.hidden = true;
    } else if ((levelType === 'glass-bridge' || levelType === 'split-bridge') && platformIndex > 0 && platformIndex < baseRoute.length - 1) {
      const trueLane = Math.sin((levelIndex + 1) * (platformIndex + 2) * 2.399963) > 0 ? 1 : -1;
      spec.x = trueLane * 1.25;
      spec.z = levelStartZ - distance * (.94 + difficulty * .025);
      spec.w = 3.3 * (1 - difficulty * .08);
      spec.d = 3.8 * (1 - difficulty * .08);
      spec.decoyX = -trueLane * 1.25;
    } else if (levelType === 'switchback') {
      spec.w *= .88;
      spec.d *= .92;
    } else if (levelType === 'island-chain') {
      spec.w *= .84;
      spec.d *= .88;
    }
    const yarnPlatforms = {
      'cloud-run': [3, 6, 9],
      'honey-maze': [7],
      'yarn-alley': [3, 5, 7, 9],
      'yarn-crossings': [3, 5, 7, 9],
      switchback: [2, 5, 8, 10],
      finale: [2, 6, 9],
      'mixed-hazards': [2, 6, 9],
    }[levelType] || [7];
    const hostsLargeObstacle = yarnPlatforms.includes(platformIndex)
      || (LEVEL_FEATURES[levelIndex].boulders && [4, 8].includes(platformIndex))
      || (LEVEL_FEATURES[levelIndex].wind && [4, 8].includes(platformIndex));
    if (hostsLargeObstacle && spec.w < 8) {
      spec.w *= 1.3;
      spec.d *= 1.3;
    }
    route.push(spec);
  }
  if (LEVEL_FEATURES[levelIndex].moving) {
    const stageStart = levelIndex * PLATFORMS_PER_LEVEL;
    const firstMover = route[stageStart + 1];
    const secondMover = route[stageStart + 2];
    const middleX = 0;
    const range = 3.2;
    firstMover.motion = { type: 'paired-horizontal', centerX: middleX, slot: 1, range, phaseOffset: 0 };
    secondMover.motion = { type: 'paired-horizontal', centerX: middleX, slot: -1, range, phaseOffset: 0 };
    const lowerPlatform = route[stageStart + 3];
    const verticalPlatform = route[stageStart + 4];
    verticalPlatform.motion = { type: 'vertical', lowY: lowerPlatform.y, highY: route[stageStart + 5].y, travelTime: 3, phaseOffset: 0 };
  }
  const levelEnd = route[levelIndex * PLATFORMS_PER_LEVEL + (LEVEL_TYPES[levelIndex] === 'moving-clouds' ? 6 : PLATFORMS_PER_LEVEL - 1)];
  levelStartZ = levelEnd.z - 6.2;
}
const clouds = [];
const routeClouds = [];
const yarnRollAxis = new THREE.Vector3();
const cloudPuffGeometry = new THREE.SphereGeometry(1, 5, 3);
const cloudPuffTransform = new THREE.Object3D();

for (let index = 0; index < route.length; index += 1) {
  const spec = route[index];
  const theme = LEVEL_THEMES[spec.level - 1];
  const puffColor = new THREE.Color(theme.cloud);
  const group = new THREE.Group();
  group.position.set(spec.x, spec.y, spec.z);
  const baseMaterial = mats.cloudShade.clone();
  baseMaterial.color.set(theme.shade);
  const base = new THREE.Mesh(new THREE.BoxGeometry(spec.w * .83, .47, spec.d * .78), baseMaterial);
  base.position.y = .09;
  base.receiveShadow = true;
  base.castShadow = true;
  group.add(base);
  const count = index === 0 || index === route.length - 1 ? 8 : 6;
  const puffs = new THREE.InstancedMesh(cloudPuffGeometry, mats.cloud, count + 1);
  puffs.castShadow = false;
  puffs.receiveShadow = false;
  for (let puffIndex = 0; puffIndex < count; puffIndex += 1) {
    const angle = Math.PI * 2 * puffIndex / count;
    const radiusX = spec.w * (index === 0 || index === route.length - 1 ? .32 : .34);
    const radiusZ = spec.d * (index === 0 || index === route.length - 1 ? .32 : .32);
    cloudPuffTransform.position.set(Math.cos(angle) * radiusX, .34 + (puffIndex % 2) * .035, Math.sin(angle) * radiusZ);
    cloudPuffTransform.scale.set(spec.w * .18, .42 + (puffIndex % 2) * .04, spec.d * .19);
    cloudPuffTransform.updateMatrix();
    puffs.setMatrixAt(puffIndex, cloudPuffTransform.matrix);
    puffs.setColorAt(puffIndex, puffColor);
  }
  cloudPuffTransform.position.set(0, .48, 0);
  cloudPuffTransform.scale.set(spec.w * .28, .36, spec.d * .29);
  cloudPuffTransform.updateMatrix();
  puffs.setMatrixAt(count, cloudPuffTransform.matrix);
  puffs.setColorAt(count, puffColor);
  puffs.instanceMatrix.needsUpdate = true;
  puffs.instanceColor.needsUpdate = true;
  group.add(puffs);
  group.userData.index = index;
  scene.add(group);
  group.visible = !spec.hidden;
  const cloud = { ...spec, top: .82, group, floatOffset: index * .8, solid: !spec.hidden, collisionActive: !spec.hidden, fadeState: 'ready', fadeTimer: 0 };
  clouds.push(cloud);
  routeClouds.push(cloud);
}

for (let index = 0; index < route.length; index += 1) {
  const spec = route[index];
  if (spec.decoyX === undefined) continue;
  const platform = routeClouds[index];
  const group = platform.group.clone(true);
  group.position.x = spec.decoyX;
  scene.add(group);
  clouds.push({ ...platform, x: spec.decoyX, group, solid: false });
}

function makeBunny() {
  const bunny = new THREE.Group();
  const body = new THREE.Group();
  bunny.add(body);
  sphere(body, mats.beige, 0, -.12, .01, .38, .34, .34, 1);
  sphere(body, mats.beigeLight, 0, -.18, -.3, .26, .24, .13, 0);
  sphere(body, mats.beigeLight, 0, .35, -.19, .36, .34, .32, 1);
  const leftEar = box(body, mats.beigeLight, -.22, .77, -.18, .18, .58, .16);
  const rightEar = box(body, mats.beigeLight, .22, .77, -.18, .18, .58, .16);
  box(body, mats.pink, -.22, .78, -.271, .09, .39, .025);
  box(body, mats.pink, .22, .78, -.271, .09, .39, .025);
  sphere(body, mats.pink, -.315, .25, -.438, .075, .045, .025, 0);
  sphere(body, mats.pink, .315, .25, -.438, .075, .045, .025, 0);
  sphere(body, mats.ink, -.115, .39, -.482, .045, .055, .025, 0);
  sphere(body, mats.ink, .115, .39, -.482, .045, .055, .025, 0);
  sphere(body, mats.pink, 0, .27, -.495, .055, .045, .025, 0);
  box(body, mats.beigeDark, -.19, -.43, -.1, .23, .13, .29);
  box(body, mats.beigeDark, .19, -.43, -.1, .23, .13, .29);
  sphere(body, mats.cloud, 0, -.1, .36, .13, .13, .13, 0);
  bunny.userData.body = body;
  bunny.userData.ears = [leftEar, rightEar];
  scene.add(bunny);
  return bunny;
}

const bunny = makeBunny();
const bunnyHalfHeight = .54;
const startCloud = routeClouds[0];
bunny.position.set(startCloud.x, startCloud.top + startCloud.group.position.y + bunnyHalfHeight, startCloud.z + 1.15);

function makeStar() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: '#ffdf85', emissive: '#e9aa44', emissiveIntensity: .52, flatShading: true });
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.3, 0), material);
  star.rotation.z = Math.PI / 4;
  star.castShadow = true;
  group.add(star);
  const glint = new THREE.Mesh(new THREE.BoxGeometry(.08, .54, .08), new THREE.MeshBasicMaterial({ color: '#fff7d9' }));
  glint.rotation.z = Math.PI / 4;
  group.add(glint);
  return group;
}

const itemDefinitions = [
  { id: 'star', name: 'Wish Star', icon: '✦', description: 'A little wish from above.', positions: [[-1.4, -3.5], [.4, -8.5], [1.7, -13.6], [-1.5, -23.5], [1.5, -33.1], [-1.7, -42.9]] },
  { id: 'blossom', name: 'Cloud Blossom', icon: '✿', description: 'A flower that loves the sky.', positions: [[.4, -8.5, -.8], [.1, -28.3, .7]] },
  { id: 'feather', name: 'Bird Feather', icon: '羽', description: 'Left by a passing friend.', positions: [[.1, -18.7]] },
  { id: 'rainbow', name: 'Rainbow Pin', icon: '🌈', description: 'A tiny piece of sunshine.', positions: [[-1.7, -42.9, .8]] },
];
const firstLevelItems = itemDefinitions.map(item => item.positions.map(([x, z, offsetX = 0]) => [x, z, offsetX]));
for (let levelIndex = 1; levelIndex < LEVEL_COUNT; levelIndex += 1) {
  for (let itemIndex = 0; itemIndex < itemDefinitions.length; itemIndex += 1) {
    for (const [x, z, offsetX] of firstLevelItems[itemIndex]) {
      const platformIndex = baseRoute.findIndex(platform => Math.abs(platform.z - z) < .01);
      if (platformIndex < 0) continue;
      const destinationPlatformIndex = levelIndex === 5 ? 1 + (platformIndex - 1 + PLATFORMS_PER_LEVEL - 1) % 5 : platformIndex;
      const source = route[platformIndex];
      const destination = route[levelIndex * PLATFORMS_PER_LEVEL + destinationPlatformIndex];
      itemDefinitions[itemIndex].positions.push([destination.x + x + offsetX - source.x, destination.z, 0, levelIndex + 1]);
    }
  }
}
const pickups = [];
for (const definition of itemDefinitions) {
  for (const [x, z, offsetX = 0, level = 1] of definition.positions) {
    const root = definition.id === 'star' ? makeStar() : new THREE.Group();
    if (definition.id !== 'star') {
      const material = definition.id === 'blossom' ? mats.pink : definition.id === 'feather' ? mats.cloud : mats.yarnBlue;
      const center = sphere(root, material, 0, 0, 0, .12, .12, .12, 0);
      if (definition.id === 'blossom') {
        for (let petal = 0; petal < 5; petal += 1) {
          const angle = petal * Math.PI * 2 / 5;
          sphere(root, mats.pink, Math.cos(angle) * .15, Math.sin(angle) * .15, 0, .1, .1, .06, 0);
        }
        sphere(root, mats.honeyLight, 0, 0, -.07, .07, .07, .07, 0);
      } else if (definition.id === 'feather') {
        center.rotation.z = -.55;
        center.scale.set(.11, .33, .05);
        for (let barb = -2; barb <= 2; barb += 1) box(root, mats.cloudShade, barb * .055, barb * .06, -.03, .1, .035, .03).rotation.z = -.45;
      } else {
        const charm = new THREE.Mesh(new THREE.TorusGeometry(.21, .055, 3, 8, Math.PI), mats.yarnBlue);
        charm.position.z = -.05;
        root.add(charm);
        const arch = new THREE.Mesh(new THREE.TorusGeometry(.21, .055, 3, 8, Math.PI), mats.pink);
        arch.rotation.z = Math.PI;
        arch.position.z = -.05;
        root.add(arch);
      }
    }
    const platform = routeClouds.find(cloud => Math.abs(cloud.z - z) < .01);
    root.position.set(x + offsetX, 1.76, z);
    scene.add(root);
    pickups.push({
      ...definition,
      root,
      platform,
      offsetX: root.position.x - platform.x,
      offsetZ: root.position.z - platform.z,
      level,
      active: true,
      offset: Math.random() * Math.PI * 2,
    });
  }
}

function makeHoney(cloud, offsetX = .35, offsetZ = 0, stretch = 1) {
  const group = new THREE.Group();
  const puddle = new THREE.Mesh(new THREE.CylinderGeometry(.55, .65, .36, 7), mats.honey);
  puddle.position.y = .9;
  puddle.scale.set(1.4 * stretch, 1, .8);
  puddle.receiveShadow = true;
  group.add(puddle);
  for (let index = 0; index < 5; index += 1) {
    const angle = Math.PI * 2 * index / 5;
    sphere(group, mats.honeyLight, Math.cos(angle) * .38, .97, Math.sin(angle) * .22, .09, .045, .08, 0);
  }
  const drop = sphere(group, mats.honeyLight, -.52, 1.08, .02, .11, .12, .1, 0);
  drop.userData.bob = .2;
  group.position.set(cloud.x + offsetX, cloud.group.position.y, cloud.z + offsetZ);
  scene.add(group);
  return { root: group, cloud, x: group.position.x, z: group.position.z, offsetX, offsetZ, radiusX: .9 * stretch, radiusZ: .55, type: 'honey' };
}

function makeYarn(cloud, options = {}) {
  const group = new THREE.Group();
  const roller = new THREE.Group();
  roller.position.y = 1.2;
  group.add(roller);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.46, 1), mats.yarnPink);
  ball.castShadow = true;
  roller.add(ball);
  for (let index = 0; index < 3; index += 1) {
    const strand = new THREE.Mesh(new THREE.TorusGeometry(.34, .06, 3, 8), [mats.yarnBlue, mats.yarnCream, mats.yarnPink][index]);
    strand.rotation.set(index * .8, index * .72, index * .9);
    roller.add(strand);
  }
  for (let index = 0; index < 5; index += 1) {
    const angle = index * Math.PI * 2 / 5;
    sphere(roller, [mats.yarnBlue, mats.yarnCream, mats.yarnPink][index % 3], Math.cos(angle) * .31, Math.sin(angle) * .24, .27, .12, .12, .1, 0);
  }
  const centerX = cloud.x + (options.offsetX || 0);
  const centerZ = cloud.z + (options.offsetZ || 0);
  const orbitX = options.trackX ?? cloud.w / 2 - .45;
  const orbitZ = options.trackZ ?? cloud.d / 2 - .45;
  group.position.set(centerX, cloud.group.position.y, centerZ + orbitZ);
  scene.add(group);
  const direction = options.direction ?? 1;
  return { root: group, roller, cloud, x: group.position.x, z: group.position.z, centerX, centerZ, anchorOffsetX: centerX - cloud.x, anchorOffsetZ: centerZ - cloud.z, orbitX, orbitZ, phase: 0, rollAngle: 0, direction, baseDirection: direction, type: 'yarn' };
}

function makeBounceFlower(cloud, offsetX = 0) {
  const root = new THREE.Group();
  root.position.set(cloud.x + offsetX, cloud.group.position.y, cloud.z);
  for (let petal = 0; petal < 6; petal += 1) {
    const angle = petal * Math.PI / 3;
    sphere(root, mats.pink, Math.cos(angle) * .3, 1.05, Math.sin(angle) * .3, .2, .13, .18, 0);
  }
  sphere(root, mats.honeyLight, 0, 1.12, 0, .2, .18, .2, 0);
  box(root, mats.green, -.37, .62, 0, .32, .09, .17).rotation.z = -.35;
  box(root, mats.green, .37, .62, 0, .32, .09, .17).rotation.z = .35;
  scene.add(root);
  return { root, cloud, offsetX, cooldown: 0 };
}

function makeWindGust(cloud, offsetX, offsetZ, direction) {
  const root = new THREE.Group();
  root.position.set(cloud.x + offsetX, cloud.group.position.y + 1.65, cloud.z + offsetZ);
  const material = new THREE.MeshBasicMaterial({ color: '#9bd8e5', transparent: true, opacity: .62, depthWrite: false });
  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.55 + index * .22, .035, 4, 16), material);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = index * .24;
    root.add(ring);
  }
  scene.add(root);
  return { root, cloud, offsetX, offsetZ, direction, phase: 0 };
}

function makeCloudBoulder(cloud, direction = 1) {
  const root = new THREE.Group();
  sphere(root, mats.cloudShade, 0, 0, 0, .72, .66, .64, 2);
  sphere(root, mats.cloud, -.34, .28, .12, .3, .28, .29, 1);
  sphere(root, mats.cloud, .28, .22, -.2, .34, .3, .31, 1);
  root.position.set(cloud.x, cloud.group.position.y + 1.02, cloud.z);
  scene.add(root);
  return { root, cloud, x: root.position.x, z: root.position.z, centerX: cloud.x, centerZ: cloud.z, trackX: Math.max(.7, cloud.w / 2 - .75), phase: 0, direction, hitCooldown: 0, type: 'boulder' };
}

const hazards = [];
const windGusts = [];
const bounceFlowers = [];
for (let levelIndex = 0; levelIndex < LEVEL_COUNT; levelIndex += 1) {
  const firstPlatform = levelIndex * PLATFORMS_PER_LEVEL;
  const levelType = LEVEL_TYPES[levelIndex];
  if (levelType === 'moving-clouds') {
  } else if (levelType === 'cloud-run') {
    for (let obstacleIndex = 0; obstacleIndex < 9; obstacleIndex += 1) {
      const cloud = routeClouds[firstPlatform + 1 + obstacleIndex];
      const laneX = levelIndex === 0
        ? obstacleIndex % 2 ? 2.8 : -2.8
        : Math.sin((levelIndex + 1) * (obstacleIndex + 1) * 2.4) * 3.1;
      const laneZ = levelIndex === 0 ? obstacleIndex % 3 - 1 : Math.cos((levelIndex + 1) * (obstacleIndex + 1)) * .8;
      hazards.push({ ...makeHoney(cloud, laneX, laneZ, 1.25), level: levelIndex + 1 });
    }
    for (const [platformOffset, laneOffset, direction] of [[3, -1.4, 1], [6, 1.2, -1], [9, -.8, 1]]) {
      const sweepDirection = levelIndex === 0 ? direction : Math.sin(levelIndex * platformOffset) > 0 ? 1 : -1;
      hazards.push({ ...makeYarn(routeClouds[firstPlatform + platformOffset], { trackX: 4.1, trackZ: .08, offsetZ: laneOffset, direction: sweepDirection }), level: levelIndex + 1 });
    }
  } else if (levelType === 'honey-maze' || levelType === 'honey-weave') {
    const honeyPlatforms = levelType === 'honey-maze' ? [2, 3, 4, 6, 8, 9, 10] : [1, 3, 5, 7, 9, 11];
    for (const platformOffset of honeyPlatforms) {
      const cloud = routeClouds[firstPlatform + platformOffset];
      const lane = (platformOffset + levelIndex) % 2 ? -.85 : .85;
      const stretch = 1.15 + levelIndex / (LEVEL_COUNT - 1) * .35;
      hazards.push({ ...makeHoney(cloud, lane, (platformOffset % 3 - 1) * .35, stretch), level: levelIndex + 1 });
    }
    if (levelType === 'honey-maze') hazards.push({ ...makeYarn(routeClouds[firstPlatform + 7]), level: levelIndex + 1 });
  } else if (levelType === 'yarn-alley' || levelType === 'yarn-crossings') {
    for (const [platformOffset, laneOffset] of [[3, -1], [5, .9], [7, -.8], [9, .8]]) {
      hazards.push({ ...makeYarn(routeClouds[firstPlatform + platformOffset], { trackX: 1.5, offsetZ: laneOffset }), level: levelIndex + 1 });
    }
    if (levelType === 'yarn-alley') hazards.push({ ...makeHoney(routeClouds[firstPlatform + 6], 0, 0, 1.6), level: levelIndex + 1 });
  } else if (levelType === 'switchback') {
    for (const [platformOffset, direction] of [[2, 1], [5, -1], [8, 1], [10, -1]]) {
      hazards.push({ ...makeYarn(routeClouds[firstPlatform + platformOffset], { trackX: 1.25, direction }), level: levelIndex + 1 });
    }
    hazards.push({ ...makeHoney(routeClouds[firstPlatform + 6], 0, .4, 1.2), level: levelIndex + 1 });
  } else if (levelType === 'mixed-hazards' || levelType === 'finale') {
    for (const [platformOffset, direction] of [[2, 1], [6, -1], [9, 1]]) {
      hazards.push({ ...makeYarn(routeClouds[firstPlatform + platformOffset], { trackX: 1.8, direction }), level: levelIndex + 1 });
    }
    for (const platformOffset of levelType === 'finale' ? [4, 8] : [3, 5, 7, 10]) {
      const cloud = routeClouds[firstPlatform + platformOffset];
      const lane = (platformOffset + levelIndex) % 2 ? -.7 : .7;
      hazards.push({ ...makeHoney(cloud, lane, 0, 1.3), level: levelIndex + 1 });
    }
  } else {
    hazards.push(
      { ...makeHoney(routeClouds[firstPlatform + 3]), level: levelIndex + 1 },
      { ...makeYarn(routeClouds[firstPlatform + 7]), level: levelIndex + 1 },
    );
  }
  const features = LEVEL_FEATURES[levelIndex];
  if (features.wind) {
    for (const [platformOffset, lane, direction] of [[4, -.8, levelIndex % 2 ? 1 : -1], [8, .8, levelIndex % 2 ? -1 : 1]]) {
      windGusts.push(makeWindGust(routeClouds[firstPlatform + platformOffset], lane, 0, direction));
    }
  }
  if (features.bounce) {
    bounceFlowers.push(makeBounceFlower(routeClouds[firstPlatform + 5], levelIndex % 2 ? .7 : -.7));
  }
  if (features.boulders) {
    for (const [platformOffset, direction] of [[4, 1], [8, -1]]) {
      hazards.push({ ...makeCloudBoulder(routeClouds[firstPlatform + platformOffset], direction), level: levelIndex + 1 });
    }
  }
}

function makeCarrots(cloud) {
  const pile = new THREE.Group();
  const orange = new THREE.MeshStandardMaterial({ color: '#f1ae78', roughness: 1, flatShading: true });
  const paleOrange = new THREE.MeshStandardMaterial({ color: '#f6c390', roughness: 1, flatShading: true });
  const carrotPositions = [[-.55, 0, 0, -.19], [0, .06, -.04, .05], [.55, -.02, .02, .23], [-.22, .18, -.28, .3], [.31, .17, -.26, -.27]];
  carrotPositions.forEach(([x, y, z, angle], index) => {
    const carrot = new THREE.Mesh(new THREE.ConeGeometry(.2, 1.06, 5), index % 2 ? paleOrange : orange);
    carrot.rotation.z = Math.PI + angle;
    carrot.position.set(x, 1.23 + y, z);
    carrot.castShadow = true;
    pile.add(carrot);
    for (let leaf = -1; leaf <= 1; leaf += 1) box(pile, mats.green, x + leaf * .085, 1.84 + y, z, .1, .3, .08).rotation.z = leaf * .36;
  });
  pile.position.set(cloud.x, cloud.group.position.y, cloud.z - .25);
  scene.add(pile);
  return pile;
}

const carrotPiles = Array.from({ length: LEVEL_COUNT }, (_, levelIndex) => {
  const endOffset = LEVEL_TYPES[levelIndex] === 'moving-clouds' ? 6 : PLATFORMS_PER_LEVEL - 1;
  const cloud = routeClouds[levelIndex * PLATFORMS_PER_LEVEL + endOffset];
  return makeCarrots(cloud);
});
const floatingCloudCount = 12;
const floatingClouds = [];
const floatingCloudParts = [
  { x: -.4, y: 0, z: 0, sx: .72, sy: .31, sz: .38 },
  { x: .25, y: .09, z: -.02, sx: .82, sy: .44, sz: .49 },
  { x: .85, y: -.02, z: .04, sx: .55, sy: .29, sz: .37 },
];
const floatingCloudMesh = new THREE.InstancedMesh(cloudPuffGeometry, mats.cloud, floatingCloudCount * floatingCloudParts.length);
floatingCloudMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(floatingCloudMesh);
for (let index = 0; index < floatingCloudCount; index += 1) {
  const x = ((index * 17) % 36) - 18;
  const z = 7 - index * 4.15;
  const y = 1.3 + (index % 4) * 1.7;
  const scale = .7 + index % 3 * .15;
  const cloud = { x, y, z, scale, offset: index * 1.3, index };
  floatingClouds.push(cloud);
  for (let partIndex = 0; partIndex < floatingCloudParts.length; partIndex += 1) {
    const part = floatingCloudParts[partIndex];
    cloudPuffTransform.position.set(x + part.x * scale, y + part.y * scale, z + part.z * scale);
    cloudPuffTransform.scale.set(part.sx * scale, part.sy * scale, part.sz * scale);
    cloudPuffTransform.updateMatrix();
    floatingCloudMesh.setMatrixAt(index * floatingCloudParts.length + partIndex, cloudPuffTransform.matrix);
  }
}
floatingCloudMesh.instanceMatrix.needsUpdate = true;

const sparkles = [];
const sparkleMaterial = new THREE.MeshBasicMaterial({ color: '#fff7d6' });
const sparkleMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), sparkleMaterial, 32);
const sparkleTransform = new THREE.Object3D();
for (let index = 0; index < 32; index += 1) {
  const sparkle = { x: ((index * 43) % 30) - 15, y: 2 + (index * 7 % 10), z: -3 - index * 2.15, offset: index * .91 };
  sparkles.push(sparkle);
  sparkleTransform.position.set(sparkle.x, sparkle.y, sparkle.z);
  sparkleTransform.scale.setScalar(.055);
  sparkleTransform.updateMatrix();
  sparkleMesh.setMatrixAt(index, sparkleTransform.matrix);
}
sparkleMesh.instanceMatrix.needsUpdate = true;
scene.add(sparkleMesh);

const birds = [];
for (let index = 0; index < 5; index += 1) {
  const bird = new THREE.Group();
  const birdMat = new THREE.MeshStandardMaterial({ color: '#91b8c6', flatShading: true });
  sphere(bird, birdMat, 0, 0, 0, .15, .09, .11, 0);
  const wingLeft = box(bird, mats.cloud, -.13, .1, 0, .2, .045, .1);
  const wingRight = box(bird, mats.cloud, .13, .1, 0, .2, .045, .1);
  bird.position.set(-6 + index * 2.8, 5 + index % 2, -8 - index * 10);
  scene.add(bird);
  birds.push({ bird, wingLeft, wingRight, offset: index * 1.1, homeX: bird.position.x });
}

const petalMaterial = new THREE.MeshStandardMaterial({ color: '#f2b9c9', flatShading: true, side: THREE.DoubleSide });
const petals = [];
for (let index = 0; index < 15; index += 1) {
  const petal = new THREE.Mesh(new THREE.PlaneGeometry(.12, .2), petalMaterial);
  petal.position.set(((index * 19) % 24) - 12, 2 + index % 5 * .7, -3 - index * 3.7);
  petal.rotation.set(.3, index, index * .7);
  petal.userData.offset = index * 1.7;
  scene.add(petal);
  petals.push(petal);
}

const rainbowGroup = new THREE.Group();
const rainbowColors = ['#f4b4c0', '#f3d292', '#c8d9a5', '#acdced'];
rainbowColors.forEach((color, index) => {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(1.25 + index * .16, .075, 3, 14, Math.PI), new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }));
  rainbowGroup.add(arc);
});
rainbowGroup.position.set(-6.5, 2.7, -47);
rainbowGroup.rotation.z = Math.PI;
scene.add(rainbowGroup);

const sunDisk = new THREE.Mesh(new THREE.CircleGeometry(2.1, 12), new THREE.MeshBasicMaterial({ color: '#fff0c8', transparent: true, opacity: .43, depthWrite: false }));
sunDisk.position.set(8, 8, -39);
scene.add(sunDisk);
for (let ray = 0; ray < 10; ray += 1) {
  const angle = ray * Math.PI * 2 / 10;
  const glimmer = new THREE.Mesh(new THREE.BoxGeometry(.045, .5, .02), new THREE.MeshBasicMaterial({ color: '#fff4d9', transparent: true, opacity: .46 }));
  glimmer.position.set(8 + Math.cos(angle) * 2.65, 8 + Math.sin(angle) * 2.65, -39);
  glimmer.rotation.z = angle;
  scene.add(glimmer);
}

const collection = new Set();
let collectedStars = 0;
let pickedThisRun = new Set();
let gameState = 'title';
let grounded = true;
let verticalSpeed = 0;
let slowTimer = 0;
let yarnStunTimer = 0;
let toastTimer = 0;
let runTime = 0;
let currentLevel = 1;
let guideReturnState = 'title';
let newlyDiscovered = false;
let audioContext;
let masterGain;
let audioMuted = false;
let animationFrameId = 0;
let displayedPage = 0;
const keys = new Set();
const particles = [];
const particlePalette = ['#fff4ce', '#f6c3d1', '#c9e8f4', '#d6e6b8'].map(color => new THREE.Color(color));
const particleMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ vertexColors: true }),
  52,
);
particleMesh.count = 0;
scene.add(particleMesh);
const particleTransform = new THREE.Object3D();
const clock = new THREE.Clock();
const ui = {
  titleScreen: document.querySelector('#title-screen'),
  pauseScreen: document.querySelector('#pause-screen'),
  pauseButton: document.querySelector('#pause-toggle'),
  howToButton: document.querySelector('#howto-open'),
  howToScreen: document.querySelector('#howto-screen'),
  soundButton: document.querySelector('#sound-toggle'),
  soundIcon: document.querySelector('#sound-icon'),
  musicPlayer: document.querySelector('#music-player'),
  resultScreen: document.querySelector('#result-screen'),
  journalScreen: document.querySelector('#journal-screen'),
  resultCard: document.querySelector('#result-card'),
  resultTitle: document.querySelector('#result-title'),
  resultCopy: document.querySelector('#result-copy'),
  resultIcon: document.querySelector('#result-icon'),
  resultKicker: document.querySelector('#result-kicker'),
  retryLabel: document.querySelector('#retry-label'),
  starCount: document.querySelector('#star-count'),
  pageCount: document.querySelector('#page-count'),
  statusLabel: document.querySelector('#status-label'),
  toast: document.querySelector('#toast'),
  journalDot: document.querySelector('#journal-dot'),
  journalProgress: document.querySelector('#journal-progress'),
  collectionGrid: document.querySelector('#collection-grid'),
};

function ensureAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = audioMuted ? 0 : .55;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
}

function postMusicCommand(command) {
  try {
    const frame = ui.musicPlayer.querySelector('iframe');
    frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
  } catch (error) {
    console.warn('Background music is unavailable.', error);
  }
}

function setMusicPaused(paused) {
  postMusicCommand(paused ? 'pauseVideo' : 'playVideo');
  ui.musicPlayer.classList.toggle('visible', !paused && !audioMuted);
}

function playHopSound() {
  if (audioMuted || !audioContext || !masterGain) return;
  const now = audioContext.currentTime;
  const tone = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(540, now);
  tone.frequency.exponentialRampToValueAtTime(850, now + .12);
  envelope.gain.setValueAtTime(.0001, now);
  envelope.gain.exponentialRampToValueAtTime(.14, now + .025);
  envelope.gain.exponentialRampToValueAtTime(.0001, now + .19);
  tone.connect(envelope);
  envelope.connect(masterGain);
  tone.start(now);
  tone.stop(now + .2);
  tone.addEventListener('ended', () => {
    tone.disconnect();
    envelope.disconnect();
  }, { once: true });
}

function updatePauseButton() {
  const paused = gameState === 'paused';
  ui.pauseButton.disabled = !paused && gameState !== 'playing';
  ui.pauseButton.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
  ui.pauseButton.title = paused ? 'Resume game' : 'Pause game';
  ui.pauseButton.setAttribute('aria-pressed', String(paused));
  ui.pauseButton.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
}

function togglePause() {
  if (gameState === 'playing') {
    gameState = 'paused';
    keys.clear();
    ui.pauseScreen.classList.remove('hidden');
    document.querySelector('#game').classList.add('paused');
    setMusicPaused(true);
  } else if (gameState === 'paused') {
    gameState = 'playing';
    keys.clear();
    ui.pauseScreen.classList.add('hidden');
    document.querySelector('#game').classList.remove('paused');
    setMusicPaused(false);
    startAnimationLoop();
  } else {
    return;
  }
  updatePauseButton();
}

function toggleAudio() {
  try {
    ensureAudio();
  } catch (error) {
    console.warn('Sound effects are unavailable.', error);
  }
  audioMuted = !audioMuted;
  if (masterGain && audioContext) {
    const now = audioContext.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(audioMuted ? 0 : .55, now, .08);
  }
  postMusicCommand(audioMuted ? 'pauseVideo' : 'unMute');
  if (!audioMuted && gameState !== 'paused') {
    postMusicCommand('playVideo');
  }
  ui.musicPlayer.classList.toggle('visible', !audioMuted && gameState !== 'paused');
  ui.soundButton.classList.toggle('muted', audioMuted);
  ui.soundButton.setAttribute('aria-pressed', String(audioMuted));
  ui.soundButton.setAttribute('aria-label', audioMuted ? 'Unmute music and sound effects' : 'Mute music and sound effects');
  ui.soundButton.title = audioMuted ? 'Unmute music and sound effects' : 'Mute music and sound effects';
}

const journalItems = [
  { id: 'star', name: 'Wish Star', icon: '✦', description: 'A little wish from above.' },
  { id: 'blossom', name: 'Cloud Blossom', icon: '✿', description: 'A flower that loves the sky.' },
  { id: 'feather', name: 'Feather', icon: '羽', description: 'Left by a passing friend.' },
  { id: 'rainbow', name: 'Rainbow', icon: '🌈', description: 'A tiny piece of sunshine.' },
  { id: 'honey', name: 'Honey Puddle', icon: '🍯', description: 'Sticky, sweet, and rather slow.' },
  { id: 'yarn', name: 'Yarn Ball', icon: '🧶', description: 'A tumble with a soft landing.' },
  { id: 'carrot', name: 'Carrot Pile', icon: '🥕', description: 'The loveliest skyward reward.' },
];

function renderJournal() {
  ui.collectionGrid.replaceChildren();
  for (const item of journalItems) {
    const card = document.createElement('article');
    card.className = `collection-card${collection.has(item.id) ? ' discovered' : ''}`;
    card.innerHTML = `<span class="collection-check" aria-label="collected">✓</span><div class="collection-illustration" aria-hidden="true">${item.icon}</div><h3 class="collection-name">${item.name}</h3><p class="collection-description">${collection.has(item.id) ? item.description : 'a little mystery…'}</p>`;
    ui.collectionGrid.append(card);
  }
  ui.journalProgress.textContent = `${collection.size} of ${journalItems.length} found　✧`;
  ui.journalDot.classList.toggle('visible', newlyDiscovered);
}

function addCollection(id) {
  const isNew = !collection.has(id);
  collection.add(id);
  if (isNew) {
    newlyDiscovered = true;
    renderJournal();
  }
  return isNew;
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('visible');
  toastTimer = 2;
}

function emitSparkles(position, count = 17) {
  const countToAdd = Math.min(count, 52 - particles.length);
  for (let index = 0; index < countToAdd; index += 1) {
    const life = .8 + Math.random() * .55;
    particles.push({
      position: position.clone(),
      velocity: new THREE.Vector3((Math.random() - .5) * 2.2, 1.1 + Math.random() * 2, (Math.random() - .5) * 1.8),
      life,
      initialLife: life,
      color: particlePalette[index % particlePalette.length],
    });
  }
}

function showResult(win) {
  gameState = win ? 'level-clear' : 'fallen';
  ui.pauseScreen.classList.add('hidden');
  document.querySelector('#game').classList.remove('paused');
  updatePauseButton();
  ui.resultScreen.classList.remove('hidden');
  ui.resultCard.classList.toggle('won', win);
  if (win) {
    ui.resultKicker.textContent = '';
    ui.resultTitle.textContent = 'Well Done!';
    ui.resultCopy.textContent = currentLevel === LEVEL_COUNT
      ? 'Bunny completed all 50 levels! 🥕✨'
      : 'Bunny reached the pile of carrots! 🥕✨';
    ui.resultIcon.textContent = '🥕';
    ui.retryLabel.textContent = currentLevel === LEVEL_COUNT ? 'Play again' : 'Next level ->';
    ui.statusLabel.textContent = 'carrot picnic time';
    addCollection('carrot');
    emitSparkles(carrotPiles[stageIndexFor(currentLevel)].position.clone().add(new THREE.Vector3(0, 1.5, 0)), 52);
  } else {
    ui.resultKicker.textContent = 'a little skyward detour';
    ui.resultTitle.textContent = 'oops!';
    ui.resultCopy.textContent = 'Bunny fell into the sky';
    ui.resultIcon.textContent = '☁';
    ui.retryLabel.textContent = 'Try Again';
    ui.statusLabel.textContent = 'the clouds are still here';
  }
}

function setLevel(level) {
  currentLevel = Math.max(1, Math.floor(level));
  const stageIndex = stageIndexFor(currentLevel);
  const levelStartIndex = stageIndex * PLATFORMS_PER_LEVEL;
  const startPlatform = routeClouds[levelStartIndex];
  const theme = LEVEL_THEMES[stageIndex];
  bunny.position.set(startPlatform.x, startPlatform.top + startPlatform.group.position.y + bunnyHalfHeight, startPlatform.z + 1.15);
  bunny.rotation.set(0, 0, 0);
  bunny.userData.body.rotation.set(0, 0, 0);
  verticalSpeed = 0;
  grounded = true;
  scene.background.set(theme.sky);
  scene.fog.color.set(theme.fog);
  ui.pageCount.innerHTML = `${String(currentLevel).padStart(2, '0')} <span>/ ${LEVEL_COUNT}</span>`;
  displayedPage = currentLevel;
}

function restartLevel(level, resetAllHazards = false) {
  setLevel(level);
  const stageIndex = stageIndexFor(currentLevel);
  const stageNumber = stageIndex + 1;
  slowTimer = 0;
  yarnStunTimer = 0;
  collectedStars = 0;
  pickedThisRun = new Set();
  runTime = 0;
  keys.clear();
  ui.starCount.textContent = '0';
  ui.statusLabel.textContent = `level ${currentLevel} · a fresh hop ✧`;
  for (const pickup of pickups.filter(item => item.level === stageNumber)) {
    pickup.active = true;
    pickup.root.visible = true;
  }
  for (const platform of routeClouds.filter(item => resetAllHazards || item.level === stageNumber)) {
    platform.fadeState = 'ready';
    platform.fadeTimer = 0;
    platform.collisionActive = true;
    platform.group.visible = true;
    platform.group.scale.setScalar(1);
    if (platform.motion) platform.motion.epoch = runTime;
  }
  for (const hazard of hazards.filter(item => (resetAllHazards || item.level === stageNumber) && (item.type === 'yarn' || item.type === 'boulder'))) {
    hazard.phase = 0;
    hazard.rollAngle = 0;
    hazard.direction = hazard.baseDirection || hazard.direction;
    hazard.hitCooldown = 0;
    if (hazard.type === 'yarn') {
      hazard.root.position.set(hazard.centerX, hazard.cloud.group.position.y, hazard.centerZ + hazard.orbitZ);
      hazard.roller.quaternion.identity();
    } else {
      hazard.root.position.set(hazard.centerX, hazard.cloud.group.position.y + 1.02, hazard.centerZ);
      hazard.root.rotation.set(0, 0, 0);
    }
    hazard.x = hazard.root.position.x;
    hazard.z = hazard.root.position.z;
  }
  for (const wind of windGusts) {
    if (resetAllHazards || wind.cloud.level === stageNumber) {
      wind.phase = 0;
      wind.root.rotation.set(0, 0, 0);
    }
  }
  for (const flower of bounceFlowers) {
    if (resetAllHazards || flower.cloud.level === stageNumber) flower.cooldown = 0;
  }
  particles.length = 0;
  particleMesh.count = 0;
}

function advanceToNextLevel() {
  if (currentLevel >= LEVEL_COUNT) {
    resetGame();
    return;
  }
  ui.resultScreen.classList.add('hidden');
  restartLevel(currentLevel + 1);
  ui.titleScreen.classList.add('hidden');
  ui.statusLabel.textContent = `level ${currentLevel} · the clouds rise a little higher ✧`;
  gameState = 'playing';
  ui.pauseScreen.classList.add('hidden');
  document.querySelector('#game').classList.remove('paused');
  updatePauseButton();
  startAnimationLoop();
}

function resetGame() {
  gameState = 'playing';
  ui.resultScreen.classList.add('hidden');
  ui.titleScreen.classList.add('hidden');
  ui.pauseScreen.classList.add('hidden');
  document.querySelector('#game').classList.remove('paused');
  currentLevel = 1;
  const startPlatform = routeClouds[0];
  bunny.position.set(startPlatform.x, startPlatform.top + startPlatform.group.position.y + bunnyHalfHeight, startPlatform.z + 1.15);
  bunny.rotation.set(0, 0, 0);
  bunny.userData.body.rotation.set(0, 0, 0);
  verticalSpeed = 0;
  grounded = true;
  scene.background.set(LEVEL_THEMES[0].sky);
  scene.fog.color.set(LEVEL_THEMES[0].fog);
  ui.pageCount.innerHTML = `01 <span>/ ${LEVEL_COUNT}</span>`;
  displayedPage = 1;
  slowTimer = 0;
  yarnStunTimer = 0;
  collectedStars = 0;
  pickedThisRun = new Set();
  runTime = 0;
  keys.clear();
  ui.starCount.textContent = '0';
  ui.statusLabel.textContent = 'a lovely day for a hop';
  ui.resultCard.classList.remove('won');
  for (const pickup of pickups) {
    pickup.active = true;
    pickup.root.visible = true;
  }
  restartLevel(1, true);
  particles.length = 0;
  particleMesh.count = 0;
  try {
    ensureAudio();
    setMusicPaused(false);
  } catch (error) {
    console.warn('Optional audio could not be started.', error);
  }
  updatePauseButton();
  startAnimationLoop();
}

function platformContains(platform, x, z, margin = 0) {
  return Math.abs(x - platform.x) <= platform.w / 2 + margin && Math.abs(z - platform.z) <= platform.d / 2 + margin;
}

function triggerPlatformFade(platform) {
  if (!platform.fading || platform.fadeState !== 'ready') return;
  platform.fadeState = 'warning';
  platform.fadeTimer = 2.5;
}

function updatePhysics(delta) {
  const wasGrounded = grounded;
  const oldBottom = bunny.position.y - bunnyHalfHeight;
  const oldY = bunny.position.y;
  const stunned = yarnStunTimer > 0;
  const movingSlow = slowTimer > 0;
  let forward = Number(keys.has('ArrowUp') || keys.has('KeyW')) - Number(keys.has('ArrowDown') || keys.has('KeyS'));
  let sideways = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
  if (stunned) {
    forward = 0;
    sideways = 0;
    bunny.position.z += .82 * delta;
    bunny.userData.body.rotation.z += delta * 8;
  } else {
    const speed = (movingSlow ? 1.25 : 4.15) * (sprinting ? 1.6 : 1);
    const length = Math.hypot(forward, sideways) || 1;
    const moveForward = forward / length * speed * delta;
    const moveSideways = sideways / length * speed * delta;
    bunny.position.x += -Math.sin(cameraYaw) * moveForward + Math.cos(cameraYaw) * moveSideways;
    bunny.position.z += -Math.cos(cameraYaw) * moveForward - Math.sin(cameraYaw) * moveSideways;
    bunny.position.x = THREE.MathUtils.clamp(bunny.position.x, -4.9, 4.9);
    if (forward || sideways) {
      const heading = Math.atan2(-(-Math.sin(cameraYaw) * forward + Math.cos(cameraYaw) * sideways),
        -(-Math.cos(cameraYaw) * forward - Math.sin(cameraYaw) * sideways));
      bunny.rotation.y = THREE.MathUtils.damp(bunny.rotation.y, heading, 7, delta);
    }
    bunny.userData.body.rotation.z = THREE.MathUtils.damp(bunny.userData.body.rotation.z, -sideways * .12, 9, delta);
    if (keys.has('Space') && grounded && gameState === 'playing') {
      verticalSpeed = 9.2;
      grounded = false;
      keys.delete('Space');
      playHopSound();
    }
  }
  verticalSpeed -= 20 * delta;
  bunny.position.y += verticalSpeed * delta;

  grounded = false;
  if (verticalSpeed <= 0) {
    for (const platform of clouds) {
      if (!platform.solid || !platform.collisionActive) continue;
      const platformTop = platform.top + platform.group.position.y;
      const bottom = bunny.position.y - bunnyHalfHeight;
      if (oldBottom >= platformTop - .08 && bottom <= platformTop && platformContains(platform, bunny.position.x, bunny.position.z, -.03)) {
        bunny.position.y = platformTop + bunnyHalfHeight;
        verticalSpeed = 0;
        grounded = true;
        triggerPlatformFade(platform);
        break;
      }
      if (Math.abs(bottom - platformTop) < .035 && platformContains(platform, bunny.position.x, bunny.position.z, -.03)) {
        bunny.position.y = platformTop + bunnyHalfHeight;
        verticalSpeed = 0;
        grounded = true;
        triggerPlatformFade(platform);
        break;
      }
      if (wasGrounded && Math.abs(oldBottom - platformTop) <= .24 && platformContains(platform, bunny.position.x, bunny.position.z, -.03)) {
        bunny.position.y = platformTop + bunnyHalfHeight;
        verticalSpeed = 0;
        grounded = true;
        triggerPlatformFade(platform);
        break;
      }
    }
  }
  const bob = grounded ? Math.abs(Math.sin(runTime * 8)) * .035 : Math.sin(runTime * 15) * .025;
  if (grounded && !stunned) bunny.position.y += (bob - (bunny.position.y - oldY)) * Math.min(delta * 4, 1);
  const motion = grounded && !stunned ? Math.abs(forward) + Math.abs(sideways) : 0;
  bunny.userData.ears[0].rotation.z = Math.sin(runTime * (motion ? 11 : 2.3)) * (motion ? .1 : .035) - .06;
  bunny.userData.ears[1].rotation.z = -Math.sin(runTime * (motion ? 11 : 2.3) + .5) * (motion ? .1 : .035) + .06;

  if (slowTimer > 0) {
    slowTimer = Math.max(0, slowTimer - delta);
    ui.statusLabel.textContent = `sticky paws · ${Math.ceil(slowTimer)}s`;
    if (slowTimer === 0) showToast('Your paws are free again! ✨');
  } else if (yarnStunTimer > 0) {
    yarnStunTimer = Math.max(0, yarnStunTimer - delta);
    ui.statusLabel.textContent = `yarn tumble · ${Math.ceil(yarnStunTimer)}s`;
    if (yarnStunTimer === 0) {
      bunny.userData.body.rotation.z = 0;
      bunny.rotation.z = 0;
      showToast('Back on your paws! ✧');
    }
  } else if (gameState === 'playing') {
    ui.statusLabel.textContent = movingSlow ? 'sticky paws' : 'a lovely day for a hop';
  }

  for (const hazard of hazards) {
    if (hazard.type === 'yarn') {
      const difficultySpeed = Math.min((currentLevel - 1) / (LEVEL_COUNT - 1), 1) * .28;
      const orbitSpeed = yarnStunTimer > 0 ? .34 : 1.2 + difficultySpeed;
      hazard.phase += orbitSpeed * hazard.direction * delta;
      hazard.root.position.set(
        hazard.centerX + Math.sin(hazard.phase) * hazard.orbitX,
        hazard.cloud.group.position.y,
        hazard.centerZ + Math.cos(hazard.phase) * hazard.orbitZ,
      );
      hazard.x = hazard.root.position.x;
      hazard.z = hazard.root.position.z;
      hazard.rollAngle += orbitSpeed * hazard.direction * delta * (hazard.orbitX + hazard.orbitZ) / (2 * .46);
      yarnRollAxis.set(-hazard.orbitZ * Math.sin(hazard.phase), 0, -hazard.orbitX * Math.cos(hazard.phase)).normalize();
      hazard.roller.quaternion.setFromAxisAngle(yarnRollAxis, hazard.rollAngle);
    } else if (hazard.type === 'boulder') {
      hazard.phase += delta * 1.45 * hazard.direction;
      hazard.root.position.set(
        hazard.centerX + Math.sin(hazard.phase) * hazard.trackX,
        hazard.cloud.group.position.y + 1.02,
        hazard.centerZ + Math.cos(hazard.phase) * .48,
      );
      hazard.root.rotation.z += delta * hazard.direction * 1.8;
      hazard.x = hazard.root.position.x;
      hazard.z = hazard.root.position.z;
      hazard.hitCooldown = Math.max(0, hazard.hitCooldown - delta);
    } else {
      hazard.root.position.y = hazard.cloud.group.position.y;
    }
    const hazardCloud = hazard.cloud;
    const heightTolerance = hazard.type === 'boulder' ? .95 : .62;
    if (!grounded || stunned || Math.abs(bunny.position.y - (hazardCloud.top + hazardCloud.group.position.y + bunnyHalfHeight)) > heightTolerance) continue;
    if (Math.abs(bunny.position.x - hazard.x) < (hazard.radiusX || (hazard.type === 'boulder' ? .95 : .8)) && Math.abs(bunny.position.z - hazard.z) < (hazard.radiusZ || (hazard.type === 'boulder' ? .95 : .8))) {
      if (hazard.type === 'honey' && slowTimer <= 0) {
        slowTimer = 5;
        addCollection('honey');
        showToast('Sticky honey paws! Slow for 5 seconds 🍯');
      } else if (hazard.type === 'yarn' && yarnStunTimer <= 0) {
        yarnStunTimer = 3;
        addCollection('yarn');
        showToast('A yarny tumble! Just 3 seconds 🧶');
      } else if (hazard.type === 'boulder' && hazard.hitCooldown <= 0) {
        bunny.position.x = THREE.MathUtils.clamp(bunny.position.x + Math.sign(bunny.position.x - hazard.x || hazard.direction) * 1.15, -4.9, 4.9);
        verticalSpeed = 5.6;
        grounded = false;
        hazard.hitCooldown = .9;
        showToast('Cloud boulder! Hop over it next time ☁');
      }
    }
  }

  for (const wind of windGusts) {
    const dx = bunny.position.x - wind.root.position.x;
    const dz = bunny.position.z - wind.root.position.z;
    const nearPlatformHeight = Math.abs(bunny.position.y - (wind.cloud.top + wind.cloud.group.position.y + bunnyHalfHeight)) < 2.2;
    const gusting = Math.sin(runTime * 2.4 + wind.phase) > -.2;
    if (!grounded && !stunned && gusting && nearPlatformHeight && Math.abs(dx) < 2.4 && Math.abs(dz) < 1.8) {
      bunny.position.x = THREE.MathUtils.clamp(bunny.position.x + wind.direction * 2.4 * delta, -4.9, 4.9);
    }
  }

  for (const flower of bounceFlowers) {
    const dx = bunny.position.x - flower.root.position.x;
    const dz = bunny.position.z - flower.root.position.z;
    const onFlower = Math.abs(dx) < .68 && Math.abs(dz) < .68;
    if (grounded && !stunned && flower.cooldown <= 0 && onFlower) {
      flower.cooldown = 1.4;
      verticalSpeed = 12.5;
      grounded = false;
      playHopSound();
      emitSparkles(flower.root.position.clone().add(new THREE.Vector3(0, 1.2, 0)), 18);
      showToast('Bounce flower! Up, up, and away! 🌸');
    }
  }

  for (const pickup of pickups) {
    if (!pickup.active) continue;
    pickup.root.rotation.y += delta * 1.5;
    pickup.root.position.set(
      pickup.platform.group.position.x + pickup.offsetX,
      pickup.platform.group.position.y + 1.73 + Math.sin(runTime * 2.5 + pickup.offset) * .13,
      pickup.platform.group.position.z + pickup.offsetZ,
    );
    if (bunny.position.distanceTo(pickup.root.position) < .95) {
      pickup.active = false;
      pickup.root.visible = false;
      pickedThisRun.add(pickup.root.uuid);
      const isNew = addCollection(pickup.id);
      if (pickup.id === 'star') {
        collectedStars += 1;
        ui.starCount.textContent = String(collectedStars);
      }
      emitSparkles(pickup.root.position, 12);
      showToast(isNew ? `${pickup.name} added to your scrapbook! ✧` : `${pickup.name} collected! ✧`);
    }
  }

  const carrots = carrotPiles[stageIndexFor(currentLevel)];
  if (gameState === 'playing' && grounded && Math.abs(bunny.position.x - carrots.position.x) < 1.6 && Math.abs(bunny.position.z - carrots.position.z) < 1.7) {
    showResult(true);
  }
  if (gameState === 'playing' && bunny.position.y < -5.5) showResult(false);
}

function updateMovingPlatforms() {
  const holdTime = 2;
  const travelTime = 3;
  const cycleTime = 2 * (holdTime + travelTime);
  for (const platform of routeClouds) {
    if (!platform.motion) continue;
    const previousX = platform.group.position.x;
    const previousY = platform.group.position.y;
    if (platform.motion.type === 'paired-horizontal') {
      const elapsed = Math.max(0, runTime - (platform.motion.epoch ?? 0));
      const phase = elapsed % cycleTime;
      const cycleDirection = Math.floor(elapsed / cycleTime) % 2 ? -1 : 1;
      if (phase < travelTime) {
        const t = phase / travelTime;
        const progress = 1 - t * t * (3 - 2 * t);
        platform.x = platform.motion.centerX + platform.motion.slot * platform.motion.range * cycleDirection * progress;
      } else if (phase < travelTime + holdTime) {
        platform.x = platform.motion.centerX;
      } else if (phase < travelTime * 2 + holdTime) {
        const t = (phase - travelTime - holdTime) / travelTime;
        const progress = t * t * (3 - 2 * t);
        platform.x = platform.motion.centerX - platform.motion.slot * platform.motion.range * cycleDirection * progress;
      } else {
        platform.x = platform.motion.centerX - platform.motion.slot * platform.motion.range * cycleDirection;
      }
    } else if (platform.motion.type === 'vertical') {
      const elapsed = Math.max(0, runTime - (platform.motion.epoch ?? 0));
      const phase = elapsed % cycleTime;
      let targetY = platform.motion.lowY;
      if (phase < travelTime) {
        const t = phase / travelTime;
        targetY += (platform.motion.highY - platform.motion.lowY) * t * t * (3 - 2 * t);
      } else if (phase < travelTime + holdTime) {
        targetY = platform.motion.highY;
      } else if (phase < travelTime * 2 + holdTime) {
        const t = (phase - travelTime - holdTime) / travelTime;
        targetY = platform.motion.highY - (platform.motion.highY - platform.motion.lowY) * t * t * (3 - 2 * t);
      }
      platform.motionOffsetY = targetY - platform.y;
    }
    const floatY = Math.sin(runTime * 1.05 + platform.floatOffset) * .055;
    const motionY = platform.motion.type === 'vertical' ? platform.motionOffsetY : 0;
    platform.group.position.set(platform.x, platform.y + floatY + motionY, platform.z);
    if (gameState === 'playing' && grounded
      && Math.abs(bunny.position.y - (platform.top + previousY + bunnyHalfHeight)) < .18
      && Math.abs(bunny.position.x - previousX) <= platform.w / 2
      && Math.abs(bunny.position.z - platform.z) <= platform.d / 2) {
      bunny.position.x += platform.group.position.x - previousX;
      bunny.position.y += platform.group.position.y - previousY;
    }
  }
}

function updateScene(delta) {
  runTime += delta;
  for (const cloud of clouds) {
    const liftOffset = cloud.motion?.type === 'vertical' ? cloud.motionOffsetY || 0 : 0;
    cloud.group.position.y = cloud.y + Math.sin(runTime * 1.05 + cloud.floatOffset) * .055 + liftOffset;
    if (!cloud.fading || cloud.fadeState === 'ready') continue;
    cloud.fadeTimer -= delta;
    if (cloud.fadeTimer <= 0) {
      if (cloud.fadeState === 'warning') {
        cloud.fadeState = 'gone';
        cloud.fadeTimer = 1.15;
        cloud.collisionActive = false;
        cloud.group.visible = false;
      } else if (cloud.fadeState === 'gone') {
        cloud.fadeState = 'cooldown';
        cloud.fadeTimer = .5;
        cloud.collisionActive = true;
        cloud.group.visible = true;
      } else {
        cloud.fadeState = 'ready';
      }
    }
    if (cloud.fadeState === 'warning') {
      const elapsed = 2.5 - cloud.fadeTimer;
      cloud.group.visible = Math.sin(elapsed * 5.2) > -.25;
      cloud.group.scale.setScalar(1 + Math.sin(elapsed * 5.2) * .025);
    } else if (cloud.fadeState === 'cooldown') {
      cloud.group.scale.setScalar(1);
    }
  }
  for (const wind of windGusts) {
    wind.phase += delta * 1.4;
    wind.root.position.y = wind.cloud.group.position.y + 1.65;
    wind.root.rotation.y += delta * wind.direction * .3;
    wind.root.scale.setScalar(.92 + (Math.sin(wind.phase) + 1) * .08);
  }
  for (const flower of bounceFlowers) {
    flower.root.position.y = flower.cloud.group.position.y;
    flower.root.rotation.y += delta * .35;
    flower.cooldown = Math.max(0, flower.cooldown - delta);
  }
  for (const cloud of floatingClouds) {
    const x = cloud.x + Math.sin(runTime * .28 + cloud.offset) * .2;
    const y = cloud.y + Math.sin(runTime * .7 + cloud.offset) * .23;
    for (let partIndex = 0; partIndex < floatingCloudParts.length; partIndex += 1) {
      const part = floatingCloudParts[partIndex];
      cloudPuffTransform.position.set(x + part.x * cloud.scale, y + part.y * cloud.scale, cloud.z + part.z * cloud.scale);
      cloudPuffTransform.scale.set(part.sx * cloud.scale, part.sy * cloud.scale, part.sz * cloud.scale);
      cloudPuffTransform.updateMatrix();
      floatingCloudMesh.setMatrixAt(cloud.index * floatingCloudParts.length + partIndex, cloudPuffTransform.matrix);
    }
  }
  floatingCloudMesh.instanceMatrix.needsUpdate = true;
  for (let index = 0; index < sparkles.length; index += 1) {
    const sparkle = sparkles[index];
    const visible = Math.sin(runTime * 2 + sparkle.offset) > -.28;
    sparkleTransform.position.set(sparkle.x, sparkle.y, sparkle.z);
    sparkleTransform.rotation.set(0, runTime * .7 + sparkle.offset, 0);
    sparkleTransform.scale.setScalar(visible ? .055 : 0);
    sparkleTransform.updateMatrix();
    sparkleMesh.setMatrixAt(index, sparkleTransform.matrix);
  }
  sparkleMesh.instanceMatrix.needsUpdate = true;
  for (const bird of birds) {
    bird.bird.position.x = bird.homeX + Math.sin(runTime * .45 + bird.offset) * 1.1;
    bird.bird.position.y += Math.sin(runTime * 2 + bird.offset) * delta * .2;
    const flap = Math.sin(runTime * 5 + bird.offset) * .3;
    bird.wingLeft.rotation.z = flap;
    bird.wingRight.rotation.z = -flap;
  }
  for (const petal of petals) {
    petal.position.y += Math.sin(runTime * 1.6 + petal.userData.offset) * delta * .16;
    petal.rotation.z += delta * .4;
  }
  let particleIndex = 0;
  while (particleIndex < particles.length) {
    const particle = particles[particleIndex];
    particle.life -= delta;
    if (particle.life <= 0) {
      particles.splice(particleIndex, 1);
      continue;
    }
    particle.position.addScaledVector(particle.velocity, delta);
    particle.velocity.y -= 1.4 * delta;
    particleTransform.position.copy(particle.position);
    particleTransform.rotation.set(runTime * 2, runTime * 1.4, runTime);
    particleTransform.scale.setScalar(.11 * particle.life / particle.initialLife);
    particleTransform.updateMatrix();
    particleMesh.setMatrixAt(particleIndex, particleTransform.matrix);
    particleMesh.setColorAt(particleIndex, particle.color);
    particleIndex += 1;
  }
  particleMesh.count = particles.length;
  if (particles.length) {
    particleMesh.instanceMatrix.needsUpdate = true;
    particleMesh.instanceColor.needsUpdate = true;
  }
  for (const carrots of carrotPiles) carrots.rotation.y = Math.sin(runTime * .7) * .045;
  if (toastTimer > 0) {
    toastTimer -= delta;
    if (toastTimer <= 0) ui.toast.classList.remove('visible');
  }

  const followDistance = 12;
  const horizontalDistance = Math.cos(cameraPitch) * followDistance;
  const targetPosition = cameraTarget.set(
    bunny.position.x + Math.sin(cameraYaw) * horizontalDistance,
    bunny.position.y + .12 + Math.sin(cameraPitch) * followDistance,
    bunny.position.z + Math.cos(cameraYaw) * horizontalDistance,
  );
  camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 2.6));
  camera.lookAt(
    bunny.position.x - Math.sin(cameraYaw) * 3.7,
    bunny.position.y + .12,
    bunny.position.z - Math.cos(cameraYaw) * 3.7,
  );
  if (currentLevel !== displayedPage) {
    ui.pageCount.innerHTML = `${String(currentLevel).padStart(2, '0')} <span>/ ∞</span>`;
    displayedPage = currentLevel;
  }
}

function animate() {
  animationFrameId = 0;
  if (gameState === 'paused') return;
  const delta = Math.min(clock.getDelta(), .04);
  updateMovingPlatforms();
  if (gameState === 'playing') updatePhysics(delta);
  updateScene(delta);
  renderer.render(scene, camera);
  if (gameState !== 'paused') animationFrameId = requestAnimationFrame(animate);
}

function startAnimationLoop() {
  if (!animationFrameId) animationFrameId = requestAnimationFrame(animate);
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  resizeRenderer();
}

function openJournal() {
  renderJournal();
  ui.journalScreen.classList.remove('hidden');
  newlyDiscovered = false;
  ui.journalDot.classList.remove('visible');
}

function closeJournal() {
  ui.journalScreen.classList.add('hidden');
}

function openHowTo() {
  guideReturnState = gameState;
  if (gameState === 'playing') {
    gameState = 'paused';
    keys.clear();
    ui.pauseScreen.classList.remove('hidden');
    document.querySelector('#game').classList.add('paused');
    setMusicPaused(true);
    updatePauseButton();
  }
  ui.howToScreen.classList.remove('hidden');
}

function closeHowTo() {
  ui.howToScreen.classList.add('hidden');
  if (guideReturnState === 'playing') {
    gameState = 'playing';
    keys.clear();
    ui.pauseScreen.classList.add('hidden');
    document.querySelector('#game').classList.remove('paused');
    setMusicPaused(false);
    updatePauseButton();
    startAnimationLoop();
  }
}

const startButton = document.querySelector('#start-button');
function startFromButton() {
  if (gameState !== 'playing') resetGame();
}
startButton.addEventListener('pointerup', startFromButton);
startButton.addEventListener('click', startFromButton);
document.querySelector('#retry-button').addEventListener('click', () => {
  if (gameState === 'level-clear') advanceToNextLevel();
  else if (gameState === 'fallen') {
    ui.resultScreen.classList.add('hidden');
    restartLevel(currentLevel);
    gameState = 'playing';
    updatePauseButton();
    startAnimationLoop();
  } else resetGame();
});
document.querySelector('#pause-continue').addEventListener('click', togglePause);
ui.pauseButton.addEventListener('click', togglePause);
ui.howToButton.addEventListener('click', openHowTo);
ui.soundButton.addEventListener('click', toggleAudio);
document.querySelector('#journal-open').addEventListener('click', openJournal);
document.querySelector('#journal-close').addEventListener('click', closeJournal);
ui.journalScreen.addEventListener('click', event => {
  if (event.target === ui.journalScreen) closeJournal();
});
document.querySelector('#howto-close').addEventListener('click', closeHowTo);
ui.howToScreen.addEventListener('click', event => {
  if (event.target === ui.howToScreen) closeHowTo();
});
document.querySelector('.brand').addEventListener('click', event => {
  event.preventDefault();
  if (gameState !== 'playing') {
    ui.resultScreen.classList.add('hidden');
    ui.titleScreen.classList.remove('hidden');
    gameState = 'title';
  }
});
addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape') {
    if (!ui.journalScreen.classList.contains('hidden')) closeJournal();
    else if (!ui.howToScreen.classList.contains('hidden')) closeHowTo();
    else if (gameState === 'playing' || gameState === 'paused') togglePause();
    return;
  }
  if (gameState !== 'playing') return;
  keys.add(event.code);
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => keys.clear());
const gameSurface = document.querySelector('#game');
gameSurface.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.target.closest('button, a, .paper-card, .journal-book, .toast')) return;
  pointerDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  gameSurface.setPointerCapture(event.pointerId);
  gameSurface.classList.add('dragging');
});
gameSurface.addEventListener('pointermove', event => {
  if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
  cameraYaw -= (event.clientX - pointerDrag.x) * .006;
  cameraPitch = THREE.MathUtils.clamp(cameraPitch + (event.clientY - pointerDrag.y) * .004, .08, .82);
  pointerDrag.x = event.clientX;
  pointerDrag.y = event.clientY;
});
function endCameraDrag(event) {
  if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
  pointerDrag = null;
  gameSurface.classList.remove('dragging');
}
gameSurface.addEventListener('pointerup', endCameraDrag);
gameSurface.addEventListener('pointercancel', endCameraDrag);
gameSurface.addEventListener('lostpointercapture', endCameraDrag);
document.querySelectorAll('.touch-key').forEach(button => {
  const key = button.dataset.key;
  const down = event => { event.preventDefault(); keys.add(key); };
  const up = event => { event.preventDefault(); keys.delete(key); };
  button.addEventListener('pointerdown', down);
  button.addEventListener('pointerup', up);
  button.addEventListener('pointerleave', up);
  button.addEventListener('pointercancel', up);
});
const jumpButton = document.querySelector('#touch-jump');
jumpButton.addEventListener('pointerdown', event => { event.preventDefault(); keys.add('Space'); });
jumpButton.addEventListener('pointerup', event => { event.preventDefault(); keys.delete('Space'); });
jumpButton.addEventListener('pointerleave', () => keys.delete('Space'));
addEventListener('resize', resize);
renderJournal();
updatePauseButton();
startAnimationLoop();