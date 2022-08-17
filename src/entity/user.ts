import { BaseEntity, Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { Reservation } from "./reservation";

@Entity()
export class User extends BaseEntity {
  @PrimaryColumn()
  name!: string;

  @Column()
  id!: string;

  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations!: Reservation[]

  static new(name: string, id: string): Promise<User> {
    const user: User = new User()
    user.name = name
    user.id = id
    return user.save()
  }
}
