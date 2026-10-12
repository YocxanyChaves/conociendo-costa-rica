(function () {
  'use strict';

  if (typeof L === 'undefined' || !window.CANTONES || !window.PROVINCIAS) {
    var aviso = document.createElement('div');
    aviso.className = 'aviso';
    aviso.textContent = 'No se pudo cargar el mapa. Revisá tu conexión a internet y recargá la página.';
    document.getElementById('mapa').appendChild(aviso);
    return;
  }

  var CLAVE = 'conociendo-cr:visitados:v1';
  var COLORES = { tierra: '#1C4551', trama: '#2C6272', mar: '#0D2B33', hueso: '#EAE6D8' };
  var ORDEN = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
  var reducirMovimiento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- datos ---------- */
  var cantones = CANTONES.features.map(function (f) { return f.properties; });
  var TOTAL = cantones.length;
  var porProvincia = {};
  ORDEN.forEach(function (p) { porProvincia[p] = []; });
  cantones.forEach(function (c) { porProvincia[c.provincia].push(c); });
  var idsValidos = {};
  cantones.forEach(function (c) { idsValidos[c.id] = true; });

  document.getElementById('eyebrow').textContent = TOTAL + ' cantones · ' + ORDEN.length + ' provincias';

  /* ---------- progreso guardado ---------- */
  function cargar() {
    try {
      var arr = JSON.parse(localStorage.getItem(CLAVE) || '[]');
      return new Set((Array.isArray(arr) ? arr : []).filter(function (id) { return idsValidos[id]; }));
    } catch (e) { return new Set(); }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(Array.from(visitados))); } catch (e) { /* sin almacenamiento: sigue funcionando */ }
  }
  var visitados = cargar();

  /* ---------- mapa ---------- */
  var map = L.map('mapa', {
    zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 90,
    maxZoom: 11,
    maxBounds: [[6.2, -88.0], [12.4, -81.0]], maxBoundsViscosity: 0.85
  });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
  map.attributionControl.addAttribution('Límites: geoBoundaries (CC0)');
  map.fitBounds([[8.0, -85.95], [11.25, -82.55]], { padding: [14, 14] });
  map.setMinZoom(map.getZoom() - 1);

  var capas = {};   // id -> capa de Leaflet
  var checks = {};  // id -> checkbox del panel

  function textoTip(c) {
    var estado = visitados.has(c.id) ? '<span class="si">✓ ya pisado</span>' : 'por conocer';
    return '<b>' + c.nombre + '</b>' + c.provincia + ' · ' + estado;
  }

  var capaCantones = L.geoJSON(window.CANTONES, {
    style: function () {
      return { className: 'canton', weight: 1, color: COLORES.mar, opacity: 1, fill: true, fillOpacity: 1 };
    },
    onEachFeature: function (f, capa) {
      var c = f.properties;
      capas[c.id] = capa;
      capa.on('click', function () { aplicar(c.id, !visitados.has(c.id)); });
      capa.on('mouseover', function () { capa.bringToFront(); });
      capa.bindTooltip(function () { return textoTip(c); }, { sticky: true, direction: 'top', className: 'tip', opacity: 1 });
    }
  }).addTo(map);

  // la "niebla": rayitas diagonales sobre los cantones sin visitar
  var svg = map.getPanes().overlayPane.querySelector('svg');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var defs = document.createElementNS(NS, 'defs');
    defs.innerHTML =
      '<pattern id="niebla" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="7" height="7" fill="' + COLORES.tierra + '"/>' +
      '<line x1="0" y1="0" x2="0" y2="7" stroke="' + COLORES.trama + '" stroke-width="1.8"/>' +
      '</pattern>';
    svg.insertBefore(defs, svg.firstChild);
  }

  // contornos de provincia por encima, sin interceptar clics
  map.createPane('provincias').style.zIndex = 450;
  L.geoJSON(window.PROVINCIAS, {
    pane: 'provincias', interactive: false,
    style: { color: COLORES.hueso, weight: 1.6, opacity: 0.5, fill: false }
  }).addTo(map);

  /* ---------- panel ---------- */
  var contenedor = document.getElementById('provincias');
  var filas = {};   // provincia -> {details, cuenta, relleno}

  ORDEN.forEach(function (prov) {
    var det = document.createElement('details');
    det.className = 'prov';

    var sum = document.createElement('summary');
    var nombre = document.createElement('span'); nombre.className = 'nombre'; nombre.textContent = prov;
    var cuenta = document.createElement('span'); cuenta.className = 'cuenta';
    var mini = document.createElement('div'); mini.className = 'mini';
    var relleno = document.createElement('i'); mini.appendChild(relleno);
    sum.appendChild(nombre); sum.appendChild(cuenta); sum.appendChild(mini);
    det.appendChild(sum);

    var ul = document.createElement('ul'); ul.className = 'lista';
    porProvincia[prov].slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); })
      .forEach(function (c) {
        var li = document.createElement('li');
        var label = document.createElement('label');
        var input = document.createElement('input'); input.type = 'checkbox';
        var texto = document.createElement('span'); texto.textContent = c.nombre;
        input.addEventListener('change', function () { aplicar(c.id, input.checked); });
        checks[c.id] = input;
        label.appendChild(input); label.appendChild(texto);
        li.appendChild(label); ul.appendChild(li);
      });
    det.appendChild(ul);
    contenedor.appendChild(det);
    filas[prov] = { details: det, cuenta: cuenta, relleno: relleno };
  });

  /* ---------- estado -> pantalla ---------- */
  function pintarResumen() {
    var n = visitados.size;
    var pct = Math.round((100 * n) / TOTAL);
    var txt = document.getElementById('resumen-texto');
    if (n === 0) {
      txt.textContent = 'Todo el país está en niebla. Tocá un cantón del mapa para empezar.';
    } else if (n === TOTAL) {
      txt.textContent = '¡Costa Rica completa! Pisaste los ' + TOTAL + ' cantones.';
    } else {
      txt.innerHTML = 'Ya pisaste <b>' + n + '</b> de ' + TOTAL + ' cantones. Te faltan <b>' + (TOTAL - n) + '</b>.';
    }
    document.getElementById('barra-relleno').style.width = pct + '%';
    document.getElementById('barra').setAttribute('aria-valuenow', String(pct));
    document.getElementById('pct').textContent = pct + ' %';
  }

  function pintarProvincias() {
    ORDEN.forEach(function (prov) {
      var lista = porProvincia[prov];
      var n = lista.filter(function (c) { return visitados.has(c.id); }).length;
      var fila = filas[prov];
      fila.cuenta.textContent = n + '/' + lista.length;
      fila.relleno.style.width = (100 * n / lista.length) + '%';
      fila.details.classList.toggle('completa', n === lista.length);
    });
  }

  function marcarVisual(id, valor, animar) {
    var el = capas[id].getElement();
    if (!el) { return; }
    el.classList.toggle('visitado', valor);
    checks[id].checked = valor;
    if (valor && animar && !reducirMovimiento) {
      el.classList.add('sello');
      el.addEventListener('animationend', function () { el.classList.remove('sello'); }, { once: true });
    }
  }

  function aplicar(id, valor) {
    if (valor) { visitados.add(id); } else { visitados['delete'](id); }
    marcarVisual(id, valor, true);
    guardar();
    pintarResumen();
    pintarProvincias();
  }

  document.getElementById('borrar').addEventListener('click', function () {
    if (visitados.size === 0) { return; }
    if (!window.confirm('¿Borrar todo tu progreso? Esto no se puede deshacer.')) { return; }
    Array.from(visitados).forEach(function (id) { marcarVisual(id, false, false); });
    visitados.clear();
    guardar();
    pintarResumen();
    pintarProvincias();
  });

  /* ---------- arranque ---------- */
  cantones.forEach(function (c) { marcarVisual(c.id, visitados.has(c.id), false); });
  pintarResumen();
  pintarProvincias();
})();
