import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import * as dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./shared/swagger/swagger";
import { errorHandler } from "./shared/middleware/errorHandler";
import restaurantRoutes from "./domains/restaurants/restaurant";
import tableRoutes from "./domains/tables/table";
import reservationRoutes from "./domains/reservations/reservation";
import waitlistRoutes from "./domains/waitlist/waitlist";

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/restaurants", restaurantRoutes);
app.use("/api/restaurants", tableRoutes);
app.use("/api/restaurants", reservationRoutes);
app.use("/api/restaurants", waitlistRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

export default app;
