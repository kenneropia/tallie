import { Router } from "express";
import {
  addToWaitlistHandler,
  getWaitlistHandler,
  updateWaitlistStatusHandler,
} from "./controllers/waitlistController";
import { validateWaitlist } from "../../shared/middleware/validation";

const router = Router();

router.post("/:id/waitlist", validateWaitlist, addToWaitlistHandler);
router.get("/:id/waitlist", getWaitlistHandler);
router.patch("/:id/waitlist/:waitlistId", updateWaitlistStatusHandler);

export default router;
