//p5-layer.js

let map;
let foundMarkers = [];
let p5Ready = false;

let userPulse = 0;

function setup() {
  const canvas = createCanvas(window.innerWidth, window.innerHeight);
  canvas.id('connectionCanvas');
  canvas.style('pointer-events', 'none');
  noFill();
  strokeWeight(3);

  p5Ready = true; // ✅ Set a flag once p5 is ready
  redraw();       // Initial draw
  noLoop(); 
}

function draw() {
  // console.log("✏️ drawing frame");
  clear();

  
  foundMarkers = getFoundMarkerScreenPositions();
  if (foundMarkers.length >= 2) {
    for (let i = 0; i < foundMarkers.length - 1; i++) {
      const a = foundMarkers[i];
      const b = foundMarkers[i + 1];

      stroke(222, 168, 223, 100);
      line(a.x, a.y, b.x, b.y);

      
      stroke(255);
      ellipse(a.x, a.y, 160, 160);
    }
  }

  if (window.userLatLng && map) {
    const screenPos = map.project(window.userLatLng);

    userPulse = (userPulse + 1) % 120;
    const pulseSize = 150 + sin(userPulse * 0.05) * 10;

    stroke(168, 222, 208, 100);
    ellipse(screenPos.x, screenPos.y, pulseSize, pulseSize);
  }

}

function windowResized() {
  resizeCanvas(window.innerWidth, window.innerHeight);
}

function getFoundMarkerScreenPositions() {
  const positions = [];

  const foundList = JSON.parse(localStorage.getItem('foundLichens')) || [];
  const markerEls = document.querySelectorAll('.mapboxgl-marker.found-marker');

  markerEls.forEach(marker => {
    const id = marker.dataset.lichenId;
    const lng = parseFloat(marker.dataset.lng);
    const lat = parseFloat(marker.dataset.lat);


    if (!foundList.includes(id)) return;
    if (isNaN(lat) || isNaN(lng)) {
      console.warn("⚠️ Invalid coordinates for marker", id);
      return;
    }

    const screenPos = map.project({ lng, lat });
    positions.push(screenPos);
  });

  return positions;
}


function waitForMap() {
  if (window.mbMap && typeof window.mbMap.on === 'function' && p5Ready) {
    map = window.mbMap;

    map.on('move', () => redraw());
    map.on('zoom', () => redraw());

    redraw(); // ✅ now safe to call
  } else {
    setTimeout(waitForMap, 100);
  }
}

waitForMap();
