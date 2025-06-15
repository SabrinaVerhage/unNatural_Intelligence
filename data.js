const Dirty = require('dirty');
const db = new Dirty('locations.db');

// Only run this once to populate the DB
db.on('load', () => {
  db.set('amsterdam', {
    name: "Amsterdam Center",
    coordinates: [4.89, 52.37],
    message: "The heart of Amsterdam"
  });

  db.set('westerpark', {
    name: "Westerpark",
    coordinates: [4.872, 52.386],
    message: "A place to wander and wonder"
  });

  db.set('noord', {
    name: "Amsterdam Noord",
    coordinates: [4.916, 52.41],
    message: "Cross the IJ to find new dimensions"
  });

  console.log("Sample points saved.");
});
