import AdmZip from 'adm-zip'
import { Client, GatewayIntentBits } from 'discord.js'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const canales = JSON.parse(readFileSync('./canales_guild.json', 'utf-8'))
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const { TOKEN, GUILD_ID } = process.env
const ROOT_FOLDER = 'C:\\Users\\felix\\Desktop\\pruebas'

const obtenerMarca = (nombre) => {
  const lower = nombre.toLowerCase()
  if (lower.includes('pcup') || lower.includes('porschecup')) return 'porsche-cup'
  if (lower.includes('c8') || lower.includes('corvette')) return 'corvette'
  if (lower.includes('911') || lower.includes('porsche') || lower.includes('rsr')) return 'porsche'
  if (lower.includes('m8') || lower.includes('bmw') || lower.includes('m2') || lower.includes('m4')) return 'bmw'
  if (lower.includes('488')) return 'ferrari'
  if (lower.includes('ford') || lower.includes('mustang')) return 'ford'
  if (lower.includes('mx5')) return 'mazda'
  if (lower.includes('newhampshire') || lower.includes('xfinity')) return 'clase-a-b-c'
  if (lower.includes('f3')) return 'dallara-f3'
  if (lower.includes('sfl')) return 'formula-light'
  if (lower.includes('superformula') || lower.includes('sf23')) return 'super-formula'
  if (lower.includes('ff1600')) return 'ray-1600'
  if (lower.includes('gr86') || lower.includes('gt86')) return 'toyota'
  if (lower.includes('lmp3')) return 'lmp3'
  if (lower.includes('aston') || lower.includes('vantage')) return 'aston-gt4'
  if (lower.includes('570')) return 'mclaren-gt4'
  if (lower.includes('merc')) return 'mercedes-gt4'
  if (lower.includes('718')) return 'porsche-gt4'
  return null
}

const obtenerCanal = (serie, marca) => canales[serie]?.find(c => c.nombre === marca)?.id

const obtenerProveedor = (nombre) => {
  const lower = nombre.toLowerCase()
  if (lower.includes('gng')) return 'GNG'
  if (lower.includes('p1doks')) return 'P1doks'
  if (lower.includes('vrs')) return 'VRS'
  if (lower.includes('hymo')) return 'HYMO'
  return 'elemao'
}

const unzip = (filePath, folder) => {
  const zip = new AdmZip(filePath)
  zip.extractAllTo(folder, true)
  console.log(`✅ Descomprimido: ${filePath.split('\\').pop()}`)
}

const zip = (setups, folder, canalId) => {
  const setupsZip = []
  for (const [proveedor, archivos] of Object.entries(setups)) {
    const zip = new AdmZip()

    archivos.forEach(archivo => {
      zip.addLocalFile(archivo)
    })

    const path = join(ROOT_FOLDER, folder, `${proveedor}-${canalId}.zip`)
    setupsZip.push(path)
    zip.writeZip(path)

    console.log(`✅ Comprimido: ${folder}-${proveedor}-${canalId}.zip`)
  }
  return setupsZip
}

async function organizeSetups (serie, organization = {}) {
  const folder = join(ROOT_FOLDER, serie)
  const files = readdirSync(folder, { withFileTypes: true })

  files.filter(f => f.name.endsWith('.zip')).forEach(f => unzip(join(folder, f.name), folder))

  const filesUpdated = readdirSync(folder, { withFileTypes: true })

  for (const file of filesUpdated.filter(f => f.name.endsWith('.sto') || f.name.endsWith(' .sto'))) {
    const name = file.name
    const filePath = join(folder, name)

    const coche = obtenerMarca(name) ?? ((serie === 'CARROZADOS' || serie === 'SIM LAB') ? 'mazda' : null)
    const proveedor = obtenerProveedor(name)
    const canal = obtenerCanal(serie, coche)

    if (!canal) {
      console.warn(`⚠️ No se encontró canal para el coche: ${coche} (archivo: ${name})`)
      continue
    }

    if (!organization[canal]) {
      organization[canal] = {}
    }

    if (!organization[canal][proveedor]) {
      organization[canal][proveedor] = []
    }

    organization[canal][proveedor].push(filePath)
  }

  return organization
}

const uploadSetups = async (guild, organization) => {
  for (const [canalId, archivos] of Object.entries(organization)) {
    const channel = guild.channels.cache.get(canalId)
    if (!channel) {
      console.warn(`⚠️ No se encontró el canal con ID: ${canalId}`)
      continue
    }

    const folder = Object.values(archivos)[0][0].split('\\').at(-2)
    const setupsZip = zip(archivos, folder, canalId.slice(-4))

    // await channel.send({
    // files: setupsZip
    // })

    console.log(`✅ Subidos: ${setupsZip.join(', ')} al canal ${channel.name}`)
  }
}

client.once('clientReady', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`)

  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) {
    console.error('❌ No se encontró el servidor. Revisa el GUILD_ID.')
    client.destroy()
    return
  }

  const [gte, carrozados, nascar, formulas, simLab, sportsCar] = await Promise.all([
    organizeSetups('GTE', {}),
    organizeSetups('CARROZADOS', {}),
    organizeSetups('NASCAR', {}),
    organizeSetups('FORMULAS', {}),
    organizeSetups('SIM LAB', {}),
    organizeSetups('Sports Car', {})
  ])

  const organization = { ...gte, ...carrozados, ...nascar, ...formulas, ...simLab, ...sportsCar }

  await uploadSetups(guild, organization)

  client.destroy()
})

client.login(TOKEN)
