import { useState, useEffect } from 'react'
import NacerDelCaos from './pages/NacerDelCaos'

const TOKEN_KEY = 'ndc_token'
const USER_KEY  = 'ndc_user'

function getToken() { return localStorage.getItem(TOKEN_KEY) }

function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${getToken()}` }
  })
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Error al iniciar sesión'); return }
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      onLogin(data.user)
    } catch(e) {
      setError('No se pudo conectar al servidor')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px',
    borderRadius: 8, border: '1px solid #ddd', fontSize: 15,
    background: '#fff', color: '#111', outline: 'none'
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌀</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f0c29' }}>Nacer del Caos</h1>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Scholas Occurrentes</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 5 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus style={inp} placeholder="tu@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 5 }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required style={{ ...inp, paddingRight: 40 }} />
              <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#888', lineHeight: 1 }}>{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#c00', background: '#fff0f0', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            padding: '11px', borderRadius: 8, border: 'none', background: '#0f0c29', color: '#fff',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Panel admin: visibilidad ────────────────────────────────────────────────
function tiempoAtras(iso) {
  const diff = Math.floor((Date.now() - new Date(iso + 'Z').getTime()) / 1000)
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff/3600)}h`
  return `hace ${Math.floor(diff/86400)}d`
}

const ACCION_LABEL = {
  crear_participante: ['➕','Agregó a'], editar_participante: ['✏️','Modificó a'], eliminar_participante: ['🗑️','Eliminó a'],
  crear_encuentro: ['➕','Registró encuentro'], eliminar_encuentro: ['🗑️','Eliminó encuentro'],
  crear_hito: ['➕','Creó hito'], editar_hito: ['✏️','Editó hito'], eliminar_hito: ['🗑️','Eliminó hito'],
  crear_escuela: ['➕','Agregó escuela'], editar_escuela: ['✏️','Editó escuela'], eliminar_escuela: ['🗑️','Eliminó escuela'],
  crear_presupuesto: ['➕','Agregó movimiento'], eliminar_presupuesto: ['🗑️','Eliminó movimiento'],
}

function asuntoLabel(entry) {
  const d = entry.datos_despues ? JSON.parse(entry.datos_despues) : null
  const a = entry.datos_antes   ? JSON.parse(entry.datos_antes)   : null
  const p = d || a
  if (!p) return ''
  if (entry.accion.includes('participante')) return `${p.apodo || ''} ${p.nombre || ''} ${p.apellido || ''}`.trim() || `ID ${entry.registro_id}`
  if (entry.accion.includes('encuentro'))   return p.fecha ? p.fecha.slice(0,10) : `ID ${entry.registro_id}`
  if (entry.accion.includes('hito'))        return p.titulo || `ID ${entry.registro_id}`
  if (entry.accion.includes('escuela'))     return p.nombre || `ID ${entry.registro_id}`
  if (entry.accion.includes('presupuesto')) return p.descripcion || `$${p.monto||''}`
  return `ID ${entry.registro_id}`
}

function PanelAdmin({ onClose }) {
  const [visibilidad, setVisibilidad] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [historial, setHistorial] = useState([])
  const [tabAdmin, setTabAdmin] = useState('historial')
  const [formU, setFormU] = useState({ nombre:'', email:'', password:'', rol:'colaborador' })
  const [editU, setEditU] = useState(null)
  const [showFormU, setShowFormU] = useState(false)

  const SECCIONES = [
    { id: 'camadas', label: '🌀 Camadas' },
    { id: 'donantes', label: '🤝 Donantes' },
    { id: 'materiales', label: '🎨 Materiales' },
    { id: 'comunicacion', label: '📣 Comunicación' },
  ]

  useEffect(() => {
    authFetch('/api/visibilidad').then(r => r.json()).then(setVisibilidad).catch(()=>{})
    authFetch('/api/usuarios').then(r => r.json()).then(setUsuarios).catch(()=>{})
    authFetch('/api/ndc/historial').then(r => r.json()).then(setHistorial).catch(()=>{})
  }, [])

  async function revertir(id) {
    if (!window.confirm('¿Revertir este cambio?')) return
    const r = await authFetch(`/api/ndc/historial/${id}/revertir`, { method: 'POST' })
    const data = await r.json()
    if (data.ok) setHistorial(h => h.map(e => e.id === id ? { ...e, revertido: 1 } : e))
    else alert('Error: ' + (data.error || 'desconocido'))
  }

  async function toggleSeccion(seccion, bloqueada) {
    await authFetch(`/api/visibilidad/${seccion}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloqueada: bloqueada ? 0 : 1 })
    })
    setVisibilidad(v => v.map(s => s.seccion === seccion ? { ...s, bloqueada: bloqueada ? 0 : 1 } : s))
  }

  async function guardarUsuario() {
    if (editU) {
      await authFetch(`/api/usuarios/${editU.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formU)
      })
    } else {
      await authFetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formU)
      })
    }
    const r = await authFetch('/api/usuarios')
    setUsuarios(await r.json())
    setShowFormU(false)
    setEditU(null)
    setFormU({ nombre:'', email:'', password:'', rol:'colaborador' })
  }

  async function eliminarUsuario(id) {
    if (!window.confirm('¿Eliminar usuario?')) return
    await authFetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    setUsuarios(us => us.filter(u => u.id !== id))
  }

  const inp = { fontSize: 12, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', width: '100%', boxSizing: 'border-box' }
  const btn = { fontSize: 11, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#1a1a2e', color: '#fff', cursor: 'pointer' }
  const btnSec = { fontSize: 11, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '0 0 0 16px', width: 420, maxHeight: '100vh', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.2)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>⚙️ Administración</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text3)', lineHeight: 1 }}>×</button>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {[['historial',`📋 Historial${historial.filter(e=>!e.revertido).length > 0 ? ` (${historial.filter(e=>!e.revertido).length})` : ''}`],['visibilidad','🔒 Secciones'],['usuarios','👥 Usuarios']].map(([id, label]) => (
            <button key={id} onClick={() => setTabAdmin(id)} style={{
              padding: '7px 16px', fontSize: 12, border: 'none',
              borderBottom: tabAdmin === id ? '2px solid #1a1a2e' : '2px solid transparent',
              background: 'none', cursor: 'pointer', fontWeight: tabAdmin === id ? 600 : 400,
              color: tabAdmin === id ? 'var(--text)' : 'var(--text3)', marginBottom: -1
            }}>{label}</button>
          ))}
        </div>

        {tabAdmin === 'historial' && (
          <div>
            {historial.length === 0 && <div style={{ fontSize:12, color:'var(--text3)', textAlign:'center', padding:24 }}>Sin cambios registrados aún.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {historial.map(entry => {
                const [icono, verbo] = ACCION_LABEL[entry.accion] || ['•', entry.accion]
                const asunto = asuntoLabel(entry)
                const isElim = entry.accion.startsWith('eliminar_')
                return (
                  <div key={entry.id} style={{ background: entry.revertido ? 'var(--bg3)' : 'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', opacity: entry.revertido ? 0.55 : 1 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background: isElim ? '#3d0f0f' : entry.accion.startsWith('editar') ? '#1a2a4a' : '#0f3d1a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{icono}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600 }}>{entry.usuario_nombre}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{verbo} <span style={{ color:'var(--text2)' }}>{asunto}</span></div>
                      </div>
                      <div style={{ fontSize:10, color:'var(--text3)', flexShrink:0, textAlign:'right' }}>
                        <div>{tiempoAtras(entry.created_at)}</div>
                        {entry.revertido
                          ? <span style={{ fontSize:10, color:'#888', fontStyle:'italic' }}>revertido</span>
                          : <button onClick={() => revertir(entry.id)} style={{ fontSize:10, padding:'2px 8px', borderRadius:4, border:'1px solid var(--border)', background:'transparent', color:'#c00', cursor:'pointer', marginTop:3 }}>Revertir</button>
                        }
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tabAdmin === 'visibilidad' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
              Las secciones bloqueadas no serán visibles para los colaboradores.
            </div>
            {SECCIONES.map(s => {
              const estado = visibilidad.find(v => v.seccion === s.id)
              const bloqueada = !!estado?.bloqueada
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 13 }}>{s.label}</span>
                  <button onClick={() => toggleSeccion(s.id, bloqueada)} style={{
                    padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: bloqueada ? '#991a1a' : '#1A4D00', color: '#fff'
                  }}>{bloqueada ? '🔒 Bloqueada' : '✓ Visible'}</button>
                </div>
              )
            })}
          </div>
        )}

        {tabAdmin === 'usuarios' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button onClick={() => { setShowFormU(true); setEditU(null); setFormU({ nombre:'', email:'', password:'', rol:'colaborador' }) }} style={btn}>+ Agregar usuario</button>
            </div>

            {showFormU && (
              <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><label style={{ fontSize: 11, color: 'var(--text3)' }}>Nombre</label><input style={inp} value={formU.nombre} onChange={e => setFormU(f => ({...f, nombre: e.target.value}))} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text3)' }}>Email</label><input style={inp} type="email" value={formU.email} onChange={e => setFormU(f => ({...f, email: e.target.value}))} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text3)' }}>Contraseña {editU && '(dejar vacía para no cambiar)'}</label><input style={inp} type="password" value={formU.password} onChange={e => setFormU(f => ({...f, password: e.target.value}))} /></div>
                  <div><label style={{ fontSize: 11, color: 'var(--text3)' }}>Rol</label>
                    <select style={inp} value={formU.rol} onChange={e => setFormU(f => ({...f, rol: e.target.value}))}>
                      <option value="colaborador">Colaborador</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={guardarUsuario} style={btn}>Guardar</button>
                    <button onClick={() => { setShowFormU(false); setEditU(null) }} style={btnSec}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {usuarios.map(u => (
                <div key={u.id} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u.email} · <span style={{ color: u.rol === 'admin' ? '#185FA5' : 'var(--text3)' }}>{u.rol}</span>{!u.activo ? ' · inactivo' : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setEditU(u); setShowFormU(true); setFormU({ nombre: u.nombre, email: u.email, password: '', rol: u.rol }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)' }}>✏️</button>
                    <button onClick={() => eliminarUsuario(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#991a1a' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── App principal ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
  })
  const [adminOpen, setAdminOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    // Verificar token sigue válido
    authFetch('/api/auth/me')
      .then(r => { if (r.status === 401) { handleLogout() } })
      .catch(() => {})
  }, [])

  function handleLogin(userData) {
    setUser(userData)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  if (!user) return <LoginPage onLogin={handleLogin} />

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a4e 100%)',
        color: '#fff', padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52, flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🌀</span>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.3 }}>Nacer del Caos</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>Scholas Occurrentes</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {user.nombre}
            {user.rol === 'admin' && <span style={{ marginLeft: 6, fontSize: 10, background: 'rgba(255,255,255,0.15)', padding: '1px 7px', borderRadius: 8 }}>admin</span>}
          </span>
          {user.rol === 'admin' && (
            <button onClick={() => setAdminOpen(true)} title="Administración" style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 14
            }}>⚙️</button>
          )}
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.75)',
            borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12
          }}>Salir</button>
        </div>
      </div>

      {/* Contenido */}
      <div className="ndc-content" style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <NacerDelCaos user={user} />
      </div>

      {/* Panel admin */}
      {adminOpen && <PanelAdmin onClose={() => setAdminOpen(false)} />}
    </div>
  )
}
