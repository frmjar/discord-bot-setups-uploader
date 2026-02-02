import { Client, GatewayIntentBits } from 'discord.js'
import { writeFileSync } from 'fs'

const TOKEN = process.env.TOKEN
const GUILD_ID = process.env.GUILD_ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

client.once('clientReady', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`)

  // Buscar el servidor
  const guild = client.guilds.cache.get(GUILD_ID)
  // console.log(guild.channels.cache);
  if (!guild) {
    console.error('❌ No se encontró el servidor. Revisa el GUILD_ID.')
    client.destroy()
    return
  }

  const canalesPorParent = {}

  guild.channels.cache.forEach(channel => {
    const parentName = channel.parent ? channel.parent.name : null
    if (parentName) {
      if (!canalesPorParent[parentName]) canalesPorParent[parentName] = []
      canalesPorParent[parentName].push({ nombre: channel.name, id: channel.id })
    }
  })

  writeFileSync('canales_guild.json', JSON.stringify(canalesPorParent, null, 2), 'utf-8')
  console.log('📁 Archivo canales_guild.json creado.')

  client.destroy() // cierra la sesión del bot cuando termine
})

client.login(TOKEN)
