'use client';

import { AlertCircle, CheckCircle2, Loader2, Mail, RotateCcw, Save, XCircle } from 'lucide-react';
import { FieldHint } from '@/components/shared/field-hint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PROFILE_AGE_GROUP_OPTIONS, PROFILE_EDUCATION_LEVEL_OPTIONS, PROFILE_GENDER_OPTIONS } from '@/constants/profile';
import { useProfileSettingsForm } from '@/hooks/use-profile-settings-form';

export default function ProfileSettingsPage() {
  const { aliasHint, aliasStatus, completionValue, errors, form, handleReset, handleSubmit, isOnboarded, isSubmitting, setField, user } = useProfileSettingsForm();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-neutral-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium">{isOnboarded ? 'Profile settings' : 'Complete your profile'}</p>
            <p className="text-muted-foreground max-w-2xl text-sm">
              {isOnboarded
                ? 'Alias validation is wired to the live API. Profile edits are still stored in the current session until the backend exposes an update-profile endpoint.'
                : 'Finishing this form will call the onboarding API and write your profile to the server.'}
            </p>
          </div>

          <div className="min-w-52 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-medium">{completionValue}%</span>
            </div>
            <Progress value={completionValue} />
          </div>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input id="email" value={user?.email ?? ''} className="pl-9" readOnly />
            </div>
            <FieldHint hint="Your email is managed through account security and cannot be edited here." />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="alias">
              Alias
            </label>
            <div className="relative">
              <Input
                id="alias"
                value={form.alias}
                onChange={(event) => setField('alias', event.target.value.toLowerCase())}
                placeholder="jane_doe"
                autoComplete="nickname"
                className="pr-9"
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                {aliasStatus === 'checking' ? (
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                ) : aliasStatus === 'available' ? (
                  <CheckCircle2 className="size-4 text-lime-600" />
                ) : aliasStatus === 'taken' ? (
                  <XCircle className="text-destructive size-4" />
                ) : aliasStatus === 'error' ? (
                  <AlertCircle className="size-4 text-amber-600" />
                ) : null}
              </div>
            </div>
            <FieldHint error={errors.alias} hint={aliasHint} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="occupation">
              Occupation
            </label>
            <Input id="occupation" value={form.occupation} onChange={(event) => setField('occupation', event.target.value)} placeholder="Event coordinator" />
            <FieldHint error={errors.occupation} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="first-name">
              First name
            </label>
            <Input id="first-name" value={form.firstName} onChange={(event) => setField('firstName', event.target.value)} autoComplete="given-name" />
            <FieldHint error={errors.firstName} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="last-name">
              Last name
            </label>
            <Input id="last-name" value={form.lastName} onChange={(event) => setField('lastName', event.target.value)} autoComplete="family-name" />
            <FieldHint error={errors.lastName} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Age group</label>
            <Select value={form.ageGroup} onValueChange={(value) => setField('ageGroup', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_AGE_GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldHint error={errors.ageGroup} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select value={form.gender} onValueChange={(value) => setField('gender', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldHint error={errors.gender} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Education</label>
            <Select value={form.educationLevel} onValueChange={(value) => setField('educationLevel', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select education" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_EDUCATION_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldHint error={errors.educationLevel} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium" htmlFor="bio">
              Bio
            </label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(event) => setField('bio', event.target.value)}
              placeholder="Tell people a little about yourself"
              rows={5}
            />
            <FieldHint error={errors.bio} hint="A short intro helps your profile feel complete." />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row">
          <Button type="submit" disabled={isSubmitting || aliasStatus === 'checking'}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isOnboarded ? 'Save changes' : 'Complete profile'}
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={isSubmitting}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
