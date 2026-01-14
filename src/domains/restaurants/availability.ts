export const availabilityPaths = {
  "/restaurants/{id}/availability": {
    get: {
      summary: "Get available time slots",
      tags: ["Availability"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "date", in: "query", required: true, schema: { type: "string", example: "2024-01-15" } },
        { name: "partySize", in: "query", required: true, schema: { type: "number" } },
        { name: "duration", in: "query", schema: { type: "number", default: 120 } },
      ],
      responses: {
        200: { description: "Available slots" },
        400: { description: "Validation error" },
      },
    },
  },
};
