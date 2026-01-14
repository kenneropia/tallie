import { DataSource } from "typeorm";
import { Restaurant } from "./domains/restaurants/entities/Restaurant";
import { Table } from "./domains/tables/entities/Table";
import { Reservation } from "./domains/reservations/entities/Reservation";
import { Waitlist } from "./domains/waitlist/entities/Waitlist";
import * as dataSourceModule from "./shared/database/dataSource";

let testDataSource: DataSource;

beforeAll(async () => {
  testDataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    entities: [Restaurant, Table, Reservation, Waitlist],
    synchronize: true,
    logging: false,
  });

  await testDataSource.initialize();
  // Replace the AppDataSource export with our test instance
  (dataSourceModule as any).AppDataSource = testDataSource;
});

// Note: beforeEach is deliberately NOT clearing data to preserve beforeAll setup data
// Each test suite should manage its own test data or use separate database transactions

afterAll(async () => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
});

export { testDataSource };
