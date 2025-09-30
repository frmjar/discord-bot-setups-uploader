import AdmZip from 'adm-zip'
import { readdirSync, unlinkSync } from 'fs'
import { rename } from 'fs/promises'
import { join } from 'path'

const { ROOT_FOLDER } = process.env

const unzip = (filePath, folder) => {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(filePath)
      zip.extractAllTo(folder, true)
      console.log(`✅ Descomprimido: ${filePath.split('\\').pop()}`)

      unlinkSync(filePath)
      console.log(`🗑️ Eliminado: ${filePath.split('\\').pop()}`)

      resolve()
    } catch (error) {
      console.error(`❌ Error al descomprimir ${filePath.split('\\').pop()}: ${error.message}`)
      reject(error)
    }
  })
}

const organizeSetups = async (setupsFolder) => {
  const folder = join(ROOT_FOLDER, setupsFolder)
  const files = readdirSync(folder, { withFileTypes: true })

  const zipFiles = files.filter(f => f.name.endsWith('.zip'))
  await Promise.all(zipFiles.map(f => unzip(join(folder, f.name), folder)))

  const filesUpdated = readdirSync(folder, { withFileTypes: true, recursive: true })
  const stoFiles = filesUpdated.filter(f => f.name.endsWith('.sto') || f.name.endsWith(' .sto'))

  const movePromises = stoFiles.map(async file => {
    const name = file.name
    const filePath = join(file.path || file.parentPath, name)
    const destinationPath = join(folder, name)
    await rename(filePath, destinationPath)
    console.warn(`✅ Movido: ${name} a la carpeta ${setupsFolder}`)
  })

  return await Promise.all(movePromises)
}

const descomprimirSetups = async () => {
  return Promise.all([
    organizeSetups('GTE'),
    organizeSetups('CARROZADOS'),
    organizeSetups('NASCAR'),
    organizeSetups('FORMULAS'),
    organizeSetups('SIM LAB'),
    organizeSetups('Sports Car'),
    organizeSetups('GT SPRINT'),
    organizeSetups('IMSA')
  ])
}

await descomprimirSetups()
