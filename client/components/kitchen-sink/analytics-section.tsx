'use client';

import { BarChart3, Globe, Radio, Clock, Truck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DemographicsTab } from './analytics/analytics-demographics';
import { HistoricalTab } from './analytics/analytics-historical';
import { LogisticsTab } from './analytics/analytics-logistics';
import { OngoingTab } from './analytics/analytics-ongoing';
import { PerformanceTab } from './analytics/analytics-performance';
import { Section } from './shared';

const tabs = [
  { id: 'performance', label: 'Performance', icon: BarChart3, Component: PerformanceTab },
  { id: 'demographics', label: 'Demographics', icon: Globe, Component: DemographicsTab },
  { id: 'ongoing', label: 'Ongoing', icon: Radio, Component: OngoingTab },
  { id: 'historical', label: 'Historical', icon: Clock, Component: HistoricalTab },
  { id: 'logistics', label: 'Logistics', icon: Truck, Component: LogisticsTab }
] as const;

export function AnalyticsSection() {
  return (
    <Section title="Analytics Dashboard">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="w-full justify-start gap-2 overflow-x-auto rounded-none border-b bg-transparent px-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="data-[state=active]:border-primary data-[state=active]:text-foreground inline-flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-medium shadow-none"
            >
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map(({ id, Component }) => (
          <TabsContent key={id} value={id} className="mt-6">
            <Component />
          </TabsContent>
        ))}
      </Tabs>
    </Section>
  );
}
