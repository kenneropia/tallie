import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

@Entity({ name: "restaurant_table" })
export class Table {
  @PrimaryGeneratedColumn("uuid")
    id: string;

  @Column("varchar")
    restaurantId: string;

  @Column("integer")
    tableNumber: number;

  @Column("integer")
    capacity: number;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;

  @ManyToOne("Restaurant", (restaurant: any) => restaurant.tables, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "restaurantId" })
    restaurant: any;
}
