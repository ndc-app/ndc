const Database = require('better-sqlite3')
const path = require('path')

const RAILWAY_URL = 'https://ndc.up.railway.app'
const SYNC_KEY    = 'ndc-sync-2026'

const dbPath = path.join('/Users/gdelco/proyectos-claude/mi-dashboard/backend', 'dashboard.db')
const db = new Database(dbPath, { readonly: true })

const tablas = [
  'ndc_camadas', 'ndc_participantes', 'ndc_encuentros', 'ndc_hitos',
  'ndc_presupuesto', 'ndc_donantes', 'ndc_comunicacion', 'ndc_escuelas',
  'ndc_materiales_items', 'ndc_materiales_estado', 'ndc_secciones',
  'ndc_secciones_camada', 'ndc_camadas_moneda'
]

const data = {}
for (const t of tablas) {
  try {
    data[t] = db.prepare(`SELECT * FROM ${t}`).all()
    console.log(`  ${t}: ${data[t].length} filas`)
  } catch(e) {
    data[t] = []
    console.log(`  ${t}: tabla no encontrada, saltando`)
  }
}

console.log('\nSubiendo a Railway…')

fetch(`${RAILWAY_URL}/api/sync/import`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-sync-key': SYNC_KEY },
  body: JSON.stringify({ tablas: data })
})
.then(r => r.json())
.then(r => {
  if (r.ok) console.log(`✓ Importado: ${r.tablas} tablas`)
  else console.error('Error:', r.error)
})
.catch(e => console.error('Error de conexión:', e.message))
