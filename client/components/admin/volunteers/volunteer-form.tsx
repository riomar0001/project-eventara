'use client';

import { useState } from 'react';
import { Save, UserRoundPlus } from 'lucide-react';
import Link from 'next/link';
import { BackLink, FieldLabel } from '@/components/admin/event-management/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EVENT_MANAGEMENT_PATHS, getVolunteerInitials, type VolunteerRecord } from '@/constants/event-management';

const skillOptions = ['Wayfinding', 'Registration', 'VIP desk', 'Backstage', 'Accessibility escort', 'Vendor check-in', 'Radio comms', 'Hospitality'];

export function VolunteerForm({ mode, volunteer }: { mode: 'create' | 'edit'; volunteer?: VolunteerRecord }) {
  const [name, setName] = useState(volunteer?.name ?? '');
  const [email, setEmail] = useState(volunteer?.email ?? '');
  const [phone, setPhone] = useState(volunteer?.phone ?? '');
  const [city, setCity] = useState(volunteer?.city ?? '');
  const [primaryRole, setPrimaryRole] = useState(volunteer?.primaryRole ?? '');
  const [status, setStatus] = useState<VolunteerRecord['status']>(volunteer?.status ?? 'Training');
  const [availability, setAvailability] = useState<VolunteerRecord['availability']>(volunteer?.availability ?? 'Flexible');
  const [shiftPreference, setShiftPreference] = useState<VolunteerRecord['shiftPreference']>(volunteer?.shiftPreference ?? 'Anywhere');
  const [bio, setBio] = useState(volunteer?.bio ?? '');
  const [skills, setSkills] = useState<string[]>(volunteer?.skills ?? skillOptions.slice(0, 3));

  function toggleSkill(skill: string) {
    setSkills((current) => (current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BackLink href={EVENT_MANAGEMENT_PATHS.volunteers} label="Back to volunteers" />
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs tracking-[0.18em] uppercase">
          UI preview only
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
          <CardHeader className="border-b border-neutral-200/80 pb-5">
            <CardTitle>{mode === 'create' ? 'Add volunteer' : `Edit ${volunteer?.name ?? 'volunteer'}`}</CardTitle>
            <CardDescription>This design pass uses local-only form state so the UI can be reviewed before integrations are added.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-name">Name</FieldLabel>
                  <Input id="volunteer-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Maya Chen" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-role">Primary role</FieldLabel>
                  <Input id="volunteer-role" value={primaryRole} onChange={(event) => setPrimaryRole(event.target.value)} placeholder="Guest Experience Lead" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-email">Email</FieldLabel>
                  <Input id="volunteer-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="maya.chen@eventara.local" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-phone">Phone</FieldLabel>
                  <Input id="volunteer-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+65 8800 0000" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-city">City</FieldLabel>
                  <Input id="volunteer-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Singapore" />
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-status">Status</FieldLabel>
                  <Select value={status} onValueChange={(value) => setStatus(value as VolunteerRecord['status'])}>
                    <SelectTrigger id="volunteer-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-availability">Availability</FieldLabel>
                  <Select value={availability} onValueChange={(value) => setAvailability(value as VolunteerRecord['availability'])}>
                    <SelectTrigger id="volunteer-availability">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weeknights">Weeknights</SelectItem>
                      <SelectItem value="Weekends">Weekends</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="volunteer-shift">Shift preference</FieldLabel>
                  <Select value={shiftPreference} onValueChange={(value) => setShiftPreference(value as VolunteerRecord['shiftPreference'])}>
                    <SelectTrigger id="volunteer-shift">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front of House">Front of House</SelectItem>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Community Desk">Community Desk</SelectItem>
                      <SelectItem value="Anywhere">Anywhere</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="volunteer-bio">Bio</FieldLabel>
                <Textarea
                  id="volunteer-bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="min-h-32"
                  placeholder="Outline the volunteer's strengths, event fit, and preferred working style."
                />
              </div>

              <div className="space-y-3">
                <FieldLabel>Skills</FieldLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  {skillOptions.map((skill) => (
                    <label key={skill} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                      <Checkbox checked={skills.includes(skill)} onCheckedChange={() => toggleSkill(skill)} />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit">
                  <Save className="size-4" />
                  {mode === 'create' ? 'Save volunteer draft' : 'Save volunteer changes'}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={EVENT_MANAGEMENT_PATHS.volunteers}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-0 bg-linear-to-br from-emerald-50 via-white to-lime-50 shadow-none ring-1 ring-neutral-200">
            <CardContent className="py-8">
              <div className="flex items-center gap-4">
                <Avatar className="size-18">
                  <AvatarImage src={volunteer?.photo} alt={name} />
                  <AvatarFallback>{getVolunteerInitials(name || 'Volunteer Preview')}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      {status}
                    </Badge>
                    <Badge variant="secondary" className="bg-white text-neutral-700">
                      {availability}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">{name || 'Volunteer preview'}</h2>
                    <p className="text-sm text-neutral-500">
                      {primaryRole || 'Primary role'} • {shiftPreference}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-none ring-1 ring-neutral-200">
            <CardHeader className="border-b border-neutral-200/80 pb-4">
              <CardTitle>Preview notes</CardTitle>
              <CardDescription>UI-only helper panel for the volunteer form.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm leading-6 text-neutral-600">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <p className="font-medium text-neutral-950">Selected skills</p>
                <p className="mt-1">{skills.length > 0 ? skills.join(', ') : 'No skills selected yet.'}</p>
              </div>
              <div className="rounded-2xl border border-dashed border-neutral-200 px-4 py-4 text-neutral-500">
                <div className="flex items-center gap-2">
                  <UserRoundPlus className="size-4" />
                  Profile creation, assignment logic, and save actions are intentionally not integrated yet.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
