export interface SlackUser {
  id: string
  name: string
}

export interface SlackTeam {
  id: string
  name: string
  domain: string
}

export interface Message {
  type: string
  username: string
  user: string
  text: string
  channel: string
}
