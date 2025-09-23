import AdmZip from 'adm-zip'
import { readdirSync, readFileSync } from 'fs'
import { mkdir, rename } from 'fs/promises'
import { join } from 'path'

const { semana, series } = JSON.parse(readFileSync('./config.json', 'utf-8'))
const { ROOT_FOLDER2 } = process.env

const SERIES_PATTERNS = {
  IMSA: /imsa|gtp|lmdh|p217|lmp2|mhv8/i,
  GTE: /gte|gtesprint|m8|s8|rsr|c8/i,
  'GT SPRINT': /gt sprint|gtsp|gts|sprint/i,
  'Sports Car': /718|gt4|lmp3|570/i,
  NASCAR: /xfinity|newhampshire|classa|copen/i,
  FORMULAS: /formula|f3|sfl|sf23|ff1600/i,
  CARROZADOS: /pcup|porschecup/i,
  'SIM LAB': /m2|gt86|gr86/i
}

const obtenerSerie = (nombre) => {
  for (const [serie, pattern] of Object.entries(SERIES_PATTERNS)) {
    if (pattern.test(nombre)) return serie
  }

  for (const [serie, keywords] of Object.entries(series)) {
    if (keywords && keywords.split('|').some(k => nombre.toLowerCase().includes(k.toLowerCase()))) {
      return serie
    }
  }

  return null
}

const unzip = (filePath, folder) => {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(filePath)
      zip.extractAllTo(folder, true)
      console.log(`✅ Descomprimido: ${filePath.split('\\').pop()}`)
      resolve()
    } catch (error) {
      console.error(`❌ Error al descomprimir ${filePath.split('\\').pop()}: ${error.message}`)
      reject(error)
    }
  })
}

const newFolder = async (serieFolder) => {
  try {
    await mkdir(serieFolder, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

const organizeSetups = async () => {
  const folder = join(ROOT_FOLDER2)
  const files = readdirSync(folder, { withFileTypes: true })

  const zipFiles = files.filter(f => f.name.endsWith('.zip'))
  await Promise.all(zipFiles.map(f => unzip(join(folder, f.name), folder)))

  const filesUpdated = readdirSync(folder, { withFileTypes: true, recursive: true })
  const stoFiles = filesUpdated.filter(f => f.name.endsWith('.sto') || f.name.endsWith(' .sto'))

  const procesar = join(folder, 'PARA PROCESAR')
  await newFolder(procesar)

  const organizacion = join(folder, semana)
  await newFolder(organizacion)

  const movePromises = stoFiles.map(async file => {
    const name = file.name
    const filePath = join(file.path, name)
    const serie = obtenerSerie(name)

    if (!serie) {
      const destinationPath = join(procesar, name)
      await rename(filePath, destinationPath)
      console.warn(`⚠️ Movido: ${name} a la carpeta PARA PROCESAR`)
    } else {
      await newFolder(join(organizacion, serie))
      const serieFolder = join(organizacion, serie)
      const destinationPath = join(serieFolder, name)
      await rename(filePath, destinationPath)
      console.log(`✅ Movido: ${name} a la carpeta ${serie}`)
    }
  })

  await Promise.all(movePromises)
}

await organizeSetups()
