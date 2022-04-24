const accessToken =
    'pk.eyJ1IjoicHRoYWktaXQtZGV2IiwiYSI6ImNsMmI4enZrMjBjd3UzZmxlcml5NW0ydW0ifQ.QuS_NNfgeHo62B-f-ZzCHA';
let marker1 = new mapboxgl.Marker();
let currentLocation = [-1, -1];
mapboxgl.accessToken = accessToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [105.9, 21.1],
    zoom: 14
});

const marker = new mapboxgl.Marker({
        color: 'red',
    })
    .setLngLat([105.9, 21.1])
    .addTo(map);

const end = [105.9, 21.1];
const geolocate = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    // When active the map will receive updates to the device's location as it changes.
    // trackUserLocation: true,
    // Draw an arrow next to the location dot to indicate which direction the device is heading.
    showUserHeading: true
});


map.addControl(geolocate);
geolocate.on('geolocate', (e) => customGeolocate(e));

function customGeolocate(e) {
    marker1.remove();
    getRoute([e.coords.longitude, e.coords.latitude], end);
}
document.getElementById('start').addEventListener('keypress', (e) => entetEvent(e));

function entetEvent(e) {
    if (e.key === 'Enter') {
        search();
    }
}

async function search() {
    const init = {
        method: 'GET',
        cache: 'no-cache'
    };

    let url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
        document.getElementById('start').value +
        '.json?country=vn&proximity=ip&types=place,postcode,address&access_token=' + accessToken;
    let responseJson = await fetchUrl(url, init);

    marker1.remove();
    marker1 = new mapboxgl.Marker({
            draggable: true,
        })
        .setLngLat(responseJson.features[0].center)
        .addTo(map);

    map.flyTo({
        center: responseJson.features[0].center
    });
    getRoute(responseJson.features[0].center, end)

    return responseJson;
}

async function getRoute(start, end) {
    const init = {
        method: 'GET',
        cache: 'no-cache'
    }

    let url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' +
        start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] +
        '?steps=true&geometries=geojson&access_token=' + accessToken;

    const reposneJson = await fetchUrl(url, init);
    const data = reposneJson.routes[0];
    const route = data.geometry.coordinates;
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: route
        }
    };
    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
        map.addLayer({
            id: 'route',
            type: 'line',
            source: {
                type: 'geojson',
                data: geojson
            },
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#0000ff',
                'line-width': 5,
                'line-opacity': 0.75
            }
        });
    }
}

async function fetchUrl(url, init) {
    let response = await fetch(url, init);
    let responseJson;
    if (response.status === 200) {
        responseJson = await response.json()
    } else {
        responseJson = '';
    }

    return responseJson;
}