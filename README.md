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

The server will start on `http://localhost:3000`.

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
http://localhost:3000/api
```

### Interactive Documentation
Visit `http://localhost:3000/api-docs` for Swagger UI with all endpoints and request/response examples.

### Restaurants

- **Create Restaurant**: `POST /restaurants` - Create a new restaurant with opening/closing times
- **Get Restaurant**: `GET /restaurants/:id` - Retrieve restaurant details with associated tables
- **Get Restaurant Details**: `GET /restaurants/:id/details` - Get aggregated statistics (table count, capacity, reservations, waitlist)
- **Update Restaurant**: `PATCH /restaurants/:id` - Update opening/closing times

### Tables

- **Add Table**: `POST /restaurants/:id/tables` - Add a new table with capacity
- **List Tables**: `GET /restaurants/:id/tables` - Get all tables for a restaurant
- **Update Table**: `PATCH /restaurants/:id/tables/:tableId` - Update table capacity
- **Delete Table**: `DELETE /restaurants/:id/tables/:tableId`

### Reservations

- **Create Reservation**: `POST /restaurants/:id/reservations` - Book a table with customer details
- **List Reservations**: `GET /restaurants/:id/reservations` - Get all reservations with optional filtering
- **Get Reservation**: `GET /restaurants/:id/reservations/:reservationId` - Get reservation details
- **Modify Reservation**: `PATCH /restaurants/:id/reservations/:reservationId` - Update reservation time or party size
- **Cancel Reservation**: `DELETE /restaurants/:id/reservations/:reservationId` - Cancel and free up the table

### Availability

- **Check Available Slots**: `GET /restaurants/:id/availability` - Query available time slots by date, party size, and duration
  - Query parameters: `date`, `partySize`, `durationMinutes`
  - Returns list of available slots with time ranges and table information

### Waitlist

- **Add to Waitlist**: `POST /restaurants/:id/waitlist` - Join waitlist when no tables available
- **View Waitlist**: `GET /restaurants/:id/waitlist` - Get all waitlist entries
- **Update Waitlist Status**: `PATCH /restaurants/:id/waitlist/:waitlistId` - Update status (e.g., notified, seated)

### Error Responses

All errors follow this format with standard HTTP status codes:
- `400`: Bad Request (validation error)
- `404`: Not Found
- `409`: Conflict (e.g., double-booking)
- `500`: Internal Server Error

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
- [ ] **Comprehensive Testing**: Aim for 80%+ coverage across all modules
  - Unit tests for services
  - Integration tests for workflows
  - End-to-end tests for critical paths

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
- [ ] **Table Sections**: Organize tables by section (patio, bar, dining room)
- [ ] **Special Requests**: Allow customers to specify preferences (high chair, wheelchair access, quiet corner)

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

#### 6. **Deployment**
For < 50 restaurants, use single instance. For larger scale, deploy multiple instances with load balancer (HAProxy/Nginx), managed PostgreSQL, and managed Redis cluster.

#### 7. **Cost Optimization**
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
- `npm run test:ci` - Run tests with coverage
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

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

ISC
