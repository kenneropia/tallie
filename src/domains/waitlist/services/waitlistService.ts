import { AppDataSource } from "../../../shared/database/dataSource";
import { Restaurant } from "../../../domains/restaurants/entities/Restaurant";
import { Waitlist, WaitlistStatus } from "../entities/Waitlist";
import { NotFoundError, ValidationError } from "../../../shared/utils/errors";
import { notifyFromWaitlist } from "../../../shared/emailService";
import { findSuitableTable } from "../../reservations/services/availabilityService";
import { calculateEndTime } from "../../../shared/utils/validators";

const waitlistRepository = () => AppDataSource.getRepository(Waitlist);
const restaurantRepository = () => AppDataSource.getRepository(Restaurant);

export interface AddToWaitlistDTO {
  restaurantId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: number;
  requestedDate: string;
  requestedTime: string;
  preferredTimeRange?: string;
}

export const addToWaitlist = async (data: AddToWaitlistDTO): Promise<Waitlist> => {
  const restaurant = await restaurantRepository().findOne({
    where: { id: data.restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant not found");
  }

  const waitlist = waitlistRepository().create({
    restaurantId: data.restaurantId,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    partySize: data.partySize,
    requestedDate: new Date(data.requestedDate),
    requestedTime: data.requestedTime,
    preferredTimeRange: data.preferredTimeRange,
    status: WaitlistStatus.WAITING,
  });

  await waitlistRepository().save(waitlist);

  return waitlist;
};

export const getWaitlist = async (
  restaurantId: string,
  status?: string
): Promise<Waitlist[]> => {
  const restaurant = await restaurantRepository().findOne({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant not found");
  }

  const query = waitlistRepository()
    .createQueryBuilder("waitlist")
    .where("waitlist.restaurantId = :restaurantId", { restaurantId })
    .orderBy("waitlist.createdAt", "ASC");

  if (status) {
    query.andWhere("waitlist.status = :status", { status });
  }

  return query.getMany();
};

export const updateWaitlistStatus = async (
  restaurantId: string,
  waitlistId: string,
  status: WaitlistStatus
): Promise<Waitlist> => {
  const waitlist = await waitlistRepository().findOne({
    where: { id: waitlistId, restaurantId },
  });

  if (!waitlist) {
    throw new NotFoundError("Waitlist entry not found");
  }

  if (!Object.values(WaitlistStatus).includes(status)) {
    throw new ValidationError(
      "Invalid status. Must be: waiting, notified, or expired"
    );
  }

  waitlist.status = status;
  await waitlistRepository().save(waitlist);

  return waitlist;
};

export const notifyWaitlistOnCancellation = async (
  restaurantId: string,
  date: string,
  startTime: string,
  duration: number
): Promise<void> => {
  const waitlistEntries = await waitlistRepository()
    .createQueryBuilder("waitlist")
    .where("waitlist.restaurantId = :restaurantId", { restaurantId })
    .andWhere("waitlist.status = :status", { status: WaitlistStatus.WAITING })
    .andWhere("waitlist.requestedDate = :date", { date: new Date(date) })
    .getMany();

  const restaurant = await restaurantRepository().findOne({
    where: { id: restaurantId },
  });

  if (!restaurant) return;

  for (const entry of waitlistEntries) {
    const table = await findSuitableTable(
      restaurantId,
      entry.partySize,
      date,
      startTime,
      duration
    );

    if (table) {
      const endTime = calculateEndTime(startTime, duration);

      await notifyFromWaitlist(
        entry,
        {
          startTime,
          endTime,
          tableNumber: table.tableNumber,
        },
        restaurant.name
      );

      entry.status = WaitlistStatus.NOTIFIED;
      await waitlistRepository().save(entry);
    }
  }
};
