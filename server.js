require('dotenv').config();

const express = require('express');
const path = require('path');
const Dirty = require('dirty');
const app = express();
const PORT = process.env.PORT || 3000;


// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Enable JSON body parsing
app.use(express.json()); 

// Init Dirty DB
const db = new Dirty('locations.db');

// API route to return all locations
app.get('/api/locations', (req, res) => {
  const allLocations = [];
  db.forEach((key, value) => {
    allLocations.push(value);
  });
  res.json(allLocations);
});

// API route to handle new location submissions
app.post('/api/locations', (req, res) => {
  const { name, coordinates, locationDescription, locationImage, lichenImage } = req.body;

  if (!name || !coordinates) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const id = name.toLowerCase().replace(/\s+/g, '_'); // make a simple ID
  
  db.set(id, {
    name,
    coordinates,
    locationDescription,
    locationImage,
    lichenImage,
    personality: "Unknown for now",
    conversationHistory: []
  });

  console.log(`Saved point: ${name}`);
  res.json({ success: true });
});

// API route to delete a location by ID
app.delete('/api/locations/:id', (req, res) => {
  const id = req.params.id;
  db.rm(id);
  console.log(`Deleted entry: ${id}`);
  res.json({ success: true });
});

// API route to list items in admin console
app.get('/api/debug/all', (req, res) => {
  const entries = [];
  db.forEach((key, value) => {
    entries.push({ id: key, ...value });
  });
  res.json(entries);
});

// API route to handle editing in admin console
app.put('/api/locations/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.get(id);

  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }

  const updated = {
    ...existing,
    ...req.body
  };

  db.set(id, updated);
  res.json({ success: true });
});



// API route to handle OpenAI stufffs
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a poetic, gentle lichen who responds slowly and reflectively.' },
        ...messages
      ]
    });

    // console.log("OpenAI raw completion:", completion);
    console.log("Message object:", completion.choices[0].message);
    
    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message);
    res.status(500).json({ error: 'OpenAI request failed' });
  }
});




// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
