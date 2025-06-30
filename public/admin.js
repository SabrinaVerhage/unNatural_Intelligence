document.querySelectorAll('textarea').forEach(el => {
  el.setAttribute('style', 'height:' + (el.scrollHeight) + 'px;overflow-y:hidden;');
  el.addEventListener('input', e => {
    e.target.style.height = 'auto';
    e.target.style.height = (e.target.scrollHeight) + 'px';
  });
});

// Fetch all stored entries
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
          <label>Description: 
            <textarea class="edit-desc">${entry.locationDescription || ''}</textarea>
          </label>
        </div>

        <div class="admin-field">
          <label>Location Image URL: <input type="text" value="${entry.locationImage || ''}" class="edit-locimg"></label>
        </div>

        <div class="admin-field">
          <label>Lichen Image URL: <input type="text" value="${entry.lichenImage || ''}" class="edit-lichimg"></label>
        </div>

        <div class="image-row">
          ${entry.locationImage ? `<img src="${entry.locationImage}" class="admin-thumb">` : ''}
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
        const descInput = card.querySelector('.edit-desc');
        const locImgInput = card.querySelector('.edit-locimg');
        const lichImgInput = card.querySelector('.edit-lichimg');
        const personalityInput = card.querySelector('.edit-personality');

        if (!nameInput || !descInput || !locImgInput || !lichImgInput || !personalityInput) {
          alert("One or more fields are missing in this entry.");
          return;
        }

        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const locationImage = locImgInput.value.trim();
        const lichenImage = lichImgInput.value.trim();
        const personality = personalityInput.value.trim();

        fetch(`/api/locations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            locationDescription: description,
            locationImage,
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

document.getElementById('download-data').addEventListener('click', () => {
  fetch('/api/debug/all')
    .then(res => res.json())
    .then(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lichen-data.json';
      a.click();
      URL.revokeObjectURL(url);
    });
});

