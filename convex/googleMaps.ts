import { action } from "./_generated/server";
import { v } from "convex/values";

// Action to generate Google Maps URLs with API key from environment
export const generatePropertyImageUrls = action({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    // Access environment variable in action (server-side only)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn("Google Maps API key not found in environment variables");
      return {
        streetView: null,
        satellite: null,
        primary: null,
      };
    }

    const encodedAddress = encodeURIComponent(args.address);

    // Generate URLs with API key
    const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=640x480&location=${encodedAddress}&key=${apiKey}&fov=90&pitch=10`;
    const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=19&size=640x480&maptype=satellite&key=${apiKey}`;

    // Check if street view is available (optional)
    try {
      const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodedAddress}&key=${apiKey}`;
      const response = await fetch(metadataUrl);
      const metadata = await response.json();

      if (metadata.status !== "OK") {
        console.log(`Street View not available for address: ${args.address}`);
        return {
          streetView: null,
          satellite: satelliteUrl,
          primary: satelliteUrl,
        };
      }
    } catch (error) {
      console.error("Error checking Street View availability:", error);
    }

    return {
      streetView: streetViewUrl,
      satellite: satelliteUrl,
      primary: streetViewUrl, // Default to street view as primary
    };
  },
});