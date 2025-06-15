// Fetch all stored entries
fetch('/api/debug/all')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('entries');

    data.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'admin-entry';

      // div.innerHTML = `
      //   <h3>${entry.name}</h3>
      //   <p><strong>Coords:</strong> ${entry.coordinates.join(', ')}</p>
      //   <p><strong>Description:</strong> ${entry.locationDescription || ''}</p>
      //   <p><strong>Images:</strong><br>
      //     ${entry.locationImage ? `<img src="${entry.locationImage}" height="60">` : ''}
      //     ${entry.lichenImage ? `<img src="${entry.lichenImage}" height="60">` : ''}
      //   </p>
      //   <button data-id="${entry.name.toLowerCase().replace(/\s+/g, '_')}">🗑 Delete</button>
      //   <hr>
      // `;

      div.innerHTML = `
        <label>Name: <input type="text" value="${entry.name}" class="edit-name"></label><br>
        <label>Description: <input type="text" value="${entry.locationDescription || ''}" class="edit-desc"></label><br>
        <label>Location Image URL: <input type="text" value="${entry.locationImage || ''}" class="edit-locimg"></label><br>
        <label>Lichen Image URL: <input type="text" value="${entry.lichenImage || ''}" class="edit-lichimg"></label><br>
        <button class="save-btn" data-id="${entry.id}">💾 Save</button>
        <button class="delete-btn" data-id="${entry.id}">🗑 Delete</button>
        <hr>
      `;

      container.appendChild(div);
    });

    // // Add delete functionality
    // container.addEventListener('click', e => {
    //   if (e.target.tagName === 'BUTTON') {
    //     const id = e.target.getAttribute('data-id');
    //     console.log("Attempting to delete:", id); // ← Check if this logs
    //     fetch(`/api/locations/${id}`, { method: 'DELETE' })
    //       .then(() => location.reload());
    //   }
    // });

    // Editing functionality
    container.addEventListener('click', e => {
      const id = e.target.getAttribute('data-id');

      if (e.target.classList.contains('delete-btn')) {
        fetch(`/api/locations/${id}`, { method: 'DELETE' })
          .then(() => location.reload());
      }

      if (e.target.classList.contains('save-btn')) {
        const card = e.target.parentElement;
        const name = card.querySelector('.edit-name').value.trim();
        const description = card.querySelector('.edit-desc').value.trim();
        const locationImage = card.querySelector('.edit-locimg').value.trim();
        const lichenImage = card.querySelector('.edit-lichimg').value.trim();

        fetch(`/api/locations/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, locationDescription: description, locationImage, lichenImage })
        }).then(() => {
          alert("Updated!");
          location.reload(); // or re-fetch dynamically
        });
      }
    });

  });
