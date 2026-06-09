import { promises as fs } from 'fs'
import path from 'path'
import PortfolioClient from '@/components/PortfolioClient'

async function getData() {
  const filePath = path.join(process.cwd(), 'data', 'portfolio.json')
  const raw = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

export const revalidate = 60 // ISR: rebuild every 60s after a request

export default async function Home() {
  const data = await getData()
  return <PortfolioClient data={data} />
}
