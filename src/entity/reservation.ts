import { Index, BaseEntity, Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm'
import { User } from './user'
import { ParkingSpot } from './parking_spot';
import { BotOutputError } from '../errors';

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

  static async new (date: Date, user: User, spot: ParkingSpot): Promise<Reservation> {
    const reservation = new Reservation()
    reservation.date = date
    reservation.user = user
    reservation.spot = spot
    return reservation.save()
      .catch((e) => {
        if (e.message.match(RegExp(`duplicate key value violates`))){
          throw new BotOutputError(`Spot ${spot.name} already reserved`)
        } else {
          throw e
        }
      })
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

    if (reservation == null) return `There's no reservation on date ${date.toDateString()} for user ${username}`

    await reservation.remove()
    return `Cancel reservation on ${reservation.date}, spot ${reservation.spot.name}, user ${reservation.user.name}`
  }
}
