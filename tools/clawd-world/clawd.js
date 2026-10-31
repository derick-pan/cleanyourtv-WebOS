// The Clawd of Clawd World: Claude Code's mascot at the terminal banner's size, 16 x 10 (a body of 12 x 8, two eyes, an arm each side,
// four legs), drawn for every thing it does, tick by tick (eight ticks a second), in every look (no cap, or a beanie of a colour).
// The pose system (eyes, arms, a lift), the beanies, the hats and the props of the house's errands and games are redrawn after
// clawd-sidekick by Tunai (MIT; its hooks/scene.ts); the other jobs follow the states of Clawd Tank by Marcio Granzotto (MIT) and the
// moods of claude-clawd by Kien Hoang Trung (MIT). See THIRD-PARTY.md.
'use strict';
const { Pic } = require('./pic');

// the colours, after clawd-sidekick's palette
const C = {
  body: '#D97757',
  shade: '#B4553A',
  highlight: '#EE9A78',
  eye: '#2A1A15',
  white: '#FFFFFF',
  pink: '#F6A5B8',
  red: '#E5484D',
  blue: '#4D8DF6',
  green: '#4CB363',
  purple: '#A98BF5',
  yellow: '#F5C542',
  teal: '#2BB3A3',
  sky: '#8ECDF5',
  dark: '#2E3138',
  steel: '#3A3F47',
  gray: '#8A8F98',
  light: '#C9CDD3',
  wood: '#7A4A2E',
  woodLight: '#9C6238',
  beige: '#D9CBB0',
  sweat: '#7CC6F2',
  gold: '#F2C14E',
  magenta: '#E05EC8',
  ember: '#FFE08A',
  pumpkin: '#F08A24',
  witch: '#6B4BA8',
  pageNear: '#FCE7A6',
  table: '#2F7D57',
  net: '#E8E8E8',
  orange: '#FF9A3C',
  cream: '#F6EFE4',
  brown: '#8E5C3B',
  hat: '#F2C230',
  hatDark: '#C99A1A',
  leaf: '#4F8A3F',
  cyan: '#9FE6F2',
  water: '#4FB3C8',
};
// the looks: no cap, then a beanie of each colour (a crew member keeps its look)
const CAPS = [null, 'blue', 'green', 'purple', 'red', 'yellow', 'teal', 'pink'];
const CAP = { blue: C.blue, green: C.green, purple: C.purple, red: C.red, yellow: C.yellow, teal: C.teal, pink: C.pink };

// a frame: the canvas, and where the body's box (16 x 10) goes on it; the feet stand on the row under the box
const CW = 40,
  CH = 30,
  OX = 12,
  OY = 13,
  FEET = OY + 9;

// every hat as rows from `top` (rows above the head are negative), 16 columns across the body's box; after clawd-sidekick
const HATS = {
  santa: { top: -4, rows: ['.........rrrrw..', '......rrrrrr.w..', '....rrrrrrrr....', '...wwwwwwwwww...'], key: { r: C.red, w: C.white } },
  witch: {
    top: -5,
    rows: ['........p.......', '.......pp.......', '......pppp......', '.....oooooo.....', '..pppppppppppp..'],
    key: { p: C.witch, o: C.pumpkin },
  },
  party: {
    top: -5,
    rows: ['.......yy.......', '.......mm.......', '......mymm......', '.....mmmmym.....', '....mymmmmmm....'],
    key: { m: C.magenta, y: C.yellow },
  },
  crown: { top: -3, rows: ['....g..gg..g....', '....gggggggg....', '....ggrggrgg....'], key: { g: C.gold, r: C.red } },
  wizard: {
    top: -6,
    rows: ['.........u......', '........uu......', '.......uuu......', '......uyuuu.....', '.....uuuuuuu....', '..uuuuuuuuuuuu..'],
    key: { u: C.purple, y: C.yellow },
  },
  builder: { top: -3, rows: ['.....hhhhhh.....', '....hhhhhhhh....', '..dddddddddddd..'], key: { h: C.hat, d: C.hatDark } },
  explorer: { top: -3, rows: ['.....bbbbbb.....', '.....nnnnnn.....', '..bbbbbbbbbbbb..'], key: { b: C.beige, n: C.wood } },
  // the holidays': a pilgrim's hat (Thanksgiving), a red cap trimmed in gold (the Lunar New Year), bunny ears (Easter)
  pilgrim: {
    top: -6,
    rows: ['.....kkkkkk.....', '.....kkkkkk.....', '.....kkkkkk.....', '.....nyyyyn.....', '.....kkkkkk.....', '..kkkkkkkkkkkk..'],
    key: { k: '#24232b', n: '#3a3f47', y: C.gold },
  },
  lunar: {
    top: -5,
    rows: ['.......rr.......', '......yyyy......', '....rrrrrrrr....', '...rrryyyyrrr...', '...yyyyyyyyyy...'],
    key: { r: '#d8312f', y: C.gold },
  },
  bunny: {
    top: -7,
    rows: [
      '....www..www....',
      '....wpw..wpw....',
      '....wpw..wpw....',
      '....wpw..wpw....',
      '....www..www....',
      '.....w....w.....',
      '...wwwwwwwwww...',
    ],
    key: { w: '#f6f1ea', p: '#f4a7bb' },
  },
  headphones: {
    top: -2,
    rows: ['...dddddddddd...', '..d..........d..', '................', '.rr..........rr.', '.rr..........rr.'],
    key: { d: C.dark, r: C.red },
  },
};

function canvas() {
  return new Pic(CW, CH);
}
const px = (g, x, y, c) => g.set(x, y, c);
const rect = (g, x, y, w, h, c) => g.rect(x, y, w, h, c);

// the body at x (its box's left edge), tick k, with a pose: eyes, where they look, the arms (mid, low, up, none), the legs (stand,
// a, b, sit: none), a lift off the floor and a shake; then the cap or a hat. Returns y, the top of the body.
function body(g, x, k, p, look) {
  let y = FEET - 9 - (p.lift || 0);
  const bx = x + (p.shake || 0);
  [3, 5, 10, 12].forEach((lx, i) => {
    if (p.legs === 'none') return;
    const up = (p.lift || 0) > 0 || (p.legs === 'a' && i % 2 === 0) || (p.legs === 'b' && i % 2 === 1);
    rect(g, bx + lx, y + 8, 1, up ? 1 : FEET - (y + 8) + 1, C.body);
  });
  rect(g, bx + 2, y, 12, 8, C.body);
  rect(g, bx + 3, y, 10, 1, C.highlight);
  rect(g, bx + 2, y + 7, 12, 1, C.shade);
  const arm = (ax, kind, out) => {
    if (kind === 'mid') rect(g, ax, y + 4, 2, 2, C.body);
    if (kind === 'low') rect(g, ax, y + 5, 2, 2, C.body);
    if (kind === 'up') {
      rect(g, ax, y + 2, 2, 2, C.body);
      rect(g, ax + out, y, 2, 2, C.body);
    }
    if (kind === 'fwd') rect(g, ax + out, y + 4, 2, 2, C.body);
  };
  arm(bx, p.armL || 'mid', -1);
  arm(bx + 14, p.armR || 'mid', 1);
  const lk = p.look || 0;
  for (const ex of [bx + 4 + lk, bx + 11 + lk]) {
    switch (p.eyes || 'open') {
      case 'open':
        rect(g, ex, y + 2, 1, 2, C.eye);
        break;
      case 'blink':
        px(g, ex, y + 3, C.eye);
        break;
      case 'up':
        rect(g, ex, y + 1, 1, 2, C.eye);
        break;
      case 'down':
        rect(g, ex, y + 3, 1, 2, C.eye);
        break;
      case 'happy':
        px(g, ex - 1, y + 3, C.eye);
        px(g, ex, y + 2, C.eye);
        px(g, ex + 1, y + 3, C.eye);
        break;
      case 'closed':
        rect(g, ex - 1, y + 3, 3, 1, C.eye);
        break;
      case 'wide':
        rect(g, ex - 1, y + 1, 2, 3, C.white);
        px(g, ex, y + 2, C.eye);
        break;
      case 'x':
        px(g, ex - 1, y + 1, C.eye);
        px(g, ex + 1, y + 1, C.eye);
        px(g, ex, y + 2, C.eye);
        px(g, ex - 1, y + 3, C.eye);
        px(g, ex + 1, y + 3, C.eye);
        break;
      case 'none':
        break;
    }
  }
  if (p.blush) {
    px(g, bx + 3, y + 5, C.pink);
    px(g, bx + 12, y + 5, C.pink);
  }
  if (p.hat) {
    const h = HATS[p.hat];
    h.rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (h.key[row[i]]) px(g, bx + i, y + h.top + j, h.key[row[i]]);
    });
  } else if (look) {
    rect(g, bx + 3, y - 1, 10, 1, CAP[look]);
    rect(g, bx + 5, y - 2, 6, 1, CAP[look]);
    rect(g, bx + 7, y - 3, 2, 1, C.white);
  }
  return y;
}

// ---- what a Clawd does: a pose for each tick (eyes, look, arms, legs, lift) and the things it holds or makes; `ticks` is the length
// of one round. After clawd-sidekick's errands and games, Clawd Tank's jobs and claude-clawd's moods. ----
const DO = {
  // standing about: looking left, ahead, right, and a blink (played slowly)
  stand: { ticks: 8, pose: k => ({ eyes: k === 6 ? 'blink' : 'open', look: [0, 0, -1, -1, 0, 1, 0, 0][k] }) },
  walk: { ticks: 4, pose: k => ({ legs: k % 4 < 2 ? 'a' : 'b', lift: 0, bob: k % 4 < 2 ? 0 : 1, look: 1 }) },
  climb: {
    ticks: 4,
    pose: k => ({ eyes: 'none', armL: k % 4 < 2 ? 'up' : 'mid', armR: k % 4 < 2 ? 'mid' : 'up', legs: k % 4 < 2 ? 'a' : 'b', back: true }),
  },
  wave: { ticks: 4, pose: k => ({ eyes: 'happy', armR: k % 4 < 2 ? 'up' : 'mid' }) },
  read: {
    ticks: 24,
    pose: () => ({ eyes: 'down' }),
    props: (g, x, y, k) => {
      rect(g, x + 5, y + 5, 6, 3, C.white);
      rect(g, x + 7, y + 5, 2, 3, C.wood);
      if (k % 24 < 3) rect(g, x + 9 - (k % 24), y + 4, 1, 4, C.white);
    },
  },
  think: {
    ticks: 12,
    pose: () => ({ eyes: 'up', look: 1 }),
    props: (g, x, y, k) => {
      for (let i = 0; i < Math.floor((k % 12) / 3); i++) px(g, x + 14 + i * 2, y - 2, C.gray);
    },
  },
  code: { ticks: 2, pose: k => ({ eyes: 'up', look: 1, armL: k % 2 ? 'low' : 'mid', armR: k % 2 ? 'mid' : 'low' }) },
  web: { ticks: 16, pose: k => ({ eyes: 'up', look: k % 16 < 8 ? 1 : 0 }) },
  arcade: {
    ticks: 24,
    pose: k => ({ eyes: 'up', look: -1, armL: k % 2 ? 'low' : 'mid', armR: k % 3 ? 'mid' : 'low', lift: k % 8 < 1 ? 1 : 0 }),
  },
  wait: {
    ticks: 8,
    pose: k => ({ armR: k % 4 < 2 ? 'up' : 'mid', lift: k % 8 < 2 ? 1 : 0 }),
    props: (g, x, y, k) => {
      if (k % 4 !== 3) {
        rect(g, x + 17, y - 6, 1, 3, C.red);
        px(g, x + 17, y - 2, C.red);
      }
    },
  },
  pin: {
    ticks: 4,
    pose: () => ({ armL: 'up', eyes: 'happy', look: -1 }),
    props: (g, x, y, k) => {
      if (k % 4 < 2) px(g, x - 2, y - 1, C.yellow);
    },
  },
  panic: {
    ticks: 6,
    pose: k => ({ eyes: 'wide', shake: k % 2 ? 1 : -1, armL: k % 2 ? 'mid' : 'up', armR: k % 2 ? 'up' : 'mid' }),
    props: (g, x, y, k) => {
      rect(g, x + 17, y - 6, 1, 3, C.red);
      px(g, x + 17, y - 2, C.red);
      if (k % 3 !== 2) {
        px(g, x - 1 - (k % 3), y + 1 + (k % 3), C.sweat);
        px(g, x - 1 - (k % 3), y + 2 + (k % 3), C.sweat);
      }
    },
  },
  love: {
    ticks: 12,
    pose: k => ({ eyes: 'happy', armL: 'up', armR: 'up', lift: k % 6 < 2 ? 2 : 0, blush: true }),
    props: (g, x, y, k) => {
      for (const [dx, ph] of [
        [15, 0],
        [-3, 6],
      ]) {
        const h = y + 2 - ((k + ph) % 12);
        if (h > y - 8) {
          px(g, x + dx, h, C.red);
          px(g, x + dx + 2, h, C.red);
          rect(g, x + dx, h + 1, 3, 1, C.red);
          px(g, x + dx + 1, h + 2, C.red);
        }
      }
    },
  },
  cheer: {
    ticks: 6,
    pose: k => ({ eyes: 'happy', armL: 'up', armR: 'up', lift: k % 6 < 2 ? 2 : 0 }),
    props: (g, x, y, k) => {
      if (k % 2 === 0) {
        px(g, x - 2, y - 1, C.yellow);
        px(g, x + 17, y + 1, C.yellow);
      } else {
        px(g, x - 1, y + 2, C.yellow);
        px(g, x + 18, y - 1, C.yellow);
      }
    },
  },
  oops: {
    ticks: 16,
    pose: k => ({ eyes: k % 16 < 10 ? 'wide' : 'blink', armL: 'low', armR: 'low' }),
    props: (g, x, y, k) => {
      if (k % 12 < 9) {
        px(g, x + 15, y + Math.floor((k % 12) / 3), C.sweat);
        px(g, x + 15, y + 1 + Math.floor((k % 12) / 3), C.sweat);
      }
    },
  },
  ask: {
    ticks: 8,
    pose: k => ({ eyes: 'wide', armL: 'up', armR: 'up', lift: k % 8 < 2 ? 1 : 0 }),
    props: (g, x, y, k) => {
      const top = y - 8 - (k % 8 < 2 ? 1 : 0);
      rect(g, x + 2, top, 12, 6, C.white);
      rect(g, x + 2, top + 6, 12, 1, C.light);
      rect(g, x + 7, top + 1, 2, 1, C.red);
      px(g, x + 9, top + 2, C.red);
      px(g, x + 8, top + 3, C.red);
      px(g, x + 8, top + 5, C.red);
    },
  },
  stamp: {
    ticks: 16,
    pose: k => ({ eyes: 'happy', armR: k % 8 < 4 ? 'up' : 'low' }),
    props: (g, x, y, k) => {
      rect(g, x + 16, y + 7, 7, 1, C.white);
      rect(g, x + 16, y + 6, 7, 1, C.light);
      const down = k % 8 >= 4,
        sy = down ? y + 3 : y - 1;
      rect(g, x + 18, sy, 3, 1, C.wood);
      rect(g, x + 19, sy + 1, 1, 1, C.wood);
      rect(g, x + 17, sy + 2, 5, 1, C.red);
      if (down || k % 16 >= 8) rect(g, x + 18, y + 6, 3, 1, C.red);
    },
  },
  mail: {
    ticks: 16,
    pose: k => ({ eyes: 'happy', armR: k % 16 < 3 ? 'up' : 'mid', look: 1 }),
    props: (g, x, y, k) => {
      const p = k % 16;
      if (p >= 2 && p < 14) {
        const ex = x + 15 + Math.floor((p - 2) * 0.55),
          ey = y + 1 - Math.floor((p - 2) / 2);
        rect(g, ex, ey, 5, 3, C.white);
        px(g, ex + 1, ey, C.gray);
        px(g, ex + 2, ey + 1, C.gray);
        px(g, ex + 3, ey, C.gray);
        px(g, ex + 2, ey + 2, C.red);
      }
    },
  },
  tidy: {
    ticks: 12,
    pose: k => ({ eyes: 'happy', armL: 'up', armR: 'up', lift: k % 12 < 2 ? 1 : 0 }),
    props: (g, x, y, k) => {
      const top = y - 4 - (k % 12 < 2 ? 1 : 0);
      rect(g, x + 3, top, 10, 1, C.red);
      rect(g, x + 4, top + 1, 9, 1, C.blue);
      rect(g, x + 3, top + 2, 10, 1, C.green);
      rect(g, x + 4, top + 3, 8, 1, C.yellow);
    },
  },
  eat: {
    ticks: 16,
    pose: k => ({ eyes: k % 16 < 10 ? 'happy' : 'open', armR: k % 8 < 3 ? 'up' : 'mid', legs: 'none', lift: -2 }),
    props: (g, x, y, k) => {
      const up = k % 8 < 3,
        ox = x + (up ? 15 : 16),
        oy = up ? y - 1 : y + 2;
      px(g, ox + 1, oy, C.white);
      rect(g, ox, oy + 1, 3, 1, C.white);
      rect(g, ox, oy + 2, 3, 1, C.dark);
    },
  },
  sip: {
    ticks: 12,
    pose: k => ({ eyes: k % 12 < 4 ? 'closed' : 'open', armR: k % 12 < 4 ? 'up' : 'mid', legs: 'none', lift: -2 }),
    props: (g, x, y, k) => {
      const up = k % 12 < 4,
        cx = x + (up ? 15 : 16),
        cy = up ? y + 1 : y + 3;
      rect(g, cx, cy, 2, 2, C.white);
      px(g, cx + 2, cy, C.white);
      if (k % 6 < 4) px(g, cx + (k % 2), cy - 1 - Math.floor((k % 6) / 2), C.light);
    },
  },
  stretch: {
    ticks: 8,
    pose: k => ({ eyes: 'closed', armL: 'up', armR: 'up', lift: k % 8 < 4 ? 1 : 0 }),
    props: (g, x, y, k) => {
      if (k % 8 < 4) {
        px(g, x - 2, y + 1, C.yellow);
        px(g, x + 17, y + 1, C.yellow);
      }
    },
  },
  clap: { ticks: 4, pose: k => ({ eyes: 'happy', armL: k % 4 < 2 ? 'up' : 'mid', armR: k % 4 < 2 ? 'up' : 'mid' }) },
  // asleep under a blanket on a mat, z's rising (the game room at night)
  sleep: {
    ticks: 24,
    pose: () => ({ eyes: 'closed', armL: 'low', armR: 'low' }),
    props: (g, x, y, k, look) => {
      const c = [C.blue, C.purple, C.table, C.red, C.teal, C.pink, C.green, C.yellow][CAPS.indexOf(look) % 8];
      rect(g, x, FEET + 1 - 1, 16, 1, C.sky);
      rect(g, x - 2, FEET - 2, 3, 2, C.white);
      rect(g, x + 1, FEET - 4, 14, 4, c);
      for (let i = x + 2; i < x + 15; i += 3) px(g, i, FEET - 3, C.white);
      const a = 6 - Math.floor((k % 24) / 4);
      if (a >= -4) {
        rect(g, x + 15, y + a - 2, 3, 1, C.light);
        px(g, x + 16, y + a - 1, C.light);
        rect(g, x + 15, y + a, 3, 1, C.light);
      }
    },
  },
  // ---- the games of the game room (one player each; the table, the net and the ball are props of the spot) ----
  pongl: { ticks: 16, pose: k => ({ look: k % 16 < 8 ? 1 : -1, armL: 'low', armR: k % 16 === 0 ? 'up' : 'low' }) },
  pongr: { ticks: 16, pose: k => ({ look: k % 16 < 8 ? 1 : -1, armR: 'low', armL: k % 16 === 8 ? 'up' : 'low' }) },
  ropel: { ticks: 8, pose: k => ({ armR: rope(k), look: 1 }) },
  roper: { ticks: 8, pose: k => ({ armL: rope(k), look: -1 }) },
  jump: { ticks: 8, pose: k => (k % 8 >= 3 && k % 8 <= 5 ? { lift: 3, eyes: 'happy', armL: 'up', armR: 'up' } : {}) },
  towerl: { ticks: 48, pose: k => tower(k, 'L') },
  towerr: { ticks: 48, pose: k => tower(k, 'R') },
  volleyl: { ticks: 24, pose: k => volley(k, 'L') },
  volleyr: { ticks: 24, pose: k => volley(k, 'R') },
  // ---- jobs after Clawd Tank ----
  juggle: {
    ticks: 12,
    pose: k => ({ eyes: 'up', look: [-1, 0, 1, 0][Math.floor(k / 3) % 4], armL: k % 6 < 3 ? 'up' : 'mid', armR: k % 6 < 3 ? 'mid' : 'up' }),
    props: (g, x, y, k) => {
      [C.red, C.yellow, C.green].forEach((c, i) => {
        const a = ((k + i * 4) % 12) / 12;
        rect(g, Math.round(x + 7 + Math.cos(a * Math.PI * 2) * 8), Math.round(y - 2 - Math.abs(Math.sin(a * Math.PI * 2)) * 7), 2, 2, c);
      });
    },
  },
  conduct: {
    ticks: 8,
    pose: k => ({
      eyes: k % 8 < 4 ? 'happy' : 'closed',
      armL: k % 8 < 4 ? 'up' : 'mid',
      armR: k % 8 < 4 ? 'mid' : 'up',
      lift: k % 4 === 0 ? 1 : 0,
    }),
    props: (g, x, y, k) => {
      // the baton in the hand that is up
      if (k % 8 < 4) {
        px(g, x - 2, y - 2, C.white);
        px(g, x - 3, y - 3, C.white);
      } else {
        px(g, x + 18, y - 2, C.white);
        px(g, x + 19, y - 3, C.white);
      }
    },
  },
  // the builder: hard hat on, a hammer coming down in front, sparks where it lands
  build: {
    ticks: 8,
    hat: 'builder',
    pose: k => ({ eyes: k % 8 >= 5 ? 'closed' : 'open', armR: k % 8 < 4 ? 'up' : 'fwd', lift: k % 8 === 3 ? 1 : 0 }),
    props: (g, x, y, k) => {
      if (k % 8 < 4) {
        rect(g, x + 17, y - 4, 4, 2, C.light);
        rect(g, x + 18, y - 2, 1, 3, C.wood);
      } else {
        rect(g, x + 18, y + 4, 3, 1, C.wood);
        rect(g, x + 21, y + 3, 2, 4, C.light);
        if (k % 8 < 6) {
          px(g, x + 24, y + 2, C.yellow);
          px(g, x + 23, y + 1, C.orange);
          px(g, x + 25, y + 4, C.yellow);
          px(g, x + 20, y + 1, C.ember);
        }
      }
    },
  },
  // the smith at the anvil on the right: the hammer up, then down on the anvil (its face 4 px above the floor, 11 px off the feet)
  hammer: {
    ticks: 8,
    pose: k => ({ eyes: k % 8 >= 5 && k % 8 < 7 ? 'closed' : 'open', look: 1, armR: k % 8 < 4 ? 'up' : 'fwd' }),
    props: (g, x, y, k) => {
      if (k % 8 < 4) {
        rect(g, x + 16, y - 4, 4, 2, C.light);
        rect(g, x + 17, y - 2, 1, 2, C.wood);
      } else {
        rect(g, x + 17, y + 5, 2, 1, C.wood);
        rect(g, x + 19, FEET - 7, 3, 3, C.light);
        if (k % 8 < 6) {
          px(g, x + 23, FEET - 8, C.yellow);
          px(g, x + 18, FEET - 9, C.orange);
          px(g, x + 22, FEET - 10, C.ember);
          px(g, x + 24, FEET - 5, C.yellow);
        }
      }
    },
  },
  // a pickaxe at the rock face on the right, chips flying
  pick: {
    ticks: 8,
    pose: k => ({ look: 1, armR: k % 8 < 4 ? 'up' : 'fwd', eyes: k % 8 === 5 ? 'closed' : 'open' }),
    props: (g, x, y, k) => {
      if (k % 8 < 4) {
        rect(g, x + 15, y - 5, 5, 1, C.gray);
        px(g, x + 14, y - 4, C.gray);
        px(g, x + 20, y - 4, C.gray);
        rect(g, x + 17, y - 4, 1, 3, C.wood);
      } else {
        rect(g, x + 17, y + 5, 3, 1, C.wood);
        rect(g, x + 20, y + 2, 1, 5, C.gray);
        px(g, x + 21, y + 2, C.gray);
        if (k % 8 < 6) {
          px(g, x + 23, y + 1, C.beige);
          px(g, x + 22, y - 1, C.gray);
          px(g, x + 24, y + 4, C.beige);
        }
      }
    },
  },
  sweep: {
    ticks: 8,
    pose: k => ({ eyes: 'down', look: 1, armR: 'low', shake: k % 8 < 4 ? 0 : 1 }),
    props: (g, x, y, k) => {
      const s = k % 8 < 4 ? 0 : 2;
      for (let i = 0; i < 6; i++) px(g, x + 15 + s + Math.floor(i * 0.6), y + 3 + i, C.wood);
      rect(g, x + 17 + s, FEET - 1, 5, 2, C.gold);
      if (k % 8 === 5 || k % 8 === 6) {
        px(g, x + 24 + s, FEET - 1, C.light);
        px(g, x + 25 + s, FEET - 2, C.light);
      }
    },
  },
  debug: {
    ticks: 16,
    pose: k => ({ eyes: 'down', look: 1, armR: 'fwd', lift: 0, shake: k % 16 < 8 ? 0 : 1 }),
    props: (g, x, y, k) => {
      const dy = [0, 1, 2, 1][Math.floor(k / 4) % 4];
      const lx = x + 18,
        ly = y + 3 + dy;
      rect(g, lx, ly, 4, 1, C.dark);
      rect(g, lx, ly + 3, 4, 1, C.dark);
      rect(g, lx - 1, ly + 1, 1, 2, C.dark);
      rect(g, lx + 4, ly + 1, 1, 2, C.dark);
      rect(g, lx, ly + 1, 4, 2, C.cyan);
      px(g, lx + 1, ly + 1, C.white);
      px(g, lx - 2, ly + 4, C.wood);
      px(g, lx - 3, ly + 5, C.wood);
    },
  },
  groove: {
    ticks: 8,
    pose: k => ({
      eyes: 'happy',
      armL: k % 8 < 4 ? 'up' : 'mid',
      armR: k % 8 < 4 ? 'mid' : 'up',
      lift: k % 4 < 2 ? 1 : 0,
      shake: k % 8 < 4 ? -1 : 1,
    }),
  },
  eureka: {
    ticks: 16,
    pose: k => (k % 16 < 6 ? { eyes: 'up', look: 1 } : { eyes: 'happy', armL: 'up', armR: 'up', lift: k % 16 < 8 ? 2 : 0 }),
    props: (g, x, y, k) => {
      if (k % 16 < 6) return;
      const on = k % 4 < 2 ? C.yellow : C.ember;
      rect(g, x + 7, y - 7, 3, 3, on);
      px(g, x + 6, y - 6, on);
      px(g, x + 10, y - 6, on);
      rect(g, x + 7, y - 4, 3, 1, C.gray);
      if (k % 4 < 2) {
        px(g, x + 4, y - 8, C.yellow);
        px(g, x + 12, y - 8, C.yellow);
        px(g, x + 8, y - 10, C.yellow);
      }
    },
  },
  dizzy: {
    ticks: 8,
    pose: k => ({ eyes: 'x', shake: [0, 1, 0, -1][Math.floor(k / 2) % 4] }),
    props: (g, x, y, k) => {
      for (let i = 0; i < 3; i++) {
        const a = ((k / 8 + i / 3) % 1) * Math.PI * 2;
        px(g, Math.round(x + 8 + Math.cos(a) * 7), Math.round(y - 2 + Math.sin(a) * 2), C.yellow);
      }
    },
  },
  wizard: {
    ticks: 8,
    hat: 'wizard',
    pose: k => ({ eyes: k % 8 < 4 ? 'closed' : 'happy', armR: 'up', lift: k % 8 < 4 ? 0 : 1 }),
    props: (g, x, y, k) => {
      const t = k % 8 < 4 ? [x + 18, y - 3] : [x + 19, y - 4];
      px(g, x + 17, y - 1, C.wood);
      px(g, t[0], t[1] + 1, C.wood);
      px(g, t[0], t[1], C.white);
      if (k % 2 === 0) {
        px(g, t[0] - 1, t[1], C.yellow);
        px(g, t[0] + 1, t[1], C.yellow);
        px(g, t[0], t[1] - 1, C.yellow);
      }
    },
  },
  // coffee: a mug, a sip, steam
  coffee: {
    ticks: 12,
    pose: k => ({ eyes: k % 12 < 4 ? 'closed' : 'open', armR: k % 12 < 4 ? 'up' : 'mid' }),
    props: (g, x, y, k) => {
      const up = k % 12 < 4,
        cx = x + (up ? 15 : 16),
        cy = up ? y + 1 : y + 3;
      rect(g, cx, cy, 3, 3, C.red);
      px(g, cx + 3, cy + 1, C.red);
      rect(g, cx, cy, 3, 1, C.brown);
      if (k % 6 < 4) px(g, cx + 1 + (k % 2), cy - 1 - Math.floor((k % 6) / 2), C.light);
    },
  },
  // sitting by the fire, a marshmallow on a stick going golden, then brown
  roast: {
    ticks: 32,
    pose: () => ({ eyes: 'open', look: 1, armR: 'fwd', legs: 'none', lift: -2 }),
    props: (g, x, y, k) => {
      for (let i = 0; i < 7; i++) px(g, x + 17 + i, y + 4 - Math.floor(i * 0.7), C.wood);
      const c = [C.white, C.white, C.pageNear, C.gold, C.pumpkin, C.wood][Math.min(5, Math.floor((k % 32) / 6))];
      rect(g, x + 23, y - 1, 2, 2, c);
    },
  },
  // watering the flowers on the right
  water: {
    ticks: 6,
    pose: () => ({ eyes: 'down', look: 1, armR: 'fwd' }),
    props: (g, x, y, k) => {
      rect(g, x + 17, y + 3, 4, 3, C.water);
      rect(g, x + 21, y + 3, 2, 1, C.water);
      px(g, x + 23, y + 4, C.water);
      px(g, x + 18, y + 2, C.water);
      for (const d of [0, 2, 4]) px(g, x + 24 + (d === 2 ? 1 : 0), y + 5 + ((k + d) % 6), C.cyan);
    },
  },
  // fishing off the end of the pier: sitting, the rod out over the water, the bobber bobbing, now and then a bite
  fish: {
    ticks: 32,
    pose: k => ({ eyes: k % 32 >= 24 ? 'wide' : k % 32 === 14 ? 'blink' : 'open', look: 1, armR: 'fwd', legs: 'none', lift: -2 }),
    props: (g, x, y, k) => {
      const bite = k % 32 >= 24;
      for (let i = 0; i < 10; i++) px(g, x + 17 + i, y + 3 - Math.floor(i * 0.8) + (bite && i > 6 ? i - 6 : 0), C.wood);
      const tx = x + 26,
        ty = y - 4 + (bite ? 3 : 0);
      const by = FEET + 6 + (bite ? 1 : k % 8 < 4 ? 0 : 1);
      for (let j = ty + 1; j < by; j++) px(g, tx, j, C.light);
      if (!bite) {
        px(g, tx, by, C.red);
        px(g, tx, by + 1, C.white);
      } else {
        px(g, tx - 1, by + 1, C.cyan);
        px(g, tx + 1, by + 1, C.cyan);
      }
    },
  },
  // burrowing into the sand (played once), and popping out again (the same backwards)
  dig: { ticks: 6, once: true, pose: () => ({ eyes: 'wide' }) },
  // carrying a crate of tokens from the mine, walking
  carry: {
    ticks: 4,
    pose: k => ({ legs: k % 4 < 2 ? 'a' : 'b', bob: k % 4 < 2 ? 0 : 1, look: 1, armL: 'up', armR: 'up', eyes: 'up' }),
    props: (g, x, y) => {
      rect(g, x + 2, y - 6, 12, 5, C.brown);
      rect(g, x + 2, y - 6, 12, 1, C.woodLight);
      for (const [dx, c] of [
        [4, C.orange],
        [7, C.yellow],
        [10, C.orange],
        [6, C.ember],
      ])
        px(g, x + dx, y - 7, c);
    },
  },
};
function rope(k) {
  const p = k % 8;
  return p === 7 || p <= 1 ? 'up' : p === 2 || p === 6 ? 'mid' : 'low';
}
// the volleyball between two players COURT px apart (middle to middle): it rises from the hitter's hands to a peak and drops to the
// other side, twelve ticks a crossing; the one who hits it jumps with both arms up, both watch it
const COURT = 38;
function ball(k) {
  k %= 24;
  const u = (k % 12) / 12,
    from = k < 12 ? 0 : COURT,
    to = k < 12 ? COURT : 0;
  return { x: Math.round(from + (to - from) * u), y: Math.round(12 - 9 * Math.sin(Math.PI * u)) };
}
function volley(k, role) {
  const b = ball(k),
    me = role === 'L' ? 0 : COURT,
    look = b.x + 1 < me - 3 ? -1 : b.x + 1 > me + 3 ? 1 : 0,
    hits = role === 'L' ? k % 24 <= 1 : k % 24 >= 12 && k % 24 <= 13;
  return hits ? { look, armL: 'up', armR: 'up', lift: 2 } : { look, armL: 'low', armR: 'low' };
}
function tower(k, role) {
  k %= 48;
  if (k >= 42) return { eyes: 'wide', look: role === 'L' ? 1 : -1 };
  const placing = role === 'L' ? k % 12 <= 1 : k % 12 >= 6 && k % 12 <= 7;
  if (!placing) return { look: role === 'L' ? 1 : -1 };
  return role === 'L' ? { armR: 'up', look: 1 } : { armL: 'up', look: -1 };
}

// one frame of a doing, in a look; climbing is seen from the back
function frame(doing, k, look) {
  const d = DO[doing],
    g = canvas(),
    p = d.pose(k) || {};
  if (p.bob) p.lift = (p.lift || 0) + p.bob;
  // a doing's own hat (the builder's, the wizard's), or a holiday's worn as a look (witch, santa, party)
  if (d.hat) p.hat = d.hat;
  else if (HATS[look]) p.hat = look;
  const y = body(g, OX, k, p, look);
  if (d.props) d.props(g, OX, y, k, look);
  return g;
}
// the frames of a doing in a look, every `step` ticks
function strip(doing, look, step) {
  const d = DO[doing],
    out = [];
  for (let k = 0; k < d.ticks; k += step || 1) out.push(frame(doing, k, look));
  return out;
}
// the same box around every frame (and every look) of a sprite: what they use of the canvas
function bbox(frames) {
  let x0 = CW,
    y0 = CH,
    x1 = -1,
    y1 = -1;
  for (const f of frames)
    for (let y = 0; y < f.h; y++)
      for (let x = 0; x < f.w; x++)
        if (f.get(x, y)[3]) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
  // the feet always in it, so the anchor is inside
  return { x0: Math.min(x0, OX), y0, x1: Math.max(x1, OX + 15), y1: Math.max(y1, FEET) };
}
function crop(f, b) {
  const p = new Pic(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) p.set(x, y, f.get(b.x0 + x, b.y0 + y));
  return p;
}
// back view for climbing: no eyes, the beanie seen from behind (no white pompom in front... the same shape)
module.exports = { C, CAPS, DO, HATS, CW, CH, OX, OY, FEET, COURT, ball, frame, strip, bbox, crop, body, canvas };
