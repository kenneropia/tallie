import "reflect-metadata";
import { AppDataSource } from "./shared/database/dataSource";

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log("Database initialized");

    const migrations = await AppDataSource.runMigrations();
    console.log(`Ran ${migrations.length} migrations`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigrations();
