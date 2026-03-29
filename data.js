const CONSERVATION_STATUSES = {
    low: {
        label: "Least concern",
        className: "danger-low"
    },
    medium: {
        label: "Vulnerable",
        className: "danger-medium"
    },
    high: {
        label: "Endangered",
        className: "danger-high"
    }
};

const TOTAL_SPECIES_PER_GAME = 15;

const FALLBACK_FISH_PHOTOS = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Amphiprion_ocellaris_%28Clown_anemonefish%29_by_Nick_Hobgood.jpg/640px-Amphiprion_ocellaris_%28Clown_anemonefish%29_by_Nick_Hobgood.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Pterois_volitans_Cologne_Zoo_31122014_3.jpg/640px-Pterois_volitans_Cologne_Zoo_31122014_3.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Hippocampus_hystrix_%28Spiny_seahorse%29.jpg/640px-Hippocampus_hystrix_%28Spiny_seahorse%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Barracuda_laban.jpg/640px-Barracuda_laban.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/TetraodonLineatus.JPG/640px-TetraodonLineatus.JPG"
];

const WIKI_QUERY_OVERRIDES = {
    "Blue Tang": "Paracanthurus",
    "Common Roach": "Common roach",
    "Common Bream": "Common bream",
    "Tench": "Tench",
    "Zander": "Zander",
    "European Flounder": "European flounder",
    "Dover Sole": "Common sole",
    "Turbot": "Turbot",
    "European Plaice": "European plaice",
    "Discus": "Discus (fish)",
    "Arapaima": "Arapaima",
    "Silver Arowana": "Silver arowana",
    "Red-bellied Piranha": "Red-bellied piranha",
    "Pacu": "Pacu",
    "Oscar": "Oscar (fish)",
    "Jewel Cichlid": "Jewel cichlid",
    "Boeseman's Rainbowfish": "Boeseman's rainbowfish",
    "Killifish": "Killifish",
    "Mudskipper": "Mudskipper",
    "Coelacanth": "Coelacanth",
    "Beluga Sturgeon": "Beluga (sturgeon)",
    "Alligator Gar": "Alligator gar",
    "Bowfin": "Bowfin",
    "Atlantic Tarpon": "Atlantic tarpon",
    "Bonefish": "Bonefish",
    "Permit": "Permit (fish)",
    "Common Snook": "Common snook",
    "Ladyfish": "Pacific ladyfish",
    "Flathead Mullet": "Flathead grey mullet",
    "Rabbitfish": "Rabbitfish",
    "Squirrelfish": "Longspine squirrelfish",
    "Moorish Idol": "Moorish idol",
    "Pipefish": "Pipefish",
    "Snailfish": "Snailfish",
    "Icefish": "Channichthyidae",
    "Gurnard": "Red gurnard",
    "Lingcod": "Lingcod",
    "Pollock": "Alaska pollock",
    "Monkfish": "Lophius",
    "Rockfish": "Rockfish",
    "Hogfish": "Hogfish",
    "Stonefish": "Synanceia",
    "Archerfish": "Archerfish"
};

const FISH_SPECIES = [
    { name: "Sardine", shortFact: "a small schooling fish of the open sea", dangerLevel: "low", dangerNote: "Population remains stable. Widely distributed with sustainable populations." },
    { name: "Clownfish", shortFact: "a reef fish that hides among sea anemones", dangerLevel: "low", dangerNote: "Thrives in healthy reef ecosystems. Aquarium trade has helped captive breeding." },
    { name: "Seahorse", shortFact: "an upright fish with a curled tail and bony armor", dangerLevel: "low", dangerNote: "Stable populations in many regions. Protected by CITES regulations." },
    { name: "Great Barracuda", shortFact: "a fast ambush predator with sharp teeth", dangerLevel: "medium", dangerNote: "Population declining due to overfishing. Targeted in commercial fisheries." },
    { name: "Lionfish", shortFact: "a striking reef fish with long venomous spines", dangerLevel: "high", dangerNote: "Invasive in Atlantic. Critical threat to native reef ecosystems." },
    { name: "Fahaka Pufferfish", shortFact: "a pufferfish that can inflate when threatened", dangerLevel: "high", dangerNote: "Endangered in native habitats. Habitat destruction has decimated populations." },
    { name: "Blue Tang", shortFact: "a bright blue reef grazer with a scalpel-like tail spine", dangerLevel: "low", dangerNote: "Abundant in tropical reefs. Aquarium trade concerns are being addressed." },
    { name: "Yellow Tang", shortFact: "a vivid yellow surgeonfish that feeds on algae", dangerLevel: "low", dangerNote: "Populations remain healthy. Wild stocks are currently stable." },
    { name: "Emperor Angelfish", shortFact: "a large coral reef fish with bold stripes", dangerLevel: "low", dangerNote: "No significant conservation concerns. Widely found in Indo-Pacific reefs." },
    { name: "Copperband Butterflyfish", shortFact: "a narrow reef fish with copper bands and a long snout", dangerLevel: "low", dangerNote: "Stable populations in suitable habitats. Specialized diet limits aquarium pressure." },
    { name: "Swordfish", shortFact: "a powerful ocean hunter with a long bill", dangerLevel: "medium", dangerNote: "Once critically depleted. Recent protections have allowed some recovery." },
    { name: "Blue Marlin", shortFact: "a huge billfish built for speed in open water", dangerLevel: "medium", dangerNote: "Overfished in many regions. Sport fishing and commercial pressure remain high." },
    { name: "Atlantic Bluefin Tuna", shortFact: "a large migratory fish famous for speed and endurance", dangerLevel: "low", dangerNote: "Recovering from depletion. Quota systems now protecting populations." },
    { name: "Atlantic Salmon", shortFact: "a migratory fish that moves between rivers and the sea", dangerLevel: "low", dangerNote: "Stable in many northern populations. Dam removal aids spawning migration." },
    { name: "Rainbow Trout", shortFact: "a colorful freshwater fish common in cool streams", dangerLevel: "low", dangerNote: "Support robust fisheries. Hatchery programs help sustain populations." },
    { name: "Atlantic Cod", shortFact: "a cold-water fish that has supported major fisheries", dangerLevel: "low", dangerNote: "Recovering slowly after severe collapse. Strict quotas now in place." },
    { name: "Haddock", shortFact: "a North Atlantic fish with a dark shoulder spot", dangerLevel: "low", dangerNote: "Populations recovering. Commercial catches carefully managed." },
    { name: "Halibut", shortFact: "a large flatfish that lives on the seafloor", dangerLevel: "low", dangerNote: "Sustainable fishing practices maintain healthy stocks." },
    { name: "Atlantic Mackerel", shortFact: "a sleek schooling fish with dark wavy markings", dangerLevel: "low", dangerNote: "Abundant with thriving populations across Atlantic waters." },
    { name: "European Anchovy", shortFact: "a small silver fish that forms dense schools", dangerLevel: "low", dangerNote: "Thriving populations support major fisheries in Mediterranean." },
    { name: "Atlantic Herring", shortFact: "a schooling fish important to ocean food webs", dangerLevel: "low", dangerNote: "Populations rebounded after earlier depletion. Currently well-managed." },
    { name: "Red Snapper", shortFact: "a pink-red reef fish found in warm Atlantic waters", dangerLevel: "low", dangerNote: "Stock status improving. Protective regulations reducing pressure." },
    { name: "Goliath Grouper", shortFact: "a huge reef fish with a broad body and mouth", dangerLevel: "medium", dangerNote: "Vulnerable to overfishing. Targeted harvest banned in many countries." },
    { name: "Guppy", shortFact: "a tiny livebearing fish popular in aquariums", dangerLevel: "low", dangerNote: "Thriving in natural and captive populations worldwide." },
    { name: "Siamese Fighting Fish", shortFact: "a colorful freshwater fish known for territorial behavior", dangerLevel: "low", dangerNote: "Stable in habitats. Popular aquarium species supports breeding." },
    { name: "Common Carp", shortFact: "a hardy freshwater fish with large scales", dangerLevel: "low", dangerNote: "Highly adaptable. Invasive in some regions but stable overall." },
    { name: "Koi", shortFact: "a domesticated carp bred for bright ornamental patterns", dangerLevel: "low", dangerNote: "Successful domestication. Thriving in captive populations." },
    { name: "Goldfish", shortFact: "a domesticated fish with many color varieties", dangerLevel: "low", dangerNote: "Thriving in aquariums globally. Selective breeding maintains diversity." },
    { name: "Channel Catfish", shortFact: "a whiskered freshwater fish that uses barbels to sense food", dangerLevel: "medium", dangerNote: "Populations affected by habitat loss and water pollution." },
    { name: "Nile Tilapia", shortFact: "a freshwater cichlid farmed widely around the world", dangerLevel: "low", dangerNote: "Abundant in native range. Aquaculture supports food security." },
    { name: "Moray Eel", shortFact: "an elongated reef predator that hides in crevices", dangerLevel: "medium", dangerNote: "Some species threatened by reef degradation and collection." },
    { name: "Electric Eel", shortFact: "a fish that can generate powerful electric shocks", dangerLevel: "high", dangerNote: "Critically endangered by habitat loss in Amazonian waters." },
    { name: "Southern Stingray", shortFact: "a flat ray with a venomous tail spine", dangerLevel: "high", dangerNote: "Vulnerable to overfishing and habitat destruction on continental shelves." },
    { name: "Manta Ray", shortFact: "a giant ray that glides through the water filter-feeding", dangerLevel: "low", dangerNote: "Protected by CITES. International conservation efforts ongoing." },
    { name: "Whale Shark", shortFact: "the largest fish in the world and a filter feeder", dangerLevel: "low", dangerNote: "Vulnerable but stable. Protected as endangered in many nations." },
    { name: "Hammerhead Shark", shortFact: "a shark with a wide hammer-shaped head", dangerLevel: "high", dangerNote: "Critically endangered by fins trade. Population severely depleted." },
    { name: "Great White Shark", shortFact: "a large predatory shark with powerful jaws", dangerLevel: "high", dangerNote: "Vulnerable to overfishing. Listed as vulnerable or endangered." },
    { name: "Nurse Shark", shortFact: "a bottom-dwelling shark often seen resting on reefs", dangerLevel: "medium", dangerNote: "Some populations declining due to overfishing pressures." },
    { name: "Neon Goby", shortFact: "a tiny reef cleaner fish with bright blue stripes", dangerLevel: "low", dangerNote: "Stable populations in healthy reef ecosystems." },
    { name: "Combtooth Blenny", shortFact: "a small fish that perches on rocks and grazes algae", dangerLevel: "low", dangerNote: "Thriving in rocky coastal habitats throughout their range." },
    { name: "Humphead Wrasse", shortFact: "a massive reef wrasse with a distinctive forehead", dangerLevel: "low", dangerNote: "Protected in some areas. Local populations recovering with protection." },
    { name: "Blue Damselfish", shortFact: "a small reef fish with vivid electric-blue color", dangerLevel: "low", dangerNote: "Abundant in tropical reef ecosystems globally." },
    { name: "Surgeonfish", shortFact: "a reef fish armed with sharp tail spines", dangerLevel: "medium", dangerNote: "Some species threatened by reef degradation and aquarium trade." },
    { name: "Stoplight Parrotfish", shortFact: "a reef grazer that scrapes algae from coral", dangerLevel: "low", dangerNote: "Crucial for reef health. Stable in protected reef areas." },
    { name: "Triggerfish", shortFact: "a tough reef fish with strong jaws and a locking dorsal spine", dangerLevel: "medium", dangerNote: "Some species experiencing pressure from aquarium collection." },
    { name: "Yellow Boxfish", shortFact: "a cube-shaped fish with bright yellow spots", dangerLevel: "low", dangerNote: "Stable populations in Indo-Pacific reef habitats." },
    { name: "Filefish", shortFact: "a laterally compressed fish with rough skin", dangerLevel: "low", dangerNote: "Thriving in reef and seagrass environments worldwide." },
    { name: "Houndfish", shortFact: "a long needle-like predator with a narrow beak", dangerLevel: "medium", dangerNote: "Declining in some regions due to habitat loss and fishing." },
    { name: "Flying Fish", shortFact: "an ocean fish that glides above the water surface", dangerLevel: "low", dangerNote: "Populations stable in open ocean habitats." },
    { name: "Lanternfish", shortFact: "a deep-sea fish that produces light with photophores", dangerLevel: "low", dangerNote: "Thriving in deep ocean zones. Most abundant vertebrate on Earth." },
    { name: "Ocean Sunfish", shortFact: "a giant open-ocean fish with a rounded body", dangerLevel: "low", dangerNote: "Vulnerable but populations stable. Recently protected in some regions." },
    { name: "European Perch", shortFact: "a striped freshwater predator with spiny fins", dangerLevel: "low", dangerNote: "Widespread and abundant in European freshwater systems." },
    { name: "Northern Pike", shortFact: "a long freshwater ambush hunter with many sharp teeth", dangerLevel: "medium", dangerNote: "Declining in some areas. Habitat loss and water quality issues present." },
    { name: "Walleye", shortFact: "a freshwater predator known for reflective eyes", dangerLevel: "low", dangerNote: "Thriving populations support major recreational fisheries." },
    { name: "Largemouth Bass", shortFact: "a freshwater fish with a large mouth and strong strike", dangerLevel: "low", dangerNote: "Abundant and stable. Popular in sport fishing worldwide." },
    { name: "Smallmouth Bass", shortFact: "a bronze-colored river and lake predator", dangerLevel: "low", dangerNote: "Healthy populations across their native range." },
    { name: "Bluegill", shortFact: "a small sunfish common in ponds and lakes", dangerLevel: "low", dangerNote: "Thriving in freshwater habitats across North America." },
    { name: "Black Crappie", shortFact: "a panfish with dark speckles and a tall body", dangerLevel: "low", dangerNote: "Stable populations in lakes and river systems." },
    { name: "Common Roach", shortFact: "a widespread European freshwater fish", dangerLevel: "low", dangerNote: "Abundant throughout European freshwater ecosystems." },
    { name: "Common Bream", shortFact: "a deep-bodied freshwater fish that feeds near the bottom", dangerLevel: "low", dangerNote: "Population stable across European waters." },
    { name: "Tench", shortFact: "a greenish freshwater fish often found in still water", dangerLevel: "low", dangerNote: "Thriving in wetland and freshwater habitats." },
    { name: "Zander", shortFact: "a predatory fish related to perch and walleye", dangerLevel: "low", dangerNote: "Expanding range due to successful invasions in new areas." },
    { name: "European Flounder", shortFact: "a flatfish that lies camouflaged on the bottom", dangerLevel: "low", dangerNote: "Populations stable in estuarine and coastal zones." },
    { name: "Dover Sole", shortFact: "a flatfish known for both camouflage and delicate swimming", dangerLevel: "low", dangerNote: "Commercially important with carefully managed stocks." },
    { name: "Turbot", shortFact: "a broad flatfish with eyes on one side of its head", dangerLevel: "low", dangerNote: "Managed fisheries maintain sustainable populations." },
    { name: "European Plaice", shortFact: "a flatfish marked by orange spots", dangerLevel: "low", dangerNote: "Important food fish with regulated sustainable harvest." },
    { name: "Discus", shortFact: "a round cichlid famous in aquariums for its colors", dangerLevel: "low", dangerNote: "Stable in native Amazonian habitats. Popular aquarium breeding." },
    { name: "Arapaima", shortFact: "a huge freshwater fish that surfaces to breathe air", dangerLevel: "medium", dangerNote: "Declining due to overfishing and habitat loss in Amazon." },
    { name: "Silver Arowana", shortFact: "a surface-feeding fish known for powerful leaps", dangerLevel: "low", dangerNote: "Protected by CITES. Sustainable captive breeding established." },
    { name: "Red-bellied Piranha", shortFact: "a schooling fish with sharp triangular teeth", dangerLevel: "medium", dangerNote: "Populations affected by Amazon river system changes." },
    { name: "Pacu", shortFact: "a large South American fish related to piranhas", dangerLevel: "medium", dangerNote: "Vulnerable to overfishing in Amazonian regions." },
    { name: "Oscar", shortFact: "a large intelligent cichlid popular in aquariums", dangerLevel: "low", dangerNote: "Stable in native range. Successful captive breeding programs." },
    { name: "Jewel Cichlid", shortFact: "a brightly colored African cichlid", dangerLevel: "low", dangerNote: "Thriving in native African water systems." },
    { name: "Boeseman's Rainbowfish", shortFact: "a rainbowfish with blue front and orange rear colors", dangerLevel: "low", dangerNote: "Stable populations in small endemic range in Indonesia." },
    { name: "Killifish", shortFact: "a small fish often adapted to seasonal pools", dangerLevel: "low", dangerNote: "Diverse species with stable populations in habitats." },
    { name: "Mudskipper", shortFact: "an amphibious fish that can move on mud with its fins", dangerLevel: "low", dangerNote: "Thriving in mangrove ecosystems across Indo-Pacific." },
    { name: "Coelacanth", shortFact: "a rare lobe-finned fish once thought extinct", dangerLevel: "high", dangerNote: "Critically endangered. Living fossil with extremely limited populations." },
    { name: "Beluga Sturgeon", shortFact: "an ancient fish with bony plates and a long lifespan", dangerLevel: "high", dangerNote: "Critically endangered. Caviar trade threatens extinction." },
    { name: "Alligator Gar", shortFact: "a heavy-bodied fish with a long toothy snout", dangerLevel: "medium", dangerNote: "Declining due to habitat loss and overharvest." },
    { name: "Bowfin", shortFact: "a primitive freshwater predator with a long dorsal fin", dangerLevel: "low", dangerNote: "Stable populations in North American freshwater." },
    { name: "Atlantic Tarpon", shortFact: "a powerful silver fish famous for acrobatic jumps", dangerLevel: "medium", dangerNote: "Populations affected by coastal habitat degradation." },
    { name: "Bonefish", shortFact: "a sleek shallow-water fish prized for speed", dangerLevel: "low", dangerNote: "Stable in coastal shallow waters. Popular sport fish." },
    { name: "Permit", shortFact: "a strong coastal fish with a deep silver body", dangerLevel: "low", dangerNote: "Thriving in shallow coastal flats and reefs." },
    { name: "Common Snook", shortFact: "a coastal predator with a bold black lateral line", dangerLevel: "low", dangerNote: "Protected in many areas. Populations recovering well." },
    { name: "Ladyfish", shortFact: "a slender silver fish that leaps when hooked", dangerLevel: "low", dangerNote: "Abundant in coastal waters throughout their range." },
    { name: "Flathead Mullet", shortFact: "a coastal fish that feeds on detritus and algae", dangerLevel: "low", dangerNote: "Widespread and stable in coastal ecosystems." },
    { name: "Rabbitfish", shortFact: "a reef fish often equipped with venomous fin spines", dangerLevel: "medium", dangerNote: "Some species facing aquarium collection pressure." },
    { name: "Squirrelfish", shortFact: "a nocturnal reef fish with large eyes and red color", dangerLevel: "low", dangerNote: "Thriving in tropical and subtropical reef systems." },
    { name: "Moorish Idol", shortFact: "a reef fish with a long trailing dorsal streamer", dangerLevel: "low", dangerNote: "Stable in Indo-Pacific reef ecosystems." },
    { name: "Pipefish", shortFact: "a slender relative of the seahorse with a tube-like snout", dangerLevel: "low", dangerNote: "Stable populations in seagrass meadows and reefs." },
    { name: "Snailfish", shortFact: "a soft-bodied fish adapted to cold and deep waters", dangerLevel: "low", dangerNote: "Thriving in deep ocean zones worldwide." },
    { name: "Icefish", shortFact: "a polar fish adapted to very cold water", dangerLevel: "low", dangerNote: "Abundant in Antarctic and Arctic waters." },
    { name: "Gurnard", shortFact: "a seafloor fish with wing-like pectoral fins", dangerLevel: "low", dangerNote: "Stable populations in temperate to tropical seafloor." },
    { name: "Lingcod", shortFact: "a large predatory fish from the Pacific coast", dangerLevel: "medium", dangerNote: "Some populations declining due to commercial fishing." },
    { name: "Pollock", shortFact: "a schooling cod relative found in colder seas", dangerLevel: "low", dangerNote: "Well-managed fisheries maintain healthy stocks." },
    { name: "Monkfish", shortFact: "a seafloor ambush predator with a huge mouth", dangerLevel: "medium", dangerNote: "Declining in Atlantic. Slow reproduction limits recovery." },
    { name: "Rockfish", shortFact: "a spiny marine fish often found around reefs and rocks", dangerLevel: "medium", dangerNote: "Many species vulnerable to overfishing and habitat loss." },
    { name: "Hogfish", shortFact: "a wrasse with a long snout used for digging up prey", dangerLevel: "low", dangerNote: "Populations stable in Caribbean and Western Atlantic." },
    { name: "Stonefish", shortFact: "a master of camouflage with extremely venomous spines", dangerLevel: "high", dangerNote: "Vulnerable to reef destruction and collection pressure." },
    { name: "Archerfish", shortFact: "a fish famous for shooting jets of water at prey", dangerLevel: "low", dangerNote: "Thriving in mangrove and brackish water habitats." }
];

function slugifySpeciesName(name) {
    return name.replace(/['.]/g, "").replace(/-/g, "_").replace(/\s+/g, "_");
}

function createFishFallbackPhoto(index) {
    return FALLBACK_FISH_PHOTOS[index % FALLBACK_FISH_PHOTOS.length];
}

function buildAliases(name) {
    const normalized = name.toLowerCase();
    const simplified = normalized.replace(/-/g, " ");
    return [...new Set([normalized, simplified])];
}

function createFishEntry(seed, index) {
    return {
        id: index + 1,
        name: seed.name,
        aliases: buildAliases(seed.name),
        image: null,
        fallbackImage: createFishFallbackPhoto(index),
        wikiQuery: WIKI_QUERY_OVERRIDES[seed.name] || seed.name,
        sourceUrl: `https://en.wikipedia.org/wiki/${slugifySpeciesName(seed.name)}`,
        description: `${seed.name} is ${seed.shortFact}. Use this entry to learn one memorable clue about how the species looks or behaves.`,
        dangerLevel: seed.dangerLevel,
        dangerText: `${CONSERVATION_STATUSES[seed.dangerLevel].label} status. ${seed.dangerNote}`,
        shortFact: seed.shortFact.charAt(0).toUpperCase() + seed.shortFact.slice(1)
    };
}

const FISH_DATABASE = FISH_SPECIES.map(createFishEntry);

const GAME_MODES = {
    free: {
        title: "Free Response",
        subtitle: "Type the fish name yourself.",
        intro: "A new run has loaded 15 random species. Move close to a signal and press E or F to inspect it.",
        mission: "Use the arrow keys or WASD to steer. When you are close to a mystery signal, press E or F to inspect it and type the fish name yourself.",
        statusPrompt: "Press E or F to inspect",
        progressNoun: "species identified",
        scoreLabel: "Score",
        scorePerCorrect: 10,
        completeTitle: "Field quiz complete",
        completeText: "You finished the free-response survey."
    },
    multiple: {
        title: "Multiple Choice",
        subtitle: "Pick from four answers.",
        intro: "This run selected 15 random species. Get close to a signal and press E or F to open the answer choices.",
        mission: "Move close to a mystery signal, press E or F, and choose the correct fish from the answer buttons.",
        statusPrompt: "Press E or F to inspect",
        progressNoun: "species identified",
        scoreLabel: "Score",
        scorePerCorrect: 5,
        completeTitle: "Choice mission complete",
        completeText: "You finished the multiple-choice survey."
    },
    learning: {
        title: "Learning Mode",
        subtitle: "Study each fish without guessing.",
        intro: "This learning run selected 15 random species. Press E or F near a signal to open the study card.",
        mission: "Steer to each signal and press E or F to open a learning card with the fish image, description, and conservation status.",
        statusPrompt: "Press E or F to inspect",
        progressNoun: "species studied",
        scoreLabel: "Lessons",
        scorePerCorrect: 1,
        completeTitle: "Learning log complete",
        completeText: "You studied every fish in the collection."
    }
};

const GAME_CONFIG = {
    submarineSpeed: 5,
    canvasWidth: 800,
    canvasHeight: 600,
    mapWidth: 2400,
    mapHeight: 1800,
    interactionDistance: 100
};
