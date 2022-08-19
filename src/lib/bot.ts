import { Logger } from 'tslog'
import Sugar from 'sugar'

import { Message, SlackUser } from '../types'
import { User, Reservation, ParkingSpot } from '../entities'
import { spotAdmin } from './spot_admin'
import { BotOutputError } from '../errors'

export class Bot {
  private readonly log: Logger
  private readonly user: SlackUser
  private readonly adminUsers: string[]

  constructor (user: SlackUser, log: Logger, adminUsers: string[]) {
    this.user = user
    this.log = log
    this.adminUsers = adminUsers
  }

  public async handle (message: Message): Promise<string> {
    this.log.debug(`Handling message '${message.text}'`)
    const text: string = this.stripUsername(message.text)

    let matchGroups: { [key: string]: string } | undefined

    if ((matchGroups = text.match(/^capacity\s*(?<date>.*)?$/i)?.groups) != null) {
      /*
       * Show parking capacity
       */
      const date: Date = this.date(matchGroups.date)

      return this.capacity(date)
    } else if ((matchGroups = text.match(/^reserve\s*(\s+spot\s+(?<spot>\w+))?(\s+(?<date>.*))?$/i)?.groups) != null) {
      /*
       * Reserve spot
       */
      const date: Date = this.date(matchGroups.date)
      const user = await User.new(message.username, message.user)

      const spotName: string = matchGroups.spot
        ? matchGroups.spot
        : await this.getAvailableSpot(date)

      const spot = await ParkingSpot.findOneBy({ name: spotName })
      if (spot == null) return `Spot ${spotName} doesn't exist!`

      const reservation = await Reservation.new(date, user, spot)

      return `Reserved spot *${reservation.spot.name}* on *${reservation.date.toDateString()}* for user *${reservation.user.name}*`
    } else if ((matchGroups = text.match(/^cancel\s*(\s+(?<date>.*))?$/i)?.groups) != null) {
      /*
       * Cancel reservation of spot
       */
      const date: Date = this.date(matchGroups.date)
      return Reservation.removeUserReservation(message.username, date)
    } else if ((matchGroups = text.match(/^spot\s+(?<spot_command>(list|create|delete))(\s+(?<spot_name>\w+))?$/i)?.groups) != null) {
      /*
       * This is admin section
       * Create/delete actions are only available to `admin` users
       */
      const user = message.username
      if (this.adminUsers.includes(user)) {
        return spotAdmin(matchGroups.spot_command, matchGroups.spot_name, this.help())
      } else {
        throw new BotOutputError(`User ${user} is not allowed to manage spots`)
      }
    } else if (text.match(/^help$/i) != null) {
      return this.help()
    } else {
      return `Unknown command '${text}'\n${this.help()}`
    }
  }

  public help (): string {
    return `
Usage:
  <@${this.user.id}> <command> [arguments]

Commands:
  capacity [date]                 Show parking spots capacity on given date (default: today)
  reserve [date]                  Reserve random available spot on given date (default: today)
  reserve spot [spot] [date]      Reserve specific parking spot on given date (default: today)
  cancel [date]                   Cancel reservation on given date (default: today)

  Note: [date] can be free text string such as 'tomorrow', 'next Monday', 'first of September' etc.
`
  }

  private async capacity (date: Date): Promise<string> {
    const reserved = await ParkingSpot.reserved(date)
    const r = reserved.length === 0 
      ? `None` 
      : `\n${reserved.map(s => `\t• *${s.name}* by user *${s.reservations[0].user.name}*`).join('\n')}`
    
    const available = await ParkingSpot.available(date)
    const a = available.length === 0 
      ? `None`
      : `\n${available.map(s => `\t• *${s.name}*`).join('\n')}`

    return `
Capacity on *${date.toDateString()}*:

Reserved spots: ${r}

Available spots: ${a}
`
  }

  private async getAvailableSpot (date: Date): Promise<string> {
    const spots = await ParkingSpot.available(date)
    if (spots.length === 0) throw new BotOutputError('No available spots left')
    return spots.shift()!.name
  }

  private date (date: string): Date {
    const d = Sugar.Date.create(date)
    if (isNaN(d.getTime())) {
      throw new BotOutputError('Invalid Date')
    } else {
      return d
    }
  }

  private stripUsername (text: string): string {
    return text.replace(
      new RegExp(`<@${this.user.id}>\\s*`),
      ''
    )
  }
}
