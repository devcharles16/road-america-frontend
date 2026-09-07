export interface RouteFAQ {
    question: string;
    answer: string;
}

export interface RouteConfig {
    id: string;
    slug: string;
    legacyPath: string;
    fromCity: string;
    fromState: string;
    toCity: string;
    toState: string;
    seoTitle: string;
    seoDescription: string;
    h1Title: string;
    h1Subtitle?: string;
    introductoryCopy: string;
    approximateDistance: string;
    estimatedTransitTime: string;
    majorPickupAreas: string[];
    majorDeliveryAreas: string[];
    routeSpecificPricingFactors: string[];
    seasonalConsiderations: string;
    faqContent: RouteFAQ[];
    relatedRouteSlugs: string[];
}

export const ROUTES_DATA: Record<string, RouteConfig> = {
    "miami-to-new-york": {
        id: "miami-to-new-york",
        slug: "miami-to-new-york",
        legacyPath: "/auto-transport-miami-to-new-york",
        fromCity: "Miami",
        fromState: "FL",
        toCity: "New York",
        toState: "NY",
        seoTitle: "Miami to New York Car Shipping | Road America Auto Transport",
        seoDescription: "Ship your car safely from Miami, FL to New York, NY. Experienced I-95 auto transport specialists. Door-to-door, fully insured car shipping quotes.",
        h1Title: "Miami to New York",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Shipping a vehicle from South Florida up the East Coast to New York is one of the busiest transport corridors in the United States. Road America Auto Transport specializes in northbound vehicle shipping along I-95, providing fast, fully insured, door-to-door transport whether you're returning north after winter or relocating permanently.",
        approximateDistance: "1,280 miles",
        estimatedTransitTime: "3 - 5 days",
        majorPickupAreas: ["Downtown Miami", "Brickell", "Coral Gables", "Doral", "Fort Lauderdale", "Boca Raton", "West Palm Beach"],
        majorDeliveryAreas: ["Manhattan", "Brooklyn", "Queens", "Long Island (Nassau/Suffolk)", "Westchester County", "Staten Island"],
        routeSpecificPricingFactors: [
            "Heavy spring northbound demand during the annual snowbird migration (April–May).",
            "Toll costs along New Jersey Turnpike and New York metro bridges/tunnels.",
            "Vehicle height and clearance limits when delivering inside NYC borough narrow streets.",
            "Open vs. Enclosed transport options for luxury and classic cars."
        ],
        seasonalConsiderations: "Spring marks peak northbound demand as seasonal residents return north. Booking 1-2 weeks in advance during April and May ensures preferred pickup windows.",
        faqContent: [
            {
                question: "How long does car transport take from Miami to New York?",
                answer: "Typical transit time from Miami to New York is 3 to 5 days once dispatched. Drivers cover roughly 400-500 miles daily along the Interstate 95 corridor."
            },
            {
                question: "Can you deliver directly into New York City boroughs?",
                answer: "Yes, we offer door-to-door delivery. In dense areas like Manhattan or Brooklyn where large 10-car auto haulers cannot maneuver, drivers coordinate a convenient nearby pickup location such as a wide avenue or parking terminal."
            },
            {
                question: "Is my vehicle insured during transit from FL to NY?",
                answer: "Absolutely. Every carrier in our network is fully vetted and carries comprehensive cargo insurance to protect your vehicle from pickup to dropoff."
            }
        ],
        relatedRouteSlugs: ["new-york-to-miami", "miami-to-charlotte", "miami-to-orlando", "orlando-to-miami"]
    },

    "new-york-to-miami": {
        id: "new-york-to-miami",
        slug: "new-york-to-miami",
        legacyPath: "/auto-transport-new-york-to-miami",
        fromCity: "New York",
        fromState: "NY",
        toCity: "Miami",
        toState: "FL",
        seoTitle: "New York to Miami Car Shipping | Road America Auto Transport",
        seoDescription: "Need to ship a car from New York, NY to Miami, FL? Premier snowbird car shipping experts. Door-to-door, fully insured auto transport with instant free quotes.",
        h1Title: "New York to Miami",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Relocating from New York to Sunshine State? Road America Auto Transport offers premier southbound auto transport along the I-95 corridor. From NYC snowbirds heading south for winter to permanent relocations, we guarantee safe, door-to-door car transport with transparent pricing.",
        approximateDistance: "1,280 miles",
        estimatedTransitTime: "3 - 5 days",
        majorPickupAreas: ["Manhattan", "Brooklyn", "Queens", "Staten Island", "Long Island", "Yonkers", "White Plains"],
        majorDeliveryAreas: ["Miami Beach", "Brickell", "Coral Gables", "Sunny Isles", "Aventura", "Doral", "Fort Lauderdale"],
        routeSpecificPricingFactors: [
            "High fall/winter demand (October–December) during snowbird migration south.",
            "Metropolitan NYC traffic delays and bridge toll structure.",
            "Vehicle size and ground clearance considerations.",
            "Choice of open multi-car carrier or enclosed transport."
        ],
        seasonalConsiderations: "Fall and early winter (Oct-Dec) see high southbound volume. Booking early during these months helps secure top carrier availability.",
        faqContent: [
            {
                question: "How much does it cost to ship a car from NY to Miami?",
                answer: "Car shipping costs depend on vehicle size, transport type (open vs enclosed), and season. Submit our simple form above to receive an accurate, hand-calculated quote from our ASE Master Tech team."
            },
            {
                question: "How does snowbird car shipping work from NY to FL?",
                answer: "We arrange door-to-door pickup in New York or Long Island and transport your vehicle directly to your Florida address in 3 to 5 days."
            },
            {
                question: "Can I leave personal items in the car?",
                answer: "Carriers generally allow up to 100 lbs of personal items secured in the trunk or below the window line."
            }
        ],
        relatedRouteSlugs: ["miami-to-new-york", "orlando-to-miami", "houston-to-miami", "miami-to-charlotte"]
    },

    "houston-to-los-angeles": {
        id: "houston-to-los-angeles",
        slug: "houston-to-los-angeles",
        legacyPath: "/auto-transport-houston-to-los-angeles",
        fromCity: "Houston",
        fromState: "TX",
        toCity: "Los Angeles",
        toState: "CA",
        seoTitle: "Houston to Los Angeles Car Shipping | Road America Auto Transport",
        seoDescription: "Ship a vehicle from Houston, TX to Los Angeles, CA with Road America Auto Transport. Trusted I-10 cross-country car haulers. Fast, reliable, door-to-door shipping.",
        h1Title: "Houston to Los Angeles",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Transporting a car across the Southwest from Houston to Los Angeles covers over 1,500 miles along Interstate 10. Whether moving for work, buying a vehicle remotely, or shipping a fleet, Road America Auto Transport provides dependable door-to-door auto transport with complete insurance coverage.",
        approximateDistance: "1,550 miles",
        estimatedTransitTime: "4 - 6 days",
        majorPickupAreas: ["Downtown Houston", "The Woodlands", "Katy", "Sugar Land", "Pearland", "Spring"],
        majorDeliveryAreas: ["Downtown LA", "Santa Monica", "Pasadena", "Glendale", "Irvine", "Long Beach", "Beverly Hills"],
        routeSpecificPricingFactors: [
            "Distance across Texas, New Mexico, Arizona, and Southern California via I-10.",
            "Fuel prices across southwestern states.",
            "Port of LA / Long Beach commercial shipping volume dynamics.",
            "Enclosed carrier options for exotic, custom, or low-clearance vehicles."
        ],
        seasonalConsiderations: "Summer heat in West Texas and Arizona requires vigilant vehicle transport safety. Year-round carrier availability remains high along the I-10 freight corridor.",
        faqContent: [
            {
                question: "How long does it take to ship a car from Houston to Los Angeles?",
                answer: "Transit typically takes between 4 and 6 days. Our carriers follow the I-10 highway directly from Texas through New Mexico and Arizona into Southern California."
            },
            {
                question: "Do you offer enclosed auto transport from Houston to LA?",
                answer: "Yes! We offer both open standard haulers and enclosed transport for luxury, classic, or modified sports cars requiring weather protection."
            }
        ],
        relatedRouteSlugs: ["los-angeles-to-houston", "houston-to-miami", "los-angeles-to-atlanta", "atlanta-to-los-angeles"]
    },

    "los-angeles-to-houston": {
        id: "los-angeles-to-houston",
        slug: "los-angeles-to-houston",
        legacyPath: "/auto-transport-los-angeles-to-houston",
        fromCity: "Los Angeles",
        fromState: "CA",
        toCity: "Houston",
        toState: "TX",
        seoTitle: "Los Angeles to Houston Car Shipping | Road America Auto Transport",
        seoDescription: "Reliable car transport from Los Angeles, CA to Houston, TX. Top-rated I-10 auto transport carriers, fully insured door-to-door service with instant quotes.",
        h1Title: "Los Angeles to Houston",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Shipping your car eastward from Los Angeles to Houston requires experienced long-haul car carriers familiar with Southern California departures and Texas drop-offs. Road America Auto Transport manages every step of your shipment from LA County to Greater Houston.",
        approximateDistance: "1,550 miles",
        estimatedTransitTime: "4 - 6 days",
        majorPickupAreas: ["Los Angeles", "Anaheim", "Torrance", "Van Nuys", "Pasadena", "Ontario"],
        majorDeliveryAreas: ["Houston", "Katy", "Cypress", "Sugar Land", "The Woodlands", "Conroe"],
        routeSpecificPricingFactors: [
            "Southern California outbound freight traffic.",
            "Texas metro distribution hubs.",
            "Vehicle weight and dimensions (SUVs/trucks vs sedans).",
            "Option for expedited pickup."
        ],
        seasonalConsiderations: "Consistent shipping corridor with minimal seasonal fluctuation, making transit predictable year-round.",
        faqContent: [
            {
                question: "What is the transit time from LA to Houston?",
                answer: "Carriers cover the 1,550-mile journey in approximately 4 to 6 days under normal weather and driving conditions."
            },
            {
                question: "Where will my car be picked up in Los Angeles?",
                answer: "We arrange door-to-door pickup from your residential driveway, office, or dealership anywhere in Greater Los Angeles."
            }
        ],
        relatedRouteSlugs: ["houston-to-los-angeles", "los-angeles-to-miami", "los-angeles-to-atlanta", "miami-to-los-angeles"]
    },

    "los-angeles-to-miami": {
        id: "los-angeles-to-miami",
        slug: "los-angeles-to-miami",
        legacyPath: "/auto-transport-los-angeles-to-miami",
        fromCity: "Los Angeles",
        fromState: "CA",
        toCity: "Miami",
        toState: "FL",
        seoTitle: "Los Angeles to Miami Car Shipping | Road America Auto Transport",
        seoDescription: "Coast-to-coast car shipping from Los Angeles, CA to Miami, FL. Premium door-to-door auto transport. Fully insured, transparent pricing.",
        h1Title: "Los Angeles to Miami",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Coast-to-coast car shipping from Southern California to South Florida spans over 2,700 miles across the heart of the southern United States. Road America Auto Transport delivers seamless, fully insured coast-to-coast auto transport between Los Angeles and Miami.",
        approximateDistance: "2,730 miles",
        estimatedTransitTime: "7 - 9 days",
        majorPickupAreas: ["Downtown LA", "Beverly Hills", "Santa Monica", "Orange County", "Glendale", "Burbank"],
        majorDeliveryAreas: ["Miami", "Miami Beach", "Coral Gables", "Fort Lauderdale", "Boca Raton", "West Palm Beach"],
        routeSpecificPricingFactors: [
            "Longest continental coast-to-coast distance (2,700+ miles).",
            "Interstate routes via I-10 and I-75.",
            "Choice of open vs enclosed trailers for high-value vehicles.",
            "Vehicle operational status (running vs inoperable)."
        ],
        seasonalConsiderations: "Coast-to-coast shipping runs smoothly all year. Winter routes stick to southern corridors (I-10) to avoid icy northern passes.",
        faqContent: [
            {
                question: "How long does coast-to-coast car shipping take from LA to Miami?",
                answer: "Coast-to-coast vehicle shipping from LA to Miami usually takes 7 to 9 days due to the 2,730-mile distance."
            },
            {
                question: "Do you provide real-time updates during the trip?",
                answer: "Yes, our status tracking portal and customer dispatch support keep you updated throughout the journey."
            }
        ],
        relatedRouteSlugs: ["miami-to-los-angeles", "los-angeles-to-houston", "los-angeles-to-atlanta", "houston-to-miami"]
    },

    "miami-to-los-angeles": {
        id: "miami-to-los-angeles",
        slug: "miami-to-los-angeles",
        legacyPath: "/auto-transport-miami-to-los-angeles",
        fromCity: "Miami",
        fromState: "FL",
        toCity: "Los Angeles",
        toState: "CA",
        seoTitle: "Miami to Los Angeles Car Shipping | Road America Auto Transport",
        seoDescription: "Ship your car coast-to-coast from Miami, FL to Los Angeles, CA. Fully insured, top-rated auto transport. Get a free instant quote today.",
        h1Title: "Miami to Los Angeles",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Shipping a vehicle cross-country from South Florida to Southern California requires dedicated long-haul auto transport professionals. Road America Auto Transport handles your Miami to LA vehicle transport with precision, full insurance coverage, and clear communication.",
        approximateDistance: "2,730 miles",
        estimatedTransitTime: "7 - 9 days",
        majorPickupAreas: ["Miami", "Fort Lauderdale", "Boca Raton", "Coral Gables", "Doral", "Hollywood"],
        majorDeliveryAreas: ["Los Angeles", "Santa Monica", "Pasadena", "Irvine", "Long Beach", "Century City"],
        routeSpecificPricingFactors: [
            "Cross-country haul spanning 2,700+ miles across 7 states.",
            "Fuel costs and highway routing via I-75 north to I-10 west.",
            "Vehicle class (sedan, SUV, pickup, luxury vehicle).",
            "Open vs. enclosed auto transport options."
        ],
        seasonalConsiderations: "Cross-country routes utilize southern interstate corridors year-round, minimizing winter weather delays.",
        faqContent: [
            {
                question: "How long does shipping take from Miami to LA?",
                answer: "Expect 7 to 9 days of transit time for coast-to-coast delivery from South Florida to Southern California."
            },
            {
                question: "Is my car covered by insurance during cross-country shipping?",
                answer: "Yes, every carrier in our carrier network holds active cargo insurance coverage protecting your vehicle throughout transport."
            }
        ],
        relatedRouteSlugs: ["los-angeles-to-miami", "miami-to-houston", "miami-to-new-york", "atlanta-to-los-angeles"]
    },

    "los-angeles-to-atlanta": {
        id: "los-angeles-to-atlanta",
        slug: "los-angeles-to-atlanta",
        legacyPath: "/auto-transport-los-angeles-to-atlanta",
        fromCity: "Los Angeles",
        fromState: "CA",
        toCity: "Atlanta",
        toState: "GA",
        seoTitle: "Los Angeles to Atlanta Car Shipping | Road America Auto Transport",
        seoDescription: "Ship your car from Los Angeles, CA to Atlanta, GA. Reliable cross-country auto haulers. Door-to-door, fully insured auto shipping.",
        h1Title: "Los Angeles to Atlanta",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Connecting the West Coast film and business centers with Atlanta, Georgia, Road America Auto Transport provides efficient cross-country vehicle shipping along I-10 and I-20 corridors. We service private vehicle owners, corporate transfers, and dealership moves.",
        approximateDistance: "2,180 miles",
        estimatedTransitTime: "5 - 7 days",
        majorPickupAreas: ["Los Angeles", "Culver City", "Burbank", "Torrance", "Anaheim", "Riverside"],
        majorDeliveryAreas: ["Atlanta", "Buckhead", "Alpharetta", "Marietta", "Decatur", "Sandy Springs"],
        routeSpecificPricingFactors: [
            "2,180-mile long-haul interstate distance.",
            "Major highway corridors: I-10 E to I-20 E.",
            "High carrier availability between LA and Atlanta transport hubs.",
            "Open carrier vs enclosed trailer choices."
        ],
        seasonalConsiderations: "Year-round active auto transport route with consistent carrier volume and steady pricing.",
        faqContent: [
            {
                question: "How long does car shipping take from LA to Atlanta?",
                answer: "Shipping a car from Los Angeles to Atlanta typically takes 5 to 7 days from pickup to delivery."
            },
            {
                question: "Do you offer door-to-door service in Atlanta?",
                answer: "Yes! We pick up directly from your location in LA and deliver to your doorstep anywhere in Metro Atlanta."
            }
        ],
        relatedRouteSlugs: ["atlanta-to-los-angeles", "los-angeles-to-houston", "los-angeles-to-miami", "atlanta-to-miami"]
    },

    "atlanta-to-los-angeles": {
        id: "atlanta-to-los-angeles",
        slug: "atlanta-to-los-angeles",
        legacyPath: "/auto-transport-atlanta-to-los-angeles",
        fromCity: "Atlanta",
        fromState: "GA",
        toCity: "Los Angeles",
        toState: "CA",
        seoTitle: "Atlanta to Los Angeles Car Shipping | Road America Auto Transport",
        seoDescription: "Safe, fast car shipping from Atlanta, GA to Los Angeles, CA. Premier auto haulers, fully insured door-to-door shipping. Get your instant quote now.",
        h1Title: "Atlanta to Los Angeles",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Moving a vehicle from Metro Atlanta to Los Angeles? Road America Auto Transport specializes in westbound cross-country vehicle shipping across the southern US highway network, ensuring safe delivery from Georgia to California.",
        approximateDistance: "2,180 miles",
        estimatedTransitTime: "5 - 7 days",
        majorPickupAreas: ["Atlanta", "Buckhead", "Midtown", "Alpharetta", "Dunwoody", "Lawrenceville"],
        majorDeliveryAreas: ["Los Angeles", "Pasadena", "Santa Monica", "Long Beach", "Glendale", "Irvine"],
        routeSpecificPricingFactors: [
            "2,180-mile route across Georgia, Alabama, Mississippi, Texas, New Mexico, Arizona, and California.",
            "Carrier freight demand out of the Atlanta distribution cluster.",
            "Vehicle size, weight, and modification status.",
            "Choice of open vs enclosed carrier."
        ],
        seasonalConsiderations: "Steady freight traffic year-round ensures fast carrier assignments and predictable transit timelines.",
        faqContent: [
            {
                question: "How long does transit take from Atlanta to LA?",
                answer: "Vehicle shipping from Atlanta to Los Angeles takes between 5 and 7 days after driver pickup."
            },
            {
                question: "Can I track my vehicle during transit?",
                answer: "Yes, our team provides status updates and driver contact details so you always know where your vehicle is."
            }
        ],
        relatedRouteSlugs: ["los-angeles-to-atlanta", "atlanta-to-miami", "miami-to-los-angeles", "houston-to-los-angeles"]
    },

    "houston-to-miami": {
        id: "houston-to-miami",
        slug: "houston-to-miami",
        legacyPath: "/auto-transport-houston-to-miami",
        fromCity: "Houston",
        fromState: "TX",
        toCity: "Miami",
        toState: "FL",
        seoTitle: "Houston to Miami Car Shipping | Road America Auto Transport",
        seoDescription: "Ship a car from Houston, TX to Miami, FL. Direct Gulf Coast auto shipping along I-10 and I-75. Fully insured door-to-door car transport.",
        h1Title: "Houston to Miami",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Shipping a car along the Gulf Coast corridor from Houston to Miami spans approximately 1,180 miles. Road America Auto Transport connects Texas and Florida with quick, fully insured door-to-door car shipping options.",
        approximateDistance: "1,180 miles",
        estimatedTransitTime: "3 - 5 days",
        majorPickupAreas: ["Houston", "Katy", "Sugar Land", "The Woodlands", "Pearland", "Pasadena"],
        majorDeliveryAreas: ["Miami", "Fort Lauderdale", "Boca Raton", "Coral Gables", "Pembroke Pines", "West Palm Beach"],
        routeSpecificPricingFactors: [
            "Gulf Coast interstate corridor via I-10 E to I-75 S.",
            "High carrier volume connecting Texas and Florida freight hubs.",
            "Open multi-car carrier vs enclosed transport options.",
            "Vehicle operable status."
        ],
        seasonalConsiderations: "Summer hurricane season along the Gulf Coast can occasionally require brief weather monitoring, but carriers operate smoothly year-round.",
        faqContent: [
            {
                question: "How long does car shipping take from Houston to Miami?",
                answer: "Transit typically takes 3 to 5 days along the I-10 to I-75 corridor."
            },
            {
                question: "What is included in my auto transport quote?",
                answer: "Our quotes include complete door-to-door pickup and delivery, full cargo insurance, all taxes and toll surcharges, with zero hidden fees."
            }
        ],
        relatedRouteSlugs: ["miami-to-houston", "houston-to-los-angeles", "new-york-to-miami", "orlando-to-miami"]
    },

    "miami-to-houston": {
        id: "miami-to-houston",
        slug: "miami-to-houston",
        legacyPath: "/auto-transport-miami-to-houston",
        fromCity: "Miami",
        fromState: "FL",
        toCity: "Houston",
        toState: "TX",
        seoTitle: "Miami to Houston Car Shipping | Road America Auto Transport",
        seoDescription: "Direct car transport from Miami, FL to Houston, TX. Reliable auto haulers, fully insured door-to-door shipping with instant free quotes.",
        h1Title: "Miami to Houston",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Need your car moved west from Miami to Houston? Road America Auto Transport offers direct Gulf Coast auto transport. We handle single vehicles, luxury sports cars, and dealership inventory with unmatched care and speed.",
        approximateDistance: "1,180 miles",
        estimatedTransitTime: "3 - 5 days",
        majorPickupAreas: ["Miami", "Coral Gables", "Doral", "Hialeah", "Fort Lauderdale", "West Palm Beach"],
        majorDeliveryAreas: ["Houston", "Katy", "Sugar Land", "Cypress", "The Woodlands", "Clear Lake"],
        routeSpecificPricingFactors: [
            "Interstate shipping along I-75 N to I-10 W.",
            "Dense carrier freight connections out of Florida.",
            "Vehicle size and transport method (open vs enclosed).",
            "Pickup location accessibility."
        ],
        seasonalConsiderations: "Very consistent shipping lane year-round with frequent carrier availability.",
        faqContent: [
            {
                question: "How many days to ship a car from Miami to Houston?",
                answer: "Shipping takes between 3 and 5 days under standard transit conditions."
            },
            {
                question: "Are there any hidden fees in your quote?",
                answer: "Never. The quote you receive from Road America is 100% transparent and covers insurance, fuel, tolls, and door-to-door service."
            }
        ],
        relatedRouteSlugs: ["houston-to-miami", "miami-to-los-angeles", "miami-to-new-york", "miami-to-orlando"]
    },

    "atlanta-to-miami": {
        id: "atlanta-to-miami",
        slug: "atlanta-to-miami",
        legacyPath: "/auto-transport-atlanta-to-miami",
        fromCity: "Atlanta",
        fromState: "GA",
        toCity: "Miami",
        toState: "FL",
        seoTitle: "Atlanta to Miami Car Shipping | Road America Auto Transport",
        seoDescription: "Ship a car from Atlanta, GA to Miami, FL. Direct I-75 south auto transport corridor. Fast, fully insured, door-to-door car shipping.",
        h1Title: "Atlanta to Miami",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "The Atlanta to Miami transport lane is one of the Southeast's most popular shipping routes. Running straight south along Interstate 75, Road America Auto Transport delivers quick 2 to 3 day transit for personal vehicles, dealership moves, and relocations.",
        approximateDistance: "660 miles",
        estimatedTransitTime: "2 - 3 days",
        majorPickupAreas: ["Atlanta", "Buckhead", "Alpharetta", "Marietta", "Duluth", "Sandy Springs"],
        majorDeliveryAreas: ["Miami", "Miami Beach", "Coral Gables", "Fort Lauderdale", "Boca Raton", "Hollywood"],
        routeSpecificPricingFactors: [
            "Short Southeast corridor (660 miles) with high daily carrier frequency.",
            "Direct highway access via I-75 South through Georgia and Florida.",
            "Open 8-10 car haulers offer low competitive pricing.",
            "Enclosed transport available for luxury and classic cars."
        ],
        seasonalConsiderations: "High traffic throughout winter and spring as travelers move south toward Florida's coast.",
        faqContent: [
            {
                question: "How fast can you ship a vehicle from Atlanta to Miami?",
                answer: "Because the route is only 660 miles along I-75, transit usually takes just 2 to 3 days from driver pickup."
            },
            {
                question: "Do you pick up in Atlanta suburbs like Alpharetta or Marietta?",
                answer: "Yes, we provide full door-to-door service across the entire Metro Atlanta region."
            }
        ],
        relatedRouteSlugs: ["orlando-to-miami", "new-york-to-miami", "miami-to-charlotte", "atlanta-to-los-angeles"]
    },

    "orlando-to-miami": {
        id: "orlando-to-miami",
        slug: "orlando-to-miami",
        legacyPath: "/auto-transport-orlando-to-miami",
        fromCity: "Orlando",
        fromState: "FL",
        toCity: "Miami",
        toState: "FL",
        seoTitle: "Orlando to Miami Car Shipping | Road America Auto Transport",
        seoDescription: "Need to ship a car from Orlando, FL to Miami, FL? Intra-state Florida auto transport. Fast 1-2 day door-to-door vehicle delivery.",
        h1Title: "Orlando to Miami",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Shipping a vehicle within Florida from Orlando to Miami covers roughly 230 miles along Florida's Turnpike and I-95. Road America Auto Transport provides fast 1 to 2 day intra-state car shipping ideal for snowbirds, college students, and auto buyers.",
        approximateDistance: "230 miles",
        estimatedTransitTime: "1 - 2 days",
        majorPickupAreas: ["Orlando", "Winter Park", "Kissimmee", "Lake Buena Vista", "Sanford", "Altamonte Springs"],
        majorDeliveryAreas: ["Miami", "Miami Beach", "Doral", "Coral Gables", "Aventura", "Homestead"],
        routeSpecificPricingFactors: [
            "Short intrastate transport (230 miles).",
            "Toll surcharges along Florida's Turnpike.",
            "Same-day or next-day driver dispatch availability.",
            "Single-car flatbed vs multi-car carrier options."
        ],
        seasonalConsiderations: "Year-round high demand driven by tourism, seasonal residents, and vehicle sales across Central and South Florida.",
        faqContent: [
            {
                question: "How long does car shipping take from Orlando to Miami?",
                answer: "Intrastate shipping from Orlando to Miami is extremely quick—usually completed within 1 to 2 days."
            },
            {
                question: "Can I ship a car bought at an auction or dealership in Orlando?",
                answer: "Yes! We regularly pick up directly from Orlando auto auctions, dealerships, or private sellers."
            }
        ],
        relatedRouteSlugs: ["miami-to-orlando", "atlanta-to-miami", "new-york-to-miami", "miami-to-charlotte"]
    },

    "miami-to-orlando": {
        id: "miami-to-orlando",
        slug: "miami-to-orlando",
        legacyPath: "/auto-transport-miami-to-orlando",
        fromCity: "Miami",
        fromState: "FL",
        toCity: "Orlando",
        toState: "FL",
        seoTitle: "Miami to Orlando Car Shipping | Road America Auto Transport",
        seoDescription: "Ship your car from Miami, FL to Orlando, FL. Reliable Florida intrastate auto transport. Fast 1-2 day door-to-door delivery.",
        h1Title: "Miami to Orlando",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Moving a vehicle northbound from Miami to Orlando? Road America Auto Transport handles intrastate Florida car transport with speed and care. Whether moving north for school, business, or leisure, we offer rapid 1 to 2 day door-to-door service.",
        approximateDistance: "230 miles",
        estimatedTransitTime: "1 - 2 days",
        majorPickupAreas: ["Miami", "Brickell", "Doral", "Coral Gables", "Hialeah", "Fort Lauderdale"],
        majorDeliveryAreas: ["Orlando", "Winter Park", "Lake Buena Vista", "Kissimmee", "Dr. Phillips", "Ocoee"],
        routeSpecificPricingFactors: [
            "Intrastate Florida corridor via Turnpike / I-95.",
            "High carrier turnaround speed.",
            "Open multi-vehicle transport vs enclosed trailer options.",
            "Operable status of vehicle."
        ],
        seasonalConsiderations: "High availability year-round with frequent daily truck dispatches between South and Central Florida.",
        faqContent: [
            {
                question: "How fast will my car arrive in Orlando from Miami?",
                answer: "Transit takes just 1 to 2 days after vehicle pickup."
            },
            {
                question: "Do you offer door-to-door pickup in Miami?",
                answer: "Yes, we pick up directly from your residence, workplace, or port terminal in South Florida."
            }
        ],
        relatedRouteSlugs: ["orlando-to-miami", "miami-to-charlotte", "miami-to-new-york", "atlanta-to-miami"]
    },

    "miami-to-charlotte": {
        id: "miami-to-charlotte",
        slug: "miami-to-charlotte",
        legacyPath: "/auto-transport-miami-to-charlotte",
        fromCity: "Miami",
        fromState: "FL",
        toCity: "Charlotte",
        toState: "NC",
        seoTitle: "Miami to Charlotte Car Shipping | Road America Auto Transport",
        seoDescription: "Ship a car from Miami, FL to Charlotte, NC. Fast I-95 / I-77 auto shipping corridor. Fully insured door-to-door car transport.",
        h1Title: "Miami to Charlotte",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Connecting South Florida with North Carolina's major financial hub, Road America Auto Transport provides premier car shipping from Miami to Charlotte. Enjoy smooth door-to-door transport with hand-calculated quotes by ASE Master Techs.",
        approximateDistance: "725 miles",
        estimatedTransitTime: "2 - 4 days",
        majorPickupAreas: ["Miami", "Fort Lauderdale", "Coral Gables", "Boca Raton", "West Palm Beach"],
        majorDeliveryAreas: ["Charlotte", "Uptown Charlotte", "Ballantyne", "SouthPark", "Huntersville", "Matthews"],
        routeSpecificPricingFactors: [
            "725-mile East Coast freight route along I-95 N to I-77 N.",
            "Competitive carrier rates along major banking & racing shipping lanes.",
            "Open vs enclosed auto transport for premium vehicles.",
            "Vehicle size (sedan vs midsize SUV vs full-size truck)."
        ],
        seasonalConsiderations: "Consistent shipping corridor year-round with steady carrier capacity.",
        faqContent: [
            {
                question: "How long does car shipping take from Miami to Charlotte?",
                answer: "Typical transit time is 2 to 4 days from pickup date."
            },
            {
                question: "Is my vehicle insured on the truck from FL to NC?",
                answer: "Yes, all our licensed carriers carry comprehensive cargo insurance coverage."
            }
        ],
        relatedRouteSlugs: ["charlotte-to-miami", "miami-to-new-york", "atlanta-to-miami", "new-york-to-miami"]
    },

    "charlotte-to-miami": {
        id: "charlotte-to-miami",
        slug: "charlotte-to-miami",
        legacyPath: "/auto-transport-charlotte-to-miami",
        fromCity: "Charlotte",
        fromState: "NC",
        toCity: "Miami",
        toState: "FL",
        seoTitle: "Charlotte to Miami Car Shipping | Road America Auto Transport",
        seoDescription: "Ship your car from Charlotte, NC to Miami, FL. Direct Southeast auto transport. Door-to-door fully insured vehicle delivery with instant quote.",
        h1Title: "Charlotte to Miami",
        h1Subtitle: "Car Shipping Services",
        introductoryCopy: "Relocating or transporting a vehicle south from Charlotte to Miami? Road America Auto Transport connects the Carolinas to South Florida with fast, insured auto transport along I-77 South and I-95 South.",
        approximateDistance: "725 miles",
        estimatedTransitTime: "2 - 4 days",
        majorPickupAreas: ["Charlotte", "Ballantyne", "Huntersville", "Concord", "Gastonia", "Rock Hill"],
        majorDeliveryAreas: ["Miami", "Miami Beach", "Aventura", "Doral", "Coral Gables", "Fort Lauderdale"],
        routeSpecificPricingFactors: [
            "725-mile Southeast corridor.",
            "I-77 S to I-95 S highway routing.",
            "Carrier freight demand entering Florida.",
            "Choice of open vs enclosed carrier."
        ],
        seasonalConsiderations: "Heavy fall and winter southbound volume as residents move south for warmer weather.",
        faqContent: [
            {
                question: "How long does car transport take from Charlotte to Miami?",
                answer: "Expect 2 to 4 days of transit time after pickup."
            },
            {
                question: "Can I schedule a specific pickup date in Charlotte?",
                answer: "Yes! When requesting your quote, you can specify your preferred pickup window (ASAP, this week, or flexible)."
            }
        ],
        relatedRouteSlugs: ["miami-to-charlotte", "new-york-to-miami", "atlanta-to-miami", "orlando-to-miami"]
    }
};

export function getRouteBySlug(slug: string): RouteConfig | undefined {
    if (!slug) return undefined;
    const cleanSlug = slug.toLowerCase().replace(/^\//, '').replace(/^car-shipping-routes\//, '').replace(/^auto-transport-/, '');
    
    // Direct match by id/slug
    if (ROUTES_DATA[cleanSlug]) {
        return ROUTES_DATA[cleanSlug];
    }
    
    // Try matching legacyPath or id
    return Object.values(ROUTES_DATA).find(
        (route) => route.slug === cleanSlug || route.id === cleanSlug || route.legacyPath.endsWith(cleanSlug)
    );
}

export function getAllRoutes(): RouteConfig[] {
    return Object.values(ROUTES_DATA);
}
