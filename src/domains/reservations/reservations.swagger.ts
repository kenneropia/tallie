export const reservationPaths = {
  "/restaurants/{id}/reservations": {
    post: {
      summary: "Create a reservation",
      tags: ["Reservations"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["customerName", "customerPhone", "customerEmail", "partySize", "reservationDate", "reservationStartTime", "duration"],
              properties: {
                customerName: { type: "string", example: "John Doe" },
                customerPhone: { type: "string", example: "+1234567890" },
                customerEmail: { type: "string", example: "john@example.com" },
                partySize: { type: "number", example: 4 },
                reservationDate: { type: "string", example: "2024-01-15" },
                reservationStartTime: { type: "string", example: "19:00" },
                duration: { type: "number", example: 120 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Reservation created" },
        409: { description: "No available tables" },
      },
    },
    get: {
      summary: "List reservations",
      tags: ["Reservations"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "date", in: "query", required: true, schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
      ],
      responses: {
        200: { description: "List of reservations" },
      },
    },
  },
  "/restaurants/{id}/reservations/{reservationId}": {
    get: {
      summary: "Get reservation details",
      tags: ["Reservations"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "reservationId", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Reservation details" },
        404: { description: "Reservation not found" },
      },
    },
    patch: {
      summary: "Modify reservation",
      tags: ["Reservations"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "reservationId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                reservationStartTime: { type: "string", example: "20:00" },
                duration: { type: "number", example: 90 },
                partySize: { type: "number", example: 5 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Reservation modified" },
        409: { description: "Time slot conflict" },
      },
    },
    delete: {
      summary: "Cancel reservation",
      tags: ["Reservations"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "reservationId", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Reservation cancelled" },
        404: { description: "Reservation not found" },
      },
    },
  },
};
