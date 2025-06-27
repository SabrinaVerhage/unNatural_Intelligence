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

// Fetch full lichen data
fetch(`/api/lichen/${lichenId}`)
  .then(res => res.json())
  .then(data => {
    console.log("Loaded lichen data:", data);

    // Set lichen image
    if (data.lichenImage || data.locationImage) {
      const imageUrl = data.lichenImage || data.locationImage;
      lichenPhoto.src = imageUrl;
      startIntroAnimation(imageUrl);
    }

    showTypingBubble();

    setTimeout(() => {
      removeTypingBubble();
      showMessage(`Ah… ${data.name || "friend"}, I'm glad you returned. I remember the shape of your shadow.`);
    }, 4000); // 1.5 intro animation

    // showMessage(`Ah… ${data.name || "friend"}, I'm glad you returned. I remember the shape of your shadow.`);
  })
  .catch(err => {
    console.error("Failed to load lichen info:", err);
    showMessage("I seem to be fading… try finding me again.");
  });

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
        model: 'gpt-4',
        messages: [
          // { role: 'system', content: 'You are a poetic, gentle lichen who has just been rediscovered. Respond slowly, with natural metaphors, and ask soft questions about the user’s world and feelings.' },
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
