//map.js

// Replace with your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3J2ZXJoYWdlIiwiYSI6ImNtYnMzNm9qdzAybjUyanNlMXlhczdrMGUifQ.ZHIcBM7xpHAdreoJJFWKCQ';

//SETUP --- DECLARING VARIABLES 
let appMode = 'view'; // or 'new' or 'gallery'
let selectedCoords = null;
let currentActiveMarker = null;
let userMarker = null;

const ALLOW_NEW_LICHEN = false;

const instrScreen = document.getElementById('instr-screen');
const backToMap = document.getElementById('instr-back');
const closeBtn = document.getElementById('instr-close');
const helpBtn = document.getElementById('help-btn');
const galleryBtn = document.getElementById('gallery-btn');

const infoCard = document.getElementById('info-card');
const toggleBtn = document.getElementById('toggle-info');
const infoName = document.getElementById('info-name');
const infoDesc = document.getElementById('info-desc');
const infoPersonality = document.getElementById('info-personality');
const infoImage = document.getElementById('info-image');
const infoLocImage = document.getElementById('info-location-image');
const infoCloseUpImage = document.getElementById('info-closeup-image');
// const closeInfoBtn = document.getElementById('close-info');

const formContainer = document.getElementById('form-container');
const addBtn = document.getElementById('add-btn'); 

if (!ALLOW_NEW_LICHEN) {
  document.getElementById('add-btn').style.display = 'none';
  document.getElementById('form-container').style.display = 'none';
}

//GETTING FULLSCREEN RIGHT
function updateAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

//GETTING FULLSCREEN RIGHT AFTER RELOAD
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // recalculate height
    updateAppHeight();

    // force reflow by touching the DOM
    requestAnimationFrame(() => {
      document.body.style.transform = 'scale(1)'; // trick to flush layout
      void document.body.offsetHeight; // force reflow
    });
  }
});


window.addEventListener('resize', updateAppHeight);
window.addEventListener('orientationchange', updateAppHeight);
window.addEventListener('load', updateAppHeight);
updateAppHeight(); // initial call

//INSTRUCTIONS OVERLAY
helpBtn.addEventListener('click', () => {
  instrScreen.classList.add('visible');
  instrScreen.scrollTop = 0; //reset scroll position
});

function closeInstructions() {
  instrScreen.classList.remove('visible');
}

backToMap.addEventListener('click', closeInstructions);
closeBtn.addEventListener('click', closeInstructions);


// SLIDE-IN INFO CARD
function showInfoCard(data) {
  const infoLayout = document.querySelector('.info-layout');
  if (infoLayout) {
    infoLayout.scrollTop = 0;
  }

  const isCurrentlyVisible = infoCard.classList.contains('visible');
  
  if (isCurrentlyVisible) {
    slideDownAndShowNew(data);
  } else {
    openNewCard(data);
  }
}

function slideDownAndShowNew(data) {
  // First, slide down the current card
  infoCard.classList.remove('visible');
  
  // Wait for slide down, then show new card
  setTimeout(() => {
    // Temporarily hide it
    infoCard.classList.add('hidden');
    
    // Load new data
    loadCardData(data);
    showNewCardAfterSlideDown();
  }, 400); // Wait for slide down animation
}

function showNewCardAfterSlideDown() {
  // Reset to collapsed state and slide up
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      infoCard.classList.remove('hidden');
      infoCard.classList.add('visible', 'collapsed');
      infoCard.classList.remove('expanded');
    });
  });
}

function openNewCard(data) {
  // Ensure clean starting state
  infoCard.classList.remove('visible', 'expanded');
  infoCard.classList.add('collapsed', 'hidden');
  
  // Load the data
  loadCardData(data);
  // showCardAfterImageLoad();

  requestAnimationFrame(() => {
    // Then trigger the animation
    requestAnimationFrame(() => {
      infoCard.classList.remove('hidden');
      infoCard.classList.add('visible');
      // Keep it collapsed for now
    });
  });

}

function loadCardData(data) {
  console.log('Loading card data:', data);

  // Load the data from the db
  infoName.textContent = data.name || '';
  infoDesc.textContent = data.locationDescription || '';
  toggleBtn.textContent = 'more info...';

  // Load all images at once - no complex loading logic
  if (data.lichenImage) {
    infoImage.src = data.lichenImage;
    infoImage.style.opacity = '1';
    infoImage.classList.add('loaded');
  } else {
    infoImage.src = '';
    infoImage.style.opacity = '0';
  }
  
  if (data.locationImage) {
    infoLocImage.src = data.locationImage;
  }
  
  if (data.lichenImage) {
    infoCloseUpImage.src = data.lichenImage;
  }
}

function showCardAfterImageLoad() {
  // Remove hidden and make visible in collapsed state
  setTimeout(() => {
    infoCard.classList.remove('hidden');
    infoCard.classList.add('visible', 'collapsed');
  }, 150);
}

function closeInfoCard() {
  // Reset scroll position when closing
  const infoLayout = document.querySelector('.info-layout');
  if (infoLayout) {
    infoLayout.scrollTop = 0;
  }

  // Smoothly collapse first, then slide down
  if (infoCard.classList.contains('expanded')) {
    infoCard.classList.remove('expanded');
    infoCard.classList.add('collapsed');
    
    setTimeout(() => {
      slideDownAndHide();
    }, 400);
  } else {
    slideDownAndHide();
  }
}

function slideDownAndHide() {
  // Remove visible to trigger slide down
  infoCard.classList.remove('visible');

  if (currentActiveMarker) {
    currentActiveMarker.classList.remove('active');
    currentActiveMarker = null;
  }

  // Hide after slide-down animation completes
  setTimeout(() => {
    infoCard.classList.add('hidden');
    infoCard.classList.remove('expanded');
    infoCard.classList.add('collapsed');
    
    // Reset image state
    infoImage.src = '';
    infoImage.style.opacity = '0';
    infoImage.classList.remove('loaded');
  }, 600); // Match the transition duration
}

// TOGGLE INFO CARD (expand/collapse)
function toggleInfoCard() {
  const isCollapsed = infoCard.classList.contains('collapsed');

  if (isCollapsed) {
    // Expanding
    infoCard.classList.remove('collapsed');
    infoCard.classList.add('expanded');
    toggleBtn.textContent = 'less info...';
  } else {
    // Collapsing
    infoCard.classList.remove('expanded');
    infoCard.classList.add('collapsed');
    toggleBtn.textContent = 'more info...';
  }
}

// Button click (toggle)
toggleBtn.addEventListener('click', (e) => {
  e.stopPropagation(); // avoid double toggling if image also clicked
  toggleInfoCard();
});

// Image click (collapse only if expanded)
infoImage.addEventListener('click', () => {
  if (infoCard.classList.contains('expanded')) {
    toggleInfoCard();
  }
});

// CLOSE INFO CARD
// closeInfoBtn.addEventListener('click', () => {
//   closeInfoCard();
// });

// MAIN MAP STUFF
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [4.89, 52.37],
  zoom: 12,
  pitch: 0, 
  bearing: 0     
});

// Disable all tilt & rotation inputs
map.setMaxPitch(0);
map.setMinPitch(0);
map.touchPitch.disable();
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();    

window.addEventListener('focus', () => {
  window.scrollTo(0, 0);
});              

//the plus and minus button
// map.addControl(new mapboxgl.NavigationControl());

// 🧭 Add navigation control (includes compass)
// map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

const geolocateControl = new mapboxgl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true
});

// 📍 Add geolocate control (shows "locate me" button)
// map.addControl(geolocateControl, 'bottom-right');
// map.addControl(geolocateControl);

// Add the hidden geolocate control (for functionality)
map.addControl(geolocateControl);

// Create custom crosshair button
const customGeolocateBtn = document.createElement('button');
customGeolocateBtn.className = 'custom-geolocate'; // Add 'white' class if you want white crosshair
customGeolocateBtn.addEventListener('click', () => {
  geolocateControl.trigger();
});

// Add to map container
document.getElementById('map').appendChild(customGeolocateBtn);

map.on('load', () => {
  geolocateControl.trigger();
});

// Load locations from server
fetch('/api/locations')
  .then(res => res.json())
  .then(locations => {
    locations.forEach(loc => {

      const el = document.createElement('div');
      el.className = 'lichen-marker';
      el.dataset.lichenId = loc.id;

      const inner = document.createElement('div');
      inner.className = 'lichen-inner';
      inner.style.backgroundImage = `url('${loc.lichenImage}')`;

      el.appendChild(inner);

      const foundList = JSON.parse(localStorage.getItem('foundLichens')) || [];
      if (foundList.includes(loc.id)) {
        el.classList.add('found-marker'); 
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(loc.coordinates)
        .addTo(map);

      el.addEventListener('click', () => {
        if (document.body.classList.contains('gallery-mode')) {
          // GALLERY MODE
          // Make marker grow briefly on click
          const inner = el.querySelector('.lichen-inner');
          inner.style.transform = 'scale(1.6)';

          setTimeout(() => {
            inner.style.transform = 'scale(1.2)';
          }, 300);
          return;
        }

        if (appMode !== 'view') return;

        if (el.classList.contains('active')) {
          return; // Do nothing if marker is already active
        }

        // NORMAL MODE
        // Handle active marker styling
        if (currentActiveMarker) {
          currentActiveMarker.classList.remove('active');
        }
        el.classList.add('active');
        currentActiveMarker = el;

        localStorage.setItem('selectedLichenID', loc.id);
        console.log(loc.id);

        // Show info card
        showInfoCard(loc);

      });


  });
});

function markLichenAsFound(id) {
  let foundList = JSON.parse(localStorage.getItem('foundLichens')) || [];
  if (!foundList.includes(id)) {
    foundList.push(id);
    localStorage.setItem('foundLichens', JSON.stringify(foundList));
  }
}

function updateMarkerVisibility() {
  const isGallery = document.body.classList.contains('gallery-mode');
  const found = JSON.parse(localStorage.getItem('foundLichens')) || [];

  document.querySelectorAll('.mapboxgl-marker').forEach(marker => {
    const id = marker.dataset.lichenId;
    if (!id) return;

    const shouldShow = !isGallery || found.includes(id);
    marker.style.display = shouldShow ? 'block' : 'none';
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
      closeInfoCard();
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

        showInfoCard(lichenData);   
        
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
// Gallery logic
const galleryTitle = document.getElementById('gallery-title');
const exitGallery = document.getElementById('exit-gallery');

galleryBtn.addEventListener('click', () => {
  document.body.classList.add('gallery-mode');
  
  // Use visible class like instructions
  galleryTitle.classList.add('visible');
  exitGallery.classList.add('visible');
  
  updateMarkerVisibility();
  appMode = 'gallery'; 

  if (infoCard.classList.contains('visible')) {
    closeInfoCard();
  }
});

exitGallery.addEventListener('click', () => {
  document.body.classList.remove('gallery-mode');
  
  // Remove visible class like instructions
  galleryTitle.classList.remove('visible');
  exitGallery.classList.remove('visible');
  
  updateMarkerVisibility();
  appMode = 'view'; 
});

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

  // Store the current scroll position
  const infoLayout = document.querySelector('.info-layout');
  if (infoLayout) {
    window.storedScrollPosition = infoLayout.scrollTop;
  }


  // 🧼 Clean up old photo view
  canvas.style.display = 'none';
  video.style.display = 'block';
  confirmUI.classList.add('hidden');

  // ✨ Show camera container
  cameraContainer.classList.remove('hidden');
  cameraContainer.classList.add('fade-in');

  // 📷 Start fresh camera stream
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
  // Capture image to canvas
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  imgData = canvas.toDataURL('image/png');
  localStorage.setItem('lichenPhoto', imgData);

  // Show the still image
  video.style.display = 'none';
  canvas.style.display = 'block';

  // Stop the video stream to "freeze" the view
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

  setTimeout(() => {
    confirmUI.classList.remove('hidden');
    document.getElementById('camera-confirm-label').classList.remove('hidden');
  }, 300);
});

// Add touch event handlers for visual feedback
snap.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevent scrolling and zoom
  snap.classList.add('pressed');
  console.log('Touch started'); // Debug
}, { passive: false });

snap.addEventListener('touchend', (e) => {
  setTimeout(() => {
    snap.classList.remove('pressed');
    console.log('Touch ended'); // Debug
  }, 150); // Keep the effect for a moment
});

snap.addEventListener('touchcancel', () => {
  snap.classList.remove('pressed');
  console.log('Touch cancelled'); // Debug
});

// Also handle mouse events for desktop
snap.addEventListener('mousedown', (e) => {
  snap.classList.add('pressed');
  console.log('Mouse down'); // Debug
});

snap.addEventListener('mouseup', () => {
  setTimeout(() => {
    snap.classList.remove('pressed');
    console.log('Mouse up'); // Debug
  }, 150);
});

snap.addEventListener('mouseleave', () => {
  snap.classList.remove('pressed');
});

confirmBtn.addEventListener('click', async () => {
  thinkingOverlay.classList.remove('hidden');

  if (!imgData) {
    alert("No image data to send!");
    return;
  }

  const lichenId = localStorage.getItem('selectedLichenID');
  if (!lichenId) {
    alert("No lichen selected!");
    return;
  }

  try {
    // 👉 Fetch lichen data by ID from your database
    const lichenRes = await fetch(`/api/lichen/${lichenId}`);
    const lichenData = await lichenRes.json();

    if (!lichenData.lichenImage) {
      throw new Error("Lichen image not found in database.");
    }

    // ✅ Now send user-taken photo + expected image from DB
    const verifyRes = await fetch('/api/verify-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Image: imgData.replace(/^data:image\/png;base64,/, ''),
        expectedImagePath: lichenData.lichenImage
      })
    });

    const data = await verifyRes.json();

    const result = data.result.trim().toLowerCase();

    if (result.startsWith("yes")) {
      // 🎉 Confirmed match
      markLichenAsFound(lichenId);

      const thinkingText = document.getElementById('thinking-text');

      // Fade out the current text
      thinkingText.classList.add('fade-out');

      setTimeout(() => {
        thinkingText.innerHTML = "waking up<br/>(un)natural intelligence...";
        thinkingText.classList.remove('fade-out');
        thinkingText.classList.add('fade-in');
      }, 1500); // Matches CSS fade-out duration

      // 👇 Call Replicate to generate transformed image
      const genRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: imgData.replace(/^data:image\/png;base64,/, '')
        })
      });

      const genData = await genRes.json();
      console.log("Generated image URL:", genData.output);

      // Store the result or display it
      localStorage.setItem('genLichenImage', genData.output);

      window.location.href = 'chat.html';

    } else {
      // ❌ Not a match
      thinkingOverlay.classList.add('hidden');
      alert("Hmm... this doesn't look like me. Try again?");

      resetCamera();

    }

  } catch (err) {
    console.error("Verification failed:", err);
    thinkingOverlay.classList.add('hidden');
    alert("Something went wrong. Try again?");
  }

});

function resetCamera() {
  canvas.style.display = 'none';
  video.style.display = 'block';
  confirmUI.classList.add('hidden');

  const confirmLabel = document.getElementById('camera-confirm-label');
  if (confirmLabel) {
    confirmLabel.classList.add('hidden');
  }

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
}

retakeBtn.addEventListener('click', resetCamera);

// Close camera and return to info card
closeCamBtn.addEventListener('click', () => {
  cameraContainer.classList.remove('fade-in');
  cameraContainer.classList.add('fade-out');

  setTimeout(() => {
    cameraContainer.classList.add('hidden');
    cameraContainer.classList.remove('fade-out');
    
    // Properly restore info card state
    infoCard.classList.remove('hidden');
    infoCard.classList.add('visible', 'expanded'); // Return to expanded state
    infoCard.style.display = 'flex'; // Ensure it's visible
    
    // Reset scroll position
    const infoLayout = document.querySelector('.info-layout');
    if (infoLayout && window.storedScrollPosition !== undefined) {
      infoLayout.scrollTop = window.storedScrollPosition;
    }

  }, 400); // match your animation time

  // infoCard.style.display = 'block';
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

});
