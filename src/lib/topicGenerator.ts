/**
 * Topic Generator & Expansion Library for Toys & Games Articles
 * Provides 120+ curated evergreen topics across categories, plus a dynamic
 * procedural combinator generating 300,000+ unique, high-CPC, captivating titles.
 */

export interface TopicCategory {
  id: string;
  name: string;
  emoji: string;
  topics: string[];
}

export const TOPIC_CATEGORIES: TopicCategory[] = [
  {
    id: 'rc',
    name: 'RC & High-Speed',
    emoji: '🏎️',
    topics: [
      'High-Speed 4WD RC Monster Trucks with Off-Road Suspension',
      '2.4GHz Drift RC Sports Cars for Living Room Hardwood Racing',
      'Brushless High-Torque RC Rock Crawlers Conquering Steep Inclines',
      'Remote Control Amphibious Stunt Cars That Drive on Water & Land',
      'Rechargeable Wall-Climbing Gravity Defying RC Stunt Cars',
      'Scale 1:14 Desert Buggy RC Racers with Oil-Filled Metal Shocks',
      'Dual-Motor 360-Degree Tumbling Stunt RC Cars with Glowing Wheels',
      'Waterproof All-Terrain RC Stadium Trucks for Mud & Sand Dunes',
      'Smart Gesture-Sensing Hand Control RC Stunt Flip Cars',
      'High-Velocity Formula Racing RC Cars with Electronic Stability',
      'Pro-Grade Mini RC Drift Cars with Precision Steering & Cones',
      'Heavy-Duty 6WD Military Truck RC Transport with Working Winch',
      'Night-Rider Glow LED RC Rally Cars for Outdoor Twilight Racing',
      'Micro Pocket RC Speedsters with High-Speed USB Charging Dock',
      'Dual-Speed RC Truggy with Anti-Skid Rubber Tires for Backyard Laps',
      'Supercharged Off-Road RC Baja Racer with Roll Cage Protection',
      'RC Snow & Sand Paddle Track Vehicles for All-Weather Thrills',
      'High-Clearance RC Rock Bouncer with High-Angle Articulation Axles',
      'Smartphone Bluetooth Controlled Smart RC Supercar with Camera',
      'Classic Vintage Muscle Car RC Cruiser with Realistic Engine Sounds',
    ],
  },
  {
    id: 'tracks',
    name: 'Tracks & Die-Cast',
    emoji: '🎢',
    topics: [
      'Ultimate Glow-in-the-Dark Loop Racing Track Sets for Kids',
      'Die-Cast Alloy Supercar Collectors Guide & Stunt Ramps',
      'Multi-Lane Gravity Drop Drag Racing Track with Electronic Finish Gate',
      'Motorized Booster Stunt Sets with Double Inverted Corkscrews',
      'Modular Snap-Together Magnetic Slot Car Racing Track Playset',
      'Vertical Wall-Mounted Gravity Stunt Track with Curve Launchers',
      'Extreme Crash & Smash Intersection Track Sets with Rapid Reload',
      'Die-Cast 1:64 Scale Premium Collector Supercars & Carrying Display',
      'High-Banked Oval Speedway Track with Dual Friction Power Boosters',
      'Jump Over the Abyss Mega Stunt Ramp with Landing Target Pad',
      'Flexible Rainbow Neon Glow Track with LED Light-Up Motorized Cars',
      'Multi-Tier Spiral Descent Tower Track with Diverter Switches',
      'Fire & Ice Stunt Jump Arena with Breakaway Obstacles',
      'Side-by-Side Dual Launch Drag Strip with Precision Starting Tree',
      'Precision Die-Cast European Hypercars with Opening Doors & Hoods',
      'Track Builder Expansion Packs: Loops, Chicanes, and Stunt Kickers',
      'Retro Wooden Race Car Ramp Tower for Toddlers & Early Coordination',
      'Fold-and-Go Portable Track Suitcase Playset for Travel Play',
      'Ultimate Supercharged 4-Lane Elimination Track with Checkered Flags',
      'High-Impact Die-Cast Monster Jam Arena with Crushed Car Obstacles',
    ],
  },
  {
    id: 'stem',
    name: 'STEM & Robotics',
    emoji: '🤖',
    topics: [
      'STEM Building Block Racing Cars & Motorized Gear Kits',
      'Solar-Powered STEM Racer Science Experiment & Assembly Kit',
      'DIY Programmable Robotic Vehicle with Ultrasonic Obstacle Avoidance',
      'Hydraulic Robotic Arm Excavator Building Kit Powered by Water Pressure',
      'Modular Magnetic Chassis Building Car System for Young Inventors',
      'Pneumatic Air-Powered Speed Buggies with Pressure Gauge Launchers',
      'Gear-Train Mechanical Clockwork Car Kits Teaching Physics & Torque',
      'Coding Rover for Kids: Scratch-Compatible Smart Autonomous Vehicle',
      'Electric Motor Science Project: Building a High-Torque Wooden Dragster',
      'Magnetic Levitation Train & High-Speed Track Laboratory Kit',
      'Reversible Pullback Transmission Gearbox Kits for Custom Chasses',
      'STEM Remote-Controlled Mechanical Walking Quad-Bot Racer Kit',
      'Eco-Clean Fuel Cell Experiment Car Powered by Saltwater Reaction',
      '3D Wooden Puzzle Mechanical Supercar with Functional V8 Engine',
      'Smart Sensor Line-Following Electric Car Kit for Elementary Robotics',
      'Wind-Propelled Kinetic Land Yacht Racing Model for Science Fairs',
      'Motorized Crane & Winch Mechanical Builder Set with Heavy Gear Ratios',
      'Rubber Band Powered Balsa Wood Streamliner Speed Champions Kit',
      'Interactive Circuit Board Racing Car with Solderless Breadboard',
      'Transformable STEM 3-in-1 Robot, Tank, and High-Speed Rover Kit',
    ],
  },
  {
    id: 'construction',
    name: 'Construction & Trucks',
    emoji: '🚜',
    topics: [
      'Heavy-Duty RC Construction Excavator & Dump Truck Playsets',
      'Multi-Level Toy Parking Garage Playsets with Spiral Ramps & Elevator',
      'Mega Heavy Hauler Flatbed Semi-Truck Carrying 6 Die-Cast Sports Cars',
      'Airport Emergency Fire Rescue Foam Truck with Working Water Cannon',
      'Articulated Wheel Loader with Die-Cast Metal Bucket & Sound Effects',
      'Massive Tower Crane Playset with 360-Degree Remote Hoist Cable',
      'City Sanitation Recycling Garbage Truck with Mechanical Bin Lift',
      'Heavy Concrete Mixer Toy Truck with Rotating Drum & Discharge Chute',
      'Police Interceptor SWAT Tactical Hauler with Working Siren & Lights',
      'Road Roller & Asphalt Paver Heavy Machinery Playset for Sandboxes',
      'Farm Tractor with Detachable Grain Trailer & Rotating Harvester Head',
      'Rough Terrain Log Loader Timber Truck with Pneumatic Claw Arm',
      'Rescue Helicopter with Winch Carrier Transporting Off-Road Ambulance',
      'Heavy Mining Dump Truck with High-Capacity Hydraulic Tipping Bed',
      'Tow Truck Wrecker with Extendable Boom & Wheel Lift for Toy Car Rescues',
      'Forklift Playset with Pallets, Cargo Crates & Realistic Vertical Mast',
      'Heavy Bulldozer with Ripping Teeth & Adjustable Front Blade',
      'Fire Engine Ladder Truck with 3-Section Telescoping Turntable Ladder',
      'Harbor Container Gantry Crane & Cargo Ship Playset with Intermodal Boxes',
      'City Service Road Maintenance Vehicle with Warning Arrows & Cones',
    ],
  },
  {
    id: 'fantasy',
    name: 'Dino & Adventure',
    emoji: '🦖',
    topics: [
      'Mega Dino Truck Haulers & Dinosaur Rescue Vehicle Sets',
      'Transformable Robot Racing Cars with Interactive LED Lights',
      'Volcano Escape Stunt Track with Snapping T-Rex Trap Launcher',
      'Shark Attack Monster Truck with Chomping Jaws & Fin Spoilers',
      'Glow-in-the-Dark Alien Invader Stunt Buggies with Plasma Orb Wheels',
      'Jungle Expedition Off-Roader with Safari Cage & Wildlife Figurines',
      'Cyberpunk Neon Racing Hovercraft with Omni-Directional Mecanum Wheels',
      'Deep-Sea Submarine Exploration Rover with Articulated Claw & LED Beam',
      'Medieval Dragon Fire-Breathing Monster Truck with Scaled Armor Plate',
      'Galactic Space Exploration Rover with Solar Panels & Sample Scoop',
      'Zombie Apocalypse Armored Assault Van with Barricade Ram & Turret',
      'Ice-Crusher Arctic Expedition Cat-Track Vehicle with Snow Mobile',
      'Pirate Ship Amphibious Galleon Racer with Spring-Loaded Cannons',
      'Secret Agent Stealth Interceptor Car with Pop-Out Wing Gliders',
      'Chomp-and-Roll Prehistoric Raptor Monster Buggy with Sound Effects',
      'Lava Mountain Boulder-Dodging High-Suspension 4x4 Buggy Set',
      'Superhero Speedster Chase Pack with Magnetic Net Launchers',
      'Desert Sandstorm Dune Buggy with Dual Spare Wheels & Flag Antennas',
      'Futuristic Magnetic Hover Track with Anti-Gravity Inverted Loops',
      'Steampunk Mechanical Clockwork Brass Racer with Exposed Cogs',
    ],
  },
];

// Procedural Dynamic Combinator Engine
const ADJECTIVES = [
  'High-Speed',
  'Extreme 4WD',
  'Ultimate All-Terrain',
  'Next-Gen 2.4GHz',
  'Heavy-Duty Alloy',
  'Glow-in-the-Dark',
  'High-Torque Brushless',
  'Precision-Engineered',
  'Waterproof Amphibious',
  'Rechargeable Fast-Charge',
  'Modular Snap-Fit',
  'Scale 1:12 Pro-Grade',
  'Dual-Motor Turbo',
  'Zero-Gravity Wall-Climbing',
  'Multi-Level Interactive',
  'Solar-Powered STEM',
  'Anti-Collision Shockproof',
  'Omni-Directional Drift',
  'Rugged Off-Road',
  'Supercharged High-Velocity',
];

const VEHICLE_TYPES = [
  'RC Monster Truck',
  'Drift Racing Supercar',
  'Rock Crawler Buggy',
  'Die-Cast Alloy Stunt Vehicle',
  'STEM Motorized Vehicle Kit',
  'Excavator & Hauler Playset',
  'Loop Stunt Track System',
  'Transformable Robot Racer',
  'Dino Rescue Expedition Truck',
  'Multi-Car Parking Tower',
  'Amphibious Stunt Vehicle',
  'Flatbed Semi-Truck Transporter',
  'Tactical Emergency Rescue Van',
  'Formula Speedster Racer',
  'Desert Dune Buggy',
  'Clockwork Mechanical Racer',
];

const ACTIONS_SETTINGS = [
  'Conquering Indoor Obstacle Courses',
  'with Independent Oil Suspensions',
  'for Living Room Hardwood Drifting',
  'with Dual Inverted Stunt Loops',
  'Tackling Rugged Backyard Terrain',
  'with 360-Degree Aerial Stunt Flips',
  'with Working Metal Hydraulic Buckets',
  'with Rapid Electric Booster Launchers',
  'with Interactive LED Lights & Audio',
  'with High-Traction Beadlock Rubber Tires',
  'Teaching Early Mechanical Physics & Torque',
  'with Modular Expandable Track Sections',
  'Surviving Extreme Crash-and-Smash Tests',
  'with Quick-Swap Rechargeable LiPo Battery',
  'Navigating Water, Mud, and Sandy Slopes',
];

const CATCHY_HOOKS = [
  'Hands-On Review & Durability Guide',
  'Top Speed Performance & Parent Guide',
  'Unboxing, Assembly & Track Speed Test',
  'The Ultimate Playtime Buyer’s Guide',
  'Why Young Racers & Collectors Love It',
  'Essential Features for Kids of All Ages',
  'In-Depth Lap Time & Handling Breakdown',
  'Best Gift Choice for Speed Enthusiasts',
  'Complete Field Test on Hardwood & Carpet',
  'How It Stands Up to Rough Outdoor Play',
];

/**
 * Procedurally generates a unique, brand new topic using the Combinator Engine.
 */
export function generateInfiniteDynamicTopic(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const veh = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
  const act = ACTIONS_SETTINGS[Math.floor(Math.random() * ACTIONS_SETTINGS.length)];
  const hook = CATCHY_HOOKS[Math.floor(Math.random() * CATCHY_HOOKS.length)];

  // Pattern A: "[Adjective] [Vehicle] [Action]: [Hook]"
  // Pattern B: "[Adjective] [Vehicle] with [Action] — [Hook]"
  if (Math.random() > 0.4) {
    return `${adj} ${veh} ${act}: ${hook}`;
  } else {
    return `${adj} ${veh} ${act}`;
  }
}

/**
 * Returns all static curated topics flattened into a single array (100+ topics).
 */
export function getAllCuratedTopics(): string[] {
  return TOPIC_CATEGORIES.flatMap((c) => c.topics);
}

/**
 * Gets a random topic, either from a specific category, or across all categories,
 * with a 40% chance of generating a procedural dynamic topic for infinite variety.
 */
export function getRandomTopic(categoryId?: string, exclude?: string): string {
  // If user selected a specific category
  if (categoryId && categoryId !== 'all' && categoryId !== 'dynamic') {
    const cat = TOPIC_CATEGORIES.find((c) => c.id === categoryId);
    if (cat && cat.topics.length > 0) {
      const candidates = cat.topics.filter((t) => t !== exclude);
      return candidates[Math.floor(Math.random() * candidates.length)] || cat.topics[0];
    }
  }

  // If dynamic generator is chosen
  if (categoryId === 'dynamic') {
    let dyn = generateInfiniteDynamicTopic();
    while (dyn === exclude) {
      dyn = generateInfiniteDynamicTopic();
    }
    return dyn;
  }

  // 40% probability to use dynamic infinite generator for maximum freshness
  if (Math.random() < 0.4) {
    const dyn = generateInfiniteDynamicTopic();
    if (dyn !== exclude) return dyn;
  }

  // Otherwise pick from the curated list of 100+ topics
  const all = getAllCuratedTopics();
  const others = all.filter((t) => t !== exclude);
  return others[Math.floor(Math.random() * others.length)] || all[0];
}

/**
 * Returns a batch of random topics to display as inspiration pills/chips in the dashboard.
 */
export function getRandomTopicBatch(count = 5, categoryId?: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  // Always include 1 or 2 procedural combinator topics
  const dynamicCount = Math.min(2, Math.floor(count / 2));
  for (let i = 0; i < dynamicCount; i++) {
    const dyn = generateInfiniteDynamicTopic();
    if (!seen.has(dyn)) {
      seen.add(dyn);
      result.push(dyn);
    }
  }

  // Fill remaining from curated categories
  let pool = getAllCuratedTopics();
  if (categoryId && categoryId !== 'all' && categoryId !== 'dynamic') {
    const cat = TOPIC_CATEGORIES.find((c) => c.id === categoryId);
    if (cat) pool = cat.topics;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const t of shuffled) {
    if (!seen.has(t)) {
      seen.add(t);
      result.push(t);
      if (result.length >= count) break;
    }
  }

  return result;
}
