import { ParkingSpot } from "../entities";

export async function spotAdmin(command: string, parameter: string | null, help: string): Promise<string> {
  switch(command) {
    case "list": {
      const spots = await ParkingSpot.find()
      return `Registered parking spots: ${spots.map(s => s.name).join(" ")}`
    }

    case "create": {
      const spot = await ParkingSpot.new(parameter!)
      return `Created parking spot ${spot.name}`
    }

    case "delete": {
      if ( parameter === null ) return help

      const spot = await ParkingSpot.findOneBy({ name: parameter })
      if ( spot === null ){
        return `Parking spot ${parameter} doesn't exist`
      }else{
        await spot.remove()
        return `Deleted parking spot ${parameter}`
      }
    }

    default: {
      return help
    }
  }
}
