import { AppDataSource } from "../../shared/database/dataSource";
import { Restaurant } from "../restaurants/entities/Restaurant";
import { Table } from "../tables/entities/Table";
import { ReservationStatus } from "./entities/Reservation";
import {
  createReservation,
  modifyReservation,
  cancelReservation,
  getReservation,
  getReservationsByDate,
} from "./services/reservationService";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from "../../shared/utils/errors";
import { getTestEmail } from "../../shared/testEmailUtil";

describe("Reservation Service", () => {
  let restaurant: Restaurant;
  let table: Table;

  beforeAll(async () => {
    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const tableRepo = AppDataSource.getRepository(Table);

    restaurant = restaurantRepo.create({
      name: "Test Restaurant",
      openingTime: "10:00",
      closingTime: "22:00",
    });
    await restaurantRepo.save(restaurant);

    table = tableRepo.create({
      restaurantId: restaurant.id,
      tableNumber: 1,
      capacity: 4,
    });
    await tableRepo.save(table);
  });

  describe("createReservation", () => {
    it("should create a valid reservation", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("create_valid"),
        partySize: 4,
        reservationDate: "2026-02-15",
        reservationStartTime: "19:00",
        duration: 120,
      });

      expect(reservation).toBeDefined();
      expect(reservation.id).toBeDefined();
      expect(reservation.customerName).toBe("John Doe");
      expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
    });

    it("should reject reservation for non-existent restaurant", async () => {
      await expect(
        createReservation({
          restaurantId: "non-existent-id",
          customerName: "John Doe",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("nonexistent_restaurant"),
          partySize: 4,
          reservationDate: "2026-02-15",
          reservationStartTime: "19:00",
          duration: 120,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("should reject reservation in the past", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateString = pastDate.toISOString().split("T")[0];

      await expect(
        createReservation({
          restaurantId: restaurant.id,
          customerName: "John Doe",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("past_date"),
          partySize: 4,
          reservationDate: dateString,
          reservationStartTime: "19:00",
          duration: 120,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should reject reservation with invalid duration (too short)", async () => {
      await expect(
        createReservation({
          restaurantId: restaurant.id,
          customerName: "John Doe",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("duration_short"),
          partySize: 4,
          reservationDate: "2026-02-15",
          reservationStartTime: "19:00",
          duration: 15, // too short
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should reject reservation with invalid duration (too long)", async () => {
      await expect(
        createReservation({
          restaurantId: restaurant.id,
          customerName: "John Doe",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("duration_long"),
          partySize: 4,
          reservationDate: "2026-02-15",
          reservationStartTime: "19:00",
          duration: 500, // too long
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should reject reservation outside operating hours (before opening)", async () => {
      await expect(
        createReservation({
          restaurantId: restaurant.id,
          customerName: "John Doe",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("before_opening"),
          partySize: 4,
          reservationDate: "2026-02-15",
          reservationStartTime: "09:00", // before opening at 10:00
          duration: 120,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should reject reservation outside operating hours (after closing)", async () => {
      await expect(
        createReservation({
          restaurantId: restaurant.id,
          customerName: "John Doe",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("after_closing"),
          partySize: 4,
          reservationDate: "2026-02-15",
          reservationStartTime: "21:00", // ends at 23:00, after closing at 22:00
          duration: 120,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should reject reservation with party size exceeding table capacity", async () => {
      await expect(
        createReservation({
          restaurantId: restaurant.id,
          customerName: "John Doe",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("party_size_exceed"),
          partySize: 10, // table capacity is 4
          reservationDate: "2026-02-15",
          reservationStartTime: "19:00",
          duration: 120,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("should prevent duplicate reservations for same customer, date, and time", async () => {
      // Create first reservation
      const duplicateEmail = getTestEmail("duplicate");
      await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: duplicateEmail,
        partySize: 2,
        reservationDate: "2026-03-15",
        reservationStartTime: "19:00",
        duration: 120,
      });

      // Try to create duplicate
      await expect(
        createReservation({
          restaurantId: restaurant.id,
          customerName: "Jane Doe",
          customerPhone: "+0987654321",
          customerEmail: duplicateEmail,
          partySize: 2,
          reservationDate: "2026-03-15",
          reservationStartTime: "19:00",
          duration: 120,
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("modifyReservation", () => {
    it("should modify reservation time", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("modify_time"),
        partySize: 2,
        reservationDate: "2026-04-15",
        reservationStartTime: "19:00",
        duration: 120,
      });

      const modified = await modifyReservation(restaurant.id, reservation.id, {
        reservationStartTime: "20:00",
      });

      expect(modified.reservationStartTime).toBe("20:00");
    });

    it("should modify reservation duration", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("modify_duration"),
        partySize: 2,
        reservationDate: "2026-04-16",
        reservationStartTime: "19:00",
        duration: 120,
      });

      const modified = await modifyReservation(restaurant.id, reservation.id, {
        duration: 90,
      });

      expect(modified.duration).toBe(90);
    });

    it("should modify party size", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("modify_party"),
        partySize: 2,
        reservationDate: "2026-04-17",
        reservationStartTime: "19:00",
        duration: 120,
      });

      const modified = await modifyReservation(restaurant.id, reservation.id, {
        partySize: 3,
      });

      expect(modified.partySize).toBe(3);
    });

    it("should reject modification with invalid duration", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("modify_invalid"),
        partySize: 2,
        reservationDate: "2026-04-18",
        reservationStartTime: "19:00",
        duration: 120,
      });

      await expect(
        modifyReservation(restaurant.id, reservation.id, { duration: 15 }),
      ).rejects.toThrow(ValidationError);
    });

    it("should reject modification to cancelled reservation", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("modify_cancelled"),
        partySize: 2,
        reservationDate: "2026-04-19",
        reservationStartTime: "19:00",
        duration: 120,
      });

      await cancelReservation(restaurant.id, reservation.id);

      await expect(
        modifyReservation(restaurant.id, reservation.id, {
          reservationStartTime: "20:00",
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("should reject non-existent reservation", async () => {
      await expect(
        modifyReservation(restaurant.id, "non-existent-id", {
          reservationStartTime: "20:00",
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("cancelReservation", () => {
    it("should cancel a reservation", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("cancel_success"),
        partySize: 2,
        reservationDate: "2026-05-15",
        reservationStartTime: "19:00",
        duration: 120,
      });

      const cancelled = await cancelReservation(restaurant.id, reservation.id);

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
    });

    it("should reject cancelling already cancelled reservation", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("cancel_double"),
        partySize: 2,
        reservationDate: "2026-05-15",
        reservationStartTime: "19:00",
        duration: 120,
      });

      await cancelReservation(restaurant.id, reservation.id);

      await expect(
        cancelReservation(restaurant.id, reservation.id),
      ).rejects.toThrow(ConflictError);
    });

    it("should reject cancelling non-existent reservation", async () => {
      await expect(
        cancelReservation(restaurant.id, "non-existent-id"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getReservation", () => {
    it("should retrieve a reservation", async () => {
      const reservation = await createReservation({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("get_retrieve"),
        partySize: 2,
        reservationDate: "2026-06-15",
        reservationStartTime: "19:00",
        duration: 120,
      });

      const retrieved = await getReservation(restaurant.id, reservation.id);

      expect(retrieved.id).toBe(reservation.id);
      expect(retrieved.customerName).toBe("John Doe");
    });

    it("should reject retrieving non-existent reservation", async () => {
      await expect(
        getReservation(restaurant.id, "non-existent-id"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getReservationsByDate", () => {
    it("should retrieve reservations by date", async () => {
      const testDate = "2026-07-15";

      await createReservation({
        restaurantId: restaurant.id,
        customerName: "Customer 1",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("bydate_1"),
        partySize: 2,
        reservationDate: testDate,
        reservationStartTime: "19:00",
        duration: 90,
      });

      await createReservation({
        restaurantId: restaurant.id,
        customerName: "Customer 2",
        customerPhone: "+0987654321",
        customerEmail: getTestEmail("bydate_2"),
        partySize: 2,
        reservationDate: testDate,
        reservationStartTime: "20:30",
        duration: 90,
      });

      const reservations = await getReservationsByDate(restaurant.id, testDate);

      expect(reservations.length).toBe(2);
    });

    it("should return empty array for date with no reservations", async () => {
      const reservations = await getReservationsByDate(
        restaurant.id,
        "2026-08-15",
      );

      expect(reservations.length).toBe(0);
    });

    it("should filter by status", async () => {
      const testDate = "2026-09-15";

      const res1 = await createReservation({
        restaurantId: restaurant.id,
        customerName: "Customer 3",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("bystatus_1"),
        partySize: 2,
        reservationDate: testDate,
        reservationStartTime: "19:00",
        duration: 90,
      });

      await createReservation({
        restaurantId: restaurant.id,
        customerName: "Customer 4",
        customerPhone: "+0987654321",
        customerEmail: getTestEmail("bystatus_2"),
        partySize: 2,
        reservationDate: testDate,
        reservationStartTime: "20:30",
        duration: 90,
      });

      await getReservationsByDate(restaurant.id, testDate);

      // Cancel one
      await cancelReservation(restaurant.id, res1.id);

      const confirmedOnly = await getReservationsByDate(
        restaurant.id,
        testDate,
        ReservationStatus.CONFIRMED,
      );

      expect(confirmedOnly.length).toBe(1);
    });
  });
});
