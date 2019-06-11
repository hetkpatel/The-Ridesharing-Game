class Customer {
    uuid;
    origin;
    destination;
    marker;
    routeData;

    constructor(uuid, origin, destination, routeData) {
        this.uuid = uuid;
        this.origin = origin;
        this.destination = destination;
        this.routeData = routeData;
        markers[uuid] = new mapboxgl.Marker()
            .setLngLat(routeData.waypoints[0].location)
            .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                        <div>
                            <h6>Name: ${routeData.waypoints[0].name === "" ? "Pickup Spot" : routeData.waypoints[0].name}</h6>
                        </div>
                        <div>
                            <p>Trip Distance: ${(routeData.routes[0].distance / 1609.344).toFixed(3)}mi</p>
                        </div>
                        <button id="takeCustomerBTN_${uuid}" onclick='toggleDriverList("${uuid}");' class="btn waves-effect waves-light blue">Take Customer</button>
                        `))
            .addTo(map);
    }
}