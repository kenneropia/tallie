import { restaurantPaths } from "../../domains/restaurants/restaurants.swagger";
import { tablePaths } from "../../domains/tables/tables.swagger";
import { availabilityPaths } from "../../domains/restaurants/availability";
import { reservationPaths } from "../../domains/reservations/reservations.swagger";
import { waitlistPaths } from "../../domains/waitlist/waitlist.swagger";

export const allPaths = {
  ...restaurantPaths,
  ...tablePaths,
  ...availabilityPaths,
  ...reservationPaths,
  ...waitlistPaths,
};
