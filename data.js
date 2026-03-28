const DANGER_LEVELS = {
    low: {
        label: "Low",
        className: "danger-low"
    },
    medium: {
        label: "Medium",
        className: "danger-medium"
    },
    high: {
        label: "High",
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
    { name: "Sardine", shortFact: "a small schooling fish of the open sea", dangerLevel: "low", dangerNote: "It is not considered dangerous to people." },
    { name: "Clownfish", shortFact: "a reef fish that hides among sea anemones", dangerLevel: "low", dangerNote: "It is generally harmless to humans." },
    { name: "Seahorse", shortFact: "an upright fish with a curled tail and bony armor", dangerLevel: "low", dangerNote: "It is not known as a threat to people." },
    { name: "Great Barracuda", shortFact: "a fast ambush predator with sharp teeth", dangerLevel: "medium", dangerNote: "It can injure people with bites, though attacks are uncommon." },
    { name: "Lionfish", shortFact: "a striking reef fish with long venomous spines", dangerLevel: "high", dangerNote: "Its venomous spines can cause very painful injuries." },
    { name: "Fahaka Pufferfish", shortFact: "a pufferfish that can inflate when threatened", dangerLevel: "high", dangerNote: "Pufferfish are associated with the potent toxin tetrodotoxin." },
    { name: "Blue Tang", shortFact: "a bright blue reef grazer with a scalpel-like tail spine", dangerLevel: "low", dangerNote: "It is usually not dangerous to people." },
    { name: "Yellow Tang", shortFact: "a vivid yellow surgeonfish that feeds on algae", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Emperor Angelfish", shortFact: "a large coral reef fish with bold stripes", dangerLevel: "low", dangerNote: "It does not pose a meaningful danger to people." },
    { name: "Copperband Butterflyfish", shortFact: "a narrow reef fish with copper bands and a long snout", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Swordfish", shortFact: "a powerful ocean hunter with a long bill", dangerLevel: "medium", dangerNote: "Its speed and sharp bill can make it dangerous if provoked." },
    { name: "Blue Marlin", shortFact: "a huge billfish built for speed in open water", dangerLevel: "medium", dangerNote: "Its strength and bill can be dangerous in close encounters." },
    { name: "Atlantic Bluefin Tuna", shortFact: "a large migratory fish famous for speed and endurance", dangerLevel: "low", dangerNote: "It is not usually dangerous to people." },
    { name: "Atlantic Salmon", shortFact: "a migratory fish that moves between rivers and the sea", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Rainbow Trout", shortFact: "a colorful freshwater fish common in cool streams", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Atlantic Cod", shortFact: "a cold-water fish that has supported major fisheries", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Haddock", shortFact: "a North Atlantic fish with a dark shoulder spot", dangerLevel: "low", dangerNote: "It is harmless to people." },
    { name: "Halibut", shortFact: "a large flatfish that lives on the seafloor", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Atlantic Mackerel", shortFact: "a sleek schooling fish with dark wavy markings", dangerLevel: "low", dangerNote: "It is not considered dangerous to people." },
    { name: "European Anchovy", shortFact: "a small silver fish that forms dense schools", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Atlantic Herring", shortFact: "a schooling fish important to ocean food webs", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Red Snapper", shortFact: "a pink-red reef fish found in warm Atlantic waters", dangerLevel: "low", dangerNote: "It does not pose a serious threat to people." },
    { name: "Goliath Grouper", shortFact: "a huge reef fish with a broad body and mouth", dangerLevel: "medium", dangerNote: "Its size makes close contact risky even though it is not usually aggressive." },
    { name: "Guppy", shortFact: "a tiny livebearing fish popular in aquariums", dangerLevel: "low", dangerNote: "It is harmless to people." },
    { name: "Siamese Fighting Fish", shortFact: "a colorful freshwater fish known for territorial behavior", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Common Carp", shortFact: "a hardy freshwater fish with large scales", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Koi", shortFact: "a domesticated carp bred for bright ornamental patterns", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Goldfish", shortFact: "a domesticated fish with many color varieties", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Channel Catfish", shortFact: "a whiskered freshwater fish that uses barbels to sense food", dangerLevel: "medium", dangerNote: "Its fin spines can cause painful punctures." },
    { name: "Nile Tilapia", shortFact: "a freshwater cichlid farmed widely around the world", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Moray Eel", shortFact: "an elongated reef predator that hides in crevices", dangerLevel: "medium", dangerNote: "It can bite if threatened or cornered." },
    { name: "Electric Eel", shortFact: "a fish that can generate powerful electric shocks", dangerLevel: "high", dangerNote: "Its electric discharge can be dangerous to people." },
    { name: "Southern Stingray", shortFact: "a flat ray with a venomous tail spine", dangerLevel: "high", dangerNote: "Its tail spine can inflict serious injuries." },
    { name: "Manta Ray", shortFact: "a giant ray that glides through the water filter-feeding", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Whale Shark", shortFact: "the largest fish in the world and a filter feeder", dangerLevel: "low", dangerNote: "It is generally harmless to people." },
    { name: "Hammerhead Shark", shortFact: "a shark with a wide hammer-shaped head", dangerLevel: "high", dangerNote: "Large sharks can be dangerous to humans." },
    { name: "Great White Shark", shortFact: "a large predatory shark with powerful jaws", dangerLevel: "high", dangerNote: "It can be dangerous in rare encounters with people." },
    { name: "Nurse Shark", shortFact: "a bottom-dwelling shark often seen resting on reefs", dangerLevel: "medium", dangerNote: "It is usually calm but can bite when disturbed." },
    { name: "Neon Goby", shortFact: "a tiny reef cleaner fish with bright blue stripes", dangerLevel: "low", dangerNote: "It is harmless to people." },
    { name: "Combtooth Blenny", shortFact: "a small fish that perches on rocks and grazes algae", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Humphead Wrasse", shortFact: "a massive reef wrasse with a distinctive forehead", dangerLevel: "low", dangerNote: "It is not known as a danger to people." },
    { name: "Blue Damselfish", shortFact: "a small reef fish with vivid electric-blue color", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Surgeonfish", shortFact: "a reef fish armed with sharp tail spines", dangerLevel: "medium", dangerNote: "Its tail spines can cut if handled carelessly." },
    { name: "Stoplight Parrotfish", shortFact: "a reef grazer that scrapes algae from coral", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Triggerfish", shortFact: "a tough reef fish with strong jaws and a locking dorsal spine", dangerLevel: "medium", dangerNote: "Some species will bite divers that get too close to nests." },
    { name: "Yellow Boxfish", shortFact: "a cube-shaped fish with bright yellow spots", dangerLevel: "low", dangerNote: "It is not usually dangerous to people." },
    { name: "Filefish", shortFact: "a laterally compressed fish with rough skin", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Houndfish", shortFact: "a long needle-like predator with a narrow beak", dangerLevel: "medium", dangerNote: "Its sharp jaws make close encounters risky." },
    { name: "Flying Fish", shortFact: "an ocean fish that glides above the water surface", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Lanternfish", shortFact: "a deep-sea fish that produces light with photophores", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Ocean Sunfish", shortFact: "a giant open-ocean fish with a rounded body", dangerLevel: "low", dangerNote: "It is not considered dangerous to people." },
    { name: "European Perch", shortFact: "a striped freshwater predator with spiny fins", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Northern Pike", shortFact: "a long freshwater ambush hunter with many sharp teeth", dangerLevel: "medium", dangerNote: "Its teeth can cause injuries if mishandled." },
    { name: "Walleye", shortFact: "a freshwater predator known for reflective eyes", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Largemouth Bass", shortFact: "a freshwater fish with a large mouth and strong strike", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Smallmouth Bass", shortFact: "a bronze-colored river and lake predator", dangerLevel: "low", dangerNote: "It does not pose a real danger to humans." },
    { name: "Bluegill", shortFact: "a small sunfish common in ponds and lakes", dangerLevel: "low", dangerNote: "It is harmless to people." },
    { name: "Black Crappie", shortFact: "a panfish with dark speckles and a tall body", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Common Roach", shortFact: "a widespread European freshwater fish", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Common Bream", shortFact: "a deep-bodied freshwater fish that feeds near the bottom", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Tench", shortFact: "a greenish freshwater fish often found in still water", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Zander", shortFact: "a predatory fish related to perch and walleye", dangerLevel: "low", dangerNote: "It is not typically dangerous to people." },
    { name: "European Flounder", shortFact: "a flatfish that lies camouflaged on the bottom", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Dover Sole", shortFact: "a flatfish known for both camouflage and delicate swimming", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Turbot", shortFact: "a broad flatfish with eyes on one side of its head", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "European Plaice", shortFact: "a flatfish marked by orange spots", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Discus", shortFact: "a round cichlid famous in aquariums for its colors", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Arapaima", shortFact: "a huge freshwater fish that surfaces to breathe air", dangerLevel: "medium", dangerNote: "Its size and power make close contact risky." },
    { name: "Silver Arowana", shortFact: "a surface-feeding fish known for powerful leaps", dangerLevel: "low", dangerNote: "It is not usually dangerous to humans." },
    { name: "Red-bellied Piranha", shortFact: "a schooling fish with sharp triangular teeth", dangerLevel: "medium", dangerNote: "Its bite can injure people, especially in stressful situations." },
    { name: "Pacu", shortFact: "a large South American fish related to piranhas", dangerLevel: "medium", dangerNote: "Its strong jaws can injure fingers if mishandled." },
    { name: "Oscar", shortFact: "a large intelligent cichlid popular in aquariums", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Jewel Cichlid", shortFact: "a brightly colored African cichlid", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Boeseman's Rainbowfish", shortFact: "a rainbowfish with blue front and orange rear colors", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Killifish", shortFact: "a small fish often adapted to seasonal pools", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Mudskipper", shortFact: "an amphibious fish that can move on mud with its fins", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Coelacanth", shortFact: "a rare lobe-finned fish once thought extinct", dangerLevel: "low", dangerNote: "It is not considered dangerous to humans." },
    { name: "Beluga Sturgeon", shortFact: "an ancient fish with bony plates and a long lifespan", dangerLevel: "medium", dangerNote: "Its size makes it risky to handle closely." },
    { name: "Alligator Gar", shortFact: "a heavy-bodied fish with a long toothy snout", dangerLevel: "medium", dangerNote: "Its sharp teeth can injure people if provoked." },
    { name: "Bowfin", shortFact: "a primitive freshwater predator with a long dorsal fin", dangerLevel: "low", dangerNote: "It is not normally dangerous to people." },
    { name: "Atlantic Tarpon", shortFact: "a powerful silver fish famous for acrobatic jumps", dangerLevel: "medium", dangerNote: "Its size and force can be dangerous at close range." },
    { name: "Bonefish", shortFact: "a sleek shallow-water fish prized for speed", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Permit", shortFact: "a strong coastal fish with a deep silver body", dangerLevel: "low", dangerNote: "It is not considered dangerous to people." },
    { name: "Common Snook", shortFact: "a coastal predator with a bold black lateral line", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Ladyfish", shortFact: "a slender silver fish that leaps when hooked", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Flathead Mullet", shortFact: "a coastal fish that feeds on detritus and algae", dangerLevel: "low", dangerNote: "It is not dangerous to people." },
    { name: "Rabbitfish", shortFact: "a reef fish often equipped with venomous fin spines", dangerLevel: "medium", dangerNote: "Its spines can cause painful injuries." },
    { name: "Squirrelfish", shortFact: "a nocturnal reef fish with large eyes and red color", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Moorish Idol", shortFact: "a reef fish with a long trailing dorsal streamer", dangerLevel: "low", dangerNote: "It is harmless to people." },
    { name: "Pipefish", shortFact: "a slender relative of the seahorse with a tube-like snout", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Snailfish", shortFact: "a soft-bodied fish adapted to cold and deep waters", dangerLevel: "low", dangerNote: "It is harmless to people." },
    { name: "Icefish", shortFact: "a polar fish adapted to very cold water", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Gurnard", shortFact: "a seafloor fish with wing-like pectoral fins", dangerLevel: "low", dangerNote: "It is not considered dangerous to people." },
    { name: "Lingcod", shortFact: "a large predatory fish from the Pacific coast", dangerLevel: "medium", dangerNote: "Its strong jaws can injure if mishandled." },
    { name: "Pollock", shortFact: "a schooling cod relative found in colder seas", dangerLevel: "low", dangerNote: "It is harmless to humans." },
    { name: "Monkfish", shortFact: "a seafloor ambush predator with a huge mouth", dangerLevel: "medium", dangerNote: "Its jaws and teeth can cause injuries at close range." },
    { name: "Rockfish", shortFact: "a spiny marine fish often found around reefs and rocks", dangerLevel: "medium", dangerNote: "Its sharp spines can cause painful punctures." },
    { name: "Hogfish", shortFact: "a wrasse with a long snout used for digging up prey", dangerLevel: "low", dangerNote: "It is not dangerous to humans." },
    { name: "Stonefish", shortFact: "a master of camouflage with extremely venomous spines", dangerLevel: "high", dangerNote: "Its venomous spines make it one of the most dangerous fishes to step on or handle." },
    { name: "Archerfish", shortFact: "a fish famous for shooting jets of water at prey", dangerLevel: "low", dangerNote: "It is not dangerous to people." }
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
        dangerText: `${DANGER_LEVELS[seed.dangerLevel].label} danger. ${seed.dangerNote}`,
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
        mission: "Steer to each signal and press E or F to open a learning card with the fish image, description, and danger level.",
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
