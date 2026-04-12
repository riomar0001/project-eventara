'use client';

import { AvatarsSection } from '../../components/kitchen-sink/avatars-section';
import { BadgesSection } from '../../components/kitchen-sink/badges-section';
import { ButtonsSection } from '../../components/kitchen-sink/buttons-section';
import { CardsSection } from '../../components/kitchen-sink/cards-section';
import { CollapsibleSection } from '../../components/kitchen-sink/collapsible-section';
import { DashboardSection } from '../../components/kitchen-sink/dashboard-section';
import { DataTable } from '../../components/kitchen-sink/data-table';
import { DropdownSection } from '../../components/kitchen-sink/dropdown-section';
import { InputsSection } from '../../components/kitchen-sink/inputs-section';
import { ProgressSection } from '../../components/kitchen-sink/progress-section';
import { ScrollAreaSection } from '../../components/kitchen-sink/scroll-area-section';
import { SeparatorSection } from '../../components/kitchen-sink/separator-section';
import { SheetSection } from '../../components/kitchen-sink/sheet-section';
import { SkeletonSection } from '../../components/kitchen-sink/skeleton-section';
import { ToasterSection } from '../../components/kitchen-sink/toaster-section';
import { TooltipSection } from '../../components/kitchen-sink/tooltip-section';

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
