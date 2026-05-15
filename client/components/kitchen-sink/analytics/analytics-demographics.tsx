'use client';

import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useDemographicAnalytics } from '@/hooks/admin/analytics';
import { LoadingSkeleton, ErrorAlert, EmptyState } from './analytics-shared';

const LIME = 'oklch(0.648 0.2 131.684)';
const LIME_LIGHT = 'oklch(0.879 0.169 91.605)';
const PIE_COLORS = [
  'oklch(0.648 0.2 131.684)',
  'oklch(0.879 0.169 91.605)',
  'oklch(0.922 0.08 110)',
  'oklch(0.556 0.15 131)',
  'oklch(0.75 0.18 120)',
  'oklch(0.5 0.12 140)'
];

export function DemographicsTab() {
  const { data, isLoading, error } = useDemographicAnalytics();

  if (error) return <ErrorAlert message={error} />;
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
    );
  }
  if (!data) return <EmptyState />;

  const deviceData = data.device_breakdown.map((d) => ({ name: d.device_type, value: d.percentage ?? d.count }));
  const osData = data.os_breakdown.map((d) => ({ name: d.os, value: d.count }));
  const browserData = data.browser_breakdown.map((d) => ({ name: d.browser, value: d.count }));
  const genderData = data.gender_distribution.map((d) => ({ name: d.gender, value: d.count }));
  const ageData = data.account_age_distribution.map((d) => ({ name: d.bucket, value: d.count }));
  const fvrData = data.first_time_vs_returning.slice(0, 8).map((e) => ({
    name: e.event_title?.substring(0, 12) ?? 'Event',
    firstTime: e.first_time_count,
    returning: e.returning_count
  }));
  const geoData = data.geographic_spread.map((g) => ({ name: g.city, value: g.participant_count }));

  const fvrConfig = { firstTime: { label: 'First Time', color: LIME }, returning: { label: 'Returning', color: LIME_LIGHT } };

  const hasAny =
    deviceData.length > 0 ||
    genderData.length > 0 ||
    data.top_cities.length > 0 ||
    osData.length > 0 ||
    browserData.length > 0 ||
    ageData.length > 0 ||
    fvrData.length > 0 ||
    geoData.length > 0;

  if (!hasAny) return <EmptyState message="No demographic data available" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceData.length > 0 ? (
              <ChartContainer config={{}} className="mx-auto h-64 w-full max-w-xs">
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {deviceData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState message="No device data available" />
            )}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {genderData.length > 0 ? (
              <ChartContainer config={{}} className="mx-auto h-64 w-full max-w-xs">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {genderData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyState message="No gender data available" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Cities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Participating Cities</CardTitle>
        </CardHeader>
        <CardContent>
          {data.top_cities.length > 0 ? (
            <div className="space-y-4">
              {data.top_cities.slice(0, 8).map((c, idx) => {
                const max = data.top_cities[0].participant_count || 1;
                return (
                  <div key={c.city} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {idx + 1}. {c.city}
                        {c.country ? `, ${c.country}` : ''}
                      </p>
                      <span className="text-muted-foreground text-xs">{c.participant_count}</span>
                    </div>
                    <div className="bg-muted h-2 w-full rounded-full">
                      <div className="h-full rounded-full bg-lime-400 transition-all" style={{ width: `${(c.participant_count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No city participation data available" />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* OS Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">OS Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {osData.length > 0 ? (
              <ChartContainer config={{ value: { label: 'Users', color: LIME } }} className="h-60 w-full">
                <BarChart data={osData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={LIME} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState message="No OS data available" />
            )}
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Browser Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {browserData.length > 0 ? (
              <ChartContainer config={{ value: { label: 'Users', color: LIME_LIGHT } }} className="h-60 w-full">
                <BarChart data={browserData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={LIME_LIGHT} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyState message="No browser data available" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Age Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Age Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {ageData.length > 0 ? (
            <ChartContainer config={{ value: { label: 'Users', color: LIME } }} className="h-60 w-full">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill={LIME} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No account age data available" />
          )}
        </CardContent>
      </Card>

      {/* First-Time vs Returning */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">First-Time vs Returning Attendees</CardTitle>
          <CardDescription>Per event breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {fvrData.length > 0 ? (
            <ChartContainer config={fvrConfig} className="h-72 w-full">
              <BarChart data={fvrData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="firstTime" fill={LIME} radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="returning" fill={LIME_LIGHT} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No first-time vs returning data available" />
          )}
        </CardContent>
      </Card>

      {/* Geographic Spread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Geographic Spread</CardTitle>
          <CardDescription>Participants by city</CardDescription>
        </CardHeader>
        <CardContent>
          {geoData.length > 0 ? (
            <ChartContainer config={{ value: { label: 'Participants', color: LIME } }} className="h-60 w-full">
              <BarChart data={geoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={90} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill={LIME} radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyState message="No geographic data available" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
