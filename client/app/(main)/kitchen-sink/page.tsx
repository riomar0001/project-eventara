'use client';

import { AvatarsSection } from './_components/avatars-section';
import { BadgesSection } from './_components/badges-section';
import { ButtonsSection } from './_components/buttons-section';
import { CardsSection } from './_components/cards-section';
import { CollapsibleSection } from './_components/collapsible-section';
import { DashboardSection } from './_components/dashboard-section';
import { DataTable } from './_components/data-table';
import { DropdownSection } from './_components/dropdown-section';
import { InputsSection } from './_components/inputs-section';
import { ProgressSection } from './_components/progress-section';
import { ScrollAreaSection } from './_components/scroll-area-section';
import { SeparatorSection } from './_components/separator-section';
import { SheetSection } from './_components/sheet-section';
import { SkeletonSection } from './_components/skeleton-section';
import { ToasterSection } from './_components/toaster-section';
import { TooltipSection } from './_components/tooltip-section';

export default function KitchenSinkPage() {
  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kitchen Sink</h1>
        <p className="text-muted-foreground text-sm">Every UI primitive and dashboard component in one place.</p>
      </div>

      <ButtonsSection />
      <BadgesSection />
      <InputsSection />
      <TooltipSection />
      <DropdownSection />
      <SheetSection />
      <CollapsibleSection />
      <ScrollAreaSection />
      <AvatarsSection />
      <ProgressSection />
      <SkeletonSection />
      <SeparatorSection />
      <CardsSection />
      <ToasterSection />
      <DataTable />
      <DashboardSection />
    </div>
  );
}
