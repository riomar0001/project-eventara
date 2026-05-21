export const ADMIN_OPERATIONS_PATHS = {
  analytics: '/analytics',
  venues: '/venues',
  venueCreate: '/venues/new',
  venueDetail: (venueId: string) => `/venues/${venueId}`,
  venueEdit: (venueId: string) => `/venues/${venueId}/edit`,
  events: '/events',
  eventCreate: '/events/new',
  eventDetail: (eventId: string) => `/events/${eventId}`,
  eventEdit: (eventId: string) => `/events/${eventId}/edit`,
  volunteers: '/volunteers/roster',
  volunteerCreate: '/volunteers/new',
  volunteerDetail: (volunteerId: string) => `/volunteers/${volunteerId}`,
  volunteerEdit: (volunteerId: string) => `/volunteers/${volunteerId}/edit`,
  volunteerApplications: '/volunteers/applications',
  volunteerPotentialVolunteers: '/volunteers/potential-volunteers',
  volunteerRoles: '/volunteers/roles',
  queues: '/queues',
  feedback: '/feedback'
} as const;

export type VenueRecord = {
  // identity
  id: string;
  image_file_id?: string | null;
  photo: string; // unsplash placeholder; maps to image_file_id in prod
  // core info
  name: string;
  description: string | null;
  summary: string; // catalog card blurb (not persisted; derived for UI)
  // address
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
  region: string;
  country: string;
  // venue meta
  capacity: number;
  venue_type: 'indoor' | 'outdoor' | 'hybrid';
  is_partner: boolean;
  amenities: string[] | null;
  // counts (read-only; set by backend)
  popularity_count: number;
  usage_count: number;
  // contact
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  // timestamps (null in seed data)
  created_at: string | null;
  updated_at: string | null;
};

export type EventRecord = {
  audience: string;
  dateLabel: string;
  headline: string;
  hostTeam: string[];
  id: string;
  photo: string;
  priceLabel: string;
  registrationLabel: string;
  scheduleNote: string;
  stageCount: number;
  status: 'On Sale' | 'Draft' | 'Planning';
  summary: string;
  title: string;
  volunteerNeed: string;
  venueId: string;
};

export type VolunteerRecord = {
  assignedEventIds: string[];
  availability: 'Weeknights' | 'Weekends' | 'Flexible';
  bio: string;
  city: string;
  email: string;
  hoursContributed: number;
  id: string;
  joinedOn: string;
  name: string;
  phone: string;
  photo: string;
  primaryRole: string;
  shiftPreference: 'Front of House' | 'Production' | 'Community Desk' | 'Anywhere';
  skills: string[];
  status: 'Active' | 'Training' | 'Inactive';
};

export const venueRecords: VenueRecord[] = [
  {
    id: 'riverfront-pavilion',
    photo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=80',
    name: 'Riverfront Pavilion',
    description:
      'Riverfront Pavilion pairs a glass-wrapped hall with an open terrace, making it the most adaptable venue in the current admin preview. Designed for sunset programming, sponsor moments, and high-traffic guest arrival flows.',
    summary: 'A bright riverside venue used for community showcases, evening talks, and sponsor receptions.',
    address_line: '18 Basin Walk',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 420,
    venue_type: 'hybrid',
    is_partner: true,
    amenities: ['Dockside Terrace', 'Led Wall Package', 'Backstage Prep Lounge', 'Vendor Power Drops'],
    popularity_count: 184,
    usage_count: 12,
    contact_name: 'Talia Morgan',
    contact_email: 'talia@eventara.local',
    contact_phone: '+63 912 881 2447',
    created_at: '2025-03-10T08:00:00Z',
    updated_at: '2026-01-15T10:30:00Z'
  },
  {
    id: 'lantern-square',
    photo: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1400&q=80',
    name: 'Lantern Square',
    description:
      "Lantern Square is strongest after dark. The venue's circulation pattern supports stall layouts, queue management, and ambient lighting moments that reward community-focused event formats.",
    summary: 'An open courtyard built for night markets, ticketed food programs, and immersive installations.',
    address_line: '105 Lantern Street, Poblacion District',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 260,
    venue_type: 'outdoor',
    is_partner: false,
    amenities: ['Pop-Up Stall Bays', 'String Lighting Rig', 'Load-In Lane', 'Portable Stage Points'],
    popularity_count: 97,
    usage_count: 7,
    contact_name: 'Nur Afiqah',
    contact_email: 'afiqah@eventara.local',
    contact_phone: '+63 917 813 3510',
    created_at: '2025-05-22T09:00:00Z',
    updated_at: '2025-12-01T14:00:00Z'
  },
  {
    id: 'harbor-warehouse',
    photo: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80',
    name: 'Harbor Warehouse 9',
    description:
      'Harbor Warehouse 9 is the heavy-lift option in the venue set. It supports larger scenic builds, dense audience layouts, and operational zones for volunteer teams, vendors, and production staff.',
    summary: 'A dramatic industrial shell used for high-volume launches, maker fairs, and staged live programs.',
    address_line: '9 Dock Crane Road, Sasa Port Area',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 680,
    venue_type: 'indoor',
    is_partner: true,
    amenities: ['Rigging Grid', 'Freight Access', 'Control Booth', 'Green Room Suites'],
    popularity_count: 261,
    usage_count: 18,
    contact_name: 'Marcelo Reyes',
    contact_email: 'marcelo@eventara.local',
    contact_phone: '+63 918 877 9630',
    created_at: '2025-01-08T07:30:00Z',
    updated_at: '2026-02-20T11:00:00Z'
  },
  {
    id: 'hillside-greenhouse',
    photo: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80',
    name: 'Hillside Greenhouse',
    description:
      'Hillside Greenhouse is a quieter premium venue used for intimate formats. Its natural light and compact circulation make it ideal for carefully staged hospitality programs rather than high-volume public events.',
    summary: 'A plant-filled conservatory suited for donor dinners, press previews, and premium workshops.',
    address_line: '44 Canopy Rise, Matina District',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 180,
    venue_type: 'indoor',
    is_partner: false,
    amenities: ['Dining Kitchen', 'Skylight Canopy', 'Private Arrival Gate', 'Workshop Benches'],
    popularity_count: 43,
    usage_count: 4,
    contact_name: 'Eunice Lim',
    contact_email: 'eunice@eventara.local',
    contact_phone: '+63 919 890 1225',
    created_at: '2025-07-14T10:00:00Z',
    updated_at: '2025-10-30T16:45:00Z'
  },
  {
    id: 'neon-loft',
    photo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
    name: 'Neon Loft',
    description:
      'Neon Loft offers a highly modular layout with writable walls, breakout pods, and integrated presentation tech. It is optimized for focused, collaborative work and intimate tech gatherings.',
    summary: 'A sleek, modern studio space perfect for hackathons, design sprints, and product demos.',
    address_line: '88 Cyber Way, Damosa IT Park',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 150,
    venue_type: 'indoor',
    is_partner: true,
    amenities: ['Whiteboard Walls', 'Breakout Pods', 'Fiber Internet', 'Av Presentation Suite'],
    popularity_count: 119,
    usage_count: 9,
    contact_name: 'Julian Brooks',
    contact_email: 'julian@eventara.local',
    contact_phone: '+63 916 822 1993',
    created_at: '2025-09-01T08:00:00Z',
    updated_at: '2026-03-05T09:15:00Z'
  },
  {
    id: 'skyline-terrace',
    photo: 'https://images.unsplash.com/photo-1572111504281-9df91fb4fb5d?auto=format&fit=crop&w=1400&q=80',
    name: 'Skyline Terrace',
    description:
      'Skyline Terrace combines a plush indoor lounge with a sprawling outdoor deck. It is the premier choice for evening networking events, investor dinners, and upscale social gatherings that demand a sophisticated backdrop.',
    summary: 'A premium rooftop destination offering panoramic city views for VIP mixers and cocktail receptions.',
    address_line: 'Level 42, 1 Financial Tower, Bajada',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 300,
    venue_type: 'hybrid',
    is_partner: true,
    amenities: ['Full Service Bar', 'Outdoor Heaters', 'Lounge Seating', 'Dj Booth'],
    popularity_count: 202,
    usage_count: 14,
    contact_name: 'Sarah Chen',
    contact_email: 'sarah@eventara.local',
    contact_phone: '+63 915 899 0112',
    created_at: '2025-04-18T11:00:00Z',
    updated_at: '2026-01-28T13:30:00Z'
  },
  {
    id: 'heritage-hall',
    photo: 'https://images.unsplash.com/photo-1507676184212-d0330a15233c?auto=format&fit=crop&w=1400&q=80',
    name: 'Heritage Hall',
    description:
      'Heritage Hall features classical architecture, high arched ceilings, and modern acoustic treatments. It provides a grand, formal atmosphere while maintaining the technical infrastructure needed for complex stage productions.',
    summary: 'A beautifully restored colonial-era hall designed for keynote speeches, award ceremonies, and formal banquets.',
    address_line: '12 Old Parliament Lane, Civic District',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 500,
    venue_type: 'indoor',
    is_partner: false,
    amenities: ['Tiered Seating Options', 'Acoustic Paneling', 'Vip Holding Rooms', 'Grand Foyer'],
    popularity_count: 156,
    usage_count: 11,
    contact_name: 'David Tan',
    contact_email: 'david@eventara.local',
    contact_phone: '+63 917 844 5771',
    created_at: '2024-11-03T07:00:00Z',
    updated_at: '2025-08-12T10:00:00Z'
  },
  {
    id: 'the-vault',
    photo: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1400&q=80',
    name: 'The Vault',
    description:
      'The Vault is a windowless, soundproofed bunker that gives event producers total control over lighting and atmosphere. It thrives during late-night programming and exclusive, high-energy entertainment formats.',
    summary: 'An edgy, subterranean space favored for secret shows, after-parties, and immersive brand activations.',
    address_line: 'Sub-level 2, Marina South Bunkers, Lanang',
    city: 'Davao City',
    province: 'Davao del Sur',
    postal_code: '8000',
    region: 'Region XI (Davao Region)',
    country: 'Philippines',
    capacity: 350,
    venue_type: 'indoor',
    is_partner: false,
    amenities: ['Club Sound System', 'Dynamic Light Grid', 'Coat Check', 'Private Booths'],
    popularity_count: 88,
    usage_count: 6,
    contact_name: 'Maya Patel',
    contact_email: 'maya@eventara.local',
    contact_phone: '+63 918 833 2900',
    created_at: '2025-06-30T12:00:00Z',
    updated_at: '2025-11-18T15:00:00Z'
  }
];

export const eventRecords: EventRecord[] = [
  {
    id: 'summer-signal-festival',
    title: 'Summer Signal Festival',
    headline: 'A waterfront weekend of music, talks, and food experiences.',
    venueId: 'riverfront-pavilion',
    dateLabel: 'July 18, 2026',
    status: 'On Sale',
    audience: 'Public festival',
    priceLabel: 'From $28',
    registrationLabel: '312 / 420 registered',
    scheduleNote: 'Gates 4:30 PM, headline set 8:15 PM',
    stageCount: 3,
    volunteerNeed: '28 volunteer positions still open',
    hostTeam: ['Programming', 'Partnerships', 'Guest Experience'],
    summary:
      'Summer Signal Festival is the flagship outdoor-heavy program in this preview set, combining headline performances with sponsor activations and volunteer-managed guest flow.',
    photo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'midnight-makers-market',
    title: 'Midnight Makers Market',
    headline: 'A night market mixing local makers, food stalls, and after-hours workshops.',
    venueId: 'lantern-square',
    dateLabel: 'August 02, 2026',
    status: 'Planning',
    audience: 'Community market',
    priceLabel: 'Free RSVP',
    registrationLabel: '188 / 260 RSVPs',
    scheduleNote: 'Vendor arrival 2:00 PM, public opening 6:00 PM',
    stageCount: 1,
    volunteerNeed: '12 hosts needed for wayfinding and vendor support',
    hostTeam: ['Community Partnerships', 'Vendor Ops'],
    summary:
      'Midnight Makers Market focuses on warmth and flow. The current concept emphasizes clear zoning, strong volunteer wayfinding, and a polished late-evening retail atmosphere.',
    photo: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'launchpad-live',
    title: 'Launchpad Live Expo',
    headline: 'A product launch and demo floor built for bigger production moments.',
    venueId: 'harbor-warehouse',
    dateLabel: 'September 14, 2026',
    status: 'Draft',
    audience: 'Industry invite',
    priceLabel: 'Invite only',
    registrationLabel: 'Preview capacity 480 seats',
    scheduleNote: 'Rehearsals held the evening before opening day',
    stageCount: 4,
    volunteerNeed: '20 production and registration crew slots',
    hostTeam: ['Production', 'Registration', 'Brand Studio'],
    summary:
      'Launchpad Live Expo is positioned as a production-forward event concept with multiple demo pockets, sponsor builds, and a fast-moving front-of-house operation.',
    photo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'greenhouse-donor-supper',
    title: 'Greenhouse Donor Supper',
    headline: 'An intimate fundraising dinner with guided storytelling and table service.',
    venueId: 'hillside-greenhouse',
    dateLabel: 'October 09, 2026',
    status: 'Planning',
    audience: 'Donor and partner guests',
    priceLabel: 'Private invitation',
    registrationLabel: '84 / 180 seats reserved',
    scheduleNote: 'Reception begins at 6:30 PM',
    stageCount: 1,
    volunteerNeed: '6 hospitality volunteers requested',
    hostTeam: ['Leadership', 'Donor Relations'],
    summary:
      'Greenhouse Donor Supper is a quieter hospitality format centered on service detail, premium staging, and a calm volunteer presence that supports guest transitions.',
    photo: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'blueprint-design-summit',
    title: 'Blueprint Design Summit',
    headline: 'A full-day conference for designers, builders, and creative leads.',
    venueId: 'central-conference-hall',
    dateLabel: 'November 06, 2026',
    status: 'On Sale',
    audience: 'Industry professionals',
    priceLabel: 'From $65',
    registrationLabel: '540 / 700 registered',
    scheduleNote: 'Doors open 8:00 AM, keynote at 9:30 AM',
    stageCount: 2,
    volunteerNeed: '16 session moderators and floor crew needed',
    hostTeam: ['Programming', 'Brand Studio', 'A/V Production'],
    summary:
      'Blueprint Design Summit brings together practitioners across disciplines for a structured day of talks, critiques, and portfolio sessions with a strong emphasis on speaker production quality.',
    photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'ember-film-night',
    title: 'Ember Film Night',
    headline: 'An outdoor cinema evening with curated short films and live score.',
    venueId: 'rooftop-terrace-east',
    dateLabel: 'November 21, 2026',
    status: 'On Sale',
    audience: 'General public',
    priceLabel: 'From $18',
    registrationLabel: '203 / 280 registered',
    scheduleNote: 'Arrivals from 6:30 PM, screening begins at dusk',
    stageCount: 1,
    volunteerNeed: '10 ushers and equipment handlers needed',
    hostTeam: ['Programming', 'Guest Experience'],
    summary:
      'Ember Film Night is a single-screen, weather-dependent format that pairs curated short cinema with a live ambient score, requiring tight coordination between A/V crew and volunteer ushers.',
    photo: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'founders-roundtable',
    title: 'Founders Roundtable',
    headline: 'A closed-door breakfast session for early-stage founders and investors.',
    venueId: 'private-dining-suite',
    dateLabel: 'December 03, 2026',
    status: 'Planning',
    audience: 'Invitation only',
    priceLabel: 'Complimentary',
    registrationLabel: '31 / 48 seats confirmed',
    scheduleNote: 'Breakfast service at 7:30 AM, discussion opens 8:00 AM',
    stageCount: 1,
    volunteerNeed: '4 hospitality staff for service and check-in',
    hostTeam: ['Leadership', 'Partnerships'],
    summary:
      'Founders Roundtable is a high-trust, low-profile format designed around candid conversation. The priority is a seamless service environment with minimal interruption to the discussion flow.',
    photo: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80'
  },
  {
    id: 'winter-welcome-gala',
    title: 'Winter Welcome Gala',
    headline: 'A year-end celebration bringing together staff, partners, and community guests.',
    venueId: 'grand-ballroom-west',
    dateLabel: 'December 19, 2026',
    status: 'Draft',
    audience: 'Staff and partners',
    priceLabel: 'Internal event',
    registrationLabel: '172 / 350 seats planned',
    scheduleNote: 'Arrival from 7:00 PM, program begins 8:00 PM',
    stageCount: 2,
    volunteerNeed: '22 event crew across registration, floor, and wrap-up',
    hostTeam: ['Leadership', 'Guest Experience', 'Programming'],
    summary:
      'Winter Welcome Gala closes the calendar year with a mixed program of recognition, live entertainment, and open mingling. Volunteer coordination spans across multiple zones and a two-stage timeline.',
    photo: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=80'
  }
];

export const volunteerRecords: VolunteerRecord[] = [
  {
    id: 'maya-chen',
    name: 'Maya Chen',
    email: 'maya.chen@eventara.local',
    phone: '+65 8820 1140',
    city: 'Tiong Bahru',
    primaryRole: 'Guest Experience Lead',
    status: 'Active',
    availability: 'Weekends',
    shiftPreference: 'Front of House',
    hoursContributed: 124,
    joinedOn: 'February 2024',
    skills: ['Wayfinding', 'Registration', 'VIP desk'],
    assignedEventIds: ['summer-signal-festival', 'greenhouse-donor-supper'],
    bio: 'Maya is strongest at guest-facing operations and thrives in check-in, premium hospitality, and fast-moving front-of-house environments.',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'diego-santos',
    name: 'Diego Santos',
    email: 'diego.santos@eventara.local',
    phone: '+65 8911 4052',
    city: 'Kallang',
    primaryRole: 'Production Runner',
    status: 'Active',
    availability: 'Flexible',
    shiftPreference: 'Production',
    hoursContributed: 96,
    joinedOn: 'May 2024',
    skills: ['Backstage', 'Crew coordination', 'Load-in'],
    assignedEventIds: ['launchpad-live', 'summer-signal-festival'],
    bio: 'Diego covers load-in support, comms relay, and backstage logistics, making him a strong fit for higher-volume productions.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'anika-rahman',
    name: 'Anika Rahman',
    email: 'anika.rahman@eventara.local',
    phone: '+65 8763 2551',
    city: 'Queenstown',
    primaryRole: 'Community Desk Host',
    status: 'Training',
    availability: 'Weeknights',
    shiftPreference: 'Community Desk',
    hoursContributed: 38,
    joinedOn: 'January 2026',
    skills: ['Guest support', 'Info desk', 'Accessibility escort'],
    assignedEventIds: ['midnight-makers-market'],
    bio: 'Anika is in training for community-facing shifts and has already become a reliable presence for support desks and queue reassurance.',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'oliver-ng',
    name: 'Oliver Ng',
    email: 'oliver.ng@eventara.local',
    phone: '+65 8140 7732',
    city: 'Marine Parade',
    primaryRole: 'Stage Support',
    status: 'Active',
    availability: 'Weekends',
    shiftPreference: 'Production',
    hoursContributed: 72,
    joinedOn: 'August 2025',
    skills: ['Stage reset', 'Artist escort', 'Radio comms'],
    assignedEventIds: ['summer-signal-festival'],
    bio: 'Oliver is steady during performance changeovers and is often assigned to support stage traffic and artist movement.',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'sara-yusuf',
    name: 'Sara Yusuf',
    email: 'sara.yusuf@eventara.local',
    phone: '+65 8991 4428',
    city: 'Bukit Timah',
    primaryRole: 'Hospitality Steward',
    status: 'Active',
    availability: 'Flexible',
    shiftPreference: 'Anywhere',
    hoursContributed: 88,
    joinedOn: 'November 2024',
    skills: ['Hospitality', 'Back-of-house service', 'Donor care'],
    assignedEventIds: ['greenhouse-donor-supper'],
    bio: 'Sara is most often assigned to premium guest flows, partner hosting, and donor-facing programs that need calm service energy.',
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'jun-park',
    name: 'Jun Park',
    email: 'jun.park@eventara.local',
    phone: '+65 8035 2270',
    city: 'Hougang',
    primaryRole: 'Vendor Support',
    status: 'Training',
    availability: 'Weekends',
    shiftPreference: 'Community Desk',
    hoursContributed: 26,
    joinedOn: 'March 2026',
    skills: ['Vendor check-in', 'Queue support', 'Runner'],
    assignedEventIds: ['midnight-makers-market'],
    bio: 'Jun is a newer volunteer focused on market-style events where vendor needs and public wayfinding overlap.',
    photo: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'leah-tan',
    name: 'Leah Tan',
    email: 'leah.tan@eventara.local',
    phone: '+65 8625 0991',
    city: 'Bedok',
    primaryRole: 'Registration Captain',
    status: 'Active',
    availability: 'Weeknights',
    shiftPreference: 'Front of House',
    hoursContributed: 110,
    joinedOn: 'July 2024',
    skills: ['Credentialing', 'Check-in systems', 'Queue design'],
    assignedEventIds: ['launchpad-live', 'summer-signal-festival'],
    bio: 'Leah specializes in pre-event check-in planning and on-the-ground credentialing systems for busier programs.',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'isaac-ong',
    name: 'Isaac Ong',
    email: 'isaac.ong@eventara.local',
    phone: '+65 8157 6622',
    city: 'Pasir Ris',
    primaryRole: 'Logistics Support',
    status: 'Inactive',
    availability: 'Flexible',
    shiftPreference: 'Anywhere',
    hoursContributed: 54,
    joinedOn: 'October 2024',
    skills: ['Transport coordination', 'Inventory', 'Load-out'],
    assignedEventIds: [],
    bio: 'Isaac previously handled logistics-heavy shifts and remains in the roster as a reserve volunteer for larger event days.',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  }
];

export function getVenueById(venueId: string) {
  return venueRecords.find((venue) => venue.id === venueId) ?? null;
}

export function getEventById(eventId: string) {
  return eventRecords.find((event) => event.id === eventId) ?? null;
}

export function getVolunteerById(volunteerId: string) {
  return volunteerRecords.find((volunteer) => volunteer.id === volunteerId) ?? null;
}

export function getEventsByVenueId(venueId: string) {
  return eventRecords.filter((event) => event.venueId === venueId);
}

export function getVolunteersByEventId(eventId: string) {
  return volunteerRecords.filter((volunteer) => volunteer.assignedEventIds.includes(eventId));
}

export function getVolunteerInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export { eventDetailRecords, getEventDetailById, getSessionsByEventId, getEventVolunteersByEventId, getRatingsByEventId } from './event-detail-data';
export type { EventDbStatus, EventDetailRecord, EventSessionRecord, EventVolunteerRecord, EventRatingRecord } from './event-detail-data';
