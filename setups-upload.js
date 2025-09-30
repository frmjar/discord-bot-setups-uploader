import { Client, GatewayIntentBits } from 'discord.js'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const canales = JSON.parse(readFileSync('./canales_guild.json', 'utf-8'))
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const { TOKEN, GUILD_ID, ROOT_FOLDER, MENSAJE } = process.env

const mapChannelsId = (mappedChannels, id, folder) => {
  const carsId = canales[folder]

  if (id) {
    for (const { id: canalId } of carsId) {
      if (canalId.endsWith(id)) {
        mappedChannels.set(id, canalId)
        return canalId
      }
    }
  }
}

const uploadSetups = async (guild, folder) => {
  const filesZip = readdirSync(join(ROOT_FOLDER, folder), { withFileTypes: true })
    .filter(file => file.isFile() && file.name.endsWith('.zip'))

  const mappedChannels = new Map()
  const mappedSetupsChannels = new Map()

  filesZip.forEach(file => {
    const id = file.name.match(/(\d{5})/)?.[1]
    const channelId = mappedChannels.get(id) || mapChannelsId(mappedChannels, id, folder)

    if (channelId) {
      if (!mappedSetupsChannels.has(channelId)) {
        mappedSetupsChannels.set(channelId, [])
      }

      mappedSetupsChannels.get(channelId).push(join(file.parentPath, file.name))
    }
  })

  await Promise.all(mappedSetupsChannels.entries().map(async ([canalId, setupsZip]) => {
    const channel = guild.channels.cache.get(canalId)
    if (!channel) {
      console.warn(`⚠️ No se encontró el canal con ID: ${canalId}`)
    }

    await channel.send({
      content: Array.from({ length: 100 }, () => MENSAJE).join(' '),
      files: setupsZip
    })

    console.log(`✅ Subidos: ${setupsZip.join(', ')} al canal ${channel.name}`)
  }))
}

client.once('clientReady', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`)

  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) {
    console.error('❌ No se encontró el servidor. Revisa el GUILD_ID.')
    client.destroy()
    return
  }

  await Promise.all([
    uploadSetups(guild, 'GTE'),
    uploadSetups(guild, 'CARROZADOS'),
    uploadSetups(guild, 'NASCAR'),
    uploadSetups(guild, 'FORMULAS'),
    uploadSetups(guild, 'SIM LAB'),
    uploadSetups(guild, 'Sports Car'),
    uploadSetups(guild, 'GT SPRINT'),
    uploadSetups(guild, 'IMSA')
  ])

  console.log('✅ Todos los setups han sido subidos correctamente.')
  client.destroy()
})

client.login(TOKEN)
