import axios from 'axios'
import fs from 'fs'
import path from 'path'

const { ROOT_FOLDER } = process.env

async function downloadFile (setup, bearer, info) {
  const pathComplete = `${ROOT_FOLDER}\\${info.folder}`

  if (!fs.existsSync(pathComplete)) {
    fs.mkdirSync(pathComplete, { recursive: true })
  }

  const filePath = path.join(pathComplete, setup.dataPackName + '.rar')
  const response = await axios.post('https://api.p1doks.com/api/files/download-all',
    { ...setup },
    {
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    }
  )

  const writer = fs.createWriteStream(filePath)

  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

export {
  downloadFile
}

