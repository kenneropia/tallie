# Tallie - Restaurant Reservation API

A complete restaurant reservation management system built with Node.js, TypeScript, Express, and SQLite.

## Features

- **Restaurant Management**: Create and manage restaurants with operating hours
- **Table Management**: Add tables with capacities to restaurants
- **Reservation System**: Create, modify, and cancel reservations with double-booking prevention
- **Availability Checking**: Real-time availability for specific dates, party sizes, and durations
- **Waitlist**: Add customers to waitlist with auto-notification when tables become available
- **Redis Caching**: Optimized availability checks with intelligent cache invalidation
- **Email Notifications**: Integration with Resend for confirmation, modification, and cancellation emails
- **Swagger Documentation**: Interactive API documentation at `/api-docs`

## Tech Stack

- **Runtime**: Node.js 16+
- **Language**: TypeScript 5.x
- **Framework**: Express.js 5.x
- **Database**: SQLite with TypeORM 0.3.x
- **Caching**: Redis 6+
- **Email**: Resend
- **Testing**: Jest + Supertest
- **API Docs**: Swagger UI + swagger-jsdoc

---

## Setup Instructions

### Prerequisites

- Node.js 16+
- npm 8+ or yarn
- Redis (for caching)

### Local Development Setup

1. Install dependencies: `npm install`
2. Copy environment file: `cp .env.example .env`
3. Run database migrations: `npm run typeorm migration:run -- -d dist/database/dataSource.js`
4. Start development server: `npm run dev`

The server will start on `https://tallie.onrender.com/`.

### Environment Variables

Create a `.env` file based on `.env.example`. Required variables:
- `NODE_ENV`: Environment (development, production)
- `PORT`: Server port (default: 3000)
- `DATABASE_PATH`: SQLite database file path
- `REDIS_URL`: Redis connection URL
- `RESEND_API_KEY`: API key for Resend email service
- `RESEND_FROM_EMAIL`: Email address for sending notifications

### Docker Setup

#### Using Docker Compose (Recommended)

- Start services: `docker compose -f infra/docker-compose.yml up -d`
- View logs: `docker compose -f infra/docker-compose.yml logs -f app`
- Stop services: `docker compose -f infra/docker-compose.yml down`

#### Using Docker Directly

- Build image: `docker build -f infra/Dockerfile -t tallie:latest .`
- Run with Redis: `docker run -d --name tallie-redis redis:7-alpine`
- Run app: `docker run -d -p 3000:3000 -e REDIS_URL=redis://tallie-redis:6379 --link tallie-redis tallie:latest`

The Docker setup includes:
- Multi-stage build for optimized image size
- Health checks for container monitoring
- Redis caching pre-configured
- Persistent SQLite database in `/app/data`
- dumb-init for proper signal handling

---

## API Documentation

### Base URL
```
https://tallie.onrender.com/api
```

### Interactive Documentation
Visit `https://tallie.onrender.com/api-docs` for Swagger UI with all endpoints and request/response examples.

### Restaurants

#### Create Restaurant
**POST** `/restaurants`

Request:
```json
{
  "name": "The Bistro",
  "openingTime": "11:00",
  "closingTime": "23:00"
}
```

Response (201):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Bistro",
  "openingTime": "11:00",
  "closingTime": "23:00",
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T12:00:00.000Z"
}
```

#### Get Restaurant
**GET** `/restaurants/:id`

Response (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Bistro",
  "openingTime": "11:00",
  "closingTime": "23:00",
  "tables": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "tableNumber": 1,
      "capacity": 4
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "tableNumber": 2,
      "capacity": 6
    }
  ],
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T12:00:00.000Z"
}
```

#### Get Restaurant Details
**GET** `/restaurants/:id/details`

Response (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Bistro",
  "openingTime": "11:00",
  "closingTime": "23:00",
  "totalTables": 2,
  "tables": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "tableNumber": 1,
      "capacity": 4
    }
  ],
  "reservationStats": {
    "total": 5,
    "pending": 1,
    "confirmed": 3,
    "completed": 1,
    "cancelled": 0
  },
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

#### Update Restaurant
**PATCH** `/restaurants/:id`

Request:
```json
{
  "openingTime": "10:00",
  "closingTime": "22:00",
  "name": "The Bistro Premium"
}
```

Response (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "The Bistro Premium",
  "openingTime": "10:00",
  "closingTime": "22:00",
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T14:30:00.000Z"
}
```

### Tables

#### Add Table
**POST** `/restaurants/:id/tables`

Request:
```json
{
  "tableNumber": 3,
  "capacity": 8
}
```

Response (201):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440003",
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "tableNumber": 3,
  "capacity": 8,
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T12:00:00.000Z"
}
```

#### List Tables
**GET** `/restaurants/:id/tables`

Response (200):
```json
{
  "tables": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
      "tableNumber": 1,
      "capacity": 4
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
      "tableNumber": 2,
      "capacity": 6
    }
  ],
  "total": 2
}
```

#### Update Table
**PATCH** `/restaurants/:id/tables/:tableId`

Request:
```json
{
  "capacity": 10
}
```

Response (200):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440003",
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "tableNumber": 3,
  "capacity": 10,
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T14:35:00.000Z"
}
```

#### Delete Table
**DELETE** `/restaurants/:id/tables/:tableId`

Response (200):
```json
{
  "message": "Table deleted successfully"
}
```

### Reservations

#### Check Available Slots
**GET** `/restaurants/:id/availability?date=2024-01-15&partySize=4&duration=120`

Query Parameters:
- `date` (required): YYYY-MM-DD format
- `partySize` (required): Integer > 0
- `duration` (optional): Reservation duration in minutes (default: 120)

Response (200):
```json
{
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "date": "2024-01-15",
  "partySize": 4,
  "duration": 120,
  "availableSlots": [
    {
      "startTime": "11:00",
      "endTime": "13:00",
      "tableId": "660e8400-e29b-41d4-a716-446655440001",
      "tableNumber": 1,
      "capacity": 4
    },
    {
      "startTime": "13:30",
      "endTime": "15:30",
      "tableId": "660e8400-e29b-41d4-a716-446655440001",
      "tableNumber": 1,
      "capacity": 4
    },
    {
      "startTime": "11:00",
      "endTime": "13:00",
      "tableId": "660e8400-e29b-41d4-a716-446655440002",
      "tableNumber": 2,
      "capacity": 6
    }
  ]
}
```

#### Create Reservation
**POST** `/restaurants/:id/reservations`

Request:
```json
{
  "customerName": "John Doe",
  "customerPhone": "+1-555-0123",
  "customerEmail": "john@example.com",
  "partySize": 4,
  "reservationDate": "2024-01-15",
  "reservationStartTime": "19:00",
  "duration": 120
}
```

Response (201):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "tableId": "660e8400-e29b-41d4-a716-446655440001",
  "customerName": "John Doe",
  "customerPhone": "+1-555-0123",
  "customerEmail": "john@example.com",
  "partySize": 4,
  "reservationDate": "2024-01-15",
  "reservationStartTime": "19:00",
  "reservationEndTime": "21:00",
  "duration": 120,
  "status": "confirmed",
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T12:00:00.000Z"
}
```

#### List Reservations
**GET** `/restaurants/:id/reservations?date=2024-01-15&status=confirmed`

Query Parameters:
- `date` (required): YYYY-MM-DD format
- `status` (optional): pending, confirmed, completed, or cancelled

Response (200):
```json
{
  "reservations": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "tableNumber": 1,
      "customerName": "John Doe",
      "partySize": 4,
      "reservationDate": "2024-01-15",
      "reservationStartTime": "19:00",
      "reservationEndTime": "21:00",
      "status": "confirmed",
      "createdAt": "2024-01-10T12:00:00.000Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "tableNumber": 2,
      "customerName": "Jane Smith",
      "partySize": 6,
      "reservationDate": "2024-01-15",
      "reservationStartTime": "20:00",
      "reservationEndTime": "22:00",
      "status": "confirmed",
      "createdAt": "2024-01-10T12:15:00.000Z"
    }
  ],
  "total": 2,
  "date": "2024-01-15"
}
```

#### Get Reservation
**GET** `/restaurants/:id/reservations/:reservationId`

Response (200):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "tableId": "660e8400-e29b-41d4-a716-446655440001",
  "tableNumber": 1,
  "customerName": "John Doe",
  "customerPhone": "+1-555-0123",
  "partySize": 4,
  "reservationDate": "2024-01-15",
  "reservationStartTime": "19:00",
  "reservationEndTime": "21:00",
  "duration": 120,
  "status": "confirmed",
  "createdAt": "2024-01-10T12:00:00.000Z"
}
```

#### Modify Reservation
**PATCH** `/restaurants/:id/reservations/:reservationId`

Request (modify time and/or party size):
```json
{
  "reservationStartTime": "18:00",
  "duration": 90,
  "partySize": 5
}
```

Response (200):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "tableId": "660e8400-e29b-41d4-a716-446655440002",
  "customerName": "John Doe",
  "customerPhone": "+1-555-0123",
  "partySize": 5,
  "reservationDate": "2024-01-15",
  "reservationStartTime": "18:00",
  "reservationEndTime": "19:30",
  "duration": 90,
  "status": "confirmed",
  "createdAt": "2024-01-10T12:00:00.000Z",
  "updatedAt": "2024-01-10T13:00:00.000Z"
}
```

#### Cancel Reservation
**DELETE** `/restaurants/:id/reservations/:reservationId`

Response (200):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "status": "cancelled",
  "message": "Reservation cancelled successfully",
  "updatedAt": "2024-01-10T14:00:00.000Z"
}
```

### Waitlist

#### Add to Waitlist
**POST** `/restaurants/:id/waitlist`

Request:
```json
{
  "customerName": "Alice Brown",
  "customerPhone": "+1-555-0456",
  "customerEmail": "alice@example.com",
  "partySize": 4,
  "requestedDate": "2024-01-15",
  "requestedTime": "19:00",
  "preferredTimeRange": "19:00-20:00"
}
```

Response (201):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "customerName": "Alice Brown",
  "customerPhone": "+1-555-0456",
  "customerEmail": "alice@example.com",
  "partySize": 4,
  "requestedDate": "2024-01-15",
  "requestedTime": "19:00",
  "preferredTimeRange": "19:00-20:00",
  "status": "waiting",
  "createdAt": "2024-01-10T12:30:00.000Z",
  "updatedAt": "2024-01-10T12:30:00.000Z"
}
```

#### View Waitlist
**GET** `/restaurants/:id/waitlist`

Response (200):
```json
{
  "waitlist": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
      "customerName": "Alice Brown",
      "customerPhone": "+1-555-0456",
      "customerEmail": "alice@example.com",
      "partySize": 4,
      "requestedDate": "2024-01-15",
      "requestedTime": "19:00",
      "preferredTimeRange": "19:00-20:00",
      "status": "waiting",
      "createdAt": "2024-01-10T12:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### Update Waitlist Status
**PATCH** `/restaurants/:id/waitlist/:waitlistId`

Request:
```json
{
  "status": "notified"
}
```

Response (200):
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440000",
  "restaurantId": "550e8400-e29b-41d4-a716-446655440000",
  "customerName": "Alice Brown",
  "customerPhone": "+1-555-0456",
  "customerEmail": "alice@example.com",
  "partySize": 4,
  "requestedDate": "2024-01-15",
  "requestedTime": "19:00",
  "preferredTimeRange": "19:00-20:00",
  "status": "notified",
  "updatedAt": "2024-01-10T13:00:00.000Z"
}
```

### Error Responses

All errors follow this format with standard HTTP status codes:

**400: Bad Request**
```json
{
  "error": "Validation failed",
  "details": "Invalid date format. Use YYYY-MM-DD"
}
```

**404: Not Found**
```json
{
  "error": "Not Found",
  "details": "Restaurant not found"
}
```

**409: Conflict**
```json
{
  "error": "Conflict",
  "details": "Table is already booked for the requested time"
}
```

**500: Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "details": "An unexpected error occurred"
}
```

---

## Design Decisions and Assumptions

### Architecture

**Domain-Driven Design (DDD)**
- Code organized by business domains: `restaurants`, `reservations`, `tables`, `waitlist`
- Each domain has controllers, services, and entities
- Clear separation of concerns and maintainability

**Service Layer Pattern**
- Business logic isolated in service classes
- Controllers handle HTTP concerns only
- Services can be reused across different interfaces

### Data Model Assumptions

1. **Single-Restaurant Scope**: Initial design assumes single restaurant operation
   - All endpoints are prefixed with `/restaurants/:id` for future multi-restaurant support
   - Foreign keys establish relationships (tables → restaurants, reservations → tables, etc.)

2. **Time Slots**: 30-minute increments
   - Simplifies availability calculation
   - Can be made configurable per restaurant

3. **Reservation Duration**: Required field
   - Allows accurate overlap detection
   - Enables capacity planning

4. **Party Size Constraint**: Must not exceed table capacity
   - Ensures realistic seating

### Availability Calculation

**Algorithm**:
1. Get all tables with sufficient capacity for party size
2. For each table, find all reservations on the target date
3. Generate 30-minute slots between restaurant hours
4. Filter out slots that conflict with existing reservations
5. Cache results for 10 minutes

**Conflict Detection Formula**:
```
existingStart < newEnd AND existingEnd > newStart
```

### Cache Strategy

- **Key**: `availability:{restaurantId}:{date}:{partySize}`
- **TTL**: 10 minutes
- **Invalidation**: Automatic when reservations change

Benefits:
- Reduces database queries for frequently checked dates
- Availability checks remain fresh (<10 min stale data)
- Automatic cleanup via Redis TTL

### Email Notifications

Integrated via Resend with events:
- **Reservation Created**: Confirmation email to customer
- **Reservation Modified**: Updated details
- **Reservation Cancelled**: Cancellation notice
- **Waitlist Notified**: Notification that table is available

### Validation

- Email format validation (RFC 5322 regex)
- Time format validation (HH:MM)
- Time range validation (opening < closing)
- Numeric constraints (capacity > 0, party size > 0)

---

## Known Limitations

### Current Implementation

1. **No Authentication/Authorization**
   - Anyone can create/modify any restaurant
   - Add JWT-based auth for production

2. **Limited Test Coverage**
   - Only 4 entity files tested (entities only)
   - Controllers, services, and middleware untested
   - No integration tests for multi-step workflows

3. **No Rate Limiting**
   - Open to abuse (spam reservations, availability checks)
   - Add express-rate-limit middleware

4. **Single Database**
   - SQLite suitable for single-restaurant development
   - Not suitable for multi-user production

5. **No Soft Deletes**
   - Deleted records removed from database
   - Makes audit trails impossible
   - Add `deletedAt` timestamp for soft deletes

6. **No Waitlist Auto-Conversion**
   - Manually update waitlist status
   - No automated trigger when a reservation cancels

7. **No Pagination**
   - List endpoints return all records
   - Can cause performance issues with large datasets

8. **No Input Sanitization**
   - Basic validation only
   - Add XSS protection and SQL injection prevention

9. **No Timezone Support**
   - All times in UTC
   - Multi-location restaurants would need timezone per location

10. **No Concurrent Reservation Handling**
    - Race condition possible with simultaneous bookings on same table
    - Add database-level locking or pessimistic concurrency

---

## Improvements with More Time

### Priority 1: Security & Reliability

- [ ] **Authentication**: JWT-based auth with restaurant owner accounts
- [ ] **Authorization**: Role-based access control (owner, staff, customer)
- [ ] **Rate Limiting**: Prevent abuse of availability and reservation endpoints
- [ ] **Input Sanitization**: XSS and SQL injection protection

### Priority 2: Data Integrity

- [ ] **Soft Deletes**: Add `deletedAt` field for audit trails
- [ ] **Database Locking**: Handle concurrent reservations safely
- [ ] **Transaction Management**: Atomic operations for multi-step workflows
- [ ] **Audit Logging**: Track all changes with timestamps and user info

### Priority 3: Features

- [ ] **Waitlist Auto-Conversion**: Automatically offer tables when reservations cancel
- [ ] **Pagination**: Add limit/offset to list endpoints
- [ ] **Advanced Filtering**: Filter by status, date range, customer name
- [ ] **Recurring Reservations**: Support for weekly/monthly bookings

### Priority 4: Operations

- [ ] **Monitoring**: Add logging with Winston or Pino
- [ ] **Metrics**: Track availability queries, booking success rate, peak hours
- [ ] **Alerting**: Notify staff of high waitlist sizes
- [ ] **Backups**: Automated database backups
- [ ] **Analytics Dashboard**: Reservation trends, occupancy rates, revenue per slot

### Priority 5: User Experience

- [ ] **SMS Notifications**: Text confirmations and reminders
- [ ] **Customer Portal**: Self-service cancellation/modification
- [ ] **Staff Dashboard**: View reservations, manage waitlist, check occupancy
- [ ] **Reservation Reminders**: Email/SMS 24h before reservation
- [ ] **No-Show Tracking**: Record and analyze no-shows

---

## Scaling for Multiple Restaurants

### Current Constraints

The current design uses `/restaurants/:id` endpoints, making multi-restaurant support straightforward with database changes only.

### Architecture Changes

#### 1. **Database Schema**
Already supports multi-restaurant:
```
restaurants (id, name, openingTime, closingTime)
tables (id, restaurantId, tableNumber, capacity)
reservations (id, restaurantId, tableId, ...)
waitlist (id, restaurantId, ...)
```

#### 2. **Authentication & Tenancy**
Add authentication middleware to extract `restaurantId` from JWT tokens. Scopes all queries and operations to the authenticated restaurant.

#### 3. **Data Isolation**
All queries must filter by `restaurantId` to ensure data isolation. Controllers should automatically scope operations to the authenticated restaurant.

#### 4. **Caching Strategy**
Include `restaurantId` in all cache keys to separate cached data per restaurant.

#### 5. **Database Considerations**

For small scale (< 10 restaurants):
- SQLite with explicit `restaurantId` filtering works fine
- Add indexes on `(restaurantId, date)` for performance

For medium scale (10-100 restaurants):
- Migrate to PostgreSQL
- Use row-level security policies
- Add connection pooling

For large scale (100+ restaurants):
- Multi-tenant SaaS approach
- Separate database per restaurant (DB per tenant)
- Or shared database with aggressive caching
- Add read replicas for availability checks

#### 6. **Cost Optimization**
- Shared infrastructure (single app, single database, single Redis)
- Per-restaurant usage metrics for billing
- Scheduled jobs for cleanup (old reservations, waitlist entries)

### Minimal Changes Required

1. **Add restaurant validation middleware**
   - Ensure users can only access their restaurant
   - Check `restaurantId` in JWT token

2. **Add database indexes** on `restaurantId` and `reservationTime` for performance

3. **Update billing/admin endpoints**
   - Track per-restaurant metrics
   - Implement usage-based pricing if needed

---

## Development

### Available Scripts

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled server
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint -- --fix` - Auto-fix linting issues
- `npm run typeorm migration:generate -- --name MigrationName` - Generate migrations
- `npm run typeorm migration:run` - Run migrations
- `npm run typeorm migration:revert` - Revert migrations

### Project Structure

```
src/
├── app.ts                                    # Express app setup
├── server.ts                                 # Server entry point
├── runMigrations.ts                          # Database migrations
│
├── domains/
│   ├── restaurants/
│   │   ├── controllers/restaurantController.ts
│   │   ├── entities/Restaurant.ts
│   │   └── restaurant.ts                     # Routes
│   ├── tables/
│   │   ├── controllers/tableController.ts
│   │   ├── entities/Table.ts
│   │   └── table.ts                          # Routes
│   ├── reservations/
│   │   ├── controllers/reservationController.ts
│   │   ├── entities/Reservation.ts
│   │   ├── services/reservationService.ts
│   │   ├── services/availabilityService.ts
│   │   └── reservation.ts                    # Routes
│   └── waitlist/
│       ├── controllers/waitlistController.ts
│       ├── entities/Waitlist.ts
│       ├── services/waitlistService.ts
│       └── waitlist.ts                       # Routes
│
└── shared/
    ├── database/
    │   ├── dataSource.ts                     # TypeORM config
    │   └── migrations/
    ├── middleware/
    │   ├── errorHandler.ts
    │   └── validation.ts
    ├── services/
    │   ├── emailService.ts
    │   └── cacheService.ts
    ├── swagger/
    │   └── swaggerDef.ts
    └── utils/
        ├── constants.ts
        ├── errors.ts
        └── validators.ts
```
