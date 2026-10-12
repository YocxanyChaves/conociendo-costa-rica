# Conociendo Costa Rica

Un mapa de cantones para pintar los lugares de Costa Rica que ya pisaste y ver cuáles te faltan. Los cantones sin visitar quedan bajo una "niebla" de rayitas; al marcarlos se pintan de mango.

**Demo:** https://yocxanychaves.github.io/conociendo-costa-rica/

## Cómo se usa

- Tocá un cantón en el mapa para marcarlo (o desmarcarlo).
- También podés marcarlos desde la lista por provincia del panel.
- El progreso se guarda en el navegador (`localStorage`), así que no se pierde al recargar.

## Correrlo en tu compu

No necesita instalar nada. Abrí `index.html` en el navegador (necesita internet para cargar Leaflet y las fuentes).

Si preferís un servidor local:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Estructura

```
index.html            # la página (solo el HTML)
css/estilos.css       # todos los estilos
js/app.js             # lógica del mapa, panel y progreso guardado
data/cantones.js      # límites de los 83 cantones (GeoJSON simplificado)
data/provincias.js    # límites de las 7 provincias
assets/favicon.svg    # ícono de la pestaña
```

## Tecnologías

HTML, CSS y JavaScript sin frameworks, con [Leaflet](https://leafletjs.com/) para el mapa.

## Datos

Los límites vienen de [geoBoundaries](https://www.geoboundaries.org/) (licencia CC0). Se limpiaron los nombres (tildes, "Palmeras" → Palmares), se asignó cada cantón a su provincia y se simplificaron las geometrías para que la página pese poco.

**Limitación conocida:** estos datos traen 83 cantones. Monteverde, el cantón 84, todavía aparece dentro de Puntarenas.

## Plan

- [x] **Fase 1:** mapa de cantones, marcar visitados, progreso guardado y porcentaje por provincia.
- [ ] **Fase 2:** escribir origen y destino y que la ruta marque sola los cantones que cruza.
- [ ] **Fase 3:** insignias, lista de "lugares que te faltan" y cuentas de usuario.
