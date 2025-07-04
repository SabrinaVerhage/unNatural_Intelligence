//chat.js

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const lichenPhoto = document.getElementById('lichen-photo');
const chatContainer = document.querySelector('.chat-container');
const backButton = document.querySelector('.back-button');

// GETTING FULLSCREEN RIGHT
function updateAppHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// GETTING FULLSCREEN RIGHT AFTER RELOAD
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

// Set initial value
updateAppHeight();

// Update on resize and orientation change
window.addEventListener('resize', updateAppHeight);
window.addEventListener('orientationchange', () => {
  setTimeout(updateAppHeight, 100); // Small delay for orientation change
});

// Load selected lichen ID from localStorage
const lichenId = localStorage.getItem('selectedLichenID');
console.log("selected lichen ID: " + lichenId);
if (!lichenId) {
  alert("No lichen selected. Please return to the map.");
  window.location.href = "/"; // redirect
}

// Generate or load persistent session ID
let sessionId = localStorage.getItem('lichenSessionId');
console.log("user session ID: " + sessionId);
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem('lichenSessionId', sessionId);
}

async function initChat() {
  try {
    console.log('Initializing chat...');
    
    // Try to load lichen data first
    const res = await fetch(`/api/lichen/${lichenId}`);
    const data = await res.json();
    console.log("Loaded lichen data:", data);

    // Check for a generated image override
    const generatedImage = localStorage.getItem('genLichenImage');
    
    // Choose which image to use: generated if present, else original lichen, else location
    const lichenImageToUse = generatedImage || data.lichenImage;

    if (lichenImageToUse) {
      lichenPhoto.src = lichenImageToUse;
      lichenPhoto.classList.add('has-image'); // hide emoji fallback
    }
    
    // Start the intro animation
    startIntroAnimation();
    
    // Show typing bubble after animation
    setTimeout(() => {
      showTypingBubble();
    }, 3500);

    // Send initial API call and show first message
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lichenID: lichenId,
        messages: [
          { role: 'user', content: "Hi there, nice to meet you." }
        ]
      })
    });

    const chatData = await response.json();
    const reply = chatData.reply;

    setTimeout(() => {
      removeTypingBubble();
      showMessage(reply, 'lichen');
    }, 5500);

  } catch (err) {
    console.error("Initialization error:", err);
    removeTypingBubble();
    showMessage("I seem to be fading… try finding me again.", 'lichen');
  }
}


function startIntroAnimation() {
  console.log('Starting intro animation...');
  
  // After 1 second, start the shrink animation
  setTimeout(() => {
    lichenPhoto.classList.add('shrink');
    console.log('Photo should be shrinking...');
    
    // After animation completes, show chat interface
    setTimeout(() => {
      chatContainer.classList.add('visible');
      backButton.classList.add('visible');
      console.log('Chat interface should be visible...');
    }, 1600); // Wait for animation to complete
    
  }, 1000);
}

function showTypingBubble() {
  const typingMsg = document.createElement('div');
  typingMsg.className = 'message lichen typing';
  typingMsg.id = 'typing-indicator';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';

  typingMsg.appendChild(indicator);
  chatBox.prepend(typingMsg);
}

function removeTypingBubble() {
  const bubble = document.getElementById('typing-indicator');
  if (bubble) bubble.remove();
}

// Show a message in the chat
function showMessage(text, sender = 'lichen') {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBox.prepend(msg);
}

document.querySelector('.back-button').addEventListener('click', () => {
  window.location.href = 'map.html';
});


// Handle chat
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  showMessage(message, 'user');
  userInput.value = '';

  showTypingBubble();

  // Get OpenAI response
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lichenID: lichenId,
        messages: [
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json();
    const reply = data.reply;

    removeTypingBubble();
    showMessage(reply, 'lichen');
  } catch (err) {
    console.error(err);
    removeTypingBubble();
    showMessage("Hmm... I couldn't quite hear you. Maybe try again?", 'lichen');
  }
});

initChat();