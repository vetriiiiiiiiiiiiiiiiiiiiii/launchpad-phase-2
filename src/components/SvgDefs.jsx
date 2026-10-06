/* Shared drawings for the flat fallback of each launch (shown when WebGL isn't
   available): three veiled silhouettes with folds and light. */
const FOLD_PATHS = Array.from({ length: 13 }, (_, idx) => {
  const k = idx - 6;
  const tx = 50 + k * 2, bx = 50 + k * 8.6;
  const t1 = tx - 1, t2 = tx + 1, b1 = bx - 4.3, b2 = bx + 4.3;
  const m1 = (t1 + b1) / 2 + k * 0.6, m2 = (t2 + b2) / 2 + k * 0.6;
  return `M${t1},0 L${t2},0 Q${m2},55 ${b2},104 L${b1},104 Q${m1},55 ${t1},0Z`;
});

export default function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="fold" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.005" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation="2.2" />
        </filter>
        <filter id="soft"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="softer"><feGaussianBlur stdDeviation="7" /></filter>
        <linearGradient id="ridge" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#023b2c" stopOpacity=".42" />
          <stop offset=".55" stopColor="#fff" stopOpacity=".2" />
          <stop offset=".75" stopColor="#fff" stopOpacity=".06" />
          <stop offset="1" stopColor="#023b2c" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id="ridgeLight" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#5a7d6d" stopOpacity=".3" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#5a7d6d" stopOpacity=".22" />
        </linearGradient>
        <g id="folds">{FOLD_PATHS.map((d) => <path key={d} d={d} fill="url(#ridge)" />)}</g>
        <g id="foldsLight">{FOLD_PATHS.map((d) => <path key={d} d={d} fill="url(#ridgeLight)" />)}</g>
        <path id="shape-tall" d="M200,44 C160,44 128,46 120,64 C114,78 113,96 112,120 C110,220 108,320 100,400 C96,440 80,460 50,470 Q90,477 120,470 Q150,479 180,471 Q210,480 240,471 Q270,479 300,470 Q330,477 350,470 C320,460 304,440 300,400 C292,320 290,220 288,120 C287,96 286,78 280,64 C272,46 240,44 200,44Z" />
        <path id="shape-wide" d="M300,62 C200,62 142,62 127,70 C115,76 112,90 110,110 C104,170 98,240 80,300 C74,318 60,328 30,334 Q80,339 130,334 Q180,340 230,334 Q280,340 330,334 Q380,340 430,334 Q480,340 530,334 Q556,338 570,334 C540,328 526,318 520,300 C502,240 496,170 490,110 C488,90 485,76 473,70 C458,62 400,62 300,62Z" />
        <path id="shape-peak" d="M210,26 C201,26 194,33 187,46 L152,108 C138,132 131,160 129,200 C125,280 121,340 111,380 C103,402 84,411 52,416 Q94,423 130,415 Q170,426 210,416 Q250,426 290,415 Q326,423 368,416 C336,411 317,402 309,380 C299,340 295,280 291,200 C289,160 282,132 268,108 L233,46 C226,33 219,26 210,26Z" />
        <clipPath id="clip-tall"><use href="#shape-tall" /></clipPath>
        <clipPath id="clip-wide"><use href="#shape-wide" /></clipPath>
        <clipPath id="clip-peak"><use href="#shape-peak" /></clipPath>
        <radialGradient id="litTop" cx="0.55" cy="0.08" r="0.9">
          <stop offset="0" stopColor="#3fbf8c" /><stop offset="0.35" stopColor="#087a56" /><stop offset="1" stopColor="#023b2c" />
        </radialGradient>
        <radialGradient id="litIvory" cx="0.35" cy="0.15" r="1">
          <stop offset="0" stopColor="#5fd3a2" /><stop offset="0.55" stopColor="#0e7655" /><stop offset="1" stopColor="#04402f" />
        </radialGradient>
        <radialGradient id="litSpot" cx="0.5" cy="0.02" r="0.85">
          <stop offset="0" stopColor="#a8f0cc" /><stop offset="0.3" stopColor="#10a273" /><stop offset="0.75" stopColor="#065c45" /><stop offset="1" stopColor="#033f2f" />
        </radialGradient>
      </defs>
    </svg>
  );
}
