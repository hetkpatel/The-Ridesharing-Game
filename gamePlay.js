let NewYorkBounds = mapboxgl.LngLatBounds.convert([[-74.257159, 40.495992], [-73.699215, 40.915568]]);

var moneyAmount = 0.0;

var drivers = new Map();
var customers = new Map();
var markers = new Object();

var newDriverTimer = 10;
var newCustomerTimer = 20;

updateMoneyAmount(10000.0);

mapboxgl.accessToken = helloWorld();
var maxZoom = 13, minZoom = 9;
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-73.935242, 40.730610],
    zoom: minZoom,
    minZoom: minZoom,
    maxZoom: maxZoom
});

toggleStartMenu();

map.on('load', function () {
    document.getElementById('startBTN').classList.remove('disabled');
});