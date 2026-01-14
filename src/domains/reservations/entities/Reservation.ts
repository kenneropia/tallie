import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

export enum ReservationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity()
@Index(["restaurantId", "reservationDate"])
@Index(["tableId", "reservationDate"])
export class Reservation {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column("varchar")
    restaurantId: string;

  @Column("varchar")
    tableId: string;

  @Column("varchar")
    customerName: string;

  @Column("varchar")
    customerPhone: string;

  @Column("varchar")
    customerEmail: string;

  @Column("integer")
    partySize: number;

  @Column("date")
    reservationDate: Date;

  @Column("time")
    reservationStartTime: string;

  @Column("time")
    reservationEndTime: string;

  @Column("integer")
    duration: number;

  @Column({
    type: "varchar",
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
  })
    status: ReservationStatus;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;

  @ManyToOne("Restaurant", (restaurant: any) => restaurant.reservations, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "restaurantId" })
    restaurant: any;

  @ManyToOne("Table", { onDelete: "CASCADE" })
  @JoinColumn({ name: "tableId" })
    table: any;
}
