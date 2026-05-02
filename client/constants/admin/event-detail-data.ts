// DB-aligned types for the event detail page.
// Mirrors the server schema from app/domain/entities/event_entity.py
// and app/infrastructure/database/models/event_models.py.

export type EventDbStatus = 'draft' | 'posted' | 'started' | 'cancelled' | 'ended' | 'postponed';

export type EventSessionStatus = EventDbStatus;

export type EventVolunteerStatusDb = 'pending' | 'joined' | 'left' | 'rejected';

export type EventDetailRecord = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: EventDbStatus;
  createdBy: string;
  photo: string;
  headline: string;
  audience: string;
  priceLabel: string;
  registrationLabel: string;
  scheduleNote: string;
  stageCount: number;
  volunteerNeed: string;
  hostTeam: string[];
  summary: string;
  venueId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EventSessionRecord = {
  id: string;
  eventId: string;
  venueId: string;
  title: string;
  description: string | null;
  startDatetime: string;
  endDatetime: string;
  status: EventSessionStatus;
  maxSlots: number | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EventVolunteerRecord = {
  id: string;
  volunteerId: string;
  eventId: string;
  status: EventVolunteerStatusDb;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EventRatingRecord = {
  id: string;
  userId: string;
  userName: string;
  eventId: string;
  overallRating: number;
  organizationRating: number | null;
  venueRating: number | null;
  activitiesRating: number | null;
  title: string;
  review: string;
  wouldRecommend: boolean;
  mediaUrls: string[] | null;
  helpfulCount: number;
  creatorResponse: string | null;
  creatorRespondedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

// ── Mock data ──────────────────────────────────────────────────────────────────

export const eventDetailRecords: EventDetailRecord[] = [
  {
    id: 'summer-signal-festival',
    title: 'Summer Signal Festival',
    description:
      "Summer Signal Festival is the flagship outdoor program of the season, combining headline music performances with immersive sponsor activations across three stages. The venue layout supports high-traffic guest flow, with dedicated zones for food experiences, community booths, and volunteer-managed entry points.\n\nThe programming team has curated a diverse lineup spanning local and regional artists, with late-afternoon gates opening to a sunset opening ceremony. Attendee feedback from previous editions has shaped this year's emphasis on shaded rest areas and water stations throughout the grounds.",
    startDate: '2026-07-18T16:30:00+08:00',
    endDate: '2026-07-18T23:00:00+08:00',
    status: 'posted',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1400&q=80',
    headline: 'A waterfront weekend of music, talks, and food experiences.',
    audience: 'Public festival',
    priceLabel: 'From $28',
    registrationLabel: '312 / 420 registered',
    scheduleNote: 'Gates 4:30 PM, headline set 8:15 PM',
    stageCount: 3,
    volunteerNeed: '28 volunteer positions still open',
    hostTeam: ['Programming', 'Partnerships', 'Guest Experience'],
    summary: 'Summer Signal Festival is the flagship outdoor-heavy program in this preview set.',
    venueId: 'riverfront-pavilion',
    createdAt: '2026-01-15T10:00:00+08:00',
    updatedAt: '2026-06-01T08:00:00+08:00'
  },
  {
    id: 'midnight-makers-market',
    title: 'Midnight Makers Market',
    description:
      'Midnight Makers Market transforms Lantern Square into a bustling night bazaar where local artisans, food vendors, and workshop hosts come together under string lights. The evening format is designed around clear zoning — stall rows for makers, a central food court, and a covered workshop tent for hands-on sessions.\n\nVolunteer wayfinding support is critical to the market flow, with host stations placed at key decision points throughout the square. The operations plan includes vendor load-in windows, power access mapping, and a dedicated quiet hour for breakdown.',
    startDate: '2026-08-02T14:00:00+08:00',
    endDate: '2026-08-02T23:00:00+08:00',
    status: 'draft',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80',
    headline: 'A night market mixing local makers, food stalls, and after-hours workshops.',
    audience: 'Community market',
    priceLabel: 'Free RSVP',
    registrationLabel: '188 / 260 RSVPs',
    scheduleNote: 'Vendor arrival 2:00 PM, public opening 6:00 PM',
    stageCount: 1,
    volunteerNeed: '12 hosts needed for wayfinding and vendor support',
    hostTeam: ['Community Partnerships', 'Vendor Ops'],
    summary: 'Midnight Makers Market focuses on warmth and flow with clear zoning.',
    venueId: 'lantern-square',
    createdAt: '2026-02-10T09:00:00+08:00',
    updatedAt: '2026-06-15T14:00:00+08:00'
  },
  {
    id: 'launchpad-live',
    title: 'Launchpad Live Expo',
    description:
      'Launchpad Live Expo is a production-forward event concept built for high-impact product launches and demo experiences. Harbor Warehouse 9 provides the industrial scale needed for multiple demo pockets, sponsor builds, and a fast-moving front-of-house operation.\n\nThe floor plan includes four dedicated zones — main stage for keynotes, demo alley for hands-on product trials, a sponsor lounge for meetings, and a media briefing room. Production rehearsals run the evening before opening to ensure seamless transitions between programmed segments.',
    startDate: '2026-09-14T09:00:00+08:00',
    endDate: '2026-09-14T18:00:00+08:00',
    status: 'draft',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80',
    headline: 'A product launch and demo floor built for bigger production moments.',
    audience: 'Industry invite',
    priceLabel: 'Invite only',
    registrationLabel: 'Preview capacity 480 seats',
    scheduleNote: 'Rehearsals held the evening before opening day',
    stageCount: 4,
    volunteerNeed: '20 production and registration crew slots',
    hostTeam: ['Production', 'Registration', 'Brand Studio'],
    summary: 'Launchpad Live Expo is positioned as a production-forward event concept.',
    venueId: 'harbor-warehouse',
    createdAt: '2026-03-05T11:00:00+08:00',
    updatedAt: '2026-07-01T16:00:00+08:00'
  },
  {
    id: 'greenhouse-donor-supper',
    title: 'Greenhouse Donor Supper',
    description:
      'Greenhouse Donor Supper is an intimate fundraising evening held in the serene conservatory setting of Hillside Greenhouse. The format emphasizes thoughtful hospitality, with guided storytelling segments between courses and ample time for one-on-one donor conversations.\n\nTable service is restaurant-style with a curated menu developed alongside a local chef partner. The volunteer presence is deliberately light — six hospitality stewards embedded among the tables to support service transitions without interrupting the dining experience.',
    startDate: '2026-10-09T18:30:00+08:00',
    endDate: '2026-10-09T22:00:00+08:00',
    status: 'draft',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=80',
    headline: 'An intimate fundraising dinner with guided storytelling and table service.',
    audience: 'Donor and partner guests',
    priceLabel: 'Private invitation',
    registrationLabel: '84 / 180 seats reserved',
    scheduleNote: 'Reception begins at 6:30 PM',
    stageCount: 1,
    volunteerNeed: '6 hospitality volunteers requested',
    hostTeam: ['Leadership', 'Donor Relations'],
    summary: 'Greenhouse Donor Supper is a quieter hospitality format centered on service detail.',
    venueId: 'hillside-greenhouse',
    createdAt: '2026-04-20T09:00:00+08:00',
    updatedAt: '2026-08-01T10:00:00+08:00'
  },
  {
    id: 'blueprint-design-summit',
    title: 'Blueprint Design Summit',
    description:
      "Blueprint Design Summit brings together designers, builders, and creative leads for a full day of structured programming. The summit format alternates between keynote talks, breakout critique sessions, and portfolio reviews, with dedicated networking breaks built into the schedule.\n\nThe A/V production team has designed a speaker-ready stage setup with live captioning, while the venue's breakout pods support concurrent small-group sessions. Attendees receive a digital program booklet with session abstracts and speaker bios at registration.",
    startDate: '2026-11-06T08:00:00+08:00',
    endDate: '2026-11-06T17:30:00+08:00',
    status: 'posted',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80',
    headline: 'A full-day conference for designers, builders, and creative leads.',
    audience: 'Industry professionals',
    priceLabel: 'From $65',
    registrationLabel: '540 / 700 registered',
    scheduleNote: 'Doors open 8:00 AM, keynote at 9:30 AM',
    stageCount: 2,
    volunteerNeed: '16 session moderators and floor crew needed',
    hostTeam: ['Programming', 'Brand Studio', 'A/V Production'],
    summary: 'Blueprint Design Summit brings together practitioners across disciplines.',
    venueId: 'neon-loft',
    createdAt: '2026-05-01T08:00:00+08:00',
    updatedAt: '2026-09-15T12:00:00+08:00'
  },
  {
    id: 'ember-film-night',
    title: 'Ember Film Night',
    description:
      'Ember Film Night is a single-screen outdoor cinema experience pairing curated short films with a live ambient score. The rooftop setting provides a natural amphitheater layout, with tiered seating arranged to maintain clear sightlines to the screen.\n\nWeather contingency plans include a rain-date policy communicated to ticket holders 48 hours in advance. The volunteer crew handles usher duties, equipment setup, and post-screening breakdown under the direction of the A/V lead.',
    startDate: '2026-11-21T18:30:00+08:00',
    endDate: '2026-11-21T22:30:00+08:00',
    status: 'posted',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=1400&q=80',
    headline: 'An outdoor cinema evening with curated short films and live score.',
    audience: 'General public',
    priceLabel: 'From $18',
    registrationLabel: '203 / 280 registered',
    scheduleNote: 'Arrivals from 6:30 PM, screening begins at dusk',
    stageCount: 1,
    volunteerNeed: '10 ushers and equipment handlers needed',
    hostTeam: ['Programming', 'Guest Experience'],
    summary: 'Ember Film Night is a single-screen, weather-dependent format.',
    venueId: 'skyline-terrace',
    createdAt: '2026-06-10T10:00:00+08:00',
    updatedAt: '2026-10-01T15:00:00+08:00'
  },
  {
    id: 'founders-roundtable',
    title: 'Founders Roundtable',
    description:
      'Founders Roundtable is a high-trust, low-profile breakfast format designed around candid conversation among early-stage founders and active investors. The small guest list and private dining setting create an environment where participants can discuss challenges, share lessons, and explore collaboration opportunities without the pressure of a public audience.\n\nService is seamless and unobtrusive — a plated breakfast service runs alongside the discussion, with hospitality staff trained to minimize interruption. A facilitator guides the conversation through three themed segments, each introduced by a short framing prompt.',
    startDate: '2026-12-03T07:30:00+08:00',
    endDate: '2026-12-03T10:30:00+08:00',
    status: 'draft',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=80',
    headline: 'A closed-door breakfast session for early-stage founders and investors.',
    audience: 'Invitation only',
    priceLabel: 'Complimentary',
    registrationLabel: '31 / 48 seats confirmed',
    scheduleNote: 'Breakfast service at 7:30 AM, discussion opens 8:00 AM',
    stageCount: 1,
    volunteerNeed: '4 hospitality staff for service and check-in',
    hostTeam: ['Leadership', 'Partnerships'],
    summary: 'Founders Roundtable is a high-trust, low-profile format designed around candid conversation.',
    venueId: 'heritage-hall',
    createdAt: '2026-07-15T08:00:00+08:00',
    updatedAt: '2026-10-20T11:00:00+08:00'
  },
  {
    id: 'winter-welcome-gala',
    title: 'Winter Welcome Gala',
    description:
      'Winter Welcome Gala closes the calendar year with a celebratory evening that brings together staff, partners, and community guests. The program mixes recognition segments, live entertainment, and open mingling across two stages and a central lounge area.\n\nVolunteer coordination spans multiple zones — registration desk for arrivals, floor crew for program transitions, and wrap-up support for venue reset. The A/V team runs a dual-stage setup with synchronized lighting cues that shift the atmosphere from formal awards to relaxed after-party.',
    startDate: '2026-12-19T19:00:00+08:00',
    endDate: '2026-12-19T23:30:00+08:00',
    status: 'draft',
    createdBy: 'admin-user',
    photo: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=80',
    headline: 'A year-end celebration bringing together staff, partners, and community guests.',
    audience: 'Staff and partners',
    priceLabel: 'Internal event',
    registrationLabel: '172 / 350 seats planned',
    scheduleNote: 'Arrival from 7:00 PM, program begins 8:00 PM',
    stageCount: 2,
    volunteerNeed: '22 event crew across registration, floor, and wrap-up',
    hostTeam: ['Leadership', 'Guest Experience', 'Programming'],
    summary: 'Winter Welcome Gala closes the calendar year with a mixed program.',
    venueId: 'the-vault',
    createdAt: '2026-08-01T10:00:00+08:00',
    updatedAt: '2026-11-01T09:00:00+08:00'
  }
];

export const eventSessionRecords: EventSessionRecord[] = [
  // Summer Signal Festival (2 sessions)
  {
    id: 'ssf-opening-ceremony',
    eventId: 'summer-signal-festival',
    venueId: 'riverfront-pavilion',
    title: 'Opening Ceremony & Keynote',
    description: 'Welcome address from the programming director followed by the festival keynote on community-driven event culture.',
    startDatetime: '2026-07-18T17:00:00+08:00',
    endDatetime: '2026-07-18T18:30:00+08:00',
    status: 'posted',
    maxSlots: 420,
    createdAt: '2026-01-15T10:00:00+08:00',
    updatedAt: '2026-06-01T08:00:00+08:00'
  },
  {
    id: 'ssf-headline-set',
    eventId: 'summer-signal-festival',
    venueId: 'riverfront-pavilion',
    title: 'Headline Music Set',
    description: 'The main stage headline performance featuring three acts with full production support.',
    startDatetime: '2026-07-18T20:15:00+08:00',
    endDatetime: '2026-07-18T22:30:00+08:00',
    status: 'posted',
    maxSlots: 420,
    createdAt: '2026-01-15T10:00:00+08:00',
    updatedAt: '2026-06-01T08:00:00+08:00'
  },
  // Midnight Makers Market (3 sessions)
  {
    id: 'mmm-vendor-setup',
    eventId: 'midnight-makers-market',
    venueId: 'lantern-square',
    title: 'Vendor Setup Window',
    description: 'Designated load-in period for all registered vendors with assigned stall locations.',
    startDatetime: '2026-08-02T14:00:00+08:00',
    endDatetime: '2026-08-02T17:30:00+08:00',
    status: 'draft',
    maxSlots: null,
    createdAt: '2026-02-10T09:00:00+08:00',
    updatedAt: '2026-06-15T14:00:00+08:00'
  },
  {
    id: 'mmm-market-hours',
    eventId: 'midnight-makers-market',
    venueId: 'lantern-square',
    title: 'Public Market Hours',
    description: 'Main market session open to the public with all stalls, food vendors, and live music.',
    startDatetime: '2026-08-02T18:00:00+08:00',
    endDatetime: '2026-08-02T22:00:00+08:00',
    status: 'draft',
    maxSlots: 260,
    createdAt: '2026-02-10T09:00:00+08:00',
    updatedAt: '2026-06-15T14:00:00+08:00'
  },
  {
    id: 'mmm-workshop-tent',
    eventId: 'midnight-makers-market',
    venueId: 'lantern-square',
    title: 'Hands-On Workshop Tent',
    description: 'Rotating 45-minute workshops on craft techniques led by featured makers.',
    startDatetime: '2026-08-02T19:00:00+08:00',
    endDatetime: '2026-08-02T21:30:00+08:00',
    status: 'draft',
    maxSlots: 40,
    createdAt: '2026-02-10T09:00:00+08:00',
    updatedAt: '2026-06-15T14:00:00+08:00'
  },
  // Launchpad Live (3 sessions)
  {
    id: 'll-keynote',
    eventId: 'launchpad-live',
    venueId: 'harbor-warehouse',
    title: 'Opening Keynote & Product Reveal',
    description: 'Main stage keynote presentation followed by the headline product launch.',
    startDatetime: '2026-09-14T09:30:00+08:00',
    endDatetime: '2026-09-14T11:00:00+08:00',
    status: 'draft',
    maxSlots: 480,
    createdAt: '2026-03-05T11:00:00+08:00',
    updatedAt: '2026-07-01T16:00:00+08:00'
  },
  {
    id: 'll-demo-alley',
    eventId: 'launchpad-live',
    venueId: 'harbor-warehouse',
    title: 'Demo Alley & Hands-On Trials',
    description: 'Open-format demo area where attendees can try products and speak with build teams.',
    startDatetime: '2026-09-14T11:00:00+08:00',
    endDatetime: '2026-09-14T16:00:00+08:00',
    status: 'draft',
    maxSlots: null,
    createdAt: '2026-03-05T11:00:00+08:00',
    updatedAt: '2026-07-01T16:00:00+08:00'
  },
  {
    id: 'll-closing-panel',
    eventId: 'launchpad-live',
    venueId: 'harbor-warehouse',
    title: 'Closing Panel & Networking',
    description: 'Fireside panel with product leads followed by open networking with light refreshments.',
    startDatetime: '2026-09-14T16:00:00+08:00',
    endDatetime: '2026-09-14T18:00:00+08:00',
    status: 'draft',
    maxSlots: 480,
    createdAt: '2026-03-05T11:00:00+08:00',
    updatedAt: '2026-07-01T16:00:00+08:00'
  },
  // Greenhouse Donor Supper (2 sessions)
  {
    id: 'gds-reception',
    eventId: 'greenhouse-donor-supper',
    venueId: 'hillside-greenhouse',
    title: 'Welcome Reception',
    description: 'Arrival cocktails and canapés in the conservatory foyer with guided mingling.',
    startDatetime: '2026-10-09T18:30:00+08:00',
    endDatetime: '2026-10-09T19:30:00+08:00',
    status: 'draft',
    maxSlots: 180,
    createdAt: '2026-04-20T09:00:00+08:00',
    updatedAt: '2026-08-01T10:00:00+08:00'
  },
  {
    id: 'gds-dinner-program',
    eventId: 'greenhouse-donor-supper',
    venueId: 'hillside-greenhouse',
    title: 'Seated Dinner & Storytelling Program',
    description: 'Three-course dinner service with interspersed storytelling segments from community beneficiaries.',
    startDatetime: '2026-10-09T19:30:00+08:00',
    endDatetime: '2026-10-09T22:00:00+08:00',
    status: 'draft',
    maxSlots: 180,
    createdAt: '2026-04-20T09:00:00+08:00',
    updatedAt: '2026-08-01T10:00:00+08:00'
  },
  // Blueprint Design Summit (3 sessions)
  {
    id: 'bds-morning-keynote',
    eventId: 'blueprint-design-summit',
    venueId: 'neon-loft',
    title: 'Morning Keynote & Fireside Chat',
    description: 'Opening keynote from a leading design practitioner followed by a moderated fireside conversation.',
    startDatetime: '2026-11-06T09:30:00+08:00',
    endDatetime: '2026-11-06T11:00:00+08:00',
    status: 'posted',
    maxSlots: 500,
    createdAt: '2026-05-01T08:00:00+08:00',
    updatedAt: '2026-09-15T12:00:00+08:00'
  },
  {
    id: 'bds-breakout-a',
    eventId: 'blueprint-design-summit',
    venueId: 'neon-loft',
    title: 'Breakout Sessions — Track A (UX Systems)',
    description: 'Concurrent breakout sessions focused on design systems, accessibility patterns, and design-to-code workflows.',
    startDatetime: '2026-11-06T11:30:00+08:00',
    endDatetime: '2026-11-06T13:00:00+08:00',
    status: 'posted',
    maxSlots: 120,
    createdAt: '2026-05-01T08:00:00+08:00',
    updatedAt: '2026-09-15T12:00:00+08:00'
  },
  {
    id: 'bds-afternoon-critique',
    eventId: 'blueprint-design-summit',
    venueId: 'neon-loft',
    title: 'Portfolio Critique & Closing Panel',
    description: 'Small-group portfolio reviews with industry mentors, followed by a closing panel on design leadership.',
    startDatetime: '2026-11-06T14:00:00+08:00',
    endDatetime: '2026-11-06T17:30:00+08:00',
    status: 'posted',
    maxSlots: 200,
    createdAt: '2026-05-01T08:00:00+08:00',
    updatedAt: '2026-09-15T12:00:00+08:00'
  },
  // Ember Film Night (2 sessions)
  {
    id: 'efn-pre-show',
    eventId: 'ember-film-night',
    venueId: 'skyline-terrace',
    title: 'Pre-Show Reception',
    description: 'Rooftop arrival with ambient music, welcome drinks, and seat assignment.',
    startDatetime: '2026-11-21T18:30:00+08:00',
    endDatetime: '2026-11-21T19:15:00+08:00',
    status: 'posted',
    maxSlots: 280,
    createdAt: '2026-06-10T10:00:00+08:00',
    updatedAt: '2026-10-01T15:00:00+08:00'
  },
  {
    id: 'efn-screening',
    eventId: 'ember-film-night',
    venueId: 'skyline-terrace',
    title: 'Curated Short Films & Live Score',
    description: 'Main screening program with five award-winning short films accompanied by a live ambient score performed on stage.',
    startDatetime: '2026-11-21T19:15:00+08:00',
    endDatetime: '2026-11-21T22:00:00+08:00',
    status: 'posted',
    maxSlots: 280,
    createdAt: '2026-06-10T10:00:00+08:00',
    updatedAt: '2026-10-01T15:00:00+08:00'
  },
  // Founders Roundtable (1 session)
  {
    id: 'fr-breakfast',
    eventId: 'founders-roundtable',
    venueId: 'heritage-hall',
    title: 'Breakfast Roundtable Discussion',
    description:
      'Plated breakfast service with a facilitated discussion across three themed segments: fundraising landscape, talent retention, and product-market fit in SEA.',
    startDatetime: '2026-12-03T07:30:00+08:00',
    endDatetime: '2026-12-03T10:30:00+08:00',
    status: 'draft',
    maxSlots: 48,
    createdAt: '2026-07-15T08:00:00+08:00',
    updatedAt: '2026-10-20T11:00:00+08:00'
  },
  // Winter Welcome Gala (3 sessions)
  {
    id: 'wwg-arrival',
    eventId: 'winter-welcome-gala',
    venueId: 'the-vault',
    title: 'Arrival & Welcome Drinks',
    description: 'Guest arrivals with welcome drinks and ambient music in the lounge area.',
    startDatetime: '2026-12-19T19:00:00+08:00',
    endDatetime: '2026-12-19T20:00:00+08:00',
    status: 'draft',
    maxSlots: 350,
    createdAt: '2026-08-01T10:00:00+08:00',
    updatedAt: '2026-11-01T09:00:00+08:00'
  },
  {
    id: 'wwg-awards',
    eventId: 'winter-welcome-gala',
    venueId: 'the-vault',
    title: 'Year-End Awards & Recognition',
    description: 'Formal awards ceremony recognizing outstanding contributions across teams and partner organizations.',
    startDatetime: '2026-12-19T20:00:00+08:00',
    endDatetime: '2026-12-19T21:30:00+08:00',
    status: 'draft',
    maxSlots: 350,
    createdAt: '2026-08-01T10:00:00+08:00',
    updatedAt: '2026-11-01T09:00:00+08:00'
  },
  {
    id: 'wwg-afterparty',
    eventId: 'winter-welcome-gala',
    venueId: 'the-vault',
    title: 'After-Party & Lounge',
    description: 'Casual after-party with DJ set, open lounge seating, and late-night snacks.',
    startDatetime: '2026-12-19T21:30:00+08:00',
    endDatetime: '2026-12-19T23:30:00+08:00',
    status: 'draft',
    maxSlots: 350,
    createdAt: '2026-08-01T10:00:00+08:00',
    updatedAt: '2026-11-01T09:00:00+08:00'
  }
];

export const eventVolunteerRecords: EventVolunteerRecord[] = [
  // Summer Signal Festival
  { id: 'ev-ssf-maya', volunteerId: 'maya-chen', eventId: 'summer-signal-festival', status: 'joined', createdAt: '2026-06-01T08:00:00+08:00', updatedAt: null },
  {
    id: 'ev-ssf-diego',
    volunteerId: 'diego-santos',
    eventId: 'summer-signal-festival',
    status: 'joined',
    createdAt: '2026-06-01T08:00:00+08:00',
    updatedAt: null
  },
  {
    id: 'ev-ssf-oliver',
    volunteerId: 'oliver-ng',
    eventId: 'summer-signal-festival',
    status: 'joined',
    createdAt: '2026-06-01T08:00:00+08:00',
    updatedAt: null
  },
  { id: 'ev-ssf-leah', volunteerId: 'leah-tan', eventId: 'summer-signal-festival', status: 'joined', createdAt: '2026-06-01T08:00:00+08:00', updatedAt: null },
  // Midnight Makers Market
  {
    id: 'ev-mmm-anika',
    volunteerId: 'anika-rahman',
    eventId: 'midnight-makers-market',
    status: 'joined',
    createdAt: '2026-06-15T14:00:00+08:00',
    updatedAt: null
  },
  { id: 'ev-mmm-jun', volunteerId: 'jun-park', eventId: 'midnight-makers-market', status: 'pending', createdAt: '2026-06-15T14:00:00+08:00', updatedAt: null },
  // Launchpad Live
  { id: 'ev-ll-diego', volunteerId: 'diego-santos', eventId: 'launchpad-live', status: 'joined', createdAt: '2026-07-01T16:00:00+08:00', updatedAt: null },
  { id: 'ev-ll-leah', volunteerId: 'leah-tan', eventId: 'launchpad-live', status: 'joined', createdAt: '2026-07-01T16:00:00+08:00', updatedAt: null },
  { id: 'ev-ll-isaac', volunteerId: 'isaac-ong', eventId: 'launchpad-live', status: 'pending', createdAt: '2026-07-01T16:00:00+08:00', updatedAt: null },
  // Greenhouse Donor Supper
  {
    id: 'ev-gds-maya',
    volunteerId: 'maya-chen',
    eventId: 'greenhouse-donor-supper',
    status: 'joined',
    createdAt: '2026-08-01T10:00:00+08:00',
    updatedAt: null
  },
  {
    id: 'ev-gds-sara',
    volunteerId: 'sara-yusuf',
    eventId: 'greenhouse-donor-supper',
    status: 'joined',
    createdAt: '2026-08-01T10:00:00+08:00',
    updatedAt: null
  },
  // Blueprint Design Summit
  {
    id: 'ev-bds-diego',
    volunteerId: 'diego-santos',
    eventId: 'blueprint-design-summit',
    status: 'pending',
    createdAt: '2026-09-15T12:00:00+08:00',
    updatedAt: null
  },
  {
    id: 'ev-bds-sara',
    volunteerId: 'sara-yusuf',
    eventId: 'blueprint-design-summit',
    status: 'pending',
    createdAt: '2026-09-15T12:00:00+08:00',
    updatedAt: null
  },
  // Ember Film Night
  { id: 'ev-efn-leah', volunteerId: 'leah-tan', eventId: 'ember-film-night', status: 'joined', createdAt: '2026-10-01T15:00:00+08:00', updatedAt: null },
  { id: 'ev-efn-jun', volunteerId: 'jun-park', eventId: 'ember-film-night', status: 'pending', createdAt: '2026-10-01T15:00:00+08:00', updatedAt: null },
  // Founders Roundtable
  { id: 'ev-fr-sara', volunteerId: 'sara-yusuf', eventId: 'founders-roundtable', status: 'joined', createdAt: '2026-10-20T11:00:00+08:00', updatedAt: null },
  // Winter Welcome Gala
  { id: 'ev-wwg-maya', volunteerId: 'maya-chen', eventId: 'winter-welcome-gala', status: 'pending', createdAt: '2026-11-01T09:00:00+08:00', updatedAt: null },
  { id: 'ev-wwg-oliver', volunteerId: 'oliver-ng', eventId: 'winter-welcome-gala', status: 'pending', createdAt: '2026-11-01T09:00:00+08:00', updatedAt: null },
  {
    id: 'ev-wwg-anika',
    volunteerId: 'anika-rahman',
    eventId: 'winter-welcome-gala',
    status: 'pending',
    createdAt: '2026-11-01T09:00:00+08:00',
    updatedAt: null
  },
  { id: 'ev-wwg-jun', volunteerId: 'jun-park', eventId: 'winter-welcome-gala', status: 'pending', createdAt: '2026-11-01T09:00:00+08:00', updatedAt: null }
];

export const eventRatingRecords: EventRatingRecord[] = [
  {
    id: 'rating-ssf-1',
    userId: 'user-1',
    userName: 'Maria Santos',
    eventId: 'summer-signal-festival',
    overallRating: 4,
    organizationRating: 4,
    venueRating: 5,
    activitiesRating: 4,
    title: 'Great atmosphere and smooth entry',
    review: 'Well-organized festival with excellent sound quality at the main stage. The volunteer crew at registration kept the line moving quickly.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 3,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-07-20T10:00:00+08:00',
    updatedAt: '2026-07-20T10:00:00+08:00'
  },
  {
    id: 'rating-ssf-2',
    userId: 'user-2',
    userName: 'Kenji Reyes',
    eventId: 'summer-signal-festival',
    overallRating: 5,
    organizationRating: 5,
    venueRating: 4,
    activitiesRating: 5,
    title: 'Best festival edition yet',
    review: 'The headline set was unforgettable and the food vendors had great variety. Only minor complaint was the queue at the main bar area.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 7,
    creatorResponse: "Thanks Kenji — we're adding a second bar station next edition based on this feedback.",
    creatorRespondedAt: '2026-07-22T14:00:00+08:00',
    createdAt: '2026-07-21T09:00:00+08:00',
    updatedAt: '2026-07-22T14:00:00+08:00'
  },
  {
    id: 'rating-mmm-1',
    userId: 'user-3',
    userName: 'Aisha Tan',
    eventId: 'midnight-makers-market',
    overallRating: 4,
    organizationRating: 3,
    venueRating: 5,
    activitiesRating: 4,
    title: 'Lantern Square at night is magical',
    review: 'The venue was perfect for this kind of market. Stall layout was clear but the workshop sign-up process could be smoother.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 2,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-08-03T11:00:00+08:00',
    updatedAt: '2026-08-03T11:00:00+08:00'
  },
  {
    id: 'rating-mmm-2',
    userId: 'user-4',
    userName: 'Rico Bernal',
    eventId: 'midnight-makers-market',
    overallRating: 3,
    organizationRating: 3,
    venueRating: 4,
    activitiesRating: 3,
    title: 'Good concept, needs better flow',
    review: 'Loved the makers but the food area was cramped and harder to navigate than expected given the courtyard size.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 1,
    creatorResponse: 'Noted on the food area layout — we are rethinking the zone map for next season.',
    creatorRespondedAt: '2026-08-05T10:00:00+08:00',
    createdAt: '2026-08-04T15:00:00+08:00',
    updatedAt: '2026-08-05T10:00:00+08:00'
  },
  {
    id: 'rating-ll-1',
    userId: 'user-5',
    userName: 'Priya Nair',
    eventId: 'launchpad-live',
    overallRating: 4,
    organizationRating: 5,
    venueRating: 4,
    activitiesRating: 4,
    title: 'Production quality was top-tier',
    review: 'The main stage setup was incredibly polished and the demo alley had thoughtful product stations with knowledgeable staff.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 4,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-09-15T08:00:00+08:00',
    updatedAt: '2026-09-15T08:00:00+08:00'
  },
  {
    id: 'rating-ll-2',
    userId: 'user-6',
    userName: 'Andre Lim',
    eventId: 'launchpad-live',
    overallRating: 5,
    organizationRating: 5,
    venueRating: 5,
    activitiesRating: 5,
    title: 'Benchmark for industry expos',
    review: 'Every detail was accounted for — from the media briefing room to the sponsor lounge. Harbor Warehouse was the perfect choice for this scale.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 6,
    creatorResponse: 'Appreciate the kind words Andre — the production team will be thrilled to hear this.',
    creatorRespondedAt: '2026-09-16T12:00:00+08:00',
    createdAt: '2026-09-15T16:00:00+08:00',
    updatedAt: '2026-09-16T12:00:00+08:00'
  },
  {
    id: 'rating-bds-1',
    userId: 'user-1',
    userName: 'Maria Santos',
    eventId: 'blueprint-design-summit',
    overallRating: 5,
    organizationRating: 4,
    venueRating: 5,
    activitiesRating: 5,
    title: 'Inspiring content and great venue',
    review: 'The breakout rooms in Neon Loft worked perfectly for the critique sessions. The digital program booklet was a nice touch.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 5,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-11-07T09:00:00+08:00',
    updatedAt: '2026-11-07T09:00:00+08:00'
  },
  {
    id: 'rating-bds-2',
    userId: 'user-7',
    userName: 'Sofia Marquez',
    eventId: 'blueprint-design-summit',
    overallRating: 4,
    organizationRating: 4,
    venueRating: 4,
    activitiesRating: 4,
    title: 'Well-paced day with great speakers',
    review: 'The mix of keynotes and hands-on breakout sessions kept the energy up all day. Would love more networking time between sessions.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 2,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-11-08T11:00:00+08:00',
    updatedAt: '2026-11-08T11:00:00+08:00'
  },
  {
    id: 'rating-efn-1',
    userId: 'user-3',
    userName: 'Aisha Tan',
    eventId: 'ember-film-night',
    overallRating: 5,
    organizationRating: 5,
    venueRating: 5,
    activitiesRating: 4,
    title: 'A rooftop cinema dream',
    review:
      'The live score paired beautifully with the short films. Skyline Terrace at sunset was the perfect backdrop. The ushers were friendly and efficient.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 8,
    creatorResponse: 'Thank you Aisha! We were lucky with the weather and an incredible audience.',
    creatorRespondedAt: '2026-11-23T10:00:00+08:00',
    createdAt: '2026-11-22T10:00:00+08:00',
    updatedAt: '2026-11-23T10:00:00+08:00'
  },
  {
    id: 'rating-efn-2',
    userId: 'user-8',
    userName: 'Tomas Delgado',
    eventId: 'ember-film-night',
    overallRating: 4,
    organizationRating: 3,
    venueRating: 4,
    activitiesRating: 5,
    title: 'Film curation was outstanding',
    review: 'The short film selection was world-class. The only downside was a 15-minute delay in seating that pushed the screening start time.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 3,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-11-22T14:00:00+08:00',
    updatedAt: '2026-11-22T14:00:00+08:00'
  },
  {
    id: 'rating-fr-1',
    userId: 'user-9',
    userName: 'Elisa Cruz',
    eventId: 'founders-roundtable',
    overallRating: 5,
    organizationRating: 5,
    venueRating: 5,
    activitiesRating: 5,
    title: 'Exactly what the founder community needed',
    review: 'Candid, well-facilitated, and flawlessly organized. The breakfast service was seamless and the discussion segments were perfectly timed.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 4,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-12-04T08:00:00+08:00',
    updatedAt: '2026-12-04T08:00:00+08:00'
  },
  {
    id: 'rating-fr-2',
    userId: 'user-10',
    userName: 'David Huang',
    eventId: 'founders-roundtable',
    overallRating: 4,
    organizationRating: 4,
    venueRating: 4,
    activitiesRating: 4,
    title: 'Great conversations, intimate setting',
    review: 'The small group size made every conversation meaningful. Heritage Hall provided an elegant backdrop.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 1,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-12-04T12:00:00+08:00',
    updatedAt: '2026-12-04T12:00:00+08:00'
  },
  {
    id: 'rating-wwg-1',
    userId: 'user-2',
    userName: 'Kenji Reyes',
    eventId: 'winter-welcome-gala',
    overallRating: 4,
    organizationRating: 4,
    venueRating: 5,
    activitiesRating: 4,
    title: 'Strong finish to the year',
    review:
      'The Vault was an inspired choice — the lighting design transformed the space completely. Awards segment ran a bit long but the after-party made up for it.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 2,
    creatorResponse: null,
    creatorRespondedAt: null,
    createdAt: '2026-12-20T10:00:00+08:00',
    updatedAt: '2026-12-20T10:00:00+08:00'
  },
  {
    id: 'rating-wwg-2',
    userId: 'user-11',
    userName: 'Bea Fernandez',
    eventId: 'winter-welcome-gala',
    overallRating: 5,
    organizationRating: 5,
    venueRating: 5,
    activitiesRating: 5,
    title: 'Best gala the team has ever put on',
    review: 'From arrival drinks to the final DJ set, everything was on point. The volunteer crew was invisible — in the best way.',
    wouldRecommend: true,
    mediaUrls: null,
    helpfulCount: 3,
    creatorResponse: 'So glad you enjoyed it Bea — the whole team worked hard to make this one special.',
    creatorRespondedAt: '2026-12-21T09:00:00+08:00',
    createdAt: '2026-12-20T16:00:00+08:00',
    updatedAt: '2026-12-21T09:00:00+08:00'
  }
];

// ── Lookup functions ───────────────────────────────────────────────────────────

export function getEventDetailById(eventId: string): EventDetailRecord | null {
  return eventDetailRecords.find((e) => e.id === eventId) ?? null;
}

export function getSessionsByEventId(eventId: string): EventSessionRecord[] {
  return eventSessionRecords.filter((s) => s.eventId === eventId);
}

export function getEventVolunteersByEventId(eventId: string): EventVolunteerRecord[] {
  return eventVolunteerRecords.filter((v) => v.eventId === eventId);
}

export function getRatingsByEventId(eventId: string): EventRatingRecord[] {
  return eventRatingRecords.filter((r) => r.eventId === eventId);
}
