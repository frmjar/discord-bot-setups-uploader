import axios from 'axios'
import 'dotenv/config'
import { readFileSync } from 'fs'
import { downloadFile } from './services/downloadP1.js'
import { login } from './services/loginP1.js'

const BASE_URL = 'https://api.p1doks.com'
const { YEAR, WEEK, SEASON } = process.env

const getDataPacks = async (serie) => {
  try {
    const response = await axios.post(`${BASE_URL}/ql/data-packs`,
      {
        limit: 100,
        offset: 0,
        filters:
                {
                  Year: { _eq: YEAR },
                  Week: { _eq: WEEK },
                  Season: { _eq: SEASON },
                  Series: { _eq: serie }
                }
      }
    )
    return response.data
  } catch (error) {
    console.error('Failed to fetch data packs:', error)
    throw error
  }
}

const processSerie = async (serie, folder, bearer, userId) => {
  const { data_pack: dataPacks } = await getDataPacks(serie)

  if (dataPacks.length === 0) {
    return
  }

  for (const dataPack of dataPacks) {
    const { id: dataPackId, Series, Track, Car } = dataPack
    const info = { Series, Track, folder }

    const setup = {
      userId,
      dataPackId,
      dataPackName: `W${WEEK}-${Series}-${Car}${Track}`
    }

    await downloadFile(setup, bearer, info)
    console.log('Downloaded:', setup.dataPackName)
  }
}

try {
  const { bearer, userId } = await login()
  const seriesData = JSON.parse(readFileSync('./seriesP1.json', 'utf-8'))

  await Promise.all(
    Object.entries(seriesData.series).map(([serie, folder]) => processSerie(serie, folder, bearer, userId))
  )
} catch (error) {
  console.error('An error occurred:', error)
}
