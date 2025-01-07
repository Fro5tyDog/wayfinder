document.getElementById("startButton").addEventListener("click", async () => {
    console.log("Start button clicked!");

    // Start the initialization process
    await confirmMobile();
    await init();

    // Start the animation loop for updates
    startAnimationLoop();
});

let originLat;
let originLng;
const origin = { lat: originLat, lng: originLng };

let destLat;
let destLng;
const dest = { lat: destLat, lng: destLng };

let compassHeading = 0; // Current heading of the phone
let angle = 0; // Angle to the destination
let isCompassReady = false; // Ensure compass data is initialized

async function init() {
    await fetchLocationData();
    await fetchQuadrantData();
    await fetchAngleWithoutOrientation();
    await rotateArrow();
}

function confirmMobile() {
    return new Promise((resolve, reject) => {
        try{
            // Call the function to fetch the Quadrant Data
            resolve(promiseConfirmMobile());
        }
        catch(error){
            reject(new Error(`Error fetching mobile phone data: ${error.message}`));
        }   
    })
}

function promiseConfirmMobile(){
    try{
        const isIOS = !(
            navigator.userAgent.match(/(iPod|iPhone|iPad)/) &&
            navigator.userAgent.match(/AppleWebKit/)
        );
    
        if (isIOS) {
            DeviceOrientationEvent.requestPermission()
              .then((response) => {
                if (response === "granted") {
                  window.addEventListener("deviceorientation", handler, true);
                } else {
                  alert("has to be allowed!");
                }
              })
              .catch(() => alert("not supported"));
          } else {
            window.addEventListener("deviceorientationabsolute", handler, true);
          }
    }catch(err){
        console.error(new Error('Not a mobile device'));
    }
}   


// function handler(e) {
//     // || Math.abs(e.alpha - 360);
//     compassHeading = e.webkitCompassHeading;
//     ChangeCompassArrowOrientation();
//     rotateArrowToDestination(angle, compassHeading);
// }

function handler(e) {
    if (e.webkitCompassHeading !== undefined) {
        compassHeading = e.webkitCompassHeading; // iOS-specific
    } else if (e.alpha !== null) {
        compassHeading = 360 - e.alpha; // Normalize alpha to compass direction
    } else {
        console.warn("Compass heading not available.");
    }
    isCompassReady = true; // Mark that compass data is now ready
}

// Animation Loop
function startAnimationLoop() {
    function update() {
        if (isCompassReady) {
            document.getElementById("debug").innerHTML = `Compass Heading: ${compassHeading}` + "\n" + `Updated Angle to Destination: ${angle}`;
            // Update compass arrow
            const compassElement = document.getElementById("compass");
            if (compassElement) {
                compassElement.style.transform = `rotate(${compassHeading}deg)`;
            }

            // Dynamically recalculate the destination angle
            const lat_diff = dest.lat - origin.lat;
            const lng_diff = dest.lng - origin.lng;
            const updatedAngle = (Math.atan2(lng_diff, lat_diff) * 180) / Math.PI;
            angle = (updatedAngle + 360) % 360; // Normalize to 0-359 degrees

            // Update target pointer arrow
            const shortestDifference = calculateShortestRotation(angle, compassHeading);
            const targetPointer = document.getElementById("target-pointer");
            if (targetPointer) {
                targetPointer.style.transform = `rotate(${compassHeading + shortestDifference}deg)`;
            }
        }

        // Request the next frame
        requestAnimationFrame(update);
    }

    // Start the loop
    update();
}



function calculateShortestRotation(destinationAngle, compassHeading) {
    // Calculate the raw difference
    let rawDifference = destinationAngle - compassHeading;

    // Normalize the difference to -180 to 180
    let shortestDifference = (rawDifference + 180) % 360 - 180;

    return shortestDifference; // Shortest rotation angle
}

function fetchLocationData() {
    return new Promise((resolve, reject) => {
        try{
            // Call the function to fetch and display the data
            resolve(findAndDisplayLocations());
        }
        catch(error){
            reject(new Error(`Error loading the JSON data: ${error.message}`));
        }   
    })
}

// step1 
// Function to fetch JSON data and update the DOM
async function findAndDisplayLocations() {
    try {
        // Fetch JSON data (replace 'locations.json' with your actual file or API endpoint)
        const response = await fetch('locations.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }
        const data = await response.json();

        // Select the location-data div
        const locationDataDiv = document.getElementById('location-data');

        // Create HTML content based on the JSON data
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

        // Insert the content into the div
        locationDataDiv.innerHTML = htmlContent;

        originLat = data.origin.latitude;
        originLng = data.origin.longitude;
        destLat = data.destination.latitude;
        destLng = data.destination.longitude;

        origin.lat = originLat
        origin.lng = originLng
        dest.lat = destLat
        dest.lng = destLng;

    } catch (error) {
        console.error('Error:', error);
    }
}

// step2

const QuadrantData = {
    NORTH_EAST: 0,
    NORTH_WEST: 270,
    SOUTH_EAST: 90,
    SOUTH_WEST: 180
};

let currentQuadrantData;
let currentQuadrant;

function fetchQuadrantData() {
    return new Promise((resolve, reject) => {
        try{
            // Call the function to fetch the Quadrant Data
            resolve(findQuadrantData());
        }
        catch(error){
            reject(new Error(`Error calculating the quadrant data: ${error.message}`));
        }   
    })
}

function findQuadrantData(){
    try{
        // find difference in lat and lng between distance and origin
        const lat_diff = dest.lat - origin.lat;
        const lng_diff = dest.lng - origin.lng;

        // evaluate which are positive and which are negative
        // determine quadrant based on the evaluated values
        
        // North east, positive lat and positive lng
        if(lat_diff > 0 && lng_diff > 0){
            currentQuadrantData = QuadrantData.NORTH_EAST;
            currentQuadrant = 'North East';
        }
        // North west, positive lat and negative lng
        if(lat_diff > 0 && lng_diff < 0){
            currentQuadrantData = QuadrantData.NORTH_WEST;
            currentQuadrant = 'North West';
        }
        // South west, negative lat and negative lng
        if(lat_diff < 0 && lng_diff < 0){
            currentQuadrantData = QuadrantData.SOUTH_WEST;
            currentQuadrant = 'South West';
        }
        // South east, negative lat and positive lng
        if(lat_diff < 0 && lng_diff > 0){
            currentQuadrantData = QuadrantData.SOUTH_EAST;
            currentQuadrant = 'South East';
        }

        console.log(`The current location is in Quadrant: ${currentQuadrant}`);
        console.log(`The value to add is ${currentQuadrantData}`);
    }
    catch(error){
        console.error('Error:', error);
    }
}

// step3
function fetchAngleWithoutOrientation() {
    return new Promise((resolve, reject) => {
        try{
            // Call the function to fetch the Quadrant Data
            resolve(findAngleWithoutOrientation());
        }
        catch(error){
            reject(new Error(`Error calculating the angle before phone orientation: ${error.message}`));
        }   
    })
}

function findAngleWithoutOrientation(){
    try{
        // latitude is the y coordinate of the graph
        // longitude is the x coordinate of the graph
        const lat_diff = dest.lat - origin.lat;
        const lng_diff = dest.lng - origin.lng;

        switch(currentQuadrant){
            case 'North East':
                angle = Math.floor((Math.atan2(lng_diff, lat_diff) * 180 / Math.PI));
                angle = (angle + 360) % 360; // Normalize to 0-359 degrees
                angle = Math.floor(angle); // Round down
                break;
            case 'North West':
                angle = Math.floor((Math.atan2(lng_diff, lat_diff) * 180 / Math.PI));
                angle = (angle + 360) % 360; // Normalize to 0-359 degrees
                angle = Math.floor(angle); // Round down
                break;
            case 'South West':
                angle = Math.floor((Math.atan2(lng_diff, lat_diff) * 180 / Math.PI));
                angle = (angle + 360) % 360; // Normalize to 0-359 degrees
                angle = Math.floor(angle); // Round down
                break;
            case 'South East':
                angle = Math.floor((Math.atan2(lng_diff, lat_diff) * 180 / Math.PI));
                angle = (angle + 360) % 360; // Normalize to 0-359 degrees
                angle = Math.floor(angle); // Round down
                break;
            default:
                return 0; // return 0 if the current quadrant is not defined (which should not happen)
        }
        console.log(angle);


    } catch(error) {
        console.error('Error:', error);
    }
}

// step 4

function rotateArrow(){
    return new Promise((resolve, reject) => {
        try{
            // Call the function to fetch the Quadrant Data
            resolve(ChangeArrowOrientation());
        }
        catch(error){
            reject(new Error(`Error calculating the quadrant data: ${error.message}`));
        }   
    })
}

function ChangeArrowOrientation(){
    try{
        // rotate arrow
        document.getElementById("arrow").style.transform = `rotate(${angle}deg)`;
    } catch(error) {
        console.error('Error:', error);
    }
}

