init();

let originLat;
let originLng;
const origin = { lat: originLat, lng: originLng };

let destLat;
let destLng;
const dest = { lat: destLat, lng: destLng };

async function init() {
    // Confirm mobile and request permissions
    await confirmMobile();

    // Fetch JSON location data
    await fetchLocationData();

    // Check the quadrant based on origin and destination
    await fetchQuadrantData();

    // Calculate the angle without considering the device orientation
    await fetchAngleWithoutOrientation();

    // Rotate the arrow
    await rotateArrow();
}

// Confirm device orientation support and request permissions for iOS
function confirmMobile() {
    return new Promise((resolve) => {
        const isIOS = !!(
            navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
            navigator.userAgent.match(/AppleWebKit/)
        );

        if (isIOS) {
            if (typeof DeviceOrientationEvent.requestPermission === "function") {
                DeviceOrientationEvent.requestPermission()
                    .then((response) => {
                        if (response === "granted") {
                            console.log("iOS device: permission granted.");
                            window.addEventListener("deviceorientation", handler, true);
                        } else {
                            alert("Permission denied. Enable motion & orientation access in Safari settings.");
                        }
                        resolve();
                    })
                    .catch((error) => {
                        console.error("Permission request failed:", error);
                        alert("Device orientation permission request failed.");
                        resolve();
                    });
            } else {
                alert("DeviceOrientationEvent.requestPermission is unavailable.");
                resolve();
            }
        } else {
            console.log("Non-iOS device detected. Adding event listener.");
            window.addEventListener("deviceorientation", handler, true);
            resolve();
        }
    });
}

// Handle device orientation events
let compass;
function handler(e) {
    if (e.webkitCompassHeading !== undefined) {
        compass = e.webkitCompassHeading; // iOS-specific compass heading
    } else if (e.alpha !== null) {
        compass = 360 - e.alpha; // Fallback for non-iOS (alpha is relative to north)
    } else {
        console.warn("Device orientation data is unavailable.");
        return;
    }

    ChangeCompassArrowOrientation();
}

// Rotate the compass arrow based on the device's heading
function ChangeCompassArrowOrientation() {
    try {
        const compassArrow = document.getElementById("compass");
        if (compassArrow) {
            compassArrow.style.transform = `rotate(${compass}deg)`;
            console.log(`Compass rotated to ${compass} degrees.`);
        } else {
            console.error("Compass element not found.");
        }
    } catch (error) {
        console.error("Error rotating compass arrow:", error);
    }
}

// Fetch location data from JSON and update DOM
async function fetchLocationData() {
    try {
        const response = await fetch("locations.json");
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const data = await response.json();

        // Update location data in DOM
        const locationDataDiv = document.getElementById("location-data");
        const htmlContent = `
            <h2>Location Details</h2>
            <p><strong>Origin:</strong></p>
            <ul>
                <li>Latitude: ${data.origin.latitude}</li>
                <li>Longitude: ${data.origin.longitude}</li>
            </ul>
            <p><strong>Destination:</strong></p>
            <ul>
                <li>Latitude: ${data.destination.latitude}</li>
                <li>Longitude: ${data.destination.longitude}</li>
            </ul>
        `;
        locationDataDiv.innerHTML = htmlContent;

        // Set origin and destination coordinates
        originLat = data.origin.latitude;
        originLng = data.origin.longitude;
        destLat = data.destination.latitude;
        destLng = data.destination.longitude;
        origin.lat = originLat;
        origin.lng = originLng;
        dest.lat = destLat;
        dest.lng = destLng;

        console.log("Location data fetched and displayed.");
    } catch (error) {
        console.error("Error fetching location data:", error);
    }
}

// Determine the quadrant based on lat/lng differences
const QuadrantData = {
    NORTH_EAST: 0,
    NORTH_WEST: 270,
    SOUTH_EAST: 90,
    SOUTH_WEST: 180,
};

let currentQuadrantData;
let currentQuadrant;

function fetchQuadrantData() {
    return new Promise((resolve) => {
        try {
            const lat_diff = dest.lat - origin.lat;
            const lng_diff = dest.lng - origin.lng;

            if (lat_diff > 0 && lng_diff > 0) {
                currentQuadrantData = QuadrantData.NORTH_EAST;
                currentQuadrant = "North East";
            } else if (lat_diff > 0 && lng_diff < 0) {
                currentQuadrantData = QuadrantData.NORTH_WEST;
                currentQuadrant = "North West";
            } else if (lat_diff < 0 && lng_diff < 0) {
                currentQuadrantData = QuadrantData.SOUTH_WEST;
                currentQuadrant = "South West";
            } else if (lat_diff < 0 && lng_diff > 0) {
                currentQuadrantData = QuadrantData.SOUTH_EAST;
                currentQuadrant = "South East";
            }

            console.log(`Current quadrant: ${currentQuadrant}`);
            console.log(`Quadrant value to add: ${currentQuadrantData}`);
            resolve();
        } catch (error) {
            console.error("Error determining quadrant:", error);
        }
    });
}

// Calculate the angle to the destination without considering orientation
let angle = 0;
function fetchAngleWithoutOrientation() {
    return new Promise((resolve) => {
        try {
            const lat_diff = dest.lat - origin.lat;
            const lng_diff = dest.lng - origin.lng;

            angle = Math.atan2(lat_diff, lng_diff) * (180 / Math.PI);
            angle = (angle + 360) % 360; // Normalize to 0-359 degrees

            console.log(`Calculated angle to destination: ${angle}`);
            resolve();
        } catch (error) {
            console.error("Error calculating angle:", error);
        }
    });
}

// Rotate the arrow to point to the destination
function rotateArrow() {
    return new Promise((resolve) => {
        try {
            const arrow = document.getElementById("arrow");
            if (arrow) {
                arrow.style.transform = `rotate(${angle}deg)`;
                console.log(`Arrow rotated to ${angle} degrees.`);
            } else {
                console.error("Arrow element not found.");
            }
            resolve();
        } catch (error) {
            console.error("Error rotating arrow:", error);
        }
    });
}
