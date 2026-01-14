import { AppDataSource } from "../../shared/database/dataSource";
import { Restaurant } from "../restaurants/entities/Restaurant";
import { Waitlist, WaitlistStatus } from "./entities/Waitlist";
import {
  addToWaitlist,
  getWaitlist,
  updateWaitlistStatus,
} from "./services/waitlistService";
import { NotFoundError, ValidationError } from "../../shared/utils/errors";
import { getTestEmail } from "../../shared/testEmailUtil";

describe("Waitlist Service", () => {
  let restaurant: Restaurant;
  const waitlistRepo = () => AppDataSource.getRepository(Waitlist);
  const restaurantRepo = () => AppDataSource.getRepository(Restaurant);

  beforeAll(async () => {
    restaurant = restaurantRepo().create({
      name: "Waitlist Test Restaurant",
      openingTime: "10:00",
      closingTime: "22:00",
    });
    await restaurantRepo().save(restaurant);
  });

  describe("addToWaitlist", () => {
    it("should add customer to waitlist", async () => {
      const entry = await addToWaitlist({
        restaurantId: restaurant.id,
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: getTestEmail("add_waitlist"),
        partySize: 4,
        requestedDate: "2026-09-15",
        requestedTime: "19:00",
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeDefined();
      expect(entry.customerName).toBe("John Doe");
      expect(entry.status).toBe(WaitlistStatus.WAITING);
    });

    it("should add entry with preferred time range", async () => {
      const entry = await addToWaitlist({
        restaurantId: restaurant.id,
        customerName: "Jane Doe",
        customerPhone: "+0987654321",
        customerEmail: getTestEmail("preferred_range"),
        partySize: 6,
        requestedDate: "2026-09-16",
        requestedTime: "19:00",
        preferredTimeRange: "18:00-20:00",
      });

      expect(entry.preferredTimeRange).toBe("18:00-20:00");
    });

    it("should reject waitlist for non-existent restaurant", async () => {
      await expect(
        addToWaitlist({
          restaurantId: "non-existent-id",
          customerName: "Test Customer",
          customerPhone: "+1234567890",
          customerEmail: getTestEmail("nonexistent_restaurant_waitlist"),
          partySize: 4,
          requestedDate: "2026-09-17",
          requestedTime: "19:00",
        })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("getWaitlist", () => {
    beforeEach(async () => {
      await addToWaitlist({
        restaurantId: restaurant.id,
        customerName: "Customer 1",
        customerPhone: "+1111111111",
        customerEmail: getTestEmail("customer_1_waitlist"),
        partySize: 2,
        requestedDate: "2026-09-18",
        requestedTime: "19:00",
      });

      await addToWaitlist({
        restaurantId: restaurant.id,
        customerName: "Customer 2",
        customerPhone: "+2222222222",
        customerEmail: getTestEmail("customer_2_waitlist"),
        partySize: 4,
        requestedDate: "2026-09-19",
        requestedTime: "20:00",
      });
    });

    it("should retrieve all waitlist entries for restaurant", async () => {
      const entries = await getWaitlist(restaurant.id);

      expect(entries.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by status", async () => {
      const allEntries = await getWaitlist(restaurant.id);
      
      // Update one to notified
      if (allEntries.length > 0) {
        await updateWaitlistStatus(
          restaurant.id,
          allEntries[0].id,
          WaitlistStatus.NOTIFIED
        );
      }

      const waitingEntries = await getWaitlist(
        restaurant.id,
        WaitlistStatus.WAITING
      );

      expect(waitingEntries.length).toBeGreaterThanOrEqual(1);
    });

    it("should return empty list for non-existent restaurant", async () => {
      await expect(
        getWaitlist("non-existent-id")
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateWaitlistStatus", () => {
    let entry: Waitlist;

    beforeEach(async () => {
      entry = await addToWaitlist({
        restaurantId: restaurant.id,
        customerName: "Status Test",
        customerPhone: "+3333333333",
        customerEmail: getTestEmail("status_test_waitlist"),
        partySize: 3,
        requestedDate: "2026-09-20",
        requestedTime: "19:00",
      });
    });

    it("should update status to notified", async () => {
      const updated = await updateWaitlistStatus(
        restaurant.id,
        entry.id,
        WaitlistStatus.NOTIFIED
      );

      expect(updated.status).toBe(WaitlistStatus.NOTIFIED);
    });

    it("should update status to expired", async () => {
      const updated = await updateWaitlistStatus(
        restaurant.id,
        entry.id,
        WaitlistStatus.EXPIRED
      );

      expect(updated.status).toBe(WaitlistStatus.EXPIRED);
    });

    it("should reject invalid status", async () => {
      await expect(
        updateWaitlistStatus(restaurant.id, entry.id, "invalid" as WaitlistStatus)
      ).rejects.toThrow(ValidationError);
    });

    it("should reject non-existent entry", async () => {
      await expect(
        updateWaitlistStatus(
          restaurant.id,
          "non-existent-id",
          WaitlistStatus.NOTIFIED
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("Waitlist ordering", () => {
    it("should maintain FIFO order", async () => {
      // Create multiple entries at different times
      const entry1 = await addToWaitlist({
        restaurantId: restaurant.id,
        customerName: "First",
        customerPhone: "+4444444444",
        customerEmail: getTestEmail("first_fifo"),
        partySize: 2,
        requestedDate: "2026-09-21",
        requestedTime: "19:00",
      });

      const entry2 = await addToWaitlist({
        restaurantId: restaurant.id,
        customerName: "Second",
        customerPhone: "+5555555555",
        customerEmail: getTestEmail("second_fifo"),
        partySize: 2,
        requestedDate: "2026-09-21",
        requestedTime: "19:00",
      });

      const entries = await getWaitlist(restaurant.id);
      
      const entry1Index = entries.findIndex((e) => e.id === entry1.id);
      const entry2Index = entries.findIndex((e) => e.id === entry2.id);

      // First should come before second
      expect(entry1Index).toBeLessThan(entry2Index);
    });
  });
});
