export const restaurantPaths = {
  "/restaurants": {
    post: {
      summary: "Create a new restaurant",
      tags: ["Restaurants"],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "openingTime", "closingTime"],
              properties: {
                name: { type: "string", example: "The Italian Place" },
                openingTime: { type: "string", example: "10:00" },
                closingTime: { type: "string", example: "22:00" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Restaurant created successfully" },
        400: { description: "Validation error" },
      },
    },
  },
  "/restaurants/{id}": {
    get: {
      summary: "Get restaurant with available tables",
      tags: ["Restaurants"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Restaurant found" },
        404: { description: "Restaurant not found" },
      },
    },
    patch: {
      summary: "Update restaurant",
      tags: ["Restaurants"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                openingTime: { type: "string", example: "09:00" },
                closingTime: { type: "string", example: "23:00" },
                name: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Restaurant updated" },
        404: { description: "Restaurant not found" },
      },
    },
  },
  "/restaurants/{id}/details": {
    get: {
      summary: "Get full restaurant details with stats",
      tags: ["Restaurants"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Restaurant details" },
      },
    },
  },
};
