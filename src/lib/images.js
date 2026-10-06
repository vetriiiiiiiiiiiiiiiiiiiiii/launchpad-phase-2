/* Every photograph on the site, by role. Defaults are green-toned Unsplash
   photographs; any slot can be replaced from the admin panel (/asdfghjkl), which
   stores either an Unsplash photo id or a full image URL / uploaded file. */
const isUrl = (id) => typeof id === 'string' && (id.startsWith('/') || /^https?:\/\//.test(id) || id.startsWith('data:'));
export const IMG = (id, w, q = 70) => (isUrl(id) ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`);
export const srcSet = (id, max = 1400) => (isUrl(id) ? undefined
  : [480, 800, 1200, 1600, 2200].filter((w) => w <= max * 1.3).map((w) => `${IMG(id, w)} ${w}w`).join(', '));

export const DEFAULT_P = {
  heroTalk: 'photo-1544531586-fde5298cdd40',        // a speaker before a full hall
  heroPitch: 'photo-1505373877841-8d25f7d46678',    // a founder presenting on a big screen
  heroWork: 'photo-1758873269013-d914addd5d3b',     // a team working it out at the whiteboard
  heroRoom: 'photo-1770844102881-f8823e9f3c83',     // rows of seats receding into darkness (graded emerald)
  tealHall: 'photo-1785458034214-a61b21ddeda1',        // teal auditorium, empty
  lectern: 'photo-1770097286213-6d6fc60f4cdf',         // a speaker at the lectern
  greenSeats: 'photo-1650962863647-8a131e1bf2c6',
  greenFabric: 'photo-1728927585857-28e7c14955b2',     // a builder against green fabric
  talksStage: 'photo-1630395822831-3e8205c2f8e8',   // audience facing a green stage
  chalkTeacher: 'photo-1758685848754-0aa566b4ddf4',
  chalkStudents: 'photo-1758685848261-16a5a9e68811',
  chalkNotes: 'photo-1573871014706-263f4dfec410',
  chalkHand: 'photo-1758685848691-3933bc2aa3ce',
  podium: 'photo-1765020553499-1ec9aeb21298',
  glasshouse: 'photo-1693323588976-bff2c5bd9e22',
  greenhouseTalk: 'photo-1758524055465-3693209f6b9e',  // two people mid-conversation in a greenhouse
  cafeMonstera: 'photo-1763124320262-60c7aa066999',    // a crowded café under hanging lights
  teamArt: 'photo-1681949098487-2f3a62d52fe8',
  cafePlants: 'photo-1784462293906-c74acc4f768d',
  cafeChairs: 'photo-1773051427980-e6a8d74cc24f',
  cafeGreenWall: 'photo-1561221820-5ed0595bcb4c',
  forestLibrary: 'photo-1749299475177-c1c6c52c62e0',
  roundLibrary: 'photo-1767862638863-302e3cd54ce6',
  glassBlocks: 'photo-1712588501747-5b7f9f715fca',
  greenTiles: 'photo-1761255241065-6f58ffa1cc8a',
  emeraldGlass: 'photo-1625479610681-f789345a8157',
  emeraldStone: 'photo-1767131545090-e13ae86c8e13',
  founderLeaves: 'photo-1564980295992-288a2237a55c',
  greenhouseDuo: 'photo-1758524057756-7dc8ce53d88c',
  teamOffice: 'photo-1758691737212-3eebbc8f84ed',
  planningTable: 'photo-1681949103006-70066fb25dfe',
  greenRoom: 'photo-1520702935840-b40e3d15c234',
  glasshouseWalk: 'photo-1746344509848-e43929b8e66b',
  whiteRibs: 'photo-1567201864585-6baec9110dac',
};


/* Every placement has its own slot. Slots that used to share a photo start
   from that photo (and follow it if it was customised) until changed alone. */
export const DERIVED = {
  heroLaunch: 'talksStage',
  dayOpening: 'talksStage',
  dayTalks: 'lectern',
  dayWorkshop: 'chalkTeacher',
  dayPitch: 'podium',
  dayDiscovery: 'glasshouse',
  dayConnection: 'cafeMonstera',
  dayClosing: 'forestLibrary',
  idxTalks: 'talksStage',
  idxWorkshop: 'chalkTeacher',
  idxPitch: 'podium',
  idxLaunches: 'emeraldGlass',
  idxExhibition: 'roundLibrary',
  idxRoom: 'cafeMonstera',
  expoBooth: 'glasshouse',
  expoFloor: 'forestLibrary',
  lpRoom02: 'whiteRibs',
};
Object.entries(DERIVED).forEach(([k, base]) => { DEFAULT_P[k] = DEFAULT_P[base]; });

/* the live set: defaults, overlaid with whatever the admin has saved */
export const P = { ...DEFAULT_P };

/* what each slot is, for the admin panel: [key, label, ratio w:h, max width px].
   Uploads are cropped to the ratio and compressed to this width. */
export const IMAGE_SLOTS = [
  ['Hero', [
    ['heroTalk', 'Slide 1 — Expert talks', [16, 9], 2400],
    ['heroPitch', 'Slide 2 — Pitching', [16, 9], 2400],
    ['heroWork', 'Slide 3 — Hands-on problem solving', [16, 9], 2400],
    ['heroLaunch', 'Slide 4 — Product launches', [16, 9], 2400]]],
  ['Everything, in one day (hover previews)', [
    ['idxTalks', 'The Talks', [4, 5], 800],
    ['idxWorkshop', 'The Workshop', [4, 5], 800],
    ['idxPitch', 'The Pitch', [4, 5], 800],
    ['idxLaunches', 'The Launches', [4, 5], 800],
    ['idxExhibition', 'The Exhibition', [4, 5], 800],
    ['idxRoom', 'The Room', [4, 5], 800]]],
  ['The Day', [
    ['tealHall', 'I — Arrival', [4, 3], 1600],
    ['dayOpening', 'II — Opening', [4, 3], 1600],
    ['dayTalks', 'III — The Talks', [4, 3], 1600],
    ['dayWorkshop', 'IV — The Workshop', [4, 3], 1600],
    ['dayPitch', 'V — The Pitch', [4, 3], 1600],
    ['dayDiscovery', 'VI — Discovery', [4, 3], 1600],
    ['dayConnection', 'X — Connection', [4, 3], 1600],
    ['dayClosing', 'XI — Closing', [4, 3], 1600]]],
  ['Statement', [
    ['greenRoom', 'Statement photograph', [4, 5], 1600]]],
  ['Expert talks', [
    ['talksStage', 'Full-screen stage (opens from a slit)', [16, 9], 2400],
    ['lectern', 'Photo i — On stage', [4, 5], 1400],
    ['greenSeats', 'Photo ii — The room', [3, 4], 1200]]],
  ['Workshop', [
    ['chalkTeacher', 'Print 1 — Learning by doing', [4, 3], 1600],
    ['chalkStudents', 'Print 2 — Solving it together', [4, 3], 1200],
    ['chalkNotes', 'Print 3 — The working', [4, 3], 1200]]],
  ['Pitch', [
    ['podium', 'Pitch backdrop', [16, 9], 2400]]],
  ['For the ones who build', [
    ['founderLeaves', 'Founders (large)', [3, 4], 1400],
    ['greenhouseDuo', 'Reviewing', [1, 1], 1000],
    ['teamOffice', 'Teams', [3, 2], 1400],
    ['chalkHand', 'Working it out', [1, 1], 1000],
    ['planningTable', 'Planning', [3, 2], 1400],
    ['greenFabric', 'Imagining', [1, 1], 1000],
    ['glasshouseWalk', 'Exploring', [1, 1], 1000]]],
  ['Conversation', [
    ['greenhouseTalk', 'Main photograph', [4, 5], 1600]]],
  ['Exhibition', [
    ['roundLibrary', 'Hall', [3, 4], 1400],
    ['glassBlocks', 'Object', [5, 4], 1400],
    ['expoBooth', 'Booth', [16, 10], 2000],
    ['greenTiles', 'Light', [3, 4], 1400],
    ['expoFloor', 'Floor', [16, 10], 2000]]],
  ['The Room', [
    ['cafeMonstera', 'Main photograph', [1, 1], 1600],
    ['cafePlants', 'Second photograph', [4, 3], 1200],
    ['cafeChairs', 'Third photograph', [3, 4], 1200]]],
  ['Launches', [
    ['whiteRibs', 'Home page — launch 02 room backdrop', [16, 9], 2400],
    ['lpRoom02', 'Launches page — product 02 room backdrop', [16, 9], 2400]]],
];
