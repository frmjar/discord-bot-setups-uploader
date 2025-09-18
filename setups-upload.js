import AdmZip from 'adm-zip'
import { Client, GatewayIntentBits } from 'discord.js'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const canales = JSON.parse(readFileSync('./canales_guild.json', 'utf-8'))

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

const TOKEN = process.env.TOKEN
const ROOT_FOLDER = 'C:\\Users\\felix\\Desktop\\pruebas'
const GUILD_ID = process.env.GUILD_ID

const obtenerMarca = (nombre) => {
  const lower = nombre.toLowerCase()
  if (lower.includes('c8') || lower.includes('corvette')) return 'corvette'
  if (lower.includes('911') || lower.includes('porsche') || lower.includes('rsr')) return 'porsche'
  if (lower.includes('m8') || lower.includes('bmw')) return 'bmw'
  if (lower.includes('488')) return 'ferrari'
  if (lower.includes('ford')) return 'ford'
  if (lower.includes('pcup')) return 'porsche-cup'
  if (lower.includes('mx5')) return 'advanced-mazda'
  return nombre
}

const obtenerCanal = (serie, marca) => {
  const coches = canales[serie]
  if (!coches) return null
  return coches.find(c => c.nombre === marca)?.id
}

const unzip = (filePath) => {
  const zip = new AdmZip(filePath)
  zip.extractAllTo(ROOT_FOLDER, true)
  console.log(`✅ Descomprimido: ${filePath}`)
}

async function organizeSetups (serie, organization) {
  const folder = join(ROOT_FOLDER, serie)
  const files = readdirSync(folder, { withFileTypes: true })

  files.filter(f => f.name.endsWith('.zip')).forEach(f => unzip(join(folder, f.name)))

  files.filter(f => f.name.endsWith('.sto'))
    .forEach(async file => {
      const name = file.name
      const filePath = join(folder, name)

      const coche = obtenerMarca(name)
      const canal = obtenerCanal(serie, coche)

      if (!canal) {
        console.warn(`⚠️ No se encontró canal para el coche: ${coche} (archivo: ${name})`)
        return
      }

      if (!organization[canal]) {
        organization[canal] = []
      }
      organization[canal].push(filePath)
    })
}

const uploadSetups = async (guild, organization) => {
  for (const [canalId, archivos] of Object.entries(organization)) {
    const channel = guild.channels.cache.get(canalId)
    if (!channel) {
      console.warn(`⚠️ No se encontró el canal con ID: ${canalId}`)
      continue
    }

    const LOTE_MAX = 10
    for (let i = 0; i < archivos.length; i += LOTE_MAX) {
      const lote = archivos.slice(i, i + LOTE_MAX)
      try {
        await channel.send({
          files: lote
        })
        console.log(`✅ Subidos: ${lote.map(f => f.split('\\').pop()).join(', ')} al canal ${channel.name}`)
      } catch (err) {
        console.error(`❌ Error al subir ${lote.map(f => f.split('\\').pop()).join(', ')}:`, err.message)
      }
    }
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

  const organization = {}
  await organizeSetups('GTE', organization)
  await organizeSetups('CARROZADOS', organization)
  await uploadSetups(guild, organization)

  client.destroy()
})

client.login(TOKEN)
