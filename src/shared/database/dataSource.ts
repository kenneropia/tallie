import "reflect-metadata";
import { DataSource } from "typeorm";
import { Restaurant } from "../../domains/restaurants/entities/Restaurant";
import { Table } from "../../domains/tables/entities/Table";
import { Reservation } from "../../domains/reservations/entities/Reservation";
import { Waitlist } from "../../domains/waitlist/entities/Waitlist";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const migrationsPath = path.join(process.cwd(), "data", "migrations", "*.js");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: process.env.DATABASE_PATH || "./db.sqlite",
  synchronize: true,
  logging: process.env.LOG_LEVEL === "debug",
  entities: [Restaurant, Table, Reservation, Waitlist],
  migrations: [migrationsPath],
  subscribers: [],
});
