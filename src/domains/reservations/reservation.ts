import "reflect-metadata";
import { Router } from "express";
import {
  getAvailability,
  createReservationHandler,
  listReservations,
  getReservationHandler,
  modifyReservationHandler,
  cancelReservationHandler,
} from "./controllers/reservationController";
import { validateReservation } from "../../shared/middleware/validation";

const router = Router();

router.get("/:id/availability", getAvailability);
router.post("/:id/reservations", validateReservation, createReservationHandler);
router.get("/:id/reservations", listReservations);
router.get("/:id/reservations/:reservationId", getReservationHandler);
router.patch("/:id/reservations/:reservationId", modifyReservationHandler);
router.delete("/:id/reservations/:reservationId", cancelReservationHandler);

export default router;
