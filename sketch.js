//CASA DETROIT 2026
//code by Marlon Barrios Solano
// Inspired by matt DesLauriers

//music by by Michael Ramir C.

let audioContext;
let frequencyData;
let analyserNode;
let currentHue = 1; 
let maxFrequencyTarget = 1;
let audio;
let currentAudioFile = null; // No default file - only dropped files
let currentAudioObjectURL = null; // Track object URL for dropped files (to revoke later)
let audioSource = null; // Store the audio source nzode
let preventAutoPlay = false; // Flag to prevent auto-play when returning to home
let audioLoadedWaiting = false; // Flag to track if audio is loaded but waiting for spacebar to play
let smoothedSignals = [];
let peakSignals = [];
let bassLevel = 0;
let midLevel = 0;
let trebleLevel = 0;
let overallEnergy = 0;
// More granular frequency bands for differentiated reactivity  
let subBassLevel = 0;      // 20-60 Hz (deep sub-bass, kick drums)
let lowBassLevel = 0;      // 60-120 Hz (bass guitar, bass synth)
let midBassLevel = 0;      // 120-250 Hz (low-mid bass)
let lowMidLevel = 0;       // 250-500 Hz (low-mid, warmth)
let midMidLevel = 0;       // 500-2000 Hz (mid-range, vocals, rhythm)
let highMidLevel = 0;      // 2000-5000 Hz (high-mid, presence, attack)
let presenceLevel = 0;     // 5000-10000 Hz (presence, clarity)
let airLevel = 0;          // 10000-20000 Hz (air, sparkle)
let snareLevel = 0;        // 200-800 Hz (snare drum frequencies)
let lastSnareLevel = 0;    // Track previous snare level for hit detection
let snareHit = false;      // Global snare hit detection for building dance
let isDraggingOver = false; // Track if file is being dragged over canvas
let buildings = [];
let monorailPosition = 0;
let monorailSpeed = 0.5;
let monorailCars = [];
let robots = [];
let helicopters = [];
let planes = [];
let lastHelicopterFrame = -1; // Prevent double updates
let heliLastX = null; // Track last position to prevent jumps
let lastDroneFrame = -1; // Prevent double updates for drone
let droneLastX = null; // Track last position to prevent jumps
let droneLastY = null; // Track last Y position to prevent jumps
let ambulances = [];
let drones = []; // Drones flying around
let rockets = []; // Rockets launching
let lasers = []; // Laser beams
let lastBeatTime = 0;
// Toggle states for keyboard controls - ALL START AS FALSE (only geometries visible on load)
// Mapped to 1234567890 and qwerty
let showCars = false;              // 1
let showPeople = false;            // 2 (regular people, no parachutes)
let showParachutists = false;      // 3 (people with parachutes)
let showHelicopters = false;       // 4
let showTracks = false;           // 5 (monorail tracks only)
let showTrainCars = false;         // 6 (monorail cars only)
let showBuildingsStatic = false;  // 7 (static buildings)
let showRenaissance = false;       // 8 (Renaissance building)
let showBuildingsMoving = false;  // 9 (moving buildings)
let showDrones = false;           // 0
let showPlanes = false;           // q
let showAmbulances = false;       // w
let showRockets = false;          // e (disabled - rockets eliminated)
let showCentralCircles = true;    // e - toggle central circles (sun/moon)
let centralCirclesOpacity = 1.0;  // Fade opacity for central circles (0.0 to 1.0)
let centralCirclesFadeTarget = 1.0; // Target opacity for fade transition
let centralCirclesFadeSpeed = 0.05; // Speed of fade transition
let showRobots = false;           // r
let showLasers = false;           // t
let showSmoke = false;            // y
let showExplosions = false;       // (part of y)
let showICECars = false;          // i - ICE surveillance vehicles
let showBiplane = false;          // g - Biplane with banner

// GLOBAL STATE MACHINE - Cycles through all app states
let globalStateIndex = 0; // Current state index
let globalAccumulatedStates = 1; // Number of states to cycle through (starts at 1, accumulates)
let globalLastStateChangeTime = 0; // Track last state change
let globalStateChangeInterval = 10000; // Change states every 10 seconds max
let demoMode = false; // Demo mode flag - when true, uses random/combined states
let demoComplexity = 2; // Demo complexity level (starts at 2, progressively accumulates to 6)
let demoRandomMode = false; // When true, demo has reached all states and now randomizes
let lastGlobalBeatTime = 0; // Track last beat for demo mode
let demoStateStartTime = 0; // Track when current demo state started
let demoStateDuration = 0; // Duration for current demo state (5-12 seconds, changes on beat)

// Define ALL possible app states - each state shows different combinations of elements
const allAppStates = [
  {
    name: 'geometries_only',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false, iceCars: false, biplane: false,
    backgroundHue: 200
  },
  {
    name: 'cars',
    cars: true, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false, iceCars: false, biplane: false,
    backgroundHue: 240
  },
  {
    name: 'ice_cars',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false, iceCars: true,
    biplane: false,
    backgroundHue: 0
  },
  {
    name: 'biplane',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false, iceCars: false,
    biplane: true,
    backgroundHue: 180
  },
  {
    name: 'people',
    cars: false, people: true, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false,
    backgroundHue: 180
  },
  {
    name: 'buildings_static',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: true, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: true,
    backgroundHue: 120
  },
  {
    name: 'buildings_moving',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: true, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: true,
    backgroundHue: 60
  },
  {
    name: 'drones',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: true, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: true, smoke: false,
    backgroundHue: 300
  },
  {
    name: 'robots',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: true, lasers: false, smoke: false,
    backgroundHue: 0
  },
  {
    name: 'helicopters',
    cars: false, people: false, parachutists: false, helicopters: true,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false,
    backgroundHue: 280
  },
  {
    name: 'planes',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: true, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false,
    backgroundHue: 200
  },
  {
    name: 'ambulances',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: true,
    rockets: false, robots: false, lasers: false, smoke: false,
    backgroundHue: 0
  },
  {
    name: 'monorail',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: true, trainCars: true, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false,
    backgroundHue: 240
  },
  {
    name: 'renaissance',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: true,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false,
    backgroundHue: 30
  },
  {
    name: 'parachutists',
    cars: false, people: false, parachutists: true, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false,
    backgroundHue: 150
  },
  {
    name: 'all_elements',
    cars: true, people: true, parachutists: true, helicopters: true,
    tracks: true, trainCars: true, buildingsStatic: true, renaissance: true,
    buildingsMoving: true, drones: true, planes: true, ambulances: true,
    rockets: false, robots: true, lasers: false, smoke: true, iceCars: true, biplane: true,
    backgroundHue: 200
  },
  {
    name: 'central_circles',
    cars: false, people: false, parachutists: false, helicopters: false,
    tracks: false, trainCars: false, buildingsStatic: false, renaissance: false,
    buildingsMoving: false, drones: false, planes: false, ambulances: false,
    rockets: false, robots: false, lasers: false, smoke: false, iceCars: false, biplane: false,
    centralCircles: true,
    backgroundHue: 200
  }
];

// Fade opacity variables for all toggleable elements
let carsOpacity = 0.0;
let carsFadeTarget = 0.0;
let peopleOpacity = 0.0;
let peopleFadeTarget = 0.0;
let parachutistsOpacity = 0.0;
let parachutistsFadeTarget = 0.0;
let helicoptersOpacity = 0.0;
let helicoptersFadeTarget = 0.0;
let tracksOpacity = 0.0;
let tracksFadeTarget = 0.0;
let trainCarsOpacity = 0.0;
let trainCarsFadeTarget = 0.0;
let buildingsStaticOpacity = 0.0;
let buildingsStaticFadeTarget = 0.0;
let renaissanceOpacity = 0.0;
let renaissanceFadeTarget = 0.0;
let buildingsMovingOpacity = 0.0;
let buildingsMovingFadeTarget = 0.0;
let dronesOpacity = 0.0;
let dronesFadeTarget = 0.0;
let planesOpacity = 0.0;
let planesFadeTarget = 0.0;
let ambulancesOpacity = 0.0;
let ambulancesFadeTarget = 0.0;
let robotsOpacity = 0.0;
let robotsFadeTarget = 0.0;
let lasersOpacity = 0.0;
let lasersFadeTarget = 0.0;
let smokeOpacity = 0.0;
let smokeFadeTarget = 0.0;
let explosionsOpacity = 0.0;
let explosionsFadeTarget = 0.0;
let biplaneOpacity = 0.0;
let biplaneFadeTarget = 0.0;
let biplane = null; // Single biplane with banner
let iceCarsOpacity = 0.0;
let iceCarsFadeTarget = 0.0;

const fadeSpeed = 0.05; // Speed of fade transition for all elements
let vintageCars = [];
let iceCars = []; // Surveillance ICE vehicles
let carExplosions = []; // Explosion effects for cars
let renaissanceCenter = null;
let people = []; // Regular people (no parachutes)
let parachutists = []; // People with parachutes
let collectibles = []; // Energy orbs/collectibles for people
let obstacles = []; // Obstacles to avoid
let dayTime = 0; // 0 = midnight, 0.5 = noon, 1 = midnight again
let daySpeed = 0.0001; // Speed of day/night cycle
let isNight = false; // Global night state
let ambientLight = 1; // Global ambient light level
let maxPeople = 1; // Start with very few people
let targetMaxPeople = 12; // Gradually increase to this many
let lastPersonSpawnTime = 0; // Track when last person was spawned
let peopleSpawnTimer = 0; // Timer for spawning new people
let audioStartTime = 0; // Track when audio started playing
let maxParachutists = 1; // Start with very few parachutists
let targetMaxParachutists = 20; // Gradually increase to this many (MORE ABUNDANT)
let lastParachutistSpawnTime = 0; // Track when last parachutist was spawned
let maxCars = 1; // Start with very few cars
let targetMaxCars = 8; // Gradually increase to this many
let lastCarSpawnTime = 0; // Track when last car was spawned
let maxMonorailCars = 1; // Start with very few monorail cars
let targetMaxMonorailCars = 6; // Gradually increase to this many

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Cursor is now visible for better interaction with UI elements

  // Show credits footer on home page
  const footer = document.getElementById('credits-footer');
  if (footer) {
    footer.style.display = 'block';
  }
  
  // Setup home button - initially hidden
  const homeButton = document.getElementById('home-button');
  if (homeButton) {
    homeButton.classList.add('home-button-hidden');
    homeButton.classList.remove('home-button-visible');
    // Add click handler to return to home
    homeButton.addEventListener('click', function() {
      returnToHome();
    });
  }

  // Optional:
  // If the user inserts/removes bluetooth headphones or pushes
  // the play/pause media keys, we can use the following to ignore the action
  navigator.mediaSession.setActionHandler("pause", () => {});
  
  // Prevent browser from opening dropped files - attach event listeners to window
  // Use window-level handlers to catch all drops
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingOver = true;
  }, false);
  
  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the window
    if (e.clientX === 0 && e.clientY === 0) {
      isDraggingOver = false;
    }
  }, false);
  
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingOver = false;
    
    console.log('=== FILE DROPPED ===');
    
    // Get the dropped files
    const files = e.dataTransfer.files;
    console.log('Number of files dropped:', files.length);
    
    if (files.length > 0) {
      const file = files[0];
      console.log('File name:', file.name);
      console.log('File type:', file.type);
      console.log('File size:', file.size, 'bytes');
      
      // Immediately load the file
      loadDroppedAudioFile(file);
    } else {
      console.log('ERROR: No files in drop event');
    }
  }, false);
  
  // Don't initialize elements on load - they will be added with keyboard keys
  // Only geometries (central circles) will be visible initially
  robots = []; // Initialize empty arrays
  helicopters = [];
  planes = [];
  ambulances = [];
  drones = [];
  rockets = [];
  lasers = [];
  smokeParticles = [];
}

function spawnPerson(hasParachute = false) {
  // Different flying heights across the screen
  const flyingHeights = [
    height * 0.3, // High
    height * 0.4, // Mid-high
    height * 0.5, // Middle
    height * 0.6, // Mid-low
    height * 0.7  // Lower
  ];
  
  const direction = random() > 0.5 ? 1 : -1; // Random direction
  const startPos = direction === 1 ? -50 : width + 50;
  
  // Parachutists ALWAYS start from the TOP and fall DOWN
  // People with wings spawn from DIFFERENT DIRECTIONS (left, right, top, bottom)
  let startX, startY, flyDirectionX, flyDirectionY;
  if (hasParachute) {
    // Parachutists always from top
    startX = random(50, width - 50);
    startY = -50;
    flyDirectionX = 0;
    flyDirectionY = 1; // Down
  } else {
    // People with wings spawn from random edges
    const spawnEdge = floor(random(4)); // 0=left, 1=right, 2=top, 3=bottom
    if (spawnEdge === 0) {
      // From left edge
      startX = -50;
      startY = random(50, height - 50);
      flyDirectionX = random(0.3, 1.0); // Fly right
      flyDirectionY = random(-0.5, 0.5); // Some vertical variation
    } else if (spawnEdge === 1) {
      // From right edge
      startX = width + 50;
      startY = random(50, height - 50);
      flyDirectionX = random(-1.0, -0.3); // Fly left
      flyDirectionY = random(-0.5, 0.5); // Some vertical variation
    } else if (spawnEdge === 2) {
      // From top edge
      startX = random(50, width - 50);
      startY = -50;
      flyDirectionX = random(-0.5, 0.5); // Some horizontal variation
      flyDirectionY = random(0.3, 1.0); // Fly down
    } else {
      // From bottom edge
      startX = random(50, width - 50);
      startY = height + 50;
      flyDirectionX = random(-0.5, 0.5); // Some horizontal variation
      flyDirectionY = random(-1.0, -0.3); // Fly up
    }
  }
  
  const personData = {
    x: startX,
    y: startY,
    baseY: startY,
    direction: direction,
    speed: random(0.015, 0.04), // Extremely slow - maximum time to see details
    hue: random(0, 360),
      scale: hasParachute ? random(2.0, 3.0) : random(1.0, 1.5), // Parachutists are LARGER
      targetScale: hasParachute ? random(2.0, 3.5) : random(1.0, 1.6), // Parachutists can grow larger
      minScale: hasParachute ? 1.5 : 0.5, // Parachutists don't get too small
      maxScale: hasParachute ? 4.5 : 3.0, // Parachutists can get MUCH bigger
      growthPhase: random(0, TWO_PI),
      growthSpeed: random(0.05, 0.12), // Faster growth for more visible changes
    flyPhase: random(0, TWO_PI),
    flySpeed: random(0.01, 0.025), // Much more reduced
    rotation: hasParachute ? random(-PI/2 - 0.3, -PI/2 + 0.3) : atan2(flyDirectionY, flyDirectionX), // Face direction of travel
    rotationSpeed: random(-0.02, 0.02),
    baseOrientation: hasParachute ? random(-PI/2 - 0.4, -PI/2 + 0.4) : atan2(flyDirectionY, flyDirectionX), // Face direction of travel
    verticalSpeed: hasParachute ? random(0.017, 0.05) : flyDirectionY * random(0.1, 0.3), // Fly in spawn direction
    phase: random(0, TWO_PI),
    wingFlap: 0,
    trailPhase: random(0, TWO_PI),
    // Organic movement tracking
    prevX: 0,
    prevY: 0,
    targetY: 0,
    targetRotation: 0,
    flightPath: [], // Waypoints for organic navigation
    currentWaypoint: 0,
    steeringAngle: 0, // Organic steering
    targetSteering: 0,
    // Organic physics - extremely slow
    velocityX: hasParachute ? random(-0.015, 0.015) : flyDirectionX * random(0.1, 0.3), // Horizontal movement based on direction
    velocityY: hasParachute ? random(0.017, 0.05) : flyDirectionY * random(0.1, 0.3), // Vertical movement based on direction
    driftPhase: random(0, TWO_PI),
    driftSpeed: random(0.003, 0.008), // Much more reduced
    // Strange game mechanics
    score: 0, // Points collected
    energy: 100, // Energy level (affects speed/abilities)
    maxEnergy: 100,
    powerUpType: null, // null, 'speed', 'shield', 'magnet', 'glitch', 'mirror', 'phase'
    powerUpTimer: 0,
    lastCollectibleTime: 0,
    avoidanceRadius: 30, // Radius for obstacle avoidance
    collectRadius: 25, // Radius for collecting items
    boostMultiplier: 1, // Temporary speed boost
    boostTimer: 0,
    // Strange effects
    glitchPhase: 0,
    mirrorCount: 0,
    phaseShift: 0,
    flightType: hasParachute ? 'parachute' : 'wings' // Track flight type
  };
  
  if (hasParachute) {
    parachutists.push(personData);
  } else {
    people.push(personData);
  }
}

function initializePeople() {
  people = [];
  const initialPeopleCount = 1; // Start with just 1 person
  
  // Spawn initial people
  for (let i = 0; i < initialPeopleCount; i++) {
    spawnPerson();
  }
  
  // Reset progression variables
  maxPeople = initialPeopleCount;
  lastPersonSpawnTime = millis();
  peopleSpawnTimer = 0;
}

function initializeRenaissanceCenter() {
  renaissanceCenter = {
    x: width * 0.25, // Off-center (left side) - never in the middle
    baseY: height * 0.85,
    currentHeight: 0,
    targetHeight: 0,
    opacity: 0,
    targetOpacity: 0,
    phase: random(0, TWO_PI),
    hue: 200, // Blue-gray industrial color
    windowPhase: 0
  };
}

function initializeRobots() {
  if (!robots) robots = [];
  // Clear existing robots and spawn THREE robots with names
  robots = [];
  
  // Define robot visual properties (hue, scale) - separate from names
  const robotProperties = [
    {
      hue: 180, // Blue-green
      scale: 2.5, // Smaller size
    },
    {
      hue: 280, // Purple
      scale: 3.0, // Smaller size
    },
    {
      hue: 20, // Orange-red
      scale: 2.2, // Smaller size
    }
  ];
  
  // Define names separately - will be randomly assigned
  const robotNames = ["Juan", "Derrik", "Kevin"];
  
  // Shuffle names randomly so they switch between robots
  for (let i = robotNames.length - 1; i > 0; i--) {
    const j = Math.floor(random(i + 1));
    [robotNames[i], robotNames[j]] = [robotNames[j], robotNames[i]];
  }
  
  // Shuffle robot properties order randomly
  for (let i = robotProperties.length - 1; i > 0; i--) {
    const j = Math.floor(random(i + 1));
    [robotProperties[i], robotProperties[j]] = [robotProperties[j], robotProperties[i]];
  }
  
  // Generate random positions for each robot (different placements) - NO OVERLAPPING
  const positions = [];
  const minDistance = 120; // Minimum distance between robot centers (accounts for robot size + padding)
  
  for (let i = 0; i < robotProperties.length; i++) {
    let attempts = 0;
    let validPosition = false;
    let xPos, yPos;
    
    // Keep trying until we find a position that doesn't overlap
    while (!validPosition && attempts < 100) {
      // Random x positions across screen (with margins)
      xPos = random(width * 0.15, width * 0.85);
      // Position robots at ground level (same as cars)
      // Robot extends from y=-52.5 (head top) to y=35 (pedestal bottom) in local coords
      // With max scale of 3.0, bottom extends 35*3.0 = 105px below robot.y
      // Ground level is around height * 0.85 (where cars are)
      const groundLevel = height * 0.85;
      const maxRobotBottomOffset = 35 * 3.0; // Maximum extension below robot center (max scale)
      // Position robot so its bottom (pedestal) is at ground level
      yPos = groundLevel - maxRobotBottomOffset;
      
      // Check if this position is far enough from all existing positions
      validPosition = true;
      for (let j = 0; j < positions.length; j++) {
        const existingPos = positions[j];
        const distance = dist(xPos, yPos, existingPos.x, existingPos.y);
        if (distance < minDistance) {
          validPosition = false;
          break;
        }
      }
      
      attempts++;
    }
    
    // If we couldn't find a non-overlapping position after many attempts, use a grid-based fallback
    if (!validPosition) {
      // Fallback: use evenly spaced positions within 10 pixels of bottom edge
      const gridCols = 3;
      const colIndex = i % gridCols;
      xPos = width * (0.2 + colIndex * 0.3);
      // Position robots within 10 pixels of bottom, ensuring whole body is visible
      const maxRobotBottomOffset = 35 * 3.0; // Maximum extension below robot center (max scale)
      yPos = height - maxRobotBottomOffset - 10 - (i % gridCols) * 3; // Vary slightly but stay near bottom
    }
    
    positions.push({ x: xPos, y: yPos });
  }
  
  // Create robots with randomly assigned names and shuffled properties
  for (let i = 0; i < robotProperties.length; i++) {
    const props = robotProperties[i];
    const pos = positions[i];
    robots.push({
      name: robotNames[i], // Randomly assigned name
      x: pos.x,
      y: pos.y,
      baseY: pos.y, // Base position
      hue: props.hue,
      scale: props.scale, // Smaller sizes
      opacity: 1, // Start fully visible - no fade
      targetOpacity: 1, // Always stay at full opacity
      armAngle1: random(0, TWO_PI),
      armAngle2: random(0, TWO_PI),
      armAngle3: random(0, TWO_PI),
      armSpeed1: random(0.003, 0.008), // Much slower base speed
      armSpeed2: random(0.004, 0.01), // Much slower base speed
      armSpeed3: random(0.005, 0.012), // Much slower base speed
      phase: random(0, TWO_PI),
      lifetime: 0,
      maxLifetime: Infinity // Never fade out - stays forever
    });
  }
}

function initializeParachutists() {
  parachutists = [];
  const initialParachutistCount = 1; // Start with just 1 parachutist
  for (let i = 0; i < initialParachutistCount; i++) {
    spawnPerson(true); // true = has parachute
  }
  maxParachutists = initialParachutistCount;
  lastParachutistSpawnTime = millis();
}

function initializeDrones() {
  drones = [];
  droneLastX = null;
  droneLastY = null;
  lastDroneFrame = -1;
  // Spawn 4 drones at less symmetrical positions in top half only
  const positions = [
    {x: width * 0.25 + random(-50, 50), y: height * 0.15 + random(-20, 20)}, // Top left area - randomized
    {x: width * 0.75 + random(-50, 50), y: height * 0.2 + random(-20, 20)}, // Top right area - randomized
    {x: width * 0.2 + random(-50, 50), y: height * 0.35 + random(-20, 20)}, // Mid left area - randomized
    {x: width * 0.8 + random(-50, 50), y: height * 0.4 + random(-20, 20)}  // Mid right area - randomized
  ];
  
  for (let i = 0; i < 4; i++) {
    drones.push({
      x: positions[i].x,
      y: positions[i].y,
      speed: 0.4, // Slow speed
      moveDirection: i % 4, // Different starting directions
      turnDistance: 300, // Distance before turning
      distanceTraveled: 0, // Track distance on current path
      hue: 220 + i * 30, // Different hues for each drone
      scale: 4.5, // Large and visible
      opacity: 1,
      targetOpacity: 1,
      rotation: 0,
      propPhase: 0,
      laserCooldown: 0,
      lifetime: 0,
      maxLifetime: Infinity,
      wifiActive: false, // WiFi communication state
      wifiPhase: 0, // WiFi animation phase
      wifiTimer: random(2000, 5000) // Random timer for WiFi activation
    });
  }
}

function spawnVintageCar() {
  // Classic 1950s car colors
  const carColors = [
    {hue: 0, sat: 80, light: 50},   // Red
    {hue: 200, sat: 70, light: 45}, // Blue
    {hue: 30, sat: 75, light: 55},  // Orange
    {hue: 120, sat: 60, light: 50}, // Green
    {hue: 280, sat: 70, light: 50}, // Purple
    {hue: 45, sat: 80, light: 60},  // Yellow
    {hue: 0, sat: 0, light: 40}     // Black
  ];
  
  const laneCount = 3;
  const laneSpacing = 40;
  const baseRoadY = height * 0.85;
  
  // Spawn "here and there" - random positions across screen
  const direction = random() > 0.5 ? 1 : -1;
  // Spawn at random X positions, not just edges
  const spawnX = random() > 0.5 ? 
    (direction === 1 ? random(-200, -50) : random(width + 50, width + 200)) :
    random(0, width); // Sometimes spawn in the middle!
  
  const color = carColors[Math.floor(random(carColors.length))];
  const laneIndex = Math.floor(random(laneCount));
  const laneY = baseRoadY + (laneIndex * laneSpacing) - (laneCount - 1) * laneSpacing / 2;
  
  vintageCars.push({
    x: spawnX,
    y: laneY,
    baseY: laneY,
    lane: laneIndex,
    direction: direction,
    speed: random(0.5, 1.2),
    hue: color.hue,
    saturation: color.sat,
    lightness: color.light,
    scale: random(1.5, 2.5) * 1.3, // 30% larger cars (1.95 to 3.25)
    phase: random(0, TWO_PI),
    wheelRotation: 0,
    lastBassLevel: 0,
    opacity: 0, // Start invisible, fade in
    targetOpacity: 1,
    explosionPhase: 0,
    lifetime: 0
  });
  
  // Create explosion effect when car spawns
  createCarExplosion(spawnX, laneY, true);
}

function createCarExplosion(x, y, isSpawn) {
  if (!showExplosions) return; // Don't create explosions if disabled
  
  const particleCount = isSpawn ? 15 : 30; // More particles for explosions
  const baseHue = isSpawn ? 60 : random(0, 60); // Yellow for spawn, red/orange for explosion
  
  for (let p = 0; p < particleCount; p++) {
    const angle = random(TWO_PI);
    const speed = isSpawn ? random(1, 5) : random(3, 12); // Faster for explosions
    carExplosions.push({
      x: x,
      y: y,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      size: random(4, 12),
      hue: (baseHue + random(-30, 30)) % 360,
      saturation: 80 + random(0, 20),
      lightness: 50 + random(0, 30),
      lifetime: 0,
      maxLifetime: isSpawn ? random(200, 400) : random(400, 800),
      isSpawn: isSpawn,
      rotation: random(0, TWO_PI),
      rotationSpeed: random(-0.2, 0.2)
    });
  }
}

function initializeVintageCars() {
  vintageCars = [];
  carExplosions = [];
  // Start with just 1 car
  const initialCarCount = 1;
  for (let i = 0; i < initialCarCount; i++) {
    spawnVintageCar();
    // Set opacity to 1 immediately for initial cars
    if (vintageCars.length > 0) {
      vintageCars[vintageCars.length - 1].opacity = 1;
      vintageCars[vintageCars.length - 1].targetOpacity = 1;
    }
  }
  maxCars = initialCarCount;
  lastCarSpawnTime = millis(); // Initialize spawn timer
}

function initializeMonorail() {
  monorailCars = [];
  const carCount = 1; // Start with just 1 monorail car
  const carSpacing = width / 2;
  
  for (let i = 0; i < carCount; i++) {
    const direction = i % 2 === 0 ? 1 : -1; // Alternate directions
    const startPos = direction === 1 ? -100 : width + 100; // Start off-screen
    
    monorailCars.push({
      position: startPos + (i * carSpacing * 0.5) % width,
      hue: random(180, 240), // Industrial colors
      speed: random(0.4, 0.8),
      phase: random(0, TWO_PI),
      direction: direction, // 1 = right, -1 = left
      beatPhase: random(0, TWO_PI), // For beat synchronization
      lastBeatTime: 0,
      beatBoost: 0 // Extra speed boost from beats
    });
  }
  
  monorailPosition = 0;
  maxMonorailCars = carCount;
}

function initializeBuildings() {
  buildings = [];
  const buildingCount = 18;
  const spacing = width / buildingCount;
  
  for (let i = 0; i < buildingCount; i++) {
    const buildingType = i % 4; // 0=factory, 1=warehouse, 2=abandoned, 3=industrial
    const hasSmokestack = buildingType === 0 && random() > 0.5; // Factories have smokestacks
    const isAbandoned = buildingType === 2;
    
    buildings.push({
      x: i * spacing + spacing * 0.2,
      baseWidth: (buildingType === 0 ? random(60, 120) : random(40, 90)) * 1.3, // 30% larger
      targetHeight: (buildingType === 0 ? random(150, 300) : random(80, 220)) * 1.3, // 30% larger
      currentHeight: 0,
      hue: isAbandoned ? random(0, 30) : random(180, 240), // Grays/blues for industrial, reds for abandoned
      saturation: isAbandoned ? random(20, 40) : random(30, 60),
      lightness: isAbandoned ? random(30, 50) : random(40, 60),
      opacity: 0,
      targetOpacity: 0,
      buildingType: buildingType,
      hasSmokestack: hasSmokestack,
      smokestackHeight: hasSmokestack ? random(40, 80) * 1.3 : 0, // 30% larger
      isAbandoned: isAbandoned,
      windowPattern: Math.floor(random(0, 4)), // Different window patterns
      // Unique movement properties for each building
      speedMultiplier: random(0.5, 2.0), // How fast it responds (0.5 = slow, 2.0 = fast)
      swayAmount: random(0, 8), // Horizontal sway amount
      swaySpeed: random(0.02, 0.08), // How fast it sways
      pulseIntensity: random(0.8, 1.3), // How much it pulses
      baseX: i * spacing + spacing * 0.2, // Original x position for sway
      responseDelay: random(0, 0.3), // Delay before responding to audio
      heightVariation: random(0.7, 1.2), // Height variation multiplier
      rotation: random(-0.05, 0.05), // Slight rotation/tilt
      bounceAmount: random(0, 15), // Vertical bounce
      bounceSpeed: random(0.03, 0.07), // Bounce speed
      // Make some buildings static (travelSpeed = 0) and some moving (travelSpeed > 0)
      travelSpeed: i % 2 === 0 ? random(0.3, 1.2) : 0, // Even indices = moving, odd = static
      travelAmount: random(0.5, 2.0), // Travel distance
      travelPhase: random(0, TWO_PI), // Travel phase
      // Phase values for smooth animations
      swayPhase: random(0, TWO_PI), // Random starting phase for sway
      bouncePhase: random(0, TWO_PI), // Random starting phase for bounce
      pulsePhase: random(0, TWO_PI) // Random starting phase for pulse
    });
  }
}

function loadAudioFile(filename) {
  console.log('loadAudioFile called with:', filename);
  
  // If audio is already playing, stop and disconnect it first
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
  
  // Revoke previous object URL ONLY if we're loading a different file
  // Don't revoke if it's the same URL (audio might still be using it)
  if (currentAudioObjectURL && currentAudioObjectURL !== filename) {
    console.log('Revoking previous object URL:', currentAudioObjectURL);
    URL.revokeObjectURL(currentAudioObjectURL);
    currentAudioObjectURL = null;
  }
  
  // Disconnect old source if it exists
  if (audioSource) {
    try {
      audioSource.disconnect();
    } catch(e) {
      console.log('Error disconnecting source:', e);
    }
    audioSource = null;
  }
  
  // Reset progression when switching files (each song starts fresh)
  audioStartTime = 0;
  maxPeople = 1;
  maxCars = 1;
  maxMonorailCars = 1;
  lastCarSpawnTime = 0;
  
  // Only initiate audio context upon a user gesture
  if (!audioContext) {
    audioContext = new AudioContext();
    console.log('Created new audio context, state:', audioContext.state);
  }

  // Create a NEW audio element (can't reuse once connected to MediaElementSource)
    audio = document.createElement("audio");
    audio.loop = true;
  audio.controls = false; // No controls
  audio.style.display = 'none'; // Hide it

  // Only set crossOrigin for remote files, not for local object URLs
  if (!filename.startsWith('blob:')) {
    audio.crossOrigin = "Anonymous";
  }
  
  // Add to DOM (some browsers need this)
  document.body.appendChild(audio);
  
  // Set source FIRST - verify it's a valid URL
  if (!filename || filename === '') {
    console.error('ERROR: No filename provided to loadAudioFile');
    alert('Error: No audio file specified');
    return;
  }
  
  // Store the object URL BEFORE setting src (so it doesn't get garbage collected)
  if (filename.startsWith('blob:')) {
    currentAudioObjectURL = filename;
    console.log('Storing blob URL:', filename);
  }
  
  // Set the source
  audio.src = filename;
  currentAudioFile = filename;
  console.log('=== loadAudioFile: Audio src set ===');
  console.log('Filename:', filename);
  console.log('Audio src:', audio.src);
  console.log('Audio element created:', audio);
  
  // Verify the src was set correctly
  if (!audio.src || audio.src === '') {
    console.error('ERROR: Audio src not set properly!');
    console.error('Expected:', filename);
    console.error('Got:', audio.src);
    alert('Error loading audio file. Please try again.');
    return;
  }
  
  // Wait a moment to ensure the blob URL is accessible
  // Some browsers need a small delay after setting src
  setTimeout(() => {
    if (audio.src !== filename) {
      console.warn('Audio src changed after setting!');
      console.warn('Expected:', filename);
      console.warn('Got:', audio.src);
      // Try setting it again
      audio.src = filename;
    }
  }, 100);

  // Function to connect audio to Web Audio API and start playback
  const connectAndPlay = () => {
    console.log('connectAndPlay called');
    console.log('Audio element:', audio);
    console.log('Audio readyState:', audio.readyState);
    console.log('Audio src:', audio.src);
    console.log('Audio context state:', audioContext.state);
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
      console.log('Resuming suspended audio context...');
      audioContext.resume().then(() => {
        console.log('Audio context resumed, state:', audioContext.state);
        doConnectAndPlay();
      }).catch(e => {
        console.log('Resume error:', e);
      });
    } else {
      doConnectAndPlay();
    }
  };
  
  const doConnectAndPlay = () => {
    console.log('=== doConnectAndPlay START ===');
    console.log('Audio element:', audio);
    console.log('Audio readyState:', audio.readyState);
    console.log('Audio src:', audio.src);
    console.log('Audio paused:', audio.paused);
    
    // Make sure audio is loaded enough
    if (audio.readyState < 2) {
      console.log('Audio not ready yet, waiting...');
      return;
    }
    
    // Create or reuse analyser node BEFORE connecting source
    if (!analyserNode) {
      console.log('Creating analyser node');
      analyserNode = audioContext.createAnalyser();
    const detail = 4;
    analyserNode.fftSize = 2048 * detail;
      analyserNode.minDecibels = -90;
      analyserNode.maxDecibels = -20;
      analyserNode.smoothingTimeConstant = 0.3;
    frequencyData = new Float32Array(analyserNode.frequencyBinCount);
      smoothedSignals = [];
      peakSignals = [];
      console.log('Analyser node created');
    }
    
    // Connect source into the WebAudio context (only if not already connected)
    if (!audioSource) {
      try {
        console.log('Creating MediaElementSource...');
        audioSource = audioContext.createMediaElementSource(audio);
        console.log('MediaElementSource created successfully');
        
        // Connect: source -> analyser -> destination
        audioSource.connect(analyserNode);
        console.log('Connected source to analyser');
        analyserNode.connect(audioContext.destination);
        console.log('Connected analyser to destination');
        console.log('✓ Audio fully connected to Web Audio API');
      } catch(e) {
        console.error('ERROR connecting audio source:', e);
        console.error('Error name:', e.name);
        console.error('Error message:', e.message);
        alert('Error connecting audio: ' + e.message);
        return;
      }
    } else {
      console.log('Audio source already exists, reusing');
    }
    
    // Ensure audio context is running
    if (audioContext.state === 'suspended') {
      console.log('Audio context suspended, resuming...');
      audioContext.resume().then(() => {
        console.log('Audio context resumed, now playing');
        startPlayback();
      }).catch(e => {
        console.error('Error resuming context:', e);
      });
    } else {
      startPlayback();
    }
  };
  
  const startPlayback = () => {
    console.log('=== startPlayback ===');
    console.log('Audio paused?', audio.paused);
    console.log('Audio readyState:', audio.readyState);
    
    // Start playback
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('✓✓✓ Audio playing successfully! ✓✓✓');
        console.log('Audio currentTime:', audio.currentTime);
        console.log('Audio duration:', audio.duration);
        console.log('Audio paused:', audio.paused);
        if (audioStartTime === 0) {
          audioStartTime = millis();
          console.log('Set audioStartTime to:', audioStartTime);
        }
      }).catch(e => {
        console.error('✗✗✗ Play error:', e);
        console.error('Error name:', e.name);
        console.error('Error message:', e.message);
        alert('Cannot play audio: ' + e.message + '\n\nTry clicking on the page first, then drop the file again.');
      });
    }
  };
  
  // Set up audio event listeners - connect and play when ready
  audio.addEventListener("loadstart", () => {
    console.log('loadstart event fired');
  });
  
  audio.addEventListener("loadedmetadata", () => {
    console.log('loadedmetadata event fired, readyState:', audio.readyState);
  });
  
  audio.addEventListener("loadeddata", () => {
    console.log('loadeddata event fired, readyState:', audio.readyState);
  });
  
  audio.addEventListener("canplay", () => {
    console.log('canplay event fired, readyState:', audio.readyState);
    // Don't use once - we might need to reconnect
    if (audio.paused && audio.readyState >= 2 && !preventAutoPlay) {
      console.log('Audio can play, calling connectAndPlay');
      connectAndPlay();
    } else if (preventAutoPlay) {
      console.log('Auto-play prevented by flag');
    }
  });
  
  audio.addEventListener("canplaythrough", () => {
    console.log('canplaythrough event fired, readyState:', audio.readyState);
    if (!preventAutoPlay) {
      console.log('Audio fully loaded, connecting and playing');
      connectAndPlay();
    } else {
      console.log('Auto-play prevented by flag');
    }
  }, { once: true });
  
  audio.addEventListener('play', () => {
    console.log('play event fired - audio is playing!');
    if (audioStartTime === 0) {
      audioStartTime = millis();
      console.log('Set audioStartTime to:', audioStartTime);
    }
  });
  
  audio.addEventListener('playing', () => {
    console.log('playing event fired - audio is actually playing!');
  });
  
  audio.addEventListener('pause', () => {
    console.log('pause event fired');
  });
  
  audio.addEventListener('error', (e) => {
    console.log('Audio error event fired');
    console.log('Audio error object:', audio.error);
    if (audio.error) {
      console.log('Error code:', audio.error.code);
      console.log('Error message:', audio.error.message);
    }
  });
  
  // Fallback: try to start playing after a delay if not already started
  setTimeout(() => {
    console.log('Fallback timeout fired');
    console.log('Audio exists?', !!audio);
    if (audio) {
      console.log('Audio paused?', audio.paused);
      console.log('Audio readyState:', audio.readyState);
      if (audio.paused && audio.readyState >= 2 && !preventAutoPlay) {
        console.log('Fallback: attempting to connect and play');
        connectAndPlay();
      } else if (preventAutoPlay) {
        console.log('Fallback: Auto-play prevented by flag');
      }
    }
  }, 3000);
}

function loadDroppedAudioFile(file) {
  console.log('=== loadDroppedAudioFile START ===');
  console.log('File name:', file.name);
  console.log('File type:', file.type);
  console.log('File size:', file.size);
  
  // Check if the dropped file is an audio file
  const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac', 'audio/m4a'];
  const isAudioFile = audioTypes.includes(file.type) || 
                      /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(file.name);
  
  if (!isAudioFile) {
    alert('Please drop an audio file (MP3, WAV, OGG, AAC, FLAC, or M4A)\n\nFile: ' + file.name + '\nType: ' + file.type);
    return;
  }
  
  // Create object URL from the dropped file
  try {
    const objectURL = URL.createObjectURL(file);
    console.log('Object URL created:', objectURL);
    console.log('Object URL type:', typeof objectURL);
    console.log('Object URL length:', objectURL.length);
    
    // Verify object URL is valid
    if (!objectURL || objectURL === '' || !objectURL.startsWith('blob:')) {
      console.error('ERROR: Invalid object URL created');
      alert('Error: Could not create audio file URL. Please try again.');
      return;
    }
    
    // IMPORTANT: Store the object URL in a variable that won't be garbage collected
    // We'll store it in currentAudioObjectURL inside loadAudioFile, but keep a reference here too
    const blobURL = objectURL; // Keep reference to prevent garbage collection
    
    // Ensure audio context exists
    if (!audioContext) {
      console.log('Creating new AudioContext');
      audioContext = new AudioContext();
    }
    
    console.log('AudioContext state:', audioContext.state);
    
    // Resume audio context (user gesture allows this)
    audioContext.resume().then(() => {
      console.log('AudioContext resumed, state:', audioContext.state);
      // Load the audio file with the object URL
      // Pass the blob URL directly - loadAudioFile will store it
      console.log('Loading audio file with URL:', blobURL);
      loadAudioFile(blobURL);
      currentAudioFile = file.name;
      console.log('File name set to:', currentAudioFile);
    }).catch(e => {
      console.error('Error resuming AudioContext:', e);
      // Try to load anyway
      console.log('Loading audio file despite resume error');
      loadAudioFile(blobURL);
      currentAudioFile = file.name;
    });
    
    // Keep the blob URL alive by storing it (loadAudioFile will also store it, but this ensures it's not GC'd)
    // We'll only revoke it when loading a new file
    if (!currentAudioObjectURL || currentAudioObjectURL !== blobURL) {
      // Revoke old one if exists
      if (currentAudioObjectURL) {
        console.log('Revoking old blob URL before storing new one');
        URL.revokeObjectURL(currentAudioObjectURL);
      }
      currentAudioObjectURL = blobURL;
    }
  } catch(e) {
    console.error('ERROR creating object URL:', e);
    alert('Error loading file: ' + e.message);
  }
}

function dragOver(event) {
  // Prevent default to allow drop
  event.preventDefault();
  event.stopPropagation();
  isDraggingOver = true;
}

function dragLeave(event) {
  // Reset drag state when leaving canvas
  isDraggingOver = false;
}

function drop(event) {
  // Prevent default behavior (open file in browser)
  event.preventDefault();
  event.stopPropagation();
  isDraggingOver = false;
  
  // Get the dropped files
  const files = event.dataTransfer.files;
  
  if (files.length > 0) {
    // Load the first dropped file
    loadDroppedAudioFile(files[0]);
  }
}

function mousePressed() {
  // Allow clicks on links and interactive elements outside the canvas
  // Check if click is on a link or button element
  const clickedElement = document.elementFromPoint(mouseX, mouseY);
  if (clickedElement) {
    // Check if clicked element is a link or inside a link
    const linkElement = clickedElement.closest('a');
    const buttonElement = clickedElement.closest('button');
    if (linkElement || buttonElement || clickedElement.tagName === 'A' || clickedElement.tagName === 'BUTTON') {
      // Allow the click to propagate to the link/button - don't prevent default
      return;
    }
  }
  
  // Click reactivity disabled for canvas - no action on canvas mouse click
  // But don't prevent default to allow links outside canvas to work
  return;
  
  // DISABLED: If at home (not in demo mode), start demo mode on click
  if (false && !demoMode) {
    // Simulate spacebar press to start demo mode
    key = ' ';
    keyCode = 32;
    keyPressed();
    return;
  }
  
  // DISABLED: Toggle play/pause if audio is loaded, otherwise do nothing
  // Audio only starts when a file is dropped
  if (false && audio && audioContext) {
    console.log('Mouse clicked - toggling audio');
    console.log('Audio paused?', audio.paused);
    console.log('Audio readyState:', audio.readyState);
    console.log('Audio src:', audio.src);
    console.log('AudioContext state:', audioContext.state);
    
    // Check if audio has a valid source
    if (!audio.src || audio.src === '' || audio.src === window.location.href) {
      console.error('Audio has no valid source!');
      alert('No audio file loaded. Please drop an audio file first.');
      return;
    }
    
    if (audio.paused) {
      // Check if audio is ready to play
      if (audio.readyState < 2) {
        console.log('Audio not ready yet, waiting for load...');
        audio.addEventListener('canplay', () => {
          console.log('Audio ready, attempting to play');
          tryPlayAudio();
        }, { once: true });
        return;
      }
      
      // Resume context and play
      audioContext.resume().then(() => {
        console.log('Context resumed, attempting to play');
        tryPlayAudio();
      }).catch(e => {
        console.error('Error resuming context:', e);
      });
  } else {
    audio.pause();
      console.log('Audio paused');
    }
  } else if (audio && !audioContext) {
    // Audio exists but context doesn't - create it
    console.log('Creating audio context on click');
    audioContext = new AudioContext();
    mousePressed(); // Try again
  }
  
  function tryPlayAudio() {
    // If not connected yet, connect now
    if (!audioSource && audio.readyState >= 2) {
      console.log('Connecting audio source on click');
      try {
        if (!analyserNode) {
          analyserNode = audioContext.createAnalyser();
          analyserNode.fftSize = 2048 * 4;
          analyserNode.minDecibels = -90;
          analyserNode.maxDecibels = -20;
          analyserNode.smoothingTimeConstant = 0.3;
          frequencyData = new Float32Array(analyserNode.frequencyBinCount);
          smoothedSignals = [];
          peakSignals = [];
        }
        
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(analyserNode);
        analyserNode.connect(audioContext.destination);
        console.log('Audio connected on click');
      } catch(e) {
        console.error('Error connecting on click:', e);
        alert('Error connecting audio: ' + e.message);
        return;
      }
    }
    
    // Verify audio has a source before playing
    if (!audio.src || audio.src === '' || audio.src === window.location.href) {
      console.error('Cannot play: Audio has no valid source');
      alert('Audio file not loaded properly. Please drop the file again.');
      return;
    }
    
    audio.play().then(() => {
      console.log('Audio playing after click!');
      if (audioStartTime === 0) {
        audioStartTime = millis();
      }
    }).catch(e => {
      console.error('Play error on click:', e);
      console.error('Error name:', e.name);
      console.error('Error message:', e.message);
      alert('Cannot play audio: ' + e.message + '\n\nPlease try dropping the file again.');
    });
  }
}

// Function to return to home state (called by home button or spacebar)
function returnToHome() {
  console.log('Returning to home from demo mode');
  demoMode = false;
  
  // Show credits footer when returning to home
  const footer = document.getElementById('credits-footer');
  if (footer) {
    footer.style.display = 'block';
  }
  
  // Hide home button when returning to home
  const homeButton = document.getElementById('home-button');
  if (homeButton) {
    homeButton.classList.add('home-button-hidden');
    homeButton.classList.remove('home-button-visible');
  }
  
  // Apply home state (geometries_only - first state in allAppStates)
  const homeState = allAppStates[0]; // 'geometries_only'
  showCars = homeState.cars;
  showPeople = homeState.people;
  showParachutists = homeState.parachutists;
  showHelicopters = homeState.helicopters;
  showTracks = homeState.tracks;
  showTrainCars = homeState.trainCars;
  showBuildingsStatic = homeState.buildingsStatic;
  showRenaissance = homeState.renaissance;
  showBuildingsMoving = homeState.buildingsMoving;
  showDrones = homeState.drones;
  showPlanes = homeState.planes;
  showAmbulances = homeState.ambulances;
  showRockets = homeState.rockets;
  showRobots = homeState.robots;
  showLasers = homeState.lasers;
  showSmoke = homeState.smoke;
  showICECars = homeState.iceCars;
  showBiplane = homeState.biplane;
  showCentralCircles = true; // Home state shows central circles (geometries)
  
  // Fade out all elements except central circles
  carsFadeTarget = 0.0;
  peopleFadeTarget = 0.0;
  parachutistsFadeTarget = 0.0;
  helicoptersFadeTarget = 0.0;
  tracksFadeTarget = 0.0;
  trainCarsFadeTarget = 0.0;
  buildingsStaticFadeTarget = 0.0;
  renaissanceFadeTarget = 0.0;
  buildingsMovingFadeTarget = 0.0;
  dronesFadeTarget = 0.0;
  planesFadeTarget = 0.0;
  ambulancesFadeTarget = 0.0;
  robotsFadeTarget = 0.0;
  lasersFadeTarget = 0.0;
  smokeFadeTarget = 0.0;
  iceCarsFadeTarget = 0.0;
  biplaneFadeTarget = 0.0;
  centralCirclesFadeTarget = 1.0; // Ensure central circles are visible at home
  
  // Reset background to home state hue
  window.selectedBackgroundHue = homeState.backgroundHue;
  
  // Reset demo state variables completely
  globalStateIndex = 0;
  globalAccumulatedStates = 1;
  demoComplexity = 2;
  demoRandomMode = false;
  globalLastStateChangeTime = 0; // Reset timing
  demoStateStartTime = 0; // Reset demo state timing
  demoStateDuration = 0; // Reset duration
  lastGlobalBeatTime = 0; // Reset beat timing
  
  // Stop music completely (not pause) and reset when returning to home
  preventAutoPlay = true; // Set flag to prevent auto-play event listeners
  audioLoadedWaiting = false; // Reset waiting flag
  
  // Fully stop and disconnect audio source first
  if (audioSource) {
    try {
      audioSource.stop();
      audioSource.disconnect();
      audioSource = null;
      console.log('Audio source stopped and disconnected');
    } catch(e) {
      console.error('Error stopping audio source:', e);
    }
  }
  
  // Stop audio completely - remove element entirely
  if (audio) {
    try {
      // Stop playback
      audio.pause();
      audio.currentTime = 0;
      
      // Remove audio element from DOM completely
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
      
      // Clear audio reference
      audio = null;
      currentAudioFile = null;
      
      console.log('Music stopped completely - audio element removed');
    } catch(e) {
      console.error('Error stopping audio:', e);
      // Fallback: stop and clear
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio = null;
      }
    }
  }
  
  console.log('Returned to HOME state - demoMode:', demoMode, 'showCentralCircles:', showCentralCircles);
}

function keyPressed() {
  // Spacebar behavior:
  // - When at HOME (demoMode = false): Press spacebar → Starts demo mode and plays audio immediately
  // - When in DEMO (demoMode = true): Press spacebar → Stops music, returns to HOME
  if (key === ' ' || keyCode === 32) {
    console.log('Spacebar pressed, demoMode:', demoMode);
    
    if (!demoMode) {
      // ACTIVATE demo mode - start from home
      console.log('=== STARTING DEMO MODE ===');
      demoMode = true;
      console.log('demoMode set to:', demoMode);
      preventAutoPlay = false; // Allow auto-play - play immediately
      audioLoadedWaiting = false; // Reset waiting flag
      
      // Hide credits footer when starting demo
      const footer = document.getElementById('credits-footer');
      if (footer) {
        footer.style.display = 'none';
      }
      
      // Show home button when starting demo
      const homeButton = document.getElementById('home-button');
      if (homeButton) {
        homeButton.classList.remove('home-button-hidden');
        homeButton.classList.add('home-button-visible');
      }
      
      // Reset demo state when entering demo mode - start with 2 states
      demoComplexity = 2; // Start with 2 states
      demoRandomMode = false; // Start in progressive mode
      globalLastStateChangeTime = millis();
      lastGlobalBeatTime = millis();
      demoStateStartTime = millis(); // Initialize state timing
      demoStateDuration = random(5000, 12000); // Random duration between 5-12 seconds
      demoStateDuration = constrain(demoStateDuration, 5000, 12000); // Ensure duration is within bounds
      // Apply first state immediately (1 state - start with first non-geometries state)
      const firstState = allAppStates[1]; // 'cars' - first element state
      showCars = firstState.cars;
      showPeople = firstState.people;
      showParachutists = firstState.parachutists;
      showHelicopters = firstState.helicopters;
      showTracks = firstState.tracks;
      showTrainCars = firstState.trainCars;
      showBuildingsStatic = firstState.buildingsStatic;
      showRenaissance = firstState.renaissance;
      showBuildingsMoving = firstState.buildingsMoving;
      showDrones = firstState.drones;
      showPlanes = firstState.planes;
      showAmbulances = firstState.ambulances;
      showRockets = firstState.rockets;
      showRobots = firstState.robots;
      showLasers = firstState.lasers;
      showSmoke = firstState.smoke;
      showICECars = firstState.iceCars;
      carsFadeTarget = showCars ? 1.0 : 0.0;
      peopleFadeTarget = showPeople ? 1.0 : 0.0;
      parachutistsFadeTarget = showParachutists ? 1.0 : 0.0;
      helicoptersFadeTarget = showHelicopters ? 1.0 : 0.0;
      tracksFadeTarget = showTracks ? 1.0 : 0.0;
      trainCarsFadeTarget = showTrainCars ? 1.0 : 0.0;
      buildingsStaticFadeTarget = showBuildingsStatic ? 1.0 : 0.0;
      renaissanceFadeTarget = showRenaissance ? 1.0 : 0.0;
      buildingsMovingFadeTarget = showBuildingsMoving ? 1.0 : 0.0;
      dronesFadeTarget = showDrones ? 1.0 : 0.0;
      planesFadeTarget = showPlanes ? 1.0 : 0.0;
      ambulancesFadeTarget = showAmbulances ? 1.0 : 0.0;
      robotsFadeTarget = showRobots ? 1.0 : 0.0;
      lasersFadeTarget = showLasers ? 1.0 : 0.0;
      smokeFadeTarget = showSmoke ? 1.0 : 0.0;
      iceCarsFadeTarget = showICECars ? 1.0 : 0.0;
      biplaneFadeTarget = showBiplane ? 1.0 : 0.0;
      window.selectedBackgroundHue = firstState.backgroundHue;
      
      // Initialize elements if needed (with error handling)
      try {
        if (showCars && vintageCars.length === 0) {
          initializeVintageCars();
        }
        if (showICECars && iceCars.length === 0) {
          spawnICECar(); // Spawn initial ICE car
        }
        if (showPeople && people.length === 0) {
          initializePeople();
        }
        if (showParachutists && parachutists.length === 0) {
          initializeParachutists();
        }
        if (showHelicopters && (!helicopters || helicopters.length === 0)) {
          helicopters = [];
          heliLastX = null;
          lastHelicopterFrame = -1;
          const canvasWidth = typeof width !== 'undefined' ? width : (typeof windowWidth !== 'undefined' ? windowWidth : 800);
          const canvasHeight = typeof height !== 'undefined' ? height : (typeof windowHeight !== 'undefined' ? windowHeight : 600);
          // Random X position, fixed height
          const randomX = random(canvasWidth * 0.2, canvasWidth * 0.8);
          helicopters.push({
            x: randomX,
            y: canvasHeight * 0.25,
            speed: 0.5,
            moveDirection: 0,
            turnDistance: 600, // Increased for broader flight trajectory
            distanceTraveled: 0,
            hue: 200,
            scale: 6.0,
            propPhase: 0
          });
        }
        if (showRobots && robots.length === 0) {
          initializeRobots();
        }
        if (showDrones && drones.length === 0) {
          initializeDrones();
        }
        if (showBuildingsStatic && (!buildings || buildings.length === 0)) {
          initializeBuildings();
        }
      } catch(e) {
        console.error('Error initializing elements:', e);
      }
      
      // Handle audio loading/playing
      // Ensure audioContext exists before proceeding
      if (!audioContext) {
        try {
          audioContext = new AudioContext();
        } catch(e) {
          console.error('Error creating audio context:', e);
          alert('Error initializing audio. Please try again.');
          return;
        }
      }
      
      // Resume audio context if suspended (required for autoplay policies)
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(e => {
          console.error('Error resuming audio context:', e);
        });
      }
      
      const isCasaPlaying = audio && (currentAudioFile === 'casa_detroit_2025.mp3' || (audio.src && audio.src.includes('casa_detroit_2025.mp3')));
      
      if (isCasaPlaying && audio) {
        // If casa_detroit_2025.mp3 is already loaded, restart from beginning and play
        try {
          audio.currentTime = 0; // Reset to beginning
          // Resume audio context if suspended
          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(e => {
              console.error('Error resuming context:', e);
            });
          }
          // Play audio immediately
          audio.play().catch(e => {
            console.error('Error playing audio:', e);
          });
        } catch(e) {
          console.error('Error with existing audio:', e);
          // Fall through to load new file
          loadAudioFile('casa_detroit_2025.mp3');
          currentAudioFile = 'casa_detroit_2025.mp3';
        }
      } else {
        // Load and play casa_detroit_2025.mp3 immediately
        console.log('Attempting to load audio file...');
        try {
          // Try casa_detroit_2025.mp3 first, fallback to casa.mp3
          const audioFile = 'casa_detroit_2025.mp3';
          console.log('Loading audio file:', audioFile);
          loadAudioFile(audioFile);
          currentAudioFile = audioFile;
          console.log('Audio file loading initiated');
        } catch(e) {
          console.error('Error loading audio file:', e);
          // Try fallback file
          try {
            console.log('Trying fallback file: casa.mp3');
            loadAudioFile('casa.mp3');
            currentAudioFile = 'casa.mp3';
            console.log('Fallback audio file loading initiated');
          } catch(e2) {
            console.error('Error loading fallback file:', e2);
            console.log('Demo mode started but audio failed to load. Demo will continue without audio.');
            // Don't block demo mode - let it continue even without audio
          }
        }
      }
      console.log('Demo mode setup complete. showCars:', showCars, 'carsFadeTarget:', carsFadeTarget);
    } else {
      // DEACTIVATE demo mode - return to HOME state (geometries_only)
      // This happens when spacebar is pressed while audio is playing
      returnToHome();
    }
    return false; // Prevent default spacebar behavior (scrolling)
  }
  
  // Keyboard controls mapped to 1234567890 and qwerty
  // 1: Cars, 2: People, 3: Parachutists, 4: Helicopters, 5: Tracks, 6: Train cars
  // 7: Buildings static, 8: Renaissance, 9: Buildings moving, 0: Drones
  // q: Planes, w: Ambulances, e: Rockets, r: Robots, t: Lasers, y: Smoke/Explosions
  
  if (key === '1') {
    // Toggle cars with fade
    showCars = !showCars;
    carsFadeTarget = showCars ? 1.0 : 0.0;
    if (showCars && vintageCars.length === 0) {
      spawnVintageCar();
    }
  } else if (key === '2') {
    // Toggle people (regular, no parachutes) with fade
    showPeople = !showPeople;
    peopleFadeTarget = showPeople ? 1.0 : 0.0;
    if (showPeople && people.length === 0) {
      spawnPerson(false);
    }
  } else if (key === '3') {
    // Toggle parachutists with fade
    showParachutists = !showParachutists;
    parachutistsFadeTarget = showParachutists ? 1.0 : 0.0;
    if (showParachutists) {
      // Spawn multiple parachutists immediately when toggled on (MORE ABUNDANT)
      if (parachutists.length === 0) {
        for (let p = 0; p < 3; p++) {
          spawnPerson(true);
        }
        lastParachutistSpawnTime = millis();
        maxParachutists = 3; // Start with at least 3
      }
    } else {
      maxParachutists = 1; // Reset max when toggled off
      lastParachutistSpawnTime = 0;
    }
  } else if (key === '4') {
    // Toggle helicopters with fade
    showHelicopters = !showHelicopters;
    helicoptersFadeTarget = showHelicopters ? 1.0 : 0.0;
    if (showHelicopters) {
      // Spawn ONE helicopter - clean and simple
      helicopters = []; // Clear first
      heliLastX = null; // Reset position tracking
      lastHelicopterFrame = -1; // Reset frame tracking
      // Random X position, fixed height
      const randomX = random(width * 0.2, width * 0.8);
      helicopters.push({
        x: randomX,
        y: height * 0.25,
        speed: 0.5,
        moveDirection: 0, // 0=right, 2=left
        turnDistance: 600, // Increased for broader flight trajectory
        distanceTraveled: 0,
        hue: 200,
        scale: 6.0,
        propPhase: 0
      });
    }
  } else if (key === '5') {
    // Toggle helicopters with fade
    showHelicopters = !showHelicopters;
    helicoptersFadeTarget = showHelicopters ? 1.0 : 0.0;
    if (showHelicopters) {
      // Spawn ONE helicopter - clean and simple
      helicopters = []; // Clear first
      heliLastX = null; // Reset position tracking
      lastHelicopterFrame = -1; // Reset frame tracking
      helicopters.push({
        x: width * 0.3,
        y: height * 0.25,
        speed: 0.5,
        moveDirection: 0, // 0=right, 2=left
        turnDistance: 600, // Increased for broader flight trajectory
        distanceTraveled: 0,
        hue: 200,
        scale: 6.0, // Double the size
        propPhase: 0
      });
      // Ensure only one
      if (helicopters.length > 1) {
        helicopters = [helicopters[0]];
      }
    }
  } else if (key === '5') {
    // Toggle tracks (monorail tracks only) with fade
    showTracks = !showTracks;
    tracksFadeTarget = showTracks ? 1.0 : 0.0;
    if (showTracks && (!monorailCars || monorailCars.length === 0)) {
      initializeMonorail();
    }
  } else if (key === '6') {
    // Toggle train cars (monorail cars only) with fade
    showTrainCars = !showTrainCars;
    trainCarsFadeTarget = showTrainCars ? 1.0 : 0.0;
    if (showTrainCars && (!monorailCars || monorailCars.length === 0)) {
      initializeMonorail();
    }
  } else if (key === '7') {
    // Toggle buildings static with fade - works independently from moving buildings
    showBuildingsStatic = !showBuildingsStatic;
    buildingsStaticFadeTarget = showBuildingsStatic ? 1.0 : 0.0;
    if (showBuildingsStatic && (!buildings || buildings.length === 0)) {
      initializeBuildings();
    }
  } else if (key === '8') {
    // Toggle Renaissance Center with fade
    showRenaissance = !showRenaissance;
    renaissanceFadeTarget = showRenaissance ? 1.0 : 0.0;
    if (!showRenaissance && renaissanceCenter) {
      renaissanceCenter.opacity = 0;
      renaissanceCenter.targetOpacity = 0;
    } else if (showRenaissance) {
      if (!renaissanceCenter) {
        initializeRenaissanceCenter();
      } else {
        renaissanceCenter.targetOpacity = 1;
      }
    }
  } else if (key === '9') {
    // Toggle buildings moving with fade
    showBuildingsMoving = !showBuildingsMoving;
    buildingsMovingFadeTarget = showBuildingsMoving ? 1.0 : 0.0;
    if (!showBuildingsMoving) {
      if (buildings && buildings.length > 0) {
        for (let i = 0; i < buildings.length; i++) {
          if (buildings[i].travelSpeed && buildings[i].travelSpeed > 0) {
            buildings[i].targetOpacity = 0;
            buildings[i].targetHeight = 0;
          }
        }
      }
    } else {
      if (!buildings || buildings.length === 0) {
        initializeBuildings();
      }
      if (buildings && buildings.length > 0) {
        for (let i = 0; i < buildings.length; i++) {
          if (buildings[i].travelSpeed && buildings[i].travelSpeed > 0) {
            buildings[i].targetOpacity = 1;
            buildings[i].targetHeight = buildings[i].targetHeight || random(100, 300) * 1.3; // 30% larger
            buildings[i].travelPhase = (buildings[i].travelPhase || 0) + random(0, TWO_PI);
          }
        }
      }
    }
  } else if (key === '0') {
    // Toggle drones with fade - same pattern as helicopter
    showDrones = !showDrones;
    dronesFadeTarget = showDrones ? 1.0 : 0.0;
    if (showDrones) {
      // Spawn 4 drones at less symmetrical positions
      drones = []; // Clear first
      droneLastX = null; // Reset position tracking
      droneLastY = null; // Reset Y position tracking
      lastDroneFrame = -1; // Reset frame tracking
      
      const positions = [
        {x: width * 0.25 + random(-50, 50), y: height * 0.15 + random(-20, 20)}, // Top left area - randomized
        {x: width * 0.75 + random(-50, 50), y: height * 0.2 + random(-20, 20)}, // Top right area - randomized
        {x: width * 0.2 + random(-50, 50), y: height * 0.35 + random(-20, 20)}, // Mid left area - randomized
        {x: width * 0.8 + random(-50, 50), y: height * 0.4 + random(-20, 20)}  // Mid right area - randomized
      ];
      
      for (let i = 0; i < 4; i++) {
        drones.push({
          x: positions[i].x,
          y: positions[i].y,
          speed: 0.4, // Slow speed
          moveDirection: i % 4, // Different starting directions
          turnDistance: 300, // Distance before turning
          distanceTraveled: 0, // Track distance on current path
          hue: 220 + i * 30, // Different hues for each drone
          scale: 4.5, // Large and visible
          opacity: 1,
          rotation: 0,
          propPhase: 0,
          laserCooldown: 0
        });
      }
    }
  } else if (key === 'q' || key === 'Q') {
    // Toggle planes with fade
    showPlanes = !showPlanes;
    planesFadeTarget = showPlanes ? 1.0 : 0.0;
    if (showPlanes) {
      // Spawn 2-3 planes immediately when toggled on - VERY VISIBLE
      if (!planes) planes = [];
      const numPlanes = floor(random(2, 4));
      for (let i = 0; i < numPlanes; i++) {
        const direction = random() > 0.5 ? 1 : -1; // 1 = right, -1 = left
        planes.push({
          x: direction > 0 ? -100 : width + 100, // Start closer to screen
          y: random(height * 0.25, height * 0.45), // More visible middle area
          speed: random(0.0075, 0.015), // 50% SLOWER AGAIN - half the current speed
          direction: direction,
          hue: random(200, 240), // Brighter blue range
          scale: random(2.25, 3.0), // 75% OF ACTUAL SIZE
          propPhase: random(0, TWO_PI),
          wingTilt: 0
        });
      }
    }
  } else if (key === 'w' || key === 'W') {
    // Toggle ambulances with fade
    showAmbulances = !showAmbulances;
    ambulancesFadeTarget = showAmbulances ? 1.0 : 0.0;
    if (showAmbulances && (!ambulances || ambulances.length === 0)) {
      if (!ambulances) ambulances = [];
      ambulances.push({
        x: random() > 0.5 ? -60 : width + 60,
        y: height * 0.85,
        speed: random(0.8, 1.5), // SLOW - consistent with other qwerty elements
        direction: random() > 0.5 ? 1 : -1,
        hue: random(0, 30),
        scale: random(1.4, 1.9), // 70% OF SIZE
        opacity: 1,
        lightPhase: random(0, TWO_PI),
        lifetime: 0,
        maxLifetime: random(10000, 18000)
      });
    }
  } else if (key === 'e' || key === 'E') {
    // Toggle central circles (sun/moon) visibility with fade
    showCentralCircles = !showCentralCircles;
    // Set fade target: fade out if hiding, fade in if showing
    centralCirclesFadeTarget = showCentralCircles ? 1.0 : 0.0;
  } else if (key === 'r' || key === 'R') {
    // Toggle robots with fade
    showRobots = !showRobots;
    robotsFadeTarget = showRobots ? 1.0 : 0.0;
    if (showRobots) {
      if (!robots) robots = [];
      // Clear existing robots and spawn THREE robots with names
      robots = [];
      
      // Define robot visual properties (hue, scale) - separate from names
      const robotProperties = [
        {
          hue: 180, // Blue-green
          scale: 2.5, // Smaller size
        },
        {
          hue: 280, // Purple
          scale: 3.0, // Smaller size
        },
        {
          hue: 20, // Orange-red
          scale: 2.2, // Smaller size
        }
      ];
      
      // Define names separately - will be randomly assigned
      const robotNames = ["Juan", "Derrik", "Kevin"];
      
      // Shuffle names randomly so they switch between robots
      for (let i = robotNames.length - 1; i > 0; i--) {
        const j = Math.floor(random(i + 1));
        [robotNames[i], robotNames[j]] = [robotNames[j], robotNames[i]];
      }
      
      // Shuffle robot properties order randomly
      for (let i = robotProperties.length - 1; i > 0; i--) {
        const j = Math.floor(random(i + 1));
        [robotProperties[i], robotProperties[j]] = [robotProperties[j], robotProperties[i]];
      }
      
      // Generate random positions for each robot (different placements) - NO OVERLAPPING
      const positions = [];
      const minDistance = 120; // Minimum distance between robot centers (accounts for robot size + padding)
      
      for (let i = 0; i < robotProperties.length; i++) {
        let attempts = 0;
        let validPosition = false;
        let xPos, yPos;
        
        // Keep trying until we find a position that doesn't overlap
        while (!validPosition && attempts < 100) {
          // Random x positions across screen (with margins)
          xPos = random(width * 0.15, width * 0.85);
          // Position robots at ground level (same as cars)
          const groundLevel = height * 0.85;
          const maxRobotBottomOffset = 35 * 3.0; // Maximum extension below robot center (max scale)
          yPos = groundLevel - maxRobotBottomOffset; // Robot bottom at ground level
          
          // Check if this position is far enough from all existing positions
          validPosition = true;
          for (let j = 0; j < positions.length; j++) {
            const existingPos = positions[j];
            const distance = dist(xPos, yPos, existingPos.x, existingPos.y);
            if (distance < minDistance) {
              validPosition = false;
              break;
            }
          }
          
          attempts++;
        }
        
        // If we couldn't find a non-overlapping position after many attempts, use a grid-based fallback
        if (!validPosition) {
          // Fallback: use evenly spaced positions at ground level
          const gridCols = 3;
          const colIndex = i % gridCols;
          xPos = width * (0.2 + colIndex * 0.3);
          // Position robots at ground level (same as cars)
          const groundLevel = height * 0.85;
          const maxRobotBottomOffset = 35 * 3.0; // Maximum extension below robot center (max scale)
          yPos = groundLevel - maxRobotBottomOffset; // Robot bottom at ground level
        }
        
        positions.push({ x: xPos, y: yPos });
      }
      
      // Create robots with randomly assigned names and shuffled properties
      for (let i = 0; i < robotProperties.length; i++) {
        const props = robotProperties[i];
        const pos = positions[i];
        robots.push({
          name: robotNames[i], // Randomly assigned name
          x: pos.x,
          y: pos.y,
          baseY: pos.y, // Base position
          hue: props.hue,
          scale: props.scale, // Smaller sizes
          opacity: 1, // Start fully visible - no fade
          targetOpacity: 1, // Always stay at full opacity
          armAngle1: random(0, TWO_PI),
          armAngle2: random(0, TWO_PI),
          armAngle3: random(0, TWO_PI),
          armSpeed1: random(0.003, 0.008), // Much slower base speed
          armSpeed2: random(0.004, 0.01), // Much slower base speed
          armSpeed3: random(0.005, 0.012), // Much slower base speed
          phase: random(0, TWO_PI),
          lifetime: 0,
          maxLifetime: Infinity // Never fade out - stays forever
        });
      }
    }
  } else if (key === 't' || key === 'T') {
    // Toggle lasers with fade
    showLasers = !showLasers;
    lasersFadeTarget = showLasers ? 1.0 : 0.0;
    if (showLasers) {
      // Spawn initial lasers immediately when toggled on
      if (!lasers) lasers = [];
      // Create 5-8 lasers immediately for visibility - BRIGHT COLORS
      for (let i = 0; i < random(5, 9); i++) {
        const edge = Math.floor(random(4));
        let x1, y1;
        if (edge === 0) { x1 = random(0, width); y1 = 0; }
        else if (edge === 1) { x1 = width; y1 = random(0, height); }
        else if (edge === 2) { x1 = random(0, width); y1 = height; }
        else { x1 = 0; y1 = random(0, height); }
        const x2 = random(width * 0.1, width * 0.9);
        const y2 = random(height * 0.1, height * 0.9);
        // Use bright colors: cyan (180), magenta (300), yellow (60), red (0), green (120), blue (240)
        const brightHues = [0, 60, 120, 180, 240, 300];
        const hue = brightHues[Math.floor(random(brightHues.length))];
        createLaser(x1, y1, x2, y2, hue);
      }
      console.log('Lasers enabled! Created', lasers.length, 'lasers');
      window.lastLaserSpawnTime = millis();
    } else {
      lasers = [];
    }
  } else if (key === 'y' || key === 'Y') {
    // Toggle smoke and explosions with fade
    showSmoke = !showSmoke;
    showExplosions = !showExplosions;
    smokeFadeTarget = showSmoke ? 1.0 : 0.0;
    explosionsFadeTarget = showExplosions ? 1.0 : 0.0;
    if (!showSmoke) {
      smokeParticles = [];
    }
    if (!showExplosions) {
      carExplosions = [];
      buildingExplosions = [];
    }
  } else if (key === 'g' || key === 'G') {
    // Toggle biplane with banner
    showBiplane = !showBiplane;
    biplaneFadeTarget = showBiplane ? 1.0 : 0.0;
    if (showBiplane && !biplane) {
      initializeBiplane();
    } else if (!showBiplane) {
      biplane = null;
    }
  } else if (key === 'b' || key === 'B') {
    // Toggle smoke with fade
    showSmoke = !showSmoke;
    smokeFadeTarget = showSmoke ? 1.0 : 0.0;
    if (!showSmoke) {
      smokeParticles = [];
    }
    
    // Change background color - cycle through different hues
    if (!window.backgroundHueIndex) window.backgroundHueIndex = 0;
    const backgroundHues = [200, 240, 180, 120, 60, 0, 300, 280]; // Different color options
    window.backgroundHueIndex = (window.backgroundHueIndex + 1) % backgroundHues.length;
    window.selectedBackgroundHue = backgroundHues[window.backgroundHueIndex];
  } else if (key === 'a' || key === 'A') {
    // Toggle all states on/off
    const allElementsState = allAppStates.find(state => state.name === 'all_elements');
    if (allElementsState) {
      // Check if all states are currently on (check a few key states)
      const allOn = showCars && showPeople && showRobots && showDrones && showPlanes && 
                    showAmbulances && showHelicopters && showParachutists && showLasers && 
                    showSmoke && showCentralCircles;
      
      if (allOn) {
        // Turn all states off
        showCars = false;
        showPeople = false;
        showParachutists = false;
        showHelicopters = false;
        showTracks = false;
        showTrainCars = false;
        showBuildingsStatic = false;
        showRenaissance = false;
        showBuildingsMoving = false;
        showDrones = false;
        showPlanes = false;
        showAmbulances = false;
        showRockets = false;
        showRobots = false;
        showLasers = false;
        showSmoke = false;
        showCentralCircles = false;
      } else {
        // Turn all states on
        showCars = allElementsState.cars;
        showPeople = allElementsState.people;
        showParachutists = allElementsState.parachutists;
        showHelicopters = allElementsState.helicopters;
        showTracks = allElementsState.tracks;
        showTrainCars = allElementsState.trainCars;
        showBuildingsStatic = allElementsState.buildingsStatic;
        showRenaissance = allElementsState.renaissance;
        showBuildingsMoving = allElementsState.buildingsMoving;
        showDrones = allElementsState.drones;
        showPlanes = allElementsState.planes;
        showAmbulances = allElementsState.ambulances;
        showRockets = allElementsState.rockets;
        showRobots = allElementsState.robots;
        showLasers = allElementsState.lasers;
        showSmoke = allElementsState.smoke;
        showICECars = allElementsState.iceCars;
        showBiplane = allElementsState.biplane;
        showCentralCircles = true; // Also turn on central circles
        
        // Initialize elements if needed
        if (showCars && vintageCars.length === 0) {
          initializeVintageCars();
        }
        if (showICECars && iceCars.length === 0) {
          spawnICECar(); // Spawn initial ICE car
        }
        if (showPeople && people.length === 0) {
          initializePeople();
        }
        if (showParachutists && parachutists.length === 0) {
          initializeParachutists();
        }
        if (showRobots && robots.length === 0) {
          initializeRobots();
        }
        if (showDrones && drones.length === 0) {
          initializeDrones();
        }
      }
      
      // Set fade targets
      carsFadeTarget = showCars ? 1.0 : 0.0;
      peopleFadeTarget = showPeople ? 1.0 : 0.0;
      parachutistsFadeTarget = showParachutists ? 1.0 : 0.0;
      helicoptersFadeTarget = showHelicopters ? 1.0 : 0.0;
      tracksFadeTarget = showTracks ? 1.0 : 0.0;
      trainCarsFadeTarget = showTrainCars ? 1.0 : 0.0;
      buildingsStaticFadeTarget = showBuildingsStatic ? 1.0 : 0.0;
      renaissanceFadeTarget = showRenaissance ? 1.0 : 0.0;
      buildingsMovingFadeTarget = showBuildingsMoving ? 1.0 : 0.0;
      dronesFadeTarget = showDrones ? 1.0 : 0.0;
      planesFadeTarget = showPlanes ? 1.0 : 0.0;
      ambulancesFadeTarget = showAmbulances ? 1.0 : 0.0;
      robotsFadeTarget = showRobots ? 1.0 : 0.0;
      lasersFadeTarget = showLasers ? 1.0 : 0.0;
      smokeFadeTarget = showSmoke ? 1.0 : 0.0;
      iceCarsFadeTarget = showICECars ? 1.0 : 0.0;
      biplaneFadeTarget = showBiplane ? 1.0 : 0.0;
      centralCirclesFadeTarget = showCentralCircles ? 1.0 : 0.0;
      
      if (!allOn) {
        window.selectedBackgroundHue = allElementsState.backgroundHue;
      }
    }
  } else if (key === 'd' || key === 'D') {
    // Toggle demo mode
    demoMode = !demoMode;
    if (demoMode) {
      // Reset demo state when entering demo mode - start with 2 states
      demoComplexity = 2; // Start with 2 states
      demoRandomMode = false; // Start in progressive mode
      globalLastStateChangeTime = millis();
      lastGlobalBeatTime = millis();
      demoStateStartTime = millis(); // Initialize state timing
      demoStateDuration = random(5000, 12000); // Random duration between 5-12 seconds
      demoStateDuration = constrain(demoStateDuration, 5000, 12000); // Ensure duration is within bounds
      // Apply first state immediately (1 state - start with first non-geometries state)
      const firstState = allAppStates[1]; // 'cars' - first element state
      showCars = firstState.cars;
      showPeople = firstState.people;
      showParachutists = firstState.parachutists;
      showHelicopters = firstState.helicopters;
      showTracks = firstState.tracks;
      showTrainCars = firstState.trainCars;
      showBuildingsStatic = firstState.buildingsStatic;
      showRenaissance = firstState.renaissance;
      showBuildingsMoving = firstState.buildingsMoving;
      showDrones = firstState.drones;
      showPlanes = firstState.planes;
      showAmbulances = firstState.ambulances;
      showRockets = firstState.rockets;
      showRobots = firstState.robots;
      showLasers = firstState.lasers;
      showSmoke = firstState.smoke;
      showICECars = firstState.iceCars;
      carsFadeTarget = showCars ? 1.0 : 0.0;
      peopleFadeTarget = showPeople ? 1.0 : 0.0;
      parachutistsFadeTarget = showParachutists ? 1.0 : 0.0;
      helicoptersFadeTarget = showHelicopters ? 1.0 : 0.0;
      tracksFadeTarget = showTracks ? 1.0 : 0.0;
      trainCarsFadeTarget = showTrainCars ? 1.0 : 0.0;
      buildingsStaticFadeTarget = showBuildingsStatic ? 1.0 : 0.0;
      renaissanceFadeTarget = showRenaissance ? 1.0 : 0.0;
      buildingsMovingFadeTarget = showBuildingsMoving ? 1.0 : 0.0;
      dronesFadeTarget = showDrones ? 1.0 : 0.0;
      planesFadeTarget = showPlanes ? 1.0 : 0.0;
      ambulancesFadeTarget = showAmbulances ? 1.0 : 0.0;
      robotsFadeTarget = showRobots ? 1.0 : 0.0;
      lasersFadeTarget = showLasers ? 1.0 : 0.0;
      smokeFadeTarget = showSmoke ? 1.0 : 0.0;
      iceCarsFadeTarget = showICECars ? 1.0 : 0.0;
      biplaneFadeTarget = showBiplane ? 1.0 : 0.0;
      window.selectedBackgroundHue = firstState.backgroundHue;
    } else {
      // Exit demo mode - return to manual mode
      // Reset timing but keep current element states (user can manually control)
      globalLastStateChangeTime = 0; // Reset so demo can restart fresh if re-enabled
      demoStateStartTime = 0;
      demoStateDuration = 0;
      demoRandomMode = false;
    }
  }
  
  // Prevent default browser behavior for all handled keys
  return false;
}

// Convert the frequency in Hz to an index in the array
function frequencyToIndex(frequencyHz, sampleRate, frequencyBinCount) {
  const nyquist = sampleRate / 3;
  const index = Math.round((frequencyHz / nyquist) * frequencyBinCount);
  return Math.min(frequencyBinCount, Math.max(0, index));
}

// Convert an index in a array to a frequency in Hz
function indexToFrequency(index, sampleRate, frequencyBinCount) {
  return (index * sampleRate) / (frequencyBinCount * 2);
}

// Get the normalized audio signal (0..1) between two frequencies
function audioSignal(analyser, frequencies, minHz, maxHz) {
  if (!analyser) return 0;
  const sampleRate = analyser.context.sampleRate;
  const binCount = analyser.frequencyBinCount;
  let start = frequencyToIndex(minHz, sampleRate, binCount);
  const end = frequencyToIndex(maxHz, sampleRate, binCount);
  const count = end - start;
  let sum = 0;
  let peak = -Infinity;
  for (; start < end; start++) {
    const value = frequencies[start];
    sum += value;
    if (value > peak) peak = value;
  }

  const minDb = analyserNode.minDecibels;
  const maxDb = analyserNode.maxDecibels;
  const avgDb = count === 0 || !isFinite(sum) ? minDb : sum / count;
  
  // Use peak for bass frequencies (more reactive), average for others
  const isBassRange = minHz < 250;
  const valueDb = isBassRange ? Math.max(avgDb, peak * 0.8) : avgDb;
  
  let normalized = map(valueDb, minDb, maxDb, 0, 1, true);
  
  // MAJOR boost bass frequencies for more obvious reactivity
  if (isBassRange) {
    normalized = pow(normalized, 0.4); // Less aggressive curve for bass (more sensitive)
    normalized = Math.min(1, normalized * 2.0); // Amplify bass by 100% (was 30%)
  }
  
  return normalized;
}

// Find the frequency band that has the most peak signal
function audioMaxFrequency(analyserNode, frequencies) {
  let maxSignal = -Infinity;
  let maxSignalIndex = 0;
  for (let i = 0; i < frequencies.length; i++) {
    const signal = frequencies[i];
    if (signal > maxSignal) {
      maxSignal = signal;
      maxSignalIndex = i;
    }
  }
  return indexToFrequency(
    maxSignalIndex,
    analyserNode.context.sampleRate,
    analyserNode.frequencyBinCount
  );
}

function damp(a, b, lambda, dt) {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initializeBuildings();
  initializeMonorail();
  initializeVintageCars();
  initializeRenaissanceCenter();
  initializePeople();
}

let lastFrameTime = 0;

function drawHomeDescription() {
  push();
  colorMode(RGB); // Ensure RGB color mode
  textAlign(CENTER, TOP);
  
  // No background overlay - just text so animations remain fully visible
  const padding = 40;
  const maxWidth = min(800, width * 0.9);
  const startY = height * 0.1;
  
  // Title with outline for better visibility without background
  textSize(48);
  textStyle(BOLD);
  // Draw outline for visibility
  fill(0, 0, 0, 200); // Make outline more visible
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (i !== 0 || j !== 0) {
        text("CASA DETROIT 2026", width / 2 + i, startY + 30 + j);
      }
    }
  }
  // Draw main text
  fill(255, 255, 255, 255); // Ensure full opacity
  textSize(48);
  textStyle(BOLD);
  text("CASA DETROIT 2026", width / 2, startY + 30);
  
  // Helper function to draw text with outline - fixed to prevent overlapping
  function drawTextWithOutline(str, x, y, maxW, fontSize, lineH) {
    textSize(fontSize);
    textAlign(CENTER, TOP); // Ensure alignment is set
    const words = str.split(' ');
    const lines = [];
    let line = '';
    
    // First, break text into lines
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const w = textWidth(testLine);
      
      if (w > maxW && i > 0) {
        lines.push(line.trim());
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      lines.push(line.trim());
    }
    
    // Now draw each line with outline - only once per line
    let currentY = y;
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineText = lines[lineIdx];
      // Black outline
      fill(0);
      for (let oi = -2; oi <= 2; oi++) {
        for (let oj = -2; oj <= 2; oj++) {
          if (oi !== 0 || oj !== 0) {
            text(lineText, x + oi, currentY + oj);
          }
        }
      }
      // White text
      fill(255);
      text(lineText, x, currentY);
      currentY += lineH;
    }
    
    return currentY;
  }
  
  // Intro text - direct and simple
  let yPos = startY + 100;
  yPos = drawTextWithOutline(
    "An interactive audio-visual experience celebrating Detroit techno's origins.",
    width / 2, yPos, maxWidth - 20, 22, 30
  );
  
  // Main description - emphasizing innocence and retro aesthetics
  yPos += 30;
  yPos = drawTextWithOutline(
    "Born from innocence and wonder, techno emerged in 1980s Detroit. Young creators discovered new worlds through synthesizers and drum machines, imagining futures with the tools at hand.",
    width / 2, yPos, maxWidth - 20, 18, 24
  );
  
  yPos += 20;
  yPos = drawTextWithOutline(
    "This project channels that same spirit—the playful exploration of early video games, simple 2D dreams, and the pure joy of creating something new, mixed with a present of surveillance.",
    width / 2, yPos, maxWidth - 20, 18, 24
  );
  
  // Cultural inspiration section - simplified
  yPos += 30;
  textSize(20);
  textStyle(BOLD);
  
  // Black outline
  fill(0);
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (i !== 0 || j !== 0) {
        text("Inspired By", width / 2 + i, yPos + j);
      }
    }
  }
  // White text
  fill(255);
  text("Inspired By", width / 2, yPos);
  
  yPos += 35;
  textSize(16);
  textStyle(NORMAL);
  
  // Belleville Three - more direct
  yPos = drawTextWithOutline(
    "The Belleville Three: Juan Atkins, Derrick May, and Kevin Saunderson—three friends who birthed techno with innocence and vision.",
    width / 2, yPos, maxWidth - 20, 16, 22
  );
  
  yPos += 15;
  yPos = drawTextWithOutline(
    "Techno as Resistance & Innocence: Creating new worlds through sound when material conditions seemed limited. A vision of unity through technology.",
    width / 2, yPos, maxWidth - 20, 16, 22
  );
  
  yPos += 15;
  yPos = drawTextWithOutline(
    "Retro Game Aesthetics: Drawing from 1980s arcade culture—simple graphics, simple controls, and the wonder of digital worlds coming to life.",
    width / 2, yPos, maxWidth - 20, 16, 22
  );
  
  yPos += 15;
  yPos = drawTextWithOutline(
    "The sound played is inspired by Jeff Mills' CASA.",
    width / 2, yPos, maxWidth - 20, 16, 22
  );
  
  // Instruction text
  yPos += 30;
  textSize(20);
  textStyle(BOLD);
  
  // Draw outline for instruction
  fill(0);
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (i !== 0 || j !== 0) {
        text("Press SPACEBAR to begin", width / 2 + i, yPos + j);
      }
    }
  }
  fill(255);
  text("Press SPACEBAR to begin", width / 2, yPos);
  
  pop();
}

function draw() {
  // Calculate deltaTime for smooth animation
  const currentTime = millis();
  let deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
  lastFrameTime = currentTime;
  
  // Cursor is now visible for better interaction with UI elements
  
  // MANUAL MODE: App starts in manual mode - only central circles visible
  // State machine only runs when demoMode is active
  
  // DEMO MODE: Random/combined states that progress from simple to complex
  if (demoMode) {
    // Initialize demo mode timing if not set
    if (globalLastStateChangeTime === 0) {
      globalLastStateChangeTime = currentTime;
    }
    // Initialize demo state timing if not set
    if (demoStateStartTime === 0) {
      demoStateStartTime = currentTime;
      demoStateDuration = random(5000, 12000); // Random duration between 5-12 seconds
    }
    
    const timeSinceStateStart = currentTime - demoStateStartTime;
    const minDuration = 5000; // Minimum 5 seconds - states MUST last at least 5 seconds
    const maxDuration = 12000; // Maximum 12 seconds
    
    // Ensure demoStateDuration is strictly within bounds (5-12 seconds)
    demoStateDuration = constrain(demoStateDuration, minDuration, maxDuration);
    
    // Detect beat for demo mode changes (but ONLY after minimum duration has passed)
    let beatDetected = false;
    // States cannot change until minimum duration (5 seconds) has passed
    if (analyserNode && frequencyData && timeSinceStateStart >= minDuration) {
      const currentBass = bassLevel || 0;
      const currentMid = midLevel || 0;
      const currentTreble = trebleLevel || 0;
      const timeSinceLastBeat = currentTime - lastGlobalBeatTime;
      
      // Beat detection: sudden increase in bass/mid/treble
      const bassBeat = currentBass > 0.25 && timeSinceLastBeat > 150;
      const midBeat = currentMid > 0.25 && timeSinceLastBeat > 150;
      const trebleBeat = currentTreble > 0.25 && timeSinceLastBeat > 150;
      beatDetected = bassBeat || midBeat || trebleBeat;
      
      if (beatDetected) {
        lastGlobalBeatTime = currentTime;
      }
    }
    
    // Check if state should change:
    // States MUST last at least 5 seconds (minDuration) and at most 12 seconds (maxDuration)
    // States CANNOT change faster than every 5 seconds
    // 1. Minimum duration (5s) has passed AND (beat detected OR target duration exceeded)
    // 2. Maximum duration (12s) has passed (force change regardless of beat)
    const hasReachedMinDuration = timeSinceStateStart >= minDuration;
    const hasReachedMaxDuration = timeSinceStateStart >= maxDuration;
    // Ensure states last at least 5 seconds - never change faster than minimum duration
    const shouldChange = hasReachedMaxDuration || 
                         (hasReachedMinDuration && (beatDetected || timeSinceStateStart >= demoStateDuration));
    
    // Progressive biplane appearance: fade in gradually during state duration
    // Start appearing after 30% of state duration, fully visible by 50%
    // This ensures the banner is visible and the plane appears progressively
    const stateProgress = timeSinceStateStart / demoStateDuration; // 0 to 1
    const biplaneStartProgress = 0.3; // Start appearing at 30% of state duration
    const biplaneFullProgress = 0.5; // Fully visible by 50% of state duration
    let biplaneProgressiveOpacity = 0.0;
    
    if (showBiplane && stateProgress >= biplaneStartProgress) {
      if (stateProgress >= biplaneFullProgress) {
        biplaneProgressiveOpacity = 1.0; // Fully visible
      } else {
        // Fade in progressively from 30% to 50%
        const fadeProgress = (stateProgress - biplaneStartProgress) / (biplaneFullProgress - biplaneStartProgress);
        biplaneProgressiveOpacity = fadeProgress; // 0 to 1
      }
    }
    
    if (shouldChange) {
      const totalStates = allAppStates.length; // Total number of states (including 'all_elements')
      
      let selectedIndices = [];
      
      const maxStatesAllowed = 6; // Maximum 6 states in progressive mode
      const maxRandomStates = 5; // Maximum 5 states in random mode
      
      if (!demoRandomMode) {
        // PROGRESSIVE MODE: Start with 2 states, progressively accumulate to max 6 states
        // Increase complexity by 1 each state change until reaching max 6 states
        if (demoComplexity < maxStatesAllowed) {
          demoComplexity = max(2, min(demoComplexity + 1, maxStatesAllowed)); // Start at 2, go up to 6
        } else {
          // Reached max states (6) - switch to random mode
          demoRandomMode = true;
        }
        
        // In progressive mode, randomly select exactly demoComplexity number of states (max 6)
        // Use ALL states (including geometries_only, all_elements, and central_circles) for selection
        const allStateIndices = Array.from({length: totalStates}, (_, i) => i); // 0 to totalStates-1
        const numStatesToSelect = min(demoComplexity, maxStatesAllowed); // 2 to 6
        
        // Randomly select exactly numStatesToSelect states
        // Don't include 'all_elements' when starting (demoComplexity < 4) to avoid too many elements
        const allElementsIndex = allAppStates.findIndex(state => state.name === 'all_elements');
        const indicesCopy = [...allStateIndices];
        
        // Only include all_elements if we have complexity >= 4 (to avoid starting with too many elements)
        if (allElementsIndex >= 0 && demoComplexity >= 4 && numStatesToSelect >= 1) {
          selectedIndices.push(allElementsIndex);
          // Remove it from the copy so we don't select it again
          const allElementsPos = indicesCopy.indexOf(allElementsIndex);
          if (allElementsPos >= 0) {
            indicesCopy.splice(allElementsPos, 1);
          }
        } else if (allElementsIndex >= 0) {
          // Remove all_elements from selection pool when starting
          const allElementsPos = indicesCopy.indexOf(allElementsIndex);
          if (allElementsPos >= 0) {
            indicesCopy.splice(allElementsPos, 1);
          }
        }
        
        // Fill remaining slots with random states
        const remainingSlots = numStatesToSelect - selectedIndices.length;
        for (let i = 0; i < remainingSlots && indicesCopy.length > 0; i++) {
          const randomIndex = floor(random(indicesCopy.length));
          selectedIndices.push(indicesCopy[randomIndex]);
          indicesCopy.splice(randomIndex, 1); // Remove to avoid duplicates
        }
      } else {
        // RANDOM MODE: After reaching max states (6), randomly select 1 to max 5 states
        // Include 'all_elements' in demo mode selection
        const allStateIndices = Array.from({length: totalStates}, (_, i) => i); // Include all states
        const availableStates = allStateIndices.length;
        const maxSelectable = min(maxRandomStates, availableStates); // Max 5 states
        const numStatesToCombine = max(1, floor(random(1, maxSelectable + 1))); // Random 1 to max 5
        
        // Safety check: ensure we have enough states
        if (availableStates >= 2 && numStatesToCombine <= availableStates) {
          // Randomly select states to combine
          const indicesCopy = [...allStateIndices];
          for (let i = 0; i < numStatesToCombine && indicesCopy.length > 0; i++) {
            const randomIndex = floor(random(indicesCopy.length));
            selectedIndices.push(indicesCopy[randomIndex]);
            indicesCopy.splice(randomIndex, 1); // Remove to avoid duplicates
          }
        } else {
          // Fallback: use first available state if we can't select randomly
          selectedIndices = allStateIndices.slice(0, min(1, availableStates));
        }
      }
      
      // Combine selected states
      const combinedState = {
        name: 'combined_' + selectedIndices.join('_'),
        cars: false,
        people: false,
        parachutists: false,
        helicopters: false,
        tracks: false,
        trainCars: false,
        buildingsStatic: false,
        renaissance: false,
        buildingsMoving: false,
        drones: false,
        planes: false,
        ambulances: false,
        rockets: false,
        robots: false,
        lasers: false,
        smoke: false,
        iceCars: false,
        biplane: false,
        centralCircles: false,
        backgroundHue: 200
      };
      
      // Combine all selected states (OR logic - if any state has it, enable it)
      let combinedHues = [];
      for (let idx of selectedIndices) {
        const state = allAppStates[idx];
        combinedState.cars = combinedState.cars || state.cars;
        combinedState.people = combinedState.people || state.people;
        combinedState.parachutists = combinedState.parachutists || state.parachutists;
        combinedState.helicopters = combinedState.helicopters || state.helicopters;
        combinedState.tracks = combinedState.tracks || state.tracks;
        combinedState.trainCars = combinedState.trainCars || state.trainCars;
        combinedState.buildingsStatic = combinedState.buildingsStatic || state.buildingsStatic;
        combinedState.renaissance = combinedState.renaissance || state.renaissance;
        combinedState.buildingsMoving = combinedState.buildingsMoving || state.buildingsMoving;
        // Drones, helicopters, planes, and biplane are mutually exclusive
        // Only allow one flying element at a time - prioritize first encountered
        // Special handling for all_elements state: randomly pick one flying element
        if (state.name === 'all_elements') {
          // For all_elements, randomly select one flying element
          const flyingOptions = [];
          if (state.drones) flyingOptions.push('drones');
          if (state.helicopters) flyingOptions.push('helicopters');
          if (state.planes) flyingOptions.push('planes');
          if (state.biplane) flyingOptions.push('biplane');
          
          if (flyingOptions.length > 0 && !combinedState.drones && !combinedState.helicopters && !combinedState.planes && !combinedState.biplane) {
            const selected = flyingOptions[Math.floor(random(flyingOptions.length))];
            combinedState.drones = selected === 'drones';
            combinedState.helicopters = selected === 'helicopters';
            combinedState.planes = selected === 'planes';
            combinedState.biplane = selected === 'biplane';
          }
        } else if (state.drones && !combinedState.helicopters && !combinedState.planes && !combinedState.biplane) {
          combinedState.drones = true;
          combinedState.helicopters = false;
          combinedState.planes = false;
          combinedState.biplane = false;
        } else if (state.helicopters && !combinedState.drones && !combinedState.planes && !combinedState.biplane) {
          combinedState.helicopters = true;
          combinedState.drones = false;
          combinedState.planes = false;
          combinedState.biplane = false;
        } else if (state.planes && !combinedState.drones && !combinedState.helicopters && !combinedState.biplane) {
          combinedState.planes = true;
          combinedState.drones = false;
          combinedState.helicopters = false;
          combinedState.biplane = false;
        } else if (state.biplane && !combinedState.drones && !combinedState.helicopters && !combinedState.planes) {
          combinedState.biplane = true;
          combinedState.drones = false;
          combinedState.helicopters = false;
          combinedState.planes = false;
        }
        // If a flying element is already set, don't override it
        combinedState.ambulances = combinedState.ambulances || state.ambulances;
        combinedState.rockets = combinedState.rockets || state.rockets;
        combinedState.robots = combinedState.robots || state.robots;
        combinedState.lasers = combinedState.lasers || state.lasers;
        combinedState.smoke = combinedState.smoke || state.smoke;
        combinedState.iceCars = combinedState.iceCars || state.iceCars;
        // Note: biplane is handled in the mutual exclusivity logic above, don't override here
        combinedState.centralCircles = combinedState.centralCircles || (state.centralCircles || false);
        combinedHues.push(state.backgroundHue);
      }
      
      // Average background hue from combined states
      if (combinedHues.length > 0) {
        const hueSum = combinedHues.reduce((a, b) => a + b, 0);
        combinedState.backgroundHue = (hueSum / combinedHues.length) % 360;
      }
      
      // Ensure mutual exclusivity: only one flying element at a time
      // Priority: drones > helicopters > planes > biplane
      if (combinedState.drones) {
        showDrones = true;
        showHelicopters = false;
        showPlanes = false;
        showBiplane = false;
      } else if (combinedState.helicopters) {
        showDrones = false;
        showHelicopters = true;
        showPlanes = false;
        showBiplane = false;
      } else if (combinedState.planes) {
        showDrones = false;
        showHelicopters = false;
        showPlanes = true;
        showBiplane = false;
      } else if (combinedState.biplane) {
        showDrones = false;
        showHelicopters = false;
        showPlanes = false;
        showBiplane = true;
      } else {
        // No flying elements
        showDrones = false;
        showHelicopters = false;
        showPlanes = false;
        showBiplane = false;
      }
      
      // Apply combined state
      showCars = combinedState.cars;
      showPeople = combinedState.people;
      showParachutists = combinedState.parachutists;
      showTracks = combinedState.tracks;
      showTrainCars = combinedState.trainCars;
      showBuildingsStatic = combinedState.buildingsStatic;
      showRenaissance = combinedState.renaissance;
      showBuildingsMoving = combinedState.buildingsMoving;
      showAmbulances = combinedState.ambulances;
      showRockets = combinedState.rockets;
      showRobots = combinedState.robots;
      showLasers = combinedState.lasers;
      showSmoke = combinedState.smoke;
      showICECars = combinedState.iceCars;
      showCentralCircles = combinedState.centralCircles;
      carsFadeTarget = showCars ? 1.0 : 0.0;
      peopleFadeTarget = showPeople ? 1.0 : 0.0;
      parachutistsFadeTarget = showParachutists ? 1.0 : 0.0;
      helicoptersFadeTarget = showHelicopters ? 1.0 : 0.0;
      tracksFadeTarget = showTracks ? 1.0 : 0.0;
      trainCarsFadeTarget = showTrainCars ? 1.0 : 0.0;
      buildingsStaticFadeTarget = showBuildingsStatic ? 1.0 : 0.0;
      renaissanceFadeTarget = showRenaissance ? 1.0 : 0.0;
      buildingsMovingFadeTarget = showBuildingsMoving ? 1.0 : 0.0;
      dronesFadeTarget = showDrones ? 1.0 : 0.0;
      planesFadeTarget = showPlanes ? 1.0 : 0.0;
      ambulancesFadeTarget = showAmbulances ? 1.0 : 0.0;
      robotsFadeTarget = showRobots ? 1.0 : 0.0;
      lasersFadeTarget = showLasers ? 1.0 : 0.0;
      smokeFadeTarget = showSmoke ? 1.0 : 0.0;
      iceCarsFadeTarget = showICECars ? 1.0 : 0.0;
      // Progressive biplane appearance: fade in gradually during state duration
      // Calculate progressive opacity for state change
      const stateProgressForChange = timeSinceStateStart / demoStateDuration;
      const biplaneStartProgress = 0.3;
      const biplaneFullProgress = 0.5;
      let biplaneProgressiveOpacityForChange = 0.0;
      
      if (showBiplane && stateProgressForChange >= biplaneStartProgress) {
        if (stateProgressForChange >= biplaneFullProgress) {
          biplaneProgressiveOpacityForChange = 1.0;
        } else {
          const fadeProgress = (stateProgressForChange - biplaneStartProgress) / (biplaneFullProgress - biplaneStartProgress);
          biplaneProgressiveOpacityForChange = fadeProgress;
        }
      }
      biplaneFadeTarget = biplaneProgressiveOpacityForChange;
      centralCirclesFadeTarget = showCentralCircles ? 1.0 : 0.0;
      window.selectedBackgroundHue = combinedState.backgroundHue;
      globalLastStateChangeTime = currentTime;
      
      // Reset demo state timing for next state (5-12 seconds)
      demoStateStartTime = currentTime;
      demoStateDuration = random(5000, 12000); // Random duration between 5-12 seconds (changes on beat)
      // Ensure duration is within bounds
      demoStateDuration = constrain(demoStateDuration, 5000, 12000);
      
      // Initialize elements if needed (demo mode)
      if (showCars && vintageCars.length === 0) {
        initializeVintageCars();
      }
      if (showPeople && people.length === 0) {
        initializePeople();
      }
      if (showParachutists && parachutists.length === 0) {
        initializeParachutists();
      }
      if (showHelicopters && (!helicopters || helicopters.length === 0)) {
        helicopters = [];
        heliLastX = null;
        lastHelicopterFrame = -1;
        // Random X position, fixed height
        const randomX = random(width * 0.2, width * 0.8);
        helicopters.push({
          x: randomX,
          y: height * 0.25,
          speed: 0.5,
          moveDirection: 0,
          turnDistance: 600, // Increased for broader flight trajectory
          distanceTraveled: 0,
          hue: 200,
          scale: 6.0,
          propPhase: 0
        });
      }
      if (showRobots && robots.length === 0) {
        initializeRobots();
      }
      if (showDrones && drones.length === 0) {
        initializeDrones();
      }
      if (showICECars && iceCars.length === 0) {
        spawnICECar(); // Spawn initial ICE car for demo mode
      }
      if (showBiplane && !biplane) {
        initializeBiplane(); // Initialize biplane for demo mode
      }
      if (showBuildingsStatic && (!buildings || buildings.length === 0)) {
        initializeBuildings();
      }
    }
  }
  // MANUAL MODE: When demoMode is false, app stays in manual mode
  // Users can manually toggle elements with keyboard keys
  // Central circles are visible by default
  
  // Update fade opacity for all toggleable elements
  carsOpacity = lerp(carsOpacity, carsFadeTarget, fadeSpeed);
  peopleOpacity = lerp(peopleOpacity, peopleFadeTarget, fadeSpeed);
  parachutistsOpacity = lerp(parachutistsOpacity, parachutistsFadeTarget, fadeSpeed);
  helicoptersOpacity = lerp(helicoptersOpacity, helicoptersFadeTarget, fadeSpeed);
  tracksOpacity = lerp(tracksOpacity, tracksFadeTarget, fadeSpeed);
  trainCarsOpacity = lerp(trainCarsOpacity, trainCarsFadeTarget, fadeSpeed);
  buildingsStaticOpacity = lerp(buildingsStaticOpacity, buildingsStaticFadeTarget, fadeSpeed);
  renaissanceOpacity = lerp(renaissanceOpacity, renaissanceFadeTarget, fadeSpeed);
  buildingsMovingOpacity = lerp(buildingsMovingOpacity, buildingsMovingFadeTarget, fadeSpeed);
  dronesOpacity = lerp(dronesOpacity, dronesFadeTarget, fadeSpeed);
  planesOpacity = lerp(planesOpacity, planesFadeTarget, fadeSpeed);
  ambulancesOpacity = lerp(ambulancesOpacity, ambulancesFadeTarget, fadeSpeed);
  robotsOpacity = lerp(robotsOpacity, robotsFadeTarget, fadeSpeed);
  lasersOpacity = lerp(lasersOpacity, lasersFadeTarget, fadeSpeed);
  smokeOpacity = lerp(smokeOpacity, smokeFadeTarget, fadeSpeed);
  explosionsOpacity = lerp(explosionsOpacity, explosionsFadeTarget, fadeSpeed);
  iceCarsOpacity = lerp(iceCarsOpacity, iceCarsFadeTarget, fadeSpeed);
  // Update biplane fade target continuously for progressive appearance
  if (demoMode && showBiplane) {
    const timeSinceStateStart = millis() - demoStateStartTime;
    const stateProgress = timeSinceStateStart / demoStateDuration; // 0 to 1
    const biplaneStartProgress = 0.3; // Start appearing at 30% of state duration
    const biplaneFullProgress = 0.5; // Fully visible by 50% of state duration
    
    if (stateProgress >= biplaneStartProgress) {
      if (stateProgress >= biplaneFullProgress) {
        biplaneFadeTarget = 1.0; // Fully visible
      } else {
        // Fade in progressively from 30% to 50%
        const fadeProgress = (stateProgress - biplaneStartProgress) / (biplaneFullProgress - biplaneStartProgress);
        biplaneFadeTarget = fadeProgress; // 0 to 1
      }
    } else {
      biplaneFadeTarget = 0.0; // Not yet visible
    }
  }
  biplaneOpacity = lerp(biplaneOpacity, biplaneFadeTarget, fadeSpeed);
  
  // Clear arrays when opacity reaches 0 (after fade out)
  if (carsOpacity < 0.01 && !showCars) { vintageCars = []; carExplosions = []; }
  if (peopleOpacity < 0.01 && !showPeople) { people = []; }
  if (parachutistsOpacity < 0.01 && !showParachutists) { parachutists = []; }
  if (helicoptersOpacity < 0.01 && !showHelicopters) { helicopters = []; }
  // Ensure helicopter is initialized when showHelicopters is true
  if (showHelicopters && (!helicopters || helicopters.length === 0)) {
    helicopters = [];
    heliLastX = null;
    lastHelicopterFrame = -1;
    // Random X position, fixed height
    const randomX = random(width * 0.2, width * 0.8);
    helicopters.push({
      x: randomX,
      y: height * 0.25,
      speed: 0.5,
      moveDirection: 0,
      turnDistance: 200,
      distanceTraveled: 0,
      hue: 200,
      scale: 6.0,
      propPhase: 0
    });
  }
  if (dronesOpacity < 0.01 && !showDrones) { drones = []; }
  if (planesOpacity < 0.01 && !showPlanes) { planes = []; }
  if (ambulancesOpacity < 0.01 && !showAmbulances) { ambulances = []; }
  if (robotsOpacity < 0.01 && !showRobots) { robots = []; }
  if (lasersOpacity < 0.01 && !showLasers) { lasers = []; }
  if (iceCarsOpacity < 0.01 && !showICECars) { iceCars = []; }
  if (biplaneOpacity < 0.01 && !showBiplane) { biplane = null; }
  
  // Auto-spawn lasers when showLasers is true (independent of drones)
  if (showLasers) {
    if (!window.lastLaserSpawnTime) window.lastLaserSpawnTime = 0;
    const currentTime = millis();
    const timeSinceLastLaser = currentTime - window.lastLaserSpawnTime;
    // Spawn frequently - every 200-500ms with music, 500-1000ms without
    const spawnInterval = analyserNode && bassLevel > 0.1 ? random(200, 500) : random(500, 1000);
    
    if (timeSinceLastLaser > spawnInterval && lasers.length < 20) {
      // Spawn laser from random edge to random target
      const edge = Math.floor(random(4)); // 0=top, 1=right, 2=bottom, 3=left
      let x1, y1;
      if (edge === 0) { // Top
        x1 = random(0, width);
        y1 = 0;
      } else if (edge === 1) { // Right
        x1 = width;
        y1 = random(0, height);
      } else if (edge === 2) { // Bottom
        x1 = random(0, width);
        y1 = height;
      } else { // Left
        x1 = 0;
        y1 = random(0, height);
      }
      
      const x2 = random(width * 0.1, width * 0.9);
      const y2 = random(height * 0.1, height * 0.9);
      const hue = analyserNode && currentHue ? currentHue : random(0, 360);
      
      createLaser(x1, y1, x2, y2, hue);
      window.lastLaserSpawnTime = currentTime;
    }
  }
  
  // Clamp deltaTime to prevent large jumps
  deltaTime = min(deltaTime, 0.1); // Max 100ms per frame
  
  // Update day/night cycle
  dayTime += daySpeed;
  if (dayTime > 1) dayTime = 0;
  
  // Calculate time of day (0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
  const timeOfDay = dayTime;
  isNight = timeOfDay < 0.25 || timeOfDay > 0.75;
  const isDay = timeOfDay >= 0.25 && timeOfDay <= 0.75;
  
  // Calculate sun position (arc across sky) - variable X position
  // Sun rises at 0.25 (6am), sets at 0.75 (6pm)
  let sunX, sunY, sunVisible = false;
  if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
    // Daytime - sun visible
    sunVisible = true;
    const sunProgress = (timeOfDay - 0.25) / 0.5; // 0 to 1 from sunrise to sunset
    // Variable X position - can appear across different parts of the sky
    const baseX = map(sunProgress, 0, 1, width * 0.1, width * 0.9);
    // Add some variation based on time for different positions
    const xVariation = sin(timeOfDay * TWO_PI * 2) * width * 0.2; // Varies X position
    sunX = constrain(baseX + xVariation, width * 0.05, width * 0.95); // Keep within bounds
    // Sun follows an arc (higher at noon)
    const sunArc = sin(sunProgress * PI);
    sunY = height * 0.15 + sunArc * (height * 0.3);
  } else {
    // Nighttime - sun below horizon
    sunVisible = false;
  }
  
  // Calculate ambient light based on time
  ambientLight = isDay ? 
    map(timeOfDay, 0.25, 0.75, 0.3, 1, true) : // Day: brighter at noon
    map(timeOfDay < 0.25 ? timeOfDay + 1 : timeOfDay, 0.75, 1.25, 0.1, 0.3, true); // Night: darker
  
  // Draw sky background with day/night colors
  colorMode(HSL);
  // Use selected background hue if set, otherwise use default day/night colors
  const defaultSkyHue = isNight ? 240 : 200; // Blue at night, lighter blue during day
  const skyHue = window.selectedBackgroundHue !== undefined ? window.selectedBackgroundHue : defaultSkyHue;
  const skySaturation = isNight ? 60 : 40;
  const skyLightness = ambientLight * 50 + (analyserNode ? bassLevel * 5 : 0);
  background(skyHue, skySaturation, skyLightness);
  
  // Draw sun if visible
  if (sunVisible) {
    push();
    colorMode(HSL);
    const sunSize = 40 + sin(millis() * 0.001) * 5; // Pulsing sun
    fill(45, 90, 80, 0.9); // Yellow/orange sun
  noStroke();
    ellipse(sunX, sunY, sunSize, sunSize);
    
    // Sun glow
    fill(45, 80, 90, 0.4);
    ellipse(sunX, sunY, sunSize * 1.5, sunSize * 1.5);
    fill(45, 70, 95, 0.2);
    ellipse(sunX, sunY, sunSize * 2, sunSize * 2);
    pop();
  }
  
  // Draw moon if night - variable X position (not centered)
  if (isNight) {
    push();
    colorMode(HSL);
    // Moon can appear in different X positions across the sky - not centered
    // Use time-based variation to change position over time, moving across full width
    const moonXBase = sin(timeOfDay * TWO_PI * 1.5); // -1 to 1
    const moonX = map(moonXBase, -1, 1, width * 0.15, width * 0.85); // Map to 15% to 85% of screen width
    const moonY = height * 0.2;
    const moonSize = 35;
    
    // Moon glow
    fill(220, 15, 90, 0.3);
    noStroke();
    ellipse(moonX, moonY, moonSize * 1.8, moonSize * 1.8);
    ellipse(moonX, moonY, moonSize * 1.4, moonSize * 1.4);
    
    // Main moon body
    fill(220, 10, 85, 0.95); // Light gray/white moon
    noStroke();
    ellipse(moonX, moonY, moonSize, moonSize);
    
    // Moon phase (changes based on time of day)
    const moonPhaseProgress = (timeOfDay < 0.25 ? timeOfDay + 1 : timeOfDay) - 0.75;
    const phaseOffset = map(moonPhaseProgress, 0, 0.5, -moonSize * 0.4, moonSize * 0.4);
    
    // Dark side of moon (phase shadow)
    fill(skyHue, skySaturation, skyLightness * 0.5, 0.9);
    ellipse(moonX + phaseOffset, moonY, moonSize * 0.85, moonSize * 0.85);
    
    // Moon craters (surface details)
    fill(220, 5, 70, 0.6);
    noStroke();
    ellipse(moonX - 8, moonY - 5, 4, 4);
    ellipse(moonX + 6, moonY + 8, 3, 3);
    ellipse(moonX + 10, moonY - 8, 2.5, 2.5);
    ellipse(moonX - 5, moonY + 10, 3.5, 3.5);
    
    // Moon highlights
    fill(220, 5, 95, 0.7);
    ellipse(moonX - 10, moonY - 8, 5, 5);
    
    pop();
  }
  
  // Stars at night
  if (isNight && ambientLight < 0.2) {
    colorMode(HSL);
    fill(220, 0, 100, 0.8);
    noStroke();
    for (let s = 0; s < 50; s++) {
      const starX = (s * 137.5) % width; // Golden angle distribution
      const starY = (s * 97.3) % (height * 0.6);
      const twinkle = sin(millis() * 0.001 + s) * 0.3 + 0.7;
      ellipse(starX, starY, 1 * twinkle, 1 * twinkle);
    }
  }
  
  // fill background overlay for trail effect
  colorMode(RGB);
  rectMode(CORNER); // Ensure rectMode is CORNER for full-screen overlay
  fill(255, 255, 255, 10 * ambientLight);
  noStroke();
  rect(0, 0, width, height);
  
  noStroke();
  ellipseMode(CENTER);

  if (analyserNode) {
    analyserNode.getFloatFrequencyData(frequencyData);
    
    // Granular frequency band analysis for differentiated reactivity
    subBassLevel = audioSignal(analyserNode, frequencyData, 20, 60);      // Deep sub-bass
    lowBassLevel = audioSignal(analyserNode, frequencyData, 60, 120);     // Low bass
    midBassLevel = audioSignal(analyserNode, frequencyData, 120, 250);    // Mid bass
    lowMidLevel = audioSignal(analyserNode, frequencyData, 250, 500);     // Low mid
    midMidLevel = audioSignal(analyserNode, frequencyData, 500, 2000);    // Mid range
    highMidLevel = audioSignal(analyserNode, frequencyData, 2000, 5000);   // High mid
    presenceLevel = audioSignal(analyserNode, frequencyData, 5000, 10000); // Presence
    airLevel = audioSignal(analyserNode, frequencyData, 10000, 20000);     // Air/sparkle
    
    // Snare drum detection (200-800 Hz, with emphasis on 200-400 Hz attack)
    const snareAttack = audioSignal(analyserNode, frequencyData, 200, 400);  // Main snare attack
    const snareBody = audioSignal(analyserNode, frequencyData, 400, 800);   // Snare body/tail
    snareLevel = (snareAttack * 0.7 + snareBody * 0.3); // Weight attack more heavily
    
    // Legacy bands (for backward compatibility) - AMPLIFIED BASS
    // Weight sub-bass and low-bass more heavily for more obvious bass
    bassLevel = (subBassLevel * 0.4 + lowBassLevel * 0.4 + midBassLevel * 0.2) * 1.5;  // Amplified combined bass
    bassLevel = Math.min(1, bassLevel); // Clamp to 1
    midLevel = (lowMidLevel + midMidLevel) / 2;                     // Combined mid
    trebleLevel = (highMidLevel + presenceLevel + airLevel) / 3;    // Combined treble
    overallEnergy = (bassLevel + midLevel + trebleLevel) / 3;
    
    maxFrequencyTarget = map(
      audioMaxFrequency(analyserNode, frequencyData),
      0,
    400,
      0,
      360,
      true
    );
    
    // Detect snare hits (sudden increases in snare level)
    const snareChange = snareLevel - lastSnareLevel;
    snareHit = snareChange > 0.15 && snareLevel > 0.3; // Snare hit detected (global)
    lastSnareLevel = snareLevel;
    
    // Progressive spawning - gradually increase elements over time
    if (audioStartTime > 0) {
      const elapsedTime = (millis() - audioStartTime) / 1000; // Time in seconds
      const progressionDuration = 180; // 3 minutes to reach full population
      const progressionFactor = constrain(elapsedTime / progressionDuration, 0, 1);
      
      // Gradually increase max people (from 1 to 12 over 3 minutes)
      const currentTargetMaxPeople = 1 + (targetMaxPeople - 1) * progressionFactor;
      maxPeople = Math.floor(currentTargetMaxPeople);
      
      // Gradually increase max cars (from 1 to 8 over 3 minutes)
      const currentTargetMaxCars = 1 + (targetMaxCars - 1) * progressionFactor;
      maxCars = Math.floor(currentTargetMaxCars);
      
      // Gradually increase max monorail cars (from 1 to 6 over 3 minutes)
      const currentTargetMaxMonorail = 1 + (targetMaxMonorailCars - 1) * progressionFactor;
      maxMonorailCars = Math.floor(currentTargetMaxMonorail);
    }
  } else {
    // Reset all frequency levels
    subBassLevel = 0;
    lowBassLevel = 0;
    midBassLevel = 0;
    lowMidLevel = 0;
    midMidLevel = 0;
    highMidLevel = 0;
    presenceLevel = 0;
    airLevel = 0;
    snareLevel = 0;
    lastSnareLevel = 0;
    snareHit = false;
    bassLevel = 0;
    midLevel = 0;
    trebleLevel = 0;
    overallEnergy = 0;
  }

  // Circles positioned in top quarter, variable X position (not always centered)
  // Use time-based variation to change X position over time
  const xVariation = sin(dayTime * TWO_PI * 2) * width * 0.3; // Varies X position based on dayTime
  const cx = constrain(width * 0.5 + xVariation, width * 0.2, width * 0.8); // Variable X, keep within 20% to 80% of screen
  const cy = height * 0.25; // Top quarter vertically
  const dim = min(width, height);

  colorMode(HSL);
  
  // Make hue MORE reactive to bass - bass adds MORE energy to color shifts - MORE OBVIOUS
  const bassHueInfluence = analyserNode ? bassLevel * 100 : 0; // Increased from 60 to 100
  const targetHue = (maxFrequencyTarget + bassHueInfluence) % 360;
  currentHue = damp(currentHue, targetHue, 0.015, deltaTime);

  let hueA = currentHue;
  let hueB = (hueA + 40 ) % 360;
  const colorA = color(hueA, 30, 50);
  const colorB = color(hueB, 30, 50);

  const maxSize = dim * 0.45; // 50% smaller (was 0.90, now 0.45)
  const minSize = dim * 0.03;

  const count =  20;

  // Update fade opacity for central circles
  centralCirclesOpacity = lerp(centralCirclesOpacity, centralCirclesFadeTarget, centralCirclesFadeSpeed);

  // Add subtle industrial atmosphere - power lines or urban grid
  if (analyserNode && bassLevel > 0.2) {
    colorMode(HSL);
    stroke(currentHue, 20, 30, 0.1);
    strokeWeight(1);
    // Subtle horizontal lines suggesting industrial horizon
    for (let i = 0; i < 3; i++) {
      const lineY = height * 0.7 + i * 20;
      line(0, lineY, width, lineY);
    }
  }

  for (let i = 0; i < count; i++) {
    const t = map(i, 0, count - 1, 0, 1);
    
    // Make bass shapes have MORE vibrant colors - MORE OBVIOUS
    // Lower index = lower frequency = bass frequencies
    const isBassShape = i < count / 3; // First third are bass frequencies
    const saturation = isBassShape ? 50 + bassLevel * 50 : 50; // Increased from 30 to 50
    const lightness = isBassShape ? 50 + bassLevel * 30 : 50; // Increased from 15 to 30
    
    // Expanded frequency range to include bass (60-1500 Hz)
    const minBaseHz = 60;
    const maxBaseHz = 1500;
    const minHz = map(count - i, 0, count, minBaseHz, maxBaseHz);
    const maxHz = map(count - i + 1, 0, count, minBaseHz, maxBaseHz);

    const signal = analyserNode
      ? audioSignal(analyserNode, frequencyData, minHz, maxHz)
      : 0;

    const baseSize = map(i, 0, count - 1, maxSize, minSize);
    
    // Make bass frequencies (larger shapes) MUCH more reactive - MORE OBVIOUS
    const bassMultiplier = isBassShape ? 1 + bassLevel * 4.0 : 1; // Increased from 2.5 to 4.0
    
    // Combine signal with bass boost for bass shapes - MORE OBVIOUS
    const enhancedSignal = isBassShape 
      ? Math.max(signal, bassLevel * 1.2) * bassMultiplier // Increased from 0.8 to 1.2
      : signal;
    
    // Add subtle pulsing animation even without audio (so it's never completely static)
    const timePulse = sin(millis() * 0.001 + i * 0.3) * 0.1; // Subtle pulsing
    const basePulse = analyserNode ? 0 : timePulse; // Only pulse if no audio
    
    // Limit size growth - prevent circles from getting too large with music
    const maxGrowth = maxSize * 0.3; // Maximum additional size (30% of maxSize)
    const signalContribution = min(enhancedSignal + basePulse, 0.6); // Cap signal contribution
    const size = baseSize + maxGrowth * signalContribution;
    
    // Calculate alpha/opacity - make circles fully visible, then apply fade
    const baseAlpha = 0.8 + (enhancedSignal + basePulse) * 0.2; // Alpha varies from 0.8 to 1.0 (very visible)
    const circleAlpha = map(i, 0, count - 1, baseAlpha * 0.8, baseAlpha); // All circles highly visible
    const finalAlpha = circleAlpha * centralCirclesOpacity; // Apply fade transition
    
    // Create color with alpha (including fade)
    const c = color((currentHue + 90 * ((i + 1) / count)) % 360, saturation, lightness, finalAlpha);
    
    // Add position movement for more obvious animation
    const movementX = sin(millis() * 0.002 + i * 0.3) * enhancedSignal * 15;
    const movementY = cos(millis() * 0.0015 + i * 0.4) * enhancedSignal * 10;
    const edge = 0.3;

    fill(c);
   
    stroke("black")
    strokeWeight(size / count * 0.5)
   

    rectMode(CENTER);
    
    // Apply position movement for more obvious animation
    push();
    translate(cx + movementX, cy + movementY);
    
    // Draw horizon line (horizontal line across the screen) - also affected by fade
    stroke(c); // Stroke color includes fade alpha
    strokeWeight(size / count * 0.5);
    noFill();
    const horizonY = height * 0.7 + (maxSize - size) * 0.05; // Horizon near bottom
    line(-width/2, horizonY, width/2, horizonY);
    
    // Draw sun (circle) at the origin (center) - fade in/out with 'e'
    // Always draw, but opacity is controlled by centralCirclesOpacity
    fill(c); // Use the color with alpha (includes fade)
    noStroke();
    ellipse(0, 0, size, size); // Sun at origin (center after translation)
    
    pop();
  }

  // Draw buildings that appear/disappear based on audio
  // Only draw if audio is loaded AND playing
  if (analyserNode && audio && !audio.paused) {
    // New separated elements with fade
    if ((showBuildingsStatic && buildingsStaticOpacity > 0.01) || (showBuildingsMoving && buildingsMovingOpacity > 0.01)) {
      push();
      drawingContext.globalAlpha *= max(buildingsStaticOpacity, buildingsMovingOpacity);
      drawBuildings();
      pop();
    }
    if (showRenaissance && renaissanceOpacity > 0.01) {
      push();
      drawingContext.globalAlpha *= renaissanceOpacity;
      drawRenaissanceCenter();
      pop();
    }
    if ((showTracks && tracksOpacity > 0.01) || (showTrainCars && trainCarsOpacity > 0.01)) {
      push();
      drawingContext.globalAlpha *= max(tracksOpacity, trainCarsOpacity);
      drawMonorail();
      pop();
    }
    // Smoke is drawn within drawBuildings() when showSmoke is enabled
  }
  
  // These elements can be drawn even without audio (they have fallback behavior)
  // Apply fade opacity by only drawing when opacity is above threshold
  // Draw robots FIRST so cars and ambulances appear on top of them
  if (robotsOpacity > 0.01) { push(); drawingContext.globalAlpha *= robotsOpacity; drawRobots(); pop(); }
  if (carsOpacity > 0.01) { 
    push(); 
    drawingContext.globalAlpha *= carsOpacity; 
    drawVintageCars(); 
    drawICECars(); // Draw ICE surveillance vehicles
    pop(); 
  }
  if (peopleOpacity > 0.01) { push(); drawingContext.globalAlpha *= peopleOpacity; drawPeople(); pop(); }
  if (parachutistsOpacity > 0.01) { push(); drawingContext.globalAlpha *= parachutistsOpacity; drawParachutists(); pop(); }
  if (helicoptersOpacity > 0.01) { push(); drawingContext.globalAlpha *= helicoptersOpacity; drawHelicopters(); pop(); }
  if (planesOpacity > 0.01) { push(); drawingContext.globalAlpha *= planesOpacity; drawPlanes(); pop(); }
  if (biplaneOpacity > 0.01) { push(); drawingContext.globalAlpha *= biplaneOpacity; drawBiplane(); pop(); }
  if (ambulancesOpacity > 0.01) { push(); drawingContext.globalAlpha *= ambulancesOpacity; drawAmbulances(); pop(); }
  if (showRockets) drawRockets();
  // Draw lasers - Always draw if lasers exist (from drones or showLasers mode)
  if (lasers && lasers.length > 0) {
    drawLasers();
  }
  if (dronesOpacity > 0.01) { push(); drawingContext.globalAlpha *= dronesOpacity; drawDrones(); pop(); }

  // Only show this text when in demo mode but no audio loaded
  // When demoMode is false (home page), drawHomeDescription() handles all text
  if (demoMode && (!audioContext || !audio)) {
    // Play symbol eliminated - only show drag-and-drop hint
    const dim = min(width, height);
    
    // Show title
    fill(255, 255, 255, 220);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(48); // Large title font
    text("CASA DETROIT 2026", width / 2, height / 2 - dim * 0.4);
    
    // Show instructions
    textSize(28);
    fill(255, 255, 255, 200);
    text("Press SPACEBAR to start demo", width / 2, height / 2 - dim * 0.25);
    textSize(20);
    fill(255, 255, 255, 180);
    text("or drop an audio file here", width / 2, height / 2 - dim * 0.18);
    textSize(16);
    fill(255, 255, 255, 150);
    text("SPACEBAR: Toggle demo | D: Demo mode", width / 2, height / 2 - dim * 0.12);
    
    // Keyboard controls instructions
    textSize(18);
    fill(255, 255, 255, 160);
    textAlign(CENTER, CENTER);
    let yOffset = height / 2 - dim * 0.08;
    text("1-9, 0: Toggle elements", width / 2, yOffset);
    yOffset += 32;
    text("Q-W-E-R-T-Y: More elements", width / 2, yOffset);
    yOffset += 32;
    text("A: Toggle all | D: Demo mode", width / 2, yOffset);
    
    // Debug info
    if (currentAudioFile) {
      yOffset += 45;
      textSize(18);
      fill(255, 200, 100, 200);
      text("Last file: " + currentAudioFile, width / 2, yOffset);
      yOffset += 30;
      text("Press SPACEBAR to play", width / 2, yOffset);
    }
  } else if (audio) {
    // Show current file name and status when audio exists
    fill(255, 255, 255, 200);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    let statusText = "File: " + (currentAudioFile || 'Unknown');
    if (audio.paused) {
      statusText += " (PAUSED - Press SPACEBAR to play)";
    } else {
      statusText += " (PLAYING)";
    }
    text(statusText, 10, 10);
    
    // Show audio state
    if (audio && audioContext) {
      textSize(12);
      fill(255, 255, 255, 150);
      text("ReadyState: " + audio.readyState + " | Context: " + audioContext.state, 10, 30);
    }
  }
  
  // Visual feedback when dragging file over canvas
  if (isDraggingOver) {
    push();
    fill(255, 255, 255, 100);
    stroke(255, 255, 255, 200);
    strokeWeight(4);
    rectMode(CENTER);
    rect(width / 2, height / 2, width * 0.8, height * 0.8);
    
    fill(255, 255, 255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("Drop audio file to play", width / 2, height / 2);
    pop();
  }
  
  // Draw home page description LAST (on top) when not in demo mode
  if (!demoMode) {
    drawHomeDescription();
  }
}

function drawBuildings() {
  if (buildings.length === 0) {
    initializeBuildings();
  }
  
  const groundY = height * 0.85; // Buildings sit at bottom of screen
  
  // Detect snare hits for building dance (use global lastSnareLevel from main draw loop)
  const snareChange = snareLevel - lastSnareLevel;
  const snareHit = snareChange > 0.15 && snareLevel > 0.3; // Snare hit detected
  
  // Calculate snare dance intensity for all buildings
  const snareDanceIntensity = snareHit ? snareLevel * 1.5 : snareLevel * 0.3;
  const snareBounce = snareHit ? snareLevel * 25 : 0; // Sudden bounce on snare hit
  const snareSway = snareHit ? snareLevel * 15 : 0; // Sudden sway on snare hit
  const snareRotation = snareHit ? snareLevel * 0.15 : 0; // Sudden rotation on snare hit
  
  // Buildings react to foundation frequencies (sub-bass, low-bass, low-mid)
  // Different building types react to different foundation bands
  // Filter buildings based on static/moving flags
  for (let i = 0; i < buildings.length; i++) {
    const building = buildings[i];
    
    // Skip if building doesn't match the current toggle state
    const isMoving = building.travelSpeed && building.travelSpeed > 0;
    const isStatic = !isMoving;
    
    // Apply independent fade opacity based on building type
    const buildingFadeOpacity = isStatic ? buildingsStaticOpacity : buildingsMovingOpacity;
    if (buildingFadeOpacity < 0.01) continue; // Skip if faded out
    
    if (isMoving && !showBuildingsMoving) continue;
    if (isStatic && !showBuildingsStatic) continue;
    
    // Different buildings react to different foundation frequency bands
    let triggerSignal = 0;
    if (i % 3 === 0) {
      // Factories react to sub-bass (deep foundation)
      triggerSignal = subBassLevel * 0.6 + lowBassLevel * 0.4;
    } else if (i % 3 === 1) {
      // Warehouses react to low-bass (bass foundation)
      triggerSignal = lowBassLevel * 0.7 + midBassLevel * 0.3;
    } else {
      // Industrial/abandoned react to low-mid (warmth foundation)
      triggerSignal = midBassLevel * 0.5 + lowMidLevel * 0.5;
    }
    
    // Buildings appear when signal is strong enough
    // Each building has different thresholds and responses
    const threshold = 0.2 + building.responseDelay;
    const adjustedSignal = triggerSignal - building.responseDelay;
    
    if (adjustedSignal > threshold) {
      // Different buildings have different opacity ranges
      const opacityRange = building.isAbandoned ? [0.3, 0.7] : [0.5, 1.0];
      building.targetOpacity = map(adjustedSignal, threshold, 1, opacityRange[0], opacityRange[1], true);
      
      // Height varies by building type and has unique multipliers - 30% larger
      const baseHeight = (building.buildingType === 0 ? height * 0.5 : height * 0.35) * 1.3;
      let targetHeight = map(adjustedSignal, threshold, 1, 30 * 1.3, baseHeight * building.heightVariation, true);
      
      // Add smooth pulsing effect - DANCE with snare!
      building.pulsePhase += building.swaySpeed * deltaTime * (0.5 + snareDanceIntensity * 0.8); // Faster pulse on snare
      const basePulse = sin(building.pulsePhase) * building.pulseIntensity * 0.08;
      const snarePulse = snareHit ? snareLevel * 0.15 : 0; // Extra pulse on snare hit
      building.targetHeight = targetHeight * (1 + basePulse + snarePulse);
    } else {
      // Smooth fade out - gradually reduce opacity to 0
      building.targetOpacity = 0;
      building.targetHeight = 0;
    }
    
    // Smooth transitions with unique speeds for each building
    // Lower damping values = smoother movement
    // Slower opacity damping for smoother fade in/out
    const heightDamping = 0.02 + (building.speedMultiplier * 0.05);
    const opacityDamping = 0.015 + (building.speedMultiplier * 0.02); // Much slower for smooth fade
    
    building.currentHeight = damp(building.currentHeight, building.targetHeight, heightDamping, deltaTime);
    building.opacity = damp(building.opacity, building.targetOpacity, opacityDamping, deltaTime);
    
    // Apply independent fade opacity for static/moving buildings
    building.opacity *= buildingFadeOpacity;
    
    // Smooth horizontal sway - DANCE with snare!
    // Store previous sway for interpolation
    if (!building.prevSway) building.prevSway = 0;
    building.swayPhase += building.swaySpeed * deltaTime * (0.3 + snareDanceIntensity * 0.5); // Faster on snare
    const targetSway = sin(building.swayPhase) * (building.swayAmount + snareSway);
    building.prevSway = lerp(building.prevSway, targetSway, snareHit ? 0.3 : 0.08); // Faster response on snare
    const sway = building.prevSway * (building.opacity * (0.5 + snareDanceIntensity * 0.5));
    // Continuous movement - buildings always move
    building.travelPhase = (building.travelPhase || 0) + deltaTime * building.travelSpeed * 0.01;
    const travelOffset = sin(building.travelPhase) * building.travelAmount * 50;
    
    building.x = building.baseX + sway + travelOffset; // Sway + continuous travel movement
    
    // Smooth vertical bounce - DANCE with snare!
    if (!building.prevBounce) building.prevBounce = 0;
    building.bouncePhase += building.bounceSpeed * deltaTime * (0.4 + snareDanceIntensity * 0.6); // Faster on snare
    const targetBounce = sin(building.bouncePhase) * (building.bounceAmount + snareBounce) * building.opacity;
    building.prevBounce = lerp(building.prevBounce, targetBounce, snareHit ? 0.4 : 0.1); // Faster response on snare
    const bounce = building.prevBounce;
    const buildingY = groundY - bounce; // Bounce upward from ground - MORE on snare!
    
    // Smooth rotation - DANCE with snare!
    if (!building.currentRotation) building.currentRotation = building.rotation;
    const targetRotation = building.rotation + (sway * 0.008) + (bounce * 0.003) + snareRotation;
    building.currentRotation = lerp(building.currentRotation, targetRotation, snareHit ? 0.2 : 0.08); // Faster rotation on snare
    const rotation = building.currentRotation;
    
    // Update building colors - factories stay industrial, others shift with music
    // Smoother color transitions with lower damping
    if (building.buildingType === 0) {
      // Factories keep industrial gray/blue
      building.hue = damp(building.hue, 200 + bassLevel * 20, 0.015, deltaTime);
    } else if (building.isAbandoned) {
      // Abandoned buildings stay reddish/brown
      building.hue = damp(building.hue, 15 + bassLevel * 10, 0.01, deltaTime);
    } else {
      // Other buildings shift with music
      building.hue = damp(building.hue, (currentHue + i * 20) % 360, 0.02, deltaTime);
    }
    
    // Draw building if visible
    if (building.opacity > 0.01 && building.currentHeight > 5) {
      push();
      // Apply transformations for unique movement
      translate(building.x, buildingY);
      rotate(rotation);
      
      colorMode(HSL);
      const buildingHue = building.hue;
      const buildingSat = building.saturation;
      const buildingLight = building.lightness;
      
      // Main building structure (draw relative to origin after transform)
      fill(buildingHue, buildingSat, buildingLight, building.opacity);
      stroke(0, 0, 0, building.opacity * 0.9);
      strokeWeight(building.isAbandoned ? 1 : 2);
      
      rectMode(CORNER);
      rect(
        -building.baseWidth / 2,
        -building.currentHeight,
        building.baseWidth,
        building.currentHeight
      );
      
      // Industrial details - add horizontal bands for factories
      if (building.buildingType === 0 && building.currentHeight > 60) {
        stroke(buildingHue, buildingSat * 0.7, buildingLight * 0.8, building.opacity * 0.6);
        strokeWeight(1);
        for (let band = 1; band < 4; band++) {
          line(
            -building.baseWidth / 2,
            -building.currentHeight + (building.currentHeight / 4) * band,
            building.baseWidth / 2,
            -building.currentHeight + (building.currentHeight / 4) * band
          );
        }
      }
      
      // Windows - different styles for different building types
      if (building.currentHeight > 40) {
        const windowRows = Math.floor(building.currentHeight / 35);
        const windowCols = building.buildingType === 0 ? 4 : 3;
        const windowSize = building.baseWidth / (windowCols + 1);
        const windowSpacing = windowSize * 0.25;
        
        const timePattern = Math.floor(millis() / 500) % 4;
        
        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            const windowX = -building.baseWidth / 2 + (col + 1) * (building.baseWidth / (windowCols + 1)) - windowSize / 2;
            const windowY = -building.currentHeight + row * 35 + 12;
            
            if (building.isAbandoned) {
              // Abandoned buildings - broken/dark windows
              fill(0, 0, 20, building.opacity * 0.8);
              noStroke();
              if ((row + col + building.windowPattern) % 2 === 0) {
                rect(windowX, windowY, windowSize - windowSpacing, windowSize - windowSpacing);
              }
              // Some broken windows
              if ((row + col) % 5 === 0) {
                stroke(0, 0, 0, building.opacity);
                strokeWeight(1);
                line(windowX, windowY, windowX + windowSize - windowSpacing, windowY + windowSize - windowSpacing);
                line(windowX + windowSize - windowSpacing, windowY, windowX, windowY + windowSize - windowSpacing);
              }
            } else {
              // Active buildings - lit windows (more windows lit at night)
              const windowChance = isNight ? 0.7 : 0.6; // More windows lit at night
              const shouldShow = ((row + col + i + timePattern) % 3) !== 0 || (isNight && random() < windowChance);
              
              if (shouldShow) {
                // Windows are brighter and more visible at night
                const windowBrightness = isNight ? buildingLight + 50 : buildingLight + 30;
                const windowOpacity = isNight ? building.opacity * 0.9 : building.opacity * 0.7;
                const windowSaturation = isNight ? buildingSat * 0.7 : buildingSat * 0.5;
                
                // Window glow at night
                if (isNight) {
                  fill(buildingHue, windowSaturation, windowBrightness, windowOpacity * 0.4);
                  noStroke();
                  ellipse(windowX + (windowSize - windowSpacing) / 2, windowY + (windowSize - windowSpacing) / 2, 
                          (windowSize - windowSpacing) * 1.5, (windowSize - windowSpacing) * 1.5);
                }
                
                // Window light
                fill(buildingHue, windowSaturation, windowBrightness, windowOpacity);
                noStroke();
                rect(windowX, windowY, windowSize - windowSpacing, windowSize - windowSpacing);
                
                // Window frames
                stroke(0, 0, 0, building.opacity * (isNight ? 0.7 : 0.5));
                strokeWeight(isNight ? 0.8 : 0.5);
                noFill();
                rect(windowX, windowY, windowSize - windowSpacing, windowSize - windowSpacing);
              } else {
                // Dark windows (not lit)
                fill(0, 0, 10, building.opacity * 0.5);
                noStroke();
                rect(windowX, windowY, windowSize - windowSpacing, windowSize - windowSpacing);
              }
            }
          }
        }
      }
      
      // Smokestacks for factories - DANCE with snare!
      if (building.hasSmokestack && building.currentHeight > 80) {
        const stackWidth = building.baseWidth * 0.15;
        const stackX = building.baseWidth / 4;
        // Smokestack height reacts to bass AND snare hits
        const snareStackBounce = snareHit ? snareLevel * 8 : 0; // Extra height on snare hit
        const stackHeight = building.smokestackHeight * (0.7 + bassLevel * 0.6 + snareStackBounce);
        
        // Smokestack base
        fill(buildingHue, buildingSat * 0.8, buildingLight * 0.7, building.opacity);
        stroke(0, 0, 0, building.opacity * 0.9);
        strokeWeight(1.5);
        rect(
          stackX - stackWidth / 2,
          -building.currentHeight - stackHeight,
          stackWidth,
          stackHeight
        );
        
        // Reactive smoke - differentiated by frequency bands AND SNARE!
        // Lower smoke reacts to sub-bass/low-bass, upper smoke to high-mid/presence
        // Snare hits make smoke explode outward dramatically
        // Smoke fades in and out smoothly based on audio levels
        const lowerSmokeIntensity = analyserNode ? (subBassLevel * 0.4 + lowBassLevel * 0.6) * building.opacity : 0;
        const upperSmokeIntensity = analyserNode ? (highMidLevel * 0.5 + presenceLevel * 0.5) * building.opacity : 0;
        const snareSmokeBoost = analyserNode && snareHit ? snareLevel * 0.8 : 0; // Dramatic smoke boost on snare
        const baseSmokeIntensity = ((lowerSmokeIntensity + upperSmokeIntensity) / 2) + snareSmokeBoost;
        
        // Smooth fade in/out - smoke appears when intensity is high, disappears when low
        // Lower threshold and higher base intensity for more visible smoke
        const smokeThreshold = 0.05; // Lower threshold - smoke appears more easily
        const smokeTargetOpacity = baseSmokeIntensity > smokeThreshold ? 
          map(baseSmokeIntensity, smokeThreshold, 1.0, 0.3, 1.0, true) : 0.0; // Start at 0.3 opacity minimum
        
        // Track smoke opacity per building for smooth fade
        if (!building.smokeOpacity) building.smokeOpacity = 0.0;
        building.smokeOpacity = lerp(building.smokeOpacity, smokeTargetOpacity, 0.12); // Faster fade for more responsive
        
        // Always draw smoke if showSmoke is enabled and building is visible (for testing, make it always visible)
        if (showSmoke && building.opacity > 0.1) {
          // Use higher intensity for more visible smoke
          const smokeIntensity = Math.max(baseSmokeIntensity, 0.3) * building.smokeOpacity; // Minimum 0.3 intensity
          
          if (smokeIntensity > 0.02) { // Lower threshold for drawing
            noStroke();
          
          // Multiple smoke particles for more dynamic effect
          const smokeParticleCount = Math.floor(smokeIntensity * 5) + 2;
          const baseTime = millis() * 0.001;
          
          for (let p = 0; p < smokeParticleCount; p++) {
            // Each particle moves at different speed based on frequency bands AND SNARE!
            // Snare hits make particles move faster and spread wider
            const snareSpeedBoost = snareHit ? snareLevel * 0.5 : 0;
            const particleSpeed = (0.3 + (p % 3) * 0.2) * (1 + snareSpeedBoost); // Faster on snare
            const particleOffset = (baseTime * particleSpeed * 50 + p * 15) % 60;
            
            // Smoke reacts to different frequency bands - more differentiated
            // MUCH larger and brighter for maximum visibility
            let particleSize = stackWidth * (1.8 + smokeIntensity * 2.0); // Much larger particles
            let particleOpacity = smokeIntensity * 1.0; // Full opacity for visibility
            
            // Lower particles react to deep bass, higher to presence/air - MORE OBVIOUS
            if (p < smokeParticleCount / 2) {
              // Lower particles - react to sub-bass and low-bass (foundation) - AMPLIFIED
              particleSize *= (1 + subBassLevel * 1.8 + lowBassLevel * 1.2); // Much larger multipliers
              particleOpacity *= (0.9 + subBassLevel * 0.6 + lowBassLevel * 0.7); // Much higher opacity
            } else {
              // Upper particles - react to high-mid and presence (atmospheric)
              particleSize *= (1 + highMidLevel * 0.8 + presenceLevel * 0.6); // Larger multipliers
              particleOpacity *= (0.8 + highMidLevel * 0.5 + presenceLevel * 0.5); // Higher opacity
            }
            
            // Horizontal drift based on low-mid (wind-like movement) AND SNARE!
            // Snare hits create dramatic horizontal spread
            const snareDrift = snareHit ? sin(baseTime * 8 + p) * snareLevel * 20 : 0;
            const horizontalDrift = sin(baseTime * 2 + p) * lowMidLevel * 10 + snareDrift;
            
            // Vertical position - particles rise and expand
            const verticalPos = -building.currentHeight - stackHeight - 10 - particleOffset;
            
            // Smoke color varies with music - brighter and more visible
            const smokeHue = (buildingHue + overallEnergy * 30) % 360;
            const smokeSat = buildingSat * 0.5; // Increased saturation for visibility
            const smokeLight = buildingLight * 0.6 + overallEnergy * 25; // Much brighter for visibility
            
            fill(smokeHue, smokeSat, smokeLight, particleOpacity * building.opacity * building.smokeOpacity);
            
            // Draw smoke particle (expanding ellipse)
            ellipse(
              stackX + horizontalDrift,
              verticalPos,
              particleSize,
              particleSize * 0.8
            );
            
            // Additional smaller particles for more detail
            if (p % 2 === 0 && smokeIntensity > 0.3) {
              fill(smokeHue, smokeSat * 0.15, smokeLight * 0.4, particleOpacity * 0.6 * building.opacity * building.smokeOpacity);
              ellipse(
                stackX + horizontalDrift + sin(baseTime + p) * 3,
                verticalPos - 5,
                particleSize * 0.6,
                particleSize * 0.5
              );
            }
          }
          
          // Burst of smoke on beats
          if (bassLevel > 0.5 && bassLevel - (building.lastBassLevel || 0) > 0.1) {
            const burstIntensity = (bassLevel - 0.5) * 2;
            fill(buildingHue, buildingSat * 0.25, buildingLight * 0.35, burstIntensity * building.opacity * building.smokeOpacity * 0.8);
            ellipse(
              stackX,
              -building.currentHeight - stackHeight - 5,
              stackWidth * (2 + burstIntensity),
              stackWidth * (1.5 + burstIntensity)
            );
          }
          
          // Store bass level for beat detection
          building.lastBassLevel = bassLevel;
          }
        }
      }
      
      // Industrial vents/pipes on factories
      if (building.buildingType === 0 && building.currentHeight > 100) {
        stroke(buildingHue, buildingSat * 0.6, buildingLight * 0.6, building.opacity * 0.7);
        strokeWeight(2);
        const ventX = -building.baseWidth / 3;
        line(
          ventX,
          -building.currentHeight + 20,
          ventX,
          -building.currentHeight + 40
        );
        // Vent cap
        fill(buildingHue, buildingSat * 0.6, buildingLight * 0.6, building.opacity);
        noStroke();
        rect(ventX - 4, -building.currentHeight + 18, 8, 4);
      }
      
      pop(); // End transformations
    }
  }
  
  colorMode(HSL); // Reset color mode
}

function drawRenaissanceCenter() {
  if (!renaissanceCenter) {
    initializeRenaissanceCenter();
  }
  
  const rc = renaissanceCenter;
  
  // React to bass with subtle vertical pulse
  rc.phase += deltaTime * 0.2;
  const verticalPulse = sin(rc.phase) * bassLevel * 2;
  rc.baseY = height * 0.85 - verticalPulse;
  const groundY = rc.baseY;
  
  // Renaissance Center appears when overall energy is present
  const targetOpacity = analyserNode && overallEnergy > 0.2 ? 1.0 : 0;
  rc.targetOpacity = damp(rc.targetOpacity, targetOpacity, 0.05, deltaTime);
  rc.opacity = damp(rc.opacity, rc.targetOpacity, 0.08, deltaTime);
  
  // Height reacts to overall energy
  const maxHeight = height * 0.6; // Very tall building
  rc.targetHeight = analyserNode ? maxHeight * (0.7 + overallEnergy * 0.3) : 0;
  rc.currentHeight = damp(rc.currentHeight, rc.targetHeight, 0.03, deltaTime);
  
  // Color shifts with music
  rc.hue = damp(rc.hue, (currentHue + 20) % 360, 0.02, deltaTime);
  
  // Update window phase for animated windows
  rc.windowPhase += deltaTime * 0.3;
  
  // Draw Renaissance Center if visible
  if (rc.opacity > 0.01 && rc.currentHeight > 10) {
    push();
    translate(rc.x, groundY);
    
    colorMode(HSL);
    
    // Central tower (tallest - the main RenCen tower)
    const centerTowerWidth = 60;
    const centerTowerHeight = rc.currentHeight;
    
    // Tower base
    fill(rc.hue, 40, 45, rc.opacity);
    stroke(0, 0, 0, rc.opacity * 0.8);
    strokeWeight(2);
    
    // Draw cylindrical tower (using ellipse for circular cross-section)
    rectMode(CENTER);
    
    // Main tower body (appears cylindrical from side view)
    fill(rc.hue, 35, 50, rc.opacity);
    rect(0, -centerTowerHeight / 2, centerTowerWidth, centerTowerHeight);
    
    // Tower top (distinctive RenCen top)
    fill(rc.hue, 30, 40, rc.opacity);
    triangle(
      -centerTowerWidth / 2, -centerTowerHeight,
      0, -centerTowerHeight - 20,
      centerTowerWidth / 2, -centerTowerHeight
    );
    
    // Windows on central tower (grid pattern)
    const windowRows = Math.floor(centerTowerHeight / 25);
    const windowCols = 4;
    const windowSize = centerTowerWidth / (windowCols + 1);
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const windowX = -centerTowerWidth / 2 + (col + 1) * (centerTowerWidth / (windowCols + 1));
        const windowY = -centerTowerHeight + row * 25 + 15;
        
        // More windows lit at night
        const windowChance = isNight ? 0.8 : 0.6;
        const shouldLight = ((row + col + Math.floor(rc.windowPhase)) % 3) !== 0 || (isNight && random() < windowChance);
        
        if (shouldLight) {
          // Windows brighter at night
          const windowBrightness = isNight ? 85 : 70;
          const windowOpacity = isNight ? rc.opacity * (0.7 + overallEnergy * 0.3) : rc.opacity * (0.4 + overallEnergy * 0.4);
          
          // Window glow at night
          if (isNight) {
            fill(rc.hue, 30, windowBrightness, windowOpacity * 0.5);
            noStroke();
            ellipse(windowX, windowY + 6, windowSize * 1.3, 15);
          }
          
          fill(rc.hue, 20, windowBrightness, windowOpacity);
          noStroke();
          rect(windowX - windowSize / 2, windowY, windowSize - 2, 12);
        } else if (isNight) {
          // Dark windows at night
          fill(0, 0, 5, rc.opacity * 0.3);
          noStroke();
          rect(windowX - windowSize / 2, windowY, windowSize - 2, 12);
        }
      }
    }
    
    // Surrounding towers (shorter cylindrical towers around the center)
    const surroundingTowers = [
      {x: -centerTowerWidth - 30, height: centerTowerHeight * 0.6},
      {x: centerTowerWidth + 30, height: centerTowerHeight * 0.6},
      {x: -centerTowerWidth / 2 - 15, height: centerTowerHeight * 0.5},
      {x: centerTowerWidth / 2 + 15, height: centerTowerHeight * 0.5}
    ];
    
    for (let i = 0; i < surroundingTowers.length; i++) {
      const tower = surroundingTowers[i];
      const towerWidth = centerTowerWidth * 0.7;
      
      // Tower body
      fill(rc.hue, 35, 48, rc.opacity * 0.9);
      stroke(0, 0, 0, rc.opacity * 0.7);
      strokeWeight(1.5);
      rect(tower.x, -tower.height / 2, towerWidth, tower.height);
      
      // Tower top
      fill(rc.hue, 30, 38, rc.opacity * 0.9);
      triangle(
        tower.x - towerWidth / 2, -tower.height,
        tower.x, -tower.height - 15,
        tower.x + towerWidth / 2, -tower.height
      );
      
      // Windows on surrounding towers
      const towerWindowRows = Math.floor(tower.height / 20);
      const towerWindowCols = 3;
      const towerWindowSize = towerWidth / (towerWindowCols + 1);
      
      for (let row = 0; row < towerWindowRows; row++) {
        for (let col = 0; col < towerWindowCols; col++) {
          const windowX = tower.x - towerWidth / 2 + (col + 1) * (towerWidth / (towerWindowCols + 1));
          const windowY = -tower.height + row * 20 + 12;
          
          // More windows lit at night
          const windowChance = isNight ? 0.75 : 0.6;
          const shouldLight = ((row + col + i + Math.floor(rc.windowPhase)) % 3) !== 0 || (isNight && random() < windowChance);
          
          if (shouldLight) {
            // Windows brighter at night
            const windowBrightness = isNight ? 80 : 65;
            const windowOpacity = isNight ? rc.opacity * (0.6 + overallEnergy * 0.4) : rc.opacity * (0.3 + overallEnergy * 0.3);
            
            // Window glow at night
            if (isNight) {
              fill(rc.hue, 25, windowBrightness, windowOpacity * 0.4);
              noStroke();
              ellipse(windowX, windowY + 5, towerWindowSize * 1.2, 12);
            }
            
            fill(rc.hue, 20, windowBrightness, windowOpacity);
            noStroke();
            rect(windowX - towerWindowSize / 2, windowY, towerWindowSize - 2, 10);
          } else if (isNight) {
            // Dark windows at night
            fill(0, 0, 5, rc.opacity * 0.3);
            noStroke();
            rect(windowX - towerWindowSize / 2, windowY, towerWindowSize - 2, 10);
          }
        }
      }
    }
    
    // Base/platform connecting the towers
    fill(rc.hue, 25, 40, rc.opacity);
    stroke(0, 0, 0, rc.opacity * 0.8);
    strokeWeight(2);
    const baseWidth = centerTowerWidth * 3.5;
    const baseHeight = 15;
    rect(0, 0, baseWidth, baseHeight);
    
    // Entrance/ground level details
    fill(rc.hue, 20, 60, rc.opacity * 0.8);
    noStroke();
    rect(0, -5, baseWidth * 0.6, 8);
    
    // Logo/name area (subtle)
    fill(rc.hue, 30, 55, rc.opacity * 0.6);
    textAlign(CENTER, CENTER);
    textSize(8);
    text("RENAISSANCE", 0, -2);
    
    // Vertical accent lines (architectural detail)
    stroke(rc.hue, 30, 35, rc.opacity * 0.6);
    strokeWeight(1);
    for (let x = -baseWidth / 2 + 10; x < baseWidth / 2; x += 20) {
      line(x, -baseHeight / 2, x, baseHeight / 2);
    }
    
    pop();
  }
  
  colorMode(HSL);
}

// Function to get track position (x, y) at a given x coordinate
function getTrackPosition(x) {
  const baseHeight = height * 0.65;
  const waveAmplitude = 25; // Reduced - less dramatic vertical curves
  const horizontalWave = 15; // Reduced - less horizontal movement
  
  // Gentler sine waves for subtle curves
  const verticalCurve = sin(x * 0.008 + millis() * 0.00005) * waveAmplitude; // Slower, smaller
  const horizontalCurve = cos(x * 0.006 + millis() * 0.00008) * horizontalWave; // Slower, smaller
  const secondaryCurve = sin(x * 0.012 + millis() * 0.0001) * waveAmplitude * 0.3; // Much smaller secondary curve
  
  // Combine curves (more subtle)
  const y = baseHeight + verticalCurve + secondaryCurve;
  const xOffset = horizontalCurve;
  
  return { x: x + xOffset, y: y };
}

// Function to get track angle at a given x coordinate
function getTrackAngle(x) {
  const deltaX = 1;
  const pos1 = getTrackPosition(x);
  const pos2 = getTrackPosition(x + deltaX);
  return atan2(pos2.y - pos1.y, pos2.x - pos1.x);
}

function drawMonorail() {
  if (monorailCars.length === 0) {
    initializeMonorail();
  }
  
  // Progressive spawning - add more monorail cars over time
  if (monorailCars.length < maxMonorailCars && analyserNode) {
    const carSpacing = width / (maxMonorailCars / 2);
    const direction = monorailCars.length % 2 === 0 ? 1 : -1;
    const startPos = direction === 1 ? -100 : width + 100;
    
    monorailCars.push({
      position: startPos + (monorailCars.length * carSpacing * 0.5) % width,
      hue: random(180, 240),
      speed: random(0.4, 0.8),
      phase: random(0, TWO_PI),
      direction: direction,
      beatPhase: random(0, TWO_PI),
      lastBeatTime: 0,
      beatBoost: 0
    });
  }
  
  const trackThickness = 8;
  const supportHeight = 30;
  const supportSpacing = 80;
  
  colorMode(HSL);
  
  // Draw tracks only if showTracks is enabled
  if (showTracks) {
    // Draw monorail track supports (pillars) - following curved path
    stroke(200, 30, 40, 0.6);
    strokeWeight(3);
    fill(200, 25, 35, 0.5);
    
    for (let x = -100; x < width + 200; x += supportSpacing) {
      const trackPos = getTrackPosition(x);
      const supportX = trackPos.x;
      const supportY = trackPos.y + trackThickness;
      
      // Support pillar (vertical, perpendicular to ground)
      rect(supportX - 4, supportY, 8, supportHeight);
    }
    
    // Draw curved monorail track (elevated beam)
    stroke(200, 40, 50, 0.8);
    strokeWeight(trackThickness);
    fill(200, 35, 45, 0.7);
    
    // Draw track as connected segments following the curve
    beginShape();
    noFill();
    stroke(200, 40, 50, 0.8);
    strokeWeight(trackThickness);
    
    for (let x = -50; x < width + 100; x += 5) {
      const trackPos = getTrackPosition(x);
      vertex(trackPos.x, trackPos.y);
    }
    endShape();
    
    // Draw track top surface (thinner line on top)
    stroke(200, 50, 60, 0.9);
    strokeWeight(2);
    beginShape();
    noFill();
    for (let x = -50; x < width + 100; x += 5) {
      const trackPos = getTrackPosition(x);
      vertex(trackPos.x, trackPos.y);
    }
    endShape();
  }
  
  // Draw monorail cars only if showTrainCars is enabled
  if (showTrainCars) {
  for (let i = 0; i < monorailCars.length; i++) {
    const car = monorailCars[i];
    
    // Monorail reacts to mid-range frequencies (rhythm, vocals)
    // Store previous mid-mid level for beat detection
    if (!car.lastMidMidLevel) car.lastMidMidLevel = 0;
    const midChange = midMidLevel - car.lastMidMidLevel;
    car.lastMidMidLevel = midMidLevel;
    
    // Detect beat from mid-range (rhythm detection)
    const carBeatDetected = midChange > 0.12 && midMidLevel > 0.35;
    
    // Boost speed on beats (less reactive)
    if (carBeatDetected) {
      car.beatBoost = 1.2; // Reduced boost on beat (from 1.5)
    } else {
      // Decay beat boost smoothly
      car.beatBoost = lerp(car.beatBoost, 0, 0.1);
    }
    
    // Base speed multiplier from mid-range (rhythm frequencies)
    const baseSpeedMultiplier = analyserNode ? 1 + midMidLevel * 0.4 : 1;
    // Combined speed with beat boost
    const speedMultiplier = baseSpeedMultiplier + car.beatBoost;
    
    // Update car position along the track (x coordinate)
    car.position += car.speed * speedMultiplier * car.direction;
    
    // Loop cars based on direction
    if (car.direction === 1) {
      // Moving right to left
      if (car.position > width + 100) {
        car.position = -100;
      }
    } else {
      // Moving left to right
      if (car.position < -100) {
        car.position = width + 100;
      }
    }
    
    // Get track position and angle at car's current x position
    const trackPos = getTrackPosition(car.position);
    const trackAngle = getTrackAngle(car.position);
    
    // Car reacts to bass with subtle vertical movement (less reactive)
    car.phase += deltaTime * (0.3 + bassLevel * 0.15); // Slower phase
    const verticalOffset = sin(car.phase) * bassLevel * 2; // Reduced from 4 to 2
    // Subtle bounce on beats
    const beatBounce = car.beatBoost > 0.5 ? sin(car.phase * 3) * 2 : 0; // Reduced from 5 to 2
    
    // Final car position (on track + subtle music reactions) - Adjusted for doubled car size
    const carX = trackPos.x;
    const carY = trackPos.y - 50 + verticalOffset + beatBounce; // Doubled offset from -25 to -50
    
    // Car color shifts with music and pulses on beats
    const targetHue = (currentHue + i * 30) % 360;
    car.hue = damp(car.hue, targetHue, 0.05, deltaTime);
    
    // Car brightness pulses on beats
    const carBrightness = car.beatBoost > 0.3 ? 70 : 55;
    
    // Draw monorail car
    push();
    translate(carX, carY);
    
    // Rotate car to match track angle
    rotate(trackAngle);
    
    // Flip car horizontally if going right (so front faces direction of travel)
    if (car.direction === 1) {
      scale(-1, 1);
    }
    
    // Car body - brightness changes with beats
    fill(car.hue, 60, carBrightness, 0.9);
    stroke(0, 0, 0, 0.8);
    strokeWeight(4); // Doubled from 2
    
    // Main car body (rounded rectangle style) - DOUBLED SIZE
    rectMode(CENTER);
    rect(0, 0, 160, 60); // Doubled from 80, 30
    
    // Car windows - DOUBLED SIZE
    fill(car.hue, 40, 70, 0.7);
    noStroke();
    // Front window (relative to direction)
    rect(-50, -10, 30, 24); // Doubled from -25, -5, 15, 12
    // Side windows
    for (let w = -20; w <= 20; w += 40) { // Doubled spacing from -10 to 10, step 20 to 40
      rect(w, -16, 24, 20); // Doubled from w, -8, 12, 10
    }
    // Back window
    rect(50, -10, 30, 24); // Doubled from 25, -5, 15, 12
    
    // Window frames - DOUBLED SIZE
    stroke(0, 0, 0, 0.6);
    strokeWeight(2); // Doubled from 1
    noFill();
    rect(-50, -10, 30, 24); // Doubled from -25, -5, 15, 12
    rect(50, -10, 30, 24); // Doubled from 25, -5, 15, 12
    for (let w = -20; w <= 20; w += 40) { // Doubled spacing
      rect(w, -16, 24, 20); // Doubled from w, -8, 12, 10
    }
    
    // Car connection to track (bogie) - DOUBLED SIZE
    fill(200, 30, 40, 0.8);
    stroke(0, 0, 0, 0.7);
    strokeWeight(3); // Doubled from 1.5
    rect(0, 30, 120, 16); // Doubled from 0, 15, 60, 8
    
    // Wheels on track - DOUBLED SIZE
    fill(50, 20, 30, 0.9);
    noStroke();
    ellipse(-40, 38, 16, 16); // Doubled from -20, 19, 8, 8
    ellipse(0, 38, 16, 16); // Doubled from 0, 19, 8, 8
    ellipse(40, 38, 16, 16); // Doubled from 20, 19, 8, 8
    
    // Light on front (always on front relative to direction, pulses with beats) - DOUBLED SIZE
    const lightIntensity = bassLevel > 0.3 ? bassLevel : car.beatBoost * 0.6;
    if (lightIntensity > 0.2) {
      fill(car.hue, 80, 70, lightIntensity * 0.9);
      noStroke();
      ellipse(-80, 0, 16 + car.beatBoost * 4, 16 + car.beatBoost * 4); // Doubled from -40, 0, 8 + car.beatBoost * 2
    }
    
    pop();
  }
  }
  
  // Reset monorail position if it gets too large
  if (monorailPosition > width * 2) {
    monorailPosition = 0;
  }
  
  colorMode(HSL);
}

function drawRobots() {
  const currentTime = millis();
  
  // Robots react to high-mid and treble frequencies (sharp, mechanical sounds)
  // Store previous high-mid level for beat detection
  if (!window.lastHighMidLevel) window.lastHighMidLevel = 0;
  const safeHighMidLevel = analyserNode ? (highMidLevel || 0.3) : 0.3;
  const safePresenceLevel = analyserNode ? (presenceLevel || 0.3) : 0.3;
  const safeLastBeatTime = analyserNode ? (lastBeatTime || 0) : 0;
  const safeCurrentHue = analyserNode ? (currentHue || 200) : 200;
  
  const highMidChange = safeHighMidLevel - window.lastHighMidLevel;
  window.lastHighMidLevel = safeHighMidLevel;
  
  // Detect beats from high-mid/treble (sharp attacks, mechanical sounds)
  const robotBeatDetected = analyserNode && (highMidChange > 0.12 && safeHighMidLevel > 0.3 && (currentTime - safeLastBeatTime > 300));
  const trebleBeatDetected = analyserNode && (safePresenceLevel > 0.4 && (currentTime - safeLastBeatTime > 300));
  const beatDetected = robotBeatDetected || trebleBeatDetected;
  
  // Spawn robots on high-mid/treble beats or when high frequencies are strong
  const highFreqLevel = (safeHighMidLevel + safePresenceLevel) / 2;
  const shouldSpawn = analyserNode ?
    ((beatDetected && currentTime - safeLastBeatTime > 300) || (highFreqLevel > 0.3 && random() < 0.1)) :
    (random() < 0.03); // Spawn occasionally without audio
  
  // Don't auto-spawn robots - only spawn when 'r' is pressed (soloist mode)
  // Robots are now controlled manually via key press only
  
  // Update and draw robots - THREE ROBOTS with names
  
  // Enhanced sound detection for DIRECTLY REACTIVE robot - ALL frequency bands
  const safeBassLevel = analyserNode ? (bassLevel || 0.0) : 0.0;
  const safeSnareHit = analyserNode ? (snareHit || false) : false;
  const safeSubBassLevel = analyserNode ? (subBassLevel || 0.0) : 0.0;
  const safeLowBassLevel = analyserNode ? (lowBassLevel || 0.0) : 0.0;
  const safeMidBassLevel = analyserNode ? (midBassLevel || 0.0) : 0.0;
  const safeLowMidLevel = analyserNode ? (lowMidLevel || 0.0) : 0.0;
  const safeMidMidLevel = analyserNode ? (midMidLevel || 0.0) : 0.0;
  // safeHighMidLevel and safePresenceLevel already declared above, reuse them
  const safeMidLevel = analyserNode ? (midLevel || 0.0) : 0.0;
  const safeTrebleLevel = analyserNode ? (trebleLevel || 0.0) : 0.0;
  const safeOverallEnergy = analyserNode ? (overallEnergy || 0.0) : 0.0;
  
  // Comprehensive sound intensity - reacts to ALL frequency bands (LESS REACTIVE)
  const soundIntensity = analyserNode ? 
    (safeBassLevel * 0.3 + safeSubBassLevel * 0.2 + safeMidLevel * 0.15 + 
     safeHighMidLevel * 0.15 + safeTrebleLevel * 0.1 + safeOverallEnergy * 0.1) : 0.0;
  
  // Beat detection - LESS SENSITIVE, requires higher thresholds
  const armBeatIntensity = soundIntensity;
  const armBeatDetected = safeSnareHit || (soundIntensity > 0.35) || beatDetected || 
                          (safeBassLevel > 0.4) || (safeHighMidLevel > 0.45);
  
  // Music is playing check - pause movement if no music
  const musicPlaying = analyserNode && audio && !audio.paused;
  const hasBeat = musicPlaying && (armBeatDetected || soundIntensity > 0.3); // Higher threshold
  
  // Reduced reactivity - LESS REACTIVE, requires stronger sound
  const beatReactivity = hasBeat ? soundIntensity * 2.0 : soundIntensity * 0.8; // Reduced multipliers
  const continuousReactivity = soundIntensity * 1.2; // Reduced continuous reaction
  
  for (let i = robots.length - 1; i >= 0; i--) {
    const robot = robots[i];
    
    robot.lifetime += deltaTime * 1000;
    
    // Keep opacity at 1.0 - no fading, no flashing
    robot.opacity = 1.0;
    robot.targetOpacity = 1.0;
    
    // Never fade out - robot stays forever
    // (removed fade-out logic)
    
    // Update arm angles (robotic movement) - DIRECTLY REACTIVE TO SOUND WITH SUDDEN STOPS
    // Each arm responds directly to different frequency bands - ONLY WHEN SOUND EXISTS!
    
    // Initialize comprehensive state machine - cycles through all possible appearances
    if (!robot.stopTimer1) robot.stopTimer1 = 0;
    if (!robot.stopTimer2) robot.stopTimer2 = 0;
    if (!robot.stopTimer3) robot.stopTimer3 = 0;
    if (!robot.lastStopStartTime) robot.lastStopStartTime = millis();
    if (!robot.isStopped) robot.isStopped = false;
    if (!robot.justStarted) robot.justStarted = false;
    if (!robot.startBoostTimer) robot.startBoostTimer = 0;
    if (!robot.currentPhaseDuration) robot.currentPhaseDuration = 10000;
    if (!robot.speedMultiplier) robot.speedMultiplier = 1.0;
    if (!robot.stateIndex) robot.stateIndex = 0;
    if (!robot.accumulatedStates) robot.accumulatedStates = 1;
    if (!robot.lastStateChangeTime) robot.lastStateChangeTime = millis();
    // Visual appearance properties
    if (!robot.visualHue) robot.visualHue = robot.hue || 200;
    if (!robot.visualScale) robot.visualScale = robot.scale || 3.9;
    if (!robot.visualSaturation) robot.visualSaturation = 70;
    if (!robot.visualLightness) robot.visualLightness = 60;
    
    // Check if there's ACTUAL sound detected (not just music playing)
    const hasActualSound = musicPlaying && soundIntensity > 0.01 && analyserNode;
    
    if (hasActualSound) {
      // Define ALL possible states with ALL possible appearances
      // Each state includes: speed, visual appearance (hue, scale, saturation, lightness)
      const allStates = [
        { 
          name: 'robot_default', 
          speedRange: [0.2, 0.6], 
          durationRange: [2000, 6000],
          hue: 200, saturation: 70, lightness: 60, scale: 3.9
        },
        { 
          name: 'robot_red', 
          speedRange: [0.001, 0.05], 
          durationRange: [4000, 10000],
          hue: 0, saturation: 100, lightness: 50, scale: 4.5
        },
        { 
          name: 'robot_blue', 
          speedRange: [0.05, 0.2], 
          durationRange: [3000, 8000],
          hue: 240, saturation: 80, lightness: 65, scale: 4.2
        },
        { 
          name: 'robot_green', 
          speedRange: [0.2, 0.6], 
          durationRange: [2000, 6000],
          hue: 120, saturation: 75, lightness: 55, scale: 4.0
        },
        { 
          name: 'robot_yellow', 
          speedRange: [0.6, 2.5], 
          durationRange: [1000, 5000],
          hue: 60, saturation: 90, lightness: 70, scale: 4.3
        },
        { 
          name: 'robot_purple', 
          speedRange: [2.5, 6.0], 
          durationRange: [1000, 5000],
          hue: 300, saturation: 85, lightness: 60, scale: 4.1
        },
        { 
          name: 'robot_cyan', 
          speedRange: [0.001, 0.05], 
          durationRange: [4000, 10000],
          hue: 180, saturation: 90, lightness: 70, scale: 4.4
        },
        { 
          name: 'robot_orange', 
          speedRange: [0.05, 0.2], 
          durationRange: [3000, 8000],
          hue: 30, saturation: 95, lightness: 60, scale: 4.6
        }
      ];
      // Get ALL frequency levels - use them directly for movement
      const subBass = safeSubBassLevel || 0;
      const lowBass = safeLowBassLevel || 0;
      const midBass = safeMidBassLevel || 0;
      const lowMid = safeLowMidLevel || 0;
      const midMid = safeMidMidLevel || 0;
      const highMid = safeHighMidLevel || 0;
      const bass = safeBassLevel || 0;
      const mid = safeMidLevel || 0;
      const treble = safeTrebleLevel || 0;
      const overall = safeOverallEnergy || 0;
      
      // Calculate current sound levels for each arm
      const arm1CurrentSound = subBass + lowBass + midBass;
      const arm2CurrentSound = lowMid + midMid + highMid + mid;
      const arm3CurrentSound = highMid + treble + safePresenceLevel;
      
      // STATE MACHINE SYSTEM: Cycles through ALL possible states with ALL appearances
      const currentTime = millis();
      const timeSinceLastCycle = currentTime - robot.lastStopStartTime;
      const MAX_DURATION = 10000; // Maximum 10000ms (10 seconds)
      const STATE_CHANGE_INTERVAL = 10000; // Change states every 10 seconds max
      
      // Check if we should change state (every 10 seconds max)
      const timeSinceLastStateChange = currentTime - robot.lastStateChangeTime;
      if (timeSinceLastStateChange >= STATE_CHANGE_INTERVAL) {
        // Move to next state in the cycle
        robot.stateIndex = (robot.stateIndex + 1) % robot.accumulatedStates;
        robot.lastStateChangeTime = currentTime;
        
        // Accumulate states: after completing a full cycle, add one more state
        if (robot.stateIndex === 0 && robot.accumulatedStates < allStates.length) {
          robot.accumulatedStates++; // Add one more state to the cycle
        }
      }
      
      // Get current state from the accumulated states
      const currentStateDef = allStates[robot.stateIndex];
      
      // Apply visual appearance from current state
      robot.visualHue = lerp(robot.visualHue || currentStateDef.hue, currentStateDef.hue, 0.1);
      robot.visualScale = lerp(robot.visualScale || currentStateDef.scale, currentStateDef.scale, 0.1);
      robot.visualSaturation = lerp(robot.visualSaturation || currentStateDef.saturation, currentStateDef.saturation, 0.1);
      robot.visualLightness = lerp(robot.visualLightness || currentStateDef.lightness, currentStateDef.lightness, 0.1);
      
      // Generate speed values from current state
      const currentState = {
        name: currentStateDef.name,
        multiplier: random(currentStateDef.speedRange[0], currentStateDef.speedRange[1]),
        duration: random(currentStateDef.durationRange[0], currentStateDef.durationRange[1])
      };
      
      // Check if we should toggle stop/start state based on current phase duration
      if (timeSinceLastCycle >= robot.currentPhaseDuration) {
        // Toggle state: if stopped, start; if moving, stop
        robot.isStopped = !robot.isStopped;
        robot.lastStopStartTime = currentTime; // Reset timer
        
        if (robot.isStopped) {
          // Start stopping - set stop timers
          robot.currentPhaseDuration = random(1000, MAX_DURATION);
          const stopDurationFrames = floor(robot.currentPhaseDuration / 16.67);
          robot.stopTimer1 = stopDurationFrames;
          robot.stopTimer2 = stopDurationFrames;
          robot.stopTimer3 = stopDurationFrames;
          robot.justStarted = false;
        } else {
          // Start moving - use current state's speed multiplier
          robot.speedMultiplier = currentState.multiplier;
          robot.currentPhaseDuration = currentState.duration;
          
          // Clear stop timers and trigger start boost
          robot.stopTimer1 = 0;
          robot.stopTimer2 = 0;
          robot.stopTimer3 = 0;
          robot.justStarted = true;
          robot.startBoostTimer = 30;
        }
      }
      
      // Update stop timers (countdown when stopping)
      if (robot.isStopped) {
        if (robot.stopTimer1 > 0) robot.stopTimer1--;
        if (robot.stopTimer2 > 0) robot.stopTimer2--;
        if (robot.stopTimer3 > 0) robot.stopTimer3--;
      } else {
        // When moving, ensure timers are 0
        robot.stopTimer1 = 0;
        robot.stopTimer2 = 0;
        robot.stopTimer3 = 0;
      }
      
      // Update start boost timer
      if (robot.startBoostTimer > 0) {
        robot.startBoostTimer--;
      } else {
        robot.justStarted = false;
      }
      
      // Check if arms just started (transition from stopped to moving)
      const wasStopped = robot.stopTimer1 > 0 || robot.stopTimer2 > 0 || robot.stopTimer3 > 0;
      const isNowMoving = robot.stopTimer1 === 0 && robot.stopTimer2 === 0 && robot.stopTimer3 === 0;
      if (wasStopped && isNowMoving && !robot.justStarted) {
        robot.justStarted = true;
        robot.startBoostTimer = 30;
      }
      
      // SPEED VARIATION: Random speed multiplier is the PRIMARY factor for visible variation
      // Make base speed VERY LOW so slow motion is DRAMATICALLY visible
      const baseSpeedMultiplier = 0.25; // Even lower base so slow motion is VERY obvious
      
      // START BOOST: Minimal boost so slow motion isn't masked
      const startBoost = robot.justStarted ? 1.1 : 1.0; // Very small boost (was 1.2)
      
      // RANDOM SPEED MULTIPLIER: This is the PRIMARY speed control - varies dramatically
      const randomSpeedMultiplier = robot.speedMultiplier || 1.0; // Random speed for this movement phase (0.001x to 6.0x)
      
      // Each arm speed is DIRECTLY controlled by randomSpeedMultiplier for maximum variation
      // Apply stop timers - if timer > 0, speed is 0 (COMPLETELY STOPPED)
      // When not stopped, randomSpeedMultiplier is the main factor (0.001x to 6.0x range)
      // REMOVE frequency-based multipliers for slow motion to be more obvious
      // Use ONLY randomSpeedMultiplier for maximum slow motion visibility
      // For slow motion, make it EVEN MORE OBVIOUS by reducing base further
      const effectiveBaseSpeed = randomSpeedMultiplier < 0.2 ? baseSpeedMultiplier * 0.5 : baseSpeedMultiplier; // Extra slow for very slow speeds
      const arm1SpeedMultiplier = robot.stopTimer1 > 0 ? 0 : 
        effectiveBaseSpeed * startBoost * randomSpeedMultiplier;
      const arm2SpeedMultiplier = robot.stopTimer2 > 0 ? 0 : 
        effectiveBaseSpeed * startBoost * randomSpeedMultiplier;
      const arm3SpeedMultiplier = robot.stopTimer3 > 0 ? 0 : 
        effectiveBaseSpeed * startBoost * randomSpeedMultiplier;
      
      // Beat detection adds MINIMAL speed boost (so slow motion isn't masked)
      const beatSpeedBoost = (beatDetected && robot.stopTimer1 === 0 && robot.stopTimer2 === 0 && robot.stopTimer3 === 0) ? 
        1.2 : 1.0; // Very small boost (was 3.0-7.0) so slow motion is visible
      
      // Time patterns with EXTREME SPEED VARIATION - can go to 0 (stopped) or very fast
      // Use slower base pattern so slow motion is MORE VISIBLE
      const timePatternBase = robot.lifetime * 0.0015; // Slower base (was 0.004) for better slow motion visibility
      const timePattern1 = timePatternBase * max(0, arm1SpeedMultiplier) * beatSpeedBoost;
      const timePattern2 = timePatternBase * max(0, arm2SpeedMultiplier) * beatSpeedBoost;
      const timePattern3 = timePatternBase * max(0, arm3SpeedMultiplier) * beatSpeedBoost;
      
      // ARM 1: Movement STOPS COMPLETELY when stopTimer1 > 0
      // SIMPLIFIED: Use ONLY time patterns with speed multiplier for maximum slow motion visibility
      if (robot.stopTimer1 === 0) {
        // Minimal guaranteed movement (only on start) so slow motion isn't masked
        if (robot.justStarted) {
          robot.armAngle1 += 0.1 * startBoost; // Small jump when just started
        }
        // Simple wave patterns - speed is controlled ONLY by arm1SpeedMultiplier
        robot.armAngle1 += sin(timePattern1 * 1.2) * arm1SpeedMultiplier * 0.3;
        robot.armAngle1 += cos(timePattern1 * 2.1) * arm1SpeedMultiplier * 0.2;
        // Add small frequency-reactive movement (scaled by speed multiplier)
        robot.armAngle1 += (subBass + lowBass) * 0.2 * arm1SpeedMultiplier;
      }
      // When stopped, arm stays frozen (no movement)
      
      // ARM 2: Movement STOPS COMPLETELY when stopTimer2 > 0
      if (robot.stopTimer2 === 0) {
        // Minimal guaranteed movement (only on start) so slow motion isn't masked
        if (robot.justStarted) {
          robot.armAngle2 += 0.12 * startBoost; // Small jump when just started
        }
        // Simple wave patterns - speed is controlled ONLY by arm2SpeedMultiplier
        robot.armAngle2 += cos(timePattern2 * 1.5) * arm2SpeedMultiplier * 0.3;
        robot.armAngle2 += sin(timePattern2 * 2.3) * arm2SpeedMultiplier * 0.25;
        // Add small frequency-reactive movement (scaled by speed multiplier)
        robot.armAngle2 += (midMid + highMid) * 0.2 * arm2SpeedMultiplier;
      }
      
      // ARM 3: Movement STOPS COMPLETELY when stopTimer3 > 0
      if (robot.stopTimer3 === 0) {
        // Minimal guaranteed movement (only on start) so slow motion isn't masked
        if (robot.justStarted) {
          robot.armAngle3 += 0.1 * startBoost; // Small jump when just started
        }
        // Simple wave patterns - speed is controlled ONLY by arm3SpeedMultiplier
        robot.armAngle3 += sin(timePattern3 * 1.8) * arm3SpeedMultiplier * 0.3;
        robot.armAngle3 += cos(timePattern3 * 2.5) * arm3SpeedMultiplier * 0.25;
        // Add small frequency-reactive movement (scaled by speed multiplier)
        robot.armAngle3 += (treble + safePresenceLevel) * 0.2 * arm3SpeedMultiplier;
      }
      
      // ALL ARMS: React to OVERALL ENERGY (only when not stopped)
      if (overall > 0.01 && robot.stopTimer1 === 0 && robot.stopTimer2 === 0 && robot.stopTimer3 === 0) {
        const overallReaction = overall * 2.0;
        const overallSpeed = baseSpeedMultiplier * (1.0 + overall * 2.0);
        robot.armAngle1 += overallReaction * 0.5 * sin(timePattern1 * 3) * overallSpeed;
        robot.armAngle2 += overallReaction * 0.6 * cos(timePattern2 * 3.2) * overallSpeed;
        robot.armAngle3 += overallReaction * 0.5 * sin(timePattern3 * 2.8) * overallSpeed;
      }
      
      // BEAT DETECTION: Extra boost on beats (only when not stopped)
      if (beatDetected && soundIntensity > 0.01 && robot.stopTimer1 === 0 && robot.stopTimer2 === 0 && robot.stopTimer3 === 0) {
        const beatStrength = (soundIntensity + overall) * 2.5;
        const beatSpeed = beatSpeedBoost * (1.0 + soundIntensity * 1.5);
        robot.armAngle1 += beatStrength * 1.2 * random(0.7, 1.5) * beatSpeed;
        robot.armAngle2 += beatStrength * 1.5 * random(0.7, 1.5) * beatSpeed;
        robot.armAngle3 += beatStrength * 1.2 * random(0.7, 1.5) * beatSpeed;
      }
      
      // CONTINUOUS REACTIVE MOVEMENT: Only when not stopped
      if (robot.stopTimer1 === 0 && (bass > 0.01 || subBass > 0.01)) {
        const bassSpeed = arm1SpeedMultiplier * (0.5 + (bass + subBass) * 2.0);
        robot.armAngle1 += (bass + subBass) * 0.4 * sin(timePattern1 * 0.8) * bassSpeed;
      }
      if (robot.stopTimer2 === 0 && (mid > 0.01 || midMid > 0.01)) {
        const midSpeed = arm2SpeedMultiplier * (0.5 + (mid + midMid) * 1.8);
        robot.armAngle2 += (mid + midMid) * 0.45 * cos(timePattern2 * 1.1) * midSpeed;
      }
      if (robot.stopTimer3 === 0 && (treble > 0.01 || highMid > 0.01)) {
        const trebleSpeed = arm3SpeedMultiplier * (0.5 + (treble + highMid) * 1.5);
        robot.armAngle3 += (treble + highMid) * 0.4 * sin(timePattern3 * 0.9) * trebleSpeed;
      }
      
    } else {
      // COMPLETELY FROZEN: No movement when no music or no sound detected
      // Reset stop timers
      robot.stopTimer1 = 0;
      robot.stopTimer2 = 0;
      robot.stopTimer3 = 0;
      robot.lastArm1Sound = 0;
      robot.lastArm2Sound = 0;
      robot.lastArm3Sound = 0;
      // Arms stay in current position - frozen until actual sound plays
      // No movement code - completely still
    }
    
    // NO BOUNCE: Robot stays at fixed position
    robot.y = robot.baseY; // Always stay at base position - no bouncing
    
    // Draw robot if visible
    if (robot.opacity > 0.01) {
      push();
      translate(robot.x, robot.y);
      scale(robot.scale);
      
      colorMode(HSL);
      // Use robot's own hue (each robot has distinct color)
      const robotHue = robot.hue || 200;
      
      // Robot reactivity to high-mid/treble frequencies (using variables already declared above)
      const robotReactivity = analyserNode ? (safeHighMidLevel * 0.6 + safePresenceLevel * 0.4) : 0.3;
      
      // Robot visual properties
      const robotSat = robot.visualSaturation || 70;
      const robotLight = robot.visualLightness || 60;
      
      // Robot base/pedestal - Use visual appearance from state
      fill(robotHue, robotSat, robotLight, robot.opacity);
      stroke(0, 0, 0, robot.opacity);
      strokeWeight(4);
      rectMode(CENTER);
      rect(0, 20, 50, 30);
      
      // Main body/torso - Use visual appearance from state
      fill(robotHue, robotSat + 5, robotLight + 5, robot.opacity);
      stroke(0, 0, 0, robot.opacity);
      strokeWeight(4);
      rect(0, 0, 40, 50);
      
      // Robot head - Use visual appearance from state
      fill(robotHue, robotSat, robotLight + 10, robot.opacity);
      stroke(0, 0, 0, robot.opacity); // Full opacity black outline
      strokeWeight(4); // Thicker outline
      ellipse(0, -35, 35, 35); // Larger head
      
      // Eyes (RED and MUSIC-DRIVEN PULSATING) - ONLY pulsates when music is playing
      // Pulsating ONLY driven by music
      const pulsePhase = musicPlaying && soundIntensity > 0.05 ? 
        robot.lifetime * (0.008 + soundIntensity * 0.01) : robot.lifetime * 0.005; // Slower when no music
      const musicPulse = musicPlaying && soundIntensity > 0.05 ? soundIntensity * 1.2 : 0; // Only when music plays
      const bassPulse = musicPlaying && safeBassLevel > 0.05 ? safeBassLevel * 0.8 : 0; // Only when music plays
      const treblePulse = musicPlaying && safeTrebleLevel > 0.05 ? safeTrebleLevel * 0.6 : 0; // Only when music plays
      const basePulse = musicPlaying ? sin(pulsePhase) * 0.3 + 0.7 : 0.7; // Minimal pulse when no music
      const combinedPulse = basePulse + musicPulse + bassPulse + treblePulse; // Combine music-driven reactions
      
      // Eye size - HIGHLY RESPONSIVE PULSATING
      const baseEyeSize = 8;
      const pulseSize = baseEyeSize + (sin(pulsePhase) * 4) + (musicPulse * 5) + (bassPulse * 3); // Strong pulsating
      const eyeSize = Math.max(6, Math.min(20, pulseSize)); // Clamp between 6 and 20 (larger range)
      
      // Eye glow intensity - HIGHLY RESPONSIVE
      const eyeGlow = Math.max(0.7, Math.min(1.0, combinedPulse)); // Strong pulsating glow
      
      // Eye glow effect - RED glow around eyes (HIGHLY RESPONSIVE)
      const glowSize = 15 + (sin(pulsePhase) * 7) + (musicPulse * 8) + (bassPulse * 5); // Strong pulsating glow
      fill(0, 100, 60, robot.opacity * eyeGlow * 0.6); // Red glow (hue 0 = red), brighter
      noStroke();
      ellipse(-8, -35, glowSize, glowSize); // Highly responsive pulsating glow
      ellipse(8, -35, glowSize, glowSize);
      
      // Eyes - BRIGHT RED, HIGHLY RESPONSIVE PULSATING
      const eyeBrightness = 75 + (sin(pulsePhase) * 25) + (musicPulse * 15) + (bassPulse * 10); // Strong pulsating brightness
      fill(0, 100, Math.min(100, eyeBrightness), robot.opacity * eyeGlow); // Bright red, highly responsive
      noStroke();
      ellipse(-8, -35, eyeSize, eyeSize); // Highly responsive pulsating eyes
      ellipse(8, -35, eyeSize, eyeSize);
      
      // Eye core - brighter red center (HIGHLY RESPONSIVE)
      const coreSize = eyeSize * (0.5 + sin(pulsePhase) * 0.3 + musicPulse * 0.2); // Strong pulsating core
      fill(0, 100, 100, robot.opacity * Math.max(eyeGlow, 0.95)); // Maximum brightness red core
      ellipse(-8, -35, coreSize, coreSize); // Highly responsive pulsating bright core
      ellipse(8, -35, coreSize, coreSize);
      
      // Left arm (shoulder to elbow) - Use visual appearance from state
      stroke(robotHue, robotSat, robotLight - 5, robot.opacity);
      strokeWeight(6);
      const arm1Length = 40;
      const arm1X = cos(robot.armAngle1) * arm1Length;
      const arm1Y = sin(robot.armAngle1) * arm1Length;
      line(0, -15, arm1X, arm1Y - 15);
      
      // Left forearm (elbow to hand)
      const arm2Angle = robot.armAngle1 + robot.armAngle2;
      const arm2Length = 35;
      const arm2X = arm1X + cos(arm2Angle) * arm2Length;
      const arm2Y = arm1Y - 15 + sin(arm2Angle) * arm2Length;
      line(arm1X, arm1Y - 15, arm2X, arm2Y);
      
      // Left hand/gripper - Use visual appearance from state
      fill(robotHue, robotSat - 10, robotLight - 10, robot.opacity);
      stroke(0, 0, 0, robot.opacity);
      strokeWeight(3);
      ellipse(arm2X, arm2Y, 15, 15);
      // Gripper fingers
      stroke(robotHue, robotSat - 20, robotLight - 20, robot.opacity);
      strokeWeight(3);
      line(arm2X - 5, arm2Y, arm2X - 10, arm2Y - 5);
      line(arm2X + 5, arm2Y, arm2X + 10, arm2Y - 5);
      
      // Right arm (shoulder to elbow) - Use visual appearance from state
      stroke(robotHue, robotSat, robotLight - 5, robot.opacity);
      strokeWeight(6);
      const arm3X = cos(robot.armAngle3) * arm1Length;
      const arm3Y = sin(robot.armAngle3) * arm1Length;
      line(0, -15, arm3X, arm3Y - 15);
      
      // Right forearm
      const arm4Angle = robot.armAngle3 + robot.armAngle2;
      const arm4X = arm3X + cos(arm4Angle) * arm2Length;
      const arm4Y = arm3Y - 15 + sin(arm4Angle) * arm2Length;
      line(arm3X, arm3Y - 15, arm4X, arm4Y);
      
      // Right hand/gripper - Use visual appearance from state
      fill(robotHue, robotSat - 10, robotLight - 10, robot.opacity);
      stroke(0, 0, 0, robot.opacity);
      strokeWeight(3);
      ellipse(arm4X, arm4Y, 15, 15);
      // Gripper fingers
      stroke(robotHue, robotSat - 20, robotLight - 20, robot.opacity);
      strokeWeight(3);
      line(arm4X - 5, arm4Y, arm4X - 10, arm4Y - 5);
      line(arm4X + 5, arm4Y, arm4X + 10, arm4Y - 5);
      
      // Joints (elbows and shoulders) - Use visual appearance from state
      fill(robotHue, robotSat - 10, robotLight - 5, robot.opacity);
      stroke(0, 0, 0, robot.opacity);
      strokeWeight(2);
      ellipse(0, -15, 10, 10);
      ellipse(arm1X, arm1Y - 15, 8, 8);
      ellipse(arm3X, arm3Y - 15, 8, 8);
      
      // Industrial details - control panel on chest - Use visual appearance from state
      fill(robotHue, robotSat - 20, robotLight + 15, robot.opacity);
      stroke(0, 0, 0, robot.opacity);
      strokeWeight(2);
      rect(0, -8, 25, 15);
      
      // Display robot name in chest box - REACTIVE TO SOUND
      if (robot.name) {
        // Sound-reactive text effects
        const nameSoundIntensity = analyserNode ? soundIntensity : 0.3;
        const nameBassPulse = analyserNode ? safeBassLevel : 0.2;
        const nameTreblePulse = analyserNode ? safeTrebleLevel : 0.2;
        const nameBeatPulse = beatDetected ? 1.5 : 1.0;
        
        // Pulsing text size based on sound (base 4, pulses up to 7)
        const baseTextSize = 4;
        const pulseAmount = nameSoundIntensity * 2.5 + nameBassPulse * 2 + nameTreblePulse * 1.5;
        const dynamicTextSize = baseTextSize + pulseAmount * nameBeatPulse;
        
        // Color shifts with sound - starts at robot's hue, shifts with bass/treble
        const nameHueShift = analyserNode ? 
          (robotHue + nameBassPulse * 40 + nameTreblePulse * 30) % 360 : robotHue;
        const nameSaturation = Math.min(100, 70 + nameSoundIntensity * 30); // More saturated with sound
        const nameLightness = Math.min(95, 40 + nameSoundIntensity * 40 + nameBassPulse * 25); // Brighter with sound
        
        // Text glow effect - stronger with beats
        const glowIntensity = Math.min(1, nameSoundIntensity * 0.8 + nameBassPulse * 0.5);
        
        textAlign(CENTER, CENTER);
        
        // Draw glow effect behind text (multiple layers for depth and pulsing effect)
        for (let glow = 4; glow >= 1; glow--) {
          const glowSize = dynamicTextSize + glow * 0.8;
          const glowAlpha = robot.opacity * glowIntensity * (glow / 4) * 0.4;
          textSize(glowSize);
          fill(nameHueShift, nameSaturation, nameLightness, glowAlpha);
          noStroke();
          text(robot.name, 0, -8);
        }
        
        // Draw text outline (black background for contrast) - draw in multiple directions
        textSize(dynamicTextSize);
        fill(0, 0, 0, robot.opacity * 0.9);
        noStroke();
        // Draw outline by drawing text slightly offset in 8 directions
        const outlineOffset = 0.3;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx !== 0 || dy !== 0) {
              text(robot.name, dx * outlineOffset, -8 + dy * outlineOffset);
            }
          }
        }
        
        // Main text (colorful and reactive)
        fill(nameHueShift, nameSaturation, nameLightness, robot.opacity);
        noStroke();
        text(robot.name, 0, -8);
      }
      
      // LED indicators - Use visual appearance from state
      const ledBrightness = Math.max(0.7, 0.5 + robotReactivity * 0.5);
      fill(robotHue, 100, 90, robot.opacity * ledBrightness);
      noStroke();
      ellipse(-6, -8, 4, 4); // Larger LEDs
      ellipse(0, -8, 4, 4);
      ellipse(6, -8, 4, 4);
      
      // LED glow effect - MORE VISIBLE
      fill(robotHue, 100, 95, robot.opacity * ledBrightness * 0.4);
      ellipse(-6, -8, 10, 10); // Glow around LEDs
      ellipse(0, -8, 10, 10);
      ellipse(6, -8, 10, 10);
      
      pop();
    }
  }
  
  // Update lastBeatTime for next frame
  if (beatDetected) {
    lastBeatTime = currentTime;
  }
  
  colorMode(HSL);
}

function drawVintageCars() {
  if (vintageCars === undefined) {
    initializeVintageCars();
  }
  
  // Dynamic car spawning based on music beats and energy
  if (analyserNode) {
    // Cars react to low-bass and mid-bass (engine sounds)
    const carBassLevel = (lowBassLevel * 0.6 + midBassLevel * 0.4); // Engine frequency range
    if (!window.lastCarBassLevel) window.lastCarBassLevel = 0;
    const carBassChange = carBassLevel - window.lastCarBassLevel;
    const carBeatDetected = carBassChange > 0.15 && carBassLevel > 0.4;
    window.lastCarBassLevel = carBassLevel;
    
    // Progressive car spawning - cars appear gradually over time
    // Use progressive maxCars limit (starts at 1, increases over time)
    if (vintageCars.length < maxCars) {
      const timeSinceLastSpawn = millis() - lastCarSpawnTime;
      // Spawn interval decreases as more cars are added (faster spawning)
      const baseSpawnInterval = 10000; // 10 seconds base interval
      const spawnInterval = baseSpawnInterval - (vintageCars.length * 800); // Faster as more cars exist
      const minSpawnInterval = 4000; // Minimum 4 seconds
      const actualSpawnInterval = Math.max(minSpawnInterval, spawnInterval);
      
      // Music energy can trigger faster spawning
      const energyBoost = overallEnergy > 0.3 ? (overallEnergy - 0.3) * 0.5 : 0;
      const adjustedInterval = actualSpawnInterval * (1 - energyBoost);
      
      // Spawn if enough time has passed
      if (timeSinceLastSpawn > adjustedInterval) {
        spawnVintageCar();
        lastCarSpawnTime = millis();
      }
    }
    
    // Explode cars on strong beats - more dramatic!
    if (carBeatDetected && carBassLevel > 0.5 && vintageCars.length > 0) {
      // Higher chance with stronger bass
      const explodeChance = map(carBassLevel, 0.5, 1.0, 0.2, 0.8);
      if (random() < explodeChance) {
        // Explode 1-2 cars on strong beats
        const carsToExplode = carBassLevel > 0.7 ? 2 : 1;
        for (let ex = 0; ex < carsToExplode && vintageCars.length > 0; ex++) {
          const carToExplode = vintageCars[Math.floor(random(vintageCars.length))];
          createCarExplosion(carToExplode.x, carToExplode.y, false);
          vintageCars.splice(vintageCars.indexOf(carToExplode), 1);
        }
      }
    }
    
    // Also randomly explode cars when energy is very high
    if (overallEnergy > 0.7 && vintageCars.length > 2 && random() < 0.01) {
      const carToExplode = vintageCars[Math.floor(random(vintageCars.length))];
      createCarExplosion(carToExplode.x, carToExplode.y, false);
      vintageCars.splice(vintageCars.indexOf(carToExplode), 1);
    }
  } else {
    // Even without music, maintain some cars
    if (vintageCars.length < 3 && millis() % 5000 < 100) { // Spawn every 5 seconds
      spawnVintageCar();
      if (vintageCars.length > 0) {
        vintageCars[vintageCars.length - 1].opacity = 1;
        vintageCars[vintageCars.length - 1].targetOpacity = 1;
      }
    }
  }
  
  // Update and draw explosion particles (only if explosions are enabled)
  if (!showExplosions) {
    carExplosions = [];
  } else {
    for (let e = carExplosions.length - 1; e >= 0; e--) {
    const explosion = carExplosions[e];
    explosion.lifetime += deltaTime * 60;
    
    // Update particle position
    explosion.x += explosion.vx * deltaTime;
    explosion.y += explosion.vy * deltaTime;
    explosion.vy += (explosion.isSpawn ? 0.1 : 0.3) * deltaTime; // Gravity (less for spawn)
    
    // Update rotation
    if (explosion.rotation !== undefined) {
      explosion.rotation += explosion.rotationSpeed;
    }
    
    // Fade out with easing
    const progress = explosion.lifetime / explosion.maxLifetime;
    const alpha = 1 - progress;
    const sizeMultiplier = explosion.isSpawn ? 1 + progress * 0.5 : 1 + sin(progress * PI) * 0.5;
    
    if (explosion.lifetime > explosion.maxLifetime || alpha <= 0) {
      carExplosions.splice(e, 1);
      continue;
    }
    
    // Draw explosion particle
    push();
    translate(explosion.x, explosion.y);
    if (explosion.rotation !== undefined) {
      rotate(explosion.rotation);
    }
    colorMode(HSL);
    
    // Outer glow (more dramatic)
    const glowSize = explosion.size * sizeMultiplier * 2.5;
    fill(explosion.hue, explosion.saturation || 80, explosion.lightness || 60, alpha * 0.3);
    noStroke();
    ellipse(0, 0, glowSize, glowSize);
    
    // Middle glow
    fill(explosion.hue, (explosion.saturation || 80) + 10, (explosion.lightness || 60) + 20, alpha * 0.5);
    ellipse(0, 0, explosion.size * sizeMultiplier * 1.5, explosion.size * sizeMultiplier * 1.5);
    
    // Main particle
    fill(explosion.hue, explosion.saturation || 80, explosion.lightness || 60, alpha);
    ellipse(0, 0, explosion.size * sizeMultiplier, explosion.size * sizeMultiplier);
    
    // Bright core
    fill(explosion.hue, 100, 90, alpha * 0.8);
    ellipse(0, 0, explosion.size * sizeMultiplier * 0.4, explosion.size * sizeMultiplier * 0.4);
    
    pop();
    }
  }
  
  // Draw road lane markings for different levels
  colorMode(HSL);
  const baseRoadY = height * 0.85;
  const laneCount = 3;
  const laneSpacing = 40;
  
  // Draw lane dividers (dashed lines)
  stroke(200, 30, 60, 0.4);
  strokeWeight(2);
  for (let lane = 0; lane < laneCount - 1; lane++) {
    const laneY = baseRoadY + (lane * laneSpacing) - (laneCount - 1) * laneSpacing / 2 + laneSpacing / 2;
    // Dashed line effect
    for (let x = 0; x < width; x += 20) {
      line(x, laneY, x + 10, laneY);
    }
  }
  
  for (let i = vintageCars.length - 1; i >= 0; i--) {
    const car = vintageCars[i];
    
    // Initialize opacity if needed
    if (car.opacity === undefined) car.opacity = 1;
    if (car.targetOpacity === undefined) car.targetOpacity = 1;
    if (car.lifetime === undefined) car.lifetime = 0;
    
    // Update lifetime
    car.lifetime += deltaTime * 60;
    
    // Fade in when spawning
    car.opacity = lerp(car.opacity, car.targetOpacity, 0.1);
    
    // Randomly fade out cars (explode) based on music
    if (analyserNode && bassLevel > 0.5 && random() < 0.001) {
      car.targetOpacity = 0;
      // Scale up before exploding
      if (car.opacity > 0.5) {
        car.scale = lerp(car.scale, car.scale * 1.2, 0.1);
      }
      if (car.opacity < 0.1) {
        createCarExplosion(car.x, car.y, false);
        vintageCars.splice(i, 1);
        continue;
      }
    }
    
    // Don't draw if too transparent
    if (car.opacity < 0.05) continue;
    
    // Explosion warning effect - pulse before exploding
    if (car.targetOpacity < 0.5 && car.opacity > 0.3) {
      const warningPulse = sin(car.explosionPhase * 10) * 0.3 + 0.7;
      car.scale = lerp(car.scale, car.scale * (1 + warningPulse * 0.1), 0.2);
      car.explosionPhase += deltaTime * 2;
    }
    
    // Speed reacts to low-bass/mid-bass (engine frequencies)
    const carBassLevel = (lowBassLevel * 0.6 + midBassLevel * 0.4);
    const speedMultiplier = analyserNode ? 1 + carBassLevel * 0.4 : 1;
    const beatBoost = (carBassLevel - car.lastBassLevel) > 0.1 ? 1.3 : 1.0;
    car.lastBassLevel = carBassLevel;
    
    // Update car position
    car.x += car.speed * speedMultiplier * beatBoost * car.direction;
    
    // Update wheel rotation
    car.wheelRotation += car.speed * speedMultiplier * 0.1;
    
    // Loop cars
    if (car.direction === 1 && car.x > width + 150) {
      car.x = -150;
    } else if (car.direction === -1 && car.x < -150) {
      car.x = width + 150;
    }
    
    // Vertical bounce with engine bass
    car.phase += deltaTime * (0.3 + carBassLevel * 0.2);
    const verticalBounce = sin(car.phase) * carBassLevel * 3;
    car.y = car.baseY - verticalBounce;
    
    // Color shifts slightly with music
    car.hue = damp(car.hue, (currentHue + i * 40) % 360, 0.02, deltaTime);
    
    // Draw 1950s car with opacity
    push();
    translate(car.x, car.y);
    scale(car.scale);
    
    // Flip car if going left
    if (car.direction === -1) {
      scale(-1, 1);
    }
    
    colorMode(HSL);
    
    // Explosion glow effect when spawning (fade in)
    if (car.opacity < 1 && car.targetOpacity === 1) {
      const spawnGlow = (1 - car.opacity) * 2;
      fill(car.hue, 90, 80, spawnGlow * 0.6);
      noStroke();
      ellipse(0, 0, 100 * spawnGlow, 100 * spawnGlow);
    }
    
    // Car body - classic 50s style with fins (with opacity)
    fill(car.hue, car.saturation, car.lightness, 0.95 * car.opacity);
    stroke(0, 0, 0, 0.8 * car.opacity);
    strokeWeight(2);
    
    // Main body (rounded, elongated)
    rectMode(CENTER);
    beginShape();
    // Top curve
    vertex(-35, -8);
    bezierVertex(-35, -12, -20, -15, 0, -15);
    bezierVertex(20, -15, 35, -12, 35, -8);
    // Right side
    vertex(35, 8);
    // Bottom curve
    bezierVertex(35, 12, 20, 15, 0, 15);
    bezierVertex(-20, 15, -35, 12, -35, 8);
    endShape(CLOSE);
    
    // Rear fins (classic 50s feature)
    fill(car.hue, car.saturation * 0.9, car.lightness * 0.8, 0.95 * car.opacity);
    triangle(30, -8, 40, -15, 30, 0);
    triangle(30, 8, 40, 15, 30, 0);
    
    // Windshield
    fill(car.hue, car.saturation * 0.3, car.lightness + 20, 0.7 * car.opacity);
    noStroke();
    beginShape();
    vertex(-25, -8);
    bezierVertex(-25, -12, -10, -14, 5, -14);
    bezierVertex(15, -14, 25, -12, 25, -8);
    vertex(25, -5);
    bezierVertex(15, -7, 5, -7, -10, -7);
    bezierVertex(-20, -7, -25, -5, -25, -8);
    endShape(CLOSE);
    
    // Windshield frame
    stroke(0, 0, 0, 0.6 * car.opacity);
    strokeWeight(1.5);
    noFill();
    beginShape();
    vertex(-25, -8);
    bezierVertex(-25, -12, -10, -14, 5, -14);
    bezierVertex(15, -14, 25, -12, 25, -8);
    endShape();
    
    // Side windows
    fill(car.hue, car.saturation * 0.2, car.lightness + 15, 0.6 * car.opacity);
    noStroke();
    rect(-5, -10, 12, 8);
    rect(10, -10, 12, 8);
    
    // Chrome details
    fill(200, 20, 70, 0.9 * car.opacity);
    noStroke();
    // Front bumper
    rect(-38, 0, 6, 3);
    // Rear bumper
    rect(38, 0, 6, 3);
    // Side chrome strip
    stroke(200, 30, 75, 0.8 * car.opacity);
    strokeWeight(1.5);
    line(-30, 0, 30, 0);
    
    // Headlights (glow with bass)
    const headlightGlow = 0.4 + bassLevel * 0.6;
    fill(car.hue, car.saturation * 0.5, 80, headlightGlow * car.opacity);
    noStroke();
    ellipse(-38, -3, 5, 5);
    ellipse(-38, 3, 5, 5);
    
    // Taillights
    fill(0, 80, 50, 0.9 * car.opacity);
    ellipse(38, -3, 4, 4);
    ellipse(38, 3, 4, 4);
    
    // Wheels
    fill(50, 20, 25, 0.9 * car.opacity);
    stroke(0, 0, 0, 0.8 * car.opacity);
    strokeWeight(2);
    
    // Front wheels
    push();
    translate(-20, 12);
    rotate(car.wheelRotation);
    ellipse(0, 0, 12, 12);
    // Wheel spokes
    stroke(0, 0, 0, 0.6 * car.opacity);
    strokeWeight(1);
    line(-6, 0, 6, 0);
    line(0, -6, 0, 6);
    pop();
    
    // Rear wheels
    push();
    translate(20, 12);
    rotate(car.wheelRotation);
    ellipse(0, 0, 12, 12);
    // Wheel spokes
    stroke(0, 0, 0, 0.6 * car.opacity);
    strokeWeight(1);
    line(-6, 0, 6, 0);
    line(0, -6, 0, 6);
    pop();
    
    // Hubcaps (chrome)
    fill(200, 20, 75, 0.9 * car.opacity);
    noStroke();
    ellipse(-20, 12, 6, 6);
    ellipse(20, 12, 6, 6);
    
    // Grille (front)
    stroke(0, 0, 0, 0.7 * car.opacity);
    strokeWeight(1);
    noFill();
    for (let g = -3; g <= 3; g++) {
      line(-38, g * 1.5, -35, g * 1.5);
    }
    
    // License plate
    fill(200, 10, 60, 0.8 * car.opacity);
    stroke(0, 0, 0, 0.6 * car.opacity);
    strokeWeight(1);
    rect(38, 0, 8, 4);
    fill(0, 0, 0, 0.9 * car.opacity);
    noStroke();
    textSize(3);
    textAlign(CENTER, CENTER);
    text("DET", 38, 0);
    
    pop();
  }
  
  colorMode(HSL);
}

function spawnICECar() {
  // ICE surveillance vehicle - white with official look
  const laneCount = 3;
  const laneSpacing = 40;
  const baseRoadY = height * 0.85;
  
  const direction = random() > 0.5 ? 1 : -1;
  const spawnX = random() > 0.5 ? 
    (direction === 1 ? random(-200, -50) : random(width + 50, width + 200)) :
    random(0, width);
  
  const laneIndex = Math.floor(random(laneCount));
  const laneY = baseRoadY + (laneIndex * laneSpacing) - (laneCount - 1) * laneSpacing / 2;
  
  iceCars.push({
    x: spawnX,
    y: laneY,
    baseY: laneY,
    lane: laneIndex,
    direction: direction,
    speed: random(0.3, 0.5), // Slower, more deliberate movement
    scale: random(1.8, 2.2) * 1.3,
    phase: random(0, TWO_PI),
    wheelRotation: 0,
    lastBassLevel: 0,
    opacity: 1,
    targetOpacity: 1,
    lifetime: 0,
    lightPhase: 0 // For flashing lights
  });
}

function drawICECars() {
  if (!iceCars || iceCars.length === 0) return;
  
  if (!deltaTime) deltaTime = 0.016;
  
  // Spawn ICE cars occasionally
  if (iceCars.length < 2 && random() < 0.001) { // Rare spawn
    spawnICECar();
  }
  
  for (let i = iceCars.length - 1; i >= 0; i--) {
    const car = iceCars[i];
    
    if (!car) {
      iceCars.splice(i, 1);
      continue;
    }
    
    // Update car position - smooth movement like vintage cars
    const carBassLevel = analyserNode ? (bassLevel || 0) : 0;
    const speedMultiplier = analyserNode ? 1 + carBassLevel * 0.2 : 1;
    // Use same movement calculation as vintage cars for consistency
    car.x += car.speed * speedMultiplier * car.direction;
    
    // Update wheel rotation
    car.wheelRotation += car.speed * speedMultiplier * 0.1;
    
    // Update light phase for flashing lights
    if (deltaTime) {
      car.lightPhase += deltaTime * 5;
    } else {
      car.lightPhase += 0.016 * 5;
    }
    
    // Loop cars smoothly
    if (car.direction === 1 && car.x > width + 150) {
      car.x = -150;
    } else if (car.direction === -1 && car.x < -150) {
      car.x = width + 150;
    }
    
    // Vertical bounce
    car.phase += deltaTime * 0.2;
    const verticalBounce = sin(car.phase) * 1;
    car.y = car.baseY - verticalBounce;
    
    // Draw ICE surveillance vehicle
    push();
    translate(car.x, car.y);
    scale(car.scale);
    
    // Flip car if going left
    if (car.direction === -1) {
      scale(-1, 1);
    }
    
    colorMode(HSL);
    
    // Car body - white surveillance vehicle
    fill(0, 0, 95, car.opacity); // White
    stroke(0, 0, 0, 0.8 * car.opacity);
    strokeWeight(2);
    
    // Main body - more boxy, official look
    rectMode(CENTER);
    beginShape();
    // Top
    vertex(-30, -10);
    vertex(30, -10);
    // Right side
    vertex(30, 10);
    // Bottom
    vertex(-30, 10);
    endShape(CLOSE);
    
    // Roof (slightly raised for surveillance look)
    fill(0, 0, 90, car.opacity);
    rect(0, -12, 50, 6);
    
    // Light bar on top (flashing)
    const lightIntensity = sin(car.lightPhase) > 0 ? 1 : 0.3;
    fill(200, 100, 60, lightIntensity * car.opacity); // Blue lights
    noStroke();
    rect(0, -15, 45, 4);
    
    // Red lights on light bar
    fill(0, 100, 60, lightIntensity * car.opacity); // Red lights
    ellipse(-15, -15, 6, 4);
    ellipse(15, -15, 6, 4);
    
    // Windows
    fill(200, 30, 40, 0.6 * car.opacity);
    stroke(0, 0, 0, 0.5 * car.opacity);
    strokeWeight(1);
    rect(-10, -8, 12, 8);
    rect(10, -8, 12, 8);
    
    // "ICE" text on side - counter-flip text so it reads correctly when car is flipped
    push();
    if (car.direction === -1) {
      scale(-1, 1); // Counter-flip text to read correctly
    }
    fill(0, 0, 0, car.opacity); // Black text
    noStroke();
    textSize(8);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text("ICE", 0, 2);
    
    // Border around ICE text for visibility
    stroke(0, 0, 0, car.opacity);
    strokeWeight(1);
    noFill();
    rect(0, 2, 20, 6);
    pop();
    
    // Wheels
    fill(0, 0, 20, car.opacity);
    noStroke();
    
    // Front wheels
    push();
    translate(-18, 12);
    rotate(car.wheelRotation);
    ellipse(0, 0, 10, 10);
    stroke(0, 0, 0, 0.6 * car.opacity);
    strokeWeight(1);
    line(-5, 0, 5, 0);
    line(0, -5, 0, 5);
    pop();
    
    // Rear wheels
    push();
    translate(18, 12);
    rotate(car.wheelRotation);
    ellipse(0, 0, 10, 10);
    stroke(0, 0, 0, 0.6 * car.opacity);
    strokeWeight(1);
    line(-5, 0, 5, 0);
    line(0, -5, 0, 5);
    pop();
    
    // Grille
    stroke(0, 0, 0, 0.7 * car.opacity);
    strokeWeight(1);
    noFill();
    for (let g = -2; g <= 2; g++) {
      line(-32, g * 1.5, -30, g * 1.5);
    }
    
    pop();
  }
  
  colorMode(HSL);
}

function spawnCollectible() {
  // Strange collectible types
  const types = ['normal', 'weird', 'glitch', 'void', 'crystal'];
  const type = types[Math.floor(random(types.length))];
  
  collectibles.push({
    x: random(50, width - 50),
    y: random(100, height - 100),
    value: type === 'void' ? 25 : type === 'crystal' ? 20 : 10,
    energy: type === 'crystal' ? 15 : 5,
    phase: random(0, TWO_PI),
    size: type === 'void' ? 10 : type === 'crystal' ? 8 : 6,
    type: type,
    lifetime: 0,
    maxLifetime: type === 'void' ? 8000 : 6000,
    rotation: random(0, TWO_PI),
    rotationSpeed: random(-0.05, 0.05),
    pulseSpeed: random(0.02, 0.05)
  });
}

function spawnObstacle() {
  // Strange obstacle types
  const types = ['normal', 'void', 'spike', 'orb', 'distortion'];
  const type = types[Math.floor(random(types.length))];
  
  obstacles.push({
    x: random(50, width - 50),
    y: random(100, height - 100),
    size: type === 'void' ? random(30, 50) : type === 'spike' ? random(15, 25) : random(20, 40),
    damage: type === 'spike' ? 1.0 : type === 'void' ? 0.8 : 0.5,
    phase: random(0, TWO_PI),
    speed: type === 'spike' ? random(0.5, 1.2) : random(0.3, 0.8),
    direction: random(0, TWO_PI),
    lifetime: 0,
    maxLifetime: type === 'void' ? 10000 : 8000,
    type: type,
    rotation: random(0, TWO_PI),
    rotationSpeed: random(-0.1, 0.1),
    pulsePhase: random(0, TWO_PI)
  });
}

function drawPeople() {
  // Ensure deltaTime exists
  if (!deltaTime || deltaTime <= 0 || !isFinite(deltaTime)) {
    deltaTime = 0.016;
  }
  
  // Ensure maxPeople is defined and valid
  if (maxPeople === undefined || maxPeople < 1) {
    maxPeople = 1;
  }
  
  // Ensure lastPersonSpawnTime is defined
  if (lastPersonSpawnTime === undefined) {
    lastPersonSpawnTime = millis();
  }
  
  // Initialize people if needed (but only once per toggle)
  if (people.length === 0) {
    try {
      initializePeople();
      // Ensure at least one person was spawned
      if (people.length === 0) {
        // Fallback: spawn one person directly
        spawnPerson(false);
        lastPersonSpawnTime = millis();
      }
    } catch (e) {
      console.error('Error initializing people:', e);
      // Fallback: spawn one person directly
      if (people.length === 0) {
        spawnPerson(false);
        lastPersonSpawnTime = millis();
      }
    }
  }
  
  // Safe audio variables with fallbacks
  const safeBassLevel = analyserNode ? (bassLevel || 0) : 0;
  const safeMidMidLevel = analyserNode ? (midMidLevel || 0) : 0;
  const safeHighMidLevel = analyserNode ? (highMidLevel || 0) : 0;
  const safeSubBassLevel = analyserNode ? (subBassLevel || 0) : 0;
  const safeLowBassLevel = analyserNode ? (lowBassLevel || 0) : 0;
  const safeMidBassLevel = analyserNode ? (midBassLevel || 0) : 0;
  const safeLowMidLevel = analyserNode ? (lowMidLevel || 0) : 0;
  const safePresenceLevel = analyserNode ? (presenceLevel || 0) : 0;
  const safeAirLevel = analyserNode ? (airLevel || 0) : 0;
  const safeOverallEnergy = analyserNode ? (overallEnergy || 0) : 0;
  const safeMidLevel = analyserNode ? (midLevel || 0) : 0;
  const safeTrebleLevel = analyserNode ? (trebleLevel || 0) : 0;
  
  // Progressive people spawning - gradually add more people over time
  // Only spawn if we have valid maxPeople and audio is available
  if (analyserNode && maxPeople > 0) {
    // Spawn new people if we're below max and enough time has passed
    if (people.length < maxPeople) {
      const timeSinceLastSpawn = millis() - lastPersonSpawnTime;
      // Ensure timeSinceLastSpawn is valid
      if (isFinite(timeSinceLastSpawn) && timeSinceLastSpawn >= 0) {
        // Spawn interval decreases as more people are added (faster spawning)
        const baseSpawnInterval = 8000; // 8 seconds base
        const spawnInterval = baseSpawnInterval - (people.length * 500); // Faster as more people exist
        const minSpawnInterval = 3000; // Minimum 3 seconds
        const actualSpawnInterval = Math.max(minSpawnInterval, spawnInterval);
        
        // Music energy can trigger faster spawning
        const energyBoost = safeOverallEnergy > 0.5 ? (safeOverallEnergy - 0.5) * 0.5 : 0;
        const adjustedSpawnInterval = actualSpawnInterval * (1 - energyBoost);
        
        if (timeSinceLastSpawn > adjustedSpawnInterval) {
          try {
            spawnPerson(false);
            lastPersonSpawnTime = millis();
          } catch (e) {
            console.error('Error spawning person:', e);
          }
        }
      }
    }
  }
  
  // Spawn collectibles periodically (ONCE per frame, not per person)
  if (analyserNode && millis() - (window.lastCollectibleSpawn || 0) > 2000) {
    spawnCollectible();
    window.lastCollectibleSpawn = millis();
  }
  
  // Spawn obstacles on beats (ONCE per frame, not per person)
  // Calculate beatDetected once for spawning (safe variables already declared above)
  let globalBeatDetected = false;
  if (analyserNode && people.length > 0) {
    // Use first person's last levels as reference
    const firstPerson = people[0];
    if (!firstPerson.lastBassLevel) firstPerson.lastBassLevel = 0;
    if (!firstPerson.lastMidMidLevel) firstPerson.lastMidMidLevel = 0;
    if (!firstPerson.lastHighMidLevel) firstPerson.lastHighMidLevel = 0;
    const bassChange = safeBassLevel - firstPerson.lastBassLevel;
    const midChange = safeMidMidLevel - firstPerson.lastMidMidLevel;
    const highMidChange = safeHighMidLevel - firstPerson.lastHighMidLevel;
    const bassBeat = bassChange > 0.15 && safeBassLevel > 0.4;
    const midBeat = midChange > 0.12 && safeMidMidLevel > 0.35;
    const highMidBeat = highMidChange > 0.12 && safeHighMidLevel > 0.35;
    globalBeatDetected = bassBeat || midBeat || highMidBeat;
  }
  if (globalBeatDetected && random() < 0.3) {
    spawnObstacle();
  }
  
  // CRITICAL: Limit collectibles array size to prevent freeze
  const MAX_COLLECTIBLES_GLOBAL = 20;
  if (collectibles.length > MAX_COLLECTIBLES_GLOBAL) {
    collectibles = collectibles.slice(-MAX_COLLECTIBLES_GLOBAL);
  }
  
  // Update and draw collectibles
  for (let c = collectibles.length - 1; c >= 0; c--) {
    const collectible = collectibles[c];
    if (!collectible || collectible.lifetime === undefined) {
      collectibles.splice(c, 1);
      continue;
    }
    
    collectible.lifetime += deltaTime * 1000;
    if (collectible.phase !== undefined) {
      collectible.phase += deltaTime * 2;
    }
    
    // Remove expired collectibles
    if (collectible.maxLifetime && collectible.lifetime > collectible.maxLifetime) {
      collectibles.splice(c, 1);
      continue;
    }
    
    // Draw collectible (strange forms)
    push();
    translate(collectible.x, collectible.y);
    
    if (collectible.rotation !== undefined) {
      collectible.rotation += collectible.rotationSpeed;
      rotate(collectible.rotation);
    }
    
    colorMode(HSL);
    
    const pulse = sin(collectible.phase * (collectible.pulseSpeed || 2)) * 0.3 + 0.7;
    const glowSize = collectible.size * (1 + pulse * 0.5);
    
    if (collectible.type === 'void') {
      // Void collectible - dark, consuming
      fill(240, 80, 20, 0.5 * pulse);
      noStroke();
      ellipse(0, 0, glowSize * 2.5, glowSize * 2.5);
      
      fill(240, 90, 15, 0.8);
      ellipse(0, 0, collectible.size * pulse, collectible.size * pulse);
      
      // Void center
      fill(240, 100, 5, 1);
      ellipse(0, 0, collectible.size * 0.3, collectible.size * 0.3);
      
    } else if (collectible.type === 'glitch') {
      // Glitch collectible - distorted
      const glitchOffset = sin(collectible.phase * 5) * 2;
      fill(300, 80, 60, 0.7);
      noStroke();
      rect(-collectible.size/2 + glitchOffset, -collectible.size/2, collectible.size, collectible.size);
      rect(-collectible.size/2, -collectible.size/2 + glitchOffset, collectible.size, collectible.size);
      
      fill(300, 100, 70, 0.9);
      ellipse(glitchOffset, glitchOffset, collectible.size * 0.6, collectible.size * 0.6);
      
    } else if (collectible.type === 'crystal') {
      // Crystal collectible - geometric
      fill(200, 80, 70, 0.6);
      noStroke();
      ellipse(0, 0, glowSize * 2, glowSize * 2);
      
      // Crystal shape
      fill(200, 90, 80, 0.9);
      beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (i * TWO_PI) / 6;
        const radius = collectible.size * pulse;
        vertex(cos(angle) * radius, sin(angle) * radius);
      }
      endShape(CLOSE);
      
      fill(200, 100, 90, 1);
      ellipse(0, 0, collectible.size * 0.4, collectible.size * 0.4);
      
    } else if (collectible.type === 'weird') {
      // Weird collectible - organic blob
      fill(120, 70, 60, 0.7);
      noStroke();
      ellipse(0, 0, glowSize * 1.8, glowSize * 1.5);
      
      fill(120, 80, 70, 0.9);
      beginShape();
      for (let i = 0; i < 8; i++) {
        const angle = (i * TWO_PI) / 8 + collectible.phase;
        const radius = collectible.size * (0.7 + sin(angle * 3) * 0.3) * pulse;
        vertex(cos(angle) * radius, sin(angle) * radius);
      }
      endShape(CLOSE);
      
    } else {
      // Normal collectible
      fill(60, 80, 70, 0.3 * pulse);
      noStroke();
      ellipse(0, 0, glowSize * 2, glowSize * 2);
      
      fill(60, 90, 80, 0.9);
      ellipse(0, 0, collectible.size * pulse, collectible.size * pulse);
      
      fill(60, 100, 95, 1);
      ellipse(0, 0, collectible.size * 0.5, collectible.size * 0.5);
      
      fill(60, 100, 100, 0.8);
      for (let s = 0; s < 4; s++) {
        const sparkleAngle = collectible.phase * 3 + s * PI / 2;
        const sparkleDist = collectible.size * 0.8;
        ellipse(cos(sparkleAngle) * sparkleDist, sin(sparkleAngle) * sparkleDist, 2, 2);
      }
    }
    
    pop();
  }
  
  // CRITICAL: Limit obstacles array size to prevent freeze
  const MAX_OBSTACLES = 15;
  if (obstacles.length > MAX_OBSTACLES) {
    obstacles = obstacles.slice(-MAX_OBSTACLES);
  }
  
  // Update and draw obstacles
  for (let o = obstacles.length - 1; o >= 0; o--) {
    const obstacle = obstacles[o];
    if (!obstacle || obstacle.lifetime === undefined) {
      obstacles.splice(o, 1);
      continue;
    }
    
    obstacle.lifetime += deltaTime * 1000;
    if (obstacle.phase !== undefined) {
      obstacle.phase += deltaTime;
    }
    
    // Move obstacle - validate values first
    if (isFinite(obstacle.direction) && isFinite(obstacle.speed)) {
      obstacle.x += cos(obstacle.direction) * obstacle.speed;
      obstacle.y += sin(obstacle.direction) * obstacle.speed;
    }
    
    // Bounce off edges - validate values
    if (isFinite(obstacle.x) && isFinite(obstacle.y)) {
      if (obstacle.x < 0 || obstacle.x > width) obstacle.direction = PI - obstacle.direction;
      if (obstacle.y < 0 || obstacle.y > height) obstacle.direction = -obstacle.direction;
    }
    
    // Remove expired obstacles
    if (obstacle.maxLifetime && obstacle.lifetime > obstacle.maxLifetime) {
      obstacles.splice(o, 1);
      continue;
    }
    
    // Draw obstacle (strange forms)
    push();
    translate(obstacle.x, obstacle.y);
    
    if (obstacle.rotation !== undefined) {
      obstacle.rotation += obstacle.rotationSpeed;
      rotate(obstacle.rotation);
    }
    
    colorMode(HSL);
    
    const warningPulse = sin(obstacle.phase * 4) * 0.2 + 0.8;
    const pulse = sin(obstacle.pulsePhase || obstacle.phase) * 0.3 + 0.7;
    
    if (obstacle.type === 'void') {
      // Void obstacle - consuming darkness
      fill(240, 80, 15, 0.5 * warningPulse);
      noStroke();
      ellipse(0, 0, obstacle.size * 2, obstacle.size * 2);
      
      fill(240, 90, 10, 0.9);
      ellipse(0, 0, obstacle.size * pulse, obstacle.size * pulse);
      
      fill(240, 100, 5, 1);
      ellipse(0, 0, obstacle.size * 0.4, obstacle.size * 0.4);
      
    } else if (obstacle.type === 'spike') {
      // Spike obstacle - sharp and dangerous
      fill(0, 90, 40, 0.6 * warningPulse);
      noStroke();
      ellipse(0, 0, obstacle.size * 1.8, obstacle.size * 1.8);
      
      fill(0, 80, 35, 0.9);
      beginShape();
      for (let i = 0; i < 8; i++) {
        const angle = (i * TWO_PI) / 8;
        const radius = obstacle.size * (0.6 + (i % 2) * 0.4);
        vertex(cos(angle) * radius, sin(angle) * radius);
      }
      endShape(CLOSE);
      
    } else if (obstacle.type === 'orb') {
      // Orb obstacle - floating sphere
      fill(300, 70, 40, 0.5 * warningPulse);
      noStroke();
      ellipse(0, 0, obstacle.size * 1.6, obstacle.size * 1.6);
      
      fill(300, 80, 45, 0.9);
      ellipse(0, 0, obstacle.size * pulse, obstacle.size * pulse);
      
      // Orb pattern
      fill(300, 90, 50, 0.7);
      ellipse(0, 0, obstacle.size * 0.6, obstacle.size * 0.6);
      
    } else if (obstacle.type === 'distortion') {
      // Distortion obstacle - warped space
      fill(180, 60, 40, 0.4 * warningPulse);
      noStroke();
      beginShape();
      for (let i = 0; i < 12; i++) {
        const angle = (i * TWO_PI) / 12 + obstacle.phase;
        const radius = obstacle.size * (0.7 + sin(angle * 4) * 0.3) * pulse;
        vertex(cos(angle) * radius, sin(angle) * radius);
      }
      endShape(CLOSE);
      
      fill(180, 70, 45, 0.9);
      ellipse(0, 0, obstacle.size * 0.7, obstacle.size * 0.7);
      
    } else {
      // Normal obstacle
      fill(0, 80, 40, 0.4 * warningPulse);
      noStroke();
      ellipse(0, 0, obstacle.size * 1.5, obstacle.size * 1.5);
      
      fill(0, 70, 30, 0.9);
      stroke(0, 0, 0, 0.8);
      strokeWeight(2);
      ellipse(0, 0, obstacle.size, obstacle.size);
      
      fill(0, 100, 50, 1);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(obstacle.size * 0.4);
      text("!", 0, 0);
    }
    
    pop();
  }
  
  // CRITICAL: Limit people array size and validate before processing
  const MAX_PEOPLE = 50;
  if (people.length > MAX_PEOPLE) {
    people = people.slice(0, MAX_PEOPLE);
  }
  
  // Process people with safety checks
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    if (!person || person.x === undefined || person.y === undefined) {
      people.splice(i, 1);
      i--;
      continue;
    }
    
    // Initialize smooth movement variables
    if (person.prevX === undefined) {
      person.prevX = person.x;
      person.prevY = person.y;
      person.targetY = person.y;
      person.targetRotation = person.rotation;
    }
    
    // People react to ALL frequency bands with different emphasis
    // Detect beats from multiple frequency ranges - use safe variables
    if (!person.lastBassLevel) person.lastBassLevel = 0;
    if (!person.lastMidMidLevel) person.lastMidMidLevel = 0;
    if (!person.lastHighMidLevel) person.lastHighMidLevel = 0;
    
    const bassChange = safeBassLevel - person.lastBassLevel;
    const midChange = safeMidMidLevel - person.lastMidMidLevel;
    const highMidChange = safeHighMidLevel - person.lastHighMidLevel;
    
    // Beat detected from any frequency band
    const bassBeat = bassChange > 0.15 && safeBassLevel > 0.4;
    const midBeat = midChange > 0.12 && safeMidMidLevel > 0.35;
    const highMidBeat = highMidChange > 0.12 && safeHighMidLevel > 0.35;
    const beatDetected = bassBeat || midBeat || highMidBeat;
    
    person.lastBassLevel = safeBassLevel;
    person.lastMidMidLevel = safeMidMidLevel;
    person.lastHighMidLevel = safeHighMidLevel;
    
    // Growth animation - people grow and shrink DRAMATICALLY
    person.growthPhase += person.growthSpeed * deltaTime * 60;
    
    // Growth reacts to ALL granular frequency bands - differentiated reactions - use safe variables
    const growthFromSubBass = safeSubBassLevel * 0.8;      // Deep foundation
    const growthFromLowBass = safeLowBassLevel * 1.0;      // Strong bass
    const growthFromMidBass = safeMidBassLevel * 0.9;     // Mid bass
    const growthFromLowMid = safeLowMidLevel * 0.7;       // Warmth
    const growthFromMidMid = safeMidMidLevel * 0.8;        // Rhythm/vocals
    const growthFromHighMid = safeHighMidLevel * 0.6;      // Attack
    const growthFromPresence = safePresenceLevel * 0.5;    // Clarity
    const growthFromAir = safeAirLevel * 0.4;              // Sparkle
    const growthFromBeat = beatDetected ? 0.8 : 0;     // Beat makes them JUMP
    const growthCycle = sin(person.growthPhase) * 0.15; // Smaller natural cycle (music dominates)
    
    // Calculate target scale with dramatic music reactions from all bands
    const baseScale = 0.5; // Base scale position
    const musicGrowth = growthFromSubBass + growthFromLowBass + growthFromMidBass + 
                        growthFromLowMid + growthFromMidMid + growthFromHighMid + 
                        growthFromPresence + growthFromAir + growthFromBeat;
    const totalGrowth = baseScale + growthCycle + musicGrowth;
    
    person.targetScale = person.minScale + (person.maxScale - person.minScale) * 
      constrain(totalGrowth, 0, 1); // Clamp to valid range
    
    // SUDDEN scale transitions - less smooth, more dramatic!
    const scaleDamping = beatDetected ? 0.6 : 0.35; // Much faster/more sudden on beats
    person.scale = damp(person.scale, person.targetScale, scaleDamping, deltaTime);
    
    // Sudden size jumps on beats - instant scale boost for visibility!
    if (beatDetected) {
      const beatBoost = safeBassLevel > 0.6 ? 1.5 : 1.3; // Bigger boost with stronger bass
      person.scale = lerp(person.scale, person.targetScale * beatBoost, 0.5); // Very sudden jump!
    }
    
    // Sudden size pulses with overall energy - makes them pop!
    if (safeOverallEnergy > 0.5) {
      const energyPulse = sin(person.phase * 4 + millis() * 0.01) * safeOverallEnergy * 0.3;
      person.scale *= (1 + energyPulse); // Sudden pulsing
    }
    
    // Make sure scale doesn't go out of bounds
    person.scale = constrain(person.scale, person.minScale * 0.8, person.maxScale * 1.2);
    
    // Initialize game mechanics
    if (person.energy === undefined) person.energy = 100;
    if (person.maxEnergy === undefined) person.maxEnergy = 100;
    if (person.score === undefined) person.score = 0;
    if (person.powerUpType === undefined) person.powerUpType = null;
    if (person.powerUpTimer === undefined) person.powerUpTimer = 0;
    if (person.boostMultiplier === undefined) person.boostMultiplier = 1;
    if (person.boostTimer === undefined) person.boostTimer = 0;
    
    // Update power-up timers
    if (person.powerUpTimer > 0) {
      person.powerUpTimer -= deltaTime * 60;
      if (person.powerUpTimer <= 0) {
        person.powerUpType = null;
      }
    }
    
    if (person.boostTimer > 0) {
      person.boostTimer -= deltaTime * 60;
      if (person.boostTimer <= 0) {
        person.boostMultiplier = 1;
      }
    }
    
    // Energy regeneration
    if (person.energy < person.maxEnergy) {
      person.energy = Math.min(person.maxEnergy, person.energy + deltaTime * 0.5);
    }
    
    // Check collectible collection (spawning is done once per frame, outside this loop)
    // CRITICAL: Limit iterations to prevent freeze - only check nearby collectibles
    const MAX_COLLECTIBLES_TO_CHECK = 10; // Limit checks per person
    const collectiblesToCheck = Math.min(collectibles.length, MAX_COLLECTIBLES_TO_CHECK);
    for (let c = collectibles.length - 1; c >= 0 && c >= collectibles.length - collectiblesToCheck; c--) {
      const collectible = collectibles[c];
      if (!collectible || collectible.x === undefined || collectible.y === undefined) continue;
      
      const dx = collectible.x - person.x;
      const dy = collectible.y - person.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      
      // Safety check: skip if distance is invalid or zero
      if (!isFinite(dist) || dist <= 0) continue;
      
      // Magnet power-up increases collection radius
      const effectiveRadius = person.powerUpType === 'magnet' ? person.collectRadius * 2 : person.collectRadius;
      
      if (dist < effectiveRadius) {
        // Collect!
        person.score += collectible.value || 10;
        person.energy = Math.min(person.maxEnergy, person.energy + (collectible.energy || 5));
        
        // Random power-up chance (strange game mechanics)
        if (random() < 0.2) {
          const powerUps = ['speed', 'shield', 'magnet', 'glitch', 'mirror', 'phase'];
          person.powerUpType = powerUps[Math.floor(random(powerUps.length))];
          person.powerUpTimer = 300; // 5 seconds at 60fps
          
          if (person.powerUpType === 'speed') {
            person.boostMultiplier = 1.5; // Reduced from 2
            person.boostTimer = 300;
          } else if (person.powerUpType === 'glitch') {
            person.glitchPhase = 0;
          } else if (person.powerUpType === 'mirror') {
            person.mirrorCount = 3; // Creates mirror copies
          } else if (person.powerUpType === 'phase') {
            person.phaseShift = random(0, TWO_PI);
          }
        }
        
        collectibles.splice(c, 1);
        break; // Only collect one per frame to prevent multiple collections
      } else if (person.powerUpType === 'magnet' && dist > 0) {
        // Pull collectible towards person - SAFE division
        const pullStrength = 0.3;
        collectible.x += (dx / dist) * pullStrength;
        collectible.y += (dy / dist) * pullStrength;
      }
    }
    
    // Check obstacle collision - LIMIT iterations
    const MAX_OBSTACLES_TO_CHECK = 8; // Limit checks per person
    const obstaclesToCheck = Math.min(obstacles.length, MAX_OBSTACLES_TO_CHECK);
    for (let o = obstacles.length - 1; o >= 0 && o >= obstacles.length - obstaclesToCheck; o--) {
      const obstacle = obstacles[o];
      if (!obstacle || obstacle.x === undefined || obstacle.y === undefined) continue;
      
      const dx = obstacle.x - person.x;
      const dy = obstacle.y - person.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      
      // Safety check: skip if distance is invalid or zero
      if (!isFinite(dist) || dist <= 0) continue;
      
      if (dist < person.avoidanceRadius) {
        // Avoid obstacle - push away - SAFE division
        const avoidStrength = person.powerUpType === 'shield' ? 0.1 : 0.5;
        person.x -= (dx / dist) * avoidStrength * person.currentSpeedMultiplier;
        person.y -= (dy / dist) * avoidStrength * person.currentSpeedMultiplier;
        
        // Take damage if no shield
        if (person.powerUpType !== 'shield') {
          person.energy = Math.max(0, person.energy - obstacle.damage * deltaTime * 60);
        }
        break; // Only process one collision per frame
      }
    }
    
    // Speed reacts to differentiated frequency bands - different bands affect movement differently - use safe variables
    const speedFromSubBass = safeSubBassLevel * 0.02;      // Deep foundation - subtle
    const speedFromLowBass = safeLowBassLevel * 0.03;     // Strong bass - moderate
    const speedFromMidBass = safeMidBassLevel * 0.025;    // Mid bass - moderate
    const speedFromLowMid = safeLowMidLevel * 0.02;       // Warmth - subtle
    const speedFromMidMid = safeMidMidLevel * 0.03;       // Rhythm/vocals - moderate
    const speedFromHighMid = safeHighMidLevel * 0.025;     // Attack - moderate
    const speedFromPresence = safePresenceLevel * 0.02;   // Clarity - subtle
    const speedFromAir = safeAirLevel * 0.015;            // Sparkle - very subtle
    const speedFromBeat = beatDetected ? 0.05 : 0;     // Beat boost
    const energyMultiplier = 0.85 + (person.energy / person.maxEnergy) * 0.15;
    const targetSpeedMultiplier = analyserNode ? 
      (1 + speedFromSubBass + speedFromLowBass + speedFromMidBass + speedFromLowMid + 
       speedFromMidMid + speedFromHighMid + speedFromPresence + speedFromAir + speedFromBeat) * 
      person.boostMultiplier * energyMultiplier : 1;
    if (!person.currentSpeedMultiplier) person.currentSpeedMultiplier = 1;
    person.currentSpeedMultiplier = lerp(person.currentSpeedMultiplier, targetSpeedMultiplier, 0.06); // Very slow lerp
    
    // Controlled flight - steering towards waypoints
    // Initialize flight path if needed
    if (!person.flightPath || person.flightPath.length === 0) {
      person.flightPath = [];
      person.currentWaypoint = 0;
    }
    
    // Create waypoints if needed - waypoints react to music and have types!
    if (person.flightPath.length === 0 || person.currentWaypoint >= person.flightPath.length) {
      // Generate new flight path with waypoints that react to music
      person.flightPath = [];
      const waypointCount = 4 + Math.floor(Math.random() * 3);
      
      // Different people react to different frequency bands - use safe variables
      const freqBand = i % 3; // 0=bass, 1=mid, 2=treble
      let reactiveLevel = 0;
      if (freqBand === 0) reactiveLevel = safeBassLevel;
      else if (freqBand === 1) reactiveLevel = safeMidLevel;
      else reactiveLevel = safeTrebleLevel;
      
      const waypointTypes = ['normal', 'speed', 'energy', 'collectible', 'glitch', 'void', 'phase'];
      
      for (let w = 0; w < waypointCount; w++) {
        // Waypoints positioned based on music energy - use safe variables
        const musicInfluenceX = (reactiveLevel - 0.5) * width * 0.3; // Music pulls waypoints
        const musicInfluenceY = (safeOverallEnergy - 0.5) * height * 0.2; // Vertical music influence
        
        // Assign waypoint type (strange waypoints are rarer)
        let waypointType = 'normal';
        if (random() < 0.25) {
          waypointType = waypointTypes[Math.floor(random(1, waypointTypes.length))];
        }
        
        person.flightPath.push({
          x: Math.random() * width * 0.6 + width * 0.2 + musicInfluenceX,
          y: Math.random() * height * 0.5 + height * 0.2 + musicInfluenceY,
          reached: false,
          pulsePhase: Math.random() * TWO_PI, // For pulsing effect
          type: waypointType, // Game-like waypoint type
          collected: false
        });
      }
      person.currentWaypoint = 0;
    }
    
    // Make waypoints pulse/react to music
    if (person.flightPath && person.flightPath.length > 0) {
      for (let w = 0; w < person.flightPath.length; w++) {
        const wp = person.flightPath[w];
        wp.pulsePhase += deltaTime * (0.5 + safeOverallEnergy * 0.5);
        // Waypoints move slightly with music
        const pulseX = sin(wp.pulsePhase) * safeOverallEnergy * 10;
        const pulseY = cos(wp.pulsePhase * 1.3) * safeOverallEnergy * 8;
        wp.x += pulseX * deltaTime;
        wp.y += pulseY * deltaTime;
      }
    }
    
    // Organic movement - blend waypoint attraction with fluid physics
    person.prevX = person.x;
    person.prevY = person.y;
    
    // Update organic drift phase
    person.driftPhase += person.driftSpeed * deltaTime * 60;
    
    // Natural drift forces (organic wandering) - extremely slow
    const driftX = sin(person.driftPhase) * 0.004; // Much more reduced
    const driftY = cos(person.driftPhase * 1.3) * 0.004; // Much more reduced
    
    // Waypoint attraction (gentle pull, not rigid)
    let waypointPullX = 0;
    let waypointPullY = 0;
    const waypoint = person.flightPath[person.currentWaypoint];
    
    if (waypoint && !waypoint.collected) {
      const dx = waypoint.x - person.x;
      const dy = waypoint.y - person.y;
      const distanceSq = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSq);
      
      // Safety check: skip if distance is invalid or zero
      if (isFinite(distance) && distance > 0) {
        // Gentle attraction to waypoint (not rigid) - extremely slow - SAFE division
        const attractionStrength = 0.002; // Much more reduced
        waypointPullX = (dx / distance) * attractionStrength * (1 / (1 + distance * 0.01));
        waypointPullY = (dy / distance) * attractionStrength * (1 / (1 + distance * 0.01));
        
        // Check if waypoint reached (larger radius for organic feel)
        if (distance < 50) {
          waypoint.collected = true;
          
          // Apply waypoint effects based on type (strange game mechanics)
          // CRITICAL: Limit collectible spawning to prevent unbounded growth
          const MAX_COLLECTIBLES = 20;
          if (waypoint.type === 'speed') {
            person.boostMultiplier = 1.8; // Reduced from 2.5
            person.boostTimer = 180;
          } else if (waypoint.type === 'energy') {
            person.energy = Math.min(person.maxEnergy, person.energy + 30);
          } else if (waypoint.type === 'collectible' && collectibles.length < MAX_COLLECTIBLES) {
            person.score += 25;
            collectibles.push({
              x: waypoint.x,
              y: waypoint.y,
              value: 15,
              energy: 10,
              phase: random(0, TWO_PI),
              size: 8,
              type: 'bonus'
            });
          } else if (waypoint.type === 'glitch') {
            person.powerUpType = 'glitch';
            person.powerUpTimer = 300;
            person.glitchPhase = 0;
          } else if (waypoint.type === 'void' && collectibles.length < MAX_COLLECTIBLES - 4) {
            person.score += 50;
            person.energy = person.maxEnergy;
            // Create void effect - LIMIT to prevent unbounded growth
            const voidCount = Math.min(5, MAX_COLLECTIBLES - collectibles.length);
            for (let v = 0; v < voidCount; v++) {
              collectibles.push({
                x: waypoint.x + random(-30, 30),
                y: waypoint.y + random(-30, 30),
                value: 10,
                energy: 5,
                phase: random(0, TWO_PI),
                size: 6,
                type: 'void',
                lifetime: 0,
                maxLifetime: 4000
              });
            }
          } else if (waypoint.type === 'phase') {
            person.powerUpType = 'phase';
            person.powerUpTimer = 300;
            person.phaseShift = random(0, TWO_PI);
          }
          
          person.currentWaypoint++;
          if (person.currentWaypoint >= person.flightPath.length) {
            person.flightPath = []; // Generate new path
          }
        }
      }
      
      // Organic rotation towards waypoint (smooth, not instant)
      person.targetSteering = atan2(dy, dx);
    } else {
      // No waypoint - pure organic drift
      person.targetSteering = person.driftPhase;
    }
    
    // Smooth steering angle
    if (person.steeringAngle === undefined) person.steeringAngle = person.targetSteering;
    person.steeringAngle = damp(person.steeringAngle, person.targetSteering, 0.08, deltaTime);
    
    // People with wings fly in their spawn direction
    // Music influences movement in all directions - use safe variables (already defined at top)
    const musicPushX = cos(person.phase * 0.6) * safeBassLevel * 0.005 + 
                       sin(person.phase * 0.8) * safeTrebleLevel * 0.004; // Much more reduced
    const musicPushY = cos(person.phase * 0.6) * safeBassLevel * 0.005 + 
                       sin(person.phase * 0.8) * safeTrebleLevel * 0.004; // Much more reduced
    
    // Update velocity - allow movement in all directions
    person.velocityX += (driftX + waypointPullX + musicPushX) * deltaTime;
    person.velocityY += (driftY + waypointPullY + musicPushY) * deltaTime;
    
    // Damping - natural resistance (organic feel) - extremely strong damping for very slow movement
    person.velocityX *= 0.995; // Much stronger damping
    person.velocityY *= 0.995; // Much stronger damping
    
    // Apply velocity with speed multiplier - movement in all directions
    person.x += person.velocityX * person.currentSpeedMultiplier;
    person.y += person.velocityY * person.currentSpeedMultiplier;
    
    // Gentle music-reactive floating - differentiated frequency bands - use safe variables
    const floatFromBass = (safeSubBassLevel * 0.3 + safeLowBassLevel * 0.5 + safeMidBassLevel * 0.2);
    const floatFromMid = (safeLowMidLevel * 0.4 + safeMidMidLevel * 0.6);
    const musicFloat = sin(person.phase * 2.2) * (floatFromBass * 0.2 + floatFromMid * 0.12);
    // Apply floating in all directions
    person.x += musicFloat * deltaTime * 0.5;
    person.y += musicFloat * deltaTime * 0.5;
    
    // Organic rotation - wings face their direction of travel
    // Calculate rotation based on velocity direction so head/body points in flight direction
    const velAngle = atan2(person.velocityY, person.velocityX);
    
    // Update base orientation to smoothly match current velocity direction
    if (person.baseOrientation === undefined) {
      person.baseOrientation = velAngle;
    }
    person.baseOrientation = lerp(person.baseOrientation, velAngle, 0.15); // Smoothly rotate towards velocity
    
    // Set target rotation to face direction of travel
    const baseRotation = person.baseOrientation; // Use baseOrientation as base rotation
    
    // Small wobble around their base orientation
    const beatTilt = beatDetected ? 0.1 : 0; // Tilt on beats
    const highFreqWobble = sin(person.phase * 2.5) * (safeHighMidLevel * 0.5 + safePresenceLevel * 0.5) * 0.1; // Wobble - use safe variables
    const naturalWobble = sin(person.driftPhase * 0.5) * 0.08; // Natural wobble
    
    person.targetRotation = baseRotation + beatTilt + highFreqWobble + naturalWobble;
    
    // Always update flyPhase for wing animation
    if (!person.flyPhase) person.flyPhase = 0;
    person.flyPhase += person.flySpeed * person.currentSpeedMultiplier * deltaTime * 60;
    
    // Smooth rotation transition
    if (person.rotation === undefined) person.rotation = 0;
    // Normalize target rotation
    while (person.targetRotation > TWO_PI) person.targetRotation -= TWO_PI;
    while (person.targetRotation < 0) person.targetRotation += TWO_PI;
    
    // Handle rotation wrap-around for smooth transitions
    let rotationDiff = person.targetRotation - person.rotation;
    if (rotationDiff > PI) rotationDiff -= TWO_PI;
    if (rotationDiff < -PI) rotationDiff += TWO_PI;
    person.rotation += rotationDiff * 0.12;
    
    // Ensure rotation stays in valid range
    if (person.rotation > TWO_PI) person.rotation -= TWO_PI;
    if (person.rotation < 0) person.rotation += TWO_PI;
    
    // Smooth wing flapping animation - differentiated frequency reactivity - use safe variables
    const wingFlapSpeed = 3 + person.scale * 2 + safeOverallEnergy * 2;
    const wingFlapFromBass = (safeSubBassLevel * 0.3 + safeLowBassLevel * 0.5 + safeMidBassLevel * 0.2);
    const wingFlapAmplitude = (0.3 + person.scale * 0.2) * (1 + wingFlapFromBass * 0.5);
    const targetWingFlap = sin(person.flyPhase * wingFlapSpeed) * wingFlapAmplitude;
    // Beat makes wings flap faster
    const beatWingBoost = beatDetected ? 0.2 : 0;
    person.wingFlap = lerp(person.wingFlap, targetWingFlap + beatWingBoost, 0.25);
    
    // Organic boundary wrapping - smooth flow around edges
    const margin = 50;
    if (person.x > width + margin) {
      person.x = -margin;
      person.velocityX *= 0.5; // Damp velocity on wrap
    } else if (person.x < -margin) {
      person.x = width + margin;
      person.velocityX *= 0.5;
    }
    if (person.y > height + margin) {
      person.y = -margin;
      person.velocityY *= 0.5;
    } else if (person.y < -margin) {
      person.y = height + margin;
      person.velocityY *= 0.5;
    }
    
    // Reset waypoints if person goes far off screen
    if (person.x > width + 200 || person.x < -200 || 
        person.y > height + 200 || person.y < -200) {
      person.flightPath = [];
      person.currentWaypoint = 0;
    }
    
    // Color shifts with music - differentiated reactivity to granular frequency bands - use safe variables
    const freqBand = i % 3;
    let reactiveHue = currentHue;
    if (freqBand === 0) {
      // Low-frequency reactive people - warmer colors from sub-bass/low-bass
      const lowFreqLevel = (safeSubBassLevel * 0.4 + safeLowBassLevel * 0.6);
      reactiveHue = (currentHue + lowFreqLevel * 60) % 360;
    } else if (freqBand === 1) {
      // Mid-frequency reactive people - cooler colors from mid-mid/high-mid - use safe variables
      const midFreqLevel = (safeMidMidLevel * 0.5 + safeHighMidLevel * 0.5);
      reactiveHue = (currentHue + 120 + midFreqLevel * 40) % 360;
    } else {
      // High-frequency reactive people - bright colors from presence/air - use safe variables
      const highFreqLevel = (safePresenceLevel * 0.6 + safeAirLevel * 0.4);
      reactiveHue = (currentHue + 240 + highFreqLevel * 50) % 360;
    }
    const targetHue = (reactiveHue + i * 40) % 360;
    person.hue = damp(person.hue, targetHue, 0.05, deltaTime);
    
    // Smooth trail movement - reacts to differentiated frequency bands - use safe variables
    person.trailPhase += deltaTime * (0.4 + safeOverallEnergy * 0.3);
    const trailFromSubBass = safeSubBassLevel * 0.2;
    const trailFromLowBass = safeLowBassLevel * 0.3;
    const trailFromMidBass = safeMidBassLevel * 0.25;
    const trailFromLowMid = safeLowMidLevel * 0.2;
    const trailFromMidMid = safeMidMidLevel * 0.25;
    const trailFromHighMid = safeHighMidLevel * 0.2;
    const trailFromPresence = safePresenceLevel * 0.15;
    const trailFromAir = safeAirLevel * 0.1;
    const trailFromBeat = beatDetected ? 0.5 : 0;
    const targetTrailOpacity = 0.3 + trailFromSubBass + trailFromLowBass + trailFromMidBass + 
                                trailFromLowMid + trailFromMidMid + trailFromHighMid + 
                                trailFromPresence + trailFromAir + trailFromBeat;
    if (!person.trailOpacity) person.trailOpacity = 0.3;
    person.trailOpacity = lerp(person.trailOpacity, targetTrailOpacity, 0.15);
    
    // Trail/glow effects removed - no circles around people
    
    // Draw waypoint indicators (controlled flight path) - Game-like with types!
    if (person.flightPath && person.flightPath.length > 0) {
      // Draw all waypoints in path
      for (let w = 0; w < person.flightPath.length; w++) {
        const waypoint = person.flightPath[w];
        if (waypoint && !waypoint.collected) {
          const isCurrent = w === person.currentWaypoint;
          const pulse = sin(waypoint.pulsePhase * 2) * 0.3 + 0.7;
          
          colorMode(HSL);
          
          // Different colors/shapes based on waypoint type
          let waypointHue, waypointSat, waypointLight, waypointSize, waypointShape;
          
          if (waypoint.type === 'speed') {
            waypointHue = 120; // Green for speed
            waypointSat = 80;
            waypointLight = 60;
            waypointSize = 18;
            waypointShape = 'diamond';
          } else if (waypoint.type === 'energy') {
            waypointHue = 60; // Yellow for energy
            waypointSat = 90;
            waypointLight = 70;
            waypointSize = 18;
            waypointShape = 'star';
          } else if (waypoint.type === 'collectible') {
            waypointHue = 280; // Purple for bonus
            waypointSat = 80;
            waypointLight = 65;
            waypointSize = 20;
            waypointShape = 'circle';
          } else if (waypoint.type === 'glitch') {
            waypointHue = 300; // Magenta for glitch
            waypointSat = 90;
            waypointLight = 55;
            waypointSize = 20;
            waypointShape = 'glitch';
          } else if (waypoint.type === 'void') {
            waypointHue = 240; // Dark blue for void
            waypointSat = 70;
            waypointLight = 30;
            waypointSize = 22;
            waypointShape = 'void';
          } else if (waypoint.type === 'phase') {
            waypointHue = 60; // Yellow for phase
            waypointSat = 85;
            waypointLight = 65;
            waypointSize = 19;
            waypointShape = 'phase';
          } else {
            waypointHue = person.hue; // Normal waypoint
            waypointSat = 60;
            waypointLight = 70;
            waypointSize = 15;
            waypointShape = 'circle';
          }
          
          // Draw path line to current waypoint only
          if (isCurrent) {
            stroke(waypointHue, waypointSat, waypointLight, 0.4);
            strokeWeight(2);
            line(person.x, person.y, waypoint.x, waypoint.y);
            
            // Direction arrow
            const angle = atan2(waypoint.y - person.y, waypoint.x - person.x);
            const arrowX = person.x + cos(angle) * 25;
            const arrowY = person.y + sin(angle) * 25;
            fill(waypointHue, waypointSat, waypointLight, 0.7);
            noStroke();
            push();
            translate(arrowX, arrowY);
            rotate(angle);
            triangle(0, 0, -8, -4, -8, 4);
            pop();
          }
          
          // Draw waypoint marker
          push();
          translate(waypoint.x, waypoint.y);
          
          // Outer glow (brighter for current waypoint)
          const glowOpacity = isCurrent ? 0.5 : 0.2;
          fill(waypointHue, waypointSat, waypointLight, glowOpacity * pulse);
          noStroke();
          ellipse(0, 0, waypointSize * 2.5, waypointSize * 2.5);
          
          // Main waypoint shape
          fill(waypointHue, waypointSat, waypointLight, 0.8);
          stroke(0, 0, 0, 0.6);
          strokeWeight(isCurrent ? 2 : 1);
          
          if (waypointShape === 'diamond') {
            // Diamond shape for speed
            beginShape();
            vertex(0, -waypointSize);
            vertex(waypointSize, 0);
            vertex(0, waypointSize);
            vertex(-waypointSize, 0);
            endShape(CLOSE);
          } else if (waypointShape === 'star') {
            // Star shape for energy
            const starPoints = 5;
            beginShape();
            for (let p = 0; p < starPoints * 2; p++) {
              const angle = (p * PI) / starPoints;
              const radius = p % 2 === 0 ? waypointSize : waypointSize * 0.5;
              vertex(cos(angle) * radius, sin(angle) * radius);
            }
            endShape(CLOSE);
          } else if (waypointShape === 'glitch') {
            // Glitch shape - distorted rectangle
            const glitchOffset = sin(waypoint.pulsePhase * 5) * 2;
            rectMode(CENTER);
            rect(glitchOffset, 0, waypointSize * 1.2, waypointSize * 0.8);
            rect(0, glitchOffset, waypointSize * 0.8, waypointSize * 1.2);
          } else if (waypointShape === 'void') {
            // Void shape - dark circle with inner void
            fill(waypointHue, waypointSat, waypointLight * 0.5, 0.9);
            ellipse(0, 0, waypointSize * pulse, waypointSize * pulse);
            fill(waypointHue, waypointSat, waypointLight * 0.2, 1);
            ellipse(0, 0, waypointSize * 0.6, waypointSize * 0.6);
          } else if (waypointShape === 'phase') {
            // Phase shape - hexagon
            beginShape();
            for (let h = 0; h < 6; h++) {
              const angle = (h * TWO_PI) / 6;
              vertex(cos(angle) * waypointSize, sin(angle) * waypointSize);
            }
            endShape(CLOSE);
          } else {
            // Circle for normal/collectible
            ellipse(0, 0, waypointSize * pulse, waypointSize * pulse);
          }
          
          // Type indicator icon
          fill(0, 0, 100, 0.9);
          noStroke();
          textAlign(CENTER, CENTER);
          textSize(waypointSize * 0.5);
          if (waypoint.type === 'speed') text("⚡", 0, 0);
          else if (waypoint.type === 'energy') text("⚡", 0, 0);
          else if (waypoint.type === 'collectible') text("★", 0, 0);
          else if (waypoint.type === 'glitch') text("⚠", 0, 0);
          else if (waypoint.type === 'void') text("◉", 0, 0);
          else if (waypoint.type === 'phase') text("◐", 0, 0);
          
          pop();
        }
      }
    }
    
    // Draw power-up indicator on person
    if (person.powerUpType) {
      push();
      translate(person.x, person.y - 30);
      colorMode(HSL);
      
      let powerUpHue, powerUpText;
      if (person.powerUpType === 'speed') {
        powerUpHue = 120;
        powerUpText = "⚡ SPEED";
      } else if (person.powerUpType === 'shield') {
        powerUpHue = 200;
        powerUpText = "🛡 SHIELD";
      } else if (person.powerUpType === 'magnet') {
        powerUpHue = 280;
        powerUpText = "🧲 MAGNET";
      } else if (person.powerUpType === 'glitch') {
        powerUpHue = 300;
        powerUpText = "⚠ GLITCH";
      } else if (person.powerUpType === 'mirror') {
        powerUpHue = 180;
        powerUpText = "◐ MIRROR";
      } else if (person.powerUpType === 'phase') {
        powerUpHue = 60;
        powerUpText = "◉ PHASE";
      }
      
      // Power-up badge
      fill(powerUpHue, 80, 60, 0.9);
      stroke(0, 0, 0, 0.8);
      strokeWeight(1);
      rectMode(CENTER);
      rect(0, 0, 60, 20);
      
      fill(0, 0, 100, 1);
      textAlign(CENTER, CENTER);
      textSize(8);
      text(powerUpText, 0, 0);
      
      // Timer bar
      const timerProgress = person.powerUpTimer / 300;
      fill(powerUpHue, 90, 70, 0.8);
      rect(0, 12, 60 * timerProgress, 3);
      
      pop();
    }
    
    // Draw energy bar
    push();
    translate(person.x, person.y - 15);
    colorMode(HSL);
    
    // Energy bar background
    fill(0, 0, 30, 0.7);
    stroke(0, 0, 0, 0.8);
    strokeWeight(1);
    rectMode(CENTER);
    rect(0, 0, 40, 6);
    
    // Energy bar fill
    const energyPercent = person.energy / person.maxEnergy;
    const energyHue = map(energyPercent, 0, 1, 0, 120); // Red to green
    fill(energyHue, 80, 50, 0.9);
    noStroke();
    rect(0, 0, 40 * energyPercent, 6);
    
    pop();
    
    // Draw score (small text above person)
    if (person.score > 0) {
      push();
      translate(person.x, person.y - 45);
      colorMode(HSL);
      fill(person.hue, 80, 80, 0.9);
      textAlign(CENTER, CENTER);
      textSize(10);
      text("Score: " + Math.floor(person.score), 0, 0);
      pop();
    }
    
    // Draw flying person
    push();
    translate(person.x, person.y);
    rotate(person.rotation); // Tilt while flying (controlled)
    scale(person.scale); // Apply growth scale
    
    // Flip person if going left
    if (person.direction === -1) {
      scale(-1, 1);
    }
    
    colorMode(HSL);
    
    // Head
    fill(person.hue, 50, 65, 0.95);
    stroke(0, 0, 0, 0.8);
    strokeWeight(1.5);
    ellipse(0, -12, 9, 9);
    
    // Body/torso (streamlined for flying)
    fill(person.hue, 55, 55, 0.95);
    rectMode(CENTER);
    rect(0, -3, 5, 10);
    
    // ACTUAL WINGS (not just arms) - makes them distinct from parachutists
    person.wingFlap = person.wingFlap || 0;
    person.wingFlap += deltaTime * 5; // FASTER flapping animation (more visible)
    
    const wingFlapOffset = sin(person.wingFlap) * 0.4; // MORE pronounced flapping motion
    const wingAngle = PI / 3 + wingFlapOffset; // Wings angled down with flapping
    const wingLength = 18; // Longer wings
    
    // Left wing (actual wing shape, not just a line)
    push();
    translate(0, -6);
    rotate(wingAngle);
    fill(person.hue, 60, 70, 0.9);
    stroke(person.hue, 50, 50, 0.95);
    strokeWeight(2);
    // Wing shape (triangle/feather shape)
    beginShape();
    vertex(0, 0);
    vertex(wingLength, -3);
    vertex(wingLength * 0.7, 2);
    vertex(wingLength * 0.3, 1);
    endShape(CLOSE);
    pop();
    
    // Right wing
    push();
    translate(0, -6);
    rotate(-wingAngle);
    fill(person.hue, 60, 70, 0.9);
    stroke(person.hue, 50, 50, 0.95);
    strokeWeight(2);
    beginShape();
    vertex(0, 0);
    vertex(-wingLength, -3);
    vertex(-wingLength * 0.7, 2);
    vertex(-wingLength * 0.3, 1);
    endShape(CLOSE);
    pop();
    
    // Arms (smaller, behind wings)
    stroke(person.hue, 50, 50, 0.7);
    strokeWeight(2);
    const armLength = 8;
    const leftArmX = cos(wingAngle) * armLength;
    const leftArmY = sin(wingAngle) * armLength;
    line(0, -6, leftArmX, leftArmY - 6);
    
    const rightArmX = cos(-wingAngle) * armLength;
    const rightArmY = sin(-wingAngle) * armLength;
    line(0, -6, rightArmX, rightArmY - 6);
    
    // Wing tips/hands
    fill(person.hue, 60, 60, 0.95);
    noStroke();
    ellipse(leftArmX, leftArmY - 6, 3, 3);
    ellipse(rightArmX, rightArmY - 6, 3, 3);
    
    // Legs trailing behind (flying position)
    stroke(person.hue, 50, 45, 0.95);
    strokeWeight(2);
    const legTrailAngle = PI / 4; // Legs trail behind
    const legLength = 9;
    
    // Left leg trailing
    const leftLegX = cos(legTrailAngle) * legLength;
    const leftLegY = sin(legTrailAngle) * legLength;
    line(0, 2, leftLegX, leftLegY + 2);
    
    // Right leg trailing
    const rightLegX = cos(-legTrailAngle) * legLength;
    const rightLegY = sin(-legTrailAngle) * legLength;
    line(0, 2, rightLegX, rightLegY + 2);
    
    // Feet
    fill(person.hue, 40, 40, 0.95);
    noStroke();
    ellipse(leftLegX, leftLegY + 2, 3, 3);
    ellipse(rightLegX, rightLegY + 2, 3, 3);
    
    // Flying suit/cape (streamlined)
    fill(person.hue, 65, 60, 0.85);
    beginShape();
    vertex(-3, -8);
    vertex(-8, -12);
    vertex(-6, -15);
    vertex(0, -10);
    vertex(6, -15);
    vertex(8, -12);
    vertex(3, -8);
    endShape(CLOSE);
    
    // Control device/indicator (shows controlled flight)
    if (person.flightPath && person.flightPath.length > 0) {
      fill(person.hue, 80, 70, 0.9);
      noStroke();
      // Control panel on chest
      rect(0, -2, 4, 3);
      // Control lights (pulse with movement)
      fill(person.hue, 90, 90, 0.8 + sin(person.flyPhase * 5) * 0.2);
      ellipse(-1, -2, 1, 1);
      ellipse(1, -2, 1, 1);
    }
    
    // Glow/energy effect removed - no circles around people
    
    // Sparkles/trail particles - react to ALL frequencies
    const sparkleIntensity = bassLevel * 0.5 + midLevel * 0.4 + trebleLevel * 0.3;
    if (sparkleIntensity > 0.2) {
      const sparkleCount = Math.floor(3 + overallEnergy * 3); // More sparkles with more energy
      fill(person.hue, 80 + overallEnergy * 10, 90 + trebleLevel * 5, sparkleIntensity * 0.8);
      for (let p = 0; p < sparkleCount; p++) {
        const sparklePhase = person.trailPhase + p * (TWO_PI / sparkleCount);
        const sparkleRadius = 15 + overallEnergy * 10;
        const sparkleX = cos(sparklePhase * 2) * sparkleRadius;
        const sparkleY = sin(sparklePhase * 2) * sparkleRadius;
        const sparkleSize = 3 + trebleLevel * 2;
        ellipse(sparkleX, sparkleY, sparkleSize, sparkleSize);
      }
    }
    
    // Eye glow - reacts to music
    const eyeGlowIntensity = bassLevel * 0.6 + midLevel * 0.4 + trebleLevel * 0.3;
    if (eyeGlowIntensity > 0.3) {
      fill(person.hue, 90, 95, eyeGlowIntensity);
      noStroke();
      ellipse(-2, -13, 2 + overallEnergy * 1.5, 2 + overallEnergy * 1.5);
      ellipse(2, -13, 2 + overallEnergy * 1.5, 2 + overallEnergy * 1.5);
    }
    
    pop();
  }
  
  colorMode(HSL);
}

// Draw parachutists (people with parachutes) - DISTINCT FROM REGULAR PEOPLE
function drawParachutists() {
  if (!parachutists) parachutists = [];
  if (!deltaTime) deltaTime = 0.016;
  
  // Progressive parachutist spawning - gradually add more parachutists over time (MORE ABUNDANT)
  if (analyserNode && audio && !audio.paused && audioStartTime > 0) {
    // Gradually increase max parachutists over time
    const timeSinceStart = millis() - audioStartTime;
    const progressTime = 60000; // 60 seconds to reach target
    const progress = Math.min(1, timeSinceStart / progressTime);
    maxParachutists = Math.floor(1 + (targetMaxParachutists - 1) * progress);
  } else {
    // Even without audio, allow some parachutists (at least 3, up to 10)
    if (maxParachutists < 3) maxParachutists = 3;
    maxParachutists = Math.min(maxParachutists, 10);
  }
  
  // Initialize lastParachutistSpawnTime if not set
  if (lastParachutistSpawnTime === 0 && parachutists.length > 0) {
    lastParachutistSpawnTime = millis();
  }
  
  // Spawn new parachutists if we're below max and enough time has passed
  if (parachutists.length < maxParachutists) {
    const timeSinceLastSpawn = millis() - (lastParachutistSpawnTime || millis());
    // Spawn interval decreases as more parachutists are added (faster spawning)
    const baseSpawnInterval = 2000; // 2 seconds base interval (FASTER than people)
    const spawnInterval = baseSpawnInterval - (parachutists.length * 100); // Faster as more exist
    const minSpawnInterval = 500; // Minimum 0.5 seconds (VERY FAST)
    const actualSpawnInterval = Math.max(minSpawnInterval, spawnInterval);
    
    // Music energy can trigger faster spawning
    const energyBoost = analyserNode && overallEnergy > 0.3 ? (overallEnergy - 0.3) * 0.7 : 0;
    const adjustedInterval = actualSpawnInterval * (1 - energyBoost);
    
    // Spawn if enough time has passed
    if (timeSinceLastSpawn > adjustedInterval || parachutists.length === 0) {
      spawnPerson(true);
      lastParachutistSpawnTime = millis();
    }
  }
  
  // Update and draw parachutists
  for (let i = 0; i < parachutists.length; i++) {
    const person = parachutists[i];
    
    // Initialize variables
    if (person.opacity === undefined) person.opacity = 1;
    if (person.scale === undefined) person.scale = random(2.0, 3.0); // LARGER parachutists
    if (person.parachutePhase === undefined) person.parachutePhase = random(0, TWO_PI);
    if (person.verticalSpeed === undefined) person.verticalSpeed = random(0.017, 0.05); // Falling speed (HALF SPEED)
    
    // Parachutists fall downward ONLY (no horizontal movement)
    person.parachutePhase += deltaTime * 2; // Parachute sway animation
    person.y += Math.abs(person.verticalSpeed) * deltaTime * 1.33; // HALF SPEED fall downward (reduced multiplier from 2.67 to 1.33)
    // NO horizontal movement - parachutists fall straight down
    
    // Parachutists react to music with parachute inflation
    const musicReaction = analyserNode ? (bassLevel * 0.3 + midLevel * 0.2 + trebleLevel * 0.1) : 0;
    const parachuteSize = 25 + musicReaction * 15; // Parachute inflates with music
    
    // Remove if off screen
    if (person.y > height + 50 || person.x < -100 || person.x > width + 100) {
      parachutists.splice(i, 1);
      i--;
      continue;
    }
    
    // Draw parachute FIRST (behind person)
    push();
    translate(person.x, person.y);
    scale(person.scale);
    
    colorMode(HSL);
    const parachuteHue = (person.hue + 30) % 360; // Slightly different hue from person
    
    // Parachute canopy (dome shape above person)
    const swayX = sin(person.parachutePhase) * 3; // Swaying motion
    const swayY = cos(person.parachutePhase * 0.7) * 2;
    
    // Parachute canopy - colorful and visible
    fill(parachuteHue, 70, 60, person.opacity * 0.9);
    stroke(parachuteHue, 50, 40, person.opacity * 0.8);
    strokeWeight(2);
    
    // Draw parachute as a dome/ellipse
    ellipse(swayX, -35 + swayY, parachuteSize, parachuteSize * 0.7);
    
    // Parachute segments/panels (make it look more realistic)
    stroke(parachuteHue, 60, 50, person.opacity * 0.6);
    strokeWeight(1);
    noFill();
    for (let seg = 0; seg < 8; seg++) {
      const segAngle = (seg / 8) * TWO_PI;
      const segX = cos(segAngle) * (parachuteSize / 2);
      const segY = sin(segAngle) * (parachuteSize * 0.35);
      line(swayX, -35 + swayY, swayX + segX, -35 + swayY + segY);
    }
    
    // Parachute lines/risers (connect parachute to person)
    stroke(parachuteHue, 40, 30, person.opacity * 0.7);
    strokeWeight(1.5);
    const riserCount = 8;
    for (let r = 0; r < riserCount; r++) {
      const riserAngle = (r / riserCount) * TWO_PI;
      const riserX = cos(riserAngle) * (parachuteSize / 2);
      const riserY = sin(riserAngle) * (parachuteSize * 0.35);
      line(swayX + riserX, -35 + swayY + riserY, 0, -12); // Connect to person's shoulders
    }
    
    pop();
    
    // Draw person (same as regular people but positioned differently)
    push();
    translate(person.x, person.y);
    rotate(person.rotation);
    scale(person.scale);
    
    if (person.direction === -1) {
      scale(-1, 1);
    }
    
    colorMode(HSL);
    
    // Head
    fill(person.hue, 50, 65, person.opacity * 0.95);
    stroke(0, 0, 0, person.opacity * 0.8);
    strokeWeight(1.5);
    ellipse(0, -12, 9, 9);
    
    // Body/torso (more vertical for falling position)
    fill(person.hue, 55, 55, person.opacity * 0.95);
    rectMode(CENTER);
    rect(0, -3, 5, 10);
    
    // Arms holding parachute lines (extended upward)
    stroke(person.hue, 50, 50, person.opacity * 0.95);
    strokeWeight(2.5);
    const armAngle = PI / 4; // Arms up holding lines
    const armLength = 10;
    
    // Left arm
    const leftArmX = cos(armAngle) * armLength;
    const leftArmY = sin(armAngle) * armLength;
    line(0, -6, leftArmX, leftArmY - 6);
    
    // Right arm
    const rightArmX = cos(-armAngle) * armLength;
    const rightArmY = sin(-armAngle) * armLength;
    line(0, -6, rightArmX, rightArmY - 6);
    
    // Hands
    fill(person.hue, 60, 60, person.opacity * 0.95);
    noStroke();
    ellipse(leftArmX, leftArmY - 6, 4, 4);
    ellipse(rightArmX, rightArmY - 6, 4, 4);
    
    // Legs hanging down (falling position)
    stroke(person.hue, 50, 45, person.opacity * 0.95);
    strokeWeight(2);
    const legHangAngle = PI / 6; // Legs hang down
    const legLength = 9;
    
    // Left leg
    const leftLegX = cos(legHangAngle) * legLength;
    const leftLegY = sin(legHangAngle) * legLength;
    line(0, 2, leftLegX, leftLegY + 2);
    
    // Right leg
    const rightLegX = cos(-legHangAngle) * legLength;
    const rightLegY = sin(-legHangAngle) * legLength;
    line(0, 2, rightLegX, rightLegY + 2);
    
    // Feet
    fill(person.hue, 40, 40, person.opacity * 0.95);
    noStroke();
    ellipse(leftLegX, leftLegY + 2, 3, 3);
    ellipse(rightLegX, rightLegY + 2, 3, 3);
    
    // Parachute harness/backpack
    fill(person.hue, 65, 50, person.opacity * 0.9);
    stroke(0, 0, 0, person.opacity * 0.7);
    strokeWeight(1);
    rect(0, -1, 6, 8);
    
    // Harness straps
    stroke(person.hue, 50, 40, person.opacity * 0.8);
    strokeWeight(1.5);
    line(-3, -5, -2, -12); // Left strap
    line(3, -5, 2, -12);   // Right strap
    
    pop();
  }
  
  colorMode(HSL);
}

// Draw helicopters - CLEAN FROM SCRATCH
function drawHelicopters() {
  // Prevent double updates in same frame
  const currentFrame = frameCount;
  if (lastHelicopterFrame === currentFrame) {
    return; // Already processed this frame
  }
  lastHelicopterFrame = currentFrame;
  
  // Early exit if no helicopters
  if (!helicopters || helicopters.length === 0) return;
  
  // FORCE only one helicopter - remove all others immediately
  if (helicopters.length > 1) {
    helicopters = [helicopters[0]];
  }
  if (helicopters.length !== 1) return;
  
  const heli = helicopters[0];
  if (!heli) return;
  
  // Ensure deltaTime exists
  if (!deltaTime || deltaTime <= 0 || !isFinite(deltaTime)) {
    deltaTime = 0.016;
  }
  
  // Store previous position to detect jumps
  const prevX = heli.x;
  
  // Update propeller animation
  if (heli.propPhase === undefined) heli.propPhase = 0;
  heli.propPhase += deltaTime * 30;
  
  // Initialize scanning light angle if needed
  if (heli.scanAngle === undefined) heli.scanAngle = 0;
  // Scanning light sweeps back and forth - faster movement
  heli.scanAngle += deltaTime * 1.5; // Faster scanning motion
  
  // Initialize movement if needed
  if (heli.moveDirection === undefined) heli.moveDirection = 0; // 0=right, 2=left
  if (heli.speed === undefined) heli.speed = 0.5;
  if (heli.distanceTraveled === undefined) heli.distanceTraveled = 0;
  if (heli.turnDistance === undefined) heli.turnDistance = 600; // Increased for broader flight trajectory
  
  // Ensure position is valid
  if (heli.x === undefined || !isFinite(heli.x)) {
    heli.x = random(width * 0.2, width * 0.8); // Random X position
  }
  if (heli.y === undefined || !isFinite(heli.y)) {
    heli.y = height * 0.25;
  }
  
  // Fixed altitude above city
  const flightAltitude = height * 0.25;
  heli.y = flightAltitude;
  
  // Move horizontally - ensure it always moves
  const baseSpeed = heli.speed || 0.5;
  const frameDelta = deltaTime || 0.016;
  const moveSpeed = baseSpeed * frameDelta * 60;
  
  // Always move if speed is valid (should be ~0.48 pixels per frame at 60fps)
  if (isFinite(moveSpeed) && moveSpeed > 0 && moveSpeed < 10) {
    if (heli.moveDirection === 0) {
      heli.x += moveSpeed; // Move right
    } else if (heli.moveDirection === 2) {
      heli.x -= moveSpeed; // Move left
    }
    
    // Track distance
    heli.distanceTraveled += moveSpeed;
  } else {
    // Fallback: move at fixed rate if calculation fails
    const fallbackSpeed = 0.5;
    if (heli.moveDirection === 0) {
      heli.x += fallbackSpeed;
    } else if (heli.moveDirection === 2) {
      heli.x -= fallbackSpeed;
    }
    heli.distanceTraveled += fallbackSpeed;
  }
  
  // Turn at edges - reduced margin for broader scope
  const margin = 30; // Reduced margin to allow closer to edges
  if (heli.x < margin) {
    heli.x = margin;
    heli.moveDirection = 0; // Turn right
    heli.distanceTraveled = 0;
    heli.turnDistance = 600; // Increased turn distance for broader trajectory
  } else if (heli.x > width - margin) {
    heli.x = width - margin;
    heli.moveDirection = 2; // Turn left
    heli.distanceTraveled = 0;
    heli.turnDistance = 600; // Increased turn distance for broader trajectory
  } else if (heli.distanceTraveled >= heli.turnDistance) {
    // Turn around
    heli.moveDirection = heli.moveDirection === 0 ? 2 : 0;
    heli.distanceTraveled = 0;
    heli.turnDistance = 600; // Increased turn distance for broader trajectory
  }
  
  // Detect and prevent jumps (only for large unexpected jumps, not normal movement)
  if (heliLastX !== null && prevX !== undefined && isFinite(prevX)) {
    const jumpDistance = abs(heli.x - heliLastX);
    // Only prevent jumps > 100 pixels (normal movement is < 1 pixel per frame)
    if (jumpDistance > 100) {
      heli.x = heliLastX; // Revert to last known good position
    } else {
      heliLastX = heli.x; // Update last known position
    }
  } else {
    heliLastX = heli.x; // Initialize tracking
  }
  
  // Draw scanning light beam FIRST (behind helicopter)
  push();
  translate(heli.x, heli.y);
  
  // Calculate scan angle - broader range
  const scanRange = PI / 1.5; // Broader scanning range (~120 degrees)
  const scanAngle = sin(heli.scanAngle) * scanRange;
  
  // Light beam extends from helicopter to bottom edge of screen
  const lightStartY = 0; // At helicopter position
  const lightEndY = height - heli.y; // Bottom edge of screen
  const lightWidth = 400; // Wider light beam at bottom
  
  // Draw light beam as a cone/trapezoid
  colorMode(HSL);
  const lightHue = 50; // Yellow-white light
  const lightIntensity = analyserNode ? (bassLevel * 0.5 + 0.5) : 0.7;
  
  // Outer glow
  fill(lightHue, 80, 90, lightIntensity * 0.3);
  noStroke();
  beginShape();
  vertex(0, lightStartY);
  vertex(cos(scanAngle - scanRange/2) * lightWidth, lightEndY);
  vertex(cos(scanAngle + scanRange/2) * lightWidth, lightEndY);
  endShape(CLOSE);
  
  // Main light beam
  fill(lightHue, 70, 95, lightIntensity * 0.6);
  beginShape();
  vertex(0, lightStartY);
  vertex(cos(scanAngle - scanRange/4) * lightWidth * 0.6, lightEndY);
  vertex(cos(scanAngle + scanRange/4) * lightWidth * 0.6, lightEndY);
  endShape(CLOSE);
  
  // Bright center beam
  fill(lightHue, 50, 100, lightIntensity * 0.8);
  beginShape();
  vertex(0, lightStartY);
  vertex(cos(scanAngle - scanRange/8) * lightWidth * 0.3, lightEndY);
  vertex(cos(scanAngle + scanRange/8) * lightWidth * 0.3, lightEndY);
  endShape(CLOSE);
  
  pop();
  
  // Draw helicopter - SIMPLE AND CLEAN - ONLY ONCE
  push();
  translate(heli.x, heli.y);
  
  // Flip horizontally based on direction (no rotation)
  const scaleX = heli.moveDirection === 2 ? -1 : 1; // Flip when moving left
  scale(scaleX * (heli.scale || 6.0), heli.scale || 6.0); // Double the size
  
  colorMode(HSL);
  const hue = heli.hue || 200;
  
  // Main body
  fill(hue, 80, 60, 1);
  stroke(0, 0, 0, 1);
  strokeWeight(3);
  ellipse(0, 0, 20, 12);
  
  // Cockpit
  fill(200, 50, 80, 1);
  stroke(0, 0, 0, 1);
  strokeWeight(2);
  ellipse(-3, -2, 8, 6);
  
  // Tail boom
  stroke(hue, 70, 50, 1);
  strokeWeight(4);
  line(10, 0, 25, -5);
  
  // Tail rotor
  push();
  translate(25, -5);
  rotate(heli.propPhase * 2);
  stroke(hue, 60, 40, 1);
  strokeWeight(2);
  line(-4, 0, 4, 0);
  line(0, -4, 0, 4);
  pop();
  
  // Main rotor
  const rotorRadius = 18;
  stroke(hue, 50, 30, 1);
  strokeWeight(5);
  fill(hue, 60, 40, 1);
  ellipse(0, -8, 6, 6);
  
  push();
  translate(0, -8);
  rotate(heli.propPhase);
  for (let blade = 0; blade < 2; blade++) {
    const bladeAngle = blade * PI;
    const bladeX = cos(bladeAngle) * rotorRadius;
    const bladeY = sin(bladeAngle) * rotorRadius;
    line(0, 0, bladeX, bladeY);
  }
  pop();
  
  // Landing skids
  stroke(hue, 60, 40, 1);
  strokeWeight(3);
  line(-8, 6, -5, 10);
  line(8, 6, 5, 10);
  line(-5, 10, 5, 10);
  
  pop();
  colorMode(HSL);
}

// Draw planes - CLEAN FROM SCRATCH
function drawPlanes() {
  // Ensure planes array exists
  if (!planes) planes = [];
  
  // Ensure deltaTime exists
  if (!deltaTime || deltaTime <= 0) deltaTime = 0.016;
  
  // Spawn new planes occasionally - MORE FREQUENTLY
  if (random() < 0.08 && planes.length < 6) {
    const direction = random() > 0.5 ? 1 : -1; // 1 = right, -1 = left
    planes.push({
      x: direction > 0 ? -100 : width + 100, // Start closer to screen
      y: random(height * 0.25, height * 0.45), // More visible middle area
      speed: random(0.0075, 0.015), // 50% SLOWER AGAIN - half the current speed
      direction: direction,
      hue: random(200, 240), // Brighter blue range
      scale: random(2.25, 3.0), // 75% OF ACTUAL SIZE
      propPhase: 0,
      wingTilt: 0
    });
  }
  
  // Update and draw all planes
  for (let i = planes.length - 1; i >= 0; i--) {
    const plane = planes[i];
    
    // Initialize properties
    if (plane.propPhase === undefined) plane.propPhase = 0;
    if (plane.wingTilt === undefined) plane.wingTilt = 0;
    
    // Update propeller rotation - 50% SLOWER AGAIN
    plane.propPhase += deltaTime * 0.25; // 50% slower rotation again
    
    // Update wing tilt (gentle swaying)
    plane.wingTilt = sin(plane.propPhase * 0.1) * 0.1;
    
    // Move plane horizontally across window
    const moveSpeed = plane.speed * deltaTime * 60;
    plane.x += moveSpeed * plane.direction;
    
    // Gentle vertical floating
    plane.y += sin(plane.propPhase * 0.05) * 0.5;
    
    // Remove if completely off-screen
    if ((plane.direction > 0 && plane.x > width + 200) || 
        (plane.direction < 0 && plane.x < -200)) {
      planes.splice(i, 1);
      continue;
    }
    
    // Draw plane - COOL MODERN DESIGN
    push();
    translate(plane.x, plane.y);
    rotate(plane.wingTilt);
    scale(plane.scale);
    
    colorMode(HSL);
    const hue = plane.hue;
    
    // Exhaust trail - DRAW FIRST (behind plane) - FIRE EFFECT
    const exhaustX = plane.direction > 0 ? -22 : 22;
    // More fire particles - bigger and brighter
    for (let s = 0; s < 12; s++) {
      const offset = s * 5;
      const trailAlpha = (1 - s / 12) * 0.9;
      const trailSize = (12 - s) * 1.2;
      const firePhase = plane.propPhase + s * 0.3;
      
      // Fire colors - red/orange/yellow gradient
      const fireHue = 30 - (s * 2); // Orange to red
      const fireSat = 90 + (s * 0.5);
      const fireLight = 60 + (s * 1.5);
      
      // Outer fire glow (yellow/orange)
      fill(fireHue, fireSat, fireLight, trailAlpha * 0.6);
      noStroke();
      ellipse(exhaustX - offset * plane.direction, sin(firePhase) * 2, trailSize * 2, trailSize * 1.5);
      
      // Middle fire (orange)
      fill(fireHue - 10, fireSat, fireLight - 10, trailAlpha * 0.8);
      ellipse(exhaustX - offset * plane.direction, sin(firePhase) * 1.5, trailSize * 1.5, trailSize * 1.2);
      
      // Core fire (red/orange)
      fill(fireHue - 20, fireSat, fireLight - 20, trailAlpha);
      ellipse(exhaustX - offset * plane.direction, sin(firePhase) * 1, trailSize, trailSize * 0.8);
      
      // Bright white/yellow core
      fill(50, 50, 95, trailAlpha * 0.9);
      ellipse(exhaustX - offset * plane.direction, sin(firePhase) * 0.5, trailSize * 0.5, trailSize * 0.4);
    }
    
    // Fuselage (main body) - SILVER DESIGN
    fill(200, 10, 85, 1); // Silver - low saturation, high lightness
    stroke(0, 0, 0, 1);
    strokeWeight(6);
    // More aerodynamic shape
    beginShape();
    vertex(-20, 0);
    bezierVertex(-15, -6, -5, -8, 5, -6);
    bezierVertex(15, -4, 20, 0, 20, 0);
    bezierVertex(15, 4, -5, 8, -15, 6);
    bezierVertex(-20, 2, -20, 0, -20, 0);
    endShape(CLOSE);
    
    // Top wing - SILVER DESIGN
    fill(200, 8, 80, 1); // Silver
    stroke(0, 0, 0, 1);
    strokeWeight(5);
    beginShape();
    vertex(-3, -10);
    vertex(15, -14);
    vertex(20, -12);
    vertex(18, -8);
    vertex(-1, -6);
    endShape(CLOSE);
    
    // Bottom wing - SWEPT WING DESIGN
    beginShape();
    vertex(-3, 10);
    vertex(15, 14);
    vertex(20, 12);
    vertex(18, 8);
    vertex(-1, 6);
    endShape(CLOSE);
    
    // Wingtips - SILVER DETAILS
    fill(200, 5, 75, 1); // Silver
    noStroke();
    ellipse(19, -13, 4, 4);
    ellipse(19, 13, 4, 4);
    
    // Tail - SILVER VERTICAL STABILIZER
    fill(200, 8, 78, 1); // Silver
    stroke(0, 0, 0, 1);
    strokeWeight(5);
    // Vertical stabilizer only (no horizontal/square stabilizer)
    triangle(-12, 0, -25, -10, -25, 10);
    
    // Propeller (spinning) - COOL BLUR EFFECT
    push();
    translate(-20, 0);
    rotate(plane.propPhase);
    
    // Propeller motion blur
    for (let blur = 0; blur < 3; blur++) {
      const blurAngle = plane.propPhase - blur * 0.3;
      push();
      rotate(blurAngle);
      stroke(0, 0, 0, 0.3 - blur * 0.1);
      strokeWeight(6 - blur);
      for (let p = 0; p < 3; p++) {
        const angle = (p * TWO_PI) / 3;
        const x = cos(angle) * 18;
        const y = sin(angle) * 18;
        line(0, 0, x, y);
      }
      pop();
    }
    
    // Propeller blades (current position)
    stroke(0, 0, 0, 1);
    strokeWeight(7);
    for (let p = 0; p < 3; p++) {
      const angle = (p * TWO_PI) / 3;
      const x = cos(angle) * 18;
      const y = sin(angle) * 18;
      line(0, 0, x, y);
    }
    
    // Propeller hub - SILVER CENTER
    fill(200, 10, 70, 1); // Silver
    stroke(0, 0, 0, 1);
    strokeWeight(2);
    ellipse(0, 0, 10, 10);
    // Inner detail - darker silver
    fill(200, 5, 60, 1);
    ellipse(0, 0, 5, 5);
    pop();
    
    // Windows - COOL COCKPIT DESIGN
    fill(200, 70, 95, 1);
    stroke(0, 0, 0, 1);
    strokeWeight(2);
    // Main cockpit window
    ellipse(-4, -3, 12, 9);
    // Side windows
    ellipse(4, -3, 8, 6);
    ellipse(8, -2, 6, 5);
    
    // Window reflections - COOL EFFECT
    fill(200, 50, 100, 0.6);
    noStroke();
    ellipse(-2, -4, 5, 3);
    
    // Engine details - SILVER NACELLE
    fill(200, 8, 75, 1); // Silver
    stroke(0, 0, 0, 1);
    strokeWeight(3);
    ellipse(18, -10, 6, 4);
    ellipse(18, 10, 6, 4);
    
    // Navigation lights - COOL DETAILS
    fill(0, 90, 70, 1); // Red
    noStroke();
    ellipse(20, -11, 3, 3);
    fill(240, 90, 70, 1); // Blue
    ellipse(20, 11, 3, 3);
    
    // Body highlights - SILVER SHINE
    fill(200, 5, 95, 0.5); // Bright silver shine
    noStroke();
    ellipse(5, -4, 15, 6);
    
    pop();
  }
  
  colorMode(HSL);
}

// Draw ambulances with flashing lights
function drawAmbulances() {
  if (!ambulances) ambulances = [];
  if (!deltaTime) deltaTime = 0.016;
  
  const currentTime = millis();
  
  // Ambulances react to snare hits and emergency frequencies (with fallbacks)
  const safeSnareLevel = analyserNode ? (snareLevel || 0.3) : 0.3;
  const safeMidMidLevel = analyserNode ? (midMidLevel || 0.3) : 0.3;
  const safeSnareHit = analyserNode ? (snareHit || false) : false;
  const safeOverallEnergy = analyserNode ? (overallEnergy || 0.3) : 0.3;
  const emergencyLevel = analyserNode ? (safeSnareLevel * 0.6 + safeMidMidLevel * 0.4) : 0.3;
  const shouldSpawn = analyserNode ? 
    ((safeSnareHit && random() < 0.15) || 
     (emergencyLevel > 0.3 && random() < 0.08) ||
     (safeOverallEnergy > 0.4 && random() < 0.05)) :
    (random() < 0.05); // Spawn occasionally without audio
  
  if (shouldSpawn && ambulances.length < 5) {
    // Spawn in visible area like cars - can spawn anywhere on screen or just off-screen
    const direction = random() > 0.5 ? 1 : -1;
    const startX = random() > 0.5 ? 
      (direction === 1 ? random(-100, -50) : random(width + 50, width + 100)) :
      random(0, width); // Sometimes spawn in the middle (visible area)
    
    ambulances.push({
      x: startX,
      y: height * 0.92, // LOWER - closer to bottom
      baseY: height * 0.92, // LOWER - closer to bottom
      speed: random(0.8, 1.5), // SLOW - consistent speed
      direction: direction,
      hue: random(0, 30),
      scale: random(1.4, 1.9), // 70% OF SIZE
      opacity: 1,
      lightPhase: random(0, TWO_PI),
      lifetime: 0,
      maxLifetime: Infinity, // Never expire - continuous like cars
      lastX: startX // Initialize position tracking
    });
  }
  
  // Update and draw ambulances
  for (let i = ambulances.length - 1; i >= 0; i--) {
    const amb = ambulances[i];
    
    // Initialize position tracking if needed
    if (amb.lastX === undefined) amb.lastX = amb.x;
    
    // Store previous position to detect jumps
    const prevX = amb.x;
    
    amb.lifetime += deltaTime * 1000;
    amb.lightPhase += deltaTime * 10; // Fast flashing lights
    
    // Ensure position is valid
    if (amb.x === undefined || !isFinite(amb.x)) {
      amb.x = amb.direction > 0 ? -60 : width + 60;
    }
    if (amb.y === undefined || !isFinite(amb.y)) {
      amb.y = height * 0.92; // LOWER - closer to bottom
    }
    
    // Move ambulance - LIKE CARS - continuous movement
    let moveSpeed = 0;
    if (isFinite(amb.x) && isFinite(amb.y) && isFinite(amb.speed)) {
      moveSpeed = amb.speed * deltaTime * 60; // Frame-rate independent
      
      // Prevent invalid moveSpeed
      if (isFinite(moveSpeed) && moveSpeed > 0 && moveSpeed < 100) {
        // Move like cars - simple continuous movement
        amb.x += moveSpeed * amb.direction;
      } else {
        // Fallback: move at fixed rate if calculation fails
        const fallbackSpeed = amb.speed || 1.0;
        amb.x += fallbackSpeed * amb.direction;
      }
    }
    
    // Detect and prevent jumps (only for large unexpected jumps, not normal movement)
    if (amb.lastX !== null && prevX !== undefined && isFinite(prevX)) {
      const jumpDistance = abs(amb.x - amb.lastX);
      // Only prevent jumps > 100 pixels (normal movement is < 2 pixels per frame)
      if (jumpDistance > 100) {
        amb.x = amb.lastX; // Revert to last known good position
      } else {
        amb.lastX = amb.x; // Update last known position
      }
    } else {
      amb.lastX = amb.x; // Initialize tracking
    }
    
    // Loop ambulances like cars - continuous movement
    if (amb.direction === 1 && amb.x > width + 150) {
      amb.x = -150; // Loop from right to left
    } else if (amb.direction === -1 && amb.x < -150) {
      amb.x = width + 150; // Loop from left to right
    }
    
    // Keep Y position stable (like cars have baseY) - LOWER
    if (amb.baseY === undefined) amb.baseY = height * 0.92; // LOWER - closer to bottom
    amb.y = amb.baseY;
    
    // Draw ambulance - COOL DESIGN
    push();
    translate(amb.x, amb.y);
    scale(amb.scale);
    
    colorMode(HSL);
    const ambHue = amb.hue;
    
    // Ambulance body - WHITE BASE - MAXIMUM VISIBILITY
    fill(200, 0, 100, amb.opacity); // Pure white
    stroke(0, 0, 0, amb.opacity);
    strokeWeight(8); // Very thick stroke
    rectMode(CENTER);
    // Main body - MUCH LARGER
    rect(0, 0, 90, 35);
    
    // Red stripe on side - VERY BRIGHT AND THICKER
    fill(0, 100, 80, amb.opacity); // Very bright red
    noStroke();
    rect(0, 0, 85, 12); // Much thicker stripe
    
    // Ambulance roof (higher at back) - WHITE - MUCH LARGER
    fill(200, 0, 98, amb.opacity); // Pure white
    stroke(0, 0, 0, amb.opacity);
    strokeWeight(6); // Very thick stroke
    beginShape();
    vertex(-35, -18);
    vertex(28, -18);
    vertex(35, -8);
    vertex(-28, -8);
    endShape(CLOSE);
    
    // Windows - DARK TINTED - MUCH LARGER
    fill(200, 40, 20, amb.opacity); // Very dark for contrast
    stroke(0, 0, 0, amb.opacity);
    strokeWeight(5); // Very thick stroke
    rect(-15, -5, 24, 16);
    rect(10, -5, 24, 16);
    
    // Window reflections - BRIGHTER
    fill(200, 10, 90, amb.opacity * 0.7);
    noStroke();
    rect(-10, -5, 8, 5);
    rect(10, -5, 8, 5);
    
    // Flashing red and blue lights on top - MUCH BRIGHTER AND LARGER
    const lightIntensity = (sin(amb.lightPhase * 2) + 1) / 2; // Faster flashing
    
    // Red light (left side) - EXTREMELY BRIGHT AND HUGE
    fill(0, 100, 95, lightIntensity * amb.opacity); // Maximum bright red
    noStroke();
    ellipse(-28, -20, 18, 20); // Much larger
    
    // Blue light (right side) - EXTREMELY BRIGHT AND HUGE
    fill(240, 100, 95, (1 - lightIntensity) * amb.opacity); // Maximum bright blue
    ellipse(28, -20, 18, 20); // Much larger
    
    // Light glow - EXTREMELY INTENSE AND HUGE
    fill(0, 100, 98, lightIntensity * amb.opacity * 0.9);
    ellipse(-28, -20, 35, 38); // Much larger glow
    fill(240, 100, 98, (1 - lightIntensity) * amb.opacity * 0.9);
    ellipse(28, -20, 35, 38); // Much larger glow
    
    // Outer glow rings - HUGE
    fill(0, 90, 100, lightIntensity * amb.opacity * 0.7);
    ellipse(-28, -20, 50, 52); // Much larger outer glow
    fill(240, 90, 100, (1 - lightIntensity) * amb.opacity * 0.7);
    ellipse(28, -20, 50, 52); // Much larger outer glow
    
    // Cross symbol on side - MAXIMUM VISIBILITY AND HUGE
    fill(255, 255, 255, amb.opacity);
    stroke(0, 0, 0, amb.opacity);
    strokeWeight(6); // Very thick
    // Horizontal bar - MUCH LARGER
    rect(0, 0, 40, 10);
    // Vertical bar - MUCH LARGER
    rect(0, -5, 10, 40);
    
    // Cross outline for visibility - VERY THICK
    stroke(0, 0, 0, amb.opacity);
    strokeWeight(3);
    noFill();
    rect(0, 0, 42, 12);
    rect(0, -6, 12, 42);
    
    // Wheels - HUGE AND MORE DETAILED
    fill(0, 0, 5, amb.opacity);
    stroke(0, 0, 0, amb.opacity);
    strokeWeight(6); // Very thick stroke
    ellipse(-28, 20, 20, 20); // Much larger
    ellipse(28, 20, 20, 20); // Much larger
    
    // Wheel rims - MUCH LARGER
    fill(200, 10, 80, amb.opacity);
    ellipse(-28, 20, 13, 13);
    ellipse(28, 20, 13, 13);
    
    // Wheel centers - MUCH LARGER
    fill(0, 0, 0, amb.opacity);
    ellipse(-28, 20, 7, 7);
    ellipse(28, 20, 7, 7);
    
    // Exhaust smoke
    if (showSmoke && emergencyLevel > 0.2) {
      const exhaustX = amb.direction > 0 ? -30 : 30;
      fill(0, 0, 30, emergencyLevel * amb.opacity * 0.6);
      noStroke();
      for (let s = 0; s < 3; s++) {
        const smokeOffset = s * 5;
        ellipse(exhaustX - smokeOffset * amb.direction, sin(amb.lightPhase + s) * 2, 4, 4);
      }
    }
    
    pop();
  }
  
  colorMode(HSL);
}

// Draw drones - CLEAN FROM SCRATCH
function drawDrones() {
  // Prevent double updates in same frame
  const currentFrame = frameCount;
  if (lastDroneFrame === currentFrame) {
    return; // Already processed this frame
  }
  lastDroneFrame = currentFrame;

  // Early exit if no drones
  if (!drones || drones.length === 0) return;
  
  // Ensure we have exactly 4 drones
  if (drones.length < 4) {
    // Add missing drones at less symmetrical positions in top half only
    const positions = [
      {x: width * 0.25 + random(-50, 50), y: height * 0.15 + random(-20, 20)},
      {x: width * 0.75 + random(-50, 50), y: height * 0.2 + random(-20, 20)},
      {x: width * 0.2 + random(-50, 50), y: height * 0.35 + random(-20, 20)},
      {x: width * 0.8 + random(-50, 50), y: height * 0.4 + random(-20, 20)}
    ];
    while (drones.length < 4) {
      const i = drones.length;
      drones.push({
        x: positions[i].x,
        y: positions[i].y,
        speed: 0.4,
        moveDirection: i % 4,
        turnDistance: 300,
        distanceTraveled: 0,
        hue: 220 + i * 30,
        scale: 4.5,
        opacity: 1,
        rotation: 0,
        propPhase: 0,
        laserCooldown: 0,
        wifiActive: false,
        wifiPhase: 0,
        wifiTimer: random(2000, 5000)
      });
    }
  }
  
  // Ensure deltaTime exists
  if (!deltaTime || deltaTime <= 0 || !isFinite(deltaTime)) {
    deltaTime = 0.016;
  }
  
  // Update and draw all drones
  for (let droneIdx = 0; droneIdx < drones.length; droneIdx++) {
    const drone = drones[droneIdx];
    if (!drone) continue;
    
    // Check if this is the laser drone (first drone)
    const isLaserDrone = droneIdx === 0;
  
    // Store previous position to detect jumps
    const prevX = drone.x;
    const prevY = drone.y;
    
    // Update propeller animation
    if (drone.propPhase === undefined) drone.propPhase = 0;
    drone.propPhase += deltaTime * 30;
    
    // Initialize WiFi communication properties
    if (drone.wifiActive === undefined) drone.wifiActive = false;
    if (drone.wifiPhase === undefined) drone.wifiPhase = 0;
    if (drone.wifiTimer === undefined) drone.wifiTimer = random(2000, 5000);
    
    // Update WiFi timer and toggle WiFi state intermittently
    drone.wifiTimer -= deltaTime * 1000;
    if (drone.wifiTimer <= 0) {
      drone.wifiActive = !drone.wifiActive; // Toggle WiFi on/off
      if (drone.wifiActive) {
        drone.wifiTimer = random(1500, 3000); // WiFi active duration
      } else {
        drone.wifiTimer = random(3000, 7000); // WiFi inactive duration
      }
    }
    
    // Update WiFi animation phase when active
    if (drone.wifiActive) {
      drone.wifiPhase += deltaTime * 2;
    }
    
    // Initialize laser scanning beam for first drone (similar to helicopter)
    if (isLaserDrone) {
      if (drone.laserScanAngle === undefined) drone.laserScanAngle = 0;
      // Scanning laser beam moves in circles around screen edges
      drone.laserScanAngle += deltaTime * 0.8; // Circular scanning speed
      if (drone.laserScanAngle >= TWO_PI) drone.laserScanAngle -= TWO_PI; // Wrap around
    }
    
    // Initialize movement properties if needed
    if (drone.moveDirection === undefined) drone.moveDirection = 0; // 0=right, 1=down, 2=left, 3=up
    if (drone.speed === undefined) drone.speed = 0.4;
    if (drone.distanceTraveled === undefined) drone.distanceTraveled = 0;
    if (drone.turnDistance === undefined) drone.turnDistance = 150;
    if (drone.scale === undefined) drone.scale = 4.5;
    if (drone.hue === undefined) drone.hue = 220;
    if (drone.opacity === undefined) drone.opacity = 1;
    
    // Ensure position is valid
    if (drone.x === undefined || !isFinite(drone.x)) {
      drone.x = width * 0.5;
    }
    if (drone.y === undefined || !isFinite(drone.y)) {
      drone.y = height * 0.5;
    }
    
    // Move in 90-degree directions - slow grid-like movement
    let moveSpeed = 0;
    if (isFinite(drone.x) && isFinite(drone.y)) {
      moveSpeed = drone.speed * deltaTime * 60;
      
      // Prevent invalid moveSpeed
      if (isFinite(moveSpeed) && moveSpeed > 0 && moveSpeed < 100) {
        // Move based on direction (0=right, 1=down, 2=left, 3=up)
        // Constrain to top half of screen
        const topHalfBoundary = height * 0.5;
        if (drone.moveDirection === 0) {
          drone.x += moveSpeed; // Move right
        } else if (drone.moveDirection === 1) {
          // Only move down if still in top half
          if (drone.y + moveSpeed < topHalfBoundary - 10) {
            drone.y += moveSpeed; // Move down
          } else {
            drone.moveDirection = 3; // Turn up instead
            drone.y -= moveSpeed;
          }
        } else if (drone.moveDirection === 2) {
          drone.x -= moveSpeed; // Move left
        } else if (drone.moveDirection === 3) {
          drone.y -= moveSpeed; // Move up
        }
        
        // Ensure drone stays in top half
        if (drone.y > topHalfBoundary - 10) {
          drone.y = topHalfBoundary - 10;
        }
        // Track distance traveled
        drone.distanceTraveled += moveSpeed;
      } else {
        // Fallback: move at fixed rate if calculation fails
        const fallbackSpeed = 0.4;
        const topHalfBoundary = height * 0.5;
        if (drone.moveDirection === 0) {
          drone.x += fallbackSpeed;
        } else if (drone.moveDirection === 1) {
          // Only move down if still in top half
          if (drone.y + fallbackSpeed < topHalfBoundary - 10) {
            drone.y += fallbackSpeed;
          } else {
            drone.moveDirection = 3; // Turn up instead
            drone.y -= fallbackSpeed;
          }
        } else if (drone.moveDirection === 2) {
          drone.x -= fallbackSpeed;
        } else if (drone.moveDirection === 3) {
          drone.y -= fallbackSpeed;
        }
        
        // Ensure drone stays in top half
        if (drone.y > topHalfBoundary - 10) {
          drone.y = topHalfBoundary - 10;
        }
        drone.distanceTraveled += fallbackSpeed;
      }
    }
    
    // Constrain drones to top half of screen
    const topHalfBoundary = height * 0.5; // Middle of screen
    const margin = 50;
    const centerX = width * 0.5;
    const centerY = height * 0.25; // Center of top half
    
    // Keep drone in top half - if it goes below, turn up
    if (drone.y > topHalfBoundary - margin) {
      drone.moveDirection = 3; // Force move up
      drone.distanceTraveled = 0;
    }
    
    // Keep drone within horizontal bounds
    if (drone.x < margin) {
      drone.moveDirection = 0; // Force move right
      drone.distanceTraveled = 0;
    } else if (drone.x > width - margin) {
      drone.moveDirection = 2; // Force move left
      drone.distanceTraveled = 0;
    }
    
    // Keep drone above top margin
    if (drone.y < margin) {
      drone.moveDirection = 1; // Force move down (but still in top half)
      drone.distanceTraveled = 0;
    }
    
    // Turn when reaching turn distance (but respect boundaries above)
    if (drone.distanceTraveled >= drone.turnDistance) {
      // Turn 90 degrees clockwise, but avoid going down if near bottom boundary
      const newDirection = (drone.moveDirection + 1) % 4;
      if (newDirection === 1 && drone.y > topHalfBoundary - margin - 100) {
        // If turning would go down and we're near bottom, skip to next direction
        drone.moveDirection = (newDirection + 1) % 4;
      } else {
        drone.moveDirection = newDirection;
      }
      drone.distanceTraveled = 0;
      drone.turnDistance = 300;
    }
    
    // Detect and prevent jumps (only for large unexpected jumps, not normal movement)
    // Use drone-specific tracking instead of global droneLastX/Y
    if (drone.lastX !== undefined && prevX !== undefined && isFinite(prevX) && prevY !== undefined && isFinite(prevY)) {
      const jumpDistance = dist(drone.x, drone.y, drone.lastX, drone.lastY || prevY);
      // Only prevent jumps > 100 pixels (normal movement is < 5 pixels per frame)
      if (jumpDistance > 100) {
        drone.x = drone.lastX; // Revert to last known good position
        drone.y = drone.lastY || prevY;
      } else {
        drone.lastX = drone.x; // Update last known position
        drone.lastY = drone.y;
      }
    } else {
      drone.lastX = drone.x; // Initialize tracking
      drone.lastY = drone.y;
    }
    
    // Other drones shoot discrete lasers occasionally when audio is active
    if (droneIdx !== 0) {
      if (drone.laserCooldown === undefined) drone.laserCooldown = 0;
      if (drone.laserCooldown <= 0 && analyserNode && (snareHit || bassLevel > 0.5)) {
        const targetX = random(0, width);
        const targetY = random(height * 0.3, height * 0.9);
        createLaser(drone.x, drone.y, targetX, targetY, drone.hue);
        drone.laserCooldown = random(2000, 4000);
      }
      drone.laserCooldown -= deltaTime * 1000;
    }
    
    // Get hue for both drone and WiFi symbol
    const hue = drone.hue;
    
    // Draw scanning laser beam FIRST (behind drone) - circular scanning around screen edges
    if (isLaserDrone && drone.laserScanAngle !== undefined) {
      push();
      
      // Calculate circular scan angle (0 to TWO_PI)
      const scanAngle = drone.laserScanAngle;
      
      // Calculate intersection point with screen edges
      // Start from drone position
      const startX = drone.x;
      const startY = drone.y;
      
      // Calculate direction vector
      const dirX = cos(scanAngle);
      const dirY = sin(scanAngle);
      
      // Find intersection with screen edges
      let endX, endY;
      let t = Infinity;
      
      // Check intersection with left edge (x = 0)
      if (dirX < 0) {
        const tLeft = -startX / dirX;
        if (tLeft > 0 && tLeft < t) {
          t = tLeft;
          endX = 0;
          endY = startY + dirY * t;
        }
      }
      
      // Check intersection with right edge (x = width)
      if (dirX > 0) {
        const tRight = (width - startX) / dirX;
        if (tRight > 0 && tRight < t) {
          t = tRight;
          endX = width;
          endY = startY + dirY * t;
        }
      }
      
      // Check intersection with top edge (y = 0)
      if (dirY < 0) {
        const tTop = -startY / dirY;
        if (tTop > 0 && tTop < t) {
          t = tTop;
          endX = startX + dirX * t;
          endY = 0;
        }
      }
      
      // Check intersection with bottom edge (y = height)
      if (dirY > 0) {
        const tBottom = (height - startY) / dirY;
        if (tBottom > 0 && tBottom < t) {
          t = tBottom;
          endX = startX + dirX * t;
          endY = height;
        }
      }
      
      // Ensure we have valid endpoints
      if (t === Infinity) {
        // Fallback: extend to screen corner
        endX = startX + dirX * width * 2;
        endY = startY + dirY * height * 2;
      }
      
      // Clamp to screen bounds
      endX = constrain(endX, 0, width);
      endY = constrain(endY, 0, height);
      
      // Calculate beam width (thinner beam)
      const beamWidth = 60;
      const beamLength = dist(startX, startY, endX, endY);
      
      // Draw laser beam as a line from drone to edge
      colorMode(HSL);
      const laserHue = 0; // Red - threatening color
      const laserIntensity = analyserNode ? (bassLevel * 0.6 + 0.4) : 0.8;
      
      // Calculate perpendicular direction for beam width
      const perpAngle = scanAngle + PI / 2;
      const perpX = cos(perpAngle);
      const perpY = sin(perpAngle);
      
      // Outer glow
      stroke(laserHue, 90, 70, laserIntensity * 0.4);
      strokeWeight(beamWidth);
      line(startX, startY, endX, endY);
      
      // Main laser beam
      stroke(laserHue, 100, 85, laserIntensity * 0.7);
      strokeWeight(beamWidth * 0.6);
      line(startX, startY, endX, endY);
      
      // Bright center beam
      stroke(laserHue, 100, 95, laserIntensity * 0.9);
      strokeWeight(beamWidth * 0.3);
      line(startX, startY, endX, endY);
      
      pop();
    }
    
    // Draw drone - SIMPLE AND CLEAN
    push();
    translate(drone.x, drone.y);
    
    // Rotate to face movement direction (0=right, 1=down, 2=left, 3=up)
    const rotationAngle = drone.moveDirection * PI / 2;
    rotate(rotationAngle);
    
    scale(drone.scale);
    
    colorMode(HSL);
    const ledIntensity = analyserNode ? (bassLevel * 0.7 + trebleLevel * 0.5) : 0.5;
    
    // Main body
    fill(hue, 85, 65, drone.opacity);
    stroke(0, 0, 0, drone.opacity);
    strokeWeight(4);
    ellipse(0, 0, 22, 16);
    
    // Propellers (4 arms)
    stroke(hue, 75, 55, drone.opacity);
    strokeWeight(4);
    
    const armLength = 16;
    const props = [
      { x: 0, y: -armLength },
      { x: armLength, y: 0 },
      { x: 0, y: armLength },
      { x: -armLength, y: 0 }
    ];
    
    for (let p = 0; p < props.length; p++) {
      const prop = props[p];
      // Arm
      line(0, 0, prop.x, prop.y);
      
      // Spinning propeller
      push();
      translate(prop.x, prop.y);
      rotate(drone.propPhase);
      
      fill(hue, 65, 70, drone.opacity * 0.6);
      noStroke();
      for (let blade = 0; blade < 2; blade++) {
        const bladeAngle = blade * PI;
        const bladeX = cos(bladeAngle) * 12;
        const bladeY = sin(bladeAngle) * 12;
        ellipse(bladeX, bladeY, 15, 4);
      }
      
      fill(hue, 70, 55, drone.opacity);
      ellipse(0, 0, 6, 6);
      pop();
    }
    
    // LEDs
    fill(hue, 100, 90, Math.max(0.7, ledIntensity) * drone.opacity);
    noStroke();
    ellipse(-7, -3, 5, 5);
    ellipse(7, -3, 5, 5);
    
    // LED glow
    fill(hue, 95, 90, Math.max(0.5, ledIntensity) * drone.opacity * 0.5);
    ellipse(-7, -3, 10, 10);
    ellipse(7, -3, 10, 10);
    
    // Camera
    fill(0, 0, 25, drone.opacity);
    stroke(hue, 55, 45, drone.opacity);
    strokeWeight(2);
    ellipse(0, -4, 8, 6);
    
    fill(200, 75, 85, drone.opacity * 0.8);
    ellipse(0, -4, 4, 4);
    
    pop();
    
    // Draw WiFi symbol when drone is communicating/surveying
    if (drone.wifiActive) {
      push();
      translate(drone.x, drone.y);
      
      // Draw WiFi symbol closer to drone
      const wifiY = -25 * drone.scale; // Closer position above drone
      const wifiSize = 18 * drone.scale;
      const wifiOpacity = 0.8 + sin(drone.wifiPhase) * 0.2; // More visible pulsing
      
      colorMode(HSL);
      // Use brighter, more saturated colors
      const wifiHue = hue;
      const wifiSat = 100; // Maximum saturation
      const wifiLight = 85; // Bright color
      stroke(wifiHue, wifiSat, wifiLight, drone.opacity * wifiOpacity);
      strokeWeight(12); // Much thicker lines
      strokeCap(ROUND);
      noFill();
      
      // Draw WiFi symbol (3 curved arcs - semicircles)
      const arcSpacing = wifiSize / 3;
      for (let arcIdx = 0; arcIdx < 3; arcIdx++) {
        const arcRadius = (arcIdx + 1) * arcSpacing;
        // Draw semicircle arc (from PI to 0, which is top half)
        arc(0, wifiY, arcRadius * 2, arcRadius * 2, PI, 0);
      }
      
      // Draw center dot - brighter and larger
      fill(wifiHue, wifiSat, wifiLight, drone.opacity * wifiOpacity);
      noStroke();
      ellipse(0, wifiY, 6, 6);
      
      pop();
    }
  } // End of drone loop
  
  colorMode(HSL);
}

// Create laser beam - SIMPLE AND VISIBLE
function createLaser(x1, y1, x2, y2, hue) {
  if (!lasers) lasers = [];
  lasers.push({
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    hue: hue || random(0, 360),
    lifetime: 0,
    maxLifetime: 3000, // Lasers last 3 seconds for better visibility
    opacity: 1.0
  });
}

// Draw lasers - MAXIMUM VISIBILITY WITH MOVEMENT
function drawLasers() {
  if (!lasers) lasers = [];
  if (!deltaTime) deltaTime = 0.016;
  
  // Save current drawing state
  push();
  
  // Force RGB mode and ensure we're on top
  colorMode(RGB);
  blendMode(BLEND);
  
  // Draw all lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    
    // Update lifetime
    laser.lifetime += deltaTime * 1000;
    
    // Remove if expired
    if (laser.lifetime >= laser.maxLifetime) {
      lasers.splice(i, 1);
      continue;
    }
    
    // Calculate progress and movement
    const progress = laser.lifetime / laser.maxLifetime;
    
    // Add movement - lasers sweep across screen
    const moveSpeed = 3;
    const angle = atan2(laser.y2 - laser.y1, laser.x2 - laser.x1);
    laser.x1 += cos(angle + PI/2) * moveSpeed * deltaTime;
    laser.y1 += sin(angle + PI/2) * moveSpeed * deltaTime;
    laser.x2 += cos(angle + PI/2) * moveSpeed * deltaTime;
    laser.y2 += sin(angle + PI/2) * moveSpeed * deltaTime;
    
    // Pulsing effect
    const pulse = sin(progress * TWO_PI * 3) * 0.3 + 1.0;
    
    // Very bright, saturated colors
    const colors = [
      [255, 0, 0],      // Pure Red
      [0, 255, 0],      // Pure Green
      [0, 0, 255],      // Pure Blue
      [255, 255, 0],    // Pure Yellow
      [255, 0, 255],    // Pure Magenta
      [0, 255, 255]     // Pure Cyan
    ];
    const colorIndex = Math.floor((laser.hue || 0) / 60) % colors.length;
    let [r, g, b] = colors[colorIndex];
    
    // Maximum brightness
    r = Math.min(255, r + 150);
    g = Math.min(255, g + 150);
    b = Math.min(255, b + 150);
    
    // Draw multiple layers for maximum visibility
    
    // Outermost glow - very wide and bright
    stroke(r, g, b, 180);
    strokeWeight(50 * pulse);
    line(laser.x1, laser.y1, laser.x2, laser.y2);
    
    // Outer glow
    stroke(r, g, b, 220);
    strokeWeight(40 * pulse);
    line(laser.x1, laser.y1, laser.x2, laser.y2);
    
    // Middle glow
    stroke(r, g, b, 250);
    strokeWeight(30 * pulse);
    line(laser.x1, laser.y1, laser.x2, laser.y2);
    
    // Inner glow - brightest core
    stroke(r, g, b, 255);
    strokeWeight(18 * pulse);
    line(laser.x1, laser.y1, laser.x2, laser.y2);
    
    // Bright core
    stroke(255, 255, 255, 255);
    strokeWeight(6 * pulse);
    line(laser.x1, laser.y1, laser.x2, laser.y2);
    
    // Impact point with pulsing
    noStroke();
    fill(r, g, b, 200);
    ellipse(laser.x2, laser.y2, 50 * pulse, 50 * pulse);
    fill(r, g, b, 255);
    ellipse(laser.x2, laser.y2, 30 * pulse, 30 * pulse);
    fill(255, 255, 255, 255);
    ellipse(laser.x2, laser.y2, 15 * pulse, 15 * pulse);
  }
  
  // Restore drawing state
  pop();
  
  // Restore HSL mode
  colorMode(HSL);
}

// Draw rockets (launching and falling)
function drawRockets() {
  if (!deltaTime) deltaTime = 0.016; // Fallback if deltaTime not defined
  
  const currentTime = millis();
  
  // Rockets react to bass and snare hits (with fallbacks)
  const safeBassLevel = analyserNode ? (bassLevel || 0.3) : 0.3;
  const safeSnareHit = analyserNode ? (snareHit || false) : false;
  const safeOverallEnergy = analyserNode ? (overallEnergy || 0.3) : 0.3;
  const rocketTrigger = analyserNode ?
    ((safeBassLevel > 0.4 && safeSnareHit) || (safeOverallEnergy > 0.5 && random() < 0.02)) :
    (random() < 0.03); // Spawn occasionally without audio
  
  // Spawn launching rockets from ground/buildings - DISABLED (only one rocket)
  if (false && rocketTrigger && rockets.length < 6) {
    const launchType = random() < 0.7 ? 'launch' : 'fall'; // 70% launch, 30% fall
    
    if (launchType === 'launch') {
      // Only spawn if no rocket exists - ensure only one
      if (rockets.length === 0) {
        rockets.push({
          x: width / 2, // Start at center (moon/sun position)
          y: height * 0.9, // Start at bottom (ground level)
          vx: 0, // Will be calculated toward moon
          vy: -1.5, // Strong upward velocity (launches toward moon)
          hue: random(0, 60), // Red/orange/yellow
          scale: random(3.75, 5.0), // 4X SMALLER
          opacity: 1,
          lifetime: 0,
          maxLifetime: 100000, // Very long lifetime
          type: 'parabolic',
          rotation: 0,
          rotationSpeed: 0,
          trailPhase: random(0, TWO_PI)
        });
      }
    }
  }
  
  // Rockets eliminated - don't draw anything
  if (!showRockets || rockets.length === 0) {
    return; // Exit early if rockets are disabled
  }
  
  for (let i = rockets.length - 1; i >= 0; i--) {
    const rocket = rockets[i];
    rocket.lifetime += deltaTime * 60;
    
    // PARABOLIC TRAJECTORY TOWARD MOON/SUN - MUSIC REACTIVE MOVEMENT
    const moonX = width / 2; // Moon/sun is at center horizontally
    const moonY = height / 2; // Moon/sun is at center vertically
    
    // Get music levels for trajectory impact
    const musicBassLevel = analyserNode ? (bassLevel || 0.3) : 0.3;
    const musicMidLevel = analyserNode ? (midLevel || 0.3) : 0.3;
    const musicTrebleLevel = analyserNode ? (trebleLevel || 0.3) : 0.3;
    const musicOverallEnergy = analyserNode ? (overallEnergy || 0.3) : 0.3;
    
    // Calculate direction toward moon/sun
    const dx = moonX - rocket.x;
    const dy = moonY - rocket.y;
    const distanceToMoon = sqrt(dx * dx + dy * dy);
    
    // MUSIC IMPACTS TRAJECTORY - Bass affects vertical, Mid affects horizontal, Treble affects wobble
    const musicWobbleX = sin(rocket.lifetime * 0.15) * musicTrebleLevel * 0.5; // Treble affects horizontal wobble
    const musicWobbleY = cos(rocket.lifetime * 0.12) * musicMidLevel * 0.4; // Mid affects vertical wobble
    
    // Bass boosts upward velocity (launches higher with bass)
    const bassBoost = musicBassLevel * 0.3; // Bass pushes rocket up
    
    // If rocket hasn't reached moon area, adjust trajectory toward it
    if (distanceToMoon > 50 && rocket.lifetime < 2000) {
      // Add slight pull toward moon (like gravity) with music-reactive wobble
      const pullStrength = 0.0003;
      rocket.vx += (dx / distanceToMoon) * pullStrength * deltaTime * 30 + musicWobbleX * deltaTime * 30;
      rocket.vy += (dy / distanceToMoon) * pullStrength * deltaTime * 30 + musicWobbleY * deltaTime * 30 - bassBoost * deltaTime * 30;
    } else {
      // Add music-reactive wobble even when near moon
      rocket.vx += musicWobbleX * deltaTime * 30;
      rocket.vy += musicWobbleY * deltaTime * 30 - bassBoost * deltaTime * 30;
    }
    
    // Update position with dynamic movement
    rocket.x += rocket.vx * deltaTime * 30; // Horizontal movement
    rocket.y += rocket.vy * deltaTime * 30; // Vertical movement
    
    // Apply gravity for natural parabolic trajectory - MUSIC AFFECTS GRAVITY
    const gravityStrength = 0.08 - (musicBassLevel * 0.02); // Less gravity with bass (rocket floats more)
    rocket.vy += gravityStrength * deltaTime * 30; // Gravity pulls down (creates natural parabola)
    
    // No rotation - rocket stays horizontal
    rocket.rotation = 0; // Keep rocket horizontal (no rotation)
    
    // Add scale pulsing for more visual interest
    const scalePulse = 1 + sin(rocket.lifetime * 0.3) * 0.05; // Slight scale pulsing
    rocket.scale = rocket.scale * scalePulse; // Apply pulsing (will reset on reset)
    
    // NATURAL TRAJECTORY - Reset when rocket completes arc or reaches moon
    // When rocket goes below ground OR reaches moon area, reset to launch position
    if (rocket.y > height * 0.95 || distanceToMoon < 30) {
      // Reset to launch position for continuous parabolic trajectory toward moon
      rocket.x = width / 2; // Start at center (below moon)
      rocket.y = height * 0.9; // Start at bottom (ground level)
      rocket.vx = 0; // Reset horizontal velocity  
      rocket.vy = -1.5; // Reset upward velocity (launches toward moon)
      rocket.lifetime = 0; // Reset lifetime
      rocket.scale = random(20.0, 30.0); // Reset scale - HUGE
    }
    
    // Keep rocket from going too high (above moon)
    if (rocket.y < height * 0.1) {
      rocket.y = height * 0.1; // Don't go above top boundary
    }
    
    // Ensure rocket is always visible - don't remove it
    // The rocket will loop continuously with parabolic trajectory
    
    // Update trail phase for fire animation
    rocket.trailPhase += deltaTime * 5;
    
    // Don't remove the rocket - it loops continuously with parabolic trajectory
    // The reset logic above handles keeping it in bounds
    
    // Draw rocket - DEBUG: Ensure it's drawn
    push();
    translate(rocket.x, rocket.y);
    rotate(rocket.rotation);
    scale(rocket.scale || 1.0); // Ensure scale exists
    
    colorMode(HSL);
    const rocketHue = rocket.hue || 0; // Ensure hue exists
    
    // DEBUG: Draw a large red circle to verify position
    fill(0, 100, 50, 1); // Bright red
    noStroke();
    ellipse(0, 0, 50, 50); // Large red circle for debugging
    
    // Rocket body - CLASSIC 2D ROCKET DESIGN - MORE INTERESTING
    colorMode(HSL);
    
    // Determine rocket direction for side view
    const dir = rocket.vx >= 0 ? 1 : -1; // 1 = right, -1 = left
    
    // Main rocket body (horizontal cylinder) - BRIGHT RED - MAXIMUM VISIBILITY
    fill(0, 100, 50, 1); // BRIGHT RED - MAXIMUM VISIBILITY
    stroke(0, 0, 0, 1); // Black outline - FULL OPACITY
    strokeWeight(20); // Very thick outline - MAXIMUM VISIBILITY
    rectMode(CENTER);
    rect(0, 0, 200, 50); // Horizontal cylindrical body (side view) - HUGE FOR VISIBILITY
    
    // Rocket nose cone (pointed front) - BRIGHT RED - MAXIMUM VISIBILITY
    fill(0, 100, 60, 1); // BRIGHT RED - FULL OPACITY
    stroke(0, 0, 0, 1); // Black outline - FULL OPACITY
    strokeWeight(12); // Thicker outline
    beginShape();
    vertex(dir * 60, 0); // Sharp point (front) - HUGE
    vertex(dir * 35, -16);
    vertex(dir * 35, 16);
    endShape(CLOSE);
    
    // Nose cone tip - BRIGHT YELLOW - MORE VISIBLE
    fill(60, 100, 100, 1); // Maximum brightness yellow - FULL OPACITY
    noStroke();
    triangle(dir * 60, 0, dir * 50, -12, dir * 50, 12); // Huge yellow tip
    
    // Rocket body stripes - RED/ORANGE - MULTIPLE STRIPES - MAXIMUM VISIBILITY
    fill(rocketHue, 100, 75, 1); // Bright red/orange stripe - FULL OPACITY
    noStroke();
    rect(dir * -5, 0, 60, 10); // Main stripe - HUGE
    rect(dir * 10, 0, 35, 8); // Secondary stripe - HUGE
    
    // Rocket body details - WINDOWS/PANELS - MAXIMUM VISIBILITY
    fill(200, 90, 100, 1); // Maximum brightness blue/gray - FULL OPACITY
    stroke(0, 0, 0, 1); // FULL OPACITY
    strokeWeight(6); // Thicker stroke
    ellipse(dir * -12, 0, 18, 18); // Window 1 - HUGE
    ellipse(dir * 0, 0, 18, 18); // Window 2 - HUGE
    ellipse(dir * 12, 0, 15, 15); // Window 3 - LARGE
    
    // Window highlights - BRIGHT - MAXIMUM VISIBILITY
    fill(200, 70, 100, 1); // Maximum brightness blue - FULL OPACITY
    noStroke();
    ellipse(dir * -12, -4, 9, 9); // Highlight 1 - HUGE
    ellipse(dir * 0, -4, 9, 9); // Highlight 2 - HUGE
    
    // Fins (side view - triangular fins at back) - RED/ORANGE - MAXIMUM VISIBILITY
    fill(rocketHue, 100, 70, 1); // Bright red/orange fins - FULL OPACITY
    stroke(0, 0, 0, 1); // FULL OPACITY
    strokeWeight(8); // Very thick stroke
    
    // Top fin (back) - HUGE
    triangle(-dir * 30, -11, -dir * 42, -26, -dir * 30, -18);
    // Bottom fin (back) - HUGE
    triangle(-dir * 30, 11, -dir * 42, 26, -dir * 30, 18);
    
    // Fin details - darker edges and highlights - MAXIMUM VISIBILITY
    fill(rocketHue, 100, 45, 1); // Darker red/orange - FULL OPACITY
    noStroke();
    triangle(-dir * 30, -11, -dir * 35, -20, -dir * 30, -17);
    triangle(-dir * 30, 11, -dir * 35, 20, -dir * 30, 17);
    
    // Fin highlights - BRIGHT - MAXIMUM VISIBILITY
    fill(rocketHue, 100, 75, 1); // Lighter red/orange - FULL OPACITY
    noStroke();
    triangle(-dir * 30, -11, -dir * 33, -16, -dir * 30, -14);
    triangle(-dir * 30, 11, -dir * 33, 16, -dir * 30, 14);
    
    // Rocket base/engine area - BLACK - MORE DETAILED
    fill(0, 0, 15, rocket.opacity); // Very dark black
    stroke(0, 0, 0, rocket.opacity);
    strokeWeight(4);
    rectMode(CENTER);
    rect(-dir * 22, 0, 10, 14); // Engine area at back - larger
    
    // Engine details - METAL RINGS
    fill(rocketHue, 20, 40, rocket.opacity); // Dark gray
    stroke(0, 0, 0, rocket.opacity);
    strokeWeight(2);
    ellipse(-dir * 22, -4, 8, 3); // Ring 1
    ellipse(-dir * 22, 0, 8, 3); // Ring 2
    ellipse(-dir * 22, 4, 8, 3); // Ring 3
    
    // Body highlights - SHINY
    fill(rocketHue, 5, 100, rocket.opacity * 0.5); // Very bright white highlight
    noStroke();
    rect(dir * 5, -5, 30, 2); // Top highlight
    rect(dir * 5, 5, 30, 2); // Bottom highlight
    
    // Rocket exhaust/flame - SIMPLE 2D FIRE - VERY OBVIOUS
    const safeBassLevel = analyserNode ? (bassLevel || 0.3) : 0.3;
    const safeOverallEnergy = analyserNode ? (overallEnergy || 0.3) : 0.3;
    const trailIntensity = analyserNode ? (safeBassLevel * 0.6 + safeOverallEnergy * 0.4) : 0.8;
    // Exhaust flame - ANIMATED FLAME - MORE INTERESTING
    const exhaustX = -dir * 25; // Back of rocket (side view)
    const exhaustY = 0; // Center vertically
    
    // Animated flame that pulses and moves
    const fireHue = rocketHue;
    const flamePulse = 1 + sin(rocket.trailPhase * 2) * 0.3; // Flame pulsing
    const flameSize = 8 * flamePulse; // Animated flame size
    const flameOffset = sin(rocket.trailPhase * 3) * 2; // Flame movement
    
    // Single animated flame - RED/ORANGE with pulsing
    fill(fireHue, 100, 70, rocket.opacity * (0.7 + sin(rocket.trailPhase) * 0.2)); // Pulsing opacity
    noStroke();
    ellipse(exhaustX - dir * 3 + flameOffset, exhaustY, flameSize, flameSize * 0.75); // Animated flame
    
    // Small inner core - BRIGHT
    fill(fireHue, 100, 90, rocket.opacity * 0.5);
    ellipse(exhaustX - dir * 3 + flameOffset, exhaustY, flameSize * 0.5, flameSize * 0.4);
  }
}

// Initialize biplane with banner
function initializeBiplane() {
  if (!deltaTime) deltaTime = 0.016;
  
  // Calculate starting position so banner is fully visible
  // Banner position: bannerX = plane.x - ropeLength - 100 = plane.x - 500
  // For banner to be visible: bannerX should be >= 0 (fully visible)
  // Start plane far enough right that banner is visible on screen
  const ropeLength = 400;
  const bannerSpacing = 100;
  const bannerOffset = ropeLength + bannerSpacing; // 500px
  const minPlaneX = bannerOffset + 100; // Ensure banner starts visible with margin
  const startX = max(width * 0.75, minPlaneX); // Start at 75% of screen width minimum
  
  biplane = {
    x: startX, // Start far enough right so banner is visible (at least width * 0.75)
    y: height * 0.3, // Fly in upper third of screen
    speed: 0.002, // Very very slow horizontal speed
    direction: 1, // Always fly left to right
    scale: 4.5, // 3x larger (was 1.5)
    propPhase: 0, // Propeller rotation
    wingFlap: 0, // Wing animation
    bannerWave: 0, // Banner waving animation
    hue: 200, // Blue color
    bannerText: "my house is your house",
    bannerLength: 600, // 3x larger (was 200)
    bannerHeight: 90, // 3x larger (was 30)
    ropeLength: 400 // Much farther from plane (was 240)
  };
}

// Draw biplane with waving banner
function drawBiplane() {
  if (!biplane) return;
  
  if (!deltaTime) deltaTime = 0.016;
  
  // Update biplane position - always fly left to right
  biplane.x += biplane.speed * biplane.direction * deltaTime * 60;
  
  // Loop biplane: when it reaches right edge, reset to right side (so banner is visible)
  if (biplane.x > width + 200) {
    const ropeLength = biplane.ropeLength || 400;
    const bannerOffset = ropeLength + 100;
    const minPlaneX = bannerOffset + 100;
    biplane.x = max(width * 0.75, minPlaneX); // Reset to right side so banner is visible when it appears
  }
  
  // Update animations
  biplane.propPhase += deltaTime * 20; // Fast propeller rotation
  biplane.wingFlap += deltaTime * 2; // Gentle wing flapping
  biplane.bannerWave += deltaTime * 3; // Banner waving
  
  // Gentle vertical floating
  biplane.y += sin(biplane.wingFlap * 0.5) * 0.3;
  
  // Draw banner first (behind plane)
  // Banner is pulled behind/to the left of plane (plane flies left to right)
  // Position banner so it doesn't overlap with plane - much farther away
  const bannerX = biplane.x - biplane.ropeLength - 100; // Banner is much farther behind plane
  const bannerY = biplane.y + 15;
  
  // Draw banner with waving effect
  push();
  translate(bannerX, bannerY);
  
  // Wave the banner using sine waves
  const waveAmount = sin(biplane.bannerWave) * 15; // Wave amplitude
  const waveFrequency = 0.1; // How many waves
  
  colorMode(HSL);
  
  // Draw banner as a curved shape that waves
  fill(0, 0, 95, 1.0); // White banner (opacity handled by globalAlpha)
  stroke(0, 0, 0, 1.0);
  strokeWeight(2);
  
  beginShape();
  // Top edge with wave
  for (let i = 0; i <= biplane.bannerLength; i += 5) {
    const wave = sin(i * waveFrequency + biplane.bannerWave) * waveAmount;
    vertex(i - biplane.bannerLength / 2, wave);
  }
  // Bottom edge with wave (offset)
  for (let i = biplane.bannerLength; i >= 0; i -= 5) {
    const wave = sin(i * waveFrequency + biplane.bannerWave + PI) * waveAmount;
    vertex(i - biplane.bannerLength / 2, biplane.bannerHeight + wave);
  }
  endShape(CLOSE);
  
  // Draw text on banner - each character waves along with the banner
  fill(0, 0, 0, 1.0); // Black text (opacity handled by globalAlpha)
  noStroke();
  textSize(36); // 3x larger (was 12)
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  
  // Draw text character by character along the wave path
  const textChars = biplane.bannerText.split('');
  const charSpacing = biplane.bannerLength / (textChars.length + 1); // Space characters evenly
  
  for (let i = 0; i < textChars.length; i++) {
    // Calculate position along banner (from left to right)
    const charX = (i + 1) * charSpacing - biplane.bannerLength / 2;
    
    // Calculate wave offset at this position (matching banner wave)
    const wave = sin(charX * waveFrequency + biplane.bannerWave) * waveAmount;
    
    // Calculate wave angle for character rotation (derivative of wave function)
    const waveAngle = cos(charX * waveFrequency + biplane.bannerWave) * waveFrequency * waveAmount;
    
    // Position and rotate character to follow the wave
    push();
    translate(charX, biplane.bannerHeight / 2 + wave);
    rotate(waveAngle); // Rotate character to follow wave slope
    text(textChars[i], 0, 0);
    pop();
  }
  
  pop();
  
  // Draw ropes connecting plane to banner (banner pulled behind plane)
  push();
  stroke(0, 0, 0, 1.0); // Opacity handled by globalAlpha
  strokeWeight(2);
  // Ropes connect from plane's back/left side to banner's front/right side
  line(biplane.x - 15, biplane.y + 10, 
       bannerX + biplane.bannerLength / 2, bannerY);
  line(biplane.x - 15, biplane.y + 20, 
       bannerX + biplane.bannerLength / 2, bannerY + biplane.bannerHeight);
  pop();
  
  // Draw biplane
  push();
  translate(biplane.x, biplane.y);
  scale(biplane.scale);
  
  // Flip if going left
  if (biplane.direction === -1) {
    scale(-1, 1);
  }
  
  colorMode(HSL);
  const hue = biplane.hue;
  
  // Lower wing (larger)
  fill(hue, 70, 60, 1.0); // Opacity handled by globalAlpha
  stroke(0, 0, 0, 1.0);
  strokeWeight(2);
  ellipse(0, 8, 40, 8);
  
  // Upper wing (smaller, with flap animation)
  const wingFlapOffset = sin(biplane.wingFlap) * 2;
  push();
  translate(0, -8 + wingFlapOffset);
  fill(hue, 70, 60, 1.0); // Opacity handled by globalAlpha
  ellipse(0, 0, 35, 7);
  pop();
  
  // Wing struts (connecting upper and lower wings)
  stroke(hue, 50, 40, 1.0); // Opacity handled by globalAlpha
  strokeWeight(2);
  line(-12, -8 + wingFlapOffset, -10, 8);
  line(12, -8 + wingFlapOffset, 10, 8);
  
  // Fuselage (body)
  fill(hue, 60, 50, 1.0); // Opacity handled by globalAlpha
  stroke(0, 0, 0, 1.0);
  strokeWeight(2);
  ellipse(0, 0, 25, 8);
  
  // Tail
  fill(hue, 70, 60, 1.0); // Opacity handled by globalAlpha
  triangle(-12, 0, -18, -5, -18, 5);
  
  // Propeller (spinning)
  push();
  translate(12, 0);
  rotate(biplane.propPhase);
  stroke(hue, 50, 40, 1.0); // Opacity handled by globalAlpha
  strokeWeight(3);
  line(0, 0, 8, 0);
  line(0, 0, -8, 0);
  line(0, 0, 0, 8);
  line(0, 0, 0, -8);
  pop();
  
  // Cockpit
  fill(200, 50, 70, 1.0); // Opacity handled by globalAlpha
  stroke(0, 0, 0, 1.0);
  strokeWeight(1);
  ellipse(2, -2, 8, 6);
  
  pop();
}

// Draw a basic polygon, handles triangles, squares, pentagons, etc
function polygon(x, y, radius, sides = 3, angle = 0) {
  beginShape();
  for (let i = 0; i < sides; i++) {
    const a = angle + TWO_PI * (i / sides);
    let sx = x + cos(a) * radius ;
    let sy = y + sin(a) * radius;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}
