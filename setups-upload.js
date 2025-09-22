import AdmZip from 'adm-zip'
import { Client, GatewayIntentBits } from 'discord.js'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const canales = JSON.parse(readFileSync('./canales_guild.json', 'utf-8'))
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const { TOKEN, GUILD_ID, ROOT_FOLDER } = process.env
const CURRENT_WEEK = ROOT_FOLDER.split('\\').pop()

const COCHES = {
  // GT3
  'ford-gt3': ['ford', 'mustang', 'fgt3'],
  'acura-gt3': ['acura', 'nsxgt3'],
  'mclaren-gt3': ['mclaren', '720'],
  'aston-martin-gt3': ['aston', 'vantagegt3'],
  'mercedes-gt3': ['amg', 'mercedes', 'mgt3'],
  'bmw-gt3': ['bmw', 'm4gt3'],
  'audi-gt3': ['audi', 'r8'],
  'lamborghini-gt3': ['lambo', 'lgt3', 'huracangt3'],
  'ferrari-gt3': ['ferrari', '296'],
  'porsche-gt3': ['porsche', '992', 'gt3r'],
  'corvette-gt3': ['corvette', 'z06gt3'],
  // LMDh/GTP
  'porsche-lmdh': ['963gtp', '499p'],
  'cadillac-lmdh': ['caddy', 'cadillacgtp'],
  'acura-lmdh': ['arx06'],
  'bmw-lmdh': ['mhv8'],
  'ferrari-lmdh': ['ferrarigtp', '499p'],
  // LMP2
  'dallara-p2': ['lmp2', 'p217'],
  // GT4
  'porsche-gt4': ['porsche', '718'],
  'aston-martin-gt4': ['aston', 'vantagegt4', 'astongt4'],
  'mclaren-gt4': ['mclaren', '570'],
  'mercedes-gt4': ['mercgt4'],
  'bmw-gt4': ['m4gt4', 'm4 gt4', 'bmwgt4'],
  'ford-gt4': ['mustanggt4', 'mustang gt4'],
  lmp3: ['lmp3'],
  // GTE
  ferrari: ['488'],
  ford: ['fordgte'],
  corvette: ['c8', 'corvettegte'],
  porsche: ['911', 'rsr', 'porschegte'],
  bmw: ['m2', 'm8', 'bmwgte'],
  // Fórmulas
  'dallara-f3': ['f3'],
  'formula-light': ['sfl'],
  'super-formula': ['superformula', 'sf23'],
  'ray-1600': ['ff1600'],
  // Otros
  mazda: ['mx5'],
  toyota: ['gr86', 'gt86'],
  'porsche-cup': ['pcup', 'porschecup'],
  'clase-a-b-c': ['newhampshire', 'xfinity']
}

const SERIES = {
  'GT SPRINT': [
    'ford-gt3', 'acura-gt3', 'mclaren-gt3', 'aston-martin-gt3', 'mercedes-gt3',
    'bmw-gt3', 'audi-gt3', 'lamborghini-gt3', 'ferrari-gt3', 'porsche-gt3', 'corvette-gt3'
  ],
  IMSA: [
    'ferrari-lmdh', 'ford-gt3', 'acura-gt3', 'mclaren-gt3', 'aston-martin-gt3', 'mercedes-gt3', 'bmw-gt3',
    'audi-gt3', 'lamborghini-gt3', 'ferrari-gt3', 'porsche-gt3', 'corvette-gt3', 'porsche-lmdh',
    'cadillac-lmdh', 'dallara-p2', 'acura-lmdh', 'bmw-lmdh', 'ferrari-lmdh', 'dallara-p2'
  ],
  'Sports Car': [
    'porsche-gt4', 'aston-martin-gt4', 'mclaren-gt4', 'mercedes-gt4', 'bmw-gt4', 'ford-gt4', 'lmp3'
  ]
}

const GLOBALES = [
  'mazda', 'toyota', 'ferrari', 'ford', 'corvette', 'porsche', 'porsche-cup', 'bmw',
  'dallara-f3', 'formula-light', 'super-formula', 'ray-1600', 'lmp3', 'clase-a-b-c'
]

const obtenerMarca = (nombre, serie) => {
  const lower = nombre.toLowerCase()
  // Buscar en la serie
  if (SERIES[serie]) {
    for (const coche of SERIES[serie]) {
      const keys = COCHES[coche]
      if (keys && keys.some(k => lower.includes(k))) return coche
    }
  }

  for (const coche of GLOBALES) {
    const keys = COCHES[coche]
    if (keys && keys.some(k => lower.includes(k))) return coche
  }

  return ((serie === 'CARROZADOS' || serie === 'SIM LAB') ? 'mazda' : null)
}

const obtenerCanal = (serie, marca) => canales[serie]?.find(c => c.nombre === marca)?.id

const obtenerProveedor = (nombre) => {
  const lower = nombre.toLowerCase()
  if (lower.includes('gng')) return 'GNG'
  if (lower.includes('p1doks')) return 'P1doks'
  if (lower.includes('vrs')) return 'VRS'
  if (lower.includes('hymo')) return 'HYMO'
  return 'GNG'
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

    const coche = obtenerMarca(name, serie)
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
  const uploadPromises = Object.entries(organization).map(async ([canalId, archivos]) => {
    const channel = guild.channels.cache.get(canalId)
    if (!channel) {
      console.warn(`⚠️ No se encontró el canal con ID: ${canalId}`)
      return
    }

    const folder = Object.values(archivos)[0][0].split('\\').at(-2)
    const setupsZip = zip(archivos, folder, canalId.slice(-4))

    await channel.send({
      content: Array.from({ length: 100 }, () => CURRENT_WEEK).join(' '),
      files: setupsZip
    })

    console.log(`✅ Subidos: ${setupsZip.join(', ')} al canal ${channel.name}`)
  })

  await Promise.all(uploadPromises)
}

client.once('clientReady', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`)

  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) {
    console.error('❌ No se encontró el servidor. Revisa el GUILD_ID.')
    client.destroy()
    return
  }

  const [gte, carrozados, nascar, formulas, simLab, sportsCar, gtSprint, imsa] = await Promise.all([
    organizeSetups('GTE', {}),
    organizeSetups('CARROZADOS', {}),
    organizeSetups('NASCAR', {}),
    organizeSetups('FORMULAS', {}),
    organizeSetups('SIM LAB', {}),
    organizeSetups('Sports Car', {}),
    organizeSetups('GT SPRINT', {}),
    organizeSetups('IMSA', {})
  ])

  const organization = { ...gte, ...carrozados, ...nascar, ...formulas, ...simLab, ...sportsCar, ...gtSprint, ...imsa }

  await uploadSetups(guild, organization)

  client.destroy()
})

client.login(TOKEN)
