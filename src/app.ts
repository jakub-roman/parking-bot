import 'reflect-metadata'
import { RTMClient } from '@slack/rtm-api'
import { WebClient } from '@slack/web-api'
import { Logger } from 'tslog'
import { Message } from './types'
import { Bot } from './lib/bot'
import { db } from './db'
const token: string = process.env.SLACK_TOKEN ?? ''
const rtm: RTMClient = new RTMClient(token)
const web: WebClient = new WebClient(token)
const log: Logger = new Logger()

function getResponseFunc (channel: string): (response: string) => void {
  return (response: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    rtm.sendMessage(response, channel)
  }
}

async function getUserName (id: string): Promise<string> {
  return await web.users.info({ user: id }).then((u) => {
    return u.user?.name ?? 'unknown'
  })
}

db.initialize().then(() => {
  log.info('Sucesfully connected to database!')

  rtm.start().then((response: any) => {
    if (response.ok) { // eslint-disable-line @typescript-eslint/strict-boolean-expressions
      log.info(`Connected to slack as '${response.self.name}'`)
    } else {
      throw Error(`Can't connect to slack: ${response.error}`)
    }

    const adminUsers: string[] = (process.env.BOT_ADMIN_USERS || '').split(',')
    const bot: Bot = new Bot(response.self, log, adminUsers)

    rtm.on('message', (message: Message) => {
      log.debug(`Received event: ${JSON.stringify(message)}`)
      const respFunc = getResponseFunc(message.channel)
      getUserName(message.user).then((user) => {
        message.username = user
        bot.handle(message, respFunc).catch((e) => {
          log.error(`Can't handle event '${message.text}': ${e.message}`)
          respFunc(e.message)
        })
      }).catch((e) => {
        log.error(`Can't handle event '${message.text}': ${e.message}`)
        respFunc(e.message)
      })
    })
  }).catch((e) => {
    log.error(`Can't connect to slack: ${e.message}`)
  })
}).catch((e) => {
  log.error(`Can't connect to database: ${e.message}`)
})
