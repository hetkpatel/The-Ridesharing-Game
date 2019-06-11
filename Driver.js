class Driver {
    uuid;
    state;
    driverType;
    car;
    position;
    hasCustomer = false;
    income = 0;
    rate; // dollar amount per mile
    signupPrice;

    constructor(uuid, driverType, car, rate, position, signupPrice) {
        this.uuid = uuid;
        this.state = Driver.NOT_HIRED;
        this.driverType = driverType;
        this.car = car;
        this.rate = rate;
        this.signupPrice = signupPrice;
        this.position = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "Point",
                    "coordinates": position
                }
            }]
        };;
    }

    drive(goToPoint, customer) {
        this.state = Driver.DRIVING_CUSTOMER;
        this.driveHelper(this.uuid, this.position, this.position.features[0].geometry.coordinates, goToPoint, customer);
    }

    driveHelper(uuid, position, origin, destination, customer) {
        var context = this;
        $.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]}%2C${origin[1]}%3B${destination[0]}%2C${destination[1]}.json?access_token=${mapboxgl.accessToken}&geometries=geojson&overview=full`,
            function (data, status) {
                if (status == 'success') {
                    var route = {
                        "type": "FeatureCollection",
                        "features": [{
                            "type": "Feature",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": data.routes[0].geometry.coordinates
                            }
                        }]
                    };

                    // Calculate the distance in kilometers between route start/end point.
                    var lineDistance = data.routes[0].distance / 1000;
                    var steps = lineDistance * 50;//getRandomInt(100, 300); // SPEED!!!

                    var arc = [];

                    // Draw an arc between the `origin` & `destination` of the two points
                    for (var i = 0; i < lineDistance; i += lineDistance / steps) {
                        var segment = turf.along(route.features[0], i, { options: 'kilometers' });
                        arc.push(segment.geometry.coordinates);
                    }

                    // Update the route with calculated arc coordinates
                    route.features[0].geometry.coordinates = arc;

                    map.addSource(`route_${uuid}`, {
                        "type": "geojson",
                        "data": route
                    });

                    map.addLayer({
                        "id": `route_${uuid}`,
                        "source": `route_${uuid}`,
                        "type": "line",
                        "paint": {
                            "line-width": 2,
                            "line-color": "#007cbf"
                        }
                    });

                    anim.mainFunc(uuid, position, route, steps, 0, context, customer);
                } else {
                    console.error('status', status);
                    console.error('data', data);
                }
            });
    }

    addDriver() {
        this.state = Driver.IDLE;
        if (drivers.size != 1)
            updateMoneyAmount(-this.signupPrice);

        /*
        {r: 255, g: 68, b: 0} - Red
        {r: 0, g: 26, b: 255} - Blue
        {r: 0, g: 255, b: 38} - Green
        */
        var driverType = this.driverType;

        let size = 100;
        let pulsingDot = {
            width: size,
            height: size,
            data: new Uint8Array(size * size * 4),
            color: [],

            onAdd: function () {
                var canvas = document.createElement('canvas');
                canvas.width = this.width;
                canvas.height = this.height;
                this.context = canvas.getContext('2d');
                // this.color = [color.r, color.g, color.b];
                switch (driverType) {
                    case Cars.DRIVER_TYPE[0]:
                        this.color = [0, 26, 255];
                        break;
                    case Cars.DRIVER_TYPE[1]:
                        this.color = [255, 68, 0];
                        break;
                    case Cars.DRIVER_TYPE[2]:
                        this.color = [0, 255, 38];
                        break;
                    default:
                        this.color = [255, 255, 255];
                        break;
                }
            },

            render: function () {
                var duration = 1000;
                var t = (performance.now() % duration) / duration;
                var radius = size / 2 * 0.3;
                var outerRadius = size / 2 * 0.7 * t + radius;
                var context = this.context;

                // draw outer circle
                context.clearRect(0, 0, this.width, this.height);
                context.beginPath();
                context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
                context.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]},${(1 - t)})`;
                context.fill();

                // draw inner circle
                context.beginPath();
                context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 1)`;
                context.strokeStyle = 'white';
                context.lineWidth = 4;
                context.fill();
                context.stroke();

                // update this image's data with data from the canvas
                this.data = context.getImageData(0, 0, this.width, this.height).data;

                // keep the map repainting
                map.triggerRepaint();

                // return `true` to let the map know that the image was updated
                return true;
            }
        };

        map.addImage(`driver_${this.uuid}`, pulsingDot, { pixelRatio: 2 });

        map.addSource(`point_${this.uuid}`, {
            "type": "geojson",
            "data": this.position
        });

        map.addLayer({
            "id": `point_${this.uuid}`,
            "source": `point_${this.uuid}`,
            "type": "symbol",
            "layout": {
                "icon-image": `driver_${this.uuid}`,
                "icon-allow-overlap": true,
                "icon-ignore-placement": true
            }
        });
    }

}

var anim = {
    mainFunc: function (uuid, point, route, steps, counter, context, customer) {
        // Update point geometry to a new position based on counter denoting
        // the index to access the arc.
        point.features[0].geometry.coordinates = route.features[0].geometry.coordinates[counter];

        if (counter >= steps - 1) {
            map.removeLayer(`route_${uuid}`);
            map.removeSource(`route_${uuid}`);
            if (!context.hasCustomer) {
                context.hasCustomer = true;
                context.drive(customer.destination, customer);
            } else {
                context.state = Driver.IDLE;
                context.hasCustomer = false;
                updateMoneyAmount(bookingFee);
                customers.delete(customer.uuid);
            }
        }

        point.features[0].properties.bearing = turf.bearing(
            turf.point(route.features[0].geometry.coordinates[counter >= steps ? counter - 1 : counter]),
            turf.point(route.features[0].geometry.coordinates[counter >= steps ? counter : counter + 1])
        );

        // Update the source with this new data.
        map.getSource(`point_${uuid}`).setData(point);

        // Request the next frame of animation so long the end has not been reached.
        if (counter < steps) {
            requestAnimationFrame(function () {
                anim.mainFunc(uuid, point, route, steps, counter, context, customer);
            });
        }

        counter = counter + 1;
    }
}

Driver.NOT_HIRED = "not hired";
Driver.IDLE = "idle";
Driver.DRIVING_CUSTOMER = "driving customer";