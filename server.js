require('dotenv').config();

const express = require('express');
const cors = require('cors')
const fs = require('fs');
const path = require('path');
const Dirty = require('dirty');

const PORT = process.env.PORT || 3000;
const { v4: uuidv4 } = require('uuid');

const app = express();

// enabling CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Enable JSON body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
  const { name = ' ', coordinates, locationDescription, locationImage, lichenImage } = req.body;

  if (!coordinates) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const id = uuidv4(); // use a proper UUID

  db.set(id, {
    id,
    name,
    coordinates,
    locationDescription,
    locationImage,
    lichenImage,
    personality: "Unknown for now",
    conversationHistory: []
  });

  console.log(`Saved point: ${name}`);
  res.json({ success: true, id });
});

// API route to delete a location by ID
app.delete('/api/locations/:id', (req, res) => {
  const id = req.params.id;
  db.rm(id);
  console.log(`Deleted entry: ${id}`);
  res.json({ success: true });
});

// Fetch one lichen by ID
app.get('/api/lichen/:id', (req, res) => {
  const id = req.params.id;
  const lichen = db.get(id);

  if (!lichen) {
    return res.status(404).json({ error: 'Lichen not found' });
  }

  res.json(lichen);
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
  const { base64Image, lichenID, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  if (!lichenID) {
    return res.status(400).json({ error: 'Missing lichenID' });
  }

  const lichen = db.get(lichenID);
  if (!lichen || !lichen.personality) {
    return res.status(404).json({ error: 'Lichen personality not found' });
  }

  const systemPrompt = lichen.personality;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
    });

    console.log("Message object:", completion.choices[0].message);

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message);
    res.status(500).json({ error: 'OpenAI request failed' });
  }
});

app.post('/api/verify-image', async (req, res) => {
  const { base64Image, expectedImagePath } = req.body;

  if (!base64Image || !expectedImagePath) {
    return res.status(400).json({ error: 'Missing image(s)' });
  }

  try {

    // Load the expected/reference image from disk and encode it
    const referencePath = path.join(__dirname, 'public', expectedImagePath);
    const referenceBuffer = fs.readFileSync(referencePath);
    const referenceBase64 = referenceBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You're a lichen verification AI. You are a careful visual assistant who can compare details in two images.`
        },
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": "Look carefully at the type and shape of this lichen. Do these two images show the exact same lichen?  Answer only 'Yes' or 'No'."
            },
            {
              "type": "image_url",
              "image_url": {
                "url": `data:image/png;base64,${base64Image}`
              }
            },
            {
              "type": "image_url",
              "image_url": {
                "url": `data:image/png;base64,${referenceBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 100
    });

    const result = response.choices[0].message.content;
    console.log("Vision API result:", result);
    res.json({ result });

  } catch (err) {
    console.error('OpenAI Vision error:', err.response?.data || err.message);
    res.status(500).json({ error: 'OpenAI vision request failed' });
  }
});


// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
