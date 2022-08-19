import { ParkingSpot } from '../entities'
import { BotOutputError } from '../errors'

export async function spotAdmin (command: string, parameter: string | null, help: string): Promise<string> {
  switch (command) {
    case 'list': {
      const spots = await ParkingSpot.find()
      const s = spots.length === 0 
      ? `None`
      : `\n${spots.map(s => `\t• *${s.name}*`).join('\n')}`
      return `Registered parking spots:${s}`
    }

    case 'create': {
      if (!parameter) throw new BotOutputError(`spot create [name] - missing name parameter`)
      const spot = await ParkingSpot.new(parameter)
      return `Created parking spot *${spot.name}*`
    }

    case 'delete': {
      if (!parameter) throw new BotOutputError(`spot delete [name] - missing name parameter`)

      const spot = await ParkingSpot.findOneBy({ name: parameter })
      if (spot === null) {
        return `Parking spot *${parameter}* doesn't exist`
      } else {
        await spot.remove()
        return `Deleted parking spot *${parameter}*`
      }
    }

    default: {
      return help
    }
  }
}
