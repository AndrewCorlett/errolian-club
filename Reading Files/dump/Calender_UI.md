# 📅 Errolian Club — Calendar & Itinerary UI Specification  
*Reference mock-up: `{{/assets/Flow v1.jpg}}`*

## 0. Tech stack & conventions
- **Framework**: React 18 (+ Next.js app-router)  
- **Styling**: Tailwind CSS v3 (shadcn/ui primitives)  
- **State**: zod-validated React Context + React-Query for persistence  
- **Date utils**: dayjs (UTC everywhere; localised display)  
- **Colour tokens**:  
  | Token | Hex  | Use-case |
  |-------|------|----------|
  | `event-violet` | #d7c6ff | default events |
  | `event-sky`    | #bae6fd | travel / flights |
  | `event-amber`  | #fde68a | attractions |
  | `event-rose`   | #fecaca | food / dining |
- **Accessibility**: All interactive elements must pass WCAG 2.2 AA (focus ring, ARIA‐labels, 3 : 1 contrast on coloured pills).

---

## 1 · `<CalendarPage />` (Route: `/calendar`)
### 1.1 Fixed Header (`<CalendarHeader />`)
| Prop | Type | Description |
|------|------|-------------|
| `displayedMonth` | `Date` | Month currently shown in grid |
| `onFilterToggle()` | `() => void` | Opens filter sheet |

- Layout: 56 px height, stays pinned (CSS `position: sticky; top: 0`).
- Content: chevron-left / chevron-right (month nav), **Month YYYY** text, filter-icon button.
- Behaviour: on vertical scroll end **IntersectionObserver** updates `displayedMonth`.

### 1.2 Month Grid (`<MonthGridCalendar />`)
| Prop | Type | Description |
|------|------|-------------|
| `yearMonth` | `Date` | month to render |
| `events` | `CalendarEvent[]` | colour-coded pills per date |
| `onDayShortPress(date)` | `(Date)=>void` | opens **Day View** |
| `onDayLongPress(date)` | `(Date)=>void` | opens **New Event Sheet** |

- 7-column CSS grid; infinite vertical scroll via “windowed” list (react-virtual).
- **Pill placement**: up to 3 visible; if >3 use “+ N” overflow badge.

### 1.3 Event Feed Toggle
- Segmented control **“Calendar / Upcoming”**.  
- If *Upcoming* selected show `<UpcomingList events={next7Days}/>`, else show month grid.

### 1.4 Global FAB “＋”
- Absolute-position bottom-right; triggers New Event Sheet with no pre-selected date.

---

## 2 · `<NewEventSheet />`
Sheet height snap-points: ['45%','85%'] (shadcn/ui Sheet).

### Required fields
| Field | UI Control | Notes |
|-------|------------|-------|
| Title | TextInput | autofocus |
| Location | Google Places autocomplete (optional) |
| All-day toggle | Switch | hides time pickers when true |
| Start / End | DateTime picker | validate `end > start` |
| Colour | Token radio pill | default=`event-violet` |
| Invitees | Multi-email chips | allow contacts lookup |
| Trip Details | Multiline textarea | collapsible “More details” |

### Footer actions
- Primary **Save Event** (disabled until required fields valid).
- Secondary grey **Convert to Itinerary** toggle → pushes `<ItinerarySheet />`.

---

## 3 · `<ItineraryPage tripId>` (Route: `/trip/[id]`)
### 3.1 Header Tabs
<Event | Itinerary>
- Controlled by URL query `?tab=event|itinerary`.

### 3.2 Add-Item Button
- Top of page, sticky under tabs.  
- Opens `<PlanItemSheet tripId={id} defaultDate={currentDay}/>`.

### 3.3 Day View Timeline (`<TripDayTimeline />`)
| Prop | Type | Description |
|------|------|-------------|
| `date` | `Date` | timeline day |
| `items` | `ItineraryItem[]` | render as EventBlocks |
| `onItemPress(id)` | `(string)=>void` | open **Edit Item** |

- 24-row flex column (1 row = 60 min).  
- **Overlap logic**: use CSS `grid-auto-flow: column` so clashing items stack side-by-side.  
- **Text clipping**: `line-clamp-1` + ellipsis.

---

## 4 · `<DayViewSheet date>` (from CalendarPage short press)
### 4.1 Horizontal Date Scroller
- 7-day range centred on selected date; scroll-snap to day; “＋” FAB inside header acts on current day.

### 4.2 Day Timeline (`reuse <TripDayTimeline />`)
- Merges both **CalendarEvents** and **ItineraryItems** visually (different token colours).

### 4.3 On Item Press
- If plain calendar event → open `<NewEventSheet eventId>` in edit mode.  
- If itinerary item → open `<ItineraryDetailSheet itemId>`.

---

## 5 · `<ItineraryDetailSheet />`
| Field | UI | Data source |
|-------|----|-------------|
| Title & Time | H-stack text | item.title, item.start–end |
| Booking Links | Button stack | item.bookingUrls[] |
| Static Map | `<GoogleMapStatic lat lng />` | optional |
| Cost | Badge “Cost: £123 / Paid by: Chloe” |

---

## 6 · `<PlanItemSheet />` (create / edit itinerary event)
Same skeleton as **NewEventSheet** but with extra fields:
- **Category tabs**: `Accommodation · Transport · Experience · Other`  
- **Pricing details**: input cost, currency, paid-by drop-down.  
- **Save to itinerary** primary button.

---

## 7 · Data Models (zod)
```ts
// calendar-event.ts
export const CalendarEvent = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  location: z.string().optional(),
  start: z.date(),
  end: z.date(),
  allDay: z.boolean(),
  color: z.enum(['violet','sky','amber','rose']),
  invitees: z.array(z.string().email()).optional(),
  notes: z.string().optional(),
  linkedTripId: z.string().uuid().optional(),
});

// itinerary-item.ts
export const ItineraryItem = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  category: z.enum(['accommodation','transport','experience','other']),
  title: z.string(),
  location: z.string().optional(),
  start: z.date(),
  end: z.date(),
  cost: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  paidBy: z.string().optional(),
  bookingUrls: z.array(z.string().url()).optional(),
  notes: z.string().optional(),
});

8 · Acceptance criteria checklist
 Header month updates correctly when scrolling the month grid.

 Long-pressing a day opens NewEventSheet with startDate preset.

 Short-pressing a day opens DayViewSheet with merged events + itinerary items.

 Overlapping itinerary items render side-by-side with minimum 40 % width each.

 Text in timeline blocks is truncated to one line with ellipsis.

 Filter icon opens modal with multi-select chips (event colours & trip toggles).

 All sheets obey swipe-down-to-close and snap-points.

 Components are unit-tested (Jest + React Testing Library) for basic props rendering.

9 · Tasks for Claude Code
Scaffold pages & routes (/calendar, /trip/[id]).

Implement <CalendarHeader /> + scroll-observer hook.

Build virtualised <MonthGridCalendar /> with colour-pill logic.

Create reusable <Sheet> wrappers (shadcn/ui).

Deliver <NewEventSheet /> with zod form + validation.

Implement <TripDayTimeline /> with overlap grid.

Hook data models to Supabase (or mock store) with CRUD.

Achieve 100 % TypeScript strict mode.

Assets: remember to load {{/assets/Flow v1.jpg}} for visual reference.

“When all ACs pass and Storybook snapshots look like the reference image, consider the task done.”
