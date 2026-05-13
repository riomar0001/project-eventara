/**
 * Mock API integration layer
 * This file marks all future API integration points with TODO comments
 * Once real endpoints are available, replace mock data with API calls
 */

// TODO: Replace MOCK_EVENTS with GET /api/events
// Expected endpoint: GET /api/events?category=<categoryId>&limit=10&offset=0
// Expected response: { success: true, data: Event[], total: number }

// TODO: Replace LIVE_EVENT with GET /api/events/live
// Expected endpoint: GET /api/events/live
// Expected response: { success: true, data: LiveEvent }

// TODO: Add POST /api/events/<eventId>/register
// Expected endpoint: POST /api/events/<eventId>/register
// Expected response: { success: true, message: "Registered successfully", data: Registration }
// Payload: { userId: string }

// TODO: Add GET /api/events/<eventId>
// Expected endpoint: GET /api/events/<eventId>
// Expected response: { success: true, data: Event }

// TODO: Add GET /api/event-categories
// Expected endpoint: GET /api/event-categories
// Expected response: { success: true, data: EventCategory[] }

export {};
