export const waitlistPaths = {
  "/restaurants/{id}/waitlist": {
    post: {
      summary: "Add to waitlist",
      tags: ["Waitlist"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["customerName", "customerPhone", "partySize", "requestedDate", "requestedTime"],
              properties: {
                customerName: { type: "string", example: "Jane Smith" },
                customerPhone: { type: "string", example: "+0987654321" },
                partySize: { type: "number", example: 6 },
                requestedDate: { type: "string", example: "2024-01-15" },
                requestedTime: { type: "string", example: "19:00" },
                preferredTimeRange: { type: "string", example: "18:00-20:00" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Added to waitlist" },
      },
    },
    get: {
      summary: "Get waitlist",
      tags: ["Waitlist"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Waitlist entries" },
      },
    },
  },
  "/restaurants/{id}/waitlist/{waitlistId}": {
    patch: {
      summary: "Update waitlist status",
      tags: ["Waitlist"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "waitlistId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["status"],
              properties: {
                status: { type: "string", enum: ["waiting", "notified", "expired"] },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Status updated" },
      },
    },
  },
};
