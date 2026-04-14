'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { humanizeProfileValue } from '@/lib/auth-user';
import { type AuthUser, useAuthStore } from '@/store/auth-store';

const ageGroupOptions = ['child', 'teen', 'adult', 'senior'] as const;
const genderOptions = ['male', 'female'] as const;
const educationOptions = [
  'no_formal_education',
  'elementary_level',
  'elementary_graduate',
  'junior_high_school_level',
  'junior_high_school_graduate',
  'senior_high_school_level',
  'senior_high_school_graduate',
  'vocational_trade_certificate',
  'college_level_undergraduate',
  'associate_degree',
  'bachelors_degree',
  'masters_degree',
  'doctorate_degree'
] as const;

type ProfileFormState = {
  alias: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  gender: string;
  educationLevel: string;
  occupation: string;
  bio: string;
};

function getInitialForm(user: AuthUser | null): ProfileFormState {
  return {
    alias: user?.alias ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    ageGroup: user?.ageGroup ?? '',
    gender: user?.gender ?? '',
    educationLevel: user?.educationLevel ?? '',
    occupation: user?.occupation ?? '',
    bio: user?.bio ?? ''
  };
}

function ProfileForm({ initialForm, email, onSave }: { initialForm: ProfileFormState; email: string; onSave: (form: ProfileFormState) => void }) {
  const [form, setForm] = useState(initialForm);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input id="email" value={email} className="pl-9" readOnly />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="alias">
            Alias
          </label>
          <Input id="alias" value={form.alias} onChange={(event) => setForm((current) => ({ ...current, alias: event.target.value }))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="occupation">
            Occupation
          </label>
          <Input id="occupation" value={form.occupation} onChange={(event) => setForm((current) => ({ ...current, occupation: event.target.value }))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="first-name">
            First name
          </label>
          <Input id="first-name" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="last-name">
            Last name
          </label>
          <Input id="last-name" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Age group</label>
          <Select value={form.ageGroup} onValueChange={(value) => setForm((current) => ({ ...current, ageGroup: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select age group" />
            </SelectTrigger>
            <SelectContent>
              {ageGroupOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeProfileValue(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Gender</label>
          <Select value={form.gender} onValueChange={(value) => setForm((current) => ({ ...current, gender: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeProfileValue(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Education</label>
          <Select value={form.educationLevel} onValueChange={(value) => setForm((current) => ({ ...current, educationLevel: value }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select education" />
            </SelectTrigger>
            <SelectContent>
              {educationOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {humanizeProfileValue(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="bio">
            Bio
          </label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
            placeholder="Tell people a little about yourself"
            rows={5}
          />
        </div>
      </div>

      <Button type="submit">Save changes</Button>
    </form>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  function handleSave(form: ProfileFormState) {
    updateUser({
      alias: form.alias || undefined,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      ageGroup: form.ageGroup || undefined,
      gender: form.gender || undefined,
      educationLevel: form.educationLevel || undefined,
      occupation: form.occupation || undefined,
      bio: form.bio || undefined
    });

    toast.success('Profile updated.');
  }

  return <ProfileForm key={user?.id ?? 'profile-form'} initialForm={getInitialForm(user)} email={user?.email ?? ''} onSave={handleSave} />;
}
