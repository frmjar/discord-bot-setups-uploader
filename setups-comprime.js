import AdmZip from 'adm-zip'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

const canales = JSON.parse(readFileSync('./canales_guild.json', 'utf-8'))
const { semana } = JSON.parse(readFileSync('./config.json', 'utf-8'))

const { ROOT_FOLDER } = process.env
const ROOT_FOLDER_FINAL = join(ROOT_FOLDER, semana)

const COCHES_PATTERNS = {
  // GT3
  'ford-gt3': /ford|mustang|fgt3/i,
  'acura-gt3': /acura|nsxgt3|nsx/i,
  'mclaren-gt3': /mclaren|720/i,
  'aston-martin-gt3': /aston|vantagegt3|amgt3|amrgt3/i,
  'mercedes-gt3': /amg|mercedes|mgt3|mercgt3|merc/i,
  'bmw-gt3': /bmw|m4gt3/i,
  'audi-gt3': /audi|r8/i,
  'lamborghini-gt3': /lambo|lgt3|huracangt3/i,
  'ferrari-gt3': /ferrari|296/i,
  'porsche-gt3': /porsche|992|gt3r/i,
  'corvette-gt3': /corvette|z06gt3|z06/i,
  // LMDh/GTP
  'porsche-lmdh': /963gtp|963|porschegtp/i,
  'cadillac-lmdh': /caddy|cadillacgtp/i,
  'acura-lmdh': /arx06|acuragtp|acuraarx-06/i,
  'bmw-lmdh': /mhv8|bmwgtp|bmw hybrid/i,
  'ferrari-lmdh': /ferrarigtp|499p/i,
  // LMP2
  'dallara-p2': /lmp2|p217/i,
  // GT4
  'porsche-gt4': /porsche|718/i,
  'aston-martin-gt4': /aston|vantagegt4|astongt4/i,
  'mclaren-gt4': /mclaren|570/i,
  'mercedes-gt4': /mercgt4|mgt4/i,
  'bmw-gt4': /m4gt4|m4 gt4|bmwgt4|g82/i,
  'ford-gt4': /mustanggt4|mustang gt4|fordgt4/i,
  lmp3: /lmp3/i,
  // GTE
  ferrari: /488|ferrarigte/i,
  ford: /fordgte/i,
  corvette: /c8|corvettegte/i,
  porsche: /911|rsr|porschegte/i,
  bmw: /m2|m8|bmwgte/i,
  // Fórmulas
  'dallara-f3': /f3/i,
  'formula-lights': /superformulalight|sfl/i,
  'super-formula': /superformula|sf23/i,
  'ray-1600': /ff1600/i,
  // Otros
  mazda: /mx5/i,
  toyota: /gr86|gt86/i,
  'porsche-cup': /pcup|porschecup/i,
  'clase-a-b-c': /newhampshire|xfinity|classa|copen/i
}

const SERIES = {
  'GT SPRINT': [
    'ford-gt3', 'acura-gt3', 'mclaren-gt3', 'aston-martin-gt3', 'mercedes-gt3',
    'bmw-gt3', 'audi-gt3', 'lamborghini-gt3', 'ferrari-gt3', 'porsche-gt3', 'corvette-gt3'
  ],
  IMSA: [
    'ferrari-lmdh', 'porsche-lmdh', 'cadillac-lmdh', 'dallara-p2', 'acura-lmdh', 'bmw-lmdh', 'ferrari-lmdh',
    'ford-gt3', 'acura-gt3', 'mclaren-gt3', 'aston-martin-gt3', 'mercedes-gt3', 'bmw-gt3',
    'audi-gt3', 'lamborghini-gt3', 'ferrari-gt3', 'porsche-gt3', 'corvette-gt3'
  ],
  'Sports Car': [
    'porsche-gt4', 'aston-martin-gt4', 'mclaren-gt4', 'mercedes-gt4', 'bmw-gt4', 'ford-gt4', 'lmp3'
  ]
}

const GLOBALES = [
  'mazda', 'toyota', 'ferrari', 'ford', 'corvette', 'porsche', 'porsche-cup', 'bmw',
  'dallara-f3', 'formula-lights', 'super-formula', 'ray-1600', 'lmp3', 'clase-a-b-c'
]

const obtenerMarca = (nombre, serie) => {
  // Buscar en la serie específica primero (más preciso)
  if (SERIES[serie]) {
    for (const coche of SERIES[serie]) {
      const pattern = COCHES_PATTERNS[coche]
      if (pattern && pattern.test(nombre)) return coche
    }
  }

  // Buscar en coches globales
  for (const coche of GLOBALES) {
    const pattern = COCHES_PATTERNS[coche]
    if (pattern && pattern.test(nombre)) return coche
  }

  // Fallback para series específicas
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

const zip = (setups, folder, canalId) => {
  for (const [proveedor, archivos] of Object.entries(setups)) {
    const zip = new AdmZip()

    archivos.forEach(archivo => {
      zip.addLocalFile(archivo)
    })

    const path = join(ROOT_FOLDER_FINAL, folder, `${proveedor}-${canalId}.zip`)
    zip.writeZip(path)

    console.log(`✅ Comprimido: ${folder}-${proveedor}-${canalId}.zip`)
  }
}

async function organizeSetups (serie, organization = {}) {
  const folder = join(ROOT_FOLDER_FINAL, serie)
  const files = readdirSync(folder, { withFileTypes: true })

  for (const file of files.filter(f => f.name.endsWith('.sto') || f.name.endsWith(' .sto'))) {
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

const uploadSetups = async (organization) => {
  const uploadPromises = Object.entries(organization).map(async ([canalId, archivos]) => {
    const folder = Object.values(archivos)[0][0].split('\\').at(-2)
    zip(archivos, folder, canalId.slice(-5))
  })

  await Promise.all(uploadPromises)
}

const comprimirSetups = async () => {
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

  await uploadSetups(organization)
}

comprimirSetups()
