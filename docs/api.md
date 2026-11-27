# Bookwise API

Business API reference for the Bookwise application. Examples use `http://localhost:3000` as the base URL.

## Authentication and organization access

All endpoints in this reference require an authenticated Better Auth session. Send the session cookie with requests (Postman can retain it in its cookie jar).

The session must also have an active organization selected. The API verifies the user's membership in that organization and scopes database operations to it. Organization IDs supplied by the client are not used to select the tenant.

## Conventions

- Send JSON request bodies with `Content-Type: application/json`.
- Successful responses use `{ "data": ... }`.
- Error responses use `{ "error": { "code": "...", "message": "...", "issues": [] } }`. `issues` is included for validation errors.
- Date-time values must be ISO 8601 strings with a timezone offset, for example `2026-11-26T09:00:00+05:00`.
- Monetary `priceAmount` values are returned as strings.

## Endpoints

### Bookings

| Method   | Endpoint             | Description              |
| -------- | -------------------- | ------------------------ |
| `POST`   | `/api/bookings`      | Create a booking         |
| `GET`    | `/api/bookings`      | List and filter bookings |
| `GET`    | `/api/bookings/{id}` | Retrieve a booking       |
| `PATCH`  | `/api/bookings/{id}` | Update a booking         |
| `DELETE` | `/api/bookings/{id}` | Cancel a booking         |

#### Create a booking

`POST /api/bookings`

Required header:

```http
Idempotency-Key: <unique-key>
```

Request body:

```json
{
  "customerId": "customer-id",
  "serviceId": "service-id",
  "startsAt": "2026-11-26T09:00:00+05:00"
}
```

All three fields are required. IDs must be non-empty strings up to 255 characters. `startsAt` must be a valid ISO date-time with an offset. The customer and service must be active and belong to the active organization.

Success: `201 Created`

```json
{
  "data": {
    "booking": {
      "id": "booking-id",
      "status": "PENDING",
      "startsAt": "2026-11-26T04:00:00.000Z",
      "endsAt": "2026-11-26T04:45:00.000Z",
      "createdAt": "2026-11-26T04:00:00.000Z",
      "updatedAt": "2026-11-26T04:00:00.000Z",
      "customer": {
        "id": "customer-id",
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "+000000000"
      },
      "service": {
        "id": "service-id",
        "name": "Service Name",
        "durationMinutes": 45,
        "priceAmount": "5500",
        "currencyCode": "PKR"
      }
    }
  }
}
```

The server calculates `endsAt` using the service duration and saves service name, duration, price, and currency as booking snapshots.

Common errors: `400 VALIDATION_ERROR` for a missing/invalid idempotency key or invalid body; `404 NOT_FOUND` when the customer or service is unavailable in the active organization.

#### List bookings

`GET /api/bookings`

Query parameters:

| Parameter | Default | Allowed values / rules                                                                              |
| --------- | ------: | --------------------------------------------------------------------------------------------------- |
| `page`    |     `1` | Integer, minimum `1`                                                                                |
| `limit`   |    `20` | Integer, `1`–`100`                                                                                  |
| `scope`   |   `all` | `upcoming`, `past`, `cancelled`, `all`                                                              |
| `period`  |       — | `today`, `tomorrow`, `this-week` (organization-local time)                                          |
| `status`  |       — | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`                                         |
| `from`    |       — | ISO date-time with offset; inclusive start boundary                                                 |
| `to`      |       — | ISO date-time with offset; exclusive end boundary; must be later than `from` when both are supplied |

`scope`, `period`, `status`, `from`, and `to` can be combined; their filters are applied together. `upcoming` excludes cancelled bookings and includes bookings starting now or later. `past` excludes cancelled bookings and includes bookings starting before now. `cancelled` returns cancelled bookings.

Example:

```http
GET /api/bookings?page=1&limit=20&scope=upcoming&period=this-week
```

Success: `200 OK`

```json
{
  "data": {
    "bookings": [
      {
        "id": "booking-id",
        "status": "PENDING",
        "startsAt": "2026-11-26T04:00:00.000Z",
        "endsAt": "2026-11-26T04:45:00.000Z",
        "serviceName": "Dental Cleaning",
        "serviceDurationMinutes": 45,
        "priceAmount": "5500",
        "currencyCode": "PKR",
        "createdAt": "2026-11-25T10:00:00.000Z",
        "updatedAt": "2026-11-25T10:00:00.000Z",
        "customer": {
          "id": "customer-id",
          "name": "Customer Name",
          "email": "customer@example.com",
          "phone": "+000000000"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "timeZone": "Asia/Karachi"
  }
}
```

#### Retrieve a booking

`GET /api/bookings/{id}`

Success: `200 OK`. The response contains `data.booking` with the booking fields and customer object shown in the list response, plus `data.timeZone` for the active organization.

Returns `404 NOT_FOUND` when the booking does not exist in the active organization.

#### Update a booking

`PATCH /api/bookings/{id}`

Provide one or more of the following fields. Unknown fields are rejected, and at least one field is required.

```json
{
  "customerId": "customer-id",
  "startsAt": "2026-11-26T10:00:00+05:00",
  "status": "CONFIRMED"
}
```

- `customerId`: non-empty string up to 255 characters; the customer must be active and belong to the active organization.
- `startsAt`: ISO date-time with offset. The server recalculates `endsAt` using the booking's saved service duration.
- `status`: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, or `NO_SHOW`.

Success: `200 OK`, returning `data.booking` with the updated booking and customer. The saved service and price snapshots are not changed by this endpoint.

Returns `400 VALIDATION_ERROR` for an invalid or empty update, `404 NOT_FOUND` when the booking or requested customer is not found in the active organization.

#### Cancel a booking

`DELETE /api/bookings/{id}`

No request body is required. This is a soft cancellation; the booking record remains available.

Success: `200 OK`

```json
{
  "data": {
    "booking": {
      "id": "booking-id",
      "status": "CANCELLED"
    }
  }
}
```

Only `PENDING` and `CONFIRMED` bookings can be cancelled. Repeating the request for an already-cancelled booking also returns success. `COMPLETED` and `NO_SHOW` bookings return `409 CONFLICT`. A booking outside the active organization returns `404 NOT_FOUND`.

## Idempotency

Booking creation requires an `Idempotency-Key` header. The key is trimmed and must contain 1–255 characters. Keys are scoped to the active organization and retained for 24 hours.

- Repeating a request with the same key and same validated payload replays the saved HTTP status and response; it does not create another booking.
- Reusing a key with a different payload returns `409 IDEMPOTENCY_KEY_REUSED`.
- The request hash is based on the HTTP method, endpoint path, and normalized request payload.

Use a new key for a new booking attempt. Do not reuse a key for a different booking payload.

## Error responses

Errors use this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "issues": [
      {
        "path": ["startsAt"],
        "message": "Invalid ISO date-time",
        "code": "invalid_format"
      }
    ]
  }
}
```

`issues` is present for Zod validation errors and contains the field path, message, and validation code.

| HTTP status | Error code               | Meaning                                                      |
| ----------: | ------------------------ | ------------------------------------------------------------ |
|       `400` | `VALIDATION_ERROR`       | Invalid JSON, header, query parameter, or request body       |
|       `401` | `UNAUTHENTICATED`        | No valid authenticated session                               |
|       `403` | `ORGANIZATION_REQUIRED`  | No active organization is selected                           |
|       `403` | `FORBIDDEN`              | User is not a member of the active organization              |
|       `404` | `NOT_FOUND`              | Requested record is not available in the active organization |
|       `409` | `CONFLICT`               | Operation cannot be completed in the current state           |
|       `409` | `IDEMPOTENCY_KEY_REUSED` | The key was already used with a different request payload    |
|       `500` | `INTERNAL_ERROR`         | Unexpected server-side failure                               |
