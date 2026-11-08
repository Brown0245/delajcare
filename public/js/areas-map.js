/* Dela J Care — service area map (Leaflet + OpenStreetMap) */
(function () {
  var el = document.getElementById('areas-map');
  if (!el || typeof L === 'undefined') return;

  var AREAS = {
    gta:        { name: 'Greater Toronto Area', ll: [43.6900, -79.4000], r: 21000, note: 'Toronto, Mississauga, Brampton and across the city.' },
    york:       { name: 'York Region',          ll: [43.9200, -79.4500], r: 17000, note: 'Vaughan, Markham, Richmond Hill, Newmarket and area.' },
    durham:     { name: 'Durham Region',        ll: [43.9300, -78.9300], r: 18000, note: 'Pickering, Ajax, Whitby, Oshawa and area.' },
    halton:     { name: 'Halton Region',        ll: [43.4900, -79.7800], r: 13000, note: 'Oakville, Milton, Halton Hills and area.' },
    burlington: { name: 'Burlington',           ll: [43.3500, -79.8000], r: 7500,  note: 'All of Burlington.' },
    hamilton:   { name: 'Hamilton',             ll: [43.2300, -79.8700], r: 12000, note: 'Home of our office. Including Stoney Creek, Ancaster, Dundas and Waterdown.' },
    haldimand:  { name: 'Haldimand County',     ll: [42.9900, -79.8800], r: 15000, note: 'Caledonia, Hagersville, Cayuga, Dunnville and area.' },
    niagara:    { name: 'Niagara Region',       ll: [43.0900, -79.2300], r: 19000, note: 'St. Catharines, Niagara Falls, Welland, Grimsby and area.' }
  };

  var BLUE = '#29467F', AMBER = '#9A5B13';

  var map = L.map(el, {
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 15,
    minZoom: 7,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var layers = {};
  var all = L.featureGroup().addTo(map);

  Object.keys(AREAS).forEach(function (key) {
    var a = AREAS[key];
    var circle = L.circle(a.ll, {
      radius: a.r,
      color: BLUE,
      weight: 2,
      fillColor: BLUE,
      fillOpacity: 0.16
    });
    circle.bindTooltip(a.name, { permanent: true, direction: 'center', className: 'area-label' });
    circle.bindPopup('<strong>' + a.name + '</strong><br>' + a.note +
      '<br><a href="#contact" class="area-popup__link">Ask about care here</a>');
    circle.on('click', function () { select(key, false); });
    circle.addTo(all);
    layers[key] = circle;
  });

  var fitAll = function () { map.fitBounds(all.getBounds(), { padding: [20, 20] }); };
  fitAll();

  var buttons = document.querySelectorAll('.area-btn');

  function select(key, fly) {
    Object.keys(layers).forEach(function (k) {
      var on = (k === key);
      layers[k].setStyle({
        color: on ? AMBER : BLUE,
        fillColor: on ? AMBER : BLUE,
        fillOpacity: on ? 0.32 : (key === 'all' ? 0.16 : 0.08),
        weight: on ? 3 : 2
      });
    });
    buttons.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-area') === key); });
    if (key === 'all') { map.closePopup(); fitAll(); return; }
    if (fly) {
      map.flyToBounds(layers[key].getBounds(), { padding: [30, 30], duration: 0.8 });
      layers[key].openPopup();
    }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { select(b.getAttribute('data-area'), true); });
  });

  // Let people scroll the page past the map; zoom with wheel only after a click
  map.on('click focus', function () { map.scrollWheelZoom.enable(); });
  el.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });

  // Fix sizing if the map was laid out while hidden or resized
  window.addEventListener('resize', function () { map.invalidateSize(); });
})();
