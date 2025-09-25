interface PropertyImages {
  streetView: string | null;
  satellite: string | null;
  primary: string | null;
}

// Note: You'll need to add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function getStreetViewImage(
  address: string,
): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not found");
    return null;
  }

  try {
    // First, check if Street View is available at this location
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const metadataResponse = await fetch(metadataUrl);
    const metadata = await metadataResponse.json();

    if (metadata.status !== "OK") {
      console.log("Street View not available for address:", address);
      return null;
    }

    // Generate Street View image URL with optimal settings for property display
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&fov=90&pitch=10`;

    return streetViewUrl;
  } catch (error) {
    console.error("Error fetching Street View image:", error);
    return null;
  }
}

export function getSatelliteImage(address: string): string | null {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not found");
    return null;
  }

  // Using Static Maps API for satellite view with property-focused zoom
  const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=19&size=640x480&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;

  return satelliteUrl;
}

export function getMapImage(address: string): string | null {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not found");
    return null;
  }

  // Standard map view with marker
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=15&size=640x480&maptype=roadmap&markers=color:red%7C${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

  return mapUrl;
}

export async function getPropertyImages(
  address: string,
): Promise<PropertyImages> {
  const images: PropertyImages = {
    streetView: null,
    satellite: null,
    primary: null,
  };

  // 1. Try Google Street View
  try {
    images.streetView = await getStreetViewImage(address);
    // Use street view as primary if available
    if (images.streetView) {
      images.primary = images.streetView;
    }
  } catch (error) {
    console.log("No street view available");
  }

  // 2. Get satellite view
  images.satellite = getSatelliteImage(address);

  // If no street view, use satellite as primary
  if (!images.primary && images.satellite) {
    images.primary = images.satellite;
  }

  return images;
}

// Server-side function to generate URLs without exposing API key
export function generateImageUrls(address: string) {
  // For server-side usage in Convex, generate URLs directly
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      streetView: null,
      satellite: null,
      primary: null,
    };
  }

  const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${encodeURIComponent(address)}&key=${apiKey}&fov=90&pitch=10`;
  const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=19&size=640x480&maptype=satellite&key=${apiKey}`;

  return {
    streetView: streetViewUrl,
    satellite: satelliteUrl,
    primary: streetViewUrl, // Default to street view as primary
  };
}