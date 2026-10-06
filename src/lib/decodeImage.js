/* Turn any image a visitor can throw at the admin into something the browser
   can draw on a canvas. Formats the browser opens itself (JPEG, PNG, WebP,
   AVIF, GIF, BMP, SVG, ICO, and HEIC in Safari) pass straight through.
   HEIC/HEIF (iPhone photos) and TIFF are converted here, with decoders that
   are only downloaded when such a file is picked. The result then goes
   through the normal crop → resize → WebP step. */

const ext = (name = '') => (name.split('.').pop() || '').toLowerCase();

async function sniff(file) {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (a, b) => String.fromCharCode(...head.slice(a, b));
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (/^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(brand)) return 'heic';
    if (/^(avif|avis)$/.test(brand)) return 'avif';
  }
  if ((head[0] === 0x49 && head[1] === 0x49 && head[2] === 0x2a) || (head[0] === 0x4d && head[1] === 0x4d && head[3] === 0x2a)) return 'tiff';
  return '';
}

/* can this browser decode it as-is? */
function decodes(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img.naturalWidth > 0); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
    img.src = url;
  });
}

async function fromHeic(file) {
  const { default: heic2any } = await import('heic2any');
  const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
  return Array.isArray(out) ? out[0] : out;   // multi-image HEIC: take the primary photo
}

async function fromTiff(file) {
  const UTIF = (await import('utif2')).default;
  const buf = await file.arrayBuffer();
  const ifds = UTIF.decode(buf);
  const page = ifds.reduce((a, b) => ((b.width * b.height > a.width * a.height) ? b : a), ifds[0]);  // largest page, not the thumbnail
  UTIF.decodeImage(buf, page);
  const rgba = UTIF.toRGBA8(page);
  const c = document.createElement('canvas');
  c.width = page.width; c.height = page.height;
  c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer), page.width, page.height), 0, 0);
  return new Promise((r) => c.toBlob(r, 'image/png'));
}

/* returns { blob, note } — note describes any conversion that happened */
export async function decodeAny(file) {
  const kind = await sniff(file);
  const e = ext(file.name);
  if (await decodes(file)) return { blob: file, note: '' };
  if (kind === 'heic' || /^(heic|heif|hif)$/.test(e) || /hei[cf]/.test(file.type)) {
    return { blob: await fromHeic(file), note: 'Converted from HEIC' };
  }
  if (kind === 'tiff' || /^tiff?$/.test(e)) {
    return { blob: await fromTiff(file), note: 'Converted from TIFF' };
  }
  const label = (e || file.type || 'this').toUpperCase();
  throw new Error(`Can't read ${label} files in this browser. Export the photo as JPG or PNG and upload that.`);
}

export const ACCEPT = 'image/*,.heic,.heif,.hif,.tif,.tiff,.avif,.webp,.bmp,.gif,.svg,.ico';
