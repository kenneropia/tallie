import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import * as dotenv from "dotenv";
import { AppDataSource } from "./shared/database/dataSource";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./shared/swagger/swagger";
import { errorHandler } from "./shared/middleware/errorHandler";
import { connectRedis } from "./shared/cacheService";
import restaurantRoutes from "./domains/restaurants/restaurant";
import tableRoutes from "./domains/tables/table";
import reservationRoutes from "./domains/reservations/reservation";
import waitlistRoutes from "./domains/waitlist/waitlist";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

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

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected");
    
    // Connect to Redis
    await connectRedis();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });

export default app;
