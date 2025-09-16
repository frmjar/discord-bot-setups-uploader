import { Client, GatewayIntentBits } from 'discord.js'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

const TOKEN = process.env.TOKEN
const ROOT_FOLDER = './misCarpetas' // carpeta raíz local
const GUILD_ID = process.env.GUILD_ID // el ID de tu servidor de Discord

// Función para recorrer carpetas y subir contenido
async function uploadFolders (guild) {
  const folders = readdirSync(ROOT_FOLDER, { withFileTypes: true })

  for (const folder of folders) {
    if (folder.isDirectory()) {
      const folderPath = join(ROOT_FOLDER, folder.name)
      const channelName = folder.name.toLowerCase()

      // Verificar si el canal ya existe
      const existingChannel = guild.channels.cache.find(c => c.name === channelName && c.type === 0)
      let channel
      if (existingChannel) {
        console.log(`⚠️ El canal '${channelName}' ya existe. No se crea.`)
        channel = existingChannel
      } else {
        channel = await guild.channels.create({
          name: channelName,
          type: 0 // 0 = texto
        })

        console.log(`📂 Canal creado: ${channel.name}`)
      }
      // Subir archivos de la carpeta
      const files = readdirSync(folderPath)
      for (const file of files) {
        const filePath = join(folderPath, file)
        if (statSync(filePath).isFile()) {
          try {
            await channel.send({
              content: `📎 Subiendo archivo: **${file}**`,
              files: [filePath]
            })
            console.log(`✅ Subido: ${file}`)
          } catch (err) {
            console.error(`❌ Error al subir ${file}:`, err.message)
          }
        }
      }
    }
  }
}

// Al iniciar el bot
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

  // Crear canal con el nombre de la carpeta
  const channelName = 'prueba'
  let channel = guild.channels.cache.find(c => c.name === channelName && c.type === 0)
  if (channel) {
    console.log(`⚠️ El canal '${channelName}' ya existe. No se crea.`)
  } else {
    channel = await guild.channels.create({
      name: channelName,
      type: 0, // 0 = texto
      parent: '1159541206930432053'
    })
    console.log(`📂 Canal creado: ${channel.name}`)
  }
  // Ejecutar subida de carpetas automáticamente
  //  await uploadFolders(guild);

  client.destroy() // cierra la sesión del bot cuando termine
})

client.login(TOKEN)
