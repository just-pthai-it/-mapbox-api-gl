var addresses = [];


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
        '.json?limit=6&country=vn&proximity=ip&types=place,postcode,address&access_token=' + accessToken;
    let responseJson = await fetchUrl(url, init);

    addresses = responseJson.features;
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

function autocomplete(inp) {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", async function (e) {
        await search();
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) {
            return false;
        }
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (i = 0; i < addresses.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (addresses[i].place_name.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = "<strong>" + addresses[i].place_name.substr(0, val.length) + "</strong>";
                b.innerHTML += addresses[i].place_name.substr(val.length);
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + addresses[i].place_name + "' class='" + i + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function (e) {
                    let index = this.getElementsByTagName("input")[0].classList[0];
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;

                    marker1.remove();
                    marker1 = new mapboxgl.Marker({
                            draggable: true,
                        })
                        .setLngLat(addresses[index].center)
                        .addTo(map);

                    map.flyTo({
                        center: addresses[index].center
                    });
                    getRoute(addresses[index].center, end)
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                    addresses = [];
                });
                a.appendChild(b);
            }
        }
    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode == 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

autocomplete(document.getElementById("start"));