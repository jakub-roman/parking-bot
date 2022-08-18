import { Index, BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm'
import { User } from './user'
import { ParkingSpot } from './parking_spot';

@Entity()
@Index(['date', 'spot'], { unique: true })
export class Reservation extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: string

  @Column({ type: 'date' })
    date!: Date

  @ManyToOne(() => User, (user) => user.reservations)
    user!: User

  @ManyToOne(
    () => ParkingSpot,
    (spot) => spot.reservations,
    { onDelete: 'CASCADE' }
  )
    spot!: ParkingSpot

  static new async (date: Date, user: User, spot: ParkingSpot): Promise<Reservation> {
    const reservation = new Reservation()
    reservation.date = date
    reservation.user = user
    reservation.spot = spot
    return reservation.save()
  }

  static async findForUser (username: string, date: Date): Promise<Reservation | null> {
    return Reservation
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.spot', 'spot')
      .where({ user: { name: username }, date})
      .getOne()
  }

  static async removeUserReservation (username: string, date: Date): Promise<string> {
    const reservation = await Reservation.findForUser(username, date)

    if (reservation == null) throw new Error(`Can't find reservation on date ${date} with user ${username}`)

    await reservation.remove()
    return `Cancel reservation on ${reservation.date}, spot ${reservation.spot.name}, user ${reservation.user.name}`
  }
}
