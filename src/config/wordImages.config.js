/**
 * Word Image Configuration
 * Maps Portuguese words and concepts to curated Unsplash image URLs
 * Using Unsplash Source API for reliable, high-quality images
 * 
 * Format: https://images.unsplash.com/photo-{ID}?w=400&h=300&fit=crop
 * Or: https://source.unsplash.com/400x300/?{keywords}
 */

// Curated image IDs for common concepts (more reliable than random)
const CURATED_IMAGES = {
    // Greetings & Social
    wave: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop', // People waving
    hello: 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=400&h=300&fit=crop', // Friendly greeting
    sunrise: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop', // Morning sunrise
    afternoon: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', // Afternoon sun
    moon: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&h=300&fit=crop', // Night moon
    farewell: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=300&fit=crop', // Goodbye wave
    wave_casual: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // Casual bye
    clock: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop', // Clock/time
    calendar: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop', // Calendar
    soon: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop', // Soon/waiting
    question: 'https://images.unsplash.com/photo-1484069560501-87d72b0c3669?w=400&h=300&fit=crop', // Question mark
    friends: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // Friends together
    handshake: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=300&fit=crop', // Handshake/meeting
    thumbs_up: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop', // Thumbs up
    
    // Polite Phrases
    thanks: 'https://images.unsplash.com/photo-1531379410502-63bfe8cdaf6f?w=400&h=300&fit=crop', // Thank you gesture
    please: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop', // Polite request
    sorry: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop', // Apologetic
    excuse: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop', // Excuse me
    welcome: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=400&h=300&fit=crop', // Welcome sign
    help: 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=400&h=300&fit=crop', // Helping hands
    understand: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop', // Understanding
    speak: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Speaking
    
    // Pronouns
    person_male: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Man
    person_female: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop', // Woman
    person_single: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=300&fit=crop', // Single person
    people_group: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // Group
    we: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop', // We/team
    they: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop', // They/others
    you_formal: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop', // Formal you
    you_informal: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Casual you
    
    // Articles & Grammar
    article: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=300&fit=crop', // Writing/grammar
    book: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop', // Book
    pen: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=300&fit=crop', // Pen/writing
    
    // Numbers
    one: 'https://images.unsplash.com/photo-1502101872923-d48509bff386?w=400&h=300&fit=crop', // One finger
    two: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&h=300&fit=crop', // Two/pair
    three: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400&h=300&fit=crop', // Three
    four: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop', // Four
    five: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop', // Five/hand
    numbers: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop', // Numbers
    counting: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=400&h=300&fit=crop', // Counting
    
    // Verbs - Ser/Estar/Ter
    being: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop', // Being/existing
    having: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop', // Having/possessing
    feeling: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=300&fit=crop', // Feeling/emotion
    location: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=300&fit=crop', // Location/place
    identity: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Identity
    
    // Question Words
    what: 'https://images.unsplash.com/photo-1484069560501-87d72b0c3669?w=400&h=300&fit=crop', // Question
    where: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=300&fit=crop', // Map/location
    when: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop', // Clock/time
    why: 'https://images.unsplash.com/photo-1484069560501-87d72b0c3669?w=400&h=300&fit=crop', // Thinking
    how: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop', // How/process
    who: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // People
    which: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop', // Choice
    how_much: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop', // Money/quantity
    
    // Adjectives
    big: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=300&fit=crop', // Big mountain
    small: 'https://images.unsplash.com/photo-1518133683791-0b9de5a055f0?w=400&h=300&fit=crop', // Small/tiny
    good: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop', // Good/thumbs up
    bad: 'https://images.unsplash.com/photo-1534073737927-85f1ebff1f5d?w=400&h=300&fit=crop', // Bad/storm
    hot: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop', // Hot/fire
    cold: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop', // Cold/ice
    happy: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?w=400&h=300&fit=crop', // Happy smile
    sad: 'https://images.unsplash.com/photo-1534073737927-85f1ebff1f5d?w=400&h=300&fit=crop', // Sad/rain
    new: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop', // New/fresh
    old: 'https://images.unsplash.com/photo-1465779042638-3e4bca5c1bc5?w=400&h=300&fit=crop', // Old/vintage
    beautiful: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Beautiful
    
    // Negation
    no: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400&h=300&fit=crop', // No sign
    not: 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=400&h=300&fit=crop', // Negation
    never: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop', // Never/time
    nothing: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=400&h=300&fit=crop', // Empty
    
    // Prepositions
    in: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=300&fit=crop', // Inside
    on: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // On top
    at: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=300&fit=crop', // At location
    from: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop', // From/origin
    to: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=300&fit=crop', // To/destination
    with: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // Together
    without: 'https://images.unsplash.com/photo-1589802829985-817e51171b92?w=400&h=300&fit=crop', // Alone/without
    
    // Possessives
    my: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Self
    your: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // You
    his: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // His
    her: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop', // Her
    our: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop', // Our/team
    their: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // Their/group
    
    // Days of Week
    monday: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop', // Calendar
    tuesday: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop',
    wednesday: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop',
    thursday: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop',
    friday: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop', // Friday party
    saturday: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?w=400&h=300&fit=crop', // Weekend fun
    sunday: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop', // Relaxing
    weekend: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?w=400&h=300&fit=crop', // Weekend
    
    // Months
    january: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop', // Winter
    february: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop', // Valentine
    march: 'https://images.unsplash.com/photo-1462275646964-a0e3571f4f7e?w=400&h=300&fit=crop', // Spring
    april: 'https://images.unsplash.com/photo-1462275646964-a0e3571f4f7e?w=400&h=300&fit=crop', // Spring flowers
    may: 'https://images.unsplash.com/photo-1462275646964-a0e3571f4f7e?w=400&h=300&fit=crop', // May flowers
    june: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', // Summer
    july: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', // Summer beach
    august: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', // Summer
    september: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Fall
    october: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // Autumn
    november: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // Late autumn
    december: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop', // Winter/Christmas
    
    // Time
    hour: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop', // Clock
    minute: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop',
    morning: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop', // Morning sunrise
    noon: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', // Midday sun
    evening: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=300&fit=crop', // Evening sunset
    night: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&h=300&fit=crop', // Night
    
    // Family
    family: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&h=300&fit=crop', // Family
    mother: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop', // Mother
    father: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Father
    son: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop', // Boy/son
    daughter: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop', // Girl/daughter
    brother: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop', // Brother
    sister: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop', // Sister
    grandpa: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop', // Grandfather
    grandfather: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop', // Grandfather alias
    grandma: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop', // Grandmother
    grandmother: 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=300&fit=crop', // Grandmother alias
    grandson: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop', // Grandson
    granddaughter: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&h=300&fit=crop', // Granddaughter
    uncle: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Uncle
    aunt: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop', // Aunt
    cousin: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop', // Cousins
    husband: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Husband
    wife: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop', // Wife
    
    // Colors
    red: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400&h=300&fit=crop', // Red
    blue: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', // Blue ocean
    green: 'https://images.unsplash.com/photo-1462275646964-a0e3571f4f7e?w=400&h=300&fit=crop', // Green nature
    yellow: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop', // Yellow sun
    black: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&h=300&fit=crop', // Black night
    white: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop', // White snow
    orange: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=300&fit=crop', // Orange sunset
    pink: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop', // Pink flowers
    purple: 'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=400&h=300&fit=crop', // Purple
    brown: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // Brown earth
    gray: 'https://images.unsplash.com/photo-1534073737927-85f1ebff1f5d?w=400&h=300&fit=crop', // Gray clouds
    
    // Food & Drink
    coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop', // Coffee
    tea: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop', // Tea
    water: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop', // Water
    juice: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop', // Juice
    wine: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop', // Wine
    beer: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&h=300&fit=crop', // Beer
    bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop', // Bread
    cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=300&fit=crop', // Cheese
    meat: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=300&fit=crop', // Meat
    fish: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&h=300&fit=crop', // Fish
    fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop', // Fruit
    vegetables: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=400&h=300&fit=crop', // Vegetables
    egg: 'https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?w=400&h=300&fit=crop', // Eggs
    rice: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=300&fit=crop', // Rice
    soup: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop', // Soup
    cake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', // Cake
    ice_cream: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop', // Ice cream
    pastry: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&h=300&fit=crop', // Pastel de nata
    
    // Cafe
    cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop', // Café
    menu: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop', // Menu
    bill: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop', // Bill/receipt
    waiter: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=300&fit=crop', // Waiter
    table: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop', // Table
    
    // Places
    city: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=300&fit=crop', // City
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', // Restaurant
    hotel: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop', // Hotel
    hospital: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop', // Hospital
    pharmacy: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400&h=300&fit=crop', // Pharmacy
    bank: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=400&h=300&fit=crop', // Bank
    supermarket: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop', // Supermarket
    church: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=300&fit=crop', // Church
    beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', // Beach
    park: 'https://images.unsplash.com/photo-1462275646964-a0e3571f4f7e?w=400&h=300&fit=crop', // Park
    museum: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=300&fit=crop', // Museum
    station: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop', // Train station
    airport: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop', // Airport
    
    // Transportation
    car: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop', // Car
    bus: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=300&fit=crop', // Bus
    train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop', // Train
    plane: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=300&fit=crop', // Plane
    boat: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=400&h=300&fit=crop', // Boat
    taxi: 'https://images.unsplash.com/photo-1559829604-2c1afa8a9f6c?w=400&h=300&fit=crop', // Taxi
    metro: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=300&fit=crop', // Metro
    tram: 'https://images.unsplash.com/photo-1513622790541-eaa84d356909?w=400&h=300&fit=crop', // Tram (Lisbon!)
    bicycle: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop', // Bicycle
    
    // Weather
    sun: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=300&fit=crop', // Sun
    rain: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=400&h=300&fit=crop', // Rain
    cloud: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400&h=300&fit=crop', // Clouds
    wind: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&h=300&fit=crop', // Wind
    snow: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=400&h=300&fit=crop', // Snow
    storm: 'https://images.unsplash.com/photo-1534073737927-85f1ebff1f5d?w=400&h=300&fit=crop', // Storm
    fog: 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?w=400&h=300&fit=crop', // Fog
    temperature: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=300&fit=crop', // Thermometer
    
    // Body Parts
    head: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Head/face
    hand: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop', // Hand
    arm: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', // Arm
    leg: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', // Leg
    foot: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400&h=300&fit=crop', // Feet walking on beach
    eye: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=300&fit=crop', // Eyes
    ear: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Ear
    nose: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop', // Face/nose
    mouth: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?w=400&h=300&fit=crop', // Mouth/smile
    heart: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop', // Heart
    body: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', // Body/fitness
    back: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', // Back
    finger: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop', // Finger/hand
    knee: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop', // Knee/leg
    
    // Professions
    doctor: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop', // Doctor
    teacher: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=300&fit=crop', // Teacher
    engineer: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop', // Engineer
    lawyer: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop', // Lawyer
    chef: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=300&fit=crop', // Chef
    artist: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop', // Artist
    musician: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop', // Musician
    student: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop', // Student
    nurse: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=300&fit=crop', // Nurse
    police: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop', // Police
    firefighter: 'https://images.unsplash.com/photo-1569930784237-ea65a2fd9a83?w=400&h=300&fit=crop', // Firefighter
    
    // Countries & Flags
    portugal: 'https://images.unsplash.com/photo-1513735492761-c3f82cb672a4?w=400&h=300&fit=crop', // Portugal/Lisbon
    brazil: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&h=300&fit=crop', // Brazil
    spain: 'https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=400&h=300&fit=crop', // Spain
    france: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop', // France
    england: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop', // England
    usa: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&h=300&fit=crop', // USA
    germany: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop', // Germany
    italy: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=300&fit=crop', // Italy
    china: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400&h=300&fit=crop', // China
    japan: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=400&h=300&fit=crop', // Japan
    flag: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop', // Generic flag
    world: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop', // World globe
    
    // Default fallback
    default: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop'
};

/**
 * Get image URL for a word based on its image keyword or English meaning
 * @param {string} imageKey - The image keyword from CSV (e.g., 'wave', 'sunrise')
 * @param {string} englishWord - The English translation as fallback
 * @returns {string} - Full Unsplash image URL
 */
export function getWordImageUrl(imageKey, englishWord = '') {
    // Normalize the key
    const key = (imageKey || '').toLowerCase().trim();
    const eng = (englishWord || '').toLowerCase().trim();
    
    // Try exact match first
    if (CURATED_IMAGES[key]) {
        return CURATED_IMAGES[key];
    }
    
    // Try English word as key
    const engKey = eng.split(/[\s\/]+/)[0]; // First word only
    if (CURATED_IMAGES[engKey]) {
        return CURATED_IMAGES[engKey];
    }
    
    // Try partial matches (only for keys with 4+ chars to avoid false positives)
    for (const [imgKey, url] of Object.entries(CURATED_IMAGES)) {
        // Skip short keys in partial matching to avoid false positives like "at", "to", "in"
        if (imgKey.length < 4) continue;
        
        if (key.includes(imgKey) || imgKey.includes(key)) {
            return url;
        }
        if (eng.includes(imgKey) || imgKey.includes(eng)) {
            return url;
        }
    }
    
    // Generate dynamic Unsplash URL from keywords
    const searchTerms = [key, engKey].filter(Boolean).join(',');
    if (searchTerms) {
        return `https://source.unsplash.com/400x300/?${encodeURIComponent(searchTerms)}`;
    }
    
    return CURATED_IMAGES.default;
}

/**
 * Check if a value looks like a valid image URL
 */
export function isValidImageUrl(value) {
    if (!value) return false;
    const str = String(value).trim();
    return str.startsWith('http') || str.startsWith('data:') || str.includes('/');
}

export { CURATED_IMAGES };
