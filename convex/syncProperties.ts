import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate 500 properties across multiple cities
function generateAddresses(count: number = 500) {
  const cities = [
    { city: "Charlotte", state: "NC", zipCode: "28214" },
    { city: "Charlotte", state: "NC", zipCode: "28216" },
    { city: "Durham", state: "NC", zipCode: "27701" },
    { city: "Durham", state: "NC", zipCode: "27705" },
    { city: "Durham", state: "NC", zipCode: "27707" },
    { city: "Durham", state: "NC", zipCode: "27713" },
    { city: "Raleigh", state: "NC", zipCode: "27612" },
    { city: "Raleigh", state: "NC", zipCode: "27613" },
    { city: "Raleigh", state: "NC", zipCode: "27617" },
    { city: "Cary", state: "NC", zipCode: "27519" },
    { city: "Chapel Hill", state: "NC", zipCode: "27514" },
    { city: "Chapel Hill", state: "NC", zipCode: "27516" },
    { city: "Chapel Hill", state: "NC", zipCode: "27517" },
    { city: "Hendersonville", state: "NC", zipCode: "28792" },
    { city: "Lake Lure", state: "NC", zipCode: "28746" },
    { city: "Tryon", state: "NC", zipCode: "28782" },
    { city: "Mill Spring", state: "NC", zipCode: "28756" },
    { city: "Gerton", state: "NC", zipCode: "28735" },
    { city: "Union Mills", state: "NC", zipCode: "28167" },
    { city: "Zirconia", state: "NC", zipCode: "28790" },
    { city: "Pittsboro", state: "NC", zipCode: "27312" }
  ];

  const streetNames = [
    "Oak", "Main", "Park", "Cedar", "Maple", "Washington", "Elm", "Pine",
    "Lake", "Hill", "Forest", "Valley", "Sunset", "Spring", "River", "Meadow",
    "Highland", "Willow", "Ridge", "Mountain", "Creek", "Church", "North", "South",
    "Eagle", "Hawk", "Falcon", "Bear", "Deer", "Fox", "Wolf", "Birch",
    "Cherry", "Holly", "Laurel", "Rose", "Jasmine", "Violet", "Magnolia", "Poplar"
  ];

  const streetTypes = [
    "Street", "Avenue", "Drive", "Road", "Lane", "Way", "Court", "Circle",
    "Place", "Trail", "Parkway", "Boulevard", "Terrace", "Loop", "Path"
  ];

  const addresses = [];

  for (let i = 0; i < count; i++) {
    const cityInfo = cities[Math.floor(Math.random() * cities.length)];
    const streetNum = Math.floor(Math.random() * 9900) + 100;
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];

    addresses.push({
      city: cityInfo.city,
      state: cityInfo.state,
      street: `${streetNum} ${streetName} ${streetType}`,
      zipCode: cityInfo.zipCode
    });
  }

  return addresses;
}

// Property addresses from reference - ALL 96 properties (kept as fallback)
const fallbackPropertyAddresses = [
  { city: "Lake Lure", state: "NC", street: "Bobcats Trail", zipCode: "28746" },
  { city: "Mill Spring", state: "NC", street: "479 Camp Hill Road", zipCode: "28756" },
  { city: "Hendersonville", state: "NC", street: "135 Middle Street", zipCode: "28792" },
  { city: "Lake Lure", state: "NC", street: "243 Buffalo Creek Road", zipCode: "28746" },
  { city: "Lake Lure", state: "NC", street: "128 Washburn Road", zipCode: "28746" },
  { city: "Tryon", state: "NC", street: "423 Dogwood Trail", zipCode: "28782" },
  { city: "Gerton", state: "NC", street: "218 McGuffey Ridge Road", zipCode: "28735" },
  { city: "Hendersonville", state: "NC", street: "51 Alfson Circle", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "200 Cranbrook Circle", zipCode: "28792" },
  { city: "Zirconia", state: "NC", street: "685 Freeman Creek Road", zipCode: "28790" },
  { city: "Hendersonville", state: "NC", street: "1206 Deermouse Way", zipCode: "28792" },
  { city: "Gerton", state: "NC", street: "5838 Bearwallow Mountain Road", zipCode: "28735" },
  { city: "Union Mills", state: "NC", street: "152 Marsh Boulevard", zipCode: "28167" },
  { city: "Hendersonville", state: "NC", street: "226 Cranbrook Circle", zipCode: "28792" },
  { city: "Lake Lure", state: "NC", street: "112 Bills Creek Road", zipCode: "28746" },
  { city: "Hendersonville", state: "NC", street: "289 Firemender Valley Trail", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "Firemender Valley Trail", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "2600 Little Creek Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "237 Upper Bat Cave Drive", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "1323 Locust Grove Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "179 Serendipity Cove Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "1282 Spicer Cove Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "19 Hominy Branch Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "2840 Little Creek Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "2864 Little Creek Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "1512 Hickory Acres Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "2850 Little Creek Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "896 Blacksmith Run Dr", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "1878 Old Clear Creek Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "2024 Gilliam Mountain Road", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "228 Ida Rogers Drive", zipCode: "28792" },
  { city: "Hendersonville", state: "NC", street: "2838 Little Creek Road", zipCode: "28792" },
  { city: "Charlotte", state: "NC", street: "9524 Eagle Feathers Drive", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "1205 Cathey Road", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "4922 Coppala Drive", zipCode: "28216" },
  { city: "Charlotte", state: "NC", street: "1805 Crabapple Tree Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "11019 Treebranch Drive", zipCode: "28216" },
  { city: "Charlotte", state: "NC", street: "9746 Holly Park Drive", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "8036 Joy Crossing Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "8032 Joy Crossing Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "4110 Dillingham Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "9554 Turning Wheel Dr", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "10527 River Hollow Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "10925 Lassen Ct", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "9630 Turning Wheel Drive", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "3308 Lemongrass Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "7116 Garrett Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "7129 Garrett Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "1900 Mount Holly-Huntersville Road", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "4917 Coppala Drive", zipCode: "28216" },
  { city: "Charlotte", state: "NC", street: "2133 Highland View Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "10621 Shanon Darby Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "11004 Dipali Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "309 Minitree Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "7125 Garrett Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "7121 Garrett Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "8108 Haidas Avenue", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "7113 Garrett Court", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "7005 Bermuda Woods Road", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "2511 Austyn Joey Drive", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "10003 Travis Floyd Lane", zipCode: "28214" },
  { city: "Charlotte", state: "NC", street: "7117 Garrett Court", zipCode: "28214" },
  { city: "Durham", state: "NC", street: "3208 Horsebarn Drive", zipCode: "27705" },
  { city: "Raleigh", state: "NC", street: "9136 Meadow Mist Court", zipCode: "27617" },
  { city: "Durham", state: "NC", street: "6 Chelan Court", zipCode: "27713" },
  { city: "Durham", state: "NC", street: "519 Hunting Chase", zipCode: "27713" },
  { city: "Chapel Hill", state: "NC", street: "1509 Cumberland Road", zipCode: "27514" },
  { city: "Durham", state: "NC", street: "429 Carolina Circle", zipCode: "27707" },
  { city: "Raleigh", state: "NC", street: "9404 Floral Ridge Court", zipCode: "27613" },
  { city: "Raleigh", state: "NC", street: "3413 1st Place", zipCode: "27613" },
  { city: "Pittsboro", state: "NC", street: "197 Roads End", zipCode: "27312" },
  { city: "Chapel Hill", state: "NC", street: "102 Shadow Ridge Place", zipCode: "27516" },
  { city: "Cary", state: "NC", street: "322 Parkmeadow Drive", zipCode: "27519" },
  { city: "Durham", state: "NC", street: "126 Solterra Way", zipCode: "27705" },
  { city: "Raleigh", state: "NC", street: "7504 Panther Branch Drive", zipCode: "27612" },
  { city: "Durham", state: "NC", street: "826 Watercolor Way", zipCode: "27713" },
  { city: "Durham", state: "NC", street: "3934 Hope Valley Road", zipCode: "27707" },
  { city: "Cary", state: "NC", street: "210 Beckingham Loop", zipCode: "27519" },
  { city: "Durham", state: "NC", street: "1304 North Duke Street", zipCode: "27701" },
  { city: "Chapel Hill", state: "NC", street: "205 Oxfordshire Lane", zipCode: "27517" },
  { city: "Durham", state: "NC", street: "11 Gatesway Court", zipCode: "27707" },
  { city: "Durham", state: "NC", street: "103 Ashworth Drive", zipCode: "27707" },
  { city: "Durham", state: "NC", street: "611 South Buchanan Boulevard", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "618 Arnette Avenue", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "607 South Buchanan Boulevard", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "612 Arnette Avenue", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "616 Arnette Avenue", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "615 South Buchanan Boulevard", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "614 Arnette Avenue", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "609 South Buchanan Boulevard", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "216 West Geer Street", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "613 South Buchanan Boulevard", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "813 Burch Avenue", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "1008 North Street", zipCode: "27701" },
  { city: "Durham", state: "NC", street: "813 North Mangum Street", zipCode: "27701" },
];

// Owner name generation for 500 properties
function generateOwners(count: number = 50) {
  const firstNames = [
    "Robert", "Jennifer", "David", "Lisa", "Michael", "Sarah", "James", "Emily",
    "Christopher", "Patricia", "Daniel", "Michelle", "Kevin", "Nancy", "Brian", "Amanda",
    "Jason", "Melissa", "Ryan", "Jessica", "Andrew", "Stephanie", "Timothy", "Rachel",
    "Eric", "Laura", "Mark", "Karen", "Steven", "Elizabeth", "Joseph", "Maria",
    "Charles", "Susan", "Thomas", "Dorothy", "Richard", "Helen", "Kenneth", "Betty",
    "George", "Sandra", "Edward", "Donna", "Paul", "Carol", "Frank", "Ruth",
    "Larry", "Sharon", "Raymond", "Michelle", "Gregory", "Laura", "Joshua", "Sarah",
    "Dennis", "Kimberly", "Jerry", "Deborah", "Jose", "Jessica", "Matthew", "Shirley",
    "Gary", "Cynthia", "Timothy", "Angela", "Nicholas", "Melissa", "Ronald", "Brenda"
  ];

  const lastNames = [
    "Williams", "Martinez", "Thompson", "Anderson", "Brown", "Davis", "Wilson", "Garcia",
    "Lee", "Taylor", "Moore", "Jackson", "Rodriguez", "Walker", "Hall", "Lewis",
    "Young", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams",
    "Baker", "Nelson", "Carter", "Mitchell", "Perez", "Roberts", "Turner", "Phillips",
    "Campbell", "Parker", "Evans", "Edwards", "Collins", "Stewart", "Sanchez", "Morris",
    "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera",
    "Cooper", "Richardson", "Cox", "Howard", "Ward", "Torres", "Peterson", "Gray",
    "Ramirez", "James", "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett"
  ];

  const owners = [];

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const ownerNumber = i + 1; // Start from 1, not 0

    owners.push({
      name: `${firstName} ${lastName}`,
      email: `sean+owner${ownerNumber}@rysemarket.com`,
      phone: `(555) ${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`
    });
  }

  return owners;
}

// Property types distribution
const propertyTypes = ["single_family", "condo", "townhouse", "multi_family", "apartment"] as const;
type PropertyType = typeof propertyTypes[number];

// Amenities pool
const amenitiesPool = [
  "Central AC", "Garage", "Pool", "Hardwood Floors", "Granite Countertops",
  "Stainless Steel Appliances", "Walk-in Closet", "Fireplace", "Patio/Deck",
  "Storage Unit", "In-unit Laundry", "Pet Friendly", "Fenced Yard", "Updated Kitchen"
];

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomAmenities(): string[] {
  const count = getRandomNumber(3, 7);
  const shuffled = [...amenitiesPool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePropertyData(address: any, index: number) {
  const propertyType: PropertyType = getRandomElement(propertyTypes);
  const bedrooms = getRandomNumber(2, 5);
  const bathrooms = getRandomNumber(1, 3) + (Math.random() > 0.5 ? 0.5 : 0);
  const squareFeet = getRandomNumber(1200, 3500);
  const yearBuilt = getRandomNumber(1960, 2020);
  const estimatedValue = getRandomNumber(250000, 850000);
  const monthlyRent = Math.round(estimatedValue * 0.006); // ~0.6% of value

  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;

  // Generate Google Maps image URLs
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const streetViewUrl = apiKey ? `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${encodeURIComponent(fullAddress)}&key=${apiKey}&fov=90&pitch=10` : null;
  const satelliteUrl = apiKey ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(fullAddress)}&zoom=19&size=640x480&maptype=satellite&key=${apiKey}` : null;

  // Randomly assign status - 90% accepted, 5% under_review, 5% rejected
  const statusRandom = Math.random();
  let status: "accepted" | "under_review" | "rejected";
  let rejectionReason = undefined;
  let rejectionNotes = undefined;

  if (statusRandom < 0.9) {
    status = "accepted"; // 90% accepted
  } else if (statusRandom < 0.95) {
    status = "under_review"; // 5% under review
  } else {
    status = "rejected"; // 5% rejected
    // Add random rejection reason
    const reasons = ["no_lease", "lease_ending_soon", "incomplete_documents", "property_condition", "other"];
    rejectionReason = getRandomElement(reasons) as any;
    rejectionNotes = rejectionReason === "lease_ending_soon" ? "Lease expires in less than 3 months" :
                    rejectionReason === "no_lease" ? "No valid lease agreement provided" :
                    rejectionReason === "incomplete_documents" ? "Missing required documentation" :
                    rejectionReason === "property_condition" ? "Property requires significant repairs" :
                    "Does not meet underwriting criteria";
  }

  return {
    propertyName: `${address.street} Property`,
    propertyType,
    address: {
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: "United States",
      fullAddress,
    },
    bedrooms,
    bathrooms,
    squareFeet,
    yearBuilt,
    estimatedValue,
    purchasePrice: Math.round(estimatedValue * 0.85),
    purchaseDate: Date.now() - (getRandomNumber(365, 1825) * 24 * 60 * 60 * 1000), // 1-5 years ago
    monthlyRent,
    securityDeposit: monthlyRent,
    leaseStartDate: Date.now() - (getRandomNumber(30, 365) * 24 * 60 * 60 * 1000),
    leaseEndDate: Date.now() + (getRandomNumber(90, 365) * 24 * 60 * 60 * 1000), // At least 3 months remaining
    amenities: getRandomAmenities(),
    lastMaintenanceDate: Date.now() - (getRandomNumber(30, 90) * 24 * 60 * 60 * 1000),
    nextMaintenanceDate: Date.now() + (getRandomNumber(30, 90) * 24 * 60 * 60 * 1000),
    images: apiKey ? {
      streetView: streetViewUrl || undefined,
      satellite: satelliteUrl || undefined,
      primary: (streetViewUrl || satelliteUrl) || undefined, // Use street view as primary, fallback to satellite
      gallery: [], // Empty initially, can be populated later
    } : undefined,
    occupancyStatus: "occupied" as const,
    status,
    rejectionReason,
    rejectionNotes,
    syncedFromIntegration: true,
    integrationId: `PROP-${Date.now()}-${index}`,
  };
}

export const syncProperties = mutation({
  args: {
    propertyManagerId: v.id("propertyManagers"),
  },
  handler: async (ctx, args) => {
    const propertyManager = await ctx.db.get(args.propertyManagerId);
    if (!propertyManager) {
      throw new Error("Property manager not found");
    }

    // Generate 500 property addresses and 50 owners
    const propertyAddresses = generateAddresses(500);
    const ownerNames = generateOwners(50);

    // Get or create owners (group properties by owner)
    const ownersMap = new Map<string, Id<"owners">>();
    const propertiesPerOwner = Math.ceil(500 / 50); // ~10 properties per owner

    // Create or get owners
    for (let i = 0; i < ownerNames.length; i++) {
      const ownerData = ownerNames[i];

      // Check if owner already exists
      const existingOwner = await ctx.db
        .query("owners")
        .withIndex("by_email", (q) => q.eq("email", ownerData.email))
        .first();

      if (existingOwner) {
        ownersMap.set(ownerData.email, existingOwner._id);
      } else {
        const ownerId = await ctx.db.insert("owners", {
          name: ownerData.name,
          email: ownerData.email,
          phone: ownerData.phone,
          propertyManagerId: args.propertyManagerId,
          createdAt: Date.now(),
        });
        ownersMap.set(ownerData.email, ownerId);
      }
    }

    const ownerIds = Array.from(ownersMap.values());
    const createdProperties: Id<"properties">[] = [];

    // Create properties and randomly distribute among owners
    for (let i = 0; i < propertyAddresses.length; i++) {
      const address = propertyAddresses[i];
      // Randomly select an owner for each property
      const ownerIndex = Math.floor(Math.random() * ownerIds.length);
      const ownerId = ownerIds[ownerIndex];

      const propertyData = generatePropertyData(address, i);

      const propertyId = await ctx.db.insert("properties", {
        ...propertyData,
        ownerId,
        propertyManagerId: args.propertyManagerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      createdProperties.push(propertyId);
    }

    // Update property manager's integration sync status
    await ctx.db.patch(args.propertyManagerId, {
      integrationSynced: {
        ...propertyManager.integrationSynced!,
        enabled: true,
        lastSyncedAt: Date.now(),
      },
    });

    return {
      propertiesCreated: createdProperties.length,
      ownersCreated: ownersMap.size,
    };
  },
});