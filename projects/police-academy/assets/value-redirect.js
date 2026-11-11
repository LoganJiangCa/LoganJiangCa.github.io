/* Preserve previously shared project-value links after merging the content. */
(() => {
  const destination = new URL('background.html', window.location.href);
  destination.search = window.location.search;
  destination.hash = window.location.hash || '#benefits';
  window.location.replace(destination.href);
})();
