import request from "supertest";
import { DataSource } from "typeorm";
import express, { Application } from "express";
import { Restaurant } from "./entities/Restaurant";
import { Table } from "../tables/entities/Table";
import { Reservation } from "../reservations/entities/Reservation";
import { Waitlist } from "../waitlist/entities/Waitlist";

let app: Application;
let dataSource: DataSource;

beforeAll(async () => {
  dataSource = new DataSource({
    type: "sqlite",
    database: ":memory:",
    entities: [Restaurant, Table, Reservation, Waitlist],
    synchronize: true,
    logging: false,
  });
  await dataSource.initialize();

  app = express();
  app.use(express.json());

  app.post("/api/restaurants", async (req, res, next) => {
    try {
      const restaurant = dataSource.getRepository(Restaurant).create(req.body);
      await dataSource.getRepository(Restaurant).save(restaurant);
      res.status(201).json(restaurant);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/restaurants/:id", async (req, res, next) => {
    try {
      const restaurant = await dataSource.getRepository(Restaurant).findOne({
        where: { id: req.params.id },
        relations: ["tables"],
      });
      if (!restaurant) {
        return res
          .status(404)
          .json({ error: "Not found", message: "Restaurant not found" });
      }
      res.json(restaurant);
    } catch (error) {
      next(error);
    }
  });

  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      res.status(500).json({ error: "Server error", message: err.message });
    },
  );
});

afterAll(async () => {
  if (dataSource) {
    await dataSource.destroy();
  }
});

describe("Restaurant API", () => {
  describe("POST /api/restaurants", () => {
    it("should create a valid restaurant", async () => {
      const response = await request(app)
        .post("/api/restaurants")
        .send({
          name: "Test Restaurant",
          openingTime: "10:00",
          closingTime: "22:00",
        })
        .expect(201);

      expect(response.body.name).toBe("Test Restaurant");
      expect(response.body.openingTime).toBe("10:00");
      expect(response.body.closingTime).toBe("22:00");
      expect(response.body.id).toBeDefined();
    });

    it("should create restaurant even with invalid time format (no validation at entity level)", async () => {
      const response = await request(app)
        .post("/api/restaurants")
        .send({
          name: "Test Restaurant",
          openingTime: "25:00",
          closingTime: "22:00",
        })
        .expect(201);

      expect(response.body.name).toBe("Test Restaurant");
      expect(response.body.openingTime).toBe("25:00");
    });

    it("should create restaurant with times in any order (no validation at entity level)", async () => {
      const response = await request(app)
        .post("/api/restaurants")
        .send({
          name: "Test Restaurant",
          openingTime: "22:00",
          closingTime: "10:00",
        })
        .expect(201);

      expect(response.body.name).toBe("Test Restaurant");
    });
  });

  describe("GET /api/restaurants/:id", () => {
    it("should return restaurant with tables", async () => {
      const restaurant = await dataSource.getRepository(Restaurant).create({
        name: "Test Restaurant",
        openingTime: "10:00",
        closingTime: "22:00",
      });
      await dataSource.getRepository(Restaurant).save(restaurant);

      const table = await dataSource.getRepository(Table).create({
        restaurantId: restaurant.id,
        tableNumber: 1,
        capacity: 4,
      });
      await dataSource.getRepository(Table).save(table);

      const response = await request(app)
        .get(`/api/restaurants/${restaurant.id}`)
        .expect(200);

      expect(response.body.name).toBe("Test Restaurant");
      expect(response.body.tables).toHaveLength(1);
      expect(response.body.tables[0].tableNumber).toBe(1);
    });

    it("should return 404 for non-existent restaurant", async () => {
      const response = await request(app)
        .get("/api/restaurants/non-existent-id")
        .expect(404);

      expect(response.body.error).toBe("Not found");
    });
  });
});
