document.querySelectorAll('textarea').forEach(el => {
  el.setAttribute('style', 'height:' + (el.scrollHeight) + 'px;overflow-y:hidden;');
  el.addEventListener('input', e => {
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  });
});

// Fetch all stored location entries
fetch('/api/debug/all')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('entries');

    data.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'admin-entry';

      div.innerHTML = `
        <p><strong>ID:</strong> <code>${entry.id}</code></p>

        <div class="admin-field">
          <label>Name: <input type="text" value="${entry.name}" class="edit-name"></label>
        </div>

        <div class="admin-field">
          <label>Description (EN): 
            <textarea class="edit-desc-en">${entry.description?.en || ''}</textarea>
          </label>
        </div>

        <div class="admin-field">
          <label>Description (NL): 
            <textarea class="edit-desc-nl">${entry.description?.nl || ''}</textarea>
          </label>
        </div>

        <div class="admin-field">
          <label>Location Images (comma-separated): 
            <input type="text" value="${(entry.locationImages || []).join(', ')}" class="edit-locimgs">
          </label>
        </div>

        <div class="admin-field">
          <label>Lichen Image URL: <input type="text" value="${entry.lichenImage || ''}" class="edit-lichimg"></label>
        </div>

        <div class="image-row">
          ${(entry.locationImages || []).map(img => `<img src="${img}" class="admin-thumb">`).join('')}
          ${entry.lichenImage ? `<img src="${entry.lichenImage}" class="admin-thumb">` : ''}
        </div>

        <div class="admin-field">
          <label>Personality:<br>
            <textarea class="edit-personality">${entry.personality || ''}</textarea>
          </label>
        </div>

        <div class="admin-buttons">
          <button class="save-btn" data-id="${entry.id}">💾 Save</button>
          <button class="delete-btn" data-id="${entry.id}">🗑 Delete</button>
        </div>
      `;

      container.appendChild(div);
    });

    // Editing functionality
    container.addEventListener('click', e => {
      const id = e.target.getAttribute('data-id');
      const card = e.target.closest('.admin-entry');

      if (e.target.classList.contains('delete-btn')) {
        fetch(`/api/locations/${id}`, { method: 'DELETE' })
          .then(() => location.reload());
      }

      if (e.target.classList.contains('save-btn')) {
        const nameInput = card.querySelector('.edit-name');
        const descEnInput = card.querySelector('.edit-desc-en');
        const descNlInput = card.querySelector('.edit-desc-nl');
        const locImgsInput = card.querySelector('.edit-locimgs');
        const lichImgInput = card.querySelector('.edit-lichimg');
        const personalityInput = card.querySelector('.edit-personality');

        if (!nameInput || !descEnInput || !descNlInput || !locImgsInput || !lichImgInput || !personalityInput) {
          alert("One or more fields are missing in this entry.");
          return;
        }

        const name = nameInput.value.trim();
        const description = {
          en: descEnInput.value.trim(),
          nl: descNlInput.value.trim()
        };
        const locationImages = locImgsInput.value.split(',').map(s => s.trim()).filter(Boolean);
        const lichenImage = lichImgInput.value.trim();
        const personality = personalityInput.value.trim();

        fetch(`/api/locations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            description,        
            locationImages,      
            lichenImage,
            personality
          })
        }).then(() => {
          alert("Updated!");
          // location.reload();
        }).catch(err => {
          alert("Failed to update: " + err.message);
        });
      }
    });

  });


// Fetch user session data
fetch('/api/debug/sessions')
  .then(res => res.json())
  .then(sessions => {
    const sessionContainer = document.getElementById('sessions');

    Object.entries(sessions).forEach(([sessionId, data]) => {
      const div = document.createElement('div');
      div.className = 'admin-session';

      div.innerHTML = `
        <h3>🧠 Session: <code>${sessionId}</code></h3>
        <div class="session-json">${JSON.stringify(data, null, 2)}</div>
        <div class="session-actions">
          <button class="delete-session" data-id="${sessionId}">🗑 Delete Session</button>
        </div>
      `;

      sessionContainer.appendChild(div);
    });

    // Handle delete clicks
    sessionContainer.addEventListener('click', e => {
      if (e.target.classList.contains('delete-session')) {
        const id = e.target.getAttribute('data-id');
        fetch(`/api/user-session/${id}`, { method: 'DELETE' })
          .then(() => location.reload());
      }
    });
  });


document.getElementById('toggle-locations').addEventListener('click', () => {
  const entries = document.getElementById('entries');
  entries.classList.toggle('collapsed');
});

document.getElementById('toggle-sessions').addEventListener('click', () => {
  const sessions = document.getElementById('sessions');
  sessions.classList.toggle('collapsed');
});

document.getElementById('download-locations').addEventListener('click', () => {
  fetch('/api/debug/all')
    .then(res => res.json())
    .then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lichen-locations.json';
      a.click();
      URL.revokeObjectURL(url);
    });
});

document.getElementById('download-sessions').addEventListener('click', () => {
  fetch('/api/debug/sessions')
    .then(res => res.json())
    .then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-sessions.json';
      a.click();
      URL.revokeObjectURL(url);
    });
});


