/* Where an anchor lands: normally the section's top; tall "sequence" sections
   marked data-land="end" land on their final frame (e.g. the finale's invitation). */
export const landingY = (el) => {
  const top = el.getBoundingClientRect().top + scrollY;
  return el.dataset.land === 'end' ? top + el.offsetHeight - innerHeight : top;
};
