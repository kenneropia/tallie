export const tablePaths = {
  "/restaurants/{id}/tables": {
    post: {
      summary: "Add a table to restaurant",
      tags: ["Tables"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["tableNumber", "capacity"],
              properties: {
                tableNumber: { type: "number", example: 5 },
                capacity: { type: "number", example: 6 },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Table created" },
        409: { description: "Table number already exists" },
      },
    },
    get: {
      summary: "Get all tables for restaurant",
      tags: ["Tables"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "List of tables" },
      },
    },
  },
  "/restaurants/{id}/tables/{tableId}": {
    patch: {
      summary: "Update a table",
      tags: ["Tables"],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" } },
        { name: "tableId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                capacity: { type: "number", example: 8 },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Table updated" },
        404: { description: "Table not found" },
      },
    },
  },
};
