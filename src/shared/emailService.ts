import { Resend } from "resend";
import { Reservation } from "../domains/reservations/entities/Reservation";
import { Waitlist } from "../domains/waitlist/entities/Waitlist";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL;

// Log email service initialization
console.log("[EMAIL] Service initialized");
console.log(`[EMAIL] API Key configured: ${!!process.env.RESEND_API_KEY}`);
console.log(`[EMAIL] From email: ${fromEmail}`);

export const sendConfirmationEmail = async (
  reservation: Reservation,
  restaurantName: string,
): Promise<Record<string, unknown>> => {
  const html = `
    <h1>Reservation Confirmed</h1>
    <p>Dear ${reservation.customerName},</p>
    <p>Your reservation has been confirmed:</p>
    <ul>
      <li><strong>Restaurant:</strong> ${restaurantName}</li>
      <li><strong>Date:</strong> ${reservation.reservationDate}</li>
      <li><strong>Time:</strong> ${reservation.reservationStartTime}</li>
      <li><strong>Party Size:</strong> ${reservation.partySize}</li>
    </ul>
    <p>We look forward to seeing you!</p>
  `;

  try {
    console.log(
      `[EMAIL] Sending confirmation email to ${reservation.customerEmail}`,
    );
    const result = await resend.emails.send({
      from: fromEmail || "onboarding@resend.dev",
      to: reservation.customerEmail,
      subject: `Reservation Confirmed - ${restaurantName}`,
      html,
    });

    return result;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return { error };
  }
};

export const sendModificationEmail = async (
  reservation: Reservation,
  restaurantName: string,
  changes: string,
): Promise<Record<string, unknown>> => {
  const html = `
    <h1>Reservation Modified</h1>
    <p>Dear ${reservation.customerName},</p>
    <p>Your reservation has been modified. Changes: ${changes}</p>
    <ul>
      <li><strong>Date:</strong> ${reservation.reservationDate}</li>
      <li><strong>Time:</strong> ${reservation.reservationStartTime}</li>
      <li><strong>Duration:</strong> ${reservation.duration} minutes</li>
    </ul>
  `;

  try {
    console.log(
      `[EMAIL] Sending modification email to ${reservation.customerEmail}`,
    );
    const result = await resend.emails.send({
      from: fromEmail || "onboarding@resend.dev",
      to: reservation.customerEmail,
      subject: `Reservation Modified - ${restaurantName}`,
      html,
    });

    return result;
  } catch (error) {
    console.error("Failed to send modification email:", error);
    return { error };
  }
};

export const sendCancellationEmail = async (
  reservation: Reservation,
  restaurantName: string,
): Promise<Record<string, unknown>> => {
  const html = `
    <h1>Reservation Cancelled</h1>
    <p>Dear ${reservation.customerName},</p>
    <p>Your reservation has been cancelled:</p>
    <ul>
      <li><strong>Date:</strong> ${reservation.reservationDate}</li>
      <li><strong>Time:</strong> ${reservation.reservationStartTime}</li>
    </ul>
    <p>We hope to see you again soon!</p>
  `;

  try {
    console.log(
      `[EMAIL] Sending cancellation email to ${reservation.customerEmail}`,
    );
    const result = await resend.emails.send({
      from: fromEmail || "onboarding@resend.dev",
      to: reservation.customerEmail,
      subject: `Reservation Cancelled - ${restaurantName}`,
      html,
    });

    return result;
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    return { error };
  }
};

export const notifyFromWaitlist = async (
  waitlist: Waitlist,
  availableSlot: { startTime: string; endTime: string; tableNumber: number },
  restaurantName: string,
): Promise<Record<string, unknown>> => {
  const html = `
    <h1>Good News!</h1>
    <p>Dear ${waitlist.customerName},</p>
    <p>A table is now available for your party:</p>
    <ul>
      <li><strong>Restaurant:</strong> ${restaurantName}</li>
      <li><strong>Date:</strong> ${waitlist.requestedDate}</li>
      <li><strong>Time:</strong> ${availableSlot.startTime} - ${availableSlot.endTime}</li>
      <li><strong>Table:</strong> ${availableSlot.tableNumber}</li>
      <li><strong>Party Size:</strong> ${waitlist.partySize}</li>
    </ul>
    <p>Please confirm your reservation within 30 minutes.</p>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail || "onboarding@resend.dev",
      to: waitlist.customerEmail,
      subject: `Table Available - ${restaurantName}`,
      html,
    });

    return result;
  } catch (error) {
    console.error("Failed to send waitlist notification:", error);
    return { error };
  }
};
