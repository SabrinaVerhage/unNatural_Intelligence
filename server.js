require('dotenv').config();

const express = require('express');
const cors = require('cors')
const fs = require('fs');
const path = require('path');
const Dirty = require('dirty');
const Replicate = require("replicate");
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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
// two databases now *shrug
const db = new Dirty('locations.db');
const sessiondb = new Dirty('sessions.db');

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
  const {
    name = ' ',
    coordinates,
    description = {}, // 👈 updated: expect { en: "...", nl: "..." }
    locationImages = [],
    lichenImage
  } = req.body;


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
    lichenImages,
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
  const { lichenID, messages } = req.body;
  const sessionId = req.headers['x-session-id'];
  const userLang = req.headers['x-lang'] || 'en';

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages array' });
  }

  if (!lichenID) {
    return res.status(400).json({ error: 'Missing lichenID' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session ID' });
  }

  const lichen = db.get(lichenID);
  if (!lichen || !lichen.personality) {
    return res.status(404).json({ error: 'Lichen personality not found' });
  }

  // 🌍 Pull both images from the DB
  const originalImage = lichen.lichenImage || null;

  const sessionData = sessiondb.get(sessionId) || {};
  const generatedImage = sessionData[lichenID]?.generatedImage || null;

  // ✨ Setup System prompt: append language instruction if needed
  let systemPrompt = lichen.personality;
  if (userLang === 'nl') {
    systemPrompt += "\n\nLet op: spreek en antwoord in het Nederlands; een lichen heet een 'korstmos' in het Nederlands.";
  }

  // 🧠 Add visual memory as the very first user message
  const visualContext = {
    role: 'user',
    content: [
      { type: 'text', text: 'This is what you look like in 2 images: your original body, and one with eyes :) thats the one people see when they chat to you.' },
      ...(originalImage
        ? [{
            type: 'image_url',
            image_url: { url: originalImage }
          }]
        : []),
      ...(generatedImage
        ? [{
            type: 'image_url',
            image_url: { url: generatedImage }
          }]
        : [])
    ]
  };

  const formattedMessages = [visualContext, ...messages];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedMessages
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

// VISION API
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

// REPLICATE IMAGE GENERATION
app.post('/api/generate-image', async (req, res) => {
  const { base64Image } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: 'Missing base64 image data' });
  }

  try {
    const inputImage = `data:image/png;base64,${base64Image}`;
    
    const output = await replicate.run(
      "sabrinaverhage/lichen-01:45c30012484b14332f27a30a4239a69793c99fa99f4483e5aaa9ca657ae881ef",
      {
        input: {
          image: inputImage,
          prompt: "Closeup photograph of lichen growing on a tree bark but with cute eyes LCHNYS",
          
          // Your custom variables:
          prompt_strength: 0.4,
          guidance_scale: 2.5,
          num_inference_steps: 35,
          lora_scale: 1.5,

          // (optional but useful defaults)
          num_outputs: 1,
          output_format: "webp",
          aspect_ratio: "1:1"
        }
      }
    );

    console.log(output[0].url());

    const imageUrl = output[0].url(); // this is a string

    res.json({ output: imageUrl }); // send only the string back

  } catch (err) {
    console.error("Replicate error:", err);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// Save data to a user's session
app.post('/api/user-session/:userSessionId', (req, res) => {
  const sessionId = req.params.userSessionId;
  const { lichenID, generatedImage, chatMessage } = req.body;

  if (!lichenID) {
    return res.status(400).json({ error: 'Missing lichenID' });
  }

  const session = sessiondb.get(sessionId) || {};
  const existing = session[lichenID] || {
    lichenID,
    generatedImage: null,
    chatHistory: [],
    timestamp: Date.now()
  };

  // Update generated image if provided
  if (generatedImage) {
    existing.generatedImage = generatedImage;
    existing.timestamp = Date.now(); // refresh timestamp
  }

  // Add chat message if provided
  if (chatMessage && chatMessage.role && chatMessage.content) {
    existing.chatHistory = existing.chatHistory || [];
    existing.chatHistory.push(chatMessage);
  }

  session[lichenID] = existing;
  sessiondb.set(sessionId, session);

  res.json({ success: true });
});


// Get user session
app.get('/api/user-session/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const sessionData = sessiondb.get(sessionId) || {};
  res.json(sessionData);
});

// Admin debug session data
app.get('/api/debug/sessions', (req, res) => {
  const sessions = {};
  sessiondb.forEach((key, value) => {
    sessions[key] = value;
  });
  res.json(sessions);
});

// Admin delete user session data
app.delete('/api/user-session/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  sessiondb.rm(sessionId);
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 
