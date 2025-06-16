import type { Event, ItineraryItem } from '@/types/events'

// Portugal Golf Trip - 4 days, 3 nights
// June 20-23, 2025
const tripStartDate = new Date('2025-06-20')
const tripEndDate = new Date('2025-06-23')

export const portugalGolfTripEvent: Event = {
  id: 'portugal-golf-2025',
  title: 'Portugal Golf Weekend',
  description: 'Four-day golf trip to Portugal featuring two championship courses, luxury accommodation, and authentic Portuguese dining experiences.',
  type: 'adventure',
  status: 'published',
  startDate: tripStartDate,
  endDate: tripEndDate,
  location: 'Quinta do Lago, Algarve, Portugal',
  maxParticipants: 8,
  currentParticipants: ['1', '2', '3', '4', '5', '6'], // 6 members going
  createdBy: '2', // James Crawford (Commodore)
  createdAt: new Date('2025-01-15T10:00:00'),
  updatedAt: new Date('2025-02-01T14:30:00'),
  itinerary: [], // Will be populated with itineraryItems below
  estimatedCost: 1250,
  isPublic: true
}

export const portugalGolfItinerary: ItineraryItem[] = [
  // DAY 1 - March 15, 2025 - Travel Day
  {
    id: 'pg-flight-outbound',
    eventId: 'portugal-golf-2025',
    type: 'travel',
    title: 'Flight to Faro',
    description: 'Direct flight from Glasgow to Faro Airport',
    startTime: '06:30',
    endTime: '11:45',
    location: 'Glasgow Airport (GLA) → Faro Airport (FAO)',
    cost: 285,
    notes: 'Check-in opens at 04:30. Meet at Departures Level 1, near WHSmith',
    order: 1,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    travelMethod: 'Flight',
    departureLocation: 'Glasgow Airport Terminal 1',
    arrivalLocation: 'Faro Airport Terminal 1',
    confirmation: 'RYANAIR-XYZ789'
  },
  {
    id: 'pg-transfer-airport-hotel',
    eventId: 'portugal-golf-2025',
    type: 'travel',
    title: 'Airport Transfer to Hotel',
    description: 'Private coach transfer from Faro Airport to Quinta do Lago resort',
    startTime: '12:30',
    endTime: '13:15',
    location: 'Faro Airport → Conrad Algarve',
    cost: 45,
    notes: 'Driver will be waiting with Errolian Club sign at Arrivals',
    order: 2,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    travelMethod: 'Private Coach',
    departureLocation: 'Faro Airport Arrivals',
    arrivalLocation: 'Conrad Algarve Hotel',
    confirmation: 'TRANSFER-001'
  },
  {
    id: 'pg-hotel-checkin',
    eventId: 'portugal-golf-2025',
    type: 'accommodation',
    title: 'Hotel Check-in',
    description: 'Check into Conrad Algarve luxury resort with golf course views',
    startTime: '14:00',
    endTime: '15:00',
    location: 'Conrad Algarve, Quinta do Lago',
    cost: 320,
    notes: 'All rooms have balconies overlooking the golf course. Spa and pool access included',
    order: 3,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    accommodationType: 'Hotel',
    address: 'Estrada da Quinta do Lago, 8135-106 Almancil, Portugal',
    checkIn: '2025-03-15',
    checkOut: '2025-03-18',
    confirmation: 'CONRAD-ALG-456789'
  },
  {
    id: 'pg-lunch-day1',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Welcome Lunch',
    description: 'Traditional Portuguese seafood lunch at Gigi Beach Bar',
    startTime: '15:30',
    endTime: '17:00',
    location: 'Gigi Beach Bar, Quinta do Lago',
    cost: 65,
    notes: 'Beachfront location with fresh grilled fish and sangria',
    order: 4,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'lunch',
    cuisine: 'Portuguese Seafood',
    reservation: 'GIGI-150325-18:30'
  },
  {
    id: 'pg-dinner-day1',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Dinner at Bovino Steakhouse',
    description: 'Premium steakhouse dinner with Portuguese wines',
    startTime: '19:30',
    endTime: '22:00',
    location: 'Bovino Steakhouse, Quinta do Lago',
    cost: 95,
    notes: 'Dry-aged steaks and local Douro wines. Smart casual dress code',
    order: 5,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'dinner',
    cuisine: 'Steakhouse',
    reservation: 'BOVINO-150325-19:30'
  },

  // DAY 2 - March 16, 2025 - First Golf Day
  {
    id: 'pg-breakfast-day2',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Breakfast at Conrad',
    description: 'Continental breakfast at hotel restaurant',
    startTime: '07:30',
    endTime: '08:30',
    location: 'Conrad Algarve Restaurant',
    cost: 35,
    notes: 'Full continental spread with fresh pastries and coffee',
    order: 6,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'breakfast',
    cuisine: 'Continental',
    reservation: 'Hotel Guest'
  },
  {
    id: 'pg-golf-round1',
    eventId: 'portugal-golf-2025',
    type: 'activity',
    title: 'Golf Round 1 - Quinta do Lago South',
    description: '18 holes at the prestigious South Course with spectacular ocean views',
    startTime: '09:30',
    endTime: '13:30',
    location: 'Quinta do Lago South Course',
    cost: 175,
    notes: 'Tee time 09:30. Caddies available for €40. Dress code: golf attire required',
    order: 7,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    category: 'Sports',
    duration: 4,
    difficulty: 'moderate',
    requirements: 'Golf clubs (rental available), golf attire, soft spikes'
  },
  {
    id: 'pg-lunch-day2',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Lunch at Clubhouse',
    description: 'Post-golf lunch at Quinta do Lago Clubhouse',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Quinta do Lago Clubhouse',
    cost: 45,
    notes: 'Overlooking the 18th green with classic club atmosphere',
    order: 8,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'lunch',
    cuisine: 'Club Restaurant',
    reservation: 'Course Package'
  },
  {
    id: 'pg-spa-time',
    eventId: 'portugal-golf-2025',
    type: 'activity',
    title: 'Spa & Pool Time',
    description: 'Relaxation time at Conrad Spa and pool complex',
    startTime: '16:00',
    endTime: '18:00',
    location: 'Conrad Algarve Spa',
    cost: 0,
    notes: 'Included with hotel stay. Sauna, steam room, and infinity pool',
    order: 9,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    category: 'Entertainment',
    duration: 2,
    difficulty: 'easy',
    requirements: 'Swimwear, spa slippers (provided)'
  },
  {
    id: 'pg-dinner-day2',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Dinner at Supper Club',
    description: 'Fine dining at Casa do Lago with lake views',
    startTime: '20:00',
    endTime: '23:00',
    location: 'Casa do Lago, Quinta do Lago',
    cost: 125,
    notes: 'Michelin-recommended restaurant with innovative Portuguese cuisine',
    order: 10,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'dinner',
    cuisine: 'Fine Dining Portuguese',
    reservation: 'CASA-160325-20:00'
  },

  // DAY 3 - March 17, 2025 - Second Golf Day & Cigar Evening
  {
    id: 'pg-breakfast-day3',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Breakfast at Conrad',
    description: 'Continental breakfast at hotel restaurant',
    startTime: '07:30',
    endTime: '08:30',
    location: 'Conrad Algarve Restaurant',
    cost: 35,
    notes: 'Same excellent spread as yesterday',
    order: 11,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'breakfast',
    cuisine: 'Continental',
    reservation: 'Hotel Guest'
  },
  {
    id: 'pg-transfer-to-laranjal',
    eventId: 'portugal-golf-2025',
    type: 'travel',
    title: 'Transfer to Laranjal Golf',
    description: 'Private coach to Quinta do Laranjal Golf Course',
    startTime: '08:45',
    endTime: '09:15',
    location: 'Conrad Algarve → Laranjal Golf',
    cost: 25,
    notes: 'Beautiful scenic route through Portuguese countryside',
    order: 12,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    travelMethod: 'Private Coach',
    departureLocation: 'Conrad Algarve Hotel',
    arrivalLocation: 'Laranjal Golf Course',
    confirmation: 'TRANSFER-002'
  },
  {
    id: 'pg-golf-round2',
    eventId: 'portugal-golf-2025',
    type: 'activity',
    title: 'Golf Round 2 - Laranjal Golf Course',
    description: '18 holes at this challenging parkland course with cork trees',
    startTime: '09:30',
    endTime: '13:30',
    location: 'Quinta do Laranjal Golf Course',
    cost: 155,
    notes: 'Tee time 09:30. More challenging course with unique cork tree hazards',
    order: 13,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    category: 'Sports',
    duration: 4,
    difficulty: 'challenging',
    requirements: 'Golf clubs, golf attire, soft spikes, extra balls recommended'
  },
  {
    id: 'pg-lunch-day3',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Lunch at Laranjal Clubhouse',
    description: 'Traditional Portuguese lunch at the golf course restaurant',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Laranjal Golf Clubhouse',
    cost: 55,
    notes: 'Try the famous francesinha sandwich and local wines',
    order: 14,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'lunch',
    cuisine: 'Traditional Portuguese',
    reservation: 'Course Package'
  },
  {
    id: 'pg-transfer-return-hotel',
    eventId: 'portugal-golf-2025',
    type: 'travel',
    title: 'Return Transfer to Hotel',
    description: 'Private coach back to Conrad Algarve',
    startTime: '16:00',
    endTime: '16:30',
    location: 'Laranjal Golf → Conrad Algarve',
    cost: 25,
    notes: 'Time to rest before the evening festivities',
    order: 15,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    travelMethod: 'Private Coach',
    departureLocation: 'Laranjal Golf Course',
    arrivalLocation: 'Conrad Algarve Hotel',
    confirmation: 'TRANSFER-003'
  },
  {
    id: 'pg-cigar-evening',
    eventId: 'portugal-golf-2025',
    type: 'activity',
    title: 'Cigar & Whisky Evening',
    description: 'Exclusive cigar tasting with premium Portuguese brandies and single malts',
    startTime: '19:00',
    endTime: '22:00',
    location: 'Cigar Lounge, Conrad Algarve',
    cost: 85,
    notes: 'Cuban cigars paired with aged spirits. Private terrace with golf course views',
    order: 16,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    category: 'Entertainment',
    duration: 3,
    difficulty: 'easy',
    requirements: 'Smart casual attire, appreciation for fine cigars'
  },
  {
    id: 'pg-late-dinner-day3',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Late Dinner at Willie\'s Restaurant',
    description: 'Relaxed dinner with Portuguese comfort food',
    startTime: '22:30',
    endTime: '00:30',
    location: 'Willie\'s Restaurant, Quinta do Lago',
    cost: 75,
    notes: 'Casual atmosphere perfect after cigar evening. Famous for seafood cataplana',
    order: 17,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'dinner',
    cuisine: 'Portuguese Comfort Food',
    reservation: 'WILLIES-170325-22:30'
  },

  // DAY 4 - March 18, 2025 - Departure Day
  {
    id: 'pg-breakfast-day4',
    eventId: 'portugal-golf-2025',
    type: 'meal',
    title: 'Final Breakfast',
    description: 'Last breakfast at Conrad before departure',
    startTime: '08:00',
    endTime: '09:00',
    location: 'Conrad Algarve Restaurant',
    cost: 35,
    notes: 'Make sure to try the fresh orange juice one last time',
    order: 18,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    mealType: 'breakfast',
    cuisine: 'Continental',
    reservation: 'Hotel Guest'
  },
  {
    id: 'pg-hotel-checkout',
    eventId: 'portugal-golf-2025',
    type: 'accommodation',
    title: 'Hotel Check-out',
    description: 'Check out of Conrad Algarve and collect luggage',
    startTime: '10:00',
    endTime: '10:30',
    location: 'Conrad Algarve Reception',
    cost: 0,
    notes: 'Settle any outstanding charges and arrange luggage storage if needed',
    order: 19,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    accommodationType: 'Hotel',
    address: 'Estrada da Quinta do Lago, 8135-106 Almancil, Portugal',
    checkIn: '2025-03-15',
    checkOut: '2025-03-18',
    confirmation: 'CONRAD-ALG-456789'
  },
  {
    id: 'pg-transfer-hotel-airport',
    eventId: 'portugal-golf-2025',
    type: 'travel',
    title: 'Transfer to Airport',
    description: 'Private coach transfer from hotel to Faro Airport',
    startTime: '11:00',
    endTime: '11:45',
    location: 'Conrad Algarve → Faro Airport',
    cost: 45,
    notes: 'Allow extra time for check-in and security',
    order: 20,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    travelMethod: 'Private Coach',
    departureLocation: 'Conrad Algarve Hotel',
    arrivalLocation: 'Faro Airport Terminal 1',
    confirmation: 'TRANSFER-004'
  },
  {
    id: 'pg-flight-return',
    eventId: 'portugal-golf-2025',
    type: 'travel',
    title: 'Return Flight to Glasgow',
    description: 'Direct flight from Faro to Glasgow Airport',
    startTime: '14:20',
    endTime: '19:35',
    location: 'Faro Airport (FAO) → Glasgow Airport (GLA)',
    cost: 285,
    notes: 'Flight includes meal service. Arrive Glasgow at 19:35 local time',
    order: 21,
    createdAt: new Date('2025-01-15T10:00:00'),
    updatedAt: new Date('2025-02-01T14:30:00'),
    travelMethod: 'Flight',
    departureLocation: 'Faro Airport Terminal 1',
    arrivalLocation: 'Glasgow Airport Terminal 1',
    confirmation: 'RYANAIR-ABC123'
  }
]

// Update the main event to include the itinerary
portugalGolfTripEvent.itinerary = portugalGolfItinerary

// Export additional utility functions for calendar display
export const getPortugalTripEventsByDate = (date: Date): ItineraryItem[] => {
  const dateStr = date.toISOString().split('T')[0]
  const tripStartStr = '2025-06-20'
  const tripEndStr = '2025-06-23'
  
  if (dateStr >= tripStartStr && dateStr <= tripEndStr) {
    // Calculate which day of the trip this is
    const tripStartDate = new Date(tripStartStr)
    const daysDiff = Math.floor((date.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Filter itinerary items for this specific day
    return portugalGolfItinerary.filter(item => {
      const itemStartDate = new Date('2025-06-20')
      itemStartDate.setDate(itemStartDate.getDate() + daysDiff)
      
      // Match items that belong to this day
      switch (daysDiff) {
        case 0: // June 20 - Travel day
          return ['pg-flight-outbound', 'pg-transfer-airport-hotel', 'pg-hotel-checkin', 'pg-lunch-day1', 'pg-dinner-day1'].includes(item.id)
        case 1: // June 21 - First golf day
          return ['pg-breakfast-day2', 'pg-golf-round1', 'pg-lunch-day2', 'pg-spa-time', 'pg-dinner-day2'].includes(item.id)
        case 2: // June 22 - Second golf day & cigar evening
          return ['pg-breakfast-day3', 'pg-transfer-to-laranjal', 'pg-golf-round2', 'pg-lunch-day3', 'pg-transfer-return-hotel', 'pg-cigar-evening', 'pg-late-dinner-day3'].includes(item.id)
        case 3: // June 23 - Departure day
          return ['pg-breakfast-day4', 'pg-hotel-checkout', 'pg-transfer-hotel-airport', 'pg-flight-return'].includes(item.id)
        default:
          return false
      }
    })
  }
  return []
}

export const getPortugalTripColors = () => ({
  travel: '#bae6fd', // event-sky
  accommodation: '#d7c6ff', // event-violet  
  activity: '#fde68a', // event-amber
  meal: '#fecaca', // event-rose
  other: '#d7c6ff' // fallback color
})