//map.js

// Replace with your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1Ijoic3J2ZXJoYWdlIiwiYSI6ImNtYnMzNm9qdzAybjUyanNlMXlhczdrMGUifQ.ZHIcBM7xpHAdreoJJFWKCQ';

//SETUP --- DECLARING VARIABLES 
let appMode = 'view'; // or 'new' or 'gallery'
let selectedCoords = null;
let currentActiveMarker = null;

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
const backHomeBtn = document.getElementById('back-home');
backHomeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});


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


//**********USER SESSION ID**********
let userSessionId = localStorage.getItem('userSessionId');
if (!userSessionId) {
  userSessionId = crypto.randomUUID();
  localStorage.setItem('userSessionId', userSessionId);
}
console.log("User session ID:", userSessionId);


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
  // Reset to collapsed state
  infoCard.classList.remove('expanded');
  infoCard.classList.add('collapsed');

  // Wait just a bit before showing again
  setTimeout(() => {
    infoCard.classList.remove('hidden');

    requestAnimationFrame(() => {
      infoCard.classList.add('visible');
    });
  }, 20); // 1 frame or ~20ms delay smooths transition
}

function openNewCard(data) {
  // Ensure clean starting state
  infoCard.classList.remove('visible', 'expanded');
  infoCard.classList.add('collapsed');

  // Load the data
  loadCardData(data);

  // Start fresh: remove hidden, then animate up with delay
  infoCard.classList.add('hidden');

  // Delay just enough for layout to apply
  setTimeout(() => {
    infoCard.classList.remove('hidden');
    requestAnimationFrame(() => {
      infoCard.classList.add('visible');
    });
  }, 20); // 20ms allows reflow to settle
}

function loadCardData(data) {
  console.log('Loading card data:', data);
  // console.log('description:', data.description);

  const currentLang = localStorage.getItem("lang") || "en";

  // Title
  infoName.textContent = data.name || '';

  // Description (multilingual fallback to English)
  const desc =
    typeof data.description === 'object'
      ? data.description[currentLang] || data.description.en
      : data.description;

  infoDesc.textContent = desc || '';
  toggleBtn.textContent = 'more info...';

  // generated image if found
  const lichenID = data.id;
  const foundList = JSON.parse(localStorage.getItem('foundLichens')) || [];
  const isFound = foundList.includes(lichenID);
  const generatedImage = sessionGeneratedMap[lichenID];

  if (isFound && generatedImage) {
    infoImage.src = generatedImage;
  } else if (data.lichenImage) {
    infoImage.src = data.lichenImage;
  } else {
    infoImage.src = '';
  }

  infoImage.style.opacity = infoImage.src ? '1' : '0';
  infoImage.classList.toggle('loaded', !!infoImage.src);

  // Location image(s) — now supports an array
  // const locImages = data.locationImages || [];
  // if (locImages.length > 0) {
  //   infoLocImage.src = locImages[0]; // only show the first one for now
  // } else {
  //   infoLocImage.src = '';
  // }

  const galleryContainer = document.getElementById('info-location-images');
  galleryContainer.innerHTML = ''; // clear previous images

  const locImages = data.locationImages || [];
  locImages.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'info-info-image'; // reuse your CSS class
    galleryContainer.appendChild(img);
  });


  // Lichen close-up image — fallback to same as lichenImage
  if (data.lichenImage) {
    infoCloseUpImage.src = data.lichenImage;
  } else {
    infoCloseUpImage.src = '';
  }
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


// MAIN MAP STUFF
const mbMap = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [4.89, 52.37],
  zoom: 12,
  pitch: 0, 
  bearing: 0     
});
window.mbMap = mbMap;

// Disable all tilt & rotation inputs
mbMap.setMaxPitch(0);
mbMap.setMinPitch(0);
mbMap.touchPitch.disable();
mbMap.dragRotate.disable();
mbMap.touchZoomRotate.disableRotation();    

window.addEventListener('focus', () => {
  window.scrollTo(0, 0);
});              

//the plus and minus button
// mbMap.addControl(new mapboxgl.NavigationControl());

// 🧭 Add navigation control (includes compass)
// mbMap.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

const geolocateControl = new mapboxgl.GeolocateControl({
  positionOptions: { enableHighAccuracy: true },
  trackUserLocation: true,
  showUserHeading: true
});

// 📍 Add geolocate control (shows "locate me" button)
// mbMap.addControl(geolocateControl, 'bottom-right');
mbMap.addControl(geolocateControl);

// Create custom crosshair button
const customGeolocateBtn = document.createElement('button');
customGeolocateBtn.className = 'custom-geolocate'; // Add 'white' class if you want white crosshair
customGeolocateBtn.addEventListener('click', () => {
  geolocateControl.trigger();
});

// Add to map container
document.getElementById('map').appendChild(customGeolocateBtn);

mbMap.on('load', () => {
  geolocateControl.trigger();
});

geolocateControl.on('geolocate', position => {
  const { latitude, longitude } = position.coords;
  window.userLatLng = { lat: latitude, lng: longitude };
});


let sessionGeneratedMap = {};

// Load locations from server
fetch(`/api/user-session/${userSessionId}`)
  .then(res => res.json())
  .then(sessionData => {
    // STEP 1: Build lookup map from the object
    Object.keys(sessionData).forEach(lichenID => {
      const entry = sessionData[lichenID];
      if (entry.generatedImage) {
        sessionGeneratedMap[lichenID] = entry.generatedImage;
      }
    });

    // STEP 2: Now load the locations and apply the logic
    return fetch('/api/locations');
  })
  .then(res => res.json())
  .then(locations => {
    locations.forEach(loc => {
      const el = document.createElement('div');
      el.className = 'lichen-marker';
      el.dataset.lng = loc.coordinates[0];
      el.dataset.lat = loc.coordinates[1];
      el.dataset.lichenId = loc.id;

      const inner = document.createElement('div');
      inner.className = 'lichen-inner';

      const foundList = JSON.parse(localStorage.getItem('foundLichens')) || [];
      const isFound = foundList.includes(loc.id);
      const generatedImage = sessionGeneratedMap[loc.id]; // Uses ID string directly

      if (isFound) {
        el.classList.add('found-marker');
      }

      const imageToUse = (isFound && generatedImage)
        ? generatedImage
        : loc.lichenImage;

      inner.style.backgroundImage = `url('${imageToUse}')`;
      el.appendChild(inner);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(loc.coordinates)
        .addTo(mbMap);

      el.addEventListener('click', () => {
        if (appMode !== 'view') return;
        if (el.classList.contains('active')) return;

        if (currentActiveMarker) {
          currentActiveMarker.classList.remove('active');
        }
        el.classList.add('active');
        currentActiveMarker = el;

        localStorage.setItem('selectedLichenID', loc.id);
        showInfoCard(loc);
      });
    });
  })
  .catch(err => {
    console.error("Error loading session or locations:", err);
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
mbMap.on('click', (e) => {
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
        .addTo(mbMap);

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

  window.loop?.(); // ✅ start drawing p5.js

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

  window.noLoop?.(); // ✅ stop drawing p5.js
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
  console.log('Snap clicked - capturing image!');
  
  // Capture image to canvas
  const context = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);

  imgData = canvas.toDataURL('image/png');
  localStorage.setItem('lichenPhoto', imgData);

  // Wait for button animation
  setTimeout(() => {
    
    // Show canvas ON TOP of video (don't hide video yet)
    canvas.style.display = 'block';
    canvas.style.zIndex = '2'; // Put canvas above video
    
    // Stop video stream AFTER canvas is visible
    setTimeout(() => {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
      
      // Now hide video (but canvas is already covering it)
      video.style.display = 'none';
      
      setTimeout(() => {
        confirmUI.classList.remove('hidden');
        document.getElementById('camera-confirm-label').classList.remove('hidden');
      }, 100);
      
    }, 50); // Very short delay
    
  }, 200);
});

// Visual feedback handlers (these don't interfere with click)
snap.addEventListener('touchstart', (e) => {
  // Don't prevent default! Let the click event fire normally
  snap.classList.add('pressed');
  // console.log('Touch started - visual feedback only');
}, { passive: true }); // passive: true is important!

snap.addEventListener('touchend', () => {
  setTimeout(() => {
    snap.classList.remove('pressed');
    // console.log('Touch ended - visual feedback only');
  }, 150);
}, { passive: true });

snap.addEventListener('touchcancel', () => {
  snap.classList.remove('pressed');
}, { passive: true });

// Desktop visual feedback
snap.addEventListener('mousedown', () => {
  snap.classList.add('pressed');
});

snap.addEventListener('mouseup', () => {
  setTimeout(() => {
    snap.classList.remove('pressed');
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
      //don't need this anymore though right
      // localStorage.setItem('genLichenImage', genData.output);

      const userSessionId = localStorage.getItem('userSessionId');

      if (userSessionId) {
        await fetch(`/api/user-session/${userSessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lichenID: lichenId,
            generatedImage: genData.output
          })
        });
      }

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

