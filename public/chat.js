//chat.js

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const lichenPhoto = document.getElementById('lichen-photo');


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
    const res = await fetch(`/api/lichen/${lichenId}`);
    const data = await res.json();
    console.log("Loaded lichen data:", data);

    // Set lichen image
    if (data.lichenImage || data.locationImage) {
      const imageUrl = data.lichenImage || data.locationImage;
      lichenPhoto.src = imageUrl;
      startIntroAnimation(imageUrl);
    }

    showTypingBubble();

    // Send a silent starter message to the lichen
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
    }, 4000);

  } catch (err) {
    console.error("Initialization error:", err);
    removeTypingBubble();
    showMessage("I seem to be fading… try finding me again.");
  }
}

initChat();


function startIntroAnimation(imageUrl) {
  const introImage = document.createElement('img');
  introImage.src = imageUrl;
  introImage.className = 'fullscreen-intro';
  document.body.appendChild(introImage);

  introImage.addEventListener('animationend', () => {
    introImage.remove();
    document.querySelector('.chat-container').style.opacity = 1;
  });
}

function showTypingBubble() {
  const typingMsg = document.createElement('div');
  typingMsg.className = 'message lichen typing';
  typingMsg.id = 'typing-indicator';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';

  typingMsg.appendChild(indicator);
  chatBox.appendChild(typingMsg);
  chatBox.scrollTop = chatBox.scrollHeight;
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
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

document.querySelector('.back-button').addEventListener('click', () => {
  window.location.href = 'index.html';
});


// Handle chat
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message) return;

  showMessage(message, 'user');
  userInput.value = '';

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
    showMessage(reply, 'lichen');
  } catch (err) {
    console.error(err);
    showMessage("Hmm... I couldn't quite hear you. Maybe try again?", 'lichen');
  }
});
