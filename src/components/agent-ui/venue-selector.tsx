"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Search, Check, X, Building2, Navigation } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { VenueSelectorProps, VenueValue, VenueSuggestion } from "./types";

// debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface VenueCardProps {
  venue: VenueSuggestion;
  isSelected: boolean;
  onSelect: () => void;
}

function VenueCard({ venue, isSelected, onSelect }: VenueCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-primary ring-1"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
      )}
    >
      <div className="flex gap-3">
        {venue.photo ? (
          <img
            src={venue.photo}
            alt={venue.name}
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="bg-muted flex h-12 w-12 shrink-0 items-center justify-center rounded-md">
            <Building2 className="text-muted-foreground h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-medium">{venue.name}</h4>
            {isSelected && <Check className="text-primary h-4 w-4 shrink-0" />}
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {venue.address}
          </p>
          {(venue.type || venue.rating) && (
            <div className="mt-1 flex items-center gap-2">
              {venue.type && (
                <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                  {venue.type}
                </span>
              )}
              {venue.rating && (
                <span className="text-muted-foreground text-xs">
                  ★ {venue.rating.toFixed(1)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function AgentVenueSelector({
  id,
  title,
  description,
  required,
  defaultValue,
  suggestions = [],
  allowCustom = true,
  placeholder,
  region,
  onSubmit,
  onCancel,
}: VenueSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState<VenueValue | null>(
    defaultValue || null,
  );
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<VenueSuggestion[]>([]);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // filter suggestions based on search query
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const query = debouncedQuery.toLowerCase();

    // filter from provided suggestions
    const filtered = suggestions.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query),
    );

    setSearchResults(filtered);
    setIsSearching(false);
  }, [debouncedQuery, suggestions]);

  const handleSelectSuggestion = useCallback((venue: VenueSuggestion) => {
    setSelectedVenue({
      name: venue.name,
      address: venue.address,
      placeId: venue.id,
    });
    setSearchQuery("");
    setCustomMode(false);
  }, []);

  const handleCustomSubmit = useCallback(() => {
    if (customName.trim() && customAddress.trim()) {
      setSelectedVenue({
        name: customName.trim(),
        address: customAddress.trim(),
      });
      setCustomMode(false);
    }
  }, [customName, customAddress]);

  const handleSubmit = useCallback(() => {
    if (selectedVenue) {
      onSubmit(selectedVenue);
    }
  }, [selectedVenue, onSubmit]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedVenue({
          name: "Current Location",
          address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
    );
  }, []);

  const displayVenues =
    searchQuery.trim() && searchResults.length > 0
      ? searchResults
      : suggestions.slice(0, 5);

  return (
    <div className="bg-muted/30 border-border/50 w-full space-y-3 rounded-lg border p-3">
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="text-primary h-4 w-4" />
              {title}
              {required && <span className="text-destructive">*</span>}
            </h4>
          )}
          {description && (
            <p className="text-muted-foreground text-xs">{description}</p>
          )}
        </div>
      )}

      {/* selected venue display */}
      {selectedVenue && !customMode && (
        <div className="border-primary bg-primary/5 rounded-lg border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex gap-2">
              <MapPin className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">{selectedVenue.name}</p>
                <p className="text-muted-foreground text-xs">
                  {selectedVenue.address}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setSelectedVenue(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* search input */}
      {!selectedVenue && !customMode && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder || "Search for a venue..."}
              className="pl-9"
            />
          </div>

          {/* use current location */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleUseCurrentLocation}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Use current location
          </Button>

          {/* suggestions list */}
          {displayVenues.length > 0 && (
            <ScrollArea className="max-h-48">
              <div className="space-y-2">
                {displayVenues.map((venue) => (
                  <VenueCard
                    key={venue.id}
                    venue={venue}
                    isSelected={false}
                    onSelect={() => handleSelectSuggestion(venue)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* no results message */}
          {searchQuery.trim() && !isSearching && searchResults.length === 0 && (
            <p className="text-muted-foreground py-2 text-center text-xs">
              No venues found matching "{searchQuery}"
            </p>
          )}

          {/* custom venue option */}
          {allowCustom && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full"
              onClick={() => setCustomMode(true)}
            >
              + Enter a custom location
            </Button>
          )}
        </div>
      )}

      {/* custom venue input */}
      {customMode && (
        <div className="space-y-3">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Venue name"
          />
          <Input
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            placeholder="Address"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleCustomSubmit}
              disabled={!customName.trim() || !customAddress.trim()}
              className="flex-1"
            >
              <Check className="mr-1 h-4 w-4" />
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCustomMode(false);
                setCustomName("");
                setCustomAddress("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* action buttons */}
      <div className="border-border/50 flex gap-2 border-t pt-2">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={required && !selectedVenue}
          className="flex-1"
        >
          <Check className="mr-1 h-4 w-4" />
          Confirm Location
        </Button>
        {onCancel && (
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default AgentVenueSelector;
