const express  = require('express')
const cors     = require('cors')
const path     = require('path')
const fs       = require('fs')
const Database = require('better-sqlite3')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const multer   = require('multer')
const sharp    = require('sharp')

const app  = express()
const PORT = process.env.PORT || 3010
const JWT_SECRET = process.env.JWT_SECRET || 'ndc-secret-cambiar-en-prod'
const SYNC_KEY   = process.env.SYNC_KEY   || 'sync-key-cambiar-en-prod'

const dbPath = path.join(__dirname, 'ndc.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

app.use(cors())
app.use(express.json({ limit: '20mb' }))

// ── Uploads ──────────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads')
const materialesDir = path.join(uploadsDir, 'materiales')
const participantesDir = path.join(uploadsDir, 'participantes')
;[uploadsDir, materialesDir, participantesDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
})
app.use('/uploads', express.static(uploadsDir))

// ── Servir frontend ───────────────────────────────────────────────────────────
const publicDir = path.join(__dirname, 'public')
if (fs.existsSync(publicDir)) app.use(express.static(publicDir))

// ══════════════════════════════════════════════════════
// TABLAS
// ══════════════════════════════════════════════════════

// Usuarios
db.prepare(`CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol TEXT DEFAULT 'colaborador',
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()

// Secciones bloqueadas para colaboradores
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_visibilidad (
  seccion TEXT PRIMARY KEY,
  bloqueada INTEGER DEFAULT 0
)`).run()
;['camadas','donantes','materiales','comunicacion'].forEach(s => {
  db.prepare('INSERT OR IGNORE INTO ndc_visibilidad (seccion,bloqueada) VALUES (?,0)').run(s)
})

// Camadas
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_camadas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  sede TEXT DEFAULT 'Mar del Plata',
  pais TEXT DEFAULT 'Argentina',
  anio INTEGER,
  mes_inicio TEXT,
  mes_fin TEXT,
  estado TEXT DEFAULT 'en_curso',
  descripcion TEXT,
  participantes_esperados INTEGER DEFAULT 30,
  cantidad_escuelas INTEGER DEFAULT 0,
  cantidad_dias INTEGER DEFAULT 0,
  participantes_reales INTEGER DEFAULT 0,
  fecha_inicio_real TEXT,
  fecha_fin_real TEXT,
  tamano_equipo INTEGER DEFAULT 0,
  lugar TEXT,
  scholas_id INTEGER,
  orden INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()

// Participantes
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_participantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camada_id INTEGER NOT NULL,
  apodo TEXT DEFAULT '',
  nombre TEXT,
  apellido TEXT,
  dni TEXT,
  edad INTEGER,
  escuela TEXT,
  padre_madre TEXT,
  responsable TEXT,
  contacto_responsable TEXT,
  tutor_mail TEXT,
  telefono TEXT,
  email TEXT,
  asistencias INTEGER DEFAULT 0,
  total_encuentros INTEGER DEFAULT 0,
  testimonio TEXT,
  comentario TEXT,
  activo INTEGER DEFAULT 1,
  egresado INTEGER DEFAULT 0,
  foto_url TEXT,
  foto_posicion TEXT DEFAULT '50% 50%',
  scholas_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()
try { db.prepare('ALTER TABLE ndc_participantes ADD COLUMN scholas_id INTEGER').run() } catch(e) {}

// Encuentros
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_encuentros (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camada_id INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  actividad TEXT,
  presentes INTEGER DEFAULT 0,
  notas TEXT
)`).run()

// Hitos
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_hitos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camada_id INTEGER,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  fecha TEXT,
  lugar TEXT,
  descripcion TEXT,
  imagen_url TEXT,
  imagen_posicion TEXT DEFAULT '50% 50%'
)`).run()

// Presupuesto
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_presupuesto (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camada_id INTEGER,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  monto REAL DEFAULT 0,
  tipo TEXT DEFAULT 'gasto',
  fecha TEXT
)`).run()

// Donantes
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_donantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'donante',
  contacto TEXT,
  aporte_tipo TEXT DEFAULT 'monetario',
  monto REAL DEFAULT 0,
  estado TEXT DEFAULT 'activo',
  proximo_contacto TEXT,
  notas TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()

// Comunicación
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_comunicacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  canal TEXT DEFAULT 'instagram',
  estado TEXT DEFAULT 'idea',
  fecha_planificada TEXT,
  responsable TEXT,
  contenido TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()

// Escuelas
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_escuelas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  camada_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT,
  localidad TEXT,
  referente_nombre TEXT,
  referente_tel TEXT,
  referente_email TEXT,
  notas TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()

// Materiales
db.prepare(`CREATE TABLE IF NOT EXISTS ndc_materiales_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'materiales',
  unidad TEXT DEFAULT 'unidad',
  cantidad REAL DEFAULT 1,
  costo_unitario REAL DEFAULT 0,
  moneda TEXT DEFAULT 'ARS',
  es_donacion INTEGER DEFAULT 0,
  proveedor TEXT,
  url TEXT,
  se_repone INTEGER DEFAULT 1,
  foto TEXT,
  orden INTEGER DEFAULT 0,
  seccion_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()

db.prepare(`CREATE TABLE IF NOT EXISTS ndc_materiales_estado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  camada_id INTEGER NOT NULL,
  repuesto INTEGER DEFAULT 0,
  cantidad_real REAL,
  notas TEXT,
  UNIQUE(item_id, camada_id)
)`).run()

db.prepare(`CREATE TABLE IF NOT EXISTS ndc_camadas_moneda (
  camada_id INTEGER PRIMARY KEY,
  moneda_local TEXT DEFAULT 'ARS',
  simbolo TEXT DEFAULT '$',
  tc_usd REAL DEFAULT 1
)`).run()

db.prepare(`CREATE TABLE IF NOT EXISTS ndc_secciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  icono TEXT DEFAULT '📦',
  orden INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`).run()

db.prepare(`CREATE TABLE IF NOT EXISTS ndc_secciones_camada (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seccion_id INTEGER,
  camada_id INTEGER NOT NULL,
  nombre TEXT,
  icono TEXT,
  oculta INTEGER DEFAULT 0,
  orden INTEGER DEFAULT 0,
  UNIQUE(seccion_id, camada_id)
)`).run()

// Seed secciones base
const seccionesBase = [
  { nombre:'Materiales fijos', icono:'🔧', orden:0 },
  { nombre:'Materiales renovables', icono:'🔄', orden:1 },
  { nombre:'Alimentación', icono:'🍎', orden:2 },
  { nombre:'Mobiliario', icono:'🪑', orden:3 },
  { nombre:'Transporte', icono:'🚌', orden:4 },
  { nombre:'Otros', icono:'📌', orden:5 },
]
seccionesBase.forEach((s,i) => {
  db.prepare('INSERT OR IGNORE INTO ndc_secciones (id,nombre,icono,orden) VALUES (?,?,?,?)').run(i+1, s.nombre, s.icono, s.orden)
})

// Seed admin por defecto si no hay usuarios
if (db.prepare('SELECT COUNT(*) as n FROM usuarios').get().n === 0) {
  const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'gastondelcorral@gmail.com'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10)
  db.prepare('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)').run('Gastón', ADMIN_EMAIL, hash, 'admin')
  console.log(`✓ Admin creado: ${ADMIN_EMAIL}`)
}

// ══════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ══════════════════════════════════════════════════════
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No autorizado' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch(e) {
    res.status(401).json({ error: 'Sesión expirada' })
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.rol !== 'admin') return res.status(403).json({ error: 'Solo admin' })
    next()
  })
}

// ══════════════════════════════════════════════════════
// AUTH ENDPOINTS
// ══════════════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = db.prepare('SELECT * FROM usuarios WHERE email=? AND activo=1').get(email)
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Email o contraseña incorrectos' })
  const token = jwt.sign({ id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id,nombre,email,rol FROM usuarios WHERE id=?').get(req.user.id)
  res.json(user)
})

// Admin: gestión de usuarios
app.get('/api/usuarios', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT id,nombre,email,rol,activo,created_at FROM usuarios ORDER BY created_at DESC').all())
})

app.post('/api/usuarios', requireAdmin, (req, res) => {
  const { nombre, email, password, rol } = req.body
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan datos' })
  const hash = bcrypt.hashSync(password, 10)
  try {
    const r = db.prepare('INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES (?,?,?,?)').run(nombre, email, hash, rol || 'colaborador')
    res.json({ ok: true, id: r.lastInsertRowid })
  } catch(e) {
    res.status(400).json({ error: 'El email ya existe' })
  }
})

app.put('/api/usuarios/:id', requireAdmin, (req, res) => {
  const { nombre, email, rol, activo, password } = req.body
  const u = db.prepare('SELECT * FROM usuarios WHERE id=?').get(req.params.id)
  if (!u) return res.status(404).json({ error: 'No encontrado' })
  const hash = password ? bcrypt.hashSync(password, 10) : u.password_hash
  db.prepare('UPDATE usuarios SET nombre=?,email=?,password_hash=?,rol=?,activo=? WHERE id=?')
    .run(nombre || u.nombre, email || u.email, hash, rol || u.rol, activo !== undefined ? activo : u.activo, req.params.id)
  res.json({ ok: true })
})

app.delete('/api/usuarios/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM usuarios WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Visibilidad de secciones ──────────────────────────────────────────────────
app.get('/api/visibilidad', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM ndc_visibilidad').all())
})

app.put('/api/visibilidad/:seccion', requireAdmin, (req, res) => {
  db.prepare('INSERT OR REPLACE INTO ndc_visibilidad (seccion,bloqueada) VALUES (?,?)').run(req.params.seccion, req.body.bloqueada ? 1 : 0)
  res.json({ ok: true })
})

// ══════════════════════════════════════════════════════
// SYNC — importar datos desde mi-dashboard
// ══════════════════════════════════════════════════════
app.post('/api/sync/import', (req, res) => {
  const key = req.headers['x-sync-key']
  if (key !== SYNC_KEY) return res.status(401).json({ error: 'Clave incorrecta' })

  const { tablas } = req.body
  if (!tablas) return res.status(400).json({ error: 'Sin datos' })

  db.transaction(() => {
    for (const [tabla, filas] of Object.entries(tablas)) {
      if (!tabla.startsWith('ndc_')) continue
      try {
        db.prepare(`DELETE FROM ${tabla}`).run()
        if (!filas?.length) continue
        const cols = Object.keys(filas[0]).join(',')
        const placeholders = Object.keys(filas[0]).map(() => '?').join(',')
        const ins = db.prepare(`INSERT OR IGNORE INTO ${tabla} (${cols}) VALUES (${placeholders})`)
        filas.forEach(f => ins.run(...Object.values(f)))
      } catch(e) {
        console.error(`Error importando ${tabla}:`, e.message)
      }
    }
  })()

  res.json({ ok: true, tablas: Object.keys(tablas).length })
})

// Export para que mi-dashboard pueda jalar los datos
app.get('/api/sync/export', (req, res) => {
  const key = req.headers['x-sync-key']
  if (key !== SYNC_KEY) return res.status(401).json({ error: 'Clave incorrecta' })

  const tablas = [
    'ndc_camadas','ndc_participantes','ndc_encuentros','ndc_hitos',
    'ndc_presupuesto','ndc_donantes','ndc_comunicacion','ndc_escuelas',
    'ndc_materiales_items','ndc_materiales_estado','ndc_secciones',
    'ndc_secciones_camada','ndc_camadas_moneda'
  ]
  const data = {}
  tablas.forEach(t => {
    try { data[t] = db.prepare(`SELECT * FROM ${t}`).all() } catch(e) { data[t] = [] }
  })
  res.json({ ok: true, tablas: data, exportado_en: new Date().toISOString() })
})

// ══════════════════════════════════════════════════════
// NdC — CAMADAS
// ══════════════════════════════════════════════════════
app.get('/api/ndc/camadas', requireAuth, (req, res) => res.json(db.prepare('SELECT * FROM ndc_camadas ORDER BY anio, mes_inicio, id').all()))

app.post('/api/ndc/camadas', requireAuth, (req, res) => {
  const b = req.body
  const r = db.prepare(`INSERT INTO ndc_camadas (nombre,sede,pais,anio,mes_inicio,mes_fin,estado,descripcion,participantes_esperados,cantidad_escuelas,cantidad_dias,participantes_reales,fecha_inicio_real,fecha_fin_real,tamano_equipo)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(b.nombre,b.sede,b.pais,b.anio,b.mes_inicio,b.mes_fin,b.estado,b.descripcion,b.participantes_esperados,b.cantidad_escuelas||0,b.cantidad_dias||0,b.participantes_reales||0,b.fecha_inicio_real||null,b.fecha_fin_real||null,b.tamano_equipo||0)
  res.json({ ok:true, id:r.lastInsertRowid })
})

app.put('/api/ndc/camadas/:id', requireAuth, (req, res) => {
  const b = req.body
  db.prepare(`UPDATE ndc_camadas SET nombre=?,sede=?,pais=?,anio=?,mes_inicio=?,mes_fin=?,estado=?,descripcion=?,participantes_esperados=?,cantidad_escuelas=?,cantidad_dias=?,participantes_reales=?,fecha_inicio_real=?,fecha_fin_real=?,tamano_equipo=?,lugar=? WHERE id=?`)
    .run(b.nombre,b.sede,b.pais,b.anio,b.mes_inicio,b.mes_fin,b.estado,b.descripcion,b.participantes_esperados,b.cantidad_escuelas||0,b.cantidad_dias||0,b.participantes_reales||0,b.fecha_inicio_real||null,b.fecha_fin_real||null,b.tamano_equipo||0,b.lugar||null,req.params.id)
  res.json({ ok:true })
})

app.delete('/api/ndc/camadas/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_camadas WHERE id=?').run(req.params.id); res.json({ok:true}) })

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get('/api/ndc/stats', requireAuth, (req, res) => {
  res.json({
    camadas: db.prepare('SELECT COUNT(*) as n FROM ndc_camadas').get().n,
    participantes: db.prepare('SELECT COUNT(*) as n FROM ndc_participantes').get().n,
    escuelas: db.prepare("SELECT COUNT(DISTINCT escuela) as n FROM ndc_participantes WHERE escuela IS NOT NULL AND escuela != ''").get().n,
    hitos: db.prepare('SELECT COUNT(*) as n FROM ndc_hitos').get().n,
  })
})

// ── Participantes ─────────────────────────────────────────────────────────────
app.get('/api/ndc/participantes', requireAuth, (req, res) => {
  if (req.query.buscar) {
    const t = `%${req.query.buscar}%`
    return res.json(db.prepare(`
      SELECT p.*, c.nombre as camada_nombre, c.anio as camada_anio
      FROM ndc_participantes p
      LEFT JOIN ndc_camadas c ON c.id = p.camada_id
      WHERE p.apodo LIKE ? OR p.nombre LIKE ? OR p.apellido LIKE ? OR p.dni LIKE ?
      ORDER BY p.apellido, p.nombre LIMIT 50
    `).all(t, t, t, t))
  }
  const q = req.query.camada_id
    ? db.prepare('SELECT * FROM ndc_participantes WHERE camada_id=? ORDER BY apellido,nombre,apodo').all(req.query.camada_id)
    : db.prepare('SELECT * FROM ndc_participantes ORDER BY apellido,nombre,apodo').all()
  res.json(q)
})

app.post('/api/ndc/participantes', requireAuth, (req, res) => {
  const b = req.body
  const r = db.prepare('INSERT INTO ndc_participantes (camada_id,apodo,nombre,apellido,dni,edad,escuela,padre_madre,responsable,contacto_responsable,tutor_mail,telefono,email,testimonio,comentario) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(b.camada_id,b.apodo||'',b.nombre,b.apellido,b.dni,b.edad,b.escuela,b.padre_madre,b.responsable,b.contacto_responsable,b.tutor_mail,b.telefono,b.email,b.testimonio,b.comentario||'')
  res.json({ ok:true, id:r.lastInsertRowid })
})

app.put('/api/ndc/participantes/:id', requireAuth, (req, res) => {
  const b = req.body
  db.prepare('UPDATE ndc_participantes SET apodo=?,nombre=?,apellido=?,dni=?,edad=?,escuela=?,padre_madre=?,responsable=?,contacto_responsable=?,tutor_mail=?,telefono=?,email=?,asistencias=?,total_encuentros=?,testimonio=?,activo=?,egresado=?,comentario=? WHERE id=?')
    .run(b.apodo||'',b.nombre,b.apellido,b.dni,b.edad,b.escuela,b.padre_madre,b.responsable,b.contacto_responsable,b.tutor_mail,b.telefono,b.email,b.asistencias,b.total_encuentros,b.testimonio,b.activo,b.egresado||0,b.comentario||'',req.params.id)
  res.json({ ok:true })
})

app.delete('/api/ndc/participantes/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_participantes WHERE id=?').run(req.params.id); res.json({ok:true}) })

// Foto de participante
const uploadParticipante = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
app.post('/api/ndc/participantes/:id/foto', requireAuth, uploadParticipante.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Sin archivo' })
    const filename = `p_${req.params.id}_${Date.now()}.jpg`
    await sharp(req.file.buffer).resize(300, 300, { fit:'cover' }).jpeg({ quality:80 }).toFile(path.join(participantesDir, filename))
    const prev = db.prepare('SELECT foto_url FROM ndc_participantes WHERE id=?').get(req.params.id)
    if (prev?.foto_url) { try { fs.unlinkSync(path.join(participantesDir, path.basename(prev.foto_url))) } catch(e) {} }
    db.prepare('UPDATE ndc_participantes SET foto_url=? WHERE id=?').run(`/uploads/participantes/${filename}`, req.params.id)
    res.json({ ok:true, foto_url:`/uploads/participantes/${filename}` })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

app.patch('/api/ndc/participantes/:id/foto-posicion', requireAuth, (req, res) => {
  db.prepare('UPDATE ndc_participantes SET foto_posicion=? WHERE id=?').run(req.body.posicion || '50% 50%', req.params.id)
  res.json({ ok:true })
})

app.delete('/api/ndc/participantes/:id/foto', requireAuth, (req, res) => {
  const p = db.prepare('SELECT foto_url FROM ndc_participantes WHERE id=?').get(req.params.id)
  if (p?.foto_url) { try { fs.unlinkSync(path.join(participantesDir, path.basename(p.foto_url))) } catch(e) {} }
  db.prepare('UPDATE ndc_participantes SET foto_url=NULL WHERE id=?').run(req.params.id)
  res.json({ ok:true })
})

// ── Escuelas ──────────────────────────────────────────────────────────────────
app.get('/api/ndc/escuelas', requireAuth, (req, res) => res.json(req.query.camada_id ? db.prepare('SELECT * FROM ndc_escuelas WHERE camada_id=? ORDER BY nombre').all(req.query.camada_id) : db.prepare('SELECT * FROM ndc_escuelas ORDER BY nombre').all()))
app.post('/api/ndc/escuelas', requireAuth, (req, res) => { const b = req.body; const r = db.prepare('INSERT INTO ndc_escuelas (camada_id,nombre,direccion,localidad,referente_nombre,referente_tel,referente_email,notas) VALUES (?,?,?,?,?,?,?,?)').run(b.camada_id,b.nombre,b.direccion,b.localidad,b.referente_nombre,b.referente_tel,b.referente_email,b.notas); res.json({ok:true,id:r.lastInsertRowid}) })
app.put('/api/ndc/escuelas/:id', requireAuth, (req, res) => { const b = req.body; db.prepare('UPDATE ndc_escuelas SET nombre=?,direccion=?,localidad=?,referente_nombre=?,referente_tel=?,referente_email=?,notas=? WHERE id=?').run(b.nombre,b.direccion,b.localidad,b.referente_nombre,b.referente_tel,b.referente_email,b.notas,req.params.id); res.json({ok:true}) })
app.delete('/api/ndc/escuelas/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_escuelas WHERE id=?').run(req.params.id); res.json({ok:true}) })

// ── Encuentros ────────────────────────────────────────────────────────────────
app.get('/api/ndc/encuentros', requireAuth, (req, res) => res.json(req.query.camada_id ? db.prepare('SELECT * FROM ndc_encuentros WHERE camada_id=? ORDER BY fecha DESC').all(req.query.camada_id) : db.prepare('SELECT * FROM ndc_encuentros ORDER BY fecha DESC').all()))
app.post('/api/ndc/encuentros', requireAuth, (req, res) => { const r = db.prepare('INSERT INTO ndc_encuentros (camada_id,fecha,actividad,presentes,notas) VALUES (?,?,?,?,?)').run(req.body.camada_id,req.body.fecha,req.body.actividad,req.body.presentes||0,req.body.notas); res.json({ok:true,id:r.lastInsertRowid}) })
app.delete('/api/ndc/encuentros/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_encuentros WHERE id=?').run(req.params.id); res.json({ok:true}) })

// ── Hitos ─────────────────────────────────────────────────────────────────────
app.get('/api/ndc/hitos', requireAuth, (req, res) => res.json(req.query.camada_id ? db.prepare('SELECT * FROM ndc_hitos WHERE camada_id=? ORDER BY fecha').all(req.query.camada_id) : db.prepare('SELECT * FROM ndc_hitos ORDER BY fecha').all()))
app.post('/api/ndc/hitos', requireAuth, (req, res) => { const r = db.prepare('INSERT INTO ndc_hitos (camada_id,tipo,titulo,fecha,lugar,descripcion,imagen_url) VALUES (?,?,?,?,?,?,?)').run(req.body.camada_id,req.body.tipo,req.body.titulo,req.body.fecha,req.body.lugar,req.body.descripcion,req.body.imagen_url); res.json({ok:true,id:r.lastInsertRowid}) })
app.put('/api/ndc/hitos/:id', requireAuth, (req, res) => { const b = req.body; db.prepare('UPDATE ndc_hitos SET tipo=?,titulo=?,fecha=?,lugar=?,descripcion=? WHERE id=?').run(b.tipo,b.titulo,b.fecha,b.lugar,b.descripcion,req.params.id); res.json({ok:true}) })
app.delete('/api/ndc/hitos/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_hitos WHERE id=?').run(req.params.id); res.json({ok:true}) })
app.patch('/api/ndc/hitos/:id/posicion', requireAuth, (req, res) => { db.prepare('UPDATE ndc_hitos SET imagen_posicion=? WHERE id=?').run(req.body.posicion||'50% 50%', req.params.id); res.json({ok:true}) })

// ── Presupuesto ───────────────────────────────────────────────────────────────
app.get('/api/ndc/presupuesto', requireAuth, (req, res) => res.json(req.query.camada_id ? db.prepare('SELECT * FROM ndc_presupuesto WHERE camada_id=? ORDER BY fecha DESC').all(req.query.camada_id) : db.prepare('SELECT * FROM ndc_presupuesto ORDER BY fecha DESC').all()))
app.post('/api/ndc/presupuesto', requireAuth, (req, res) => { const r = db.prepare('INSERT INTO ndc_presupuesto (camada_id,categoria,descripcion,monto,tipo,fecha) VALUES (?,?,?,?,?,?)').run(req.body.camada_id,req.body.categoria,req.body.descripcion,req.body.monto||0,req.body.tipo||'gasto',req.body.fecha); res.json({ok:true,id:r.lastInsertRowid}) })
app.delete('/api/ndc/presupuesto/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_presupuesto WHERE id=?').run(req.params.id); res.json({ok:true}) })

// ── Donantes ──────────────────────────────────────────────────────────────────
app.get('/api/ndc/donantes', requireAuth, (req, res) => res.json(db.prepare('SELECT * FROM ndc_donantes ORDER BY nombre').all()))
app.post('/api/ndc/donantes', requireAuth, (req, res) => { const b = req.body; const r = db.prepare('INSERT INTO ndc_donantes (nombre,tipo,contacto,aporte_tipo,monto,estado,proximo_contacto,notas) VALUES (?,?,?,?,?,?,?,?)').run(b.nombre,b.tipo||'donante',b.contacto,b.aporte_tipo||'monetario',b.monto||0,b.estado||'activo',b.proximo_contacto,b.notas); res.json({ok:true,id:r.lastInsertRowid}) })
app.put('/api/ndc/donantes/:id', requireAuth, (req, res) => { const b = req.body; db.prepare('UPDATE ndc_donantes SET nombre=?,tipo=?,contacto=?,aporte_tipo=?,monto=?,estado=?,proximo_contacto=?,notas=? WHERE id=?').run(b.nombre,b.tipo,b.contacto,b.aporte_tipo,b.monto||0,b.estado,b.proximo_contacto,b.notas,req.params.id); res.json({ok:true}) })
app.delete('/api/ndc/donantes/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_donantes WHERE id=?').run(req.params.id); res.json({ok:true}) })

// ── Comunicación ──────────────────────────────────────────────────────────────
app.get('/api/ndc/comunicacion', requireAuth, (req, res) => res.json(db.prepare('SELECT * FROM ndc_comunicacion ORDER BY fecha_planificada, created_at DESC').all()))
app.post('/api/ndc/comunicacion', requireAuth, (req, res) => { const r = db.prepare('INSERT INTO ndc_comunicacion (titulo,canal,estado,fecha_planificada,responsable,contenido) VALUES (?,?,?,?,?,?)').run(req.body.titulo,req.body.canal||'instagram',req.body.estado||'idea',req.body.fecha_planificada,req.body.responsable,req.body.contenido); res.json({ok:true,id:r.lastInsertRowid}) })
app.put('/api/ndc/comunicacion/:id', requireAuth, (req, res) => { db.prepare('UPDATE ndc_comunicacion SET titulo=?,canal=?,estado=?,fecha_planificada=?,responsable=?,contenido=? WHERE id=?').run(req.body.titulo,req.body.canal,req.body.estado,req.body.fecha_planificada,req.body.responsable,req.body.contenido,req.params.id); res.json({ok:true}) })
app.delete('/api/ndc/comunicacion/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_comunicacion WHERE id=?').run(req.params.id); res.json({ok:true}) })

// ── Materiales ────────────────────────────────────────────────────────────────
app.get('/api/ndc/materiales/items', requireAuth, (req, res) => res.json(db.prepare('SELECT * FROM ndc_materiales_items ORDER BY orden, categoria, nombre').all()))
app.post('/api/ndc/materiales/items', requireAuth, (req, res) => { const b = req.body; const r = db.prepare('INSERT INTO ndc_materiales_items (nombre,categoria,unidad,cantidad,costo_unitario,moneda,es_donacion,proveedor,url,se_repone) VALUES (?,?,?,?,?,?,?,?,?,?)').run(b.nombre,b.categoria||'materiales',b.unidad||'unidad',b.cantidad||1,b.costo_unitario||0,b.moneda||'ARS',b.es_donacion?1:0,b.proveedor||'',b.url||'',b.se_repone?1:0); res.json({ok:true,id:r.lastInsertRowid}) })
app.put('/api/ndc/materiales/items/:id', requireAuth, (req, res) => { const b = req.body; db.prepare('UPDATE ndc_materiales_items SET nombre=?,categoria=?,unidad=?,cantidad=?,costo_unitario=?,moneda=?,es_donacion=?,proveedor=?,url=?,se_repone=? WHERE id=?').run(b.nombre,b.categoria||'materiales',b.unidad||'unidad',b.cantidad||1,b.costo_unitario||0,b.moneda||'ARS',b.es_donacion?1:0,b.proveedor||'',b.url||'',b.se_repone?1:0,req.params.id); res.json({ok:true}) })
app.delete('/api/ndc/materiales/items/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_materiales_items WHERE id=?').run(req.params.id); db.prepare('DELETE FROM ndc_materiales_estado WHERE item_id=?').run(req.params.id); res.json({ok:true}) })
app.get('/api/ndc/materiales/estado/:camada_id', requireAuth, (req, res) => res.json(db.prepare('SELECT * FROM ndc_materiales_estado WHERE camada_id=?').all(req.params.camada_id)))
app.post('/api/ndc/materiales/estado', requireAuth, (req, res) => { const b = req.body; db.prepare('INSERT INTO ndc_materiales_estado (item_id,camada_id,repuesto,cantidad_real,notas) VALUES (?,?,?,?,?) ON CONFLICT(item_id,camada_id) DO UPDATE SET repuesto=excluded.repuesto,cantidad_real=excluded.cantidad_real,notas=excluded.notas').run(b.item_id,b.camada_id,b.repuesto?1:0,b.cantidad_real||null,b.notas||''); res.json({ok:true}) })
app.get('/api/ndc/materiales/moneda/:camada_id', requireAuth, (req, res) => res.json(db.prepare('SELECT * FROM ndc_camadas_moneda WHERE camada_id=?').get(req.params.camada_id) || {moneda_local:'ARS',simbolo:'$',tc_usd:1}))
app.put('/api/ndc/materiales/moneda/:camada_id', requireAuth, (req, res) => { const b = req.body; db.prepare('INSERT INTO ndc_camadas_moneda (camada_id,moneda_local,simbolo,tc_usd) VALUES (?,?,?,?) ON CONFLICT(camada_id) DO UPDATE SET moneda_local=excluded.moneda_local,simbolo=excluded.simbolo,tc_usd=excluded.tc_usd').run(req.params.camada_id,b.moneda_local||'ARS',b.simbolo||'$',b.tc_usd||1); res.json({ok:true}) })
app.put('/api/ndc/materiales/items/:id/seccion', requireAuth, (req, res) => { db.prepare('UPDATE ndc_materiales_items SET seccion_id=? WHERE id=?').run(req.body.seccion_id||null,req.params.id); res.json({ok:true}) })
app.put('/api/ndc/materiales/items/:id/orden', requireAuth, (req, res) => { db.prepare('UPDATE ndc_materiales_items SET orden=? WHERE id=?').run(req.body.orden,req.params.id); res.json({ok:true}) })

const uploadMaterial = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })
app.post('/api/ndc/materiales/items/:id/foto', requireAuth, uploadMaterial.single('foto'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Sin archivo' })
    const filename = `m_${req.params.id}_${Date.now()}.jpg`
    await sharp(req.file.buffer).resize(400,400,{fit:'inside',withoutEnlargement:true}).jpeg({quality:75}).toFile(path.join(materialesDir,filename))
    const item = db.prepare('SELECT foto FROM ndc_materiales_items WHERE id=?').get(req.params.id)
    if (item?.foto) { try { fs.unlinkSync(path.join(materialesDir,item.foto)) } catch(e) {} }
    db.prepare('UPDATE ndc_materiales_items SET foto=? WHERE id=?').run(filename,req.params.id)
    res.json({ok:true,foto:filename})
  } catch(e) { res.status(500).json({error:e.message}) }
})
app.delete('/api/ndc/materiales/items/:id/foto', requireAuth, (req, res) => {
  const item = db.prepare('SELECT foto FROM ndc_materiales_items WHERE id=?').get(req.params.id)
  if (item?.foto) { try { fs.unlinkSync(path.join(materialesDir,item.foto)) } catch(e) {} }
  db.prepare('UPDATE ndc_materiales_items SET foto=NULL WHERE id=?').run(req.params.id)
  res.json({ok:true})
})

// ── Secciones de materiales ───────────────────────────────────────────────────
app.get('/api/ndc/secciones', requireAuth, (req, res) => {
  const { camada_id } = req.query
  const base = db.prepare('SELECT * FROM ndc_secciones ORDER BY orden').all()
  if (!camada_id) return res.json(base)
  const overrides = db.prepare('SELECT * FROM ndc_secciones_camada WHERE camada_id=?').all(camada_id)
  const result = []
  for (const s of base) {
    const ov = overrides.find(o => o.seccion_id === s.id)
    if (ov?.oculta) continue
    result.push({ ...s, nombre: ov?.nombre || s.nombre, icono: ov?.icono || s.icono, orden: ov?.orden ?? s.orden, camada_override: ov?.id || null })
  }
  overrides.filter(o => o.seccion_id === null).forEach(p => {
    result.push({ id:'camada_'+p.id, nombre:p.nombre, icono:p.icono||'📦', orden:p.orden, camada_override:p.id, es_propia:true })
  })
  result.sort((a,b) => a.orden - b.orden)
  res.json(result)
})
app.post('/api/ndc/secciones', requireAuth, (req, res) => { const maxOrden = db.prepare('SELECT MAX(orden) as m FROM ndc_secciones').get().m||0; const r = db.prepare('INSERT INTO ndc_secciones (nombre,icono,orden) VALUES (?,?,?)').run(req.body.nombre,req.body.icono||'📦',maxOrden+1); res.json({ok:true,id:r.lastInsertRowid}) })
app.put('/api/ndc/secciones/:id', requireAuth, (req, res) => { db.prepare('UPDATE ndc_secciones SET nombre=?,icono=?,orden=? WHERE id=?').run(req.body.nombre,req.body.icono||'📦',req.body.orden||0,req.params.id); res.json({ok:true}) })
app.delete('/api/ndc/secciones/:id', requireAuth, (req, res) => { db.prepare('DELETE FROM ndc_secciones WHERE id=?').run(req.params.id); db.prepare('UPDATE ndc_materiales_items SET seccion_id=NULL WHERE seccion_id=?').run(req.params.id); res.json({ok:true}) })
app.post('/api/ndc/secciones/camada', requireAuth, (req, res) => { const b = req.body; const maxOrden = db.prepare('SELECT MAX(orden) as m FROM ndc_secciones').get().m||0; const r = db.prepare('INSERT INTO ndc_secciones_camada (seccion_id,camada_id,nombre,icono,oculta,orden) VALUES (?,?,?,?,?,?)').run(b.seccion_id||null,b.camada_id,b.nombre||null,b.icono||null,b.oculta?1:0,b.orden??maxOrden+1); res.json({ok:true,id:r.lastInsertRowid}) })
app.put('/api/ndc/secciones/camada/:id', requireAuth, (req, res) => { db.prepare('UPDATE ndc_secciones_camada SET oculta=?,nombre=?,icono=?,orden=? WHERE id=?').run(req.body.oculta?1:0,req.body.nombre||null,req.body.icono||null,req.body.orden||0,req.params.id); res.json({ok:true}) })

// ── Fallback SPA ──────────────────────────────────────────────────────────────
if (fs.existsSync(path.join(publicDir, 'index.html'))) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads'))
      res.sendFile(path.join(publicDir, 'index.html'))
  })
}

app.listen(PORT, () => console.log(`\n🌀 Nacer del Caos → http://localhost:${PORT}\n`))
