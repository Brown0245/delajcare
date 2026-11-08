/* Dela J Care — renders real client reviews from /data/reviews.json */
(function () {
  var list = document.getElementById('reviews-list');
  if (!list || !window.fetch) return;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  fetch('/data/reviews.json', { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : { reviews: [] }; })
    .then(function (data) {
      var reviews = (data && Array.isArray(data.reviews)) ? data.reviews.filter(function (r) { return r && r.text && r.name; }) : [];
      if (!reviews.length) { list.hidden = true; return; }
      list.innerHTML = reviews.map(function (r) {
        var n = Math.max(0, Math.min(5, parseInt(r.rating, 10) || 0));
        var stars = n ? '<p class="review__stars" aria-label="' + n + ' out of 5 stars">' + '★★★★★'.slice(0, n) + '<span>' + '★★★★★'.slice(0, 5 - n) + '</span></p>' : '';
        var meta = [r.relation, r.location].filter(Boolean).map(esc).join(' · ');
        return '<figure class="review">' + stars +
          '<blockquote class="review__text">' + esc(r.text) + '</blockquote>' +
          '<figcaption class="review__by"><strong>' + esc(r.name) + '</strong>' + (meta ? '<span>' + meta + '</span>' : '') + '</figcaption></figure>';
      }).join('');
      list.hidden = false;
      var t = document.getElementById('reviews-cta-title');
      if (t) t.textContent = 'Had care from Dela J? Add your voice.';
    })
    .catch(function () { list.hidden = true; });
})();
