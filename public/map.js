// Replace with your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3J2ZXJoYWdlIiwiYSI6ImNtYnMzNm9qdzAybjUyanNlMXlhczdrMGUifQ.ZHIcBM7xpHAdreoJJFWKCQ';


//SETUP --- DECLARING VARIABLES 
let appMode = 'view'; // or 'new'
let selectedCoords = null;
let currentActiveMarker = null;

const instrScreen = document.getElementById('instr-screen');
const backToMap = document.getElementById('instr-back');
const closeBtn = document.getElementById('instr-close');
const helpBtn = document.getElementById('help-btn');
const toggleBtn = document.getElementById('toggle-info');
const image = document.getElementById('info-image');

const infoCard = document.getElementById('info-card');
const infoName = document.getElementById('info-name');
const infoDesc = document.getElementById('info-desc');
const infoPersonality = document.getElementById('info-personality');
const infoImage = document.getElementById('info-image');
const closeInfoBtn = document.getElementById('close-info');
const formContainer = document.getElementById('form-container');
const addBtn = document.getElementById('add-btn'); 



//INSTRUCTIONS OVERLAY
helpBtn.addEventListener('click', () => {
  instrScreen.style.display = 'flex';
  instrScreen.classList.remove('fade-out');
  instrScreen.classList.add('fade-in');
  instrScreen.scrollTop = 0; //reset scroll position
});

function closeInstructions() {
  instrScreen.classList.remove('fade-in');
  instrScreen.classList.add('fade-out');
  setTimeout(() => {
    instrScreen.style.display = 'none';
  }, 500); // match the CSS transition time
}

backToMap.addEventListener('click', closeInstructions);
closeBtn.addEventListener('click', closeInstructions);


// SLIDE-IN INFO CARD
function showInfoCard(data) {
  infoName.textContent = data.name || '';
  infoDesc.textContent = data.locationDescription || '';
  infoPersonality.textContent = data.personality || '';
  infoImage.src = data.lichenImage || '';

  infoCard.classList.remove('hidden', 'expanded');
  infoCard.classList.add('visible', 'collapsed');
  toggleBtn.textContent = 'more info...';
  toggleBtn.classList.remove('hidden');
  foundBtn.classList.add('hidden');
}

// TOGGLE INFO CARD (expand/collapse)
function toggleInfoCard() {
  const isCollapsed = infoCard.classList.contains('collapsed');

  infoCard.classList.toggle('collapsed', !isCollapsed);
  infoCard.classList.toggle('expanded', isCollapsed);

  // update button text
  toggleBtn.textContent = isCollapsed ? 'less info...' : 'more info...';

  // show/hide bottom UI
  // foundBtn.classList.toggle('hidden', !isCollapsed);
}

// Button click (toggle)
toggleBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // avoid double toggling if image also clicked
  toggleInfoCard();
});

// Image click (collapse only if expanded)
image.addEventListener('click', () => {
  if (infoCard.classList.contains('expanded')) {
    toggleInfoCard();
  }
});

// CLOSE INFO CARD
closeInfoBtn.addEventListener('click', () => {
  infoCard.classList.remove('visible');
  setTimeout(() => {
    infoCard.classList.add('hidden');
    infoCard.classList.add('collapsed');
  }, 400); // matches CSS transition time
});



// MAIN MAP STUFF
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

      const el = document.createElement('div');
      el.className = 'lichen-marker';
      el.style.backgroundImage = `url('${loc.lichenImage}')`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat(loc.coordinates)
        .addTo(map);

      // Show info card on click
      el.addEventListener('click', () => {
        if (appMode !== 'view') return;

        // Handle active marker styling
        if (currentActiveMarker) {
          currentActiveMarker.classList.remove('active');
        }
        el.classList.add('active');
        currentActiveMarker = el;

        localStorage.setItem('selectedLichenID', loc.id);
        console.log(loc.id);

        if (infoCard.classList.contains('visible')) {
          infoCard.classList.remove('visible');
          setTimeout(() => {
            infoCard.classList.add('hidden');
            showInfoCard(loc); // Open new card after previous one slides away
          }, 400); // Match your CSS transition time
        } else {
          showInfoCard(loc);
        }
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
    document.getElementById('coords').value = `${selectedCoords[0]},${selectedCoords[1]}`;
    document.getElementById('coordsDisplay').value = `${selectedCoords[1].toFixed(5)}, ${selectedCoords[0].toFixed(5)}`;
  } else {
    hideForm();

    // Slide down the info card
    if (infoCard.classList.contains('visible')) {
      infoCard.classList.remove('visible');
      setTimeout(() => {
        infoCard.classList.add('hidden');
      }, 400); // Match CSS transition
    }
  }
});

//behavior for submitting a new lichen form
document.getElementById('location-form').addEventListener('submit', (e) => {
  e.preventDefault();

  // const name = document.getElementById('name').value.trim();
  const desc = document.getElementById('desc').value.trim();
  const locImg = document.getElementById('locImg').value.trim();
  const lichImg = document.getElementById('lichImg').value.trim();

  if (!selectedCoords) {
    alert('Click the map to select a location first!');
    return;
  }

  console.log("Sending:", {
    coordinates: selectedCoords,
    locationDescription: desc,
    locationImage: locImg,
    lichenImage: lichImg
  });

  fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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

      const id = data.id;
      localStorage.setItem('selectedLichenID', id); 

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'lichen-marker';
      el.style.backgroundImage = `url('${lichImg}')`;
      

      // Add the new marker instantly
      const marker = new mapboxgl.Marker(el)
        .setLngLat(selectedCoords)
        .addTo(map);

      el.addEventListener('click', () => {
        if (appMode !== 'view') return;

        if (currentActiveMarker) {
          currentActiveMarker.classList.remove('active');
        }
        el.classList.add('active');
        currentActiveMarker = el;

        localStorage.setItem('selectedLichenID', id); 
        console.log(id); 

        const lichenData = {
          id,
          locationDescription: desc,
          locationImage: locImg,
          lichenImage: lichImg,
          personality: "✨ Newly added!"
        };

        if (infoCard.classList.contains('visible')) {
          infoCard.classList.remove('visible');
          setTimeout(() => {
            infoCard.classList.add('hidden');
            showInfoCard(lichenData); // Open new card after previous one slides away
          }, 400); // Match your CSS transition time
        } else {
          showInfoCard(lichenData);
        }

        
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


addBtn.addEventListener('click', () => {
  const isVisible = formContainer.classList.contains('show');
  
  if (isVisible) {
    hideForm();
    addBtn.classList.remove('rotated');
    // addBtn.innerHTML = '＋';
  } else {
    showForm();
    addBtn.classList.add('rotated');
    // addBtn.innerHTML = '×'; // Optional: can keep this as '+' rotated if you prefer
  }
});

//show the form 
function showForm() {
  formContainer.classList.add('show');
  appMode = 'new'; // ✨ enter new-entry mode

  // Also close and reset info card
  infoCard.classList.remove('visible', 'expanded');
  setTimeout(() => {
    infoCard.classList.add('hidden', 'collapsed');
  }, 400);
}

//hide the form 
function hideForm() {
  formContainer.classList.remove('show');
  appMode = 'view'; // ✨ back to view mode
}



//////////
// Camera logic
const foundBtn = document.getElementById('found-button');
const cameraContainer = document.getElementById('camera-container');
const video = document.getElementById('video');
const snap = document.getElementById('snap');
const canvas = document.getElementById('canvas');
const closeCamBtn = document.getElementById('close-camera');
const confirmBtn = document.getElementById('confirm-photo');
const retakeBtn = document.getElementById('retake-photo');
const thinkingOverlay = document.getElementById('thinking-overlay');
const confirmUI = document.getElementById('confirmation-buttons');
let imgData = null; //to store the photo

foundBtn.addEventListener('click', () => {
  infoCard.classList.remove('visible');

  cameraContainer.classList.remove('hidden');
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: { exact: "environment" } }
  })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      alert("Unable to access camera.");
      console.error(err);
    });
});

snap.addEventListener('click', () => {
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  imgData = canvas.toDataURL('image/png');
  localStorage.setItem('lichenPhoto', imgData);

  // Show the still image
  video.style.display = 'none';
  canvas.style.display = 'block';
  confirmUI.classList.remove('hidden');

  // Stop the video stream to "freeze" the view
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }


});

confirmBtn.addEventListener('click', () => {
  thinkingOverlay.classList.remove('hidden');

  if (!imgData) {
    alert("No image data to send!");
    return;
  }

  // Now send to OpenAI Vision API
  fetch('/api/verify-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64Image: imgData.replace(/^data:image\/png;base64,/, ''),
      expectedImagePath: 'images/lichen01.png'
    })
  })
    .then(res => res.json())
    .then(data => {
      thinkingOverlay.classList.add('hidden');

      const result = data.result.trim().toLowerCase();

      if (result.startsWith("yes")) {
        // 🎉 Confirmed match, go to chat
        window.location.href = 'chat.html';
      } else {
        // ❌ Not a match
        alert("Hmm... this doesn't look like me. Try again?");
        retakeBtn.click(); // Optional: automatically offer retake
      }

    })
    .catch(err => {
      console.error("Verification failed:", err);
      alert("Something went wrong. Try again?");
    });
});

retakeBtn.addEventListener('click', () => {
  // Hide still and UI
  canvas.style.display = 'none';
  video.style.display = 'block';
  confirmUI.classList.add('hidden');

  // Restart camera
  navigator.mediaDevices.getUserMedia({ 
    video: { facingMode: { exact: "environment" } } 
  })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => {
      alert("Unable to access camera.");
      console.error(err);
    });
});

// Close camera and return to info card
closeCamBtn.addEventListener('click', () => {
  cameraContainer.classList.add('hidden');
  infoCard.style.display = 'block';
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
});
