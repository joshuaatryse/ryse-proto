"use client";

import React, { useRef, useEffect, useState } from "react";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

interface GooglePlacesAutocompleteProps {
  onAddressSelect: (address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fullAddress: string;
  }) => void;
  value?: string;
  placeholder?: string;
  label?: string;
  isRequired?: boolean;
  className?: string;
}

export default function GooglePlacesAutocomplete({
  onAddressSelect,
  value = "",
  placeholder = "Enter your company address",
  label = "Company Address",
  isRequired = true,
  className,
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  useEffect(() => {
    if (isLoaded) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const map = new google.maps.Map(document.createElement('div'));
      placesService.current = new google.maps.places.PlacesService(map);
    }
  }, [isLoaded]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = async (input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      return;
    }

    try {
      const response = await autocompleteService.current.getPlacePredictions({
        input,
        componentRestrictions: { country: "us" },
        types: ["address"],
      });

      setPredictions(response.predictions || []);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    fetchPredictions(value);
  };

  const selectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService.current) return;

    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const addressComponents = place.address_components || [];
          let street = "";
          let city = "";
          let state = "";
          let zipCode = "";
          let country = "";

          addressComponents.forEach((component) => {
            const types = component.types;
            if (types.includes("street_number")) {
              street = component.long_name + " " + street;
            } else if (types.includes("route")) {
              street = street + component.long_name;
            } else if (types.includes("locality")) {
              city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state = component.short_name;
            } else if (types.includes("postal_code")) {
              zipCode = component.long_name;
            } else if (types.includes("country")) {
              country = component.short_name;
            }
          });

          street = street.trim();
          const fullAddress = place.formatted_address || "";

          setInputValue(fullAddress);
          setShowDropdown(false);
          setPredictions([]);

          onAddressSelect({
            street,
            city,
            state,
            zipCode,
            country,
            fullAddress,
          });
        }
      }
    );
  };

  if (loadError) {
    return (
      <Input
        className={className}
        classNames={{
          inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
        }}
        errorMessage="Failed to load address autocomplete"
        isRequired={isRequired}
        label={label}
        labelPlacement="inside"
        value={inputValue}
        variant="bordered"
        onChange={(e) => setInputValue(e.target.value)}
      />
    );
  }

  if (!isLoaded) {
    return (
      <Input
        isDisabled
        className={className}
        classNames={{
          inputWrapper: "border-1 border-neutral-03",
        }}
        isRequired={isRequired}
        label={label}
        labelPlacement="inside"
        value=""
        variant="bordered"
      />
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <Input
        ref={inputRef}
        classNames={{
          inputWrapper: "border-1 border-neutral-03 hover:border-primary-06 focus-within:border-primary-06",
        }}
        isRequired={isRequired}
        label={label}
        labelPlacement="inside"
        placeholder={placeholder}
        value={inputValue}
        variant="bordered"
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 3 && predictions.length > 0 && setShowDropdown(true)}
      />

      {showDropdown && predictions.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full shadow-lg border-1 border-neutral-02">
          <CardBody className="p-0">
            <Listbox
              aria-label="Address suggestions"
              className="p-0"
              itemClasses={{
                base: [
                  "px-3 py-2",
                  "text-default-500",
                  "transition-colors",
                  "hover:bg-default-100",
                  "hover:text-default-900",
                  "cursor-pointer",
                ],
              }}
              selectionMode="none"
            >
              {predictions.map((prediction) => (
                <ListboxItem
                  key={prediction.place_id}
                  textValue={prediction.description}
                  onPress={() => selectPrediction(prediction)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <MapPinIcon className="w-4 h-4 text-neutral-05 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {prediction.structured_formatting?.main_text}
                      </span>
                      <span className="text-xs text-neutral-05">
                        {prediction.structured_formatting?.secondary_text}
                      </span>
                    </div>
                  </div>
                </ListboxItem>
              ))}
            </Listbox>
          </CardBody>
        </Card>
      )}
    </div>
  );
}