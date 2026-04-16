'use client';

import { useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';
import Link from 'next/link';
import { BackLink, FieldLabel, PhotoPanel } from '@/components/admin/event-management/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EVENT_MANAGEMENT_PATHS, type VenueRecord } from '@/constants/event-management';

const amenityOptions = ['Dockside terrace', 'LED wall package', 'Vendor power drops', 'Control booth', 'Workshop benches', 'Private arrival gate'];

export function VenueForm({ mode, venue }: { mode: 'create' | 'edit'; venue?: VenueRecord }) {
  const [name, setName] = useState(venue?.name ?? '');
  const [neighborhood, setNeighborhood] = useState(venue?.neighborhood ?? '');
  const [city, setCity] = useState(venue?.city ?? 'Singapore');
  const [capacity, setCapacity] = useState(String(venue?.capacity ?? 240));
  const [summary, setSummary] = useState(venue?.summary ?? '');
  const [description, setDescription] = useState(venue?.description ?? '');
  const [venueType, setVenueType] = useState(venue?.venueType ?? 'Community Hall');
  const [setting, setSetting] = useState<VenueRecord['setting']>(venue?.setting ?? 'Indoor');
  const [status, setStatus] = useState<VenueRecord['status']>(venue?.status ?? 'Active');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(venue?.amenities ?? amenityOptions.slice(0, 3));
  const previewPhoto = venue?.photo ?? 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80';

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((current) => (current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={EVENT_MANAGEMENT_PATHS.venues} label="Back to venues" />
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase">
          UI preview only
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-5">
            <CardTitle>{mode === 'create' ? 'Add venue' : `Edit ${venue?.name ?? 'venue'}`}</CardTitle>
            <CardDescription>
              This page is intentionally UI-only. Inputs are interactive for design review, but nothing is sent to an API yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="venue-name">Venue name</FieldLabel>
                  <Input id="venue-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Riverfront Pavilion" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="venue-type">Venue type</FieldLabel>
                  <Input id="venue-type" value={venueType} onChange={(event) => setVenueType(event.target.value)} placeholder="Waterfront Hall" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="venue-neighborhood">Neighborhood</FieldLabel>
                  <Input id="venue-neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Quayside District" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="venue-city">City</FieldLabel>
                  <Input id="venue-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Singapore" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="venue-capacity">Capacity</FieldLabel>
                  <Input id="venue-capacity" value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="240" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="venue-setting">Setting</FieldLabel>
                  <Select value={setting} onValueChange={(value) => setSetting(value as VenueRecord['setting'])}>
                    <SelectTrigger id="venue-setting">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indoor">Indoor</SelectItem>
                      <SelectItem value="Outdoor">Outdoor</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="venue-status">Status</FieldLabel>
                  <Select value={status} onValueChange={(value) => setStatus(value as VenueRecord['status'])}>
                    <SelectTrigger id="venue-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Seasonal">Seasonal</SelectItem>
                      <SelectItem value="Private Hold">Private Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="venue-summary">Card summary</FieldLabel>
                <Textarea
                  id="venue-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="A concise preview line for venue cards and listing surfaces."
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="venue-description">Full description</FieldLabel>
                <Textarea
                  id="venue-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe why this space matters operationally and what it is best suited for."
                  className="min-h-32"
                />
              </div>

              <div className="space-y-3">
                <FieldLabel>Amenities</FieldLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  {amenityOptions.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                      <Checkbox checked={selectedAmenities.includes(amenity)} onCheckedChange={() => toggleAmenity(amenity)} />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit">
                  <Save className="size-4" />
                  {mode === 'create' ? 'Save venue draft' : 'Save venue changes'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={EVENT_MANAGEMENT_PATHS.venues}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <PhotoPanel photo={previewPhoto} tone="venue" className="min-h-[280px]">
            <div className="flex min-h-[280px] flex-col justify-between p-6">
              <Badge variant="secondary" className="w-fit bg-white/85 text-neutral-900">
                Preview card
              </Badge>
              <div className="space-y-2">
                <p className="text-xs tracking-[0.18em] text-white/75 uppercase">{neighborhood || 'Neighborhood'}</p>
                <h2 className="text-3xl font-semibold tracking-tight text-white">{name || 'Untitled venue'}</h2>
                <p className="max-w-xl text-sm leading-6 text-white/85">{summary || 'Your venue summary will appear here as you edit the form.'}</p>
              </div>
            </div>
          </PhotoPanel>

          <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
            <CardHeader className="border-b border-neutral-200/80 pb-4">
              <CardTitle>Preview notes</CardTitle>
              <CardDescription>This side panel helps review the visual tone before API work begins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm leading-6 text-neutral-600">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="font-medium text-neutral-950">Selected amenities</p>
                <p className="mt-1">{selectedAmenities.length > 0 ? selectedAmenities.join(', ') : 'No amenities selected yet.'}</p>
              </div>
              <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-4 text-neutral-500">
                <div className="flex items-center gap-2">
                  <ImagePlus className="size-4" />
                  Photo upload is intentionally mocked for this design-only pass.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
