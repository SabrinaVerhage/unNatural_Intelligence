// Replace with your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3J2ZXJoYWdlIiwiYSI6ImNtYnMzNm9qdzAybjUyanNlMXlhczdrMGUifQ.ZHIcBM7xpHAdreoJJFWKCQ';

let appMode = 'view'; // or 'new'
const infoCard = document.getElementById('info-card');
const formContainer = document.getElementById('form-container');
let selectedCoords = null;

const toggleBtn = document.getElementById('toggle-form');

document.getElementById('start-btn').addEventListener('click', () => {
  const intro = document.getElementById('instr-screen');
  intro.classList.add('fade-out');

  // Optional: delay fully removing it
  setTimeout(() => {
    intro.style.display = 'none';
  }, 600); // matches transition duration
});

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [4.89, 52.37],
  zoom: 12
});

//the plus and minus button
// map.addControl(new mapboxgl.NavigationControl());

// Load locations from server
fetch('/api/locations')
  .then(res => res.json())
  .then(locations => {
    locations.forEach(loc => {


      const marker = new mapboxgl.Marker()
        .setLngLat(loc.coordinates)
        .addTo(map);

      // Show info card on click
      marker.getElement().addEventListener('click', () => {
        if (appMode !== 'view') return; 
        showInfoCard(loc)
      });

  });
});


// Show user's location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;

    new mapboxgl.Marker({ color: 'blue' })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup().setText("You are here"))
      .addTo(map);

    map.flyTo({ center: [longitude, latitude], zoom: 14 });
  });
}


//behavior when you click on the map
map.on('click', (e) => {
  const clickedEl = e.originalEvent.target;

  // If you clicked a marker, do nothing here!
  if (clickedEl.closest('.mapboxgl-marker')) {
    return;
  }

  if (appMode === 'new') {
    selectedCoords = [e.lngLat.lng, e.lngLat.lat];
    document.getElementById('coords').value = `${selectedCoords[0].toFixed(5)}, ${selectedCoords[1].toFixed(5)}`;
  } else {
    hideForm();
    infoCard.style.display = 'none';
  }
});

//behavior for submitting a new lichen form
document.getElementById('location-form').addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  // const message = document.getElementById('message').value.trim();
  const desc = document.getElementById('desc').value.trim();
  const locImg = document.getElementById('locImg').value.trim();
  const lichImg = document.getElementById('lichImg').value.trim();

  if (!selectedCoords) {
    alert('Click the map to select a location first!');
    return;
  }

  fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      coordinates: selectedCoords,
      locationDescription: desc,      
      locationImage: locImg,
      lichenImage: lichImg
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert('Saved!');

      // Add the new marker instantly
      const marker = new mapboxgl.Marker()
        .setLngLat(selectedCoords)
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        if (appMode !== 'view') return;
        showInfoCard({
          name,
          locationDescription: desc,
          locationImage: locImg,
          lichenImage: lichImg,
          personality: "✨ Newly added!"
        });
      });

      // Clear form
      document.getElementById('location-form').reset();
      document.getElementById('coords').value = '';
      selectedCoords = null;
    } else {
      alert('Error saving point.');
    }
  });
});

//show the form 
function showForm() {
  formContainer.classList.add('show');
  infoCard.style.display = 'none';
  toggleBtn.classList.add('open');
  appMode = 'new'; // ✨ enter new-entry mode
}

//hide the form 
function hideForm() {
  formContainer.classList.remove('show');
  toggleBtn.classList.remove('open');
  appMode = 'view'; // ✨ back to view mode
}

//show the info card 
function showInfoCard(data) {
  document.getElementById('info-name').textContent = data.name || '';
  document.getElementById('info-desc').textContent = data.locationDescription || '';
  document.getElementById('info-personality').textContent = data.personality || '';

  const imagesDiv = document.getElementById('info-images');
  imagesDiv.innerHTML = '';

  if (data.locationImage) {
    const img1 = document.createElement('img');
    img1.src = data.locationImage;
    imagesDiv.appendChild(img1);
  }

  if (data.lichenImage) {
    const img2 = document.createElement('img');
    img2.src = data.lichenImage;
    imagesDiv.appendChild(img2);
  }

  infoCard.classList.remove('hidden');
  infoCard.style.display = 'block';
}

//close the info card
document.getElementById('close-info').addEventListener('click', () => {
  infoCard.style.display = 'none';
  infoCard.classList.add('hidden'); 
});

toggleBtn.addEventListener('click', () => {
  const isVisible = formContainer.classList.contains('show');
  isVisible ? hideForm() : showForm();
});


//////////
// Camera logic
const openCamBtn = document.getElementById('open-camera');
const cameraContainer = document.getElementById('camera-container');
const video = document.getElementById('video');
const snap = document.getElementById('snap');
const canvas = document.getElementById('canvas');
const closeCamBtn = document.getElementById('close-camera');

// Open camera view from info card
openCamBtn.addEventListener('click', () => {
  infoCard.style.display = 'none';
  cameraContainer.classList.remove('hidden');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      alert("Unable to access camera.");
      console.error(err);
    });
});

// Capture image
snap.addEventListener('click', () => {
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  const imgData = canvas.toDataURL('image/png');
  localStorage.setItem('lichenPhoto', imgData);

  // alert("Photo captured! 🌿"); 
  window.location.href = 'chat.html';
});

// Close camera and return to info card
closeCamBtn.addEventListener('click', () => {
  cameraContainer.classList.add('hidden');
  infoCard.style.display = 'block';
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
});

