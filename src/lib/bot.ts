import { Logger } from 'tslog';
import Sugar from "sugar"

import { Message, SlackUser } from "../types"
import { User, Reservation, ParkingSpot } from "../entities"
import { spotAdmin } from './spot_admin';

export class Bot {
  private log: Logger
  private user: SlackUser
  private adminUsers: string[]

  constructor(user: SlackUser, log: Logger, adminUsers: string[]) {
    this.user = user
    this.log = log
    this.adminUsers = adminUsers
  }

  public async handle(message: Message, respFunction: Function) : Promise<void> {
    this.log.debug(`Handling message '${message.text}'`)
    var text: string = this.stripUsername(message.text)

    var matchGroups: { [key: string]: string } | undefined

    if ( matchGroups = text.match(/^capacity\s*(?<date>.*)?$/i)?.groups ) {
      const date: Date = this.date(matchGroups.date) 

      this.capacity(date).then( (response) => {
        respFunction(response)
      })
    } else if ( matchGroups = text.match(/^reserve\s*(\s+spot\s+(?<spot>\w+))?(\s+(?<date>.*))?$/i)?.groups ) {
      const date: Date = this.date(matchGroups!.date)
      const user = await User.new(message.username!, message.user)

      const spotName: string = matchGroups!.spot
        ? matchGroups!.spot
        : await this.getAvailableSpot(date)

      const spot = await ParkingSpot.findOneBy({name: spotName})

      Reservation.new(date, user, spot!).then( () => {
        respFunction(`Reserved spot ${spotName} on ${date.toDateString()} for user ${user.name}`)
      })
    } else if ( matchGroups = text.match(/^cancel\s*(\s+(?<date>.*))?$/i)?.groups ) {
      const date: Date = this.date(matchGroups!.date)
      const response = Reservation.removeUserReservation(message.username!, date)

      respFunction(response)
    } else if ( matchGroups = text.match(/^spot\s+(?<spot_command>(list|create|delete))(\s+(?<spot_name>\w+))?$/i)?.groups ) {
      const user = message.username!
      if ( this.adminUsers.includes(user) ){
        const response = await spotAdmin(matchGroups.spot_command, matchGroups.spot_name, this.help())
        respFunction(response)
      }else{
        respFunction(`User ${user} is not allowed to manage spots`)
      }
    } else if ( text.match(/^help$/i) ) {
      respFunction(this.help())
    } else {
      throw new Error(`Unknown command '${text}'\n${this.help()}`)
    }
  }

  public help(): string {
    return `
Usage:
  <@${this.user.id}> <command> [arguments]

Commands:
  capacity [date]                 Show parking spots capacity on given date (default: today)
  reserve [date]                  Reserve random available spot on given date (default: today)
  reserve spot [spot] [date]      Reserve specific parking spot on given date (default: today)
  cancel [date]                   Cancel reservation on given date (default: today)

  Note: [date] can be any string supported by Sugar library, ie. 'tomorrow', 'next Monday', etc.
`
  }

  private async capacity(date: Date): Promise<string> {
    var response: string = ""

    // find reserved spots
    const reserved = await ParkingSpot.reserved(date)
    if(reserved.length === 0){
      response = response.concat(`No reserved spots\n`)
    }else{
      response = response.concat(`Reserved spots:\n${reserved.map(s => `• ${s.name}`).join("\n")}\n`)
    }

    // find available spots
    const available = await ParkingSpot.available(date)
    if(available.length === 0){
      response = response.concat('No available spots left\n')
    }else{
      response = response.concat(`Available spots:\n${available.map(s => `• ${s.name}`).join("\n")}\n`)
    }

    return response
  }

  private async getAvailableSpot(date: Date): Promise<string> {
    const spots = await ParkingSpot.available(date)
    if (spots.length === 0) throw new Error('No available spots left')
    return spots.shift()!.name
  }

  private date(date: string): Date {
    const d = Sugar.Date.create(date)
    if ( isNaN(d.getTime()) ) {
      throw new Error("Invalid Date")
    } else {
      return d
    }
  }

  private stripUsername(text: string): string {
    return text.replace(
      new RegExp(`^<@${this.user.id}>\\s*`),
      ""
    )
  }
}
