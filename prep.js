function startGame() {
    toggleStartMenu();
    document.getElementById('dashboard').style.visibility = 'visible';
    var randomCar = cars[getRandomInt(0, cars.length - 1)];
    var yearModel;
    if (randomCar[Cars.END_YEAR] === Cars.PRESENT)
        yearModel = getRandomInt(randomCar[Cars.START_YEAR], new Date().getFullYear() + 1);
    else
        if (randomCar[Cars.END_YEAR].toString().length == 2)
            yearModel = parseInt(randomCar[Cars.START_YEAR].toString().substr(0, 2) + randomCar[Cars.END_YEAR].toString());
        else
            yearModel = getRandomInt(randomCar[Cars.START_YEAR], randomCar[Cars.END_YEAR]);
    createNewDriver(Cars.DRIVER_TYPE[getRandomInt(0, 3)], `${yearModel} ${randomCar[Cars.NAME]}`, points[0], (yearModel - Cars.OLDEST_YEAR + 10) * 10);
    createNewCustomer(getRandomLatLng(NewYorkBounds), getRandomLatLng(NewYorkBounds));
}

function createNewDriver(driverType, car, startPoint, signupPrice) {
    var driverUUID = uuidv4();
    drivers.set(driverUUID, new Driver(driverUUID, driverType, car, getRandomInt(2, 15) / 100, startPoint, signupPrice));
    var countOfNewDrivers = 0;
    drivers.forEach(function (driver, key, map) {
        if (driver.state === Driver.NOT_HIRED) {
            countOfNewDrivers++;
        }
    });
    document.getElementById('newDriver').innerHTML = countOfNewDrivers;

    if (drivers.size == 1)
        updateDriverList(driverUUID);

    var randomCar = cars[getRandomInt(0, cars.length - 1)];
    var yearModel;
    if (randomCar[Cars.END_YEAR] === Cars.PRESENT)
        yearModel = getRandomInt(randomCar[Cars.START_YEAR], new Date().getFullYear() + 1);
    else
        if (randomCar[Cars.END_YEAR].toString().length == 2)
            yearModel = parseInt(randomCar[Cars.START_YEAR].toString().substr(0, 2) + randomCar[Cars.END_YEAR].toString());
        else
            yearModel = getRandomInt(randomCar[Cars.START_YEAR], randomCar[Cars.END_YEAR]);
    setTimeout(createNewDriver, 5000 * (Math.pow(drivers.size, 2)), Cars.DRIVER_TYPE[getRandomInt(0, 3)], `${yearModel} ${randomCar[Cars.NAME]}`, points[getRandomInt(0, points.length)], (yearModel - Cars.OLDEST_YEAR + 10) * 10);
}

function createNewCustomer(origin, destination) {
    $.get(`https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]}%2C${origin[1]}%3B${destination[0]}%2C${destination[1]}.json?access_token=${mapboxgl.accessToken}&geometries=geojson&overview=full`,
        function (data, status) {
            if (status == 'success') {
                var customerUUID = uuidv4();
                customers.set(customerUUID, new Customer(customerUUID, origin, destination, data));
            }
            setTimeout(createNewCustomer, 10000 * (Math.pow(customers.size, 2)), getRandomLatLng(NewYorkBounds), getRandomLatLng(NewYorkBounds));
        });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getRandomLatLng(bounds) {
    bounds = bounds.toArray();
    return [Math.random() * (bounds[1][0] - bounds[0][0]) + bounds[0][0],
    Math.random() * (bounds[1][1] - bounds[0][1]) + bounds[0][1]];
}

function distance(lat1, lon1, lat2, lon2) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        return dist;
    }
}

function toggleDriverList(customerUUID) {
    if (typeof customerUUID === 'string') {
        var driveTableList = document.getElementById('driveTableList');
        while (driveTableList.firstChild) {
            driveTableList.removeChild(driveTableList.firstChild);
        }
        var customerData = customers.get(customerUUID);
        drivers.forEach(function (driver, key, map) {
            if (driver.state !== Driver.NOT_HIRED) {
                var driverTR = document.createElement('tr');
                var driverTypeTD = document.createElement('td');
                if (driver.driverType == Cars.DRIVER_TYPE[0])
                    driverTypeTD.classList.add('blue-text');
                else if (driver.driverType == Cars.DRIVER_TYPE[1])
                    driverTypeTD.classList.add('red-text');
                else if (driver.driverType == Cars.DRIVER_TYPE[2])
                    driverTypeTD.classList.add('green-text');
                driverTypeTD.appendChild(document.createTextNode(driver.driverType));
                var driverCostTD = document.createElement('td');
                driverCostTD.appendChild(document.createTextNode(`$${driver.rate}/mi`));
                var routeCostTD = document.createElement('td');
                routeCostTD.appendChild(document.createTextNode(`$${(driver.rate * (customerData.routeData.routes[0].distance / 1609.344)).toFixed(2)}`));

                var distanceToCustomer = document.createElement('td');
                distanceToCustomer.appendChild(document.createTextNode(`${
                    distance(customerData.routeData.waypoints[0].location[1],
                        customerData.routeData.waypoints[0].location[0],
                        driver.position.features[0].geometry.coordinates[1],
                        driver.position.features[0].geometry.coordinates[0]).toFixed(3)}mi`));

                var goTD = document.createElement('td');
                var btn = document.createElement('button');
                btn.classList.add('btn');
                btn.classList.add('waves-effect');
                btn.classList.add('waves-light');
                btn.classList.add('blue');
                if (driver.state === Driver.DRIVING_CUSTOMER)
                    btn.classList.add('disabled');
                btn.setAttribute("onclick", `toggleDriverList(); runDriveFUNC("${driver.uuid}", "${customerUUID}", ${(driver.rate * (customerData.routeData.routes[0].distance / 1609.344)).toFixed(2)});`);
                // if (driver.driverType === Cars.DRIVER_TYPE[2])
                //     btn.appendChild(document.createTextNode('Add to Route'));
                // else
                btn.appendChild(document.createTextNode('GO'));
                goTD.appendChild(btn);
                driverTR.appendChild(driverTypeTD);
                driverTR.appendChild(driverCostTD);
                driverTR.appendChild(routeCostTD);
                driverTR.appendChild(distanceToCustomer);
                driverTR.appendChild(goTD);
                driveTableList.appendChild(driverTR);
            }
        });
    }

    document.querySelector('.driverList').classList.toggle("show-modal");
    document.querySelector(".driverList-close-button").addEventListener("click", toggleDriverList);
}

function runDriveFUNC(driverUUID, customerUUID, cost) {
    document.getElementById(`takeCustomerBTN_${customerUUID}`).classList.add("disabled");
    drivers.get(driverUUID).drive(customers.get(customerUUID).origin, customers.get(customerUUID));
    markers[customerUUID].remove();
    updateMoneyAmount(-cost);
}

function toggleNewDriverList(closeWindow) {
    var newDriveTableList = document.getElementById('newDriveTableList');
    while (newDriveTableList.firstChild) {
        newDriveTableList.removeChild(newDriveTableList.firstChild);
    }
    drivers.forEach(function (driver, key, map) {
        if (driver.state === Driver.NOT_HIRED) {
            var driverTR = document.createElement('tr');
            var driverTypeTD = document.createElement('td');
            if (driver.driverType == Cars.DRIVER_TYPE[0])
                driverTypeTD.classList.add('blue-text');
            else if (driver.driverType == Cars.DRIVER_TYPE[1])
                driverTypeTD.classList.add('red-text');
            else if (driver.driverType == Cars.DRIVER_TYPE[2])
                driverTypeTD.classList.add('green-text');
            driverTypeTD.appendChild(document.createTextNode(driver.driverType));
            var driverCarTD = document.createElement('td');
            driverCarTD.appendChild(document.createTextNode(driver.car));
            var driverCostTD = document.createElement('td');
            driverCostTD.appendChild(document.createTextNode(`$${driver.rate}/mi`));
            var driverSUCostTD = document.createElement('td');
            driverSUCostTD.appendChild(document.createTextNode(`$${driver.signupPrice}`));
            var goTD = document.createElement('td');
            var btn = document.createElement('button');
            btn.classList.add('btn');
            btn.classList.add('waves-effect');
            btn.classList.add('waves-light');
            btn.classList.add('blue');
            btn.setAttribute("onclick", `updateDriverList("${driver.uuid}"); toggleNewDriverList(false);`);
            btn.appendChild(document.createTextNode('Add Driver'));
            goTD.appendChild(btn);

            driverTR.appendChild(driverTypeTD);
            driverTR.appendChild(driverCarTD);
            driverTR.appendChild(driverCostTD);
            driverTR.appendChild(driverSUCostTD);
            driverTR.appendChild(goTD);
            newDriveTableList.appendChild(driverTR);
        }
    });

    if (closeWindow) {
        document.querySelector('.newDriverList').classList.toggle("show-modal");
        document.querySelector(".newDriverList-close-button").addEventListener("click", function () {
            toggleNewDriverList(true);
        });
    }
}

function updateDriverList(driverUUID) {
    drivers.get(driverUUID).addDriver();
    var countOfNewDrivers = 0;
    drivers.forEach(function (driver, key, map) {
        if (driver.state === Driver.NOT_HIRED) {
            countOfNewDrivers++;
        }
    });
    document.getElementById('newDriver').innerHTML = countOfNewDrivers;
}

function toggleStartMenu() {
    document.querySelector('.startMenu').classList.toggle("show-modal");
}

function updateMoneyAmount(amount) {
    moneyAmount += amount;
    var val = Math.round(Number(moneyAmount) * 100) / 100;
    var parts = val.toString().split(".");
    var num = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
    document.getElementById('totalMoney').innerHTML = `$${num}`;
}