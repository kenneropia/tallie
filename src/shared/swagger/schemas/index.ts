export const schemas = {
  Restaurant: {
    type: "object",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      openingTime: { type: "string" },
      closingTime: { type: "string" },
      createdAt: { type: "string" },
      updatedAt: { type: "string" },
    },
  },
  Table: {
    type: "object",
    properties: {
      id: { type: "string" },
      restaurantId: { type: "string" },
      tableNumber: { type: "number" },
      capacity: { type: "number" },
      createdAt: { type: "string" },
    },
  },
  Reservation: {
    type: "object",
    properties: {
      id: { type: "string" },
      restaurantId: { type: "string" },
      tableId: { type: "string" },
      customerName: { type: "string" },
      customerPhone: { type: "string" },
      partySize: { type: "number" },
      reservationDate: { type: "string" },
      reservationStartTime: { type: "string" },
      reservationEndTime: { type: "string" },
      duration: { type: "number" },
      status: { type: "string", enum: ["pending", "confirmed", "completed", "cancelled"] },
      createdAt: { type: "string" },
    },
  },
  Waitlist: {
    type: "object",
    properties: {
      id: { type: "string" },
      restaurantId: { type: "string" },
      customerName: { type: "string" },
      customerPhone: { type: "string" },
      partySize: { type: "number" },
      requestedDate: { type: "string" },
      requestedTime: { type: "string" },
      status: { type: "string", enum: ["waiting", "notified", "expired"] },
      createdAt: { type: "string" },
    },
  },
  Error: {
    type: "object",
    properties: {
      error: { type: "string" },
      message: { type: "string" },
    },
  },
};
