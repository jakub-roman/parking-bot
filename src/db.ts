import { DataSource } from 'typeorm'

export const db = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || 'parking-bot',
  entities: ['src/entity/*.{js,ts}'],
  synchronize: true
})
