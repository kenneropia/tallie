import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column("varchar")
    name: string;

  @Column("varchar")
    openingTime: string;

  @Column("varchar")
    closingTime: string;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;

  @OneToMany("Table", "restaurant", { cascade: true })
    tables: any[];

  @OneToMany("Reservation", "restaurant")
    reservations: any[];

  @OneToMany("Waitlist", "restaurant")
    waitlists: any[];
}
