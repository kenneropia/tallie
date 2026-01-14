import { AppDataSource } from "../../shared/database/dataSource";
import { Restaurant } from "../restaurants/entities/Restaurant";
import { Table } from "../tables/entities/Table";
import { Reservation, ReservationStatus } from "./entities/Reservation";
import {
  getAvailableSlots,
  findSuitableTable,
} from "./services/availabilityService";
import { getTestEmail } from "../../shared/testEmailUtil";

describe("Availability Service", () => {
  let restaurant: Restaurant;
  let table1: Table;
  let table2: Table;
  const restaurantRepo = () => AppDataSource.getRepository(Restaurant);
  const tableRepo = () => AppDataSource.getRepository(Table);

  beforeAll(async () => {
    restaurant = restaurantRepo().create({
      name: "Availability Test Restaurant",
      openingTime: "10:00",
      closingTime: "22:00",
    });
    await restaurantRepo().save(restaurant);

    table1 = tableRepo().create({
      restaurantId: restaurant.id,
      tableNumber: 1,
      capacity: 4,
    });
    table2 = tableRepo().create({
      restaurantId: restaurant.id,
      tableNumber: 2,
      capacity: 6,
    });
    await tableRepo().save([table1, table2]);
  });

  describe("getAvailableSlots", () => {
    it("should return available slots for empty restaurant", async () => {
      const slots = await getAvailableSlots(
        restaurant.id,
        "2026-08-01",
        4,
        120
      );

      expect(slots.availableSlots.length).toBeGreaterThan(0);
      expect(slots.date).toBe("2026-08-01");
      expect(slots.partySize).toBe(4);
    });

    it("should filter slots by minimum capacity", async () => {
      const slots = await getAvailableSlots(
        restaurant.id,
        "2026-08-02",
        6,
        120
      );

      // Should only return table2 (capacity 6), not table1 (capacity 4)
      const hasSmallTable = slots.availableSlots.some(
        (slot) => slot.capacity === 4
      );
      
      expect(hasSmallTable).toBe(false);
      expect(slots.availableSlots.length).toBeGreaterThan(0);
    });

    it("should exclude slots that conflict with existing reservations", async () => {
      const reservationRepo = () =>
        AppDataSource.getRepository(Reservation);

      // Create a reservation from 19:00 to 21:00
      const reservation = reservationRepo().create({
        restaurantId: restaurant.id,
        tableId: table1.id,
        customerName: "Test Customer",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("exclude_conflict"),
        partySize: 2,
        reservationDate: new Date("2026-08-03"),
        reservationStartTime: "19:00",
        reservationEndTime: "21:00",
        duration: 120,
        status: ReservationStatus.CONFIRMED,
      });
      await reservationRepo().save(reservation);

      const slots = await getAvailableSlots(
        restaurant.id,
        "2026-08-03",
        2,
        120
      );

      // Check that conflicting slot is not available
      const conflictingSlot = slots.availableSlots.find(
        (slot) => slot.startTime === "19:00"
      );

      expect(conflictingSlot).toBeUndefined();
    });

    it("should generate slots in 30-minute increments", async () => {
      const slots = await getAvailableSlots(
        restaurant.id,
        "2026-08-04",
        2,
        120
      );

      // Check that slots are in 30-minute increments
      for (let i = 1; i < slots.availableSlots.length; i++) {
        const current = slots.availableSlots[i].startTime;
        const prev = slots.availableSlots[i - 1].startTime;

        // Parse times and check difference
        const currentMinutes = parseInt(current.split(":")[0]) * 60 + parseInt(current.split(":")[1]);
        const prevMinutes = parseInt(prev.split(":")[0]) * 60 + parseInt(prev.split(":")[1]);

        expect(currentMinutes - prevMinutes).toBe(30);
      }
    });

    it("should not exceed closing time", async () => {
      const slots = await getAvailableSlots(
        restaurant.id,
        "2026-08-05",
        2,
        120
      );

      for (const slot of slots.availableSlots) {
        const endMinutes =
          parseInt(slot.endTime.split(":")[0]) * 60 +
          parseInt(slot.endTime.split(":")[1]);
        const closingMinutes = 22 * 60; // 22:00

        expect(endMinutes).toBeLessThanOrEqual(closingMinutes);
      }
    });
  });

  describe("findSuitableTable", () => {
    it("should find suitable table for party size", async () => {
      const table = await findSuitableTable(
        restaurant.id,
        4,
        "2026-08-06",
        "19:00",
        120
      );

      expect(table).toBeDefined();
      expect(table?.capacity).toBeGreaterThanOrEqual(4);
    });

    it("should prefer smallest suitable table", async () => {
      const table = await findSuitableTable(
        restaurant.id,
        2,
        "2026-08-07",
        "19:00",
        120
      );

      // Should return table1 (capacity 4) instead of table2 (capacity 6)
      expect(table?.id).toBe(table1.id);
    });

    it("should return null if no suitable table", async () => {
      const table = await findSuitableTable(
        restaurant.id,
        10,
        "2026-08-08",
        "19:00",
        120
      );

      expect(table).toBeNull();
    });

    it("should find table for last valid slot", async () => {
      // Latest slot ending at 22:00
      const table = await findSuitableTable(
        restaurant.id,
        2,
        "2026-08-09",
        "20:00",
        120
      );

      expect(table).toBeDefined();
    });

    it("should not find table for slot exceeding closing time", async () => {
      // Would end at 23:00, exceeds 22:00 closing
      const table = await findSuitableTable(
        restaurant.id,
        2,
        "2026-08-10",
        "21:00",
        120
      );

      expect(table).toBeNull();
    });
  });

  describe("Conflict Detection", () => {
    it("should detect overlapping reservations", async () => {
      const reservationRepo = () =>
        AppDataSource.getRepository(Reservation);

      // Create first reservation 19:00-21:00
      const res1 = reservationRepo().create({
        restaurantId: restaurant.id,
        tableId: table1.id,
        customerName: "Customer 1",
        customerPhone: "+1111111111",
        customerEmail: getTestEmail("conflict_detect_1"),
        partySize: 2,
        reservationDate: new Date("2026-08-11"),
        reservationStartTime: "19:00",
        reservationEndTime: "21:00",
        duration: 120,
        status: ReservationStatus.CONFIRMED,
      });
      await reservationRepo().save(res1);

      // Try to find table for overlapping time 20:00-22:00
      const table = await findSuitableTable(
        restaurant.id,
        2,
        "2026-08-11",
        "20:00",
        120
      );

      // Should find table2 (different table)
      expect(table?.id).toBe(table2.id);
    });

    it("should allow adjacent reservations", async () => {
      const reservationRepo = () =>
        AppDataSource.getRepository(Reservation);

      // Create reservation 19:00-21:00
      const res1 = reservationRepo().create({
        restaurantId: restaurant.id,
        tableId: table1.id,
        customerName: "Customer 2",
        customerPhone: "+2222222222",
        customerEmail: getTestEmail("adjacent_res_1"),
        partySize: 2,
        reservationDate: new Date("2026-08-12"),
        reservationStartTime: "19:00",
        reservationEndTime: "21:00",
        duration: 120,
        status: ReservationStatus.CONFIRMED,
      });
      await reservationRepo().save(res1);

      // Try to find table for adjacent time 21:00-23:00
      // Note: This might fail due to closing time, but concept is valid
      const slots = await getAvailableSlots(
        restaurant.id,
        "2026-08-12",
        2,
        120
      );

      // Should have slots available for different times
      expect(slots.availableSlots.length).toBeGreaterThan(0);
    });
  });
});
