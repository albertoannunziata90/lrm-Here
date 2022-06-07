var map = L.map('map', {
  zoom: 11,
  center: [0, 0],
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap',
}).addTo(map);

L.Routing.control({
  waypoints: [L.latLng(49.94652,18.85274), L.latLng(50.04746,18.69581)],
  showAlternatives: true,
  geocoder: new L.Control.Geocoder.HEREv2({
    apiKey: 'here api key',
    maxResults: 3,
    lang: 'pl',
  }),
  router: L.Routing.here('here api key', {
    routeRestriction: {
        transportMode: 'truck'
    },
    urlParameters: {
      alternatives: 3,
    }
  }),
  routeWhileDragging: false,
}).addTo(map);
