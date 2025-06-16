import type { Event, ItineraryItem } from '@/types/events'

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Blue Mountains Hiking Adventure',
    description: 'A weekend hiking trip to the Blue Mountains with scenic views, waterfall visits, and camping under the stars.',
    type: 'adventure',
    status: 'published',
    startDate: new Date('2025-01-20T09:00:00'),
    endDate: new Date('2025-01-21T18:00:00'),
    location: 'Blue Mountains National Park',
    maxParticipants: 12,
    currentParticipants: ['1', '2', '3', '4', '5', '6'],
    createdBy: '2', // James Crawford (Commodore)
    createdAt: new Date('2024-06-01T10:00:00'),
    updatedAt: new Date('2024-06-15T14:30:00'),
    itinerary: [
      {
        id: 'i1',
        eventId: '1',
        type: 'travel',
        title: 'Departure from Sydney Central',
        description: 'Meet at Platform 1 for train departure',
        startTime: '09:00',
        endTime: '11:30',
        location: 'Central Station, Sydney',
        cost: 25,
        notes: 'Bring train ticket and day pack',
        order: 1,
        createdAt: new Date('2024-06-01T10:00:00'),
        updatedAt: new Date('2024-06-15T14:30:00')
      },
      {
        id: 'i2',
        eventId: '1',
        type: 'activity',
        title: 'Three Sisters Lookout',
        description: 'Photo stop and short walk around the famous Three Sisters rock formation',
        startTime: '12:00',
        endTime: '13:00',
        location: 'Echo Point, Katoomba',
        cost: 0,
        notes: 'Don\'t forget your camera for stunning views',
        order: 2,
        createdAt: new Date('2024-06-01T10:00:00'),
        updatedAt: new Date('2024-06-15T14:30:00')
      },
      {
        id: 'i3',
        eventId: '1',
        type: 'meal',
        title: 'Lunch at Mountain Cafe',
        description: 'Group lunch with mountain views',
        startTime: '13:00',
        endTime: '14:00',
        location: 'Katoomba',
        cost: 18,
        notes: 'Vegetarian and dietary options available',
        order: 3,
        createdAt: new Date('2024-06-01T10:00:00'),
        updatedAt: new Date('2024-06-15T14:30:00')
      }
    ],
    estimatedCost: 180,
    isPublic: true
  },
  {
    id: '2',
    title: 'Morning Coffee Meetup',
    description: 'Casual coffee meetup to discuss weekend plans and upcoming adventures.',
    type: 'social',
    status: 'published',
    startDate: new Date('2025-01-15T08:30:00'),
    endDate: new Date('2025-01-15T10:00:00'),
    location: 'Harbour Cafe, Circular Quay',
    maxParticipants: 8,
    currentParticipants: ['1', '2', '4', '5'],
    createdBy: '1', // Sarah Wellington (Super Admin)
    createdAt: new Date('2024-06-05T09:00:00'),
    updatedAt: new Date('2024-06-20T16:45:00'),
    itinerary: [],
    estimatedCost: 15,
    isPublic: true
  },
  {
    id: '6',
    title: 'Monthly Club Meeting - January',
    description: 'Monthly meeting to discuss upcoming events, budget review, and new member introductions.',
    type: 'meeting',
    status: 'published',
    startDate: new Date('2025-01-15T19:00:00'),
    endDate: new Date('2025-01-15T21:00:00'),
    location: 'Community Center - Room B',
    maxParticipants: 25,
    currentParticipants: ['1', '2', '3', '4', '5', '7', '8', '10'],
    createdBy: '1', // Sarah Wellington (Super Admin)
    createdAt: new Date('2024-06-05T09:00:00'),
    updatedAt: new Date('2024-06-20T16:45:00'),
    itinerary: [],
    estimatedCost: 0,
    isPublic: false
  },
  {
    id: '3',
    title: 'Rock Climbing Workshop',
    description: 'Beginner-friendly rock climbing workshop with certified instructors. All equipment provided.',
    type: 'training',
    status: 'published',
    startDate: new Date('2025-01-18T10:00:00'),
    endDate: new Date('2025-01-18T16:00:00'),
    location: 'Indoor Climbing Gym',
    maxParticipants: 8,
    currentParticipants: ['5', '6', '7', '8'],
    createdBy: '3', // Alice Parker (Officer)
    createdAt: new Date('2024-06-10T11:00:00'),
    updatedAt: new Date('2024-06-25T13:20:00'),
    itinerary: [
      {
        id: 'i4',
        eventId: '3',
        type: 'activity',
        title: 'Safety Briefing & Equipment Check',
        description: 'Introduction to climbing safety and equipment fitting',
        startTime: '10:00',
        endTime: '10:30',
        location: 'Climbing Gym - Training Room',
        cost: 0,
        notes: 'Mandatory attendance for all participants',
        order: 1,
        createdAt: new Date('2024-06-10T11:00:00'),
        updatedAt: new Date('2024-06-25T13:20:00')
      },
      {
        id: 'i5',
        eventId: '3',
        type: 'activity',
        title: 'Basic Climbing Techniques',
        description: 'Learn basic holds, body positioning, and movement',
        startTime: '10:30',
        endTime: '12:00',
        location: 'Climbing Gym - Beginner Wall',
        cost: 0,
        notes: 'Comfortable athletic wear recommended',
        order: 2,
        createdAt: new Date('2024-06-10T11:00:00'),
        updatedAt: new Date('2024-06-25T13:20:00')
      },
      {
        id: 'i6',
        eventId: '3',
        type: 'meal',
        title: 'Lunch Break',
        description: 'Catered lunch and group discussion',
        startTime: '12:00',
        endTime: '13:00',
        location: 'Climbing Gym - Cafe',
        cost: 15,
        notes: 'Please inform us of any dietary restrictions',
        order: 3,
        createdAt: new Date('2024-06-10T11:00:00'),
        updatedAt: new Date('2024-06-25T13:20:00')
      }
    ],
    estimatedCost: 85,
    isPublic: true
  },
  {
    id: '4',
    title: 'Summer BBQ & Social',
    description: 'End of summer BBQ party with games, music, and good food. Bring your family and friends!',
    type: 'social',
    status: 'draft',
    startDate: new Date('2024-08-10T17:00:00'),
    endDate: new Date('2024-08-10T22:00:00'),
    location: 'Riverside Park - Pavilion A',
    maxParticipants: 30,
    currentParticipants: [],
    createdBy: '4', // Mike Chen (Officer)
    createdAt: new Date('2024-06-20T15:00:00'),
    updatedAt: new Date('2024-06-28T12:10:00'),
    itinerary: [],
    estimatedCost: 25,
    isPublic: true
  },
  {
    id: '5',
    title: 'Coastal Kayaking Expedition',
    description: 'Three-day coastal kayaking adventure with overnight camping on secluded beaches.',
    type: 'adventure',
    status: 'published',
    startDate: new Date('2024-08-25T08:00:00'),
    endDate: new Date('2024-08-27T17:00:00'),
    location: 'Jervis Bay Marine Park',
    maxParticipants: 10,
    currentParticipants: ['1', '2', '4', '6', '10'],
    createdBy: '2', // James Crawford (Commodore)
    createdAt: new Date('2024-06-15T14:00:00'),
    updatedAt: new Date('2024-07-01T09:30:00'),
    itinerary: [],
    estimatedCost: 320,
    isPublic: true
  }
]

export const mockItinerary: ItineraryItem[] = [
  {
    id: 'i1',
    eventId: '1',
    type: 'travel',
    title: 'Departure from Sydney',
    description: 'Meet at Central Station, Platform 1',
    startTime: '09:00',
    endTime: '11:30',
    location: 'Central Station, Sydney',
    cost: 25,
    notes: 'Bring train ticket and day pack',
    order: 1,
    createdAt: new Date('2024-06-01T10:00:00'),
    updatedAt: new Date('2024-06-15T14:30:00')
  },
  {
    id: 'i2',
    eventId: '1',
    type: 'activity',
    title: 'Three Sisters Lookout',
    description: 'Photo stop and short walk around the famous Three Sisters rock formation',
    startTime: '11:30',
    endTime: '12:30',
    location: 'Echo Point, Katoomba',
    cost: 0,
    notes: 'Perfect photo opportunity, bring your camera',
    order: 2,
    createdAt: new Date('2024-06-01T10:00:00'),
    updatedAt: new Date('2024-06-15T14:30:00')
  },
  {
    id: 'i3',
    eventId: '1',
    type: 'meal',
    title: 'Lunch at Local Cafe',
    description: 'Delicious local cuisine with mountain atmosphere',
    startTime: '12:30',
    endTime: '13:30',
    location: 'Katoomba',
    cost: 18,
    notes: 'Cash and card accepted',
    order: 3,
    createdAt: new Date('2024-06-01T10:00:00'),
    updatedAt: new Date('2024-06-15T14:30:00')
  },
  {
    id: 'i4',
    eventId: '1',
    type: 'activity',
    title: 'Wentworth Falls Hike',
    description: 'Moderate 4km return hike to the base of Wentworth Falls',
    startTime: '14:00',
    endTime: '17:00',
    location: 'Wentworth Falls',
    cost: 0,
    notes: 'Bring plenty of water and wear hiking boots',
    order: 4,
    createdAt: new Date('2024-06-01T10:00:00'),
    updatedAt: new Date('2024-06-15T14:30:00')
  },
  {
    id: 'i5',
    eventId: '1',
    type: 'accommodation',
    title: 'Camping Setup',
    description: 'Set up tents at designated camping area',
    startTime: '18:00',
    endTime: '19:00',
    location: 'Blue Mountains Camping Ground',
    cost: 35,
    notes: 'Camping equipment provided, just bring personal items',
    order: 5,
    createdAt: new Date('2024-06-01T10:00:00'),
    updatedAt: new Date('2024-06-15T14:30:00')
  }
]

export function getEventById(id: string): Event | undefined {
  return mockEvents.find(event => event.id === id)
}

export function getUpcomingEvents(): Event[] {
  const now = new Date()
  return mockEvents
    .filter(event => event.startDate > now && event.status === 'published')
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

export function getEventsByCreator(userId: string): Event[] {
  return mockEvents.filter(event => event.createdBy === userId)
}

export function getUserEvents(userId: string): Event[] {
  return mockEvents.filter(event => 
    event.currentParticipants.includes(userId) || event.createdBy === userId
  )
}