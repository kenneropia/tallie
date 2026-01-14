import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./shared/database/dataSource";
import { connectRedis } from "./shared/cacheService";

const PORT = Number(process.env.PORT) || 3000;

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected");
    await connectRedis();
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs available at http://0.0.0.0:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
