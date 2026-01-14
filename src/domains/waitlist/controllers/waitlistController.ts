import { Request, Response, NextFunction } from "express";
import {
  addToWaitlist,
  getWaitlist,
  updateWaitlistStatus,
} from "../services/waitlistService";
import { WaitlistStatus } from "../entities/Waitlist";
import { ValidationError } from "../../../shared/utils/errors";

export const addToWaitlistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = req.params.id as string;
    const {
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      requestedDate,
      requestedTime,
      preferredTimeRange,
    } = req.body;

    const waitlist = await addToWaitlist({
      restaurantId,
      customerName,
      customerPhone,
      customerEmail,
      partySize,
      requestedDate,
      requestedTime,
      preferredTimeRange,
    });

    res.status(201).json(waitlist);
  } catch (error) {
    next(error);
  }
};

export const getWaitlistHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const restaurantId = req.params.id as string;
    const { status } = req.query;

    const waitlist = await getWaitlist(restaurantId, status as string);

    const formatted = waitlist.map((entry, index: number) => ({
      id: entry.id,
      position: index + 1,
      customerName: entry.customerName,
      customerPhone: entry.customerPhone,
      partySize: entry.partySize,
      requestedDate: entry.requestedDate,
      requestedTime: entry.requestedTime,
      status: entry.status,
      createdAt: entry.createdAt,
    }));

    res.json({
      waitlist: formatted,
      total: waitlist.length,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWaitlistStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, waitlistId } = req.params as { id: string; waitlistId: string };
    const { status } = req.body;

    if (!Object.values(WaitlistStatus).includes(status)) {
      throw new ValidationError(
        "Invalid status. Must be: waiting, notified, or expired"
      );
    }

    const waitlist = await updateWaitlistStatus(id, waitlistId, status);

    res.json({
      id: waitlist.id,
      status: waitlist.status,
      updatedAt: waitlist.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};
