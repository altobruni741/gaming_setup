export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  cover?: boolean;
}

export interface Gate extends Rect {
  requires: 'plate' | 'lever';
}

export interface Scanner {
  x: number;
  y: number;
  sweep: number;
  width: number;
  period: number;
  phase: number;
}

export interface LevelDefinition {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  objective: string;
  hint: string;
  image: string;
  width: number;
  spawn: { x: number; y: number };
  ground: Rect[];
  platforms: Platform[];
  crate?: Rect;
  plate?: Rect;
  lever?: { x: number; y: number };
  gates: Gate[];
  scanners: Scanner[];
  exit: number;
}

export const LEVELS: LevelDefinition[] = [
  {
    id: 0,
    title: 'La lisi\u00e8re',
    subtitle: 'L\u00e0 o\u00f9 tout commence.',
    description: 'Une for\u00eat oubli\u00e9e. Un passage qui attend son contrepoids.',
    objective: 'Trouvez comment maintenir le passage ouvert.',
    hint: 'Maintenez E et avancez pour pousser la caisse sur la dalle lumineuse. Laissez-la sur la dalle, sautez par-dessus, puis franchissez le ravin avec Espace.',
    image: './images/liminal-forest.jpg',
    width: 2100,
    spawn: { x: 115, y: 486 },
    ground: [
      { x: 0, y: 540, w: 690, h: 240 },
      { x: 820, y: 540, w: 1280, h: 240 },
    ],
    platforms: [{ x: 1390, y: 478, w: 95, h: 62 }],
    crate: { x: 330, y: 494, w: 46, h: 46 },
    plate: { x: 510, y: 533, w: 88, h: 7 },
    gates: [{ x: 1005, y: 347, w: 24, h: 193, requires: 'plate' }],
    scanners: [],
    exit: 1940,
  },
  {
    id: 1,
    title: 'Les machines endormies',
    subtitle: 'Le silence n\u2019est jamais complet.',
    description: 'Sous le b\u00e9ton, quelque chose veille encore. Observez son rythme.',
    objective: 'R\u00e9veillez le m\u00e9canisme. \u00c9chappez au regard des machines.',
    hint: 'Appuyez sur E pr\u00e8s du levier. Les projecteurs s\u2019\u00e9teignent r\u00e9guli\u00e8rement : attendez le bon moment, ou abritez-vous sous la plateforme. Sautez le ravin.',
    image: './images/silent-factory.jpg',
    width: 2330,
    spawn: { x: 110, y: 486 },
    ground: [
      { x: 0, y: 540, w: 830, h: 240 },
      { x: 960, y: 540, w: 1370, h: 240 },
    ],
    platforms: [{ x: 1310, y: 421, w: 160, h: 24, cover: true }],
    lever: { x: 380, y: 540 },
    gates: [{ x: 1970, y: 347, w: 24, h: 193, requires: 'lever' }],
    scanners: [{ x: 1390, y: 126, sweep: 270, width: 83, period: 9, phase: 0 }],
    exit: 2190,
  },
  {
    id: 2,
    title: 'De l\u2019autre c\u00f4t\u00e9',
    subtitle: 'Il reste toujours une lumi\u00e8re.',
    description: 'Un dernier passage. Rassemblez ce que les ombres vous ont appris.',
    objective: 'Ouvrez les deux passages pour rejoindre l\u2019autre rive.',
    hint: 'Placez la caisse sur la dalle, puis traversez le pont bris\u00e9. Attendez que le projecteur s\u2019\u00e9teigne ou utilisez l\u2019abri. Le dernier levier ouvre la porte de sortie.',
    image: './images/last-light.jpg',
    width: 2510,
    spawn: { x: 110, y: 486 },
    ground: [
      { x: 0, y: 540, w: 710, h: 240 },
      { x: 890, y: 540, w: 1620, h: 240 },
    ],
    platforms: [
      { x: 758, y: 514, w: 76, h: 26 },
      { x: 1470, y: 421, w: 165, h: 24, cover: true },
    ],
    crate: { x: 330, y: 494, w: 46, h: 46 },
    plate: { x: 510, y: 533, w: 88, h: 7 },
    lever: { x: 1850, y: 540 },
    gates: [
      { x: 1060, y: 347, w: 24, h: 193, requires: 'plate' },
      { x: 2250, y: 347, w: 24, h: 193, requires: 'lever' },
    ],
    scanners: [{ x: 1540, y: 120, sweep: 225, width: 80, period: 10, phase: 2 }],
    exit: 2370,
  },
];