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

export enum WaitlistStatus {
  WAITING = "waiting",
  NOTIFIED = "notified",
  EXPIRED = "expired",
}

@Entity()
@Index(["restaurantId", "requestedDate"])
export class Waitlist {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column("varchar")
    restaurantId: string;

  @Column("varchar")
    customerName: string;

  @Column("varchar")
    customerPhone: string;

  @Column("varchar")
    customerEmail: string;

  @Column("integer")
    partySize: number;

  @Column("date")
    requestedDate: Date;

  @Column("time")
    requestedTime: string;

  @Column({ type: "varchar", nullable: true })
    preferredTimeRange: string;

  @Column({
    type: "varchar",
    enum: WaitlistStatus,
    default: WaitlistStatus.WAITING,
  })
    status: WaitlistStatus;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;

  @ManyToOne("Restaurant", (restaurant: any) => restaurant.waitlists, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "restaurantId" })
    restaurant: any;
}
