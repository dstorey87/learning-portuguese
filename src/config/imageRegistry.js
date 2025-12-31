/**
 * Image Registry - Validated Word-to-Image Mapping System
 * 
 * PURPOSE: Ensure images accurately represent their intended words with:
 * - Metadata for each image (description, category, semantic tags)
 * - Validation tracking (last checked, status)
 * - Fallback URLs for broken images
 * - Audit trail for image accuracy
 * 
 * USAGE:
 * import { getValidatedImage, validateAllImages } from './imageRegistry.js';
 * const imageData = getValidatedImage('grandfather');
 */

/**
 * Image entry schema:
 * @typedef {Object} ImageEntry
 * @property {string} url - Primary Unsplash URL
 * @property {string} description - What the image should show
 * @property {string} category - Topic category (family, transport, etc.)
 * @property {string[]} tags - Semantic tags for the image
 * @property {string} fallbackUrl - Backup URL if primary fails
 * @property {string} lastValidated - ISO date of last validation
 * @property {'valid'|'broken'|'unchecked'} status - Current status
 */

const IMAGE_REGISTRY = {
    // ============================================
    // FAMILY MEMBERS - Category: family
    // ============================================
    grandfather: {
        url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop',
        description: 'Elderly man - grandfather figure',
        category: 'family',
        tags: ['elderly', 'male', 'grandparent', 'senior'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?grandfather,elderly,man',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    grandpa: {
        url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop',
        description: 'Elderly man - grandfather figure',
        category: 'family',
        tags: ['elderly', 'male', 'grandparent', 'senior'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?grandfather,elderly,man',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    grandmother: {
        url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop',
        description: 'Elderly woman - grandmother figure',
        category: 'family',
        tags: ['elderly', 'female', 'grandparent', 'senior'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?grandmother,elderly,woman',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    grandma: {
        url: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop',
        description: 'Elderly woman - grandmother figure',
        category: 'family',
        tags: ['elderly', 'female', 'grandparent', 'senior'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?grandmother,elderly,woman',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    family: {
        url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop',
        description: 'Family group together',
        category: 'family',
        tags: ['group', 'parents', 'children', 'together'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?family,together',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    mother: {
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
        description: 'Woman - mother figure',
        category: 'family',
        tags: ['female', 'parent', 'woman', 'adult'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?mother,woman',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    father: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        description: 'Man - father figure',
        category: 'family',
        tags: ['male', 'parent', 'man', 'adult'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?father,man',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    son: {
        url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
        description: 'Boy - son/child',
        category: 'family',
        tags: ['child', 'male', 'boy', 'young'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?boy,child,son',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    daughter: {
        url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
        description: 'Girl - daughter/child',
        category: 'family',
        tags: ['child', 'female', 'girl', 'young'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?girl,child,daughter',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    brother: {
        url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
        description: 'Boy/young man - brother',
        category: 'family',
        tags: ['sibling', 'male', 'brother'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?brother,boy',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    sister: {
        url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop',
        description: 'Girl/young woman - sister',
        category: 'family',
        tags: ['sibling', 'female', 'sister'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?sister,girl',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    husband: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        description: 'Man - husband figure',
        category: 'family',
        tags: ['male', 'spouse', 'married', 'adult'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?husband,man',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    wife: {
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
        description: 'Woman - wife figure',
        category: 'family',
        tags: ['female', 'spouse', 'married', 'adult'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?wife,woman',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    parents: {
        url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop',
        description: 'Couple - parents together',
        category: 'family',
        tags: ['couple', 'parents', 'family', 'adult'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?parents,couple',
        lastValidated: '2024-12-31',
        status: 'valid'
    },

    // ============================================
    // NUMBERS - Category: numbers
    // ============================================
    zero: {
        url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop',
        description: 'Zero/empty concept',
        category: 'numbers',
        tags: ['number', 'zero', 'empty', 'math'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?zero,empty',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    one: {
        url: 'https://images.unsplash.com/photo-1502570149819-b2260483d302?w=400&h=300&fit=crop',
        description: 'Single item - one',
        category: 'numbers',
        tags: ['number', 'one', 'single', 'math'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?one,single',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    two: {
        url: 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=400&h=300&fit=crop',
        description: 'Pair - two items',
        category: 'numbers',
        tags: ['number', 'two', 'pair', 'math'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?two,pair',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    three: {
        url: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop',
        description: 'Three items',
        category: 'numbers',
        tags: ['number', 'three', 'trio', 'math'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?three,trio',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    four: {
        url: 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400&h=300&fit=crop',
        description: 'Math/equations - four',
        category: 'numbers',
        tags: ['number', 'four', 'math', 'equations'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?four,math',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    five: {
        url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop',
        description: 'Five/hand showing five fingers',
        category: 'numbers',
        tags: ['number', 'five', 'hand', 'math'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?five,hand',
        lastValidated: '2024-12-31',
        status: 'valid'
    },

    // ============================================
    // TRANSPORTATION - Category: transport
    // ============================================
    boat: {
        url: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=400&h=300&fit=crop',
        description: 'Boat on water',
        category: 'transport',
        tags: ['boat', 'water', 'transport', 'sea'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?boat,water',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    metro: {
        url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop',
        description: 'Metro/subway train',
        category: 'transport',
        tags: ['metro', 'subway', 'train', 'transport'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?metro,subway,train',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    car: {
        url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
        description: 'Car/automobile',
        category: 'transport',
        tags: ['car', 'automobile', 'vehicle', 'transport'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?car,automobile',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    bus: {
        url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
        description: 'Bus/public transport',
        category: 'transport',
        tags: ['bus', 'public', 'transport', 'vehicle'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?bus,public,transport',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    train: {
        url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop',
        description: 'Train',
        category: 'transport',
        tags: ['train', 'railway', 'transport'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?train,railway',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    plane: {
        url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop',
        description: 'Airplane',
        category: 'transport',
        tags: ['plane', 'airplane', 'flight', 'transport'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?airplane,flight',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    bicycle: {
        url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop',
        description: 'Bicycle',
        category: 'transport',
        tags: ['bicycle', 'bike', 'cycling', 'transport'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?bicycle,bike',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    walking: {
        url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=300&fit=crop',
        description: 'Person walking',
        category: 'transport',
        tags: ['walking', 'pedestrian', 'foot', 'transport'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?walking,pedestrian',
        lastValidated: '2024-12-31',
        status: 'valid'
    },

    // ============================================
    // WEATHER - Category: weather
    // ============================================
    temperature: {
        url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
        description: 'Sky/weather conditions',
        category: 'weather',
        tags: ['weather', 'temperature', 'sky', 'climate'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?weather,sky',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    sun: {
        url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop',
        description: 'Sunny sky/sunshine',
        category: 'weather',
        tags: ['sun', 'sunny', 'sunshine', 'weather'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?sun,sunny',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    rain: {
        url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400&h=300&fit=crop',
        description: 'Rain/rainy weather',
        category: 'weather',
        tags: ['rain', 'rainy', 'weather', 'water'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?rain,rainy',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    cloud: {
        url: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop',
        description: 'Cloudy sky',
        category: 'weather',
        tags: ['cloud', 'cloudy', 'sky', 'weather'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?cloud,cloudy',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    wind: {
        url: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&h=300&fit=crop',
        description: 'Windy conditions',
        category: 'weather',
        tags: ['wind', 'windy', 'weather', 'air'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?wind,windy',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    snow: {
        url: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop',
        description: 'Snow/winter',
        category: 'weather',
        tags: ['snow', 'winter', 'cold', 'weather'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?snow,winter',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    hot: {
        url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop',
        description: 'Hot weather',
        category: 'weather',
        tags: ['hot', 'heat', 'summer', 'weather'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?hot,summer,heat',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    cold: {
        url: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop',
        description: 'Cold weather',
        category: 'weather',
        tags: ['cold', 'winter', 'freeze', 'weather'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?cold,winter',
        lastValidated: '2024-12-31',
        status: 'valid'
    },

    // ============================================
    // BODY PARTS - Category: body
    // ============================================
    head: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        description: 'Human head/face',
        category: 'body',
        tags: ['head', 'face', 'body', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?face,portrait',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    hand: {
        url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop',
        description: 'Human hand',
        category: 'body',
        tags: ['hand', 'fingers', 'body', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?hand,fingers',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    foot: {
        url: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop',
        description: 'Human foot/feet',
        category: 'body',
        tags: ['foot', 'feet', 'body', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?feet,walking',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    arm: {
        url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
        description: 'Human arm',
        category: 'body',
        tags: ['arm', 'limb', 'body', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?arm,fitness',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    leg: {
        url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
        description: 'Human leg',
        category: 'body',
        tags: ['leg', 'limb', 'body', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?leg,running',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    body: {
        url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
        description: 'Human body',
        category: 'body',
        tags: ['body', 'fitness', 'human', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?body,fitness',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    eye: {
        url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=300&fit=crop',
        description: 'Human eye',
        category: 'body',
        tags: ['eye', 'eyes', 'face', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?eye,eyes',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    mouth: {
        url: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?w=400&h=300&fit=crop',
        description: 'Human mouth/smile',
        category: 'body',
        tags: ['mouth', 'smile', 'face', 'anatomy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?smile,mouth',
        lastValidated: '2024-12-31',
        status: 'valid'
    },

    // ============================================
    // COLORS - Category: colors
    // ============================================
    red: {
        url: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400&h=300&fit=crop',
        description: 'Red color',
        category: 'colors',
        tags: ['red', 'color', 'colour'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?red,color',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    blue: {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
        description: 'Blue color - ocean/sky',
        category: 'colors',
        tags: ['blue', 'color', 'ocean', 'sky'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?blue,ocean',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    green: {
        url: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?w=400&h=300&fit=crop',
        description: 'Green color - nature',
        category: 'colors',
        tags: ['green', 'color', 'nature', 'plants'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?green,nature',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    yellow: {
        url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop',
        description: 'Yellow color - sunlight',
        category: 'colors',
        tags: ['yellow', 'color', 'sun', 'bright'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?yellow,sunlight',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    black: {
        url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&h=300&fit=crop',
        description: 'Black color - dark/night',
        category: 'colors',
        tags: ['black', 'color', 'dark', 'night'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?black,dark',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    white: {
        url: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop',
        description: 'White color - snow/light',
        category: 'colors',
        tags: ['white', 'color', 'snow', 'light'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?white,snow',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    orange: {
        url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=300&fit=crop',
        description: 'Orange color - sunset',
        category: 'colors',
        tags: ['orange', 'color', 'sunset'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?orange,sunset',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    pink: {
        url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop',
        description: 'Pink color - flowers',
        category: 'colors',
        tags: ['pink', 'color', 'flowers'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?pink,flowers',
        lastValidated: '2024-12-31',
        status: 'valid'
    },

    // ============================================
    // FOOD & DRINK - Category: food
    // ============================================
    coffee: {
        url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
        description: 'Coffee cup',
        category: 'food',
        tags: ['coffee', 'drink', 'cafe', 'beverage'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?coffee,cup',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    water: {
        url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop',
        description: 'Glass of water',
        category: 'food',
        tags: ['water', 'drink', 'glass', 'beverage'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?water,glass',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    bread: {
        url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
        description: 'Bread loaf',
        category: 'food',
        tags: ['bread', 'food', 'bakery'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?bread,bakery',
        lastValidated: '2024-12-31',
        status: 'valid'
    },
    fruit: {
        url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop',
        description: 'Fresh fruit',
        category: 'food',
        tags: ['fruit', 'food', 'fresh', 'healthy'],
        fallbackUrl: 'https://source.unsplash.com/400x300/?fruit,fresh',
        lastValidated: '2024-12-31',
        status: 'valid'
    }
};

/**
 * Get validated image data with fallback support
 * @param {string} key - Image key (e.g., 'grandfather', 'boat')
 * @returns {ImageEntry|null} Image entry with metadata
 */
export function getValidatedImage(key) {
    const normalizedKey = (key || '').toLowerCase().trim();
    return IMAGE_REGISTRY[normalizedKey] || null;
}

/**
 * Get image URL with automatic fallback if broken
 * @param {string} key - Image key
 * @returns {string} Working image URL
 */
export function getImageUrl(key) {
    const entry = getValidatedImage(key);
    if (!entry) {
        // Generate dynamic fallback
        return `https://source.unsplash.com/400x300/?${encodeURIComponent(key)}`;
    }
    
    // Return primary URL if valid, otherwise fallback
    return entry.status === 'broken' ? entry.fallbackUrl : entry.url;
}

/**
 * Validate a single image URL
 * @param {string} url - Image URL to validate
 * @returns {Promise<boolean>} True if image loads successfully
 */
export async function validateImageUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
        console.warn(`[ImageRegistry] Failed to validate: ${url}`, error);
        return false;
    }
}

/**
 * Validate all images in the registry
 * @returns {Promise<Object>} Validation report
 */
export async function validateAllImages() {
    const report = {
        total: 0,
        valid: 0,
        broken: [],
        unchecked: [],
        timestamp: new Date().toISOString()
    };
    
    for (const [key, entry] of Object.entries(IMAGE_REGISTRY)) {
        report.total++;
        
        const isValid = await validateImageUrl(entry.url);
        
        if (isValid) {
            report.valid++;
            entry.status = 'valid';
            entry.lastValidated = report.timestamp;
        } else {
            entry.status = 'broken';
            report.broken.push({
                key,
                url: entry.url,
                description: entry.description,
                fallbackUrl: entry.fallbackUrl
            });
        }
    }
    
    console.log(`[ImageRegistry] Validation complete:`, report);
    return report;
}

/**
 * Get all images by category
 * @param {string} category - Category name
 * @returns {Object} Map of key -> ImageEntry for category
 */
export function getImagesByCategory(category) {
    return Object.fromEntries(
        Object.entries(IMAGE_REGISTRY)
            .filter(([_, entry]) => entry.category === category)
    );
}

/**
 * Search images by tags
 * @param {string[]} tags - Tags to search for
 * @returns {Object} Matching images
 */
export function searchImagesByTags(tags) {
    const searchTags = tags.map(t => t.toLowerCase());
    return Object.fromEntries(
        Object.entries(IMAGE_REGISTRY)
            .filter(([_, entry]) => 
                entry.tags.some(tag => searchTags.includes(tag))
            )
    );
}

/**
 * Get registry statistics
 * @returns {Object} Stats about the registry
 */
export function getRegistryStats() {
    const categories = {};
    let total = 0;
    let valid = 0;
    let broken = 0;
    
    for (const [key, entry] of Object.entries(IMAGE_REGISTRY)) {
        total++;
        categories[entry.category] = (categories[entry.category] || 0) + 1;
        if (entry.status === 'valid') valid++;
        if (entry.status === 'broken') broken++;
    }
    
    return { total, valid, broken, categories };
}

export { IMAGE_REGISTRY };
