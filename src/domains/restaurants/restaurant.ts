import { Router } from "express";
import {
  createRestaurant,
  getRestaurant,
  getRestaurantDetails,
  updateRestaurant,
} from "./controllers/restaurantController";
import { validateRestaurant } from "../../shared/middleware/validation";

const router = Router();

router.post("/", validateRestaurant, createRestaurant);
router.get("/:id", getRestaurant);
router.get("/:id/details", getRestaurantDetails);
router.patch("/:id", updateRestaurant);

export default router;
