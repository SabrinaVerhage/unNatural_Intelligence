//chat.js

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const lichenPhoto = document.getElementById('lichen-photo');

// Load photo from previous page
const savedPhoto = localStorage.getItem('lichenPhoto');
if (savedPhoto) {
  lichenPhoto.src = savedPhoto;
}


// Show a message in the chat
function showMessage(text, sender = 'lichen') {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Initial greeting
showMessage("Nice to meet you! I'm glad you found me. I haven't spoken to anyone for a while...");

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
