import { BaseEntity, Entity, PrimaryColumn, Column, OneToMany } from "typeorm"
import { Reservation } from "./reservation";

@Entity()
export class ParkingSpot extends BaseEntity {
  @PrimaryColumn()
  name!: string;

  @OneToMany(() => Reservation, (reservation) => reservation.spot)
  reservations!: Reservation[]

  static new(name: string): Promise<ParkingSpot> {
    const spot = new ParkingSpot()
    spot.name = name
    return spot.save()
  }

  static available(date: Date): Promise<ParkingSpot[]> {
    return ParkingSpot
    .createQueryBuilder("spot")
    .where('name NOT IN (SELECT "spotName" FROM reservation WHERE "date" = :date)', {date: date})
    .getMany()
  }

  static reserved(date: Date): Promise<ParkingSpot[]> {
    return ParkingSpot
    .createQueryBuilder("spot")
    .where('name IN (SELECT "spotName" FROM reservation WHERE "date" = :date)', {date: date})
    .getMany()
  }
}
