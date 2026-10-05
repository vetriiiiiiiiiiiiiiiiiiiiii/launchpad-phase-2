/* The loading screen and the hero's opening are one moment. The loader
   announces when the room is ready; the hero waits for that before it
   lets the curtain appear. */
let done = false;
const listeners = new Set();
export const loaderDone = () => done;
export const onLoaderDone = (fn) => {
  if (done) { fn(); return () => {}; }
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const markLoaderDone = () => {
  if (done) return;
  done = true;
  listeners.forEach((fn) => fn());
  listeners.clear();
};
