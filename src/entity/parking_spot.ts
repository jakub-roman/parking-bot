import { BaseEntity, Entity, PrimaryColumn, OneToMany } from 'typeorm'
import { Reservation } from './reservation';

@Entity()
export class ParkingSpot extends BaseEntity {
  @PrimaryColumn()
    name!: string

  @OneToMany(() => Reservation, (reservation) => reservation.spot)
    reservations!: Reservation[]

  static async new (name: string): Promise<ParkingSpot> {
    const spot = new ParkingSpot()
    spot.name = name
    return spot.save()
  }

  static async available (date: Date): Promise<ParkingSpot[]> {
    return ParkingSpot
      .createQueryBuilder('spot')
      .where('name NOT IN (SELECT "spotName" FROM reservation WHERE "date" = :date)', { date: date })
      .getMany()
  }

  static async reserved (date: Date): Promise<ParkingSpot[]> {
    return ParkingSpot
      .createQueryBuilder('spot')
      .leftJoinAndSelect('spot.reservations', 'reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .where('reservation.date = :date', { date: date })
      .getMany()
  }
}
