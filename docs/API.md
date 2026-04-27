# Seva Eats API Documentation

## Overview

The Seva Eats app uses REST API routes to expose order management data. These endpoints allow external dashboards or tools to visualize, monitor, and manage orders without embedding admin functionality in the mobile app.

**Base URL:** Your Expo app's API route (e.g., when running locally or deployed)

---

## Endpoints

### Orders

#### GET `/api/orders/pending`

Retrieve all pending orders waiting to be accepted.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_name": "John Doe",
      "user_phone": "(647) 555-1234",
      "address": "123 Main St, Toronto",
      "serving_size": 2,
      "created_at": "2026-04-27T10:30:00Z",
      "status": "pending"
    }
  ],
  "count": 1
}
```

**Query Parameters:** None

**Use Cases:**
- Dashboard to show new orders waiting for acceptance
- Monitor incoming order volume
- Track order creation timestamps

---

#### GET `/api/orders/:id`

Retrieve a specific order by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "uuid",
    "user_name": "John Doe",
    "user_phone": "(647) 555-1234",
    "address": "123 Main St, Toronto",
    "delivery_latitude": 43.7315,
    "delivery_longitude": -79.7624,
    "serving_size": 2,
    "status": "pending",
    "created_at": "2026-04-27T10:30:00Z",
    "updated_at": "2026-04-27T10:30:00Z"
  }
}
```

**Path Parameters:**
- `id` (uuid): Order ID

**Use Cases:**
- Fetch full order details
- Check order status and coordinates

---

#### POST `/api/orders/:id/accept`

Accept a pending order and assign a driver.

**Request Body:**
```json
{
  "kitchenId": "uuid-of-kitchen",
  "driverId": "uuid-of-driver (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "order_id": "uuid",
    "delivery_id": "uuid",
    "driver_id": "uuid",
    "message": "Order accepted and assigned"
  }
}
```

**Path Parameters:**
- `id` (uuid): Order ID to accept

**Request Body Parameters:**
- `kitchenId` (uuid, required): Kitchen fulfilling the order
- `driverId` (uuid, optional): Specific driver to assign. If omitted, first available driver is used.

**Status Codes:**
- `200`: Order accepted successfully
- `400`: Invalid order ID or kitchen ID
- `404`: Order not found

**Use Cases:**
- Accept pending orders from dashboard
- Assign specific drivers for routing optimization
- Trigger delivery workflow

---

### Deliveries

#### GET `/api/deliveries/active`

Retrieve all active deliveries (assigned, picked up, or in transit).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "order_id": "uuid",
      "driver_id": "uuid",
      "status": "in_transit",
      "created_at": "2026-04-27T10:35:00Z",
      "updated_at": "2026-04-27T10:40:00Z",
      "orders": {
        "id": "uuid",
        "user_name": "John Doe",
        "user_phone": "(647) 555-1234",
        "address": "123 Main St, Toronto",
        "serving_size": 2,
        "status": "on_the_way"
      },
      "drivers": {
        "id": "uuid",
        "name": "Driver Name",
        "phone": "(647) 555-5678",
        "is_available": false
      }
    }
  ],
  "count": 1
}
```

**Query Parameters:** None

**Use Cases:**
- Real-time delivery dashboard
- Monitor driver assignments
- Track delivery progress

**Status Values:**
- `assigned`: Driver assigned, picking up food
- `picked_up`: Driver has food, en route to delivery
- `in_transit`: Driver is delivering
- `delivered`: Order completed

---

#### PATCH `/api/deliveries/:id/status`

Update delivery status to simulate driver progress or real driver updates.

**Request Body:**
```json
{
  "status": "picked_up"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "delivery_id": "uuid",
    "order_id": "uuid",
    "new_status": "picked_up",
    "message": "Status updated successfully"
  }
}
```

**Path Parameters:**
- `id` (uuid): Delivery ID to update

**Request Body Parameters:**
- `status` (string, required): New status. Valid values:
  - `picked_up`: Driver has picked up food
  - `in_transit`: Driver is on the way
  - `delivered`: Order has been delivered

**Status Codes:**
- `200`: Status updated successfully
- `400`: Invalid delivery ID or status
- `404`: Delivery not found

**Automatic Actions:**
- Updates corresponding order status in real-time
- Creates audit trail in `order_status_history`
- Triggers any Realtime subscriptions

**Use Cases:**
- Driver app sends status updates
- Admin dashboard simulates delivery progress
- Volunteer tracking updates

---

## Example Usage

### Using cURL

**List pending orders:**
```bash
curl https://your-expo-app.com/api/orders/pending
```

**Accept an order:**
```bash
curl -X POST https://your-expo-app.com/api/orders/550e8400-e29b-41d4-a716-446655440000/accept \
  -H "Content-Type: application/json" \
  -d '{
    "kitchenId": "kitchen-uuid-here",
    "driverId": "driver-uuid-here"
  }'
```

**Update delivery status:**
```bash
curl -X PATCH https://your-expo-app.com/api/deliveries/delivery-uuid-here/status \
  -H "Content-Type: application/json" \
  -d '{"status": "in_transit"}'
```

### Using JavaScript/Fetch

**Get pending orders:**
```javascript
const response = await fetch('/api/orders/pending');
const { data, count } = await response.json();
console.log(`${count} pending orders`);
```

**Accept order:**
```javascript
const response = await fetch('/api/orders/order-id/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    kitchenId: 'kitchen-id',
    driverId: 'driver-id' // optional
  })
});
const result = await response.json();
```

**Update delivery status:**
```javascript
const response = await fetch('/api/deliveries/delivery-id/status', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'in_transit' })
});
const result = await response.json();
```

---

## Deployment

These API routes work with:
- **Local development:** `expo start`
- **EAS Hosting:** Deployed with your app
- **Custom servers:** Export routes and self-host

### Environment Variables Required

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## External Dashboard Integration

You can now:

1. **Build a web dashboard** (React, Vue, Svelte, etc.)
   - Poll `/api/orders/pending` every 5 seconds
   - Display pending orders as cards
   - Add "Accept Order" button that calls `/api/orders/:id/accept`

2. **Create a monitoring tool**
   - Poll `/api/deliveries/active` for live delivery status
   - Show driver assignments
   - Monitor progress in real-time

3. **Integrate with volunteer app**
   - Call `/api/deliveries/:id/status` with driver location
   - Receive order assignments
   - Push delivery updates

4. **Connect to external systems**
   - Forward orders to kitchen management
   - Sync with POS systems
   - Integrate with analytics

---

## Security Notes

- All endpoints use Supabase's `anon` key (public)
- Ensure RLS policies are properly configured
- API routes are subject to Supabase rate limits
- Authentication is via Supabase's session/JWT

For sensitive operations, consider adding:
- API key authentication
- Request signing
- Rate limiting on order acceptance
- Webhook validation

---

## Troubleshooting

**404 Not Found**
- Verify Expo app is running or deployed
- Check URL path is correct
- Ensure environment variables are set

**400 Bad Request**
- Verify required parameters (kitchenId, status, etc.)
- Check UUID format for IDs
- Ensure JSON request body is valid

**Supabase Errors**
- Check Supabase project is accessible
- Verify credentials in `.env.local`
- Review RLS policies for table access
- Check Supabase logs for detailed errors

---

## Future Enhancements

- WebSocket support for real-time updates
- Webhook notifications for order events
- Batch accept orders endpoint
- Advanced filtering and search
- Analytics and reporting endpoints
