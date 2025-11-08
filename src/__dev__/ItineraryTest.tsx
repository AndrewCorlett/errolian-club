import { useState } from 'react'
import ItineraryBuilder from '@/components/calendar/ItineraryBuilder'
import type { ItineraryItem } from '@/types/events'

export default function ItineraryTest() {
  const [items, setItems] = useState<ItineraryItem[]>([])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Itinerary Test Page</h1>
        <ItineraryBuilder
          items={items}
          onItemsChange={setItems}
          eventDate={new Date()}
        />
      </div>
    </div>
  )
}