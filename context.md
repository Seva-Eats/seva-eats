# Seva Eats - Project Context Document

## Executive Summary

**Seva Eats** is a React Native mobile application that connects people experiencing food insecurity with free langar meals through a community-driven volunteer delivery network. The app enables recipients to request culturally-authentic meals for delivery to partner shelters and community drop-off locations with dignity, transparency, and zero barriers—no payment, no paperwork, no questions asked.

This document serves as a comprehensive Product Requirements Document (PRD) and technical reference for understanding the project's architecture, design system, user flows, and implementation details.

---

## Table of Contents

1. [Vision & Mission](#vision--mission)
2. [Product Overview](#product-overview)
3. [Target Users](#target-users)
4. [Technical Architecture](#technical-architecture)
5. [Design System](#design-system)
6. [Feature Specifications](#feature-specifications)
7. [User Flows](#user-flows)
8. [Data Model](#data-model)
9. [Development Guidelines](#development-guidelines)
10. [Future Roadmap](#future-roadmap)

---

## Vision & Mission

### Vision
To eliminate food insecurity in communities by leveraging the Sikh tradition of langar (community kitchen) through modern technology, creating a dignity-centered ecosystem where anyone can access nutritious meals without stigma.

### Mission
Build a mobile platform that:
- Connects recipients with free meals from gurdwara distribution hubs
- Empowers community volunteers to deliver meals with transparency
- Maintains recipient dignity through privacy-first, barrier-free access
- Scales the langar tradition beyond physical gurdwara locations

### Core Values
1. **Dignity First**: No payment, paperwork, or invasive questions
2. **Cultural Authenticity**: Rooted in Sikh langar principles of equality and service
3. **Community-Driven**: Powered by volunteers, not gig workers
4. **Transparency**: Real-time tracking and clear communication
5. **Accessibility**: Simple, warm, and welcoming for all backgrounds

---

## Product Overview

### What is Seva Eats?

Seva Eats is a two-sided marketplace connecting:
- **Recipients**: Individuals or shelters requesting free meals
- **Volunteers (Dashers)**: Community members delivering meals from pickup hubs

**Current Beta Focus**: Partner shelter drop-offs in the Greater Toronto Area (Brampton, Mississauga)

### Key Differentiators

| Feature | Seva Eats | Traditional Food Banks | Food Delivery Apps |
|---------|-----------|------------------------|-------------------|
| Cost | 100% Free | Free | Paid |
| Barriers | None | Paperwork, proof of need | Credit card required |
| Cultural Foods | Authentic langar meals | Generic donations | Restaurant variety |
| Delivery Model | Volunteer-driven | Self-pickup | Gig economy |
| Privacy | Minimal data collection | Extensive documentation | Account required |
| Transparency | Live tracking with map | None | Basic tracking |

### Success Metrics (As of Beta Launch)
- **12,847** meals delivered
- **892** shelters and individuals served
- **234** active volunteers
- **4.8/5** average recipient satisfaction (future metric)

---

## Target Users

### Primary User Persona: Meal Recipient

**Demographics:**
- Age: 18-65+
- Location: Urban areas near gurdwara hubs (GTA initial launch)
- Situation: Experiencing temporary or chronic food insecurity
- Tech proficiency: Low to medium (smartphone access assumed)

**Needs:**
- Immediate access to nutritious meals
- Delivery to safe locations (shelters, community centers)
- No financial barriers or bureaucratic hurdles
- Respectful, dignified service

**Pain Points:**
- Stigma associated with food assistance programs
- Transportation barriers to food banks
- Cultural dietary preferences not met by generic donations
- Unpredictable meal availability at shelters

### Secondary User Persona: Volunteer Dasher (Future Feature)

**Demographics:**
- Age: 16-70
- Motivation: Community service, religious duty (seva)
- Availability: Flexible hours (lunch/dinner windows)
- Transportation: Personal vehicle

**Needs:**
- Clear pickup/delivery instructions
- Route optimization
- Recognition for contributions
- Flexible scheduling

---

## Technical Architecture

### Tech Stack

**Frontend Framework:**
- **React Native**: Cross-platform mobile development (iOS/Android)
- **Expo SDK 55**: Managed workflow with preview features
- **TypeScript 5.9**: Type safety and developer experience

**Navigation:**
- **Expo Router**: File-based routing system (inspired by Next.js)
- Routes automatically generated from `/app` folder structure

**State Management:**
- **React Context API**: Global state (user, location, requests, theme)
- **AsyncStorage**: Local persistence for offline-first architecture
- **JSON Serialization**: Simple data storage without complex ORM

**UI & Animations:**
- **React Native Reanimated 4.2**: 60fps animations on UI thread
- **React Native Gesture Handler**: Touch interactions
- **React Native Maps**: Interactive map with markers and polylines
- **Expo Image**: Optimized image loading with blurhash

**Location Services:**
- **expo-location**: GPS positioning and reverse geocoding
- **Foreground permissions**: Request on-demand (no background tracking)

**Development Tools:**
- **ESLint**: Code linting with Expo config
- **TypeScript**: Strict type checking
- **Git**: Version control (repository structure visible)

### Color Palette

The app uses a **warm, approachable** color scheme inspired by the welcoming nature of langar service. The primary color is a vibrant orange that evokes community warmth, while backgrounds use creamy tones to create comfort.

#### Light Mode

**Primary Colors:**
```typescript
primary: '#F97316'        // Orange 500 (brand accent)
primaryLight: '#FED7AA'   // Orange 200 (subtle highlights)
primaryDark: '#EA580C'    // Orange 600 (hover/pressed states)
```

**Neutral Colors:**
```typescript
background: '#FFF8F0'     // Creamy white (warm base)
surface: '#FFFFFF'        // Pure white (elevated cards)
border: '#E5E7EB'         // Gray 200 (subtle dividers)
borderLight: '#F3F4F6'    // Gray 100 (very light borders)
```

**Text Colors:**
```typescript
text: '#181A18'           // Soft black (primary text)
textSecondary: '#6B7280'  // Gray 500 (labels, metadata)
textTertiary: '#9CA3AF'   // Gray 400 (disabled text)
```

## Feature Specifications

### 1. Landing Screen (`/index.tsx`)

**Purpose:** Primary entry point for new and returning users.

**Components:**
- **Hero Section:**
  - Logo (Seva Eats branding)
  - Headline: "Request a free langar meal near you"
  - Subtext: "No payment, no paperwork"
  - CTA button: "Request a Meal" → `/request/location`
  
- **Stats Display:**
  - Meals delivered: 12,847
  - Shelters served: 892
  - Active volunteers: 234
  - Layout: 3-column grid with icons

- **Secondary Actions:**
  - "Learn how it works" → `/onboarding`
  - "View nearby locations" → `/locations`

**Design Notes:**
- Use `huge` font size for headline
- Orange gradient background at top
- Floating CTA button with shadow
- Fade-in animation on mount

---

### 2. Meal Request Flow

#### 2.1 Hub Selection (`/request/location.tsx`)

**Purpose:** Choose pickup location for meal preparation.

**Data Displayed:**
- Hub name (e.g., "Brampton Distribution Hub")
- Address (street, city)
- Distance from user (e.g., "2.3 km away")
- Meals available (e.g., "127 meals available")
- Next delivery window (e.g., "Next pickup: 12:00 PM - 2:00 PM")

**Interactions:**
- List view (default) or map view toggle
- Filter by distance/availability
- Select hub → Proceed to meal selection

**Validation:**
- Must select a hub before continuing
- Show warning if hub has low availability (<10 meals)

---

#### 2.2 Meal Selection (`/request/new.tsx`)

**Purpose:** Choose meal items and quantities.

**Meal Options:**

**Main Courses:**
1. Dal & Rice
   - Icon: `🍛`
   - Description: "Lentils with basmati rice"
   - Serves: 2-3 people

2. Roti & Sabzi
   - Icon: `🫓`
   - Description: "Chapatis with seasonal curry"
   - Serves: 2-3 people

3. Dal & Roti
   - Icon: `🍽️`
   - Description: "Lentils with chapatis"
   - Serves: 2-3 people

4. Sabzi & Rice
   - Icon: `🥘`
   - Description: "Mixed vegetable curry with rice"
   - Serves: 2-3 people

5. Sambar & Rice
   - Icon: `🍲`
   - Description: "South Indian lentil stew"
   - Serves: 2-3 people

**Desserts:**
6. Kheer
   - Icon: `🍮`
   - Description: "Sweet rice pudding"
   - Serves: 3-4 people

**UI Pattern:**
- Grid layout (2 columns on phone, 3 on tablet)
- Each meal card:
  - Icon in colored circle
  - Meal name (bold)
  - Description (secondary text)
  - Serving size (tertiary text)
  - Quantity controls (+/- buttons)
  - Current quantity badge

**Bottom Summary Bar:**
- Total meals selected: `X items`
- CTA: "Continue" → `/request/details`
- Disable if total = 0

**Animations:**
- Spring animation on quantity change
- Scale press on meal cards
- Haptic feedback on +/- buttons

---

#### 2.3 Delivery Details (`/request/details.tsx`)

**Purpose:** Collect delivery information and preferences.

**Form Fields:**

1. **Personal Information:**
   - Recipient Name (text input, required)
   - Phone Number (tel input, required, format: (XXX) XXX-XXXX)

2. **Delivery Location:**
   - Address (autocomplete text input)
   - Quick-fill button: "Use my current location" (GPS)
   - Map preview (optional)
   - Default: Selected hub address (for shelter drop-offs)

3. **Serving Size:**
   - Segmented control: 1 / 2 / 3 servings
   - Default: 2

4. **Delivery Window:**
   - Radio buttons:
     - 12:00 PM - 2:00 PM
     - 2:00 PM - 4:00 PM
     - 6:00 PM - 8:00 PM
   - Default: Next available window

5. **Delivery Preference:**
   - Radio buttons:
     - Leave at door
     - Hand to me
   - Default: Leave at door

6. **Optional: Driver Note:**
   - Multiline text input (200 char limit)
   - Placeholder: "Give a message to your driver ❤️ (optional)"
   - Example: "Thank you for your service!"

7. **Optional: Donation:**
   - Checkbox: "Support packaging & delivery costs"
   - Amounts: $2 / $5 / $10 / Custom
   - Payment method: Link to Stripe (future)
   - Note: "100% optional - never required"

**Validation:**
- Name: 2-50 characters
- Phone: Valid North American format
- Address: Must have street + city
- Window: Must be in future

**Submit Button:**
- Label: "Submit Request"
- Loading state: Spinner + "Submitting..."
- Success: Navigate to `/request/[id]` with new request ID

---

#### 2.4 Request Tracking (`/request/[id].tsx`)

**Purpose:** Real-time visibility into meal delivery status.

**Status Stages:**

1. **Pending** (Amber badge)
   - Description: "Finding a volunteer driver"
   - ETA: Not shown yet
   - Duration: 0-10 seconds (simulated)

2. **Matched** (Blue badge)
   - Description: "Driver assigned"
   - Driver info card appears:
     - Name: "Volunteer Driver" (or actual name if `showVolunteerName: true`)
     - Vehicle: "Silver Honda Civic" (if provided)
     - Rating: ⭐ 4.9 (future)
   - ETA: Calculated (e.g., "Estimated delivery: 1:45 PM")
   - Duration: ~12 seconds

3. **Picked Up** (Violet badge)
   - Description: "Meal picked up from hub"
   - Map updates: Driver location appears at hub
   - ETA: Refined estimate
   - Duration: ~20 seconds

4. **On the Way** (Orange badge)
   - Description: "Delivering your meal"
   - Map updates: Driver location moves along route
   - ETA: Live countdown (e.g., "Arriving in 8 min")
   - Driver location dot animates along polyline
   - Duration: ~35 seconds

5. **Delivered** (Emerald badge)
   - Description: "Your meal has been delivered!"
   - Confetti animation (future)
   - Show: "Thank you for using Seva Eats"
   - Action: "Rate your experience" (future)

**Cancelled State:**
- Gray badge: "Request cancelled"
- Show cancellation timestamp
- No map updates

**Map Visualization:**

**Markers:**
- Pickup hub: Orange storefront icon (📍)
- Delivery location: Green home icon (🏠)
- Driver: Orange car icon (🚗), only when `status >= picked_up`

**Route Polyline:**
- Color: `primary` (orange)
- Width: 4px
- Dash pattern: `[1, 10]` (dashed line)
- Draws from hub → delivery location

**Driver Location:**
- Interpolated position between hub and delivery
- Progress: `(currentTime - pickupTime) / totalDeliveryTime`
- Smooth animation using `withTiming`

**Map Controls:**
- Fullscreen toggle
- Re-center button
- Zoom to fit all markers

**Request Details Card:**
- Meals ordered (list with quantities)
- Serving size
- Delivery window
- Special instructions (if provided)
- Total meals count

**Cancel Button:**
- Only shown if `status !== 'delivered' && status !== 'cancelled'`
- Confirmation dialog: "Are you sure you want to cancel this request?"
- Destructive style (red text)

**Refresh Behavior:**
- Auto-update every 5 seconds (if status !== delivered)
- Pull-to-refresh gesture
- Show last updated timestamp

---

### 3. Profile Management (`/profile.tsx`)

**Purpose:** Edit saved user information for faster future requests.

**Editable Fields:**
- Full Name
- Phone Number
- Default Home Address (with map picker)
- Default Serving Size (1-3)

**Saved Addresses:**
- List of frequently used addresses
- Add new address
- Edit/delete saved addresses
- Set one as default

**Preferences:**
- Default delivery window
- Notification settings (future)
- Language preference (future: English/Punjabi/Hindi)

**Data Management:**
- "Clear All Data" button (destructive)
- Confirmation: "This will erase all saved information and request history"
- Does NOT require account (local storage only)

**Save Behavior:**
- Auto-save on blur (no "Save" button)
- Toast notification: "Profile updated"

---

### 4. Request Management

#### 4.1 Active Requests (`/requests/active.tsx`)

**Purpose:** View all in-progress meal deliveries.

**List View:**
- Card per request:
  - Request ID (e.g., "REQ-1234")
  - Status badge (color-coded)
  - Meals summary (e.g., "3 items: Dal & Rice x2, Kheer x1")
  - Delivery address (truncated)
  - ETA or delivery window
  - "View Details" button → `/request/[id]`

**Empty State:**
- Illustration: Empty plate
- Text: "No active requests"
- CTA: "Request a Meal"

**Sorting:**
- Default: Most recent first
- Filter by status (future)

---

#### 4.2 Request History (`/requests/history.tsx`)

**Purpose:** View past requests (delivered or cancelled).

**List View:**
- Card per request:
  - Date (relative: "Today", "2 days ago", "Mar 15, 2026")
  - Status: "Delivered" or "Cancelled"
  - Meals summary
  - Driver name (if applicable)
  - "View Receipt" button (future)

**Empty State:**
- Text: "No past requests yet"

**Filters (Future):**
- Date range
- Status (delivered/cancelled)
- Search by driver name

---

### 5. Map & Locations (`/locations.tsx`)

**Purpose:** Explore all available pickup hubs.

**Map View:**
- All hubs displayed as orange markers
- Cluster markers if zoomed out (future)
- Tap marker → Info card:
  - Hub name
  - Address
  - Distance from user
  - Available meals
  - "Request from this hub" button

**List Toggle:**
- Switch to list view of hubs
- Sort by distance/availability

---

### 6. Support & Help (`/support.tsx`)

**Purpose:** Contact support or access resources.

**Contact Options:**
- "Call Support Specialist" → `tel:` link
- "Send Email" → `mailto:` link
- "Chat with us" (future: in-app chat)

**FAQ Sections:**
- "How does Seva Eats work?"
- "Who can request meals?"
- "Is there really no cost?"
- "What if my driver doesn't arrive?"
- "How do I become a volunteer driver?"

**Legal Links:**
- Terms of Service
- Privacy Policy
- Community Guidelines

---

## User Flows

### Primary Flow: Request a Meal (Happy Path)

```
1. User opens app
   ↓
2. Landing screen: Tap "Request a Meal"
   ↓
3. Hub Selection: Browse nearby hubs → Select "Brampton Distribution Hub"
   ↓
4. Meal Selection: Add "Dal & Rice" (x2), "Kheer" (x1) → Tap "Continue"
   ↓
5. Delivery Details:
   - Enter name: "Priya Sharma"
   - Enter phone: "(416) 555-1234"
   - Delivery address: Pre-filled with hub address
   - Serving size: 2 people
   - Window: "12:00 PM - 2:00 PM"
   - Preference: "Leave at door"
   - Note: "Thank you for your kindness 🙏"
   → Tap "Submit Request"
   ↓
6. Request Tracking:
   - Status: Pending (10s) → Matched → Picked Up → On the Way → Delivered
   - Map shows driver route in real-time
   - ETA updates as driver approaches
   ↓
7. Delivered:
   - Status badge turns green
   - "Your meal has been delivered!"
   - Optional: Rate experience (future)
   ↓
8. Request moves to History
```

### Secondary Flow: Edit Profile Before Requesting

```
1. User opens app
   ↓
2. Tap profile icon (top right)
   ↓
3. Profile screen:
   - Edit name: "Amit Singh"
   - Edit phone: "(647) 555-9876"
   - Add home address: "123 Main St, Brampton ON"
   - Set serving size: 3
   ↓
4. Auto-saved → Toast: "Profile updated"
   ↓
5. Navigate back → Tap "Request a Meal"
   ↓
6. Details form pre-fills with saved profile data
   ↓
7. Continue with request flow...
```

### Edge Case Flow: Cancel Request

```
1. User submits request
   ↓
2. Tracking screen: Status = "Matched"
   ↓
3. User realizes they need to cancel
   ↓
4. Tap "Cancel Request" button
   ↓
5. Confirmation dialog: "Are you sure?"
   → Tap "Yes, Cancel"
   ↓
6. Request status → "Cancelled"
   ↓
7. Driver notified (future: push notification)
   ↓
8. Request moves to History
```
