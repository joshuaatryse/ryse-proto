"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";

// Global flag to track if Google Maps is loading
declare global {
  interface Window {
    googleMapsLoading?: boolean;
    googleMapsCallbacks?: (() => void)[];
  }
}

interface StreetViewProps {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  className?: string;
  fallbackImage?: string;
  onError?: () => void;
}

export default function StreetView({
  address,
  className = "",
  fallbackImage,
  onError,
}: StreetViewProps) {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [heading, setHeading] = useState(0);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    // Check if Google Maps API key is configured
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'your_api_key_here') {
      console.warn('Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file');
      setIsLoading(false);
      setHasError(true);
      return;
    }

    // Initialize callbacks array if it doesn't exist
    if (!window.googleMapsCallbacks) {
      window.googleMapsCallbacks = [];
    }

    if (window.google && window.google.maps) {
      // API already loaded
      initStreetView();
    } else if (window.googleMapsLoading) {
      // API is currently loading, add callback
      window.googleMapsCallbacks.push(initStreetView);
    } else {
      // Check if script already exists
      const existingScript = document.getElementById("google-maps-script");

      if (!existingScript) {
        // Load Google Maps API for the first time
        window.googleMapsLoading = true;
        const script = document.createElement("script");

        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.id = "google-maps-script";

        script.onload = () => {
          window.googleMapsLoading = false;
          initStreetView();

          // Call all pending callbacks
          if (window.googleMapsCallbacks) {
            window.googleMapsCallbacks.forEach((callback) => callback());
            window.googleMapsCallbacks = [];
          }
        };

        script.onerror = () => {
          window.googleMapsLoading = false;
          setIsLoading(false);
          setHasError(true);
          if (onError) onError();
        };

        document.head.appendChild(script);
      } else {
        // Script exists, wait for it to load
        if (window.google && window.google.maps) {
          initStreetView();
        } else {
          window.googleMapsCallbacks.push(initStreetView);
        }
      }
    }

    function initStreetView() {
      if (!streetViewRef.current) return;

      const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;

      // Create a geocoder to get coordinates from address
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;

          // Create Street View service to check availability
          const streetViewService = new google.maps.StreetViewService();

          // Check if Street View is available within 50 meters
          streetViewService.getPanorama(
            {
              location: location,
              radius: 50,
              source: google.maps.StreetViewSource.OUTDOOR,
            },
            (data, status) => {
              if (
                status === "OK" &&
                data &&
                data.location &&
                streetViewRef.current
              ) {
                // Initialize Street View
                panoramaRef.current = new google.maps.StreetViewPanorama(
                  streetViewRef.current,
                  {
                    position: data.location.latLng ?? location,
                    pov: {
                      heading: calculateHeading(
                        data.location.latLng ?? location,
                        location,
                      ),
                      pitch: 0,
                    },
                    zoom: 1,
                    addressControl: false,
                    linksControl: false, // Hide default navigation
                    panControl: false, // Hide default pan control
                    enableCloseButton: false,
                    fullscreenControl: false,
                    zoomControl: false, // Hide default zoom - we'll use custom
                    motionTracking: false,
                    motionTrackingControl: false,
                    showRoadLabels: true,
                    disableDefaultUI: false, // Keep some UI but customize what we show
                  },
                );

                // Add zoom change listener
                panoramaRef.current.addListener("zoom_changed", () => {
                  if (panoramaRef.current) {
                    setZoomLevel(panoramaRef.current.getZoom());
                  }
                });

                // Add heading change listener for compass
                panoramaRef.current.addListener("pov_changed", () => {
                  if (panoramaRef.current) {
                    const pov = panoramaRef.current.getPov();
                    setHeading(pov.heading);
                  }
                });

                // Set initial heading
                if (data.location.latLng && location) {
                  setHeading(calculateHeading(data.location.latLng, location));
                }
                setIsLoading(false);
                setHasError(false);
              } else {
                // Street View not available
                setIsLoading(false);
                setHasError(true);
                if (onError) onError();
              }
            },
          );
        } else {
          // Geocoding failed
          setIsLoading(false);
          setHasError(true);
          if (onError) onError();
        }
      });
    }

    // Calculate heading to point Street View towards the property
    function calculateHeading(
      panoPosition: google.maps.LatLng,
      propertyPosition: google.maps.LatLng,
    ) {
      const lat1 = (panoPosition.lat() * Math.PI) / 180;
      const lat2 = (propertyPosition.lat() * Math.PI) / 180;
      const lng1 = (panoPosition.lng() * Math.PI) / 180;
      const lng2 = (propertyPosition.lng() * Math.PI) / 180;

      const dLng = lng2 - lng1;

      const x = Math.sin(dLng) * Math.cos(lat2);
      const y =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

      let heading = (Math.atan2(x, y) * 180) / Math.PI;
      heading = (heading + 360) % 360;

      return heading;
    }

    // Cleanup function
    return () => {
      if (panoramaRef.current) {
        panoramaRef.current = null;
      }

      // Remove callback from pending callbacks if it exists
      if (window.googleMapsCallbacks) {
        const index = window.googleMapsCallbacks.indexOf(initStreetView);
        if (index > -1) {
          window.googleMapsCallbacks.splice(index, 1);
        }
      }
    };
  }, [address, onError]);

  // Get compass direction from heading
  const getCompassDirection = (heading: number) => {
    const normalized = ((heading % 360) + 360) % 360;

    if (normalized >= 337.5 || normalized < 22.5) return "N";
    if (normalized >= 22.5 && normalized < 67.5) return "NE";
    if (normalized >= 67.5 && normalized < 112.5) return "E";
    if (normalized >= 112.5 && normalized < 157.5) return "SE";
    if (normalized >= 157.5 && normalized < 202.5) return "S";
    if (normalized >= 202.5 && normalized < 247.5) return "SW";
    if (normalized >= 247.5 && normalized < 292.5) return "W";
    if (normalized >= 292.5 && normalized < 337.5) return "NW";

    return "N";
  };

  // Custom control handlers
  const handleZoomIn = () => {
    if (panoramaRef.current) {
      const currentZoom = panoramaRef.current.getZoom();
      panoramaRef.current.setZoom(Math.min(currentZoom + 1, 3));
    }
  };

  const handleZoomOut = () => {
    if (panoramaRef.current) {
      const currentZoom = panoramaRef.current.getZoom();
      panoramaRef.current.setZoom(Math.max(currentZoom - 1, 0));
    }
  };

  const handlePanLeft = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({
        heading: pov.heading - 30,
        pitch: pov.pitch,
      });
    }
  };

  const handlePanRight = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({
        heading: pov.heading + 30,
        pitch: pov.pitch,
      });
    }
  };

  const handlePanUp = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({
        heading: pov.heading,
        pitch: Math.min(pov.pitch + 10, 90),
      });
    }
  };

  const handlePanDown = () => {
    if (panoramaRef.current) {
      const pov = panoramaRef.current.getPov();
      panoramaRef.current.setPov({
        heading: pov.heading,
        pitch: Math.max(pov.pitch - 10, -90),
      });
    }
  };

  if (hasError && fallbackImage) {
    return (
      <div className={`relative w-full h-[500px] rounded-xl overflow-hidden ${className}`}>
        <Image
          fill
          alt={`${address.street} - Property view`}
          src={fallbackImage}
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  if (hasError && !fallbackImage) {
    return (
      <div className={`relative w-full h-[500px] rounded-xl bg-neutral-01 flex items-center justify-center border border-neutral-02 ${className}`}>
        <div className="text-center max-w-md px-4">
          <Icon icon="solar:streets-map-point-bold" className="w-16 h-16 text-neutral-04 mb-4 mx-auto" />
          <h3 className="text-lg font-semibold text-neutral-07 mb-2">Street View Unavailable</h3>
          <p className="text-sm text-neutral-06 mb-4">
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'your_api_key_here'
              ? "Google Maps API key not configured. Please check the setup instructions."
              : "Unable to load street view for this location. This could be due to API configuration or the location may not have street view coverage."}
          </p>
          {(!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'your_api_key_here') && (
            <p className="text-xs text-neutral-05">
              See GOOGLE_MAPS_SETUP.md for configuration instructions
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[500px] rounded-xl overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-01 z-10">
          <div className="text-center">
            <Spinner color="primary" size="lg" />
            <p className="mt-4 text-neutral-06">Loading street view...</p>
          </div>
        </div>
      )}

      {/* Street View Container */}
      <div
        ref={streetViewRef}
        className="w-full h-full"
        style={{ display: isLoading ? "none" : "block" }}
      />

      {/* Custom Controls */}
      {!isLoading && !hasError && (
        <>
          {/* Navigation Controls */}
          <div className="absolute bottom-8 left-8 bg-white/20 backdrop-blur-md rounded-2xl p-2 shadow-xl border border-white/30 z-10">
            <div className="relative w-32 h-32">
              {/* Up */}
              <Button
                isIconOnly
                className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/30 hover:bg-white/50 border border-white/20 backdrop-blur-sm transition-all"
                size="sm"
                onPress={handlePanUp}
              >
                <Icon
                  className="w-4 h-4 text-white drop-shadow"
                  icon="solar:arrow-up-bold"
                />
              </Button>

              {/* Right */}
              <Button
                isIconOnly
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 border border-white/20 backdrop-blur-sm transition-all"
                size="sm"
                onPress={handlePanRight}
              >
                <Icon
                  className="w-4 h-4 text-white drop-shadow"
                  icon="solar:arrow-right-bold"
                />
              </Button>

              {/* Down */}
              <Button
                isIconOnly
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/30 hover:bg-white/50 border border-white/20 backdrop-blur-sm transition-all"
                size="sm"
                onPress={handlePanDown}
              >
                <Icon
                  className="w-4 h-4 text-white drop-shadow"
                  icon="solar:arrow-down-bold"
                />
              </Button>

              {/* Left */}
              <Button
                isIconOnly
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 border border-white/20 backdrop-blur-sm transition-all"
                size="sm"
                onPress={handlePanLeft}
              >
                <Icon
                  className="w-4 h-4 text-white drop-shadow"
                  icon="solar:arrow-left-bold"
                />
              </Button>

              {/* Center compass with direction */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/40 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                {/* Direction text in center */}
                <span className="text-[10px] font-bold text-white drop-shadow z-10">
                  {getCompassDirection(heading)}
                </span>
                {/* Rotating arrow indicator */}
                <div
                  className="absolute inset-0 flex items-start justify-center pt-0.5 transition-transform duration-300"
                  style={{ transform: `rotate(${heading}deg)` }}
                >
                  <Icon
                    className="w-3 h-3 text-white/70 drop-shadow"
                    icon="solar:arrow-up-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-md rounded-xl p-2 shadow-xl border border-white/30 flex flex-col items-center gap-2 z-10">
            <Button
              isIconOnly
              className="bg-white/30 hover:bg-white/50 border border-white/20 backdrop-blur-sm transition-all"
              isDisabled={zoomLevel >= 3}
              size="sm"
              onPress={handleZoomIn}
            >
              <Icon
                className="w-5 h-5 text-white drop-shadow"
                icon="solar:add-circle-bold"
              />
            </Button>

            <div className="h-16 relative flex items-center justify-center">
              {/* Background line */}
              <div className="absolute h-full w-0.5 bg-white/30" />
              {/* Zoom indicator dot */}
              <div
                className="absolute w-3 h-3 bg-white/80 rounded-full transition-all duration-200 shadow-lg border border-white/40"
                style={{
                  bottom: `calc(${(zoomLevel / 3) * 100}% - 6px)`,
                }}
              />
            </div>

            <Button
              isIconOnly
              className="bg-white/30 hover:bg-white/50 border border-white/20 backdrop-blur-sm transition-all"
              isDisabled={zoomLevel <= 0}
              size="sm"
              onPress={handleZoomOut}
            >
              <Icon
                className="w-5 h-5 text-white drop-shadow"
                icon="solar:minus-circle-bold"
              />
            </Button>
          </div>

          {/* Address Display */}
          <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg shadow-xl border border-white/30 z-10">
            <p className="text-sm font-medium text-white drop-shadow-sm">
              {address.street}
            </p>
            <p className="text-xs text-white/80 drop-shadow-sm">
              {address.city}, {address.state} {address.zipCode}
            </p>
          </div>
        </>
      )}
    </div>
  );
}