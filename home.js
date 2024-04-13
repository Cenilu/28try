document.addEventListener('DOMContentLoaded', function () {
    var customIcon = L.icon({
        iconUrl: 'https://i.ibb.co/kH2yGn7/MB-Logo.png',
        iconSize: [100, 100], // size of the icon
        iconAnchor: [50, 50], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -10] // point from which the popup should open relative to the iconAnchor
    });
    // Function to ask for location permission
    function askForUserLocationPermission() {
        var modal = document.getElementById("myModal");
        var allowBtn = document.getElementById("allowButton");
        var cancelBtn = document.getElementById("cancelButton");

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (permissionStatus) {
                if (permissionStatus.state === 'granted') {
                    locateUser(); // If permission is already granted, proceed with locating the user
                } else if (permissionStatus.state === 'prompt') {
                    // If permission is not yet determined, prompt the user for permission
                    modal.style.display = "block";
    
                    allowBtn.onclick = function() {
                        modal.style.display = "none";
                        navigator.geolocation.getCurrentPosition(locateUser, function (error) {
                            console.error('Error getting user location:', error.message);
                            alert('Error getting your location. Please make sure you allow location access.');
                        });
                    }
    
                    cancelBtn.onclick = function() {
                        modal.style.display = "none";
                        alert('Location access is denied. Please enable it in your device settings or click the icon on the top right side.');
                    }
                } else {
                    // Permission denied
                    alert('Location access is denied. Please enable it in your device settings or click the icon on the top right side.');
                }
            });
        } else {
            // For browsers not supporting navigator.permissions
            alert('Your browser does not support the Permissions API. Please make sure to allow location access.');
        }
    }
    
    // Call the function to ask for location permission when the document is loaded
    askForUserLocationPermission();

    function locateUser() {
        // Geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function (position) {
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
                var userLocation = L.latLng(userLat, userLng);
                if (myLocationMarker) {
                    myLocationMarker.setLatLng(userLocation, { icon: customIcon }); // Update marker position
                } else {
                    myLocationMarker = L.marker(userLocation, { icon: customIcon, draggable: false }).addTo(map);
                }
                myLocationMarker.bindPopup("<b>My Location</b>").openPopup();
                map.setView(userLocation, 14);
            });
        }
    }

    // Map Initialization
    var map = L.map('map', {
        zoomControl: false // Disable zoom control
    }).setView([14.3990, 120.9777], 14);

    // Tile Layer
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    osm.addTo(map);

    // Variables Initialization
    var myLocationMarker;
    var myDestinationMarker;
    var fixedMarker;
    var routingControl;

    // Search Control
    var searchControl = L.Control.geocoder({
        defaultMarkGeocode: false,
        collapsed: false,
        placeholder: 'Search...',
    }).on('markgeocode', function (e) {
        // Search Marker Handling
        if (myDestinationMarker) {
            map.removeLayer(myDestinationMarker);
        }
        var latlng = e.geocode.center;
        map.setView(latlng, 14);
        myDestinationMarker = L.marker(latlng, { icon: customIcon, draggable: true }).addTo(map);
        myDestinationMarker.bindPopup("<b>My Destination</b>").openPopup();
        myDestinationMarker.on('dragend', function (e) {
            var newLatLng = e.target.getLatLng();
            myDestinationMarker.setLatLng(newLatLng);
            checkbtnStart();
        });
        checkbtnStart();
    }).addTo(map);
    
    // Add clear icon
    var clearIcon = L.DomUtil.create('div', 'clear-icon');
    clearIcon.innerHTML = '<i class="fas fa-times"></i>';
    clearIcon.onclick = function () {
        // Clear the input field or perform any other desired action
        // For example, if using jQuery:
        // $('.leaflet-control-geocoder-form input').val('');
        // Or pure JavaScript:
        // document.querySelector('.leaflet-control-geocoder-form input').value = '';
    };
    searchControl.getContainer().appendChild(clearIcon);

    function watchUserPosition() {
        console.log("Watching user's position...");
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(function (position) {
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;
                var userLocation = L.latLng(userLat, userLng);

                // Remove existing marker
                if (myLocationMarker) {
                    map.removeLayer(myLocationMarker);
                    myLocationMarker = null;
                }

                // Create a new marker at the user's location
                myLocationMarker = L.marker(userLocation, { icon: customIcon }).addTo(map);

                // Create a circle overlay around the user's location
                if (circleMyLocation) {
                    map.removeLayer(circleMyLocation); // Remove the old circle
                }
                var circleOptions = {
                    color: '#020035', // Border color
                    fillColor: '#020035', // Fill color
                    fillOpacity: 0.3
                };
                circleMyLocation = L.circle(userLocation, { radius: 500, ...circleOptions }).addTo(map);

                // Zoom to user location marker
                map.setView(userLocation, 14);

                // Popup for user location marker
                myLocationMarker.bindPopup("<b>My Location</b>").openPopup();
            }, function (error) {
                console.error('Error getting user location:', error.message);
                alert('Error getting your location. Please make sure you allow location access.');
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: 0 });

        } else {
            alert('Geolocation is not supported by your browser');
        }
    }

    // Function to start watching the user's position when the button is clicked
    function startWatchingUserPosition() {
        document.getElementById('btnStart').addEventListener('click', togglewatchUserPosition);
    }

    function clearRouting() {
        // Clear Routing Control
        if (routingControl) {
            map.removeControl(routingControl);
        }
    }

    // Event Listeners
    document.getElementById("btnLocate").addEventListener("click", locateUser);

    document.getElementById("btnStart").addEventListener("click", function () {
        if (routingControl) {
            // Stop Button Functionality
            map.removeControl(routingControl);
            if (circle) {
                map.removeLayer(circle); // Remove the circle
                circle = null; // Reset circle variable
            }
            myDestinationMarker.dragging.enable();
            if (fixedMarker) {
                map.removeLayer(fixedMarker);
                fixedMarker = null;
            }
            document.getElementById("btnStart").innerHTML = '<i class="fas fa-play"></i>';
            routingControl = null;
        } else {
            // Start Button Functionality
            if (myLocationMarker && myDestinationMarker) {
                clearRouting();

                routingControl = L.Routing.control({
                    waypoints: [
                        myLocationMarker.getLatLng(),
                        myDestinationMarker.getLatLng()
                    ],
                    routeWhileDragging: false, // Disable dragging while routing
                    createMarker: function () { return null; }, // Disable creation of new markers
                    show: false, // Hide the route line initially
                    addWaypoints: false, // Prevent adding additional waypoints
                }).addTo(map);

                // Zoom to user location marker
                map.setView(myLocationMarker.getLatLng(), 14);

                // Draggable markers for route start and end points
                fixedMarker = L.layerGroup([L.marker(myLocationMarker.getLatLng(), { icon: customIcon, draggable: false }), L.marker(myDestinationMarker.getLatLng(), { icon: customIcon, draggable: false })]).addTo(map);
                fixedMarker.eachLayer(function (layer) {
                    layer.on('dragend', function (e) {
                        var newLatLng = e.target.getLatLng();
                        myDestinationMarker.setLatLng(newLatLng);
                    });
                });

                document.getElementById("btnStart").innerHTML = '<i class="fas fa-stop"></i>';

                // Add circle with radius extending from myDestinationMarker to myLocationMarker
                var circleOptions = {
                    color: '#d4af37',
                    fillColor: '#d4af37',
                    fillOpacity: 0.3
                };
                var circleRadius = myLocationMarker.getLatLng().distanceTo(myDestinationMarker.getLatLng());
                circle = L.circle(myDestinationMarker.getLatLng(), { radius: circleRadius, ...circleOptions }).addTo(map);
                
                startWatchingUserPosition();
            }
        }
    });
});