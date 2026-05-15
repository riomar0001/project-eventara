'use client';

import { TrendingUp, Users, Calendar, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Section } from './shared';

const lineChartData = [
  { name: 'Mon', participants: 240, volunteers: 120 },
  { name: 'Tue', participants: 390, volunteers: 221 },
  { name: 'Wed', participants: 200, volunteers: 229 },
  { name: 'Thu', participants: 278, volunteers: 200 },
  { name: 'Fri', participants: 189, volunteers: 250 },
  { name: 'Sat', participants: 239, volunteers: 220 },
  { name: 'Sun', participants: 349, volunteers: 210 }
];

const barChartData = [
  { name: 'Music Festival', events: 12, attendance: 3400 },
  { name: 'Tech Expo', events: 8, attendance: 2210 },
  { name: 'Food Market', events: 14, attendance: 2290 },
  { name: 'Sports Day', events: 5, attendance: 2000 },
  { name: 'Art Show', events: 9, attendance: 2181 }
];

const pieChartData = [
  { name: 'Indoor', value: 35 },
  { name: 'Outdoor', value: 28 },
  { name: 'Hybrid', value: 37 }
];

const COLORS = ['#84cc16', '#a3e635', '#bef264'];

const statCards = [
  {
    icon: Users,
    label: 'Total Participants',
    value: '12,584',
    change: '+12.5%',
    trend: 'up'
  },
  {
    icon: Calendar,
    label: 'Upcoming Events',
    value: '48',
    change: '+3 this week',
    trend: 'up'
  },
  {
    icon: Activity,
    label: 'Volunteer Hours',
    value: '2,340',
    change: '+8.2%',
    trend: 'up'
  },
  {
    icon: TrendingUp,
    label: 'Avg Event Rating',
    value: '4.7/5',
    change: '+0.2 pts',
    trend: 'up'
  }
];

export function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <Section title="Analytics Dashboard">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-green-600">{stat.change}</p>
                    </div>
                    <Icon className="size-8 text-lime-200" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="Participant & Volunteer Trends (Weekly)">
        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="participants" stroke="#84cc16" name="Participants" strokeWidth={2} />
                <Line type="monotone" dataKey="volunteers" stroke="#a3e635" name="Volunteers" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      <Section title="Events by Venue Category">
        <Card>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="events" fill="#84cc16" name="Event Count" />
                <Bar dataKey="attendance" fill="#bef264" name="Avg Attendance" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Section>

      <Section title="Venue Type Distribution">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Venues</CardTitle>
              <CardDescription>Ranked by participant engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Central Park', events: 24, participants: 2850 },
                { name: 'Convention Center', events: 18, participants: 2450 },
                { name: 'Beach Pavilion', events: 15, participants: 1890 },
                { name: 'Downtown Hall', events: 12, participants: 1560 }
              ].map((venue, idx) => (
                <div key={venue.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {idx + 1}. {venue.name}
                    </p>
                    <span className="text-muted-foreground text-xs">{venue.participants} participants</span>
                  </div>
                  <div className="bg-muted h-2 w-full rounded-full">
                    <div className="h-full rounded-full bg-lime-400" style={{ width: `${(venue.participants / 2850) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}
