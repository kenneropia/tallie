import { createClient, RedisClientType } from "redis";
import { AVAILABILITY_TTL, RESTAURANT_TTL } from "./utils/constants";

let redisClient: RedisClientType | null = null;

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("Redis connected");
    });
  }

  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.connect();
  } catch (error) {
    console.error("Redis connection failed:", error);
  }
};

const buildAvailabilityKey = (
  restaurantId: string,
  date: string,
  partySize: number,
  duration: number
): string => {
  return `availability:${restaurantId}:${date}:${partySize}:${duration}`;
};

export const getAvailabilityCache = async (
  restaurantId: string,
  date: string,
  partySize: number,
  duration: number
): Promise<Record<string, unknown> | null> => {
  try {
    const client = getRedisClient();
    
    if (!client.isOpen) {
      return null;
    }
    
    const key = buildAvailabilityKey(restaurantId, date, partySize, duration);
    const cached = await client.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

export const setAvailabilityCache = async (
  restaurantId: string,
  date: string,
  partySize: number,
  duration: number,
  data: Record<string, unknown>
): Promise<void> => {
  try {
    const client = getRedisClient();
    
    if (!client.isOpen) {
      return;
    }
    
    const key = buildAvailabilityKey(restaurantId, date, partySize, duration);
    await client.setEx(key, AVAILABILITY_TTL, JSON.stringify(data));
  } catch (error) {
    console.error("Redis set error:", error);
  }
};

export const invalidateAvailabilityCache = async (
  restaurantId: string,
  date: string
): Promise<void> => {
  try {
    const client = getRedisClient();
    
    // Check if client is connected before attempting operations
    if (!client.isOpen) {
      return;
    }
    
    const pattern = `availability:${restaurantId}:${date}:*`;
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error("Redis invalidate error:", error);
  }
};

export const getRestaurantDetailsCache = async (
  restaurantId: string
): Promise<Record<string, unknown> | null> => {
  try {
    const client = getRedisClient();
    
    if (!client.isOpen) {
      return null;
    }
    
    const key = `restaurant:${restaurantId}:details`;
    const cached = await client.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

export const setRestaurantDetailsCache = async (
  restaurantId: string,
  data: Record<string, unknown>
): Promise<void> => {
  try {
    const client = getRedisClient();
    
    if (!client.isOpen) {
      return;
    }
    
    const key = `restaurant:${restaurantId}:details`;
    await client.setEx(key, RESTAURANT_TTL, JSON.stringify(data));
  } catch (error) {
    console.error("Redis set error:", error);
  }
};

export const invalidateRestaurantCache = async (
  restaurantId: string
): Promise<void> => {
  try {
    const client = getRedisClient();

    // Check if client is connected before attempting operations
    if (!client.isOpen) {
      return;
    }

    const detailsKey = `restaurant:${restaurantId}:details`;
    await client.del(detailsKey);

    const pattern = `availability:${restaurantId}:*`;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.error("Redis invalidate error:", error);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
