import { useState, useEffect, useCallback, useRef } from 'react'
import React from 'react'

async function heicAJpeg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url)
        blob
          ? resolve(new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' }))
          : reject(new Error('Canvas no pudo convertir la imagen'))
      }, 'image/jpeg', 0.9)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar la imagen HEIC')) }
    img.src = url
  })
}

// ─── Biblioteca de frases ────────────────────────────────────────────────────
const FRASES = [
  { texto: "El arte no reproduce lo visible, sino que hace visible lo invisible.", autor: "Paul Klee", fuente: "pintor" },
  { texto: "El caos es el orden por descubrir.", autor: "José Saramago", fuente: "escritor" },
  { texto: "La creatividad es la inteligencia divirtiéndose.", autor: "Albert Einstein", fuente: "pensador" },
  { texto: "La locura es relativa. Depende de quién tiene encerrado a quién.", autor: "Ray Bradbury", fuente: "escritor" },
  { texto: "No hay arte sin contemplación.", autor: "Henri Matisse", fuente: "pintor" },
  { texto: "El individuo que no ha pasado por el infierno de sus pasiones nunca las ha superado.", autor: "Carl Jung", fuente: "psicólogo" },
  { texto: "La identidad es lo que no se puede quitar.", autor: "Homi Bhabha", fuente: "pensador" },
  { texto: "El juego es la forma más elevada de investigación.", autor: "Albert Einstein", fuente: "pensador" },
  { texto: "Somos lo que hacemos con lo que hicieron de nosotros.", autor: "Jean-Paul Sartre", fuente: "filósofo" },
  { texto: "La pintura es poesía muda.", autor: "Leonardo da Vinci", fuente: "pintor" },
  { texto: "El trabajo más importante que hará en su vida es dentro de los muros de su hogar.", autor: "Harold B. Lee", fuente: "pensador" },
  { texto: "La esperanza es el sueño del hombre despierto.", autor: "Aristóteles", fuente: "filósofo" },
  { texto: "El arte es la forma en que los humanos hacen especial al mundo.", autor: "Ellen Dissanayake", fuente: "pensadora" },
  { texto: "La libertad no es la ausencia de compromiso, sino la capacidad de elegir.", autor: "Paulo Coelho", fuente: "escritor" },
  { texto: "El encuentro genuino entre dos personas es como el contacto de dos sustancias químicas.", autor: "Carl Jung", fuente: "psicólogo" },
  { texto: "El arcano de La Estrella: renovación, esperanza, guía interior.", autor: "Arcano XVII", fuente: "tarot" },
  { texto: "El arcano de El Loco: el inicio de todo viaje, la apertura sin condicionamientos.", autor: "Arcano 0", fuente: "tarot" },
  { texto: "La creatividad requiere el coraje de soltar las certezas.", autor: "Erich Fromm", fuente: "psicólogo" },
  { texto: "El arte es la mentira que nos permite decir la verdad.", autor: "Pablo Picasso", fuente: "pintor" },
  { texto: "Lo que no se nombra no existe. Lo que se nombra empieza a vivir.", autor: "Hélène Cixous", fuente: "escritora" },
  { texto: "El arcano de La Rueda de la Fortuna: los ciclos, el movimiento perpetuo, la transformación.", autor: "Arcano X", fuente: "tarot" },
  { texto: "Uno no se convierte en iluminado imaginando figuras de luz, sino haciendo consciente la oscuridad.", autor: "Carl Jung", fuente: "psicólogo" },
  { texto: "La comunidad es el espacio donde la persona puede ser plenamente ella misma.", autor: "Martin Buber", fuente: "filósofo" },
  { texto: "La vida imita al arte mucho más de lo que el arte imita a la vida.", autor: "Oscar Wilde", fuente: "escritor" },
  { texto: "El ser humano puede soportar casi cualquier qué si tiene un por qué.", autor: "Viktor Frankl", fuente: "psicólogo" },
  { texto: "Jugar es la respuesta del niño a la invitación de la vida.", autor: "Donald Winnicott", fuente: "psicólogo" },
  { texto: "El arcano de El Sol: vitalidad, autenticidad, alegría que no pide permiso.", autor: "Arcano XIX", fuente: "tarot" },
  { texto: "Toda creación comienza con el caos.", autor: "Francis Bacon", fuente: "pintor" },
  { texto: "El arte es la mayor forma de esperanza.", autor: "Gerhard Richter", fuente: "pintor" },
  { texto: "El arcano de El Mundo: completitud, integración, el ciclo cumplido.", autor: "Arcano XXI", fuente: "tarot" },
  { texto: "La hospitalidad es el arte de hacer que el otro sienta que está en su casa.", autor: "Anónimo", fuente: "sabiduría" },
  { texto: "Nacer es lo más creativo que hacemos.", autor: "Winnicott adaptado", fuente: "psicólogo" },
  { texto: "La diversidad es la única forma de riqueza verdadera.", autor: "Claude Lévi-Strauss", fuente: "pensador" },
  { texto: "Cada vez que enseñas, aprendes el doble.", autor: "Robert Heinlein", fuente: "escritor" },
  { texto: "El arcano de La Fuerza: la potencia que viene de adentro, no de la imposición.", autor: "Arcano VIII", fuente: "tarot" },
]

// ─── Auth ─────────────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('ndc_token')
function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${getToken()}` }
  })
}

// ─── API ─────────────────────────────────────────────────────────────────────
const api = {
  get: (url) => authFetch(url).then(r => r.json()),
  post: (url, data) => authFetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
  put: (url, data) => authFetch(url, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
  del: (url) => authFetch(url, { method:'DELETE' }).then(r => r.json()),
}

// ─── Colores por estado ───────────────────────────────────────────────────────
const ESTADO_COLORS = {
  en_curso: { bg:'#EAF3DE', color:'#1A4D00', label:'En curso' },
  completada: { bg:'#E6F1FB', color:'#185FA5', label:'Completada' },
  planificada: { bg:'#FAEEDA', color:'#633806', label:'Planificada' },
  suspendida: { bg:'#FCEBEB', color:'#791F1F', label:'Suspendida' },
}

const TIPO_HITO = { mural_interno:'🏠', mural_vp:'🏙️', mural:'🎨', exposicion:'🖼️', evento:'📅', otro:'📌' }
const CANAL_COLORS = { instagram:'#E1306C', facebook:'#1877F2', prensa:'#333', email:'#633806', whatsapp:'#25D366', otro:'#999' }
const ESTADO_COM = { idea:'#999', borrador:'#F0A832', listo:'#185FA5', publicado:'#1A4D00', descartado:'#ccc' }

function fmt(n) { return Math.round(n||0).toLocaleString('es-AR') }

// ─── Cuadro dinámico ─────────────────────────────────────────────────────────
function CuadroDinamico({ stats }) {
  const [favoritas, setFavoritas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ndc_frases_fav') || '[]') } catch { return [] }
  })
  const [frase, setFrase] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('ndc_frases_fav') || '[]')
      if (favs.length > 0 && Math.random() < 0.5) return FRASES.find(f => f.texto === favs[Math.floor(Math.random() * favs.length)]) || FRASES[Math.floor(Math.random() * FRASES.length)]
    } catch {}
    return FRASES[Math.floor(Math.random() * FRASES.length)]
  })

  const iconos = { pintor:'🎨', psicólogo:'🧠', filósofo:'💭', escritor:'📖', escritora:'📖', pensador:'✨', pensadora:'✨', tarot:'🔮', sabiduría:'🌿' }
  const esFavorita = favoritas.includes(frase.texto)

  function toggleFavorita() {
    const nuevas = esFavorita
      ? favoritas.filter(t => t !== frase.texto)
      : [...favoritas, frase.texto]
    setFavoritas(nuevas)
    localStorage.setItem('ndc_frases_fav', JSON.stringify(nuevas))
  }

  return (
    <div style={{ background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', borderRadius:16, padding:'28px 32px', marginBottom:20, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, opacity:0.03, backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'60px 60px' }} />
      <div style={{ position:'relative' }}>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', letterSpacing:3, textTransform:'uppercase', marginBottom:20 }}>Nacer del Caos · Scholas</div>
        {/* Stats rápidos */}
        <div style={{ display:'flex', gap:24, marginBottom:28, flexWrap:'wrap' }}>
          {[
            [stats.camadas || 0, 'camadas'],
            [stats.participantes || 0, 'jóvenes'],
            [stats.escuelas || 0, 'escuelas'],
            [stats.murales || 0, 'murales'],
            [stats.paises || 0, 'países'],
          ].map(([n,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:700, color:'#fff' }}>{n}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:1 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Frase */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:20 }}>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.9)', lineHeight:1.6, fontStyle:'italic', marginBottom:8 }}>
            "{frase.texto}"
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
              {iconos[frase.fuente] || '✨'} {frase.autor}
            </div>
            <button onClick={toggleFavorita} title={esFavorita ? 'Quitar de favoritas' : 'Marcar como favorita'} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, lineHeight:1, padding:'2px 4px', opacity: esFavorita ? 1 : 0.35, transition:'opacity .2s, transform .15s', transform: esFavorita ? 'scale(1.2)' : 'scale(1)' }}>
              ⭐
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Editor de encuadre (drag-to-crop) ───────────────────────────────────────
function EditorEncuadre({ src, posicion, aspecto = 16/9, onGuardar, onCerrar }) {
  const containerRef = useRef()
  const imgRef = useRef()
  const [ready, setReady] = useState(false)
  const [cropPos, setCropPos] = useState({ x:0, y:0 })
  const dragging = useRef(false)
  const lastMouse = useRef({ x:0, y:0 })
  const layout = useRef(null)

  function compute() {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container || !img.naturalWidth) return
    const cw = container.clientWidth, ch = container.clientHeight
    const natW = img.naturalWidth, natH = img.naturalHeight
    const scale = Math.min(cw / natW, ch / natH)
    const imgW = Math.round(natW * scale), imgH = Math.round(natH * scale)
    const imgX = Math.round((cw - imgW) / 2), imgY = Math.round((ch - imgH) / 2)
    const CROP = aspecto
    let cropW, cropH
    if (imgW / imgH > CROP) { cropH = imgH; cropW = Math.round(imgH * CROP) }
    else { cropW = imgW; cropH = Math.round(imgW / CROP) }
    const maxX = imgW - cropW, maxY = imgH - cropH
    layout.current = { imgX, imgY, imgW, imgH, cropW, cropH, maxX, maxY }
    const m = posicion?.match(/([\d.]+)%\s+([\d.]+)%/)
    const pX = m ? parseFloat(m[1]) / 100 : 0.5
    const pY = m ? parseFloat(m[2]) / 100 : 0.5
    setCropPos({ x: Math.round(pX * maxX), y: Math.round(pY * maxY) })
    setReady(true)
  }

  function startDrag(e) {
    e.preventDefault()
    dragging.current = true
    const pt = e.touches ? e.touches[0] : e
    lastMouse.current = { x: pt.clientX, y: pt.clientY }
  }

  function moveDrag(e) {
    if (!dragging.current || !layout.current) return
    const pt = e.touches ? e.touches[0] : e
    const dx = pt.clientX - lastMouse.current.x
    const dy = pt.clientY - lastMouse.current.y
    lastMouse.current = { x: pt.clientX, y: pt.clientY }
    const { maxX, maxY } = layout.current
    setCropPos(p => ({ x: Math.max(0, Math.min(maxX, p.x + dx)), y: Math.max(0, Math.min(maxY, p.y + dy)) }))
  }

  function guardar() {
    const l = layout.current
    if (!l) return
    const pX = l.maxX > 0 ? Math.round(cropPos.x / l.maxX * 100) : 50
    const pY = l.maxY > 0 ? Math.round(cropPos.y / l.maxY * 100) : 50
    onGuardar(`${pX}% ${pY}%`)
  }

  const l = layout.current

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.92)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}
      onMouseMove={moveDrag} onMouseUp={()=>{ dragging.current=false }} onTouchMove={moveDrag} onTouchEnd={()=>{ dragging.current=false }}>
      <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>Arrastrá el recuadro para elegir qué parte se muestra</div>
      <div ref={containerRef} style={{ position:'relative', width:'min(88vw, 680px)', height:'min(75vh, 520px)' }}>
        <img ref={imgRef} src={src} onLoad={compute}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'contain', display:'block', pointerEvents:'none' }} />
        {ready && l && (() => {
          const ax = l.imgX + cropPos.x, ay = l.imgY + cropPos.y
          return (<>
            {cropPos.y > 0 && <div style={{ position:'absolute', left:l.imgX, top:l.imgY, width:l.imgW, height:cropPos.y, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />}
            {cropPos.y + l.cropH < l.imgH && <div style={{ position:'absolute', left:l.imgX, top:ay+l.cropH, width:l.imgW, height:l.imgH-cropPos.y-l.cropH, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />}
            {cropPos.x > 0 && <div style={{ position:'absolute', left:l.imgX, top:ay, width:cropPos.x, height:l.cropH, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />}
            {cropPos.x + l.cropW < l.imgW && <div style={{ position:'absolute', left:ax+l.cropW, top:ay, width:l.imgW-cropPos.x-l.cropW, height:l.cropH, background:'rgba(0,0,0,0.62)', pointerEvents:'none' }} />}
            <div style={{ position:'absolute', left:ax, top:ay, width:l.cropW, height:l.cropH, border:'2px solid rgba(255,255,255,0.85)', cursor:'move', boxSizing:'border-box', zIndex:2 }}
              onMouseDown={startDrag} onTouchStart={startDrag} />
            {[[0,0],[1,0],[0,1],[1,1]].map(([cx,cy]) => (
              <div key={`${cx}${cy}`} style={{ position:'absolute', width:8, height:8, background:'#fff', left:ax+cx*l.cropW-4, top:ay+cy*l.cropH-4, pointerEvents:'none', zIndex:3 }} />
            ))}
          </>)
        })()}
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={guardar} style={{ padding:'8px 22px', borderRadius:8, border:'none', background:'#4f46e5', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:600 }}>✓ Guardar</button>
        <button onClick={onCerrar} style={{ padding:'8px 16px', borderRadius:8, border:'1px solid rgba(255,255,255,0.3)', background:'transparent', color:'#fff', cursor:'pointer', fontSize:14 }}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Foto carnet de participante ─────────────────────────────────────────────
function FotoParticipante({ participante: p, onFotoChange }) {
  const [posicion, setPosicion] = useState(p.foto_posicion || '50% 50%')
  const [editandoEncuadre, setEditandoEncuadre] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [hover, setHover] = useState(false)
  const fileRef = useRef()

  async function subirFoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      const r = await authFetch(`${BASE}/api/ndc/participantes/${p.id}/foto`, { method:'POST', body:fd }).then(r=>r.json())
      if (r.ok) onFotoChange(r.foto_url)
      else alert('Error: ' + (r.error || 'desconocido'))
    } catch(err) { alert('Error: ' + err.message) }
    finally { setSubiendo(false); e.target.value = '' }
  }

  async function borrarFoto(e) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar la foto?')) return
    await authFetch(`${BASE}/api/ndc/participantes/${p.id}/foto`, { method:'DELETE' })
    onFotoChange(null)
  }

  async function cambiarPosicion(pos) {
    setPosicion(pos)
    await authFetch(`${BASE}/api/ndc/participantes/${p.id}/foto-posicion`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ posicion: pos }) })
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*,.heic,.heif" style={{ display:'none' }} onChange={subirFoto} />
      {p.foto_url
        ? <div style={{ position:'relative', width:52, height:70, borderRadius:6, overflow:'hidden', flexShrink:0, cursor:'pointer' }}
            onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
            <img src={`${BASE}/uploads/participantes/${p.foto_url}`} alt=""
              style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition: posicion, display:'block' }} />
            {hover && (
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3 }}>
                <button onClick={()=>setEditandoEncuadre(true)} style={{ fontSize:9, padding:'2px 6px', borderRadius:4, border:'none', background:'rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer' }}>encuadre</button>
                <button onClick={()=>fileRef.current.click()} style={{ fontSize:9, padding:'2px 6px', borderRadius:4, border:'none', background:'rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer' }}>cambiar</button>
                <button onClick={borrarFoto} style={{ fontSize:9, padding:'2px 5px', borderRadius:4, border:'none', background:'rgba(180,0,0,0.75)', color:'#fff', cursor:'pointer' }}>✕</button>
              </div>
            )}
          </div>
        : <div onClick={()=>!subiendo && fileRef.current.click()}
            style={{ width:52, height:70, borderRadius:6, border:'1.5px dashed var(--border2)', background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', cursor: subiendo ? 'wait' : 'pointer', flexShrink:0 }}>
            <span style={{ fontSize:20 }}>{subiendo ? '⏳' : '📷'}</span>
          </div>
      }
      {editandoEncuadre && (
        <EditorEncuadre
          src={`${BASE}/uploads/participantes/${p.foto_url}`}
          posicion={posicion}
          aspecto={3/4}
          onGuardar={pos => { cambiarPosicion(pos); setEditandoEncuadre(false) }}
          onCerrar={() => setEditandoEncuadre(false)}
        />
      )}
    </>
  )
}

// ─── Tarjeta Hito ────────────────────────────────────────────────────────────
function TarjetaHito({ hito: h, onDelete, onEdit, onImagenChange }) {
  const [visor, setVisor] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [posicion, setPosicion] = useState(h.imagen_posicion || 'center center')
  const [editandoEncuadre, setEditandoEncuadre] = useState(false)
  const fileRef = useRef()

  async function cambiarPosicion(pos) {
    setPosicion(pos)
    await authFetch(`${BASE}/api/ndc/hitos/${h.id}/posicion`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ posicion: pos }) })
  }

  async function subirImagen(e) {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append('imagen', file)
      const r = await authFetch(`${BASE}/api/ndc/hitos/${h.id}/imagen`, { method:'POST', body:fd }).then(r=>r.json())
      if (r.ok) onImagenChange(r.imagen_url)
      else alert('Error al subir: ' + (r.error || 'desconocido'))
    } catch(err) { alert('Error al subir la imagen: ' + err.message) }
    finally { setSubiendo(false); e.target.value = '' }
  }

  async function borrarImagen(e) {
    e.stopPropagation()
    if (!window.confirm('¿Eliminar la imagen?')) return
    await authFetch(`${BASE}/api/ndc/hitos/${h.id}/imagen`, { method:'DELETE' })
    onImagenChange(null)
  }

  const tipoLabel = { mural_interno:'Mural Interno', mural_vp:'Mural Vía Pública', mural:'Mural', exposicion:'Exposición', evento:'Evento', otro:'Otro' }

  return (
    <>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        {/* Imagen */}
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" style={{ display:'none' }} onChange={subirImagen} />
        {h.imagen_url
          ? <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', cursor:'zoom-in' }} onClick={() => setVisor(true)}>
              <img src={`${BASE}/uploads/hitos/${h.imagen_url}`} alt={h.titulo}
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition: posicion, display:'block', transition:'transform .3s' }}
                onMouseEnter={e => e.target.style.transform='scale(1.03)'}
                onMouseLeave={e => e.target.style.transform='scale(1)'} />
              <div style={{ position:'absolute', bottom:6, right:6, display:'flex', gap:4 }} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setEditandoEncuadre(true)} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'none', background:'rgba(0,0,0,0.55)', color:'#fff', cursor:'pointer' }}>⊹ encuadre</button>
                <button onClick={() => fileRef.current.click()} disabled={subiendo} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'none', background:'rgba(0,0,0,0.55)', color:'#fff', cursor:'pointer' }}>{subiendo ? '⏳' : '↑ cambiar'}</button>
                <button onClick={borrarImagen} style={{ fontSize:11, padding:'3px 7px', borderRadius:6, border:'none', background:'rgba(180,0,0,0.7)', color:'#fff', cursor:'pointer' }}>✕</button>
              </div>
            </div>
          : <div onClick={() => !subiendo && fileRef.current.click()}
              style={{ aspectRatio:'16/9', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor: subiendo ? 'wait' : 'pointer', border:'2px dashed var(--border2)', borderRadius:'10px 10px 0 0', background:'var(--bg3)', transition:'background .15s' }}
              onMouseEnter={e=>{ if(!subiendo) e.currentTarget.style.background='var(--bg)' }}
              onMouseLeave={e=>e.currentTarget.style.background='var(--bg3)'}>
              <span style={{ fontSize:32 }}>{subiendo ? '⏳' : '📷'}</span>
              <span style={{ fontSize:11, color:'var(--text3)' }}>{subiendo ? 'Convirtiendo y subiendo…' : 'Click para subir foto'}</span>
            </div>
        }
        {/* Info */}
        <div style={{ padding:'10px 12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
            <span style={{ fontSize:14 }}>{TIPO_HITO[h.tipo] || '📌'}</span>
            <span style={{ fontSize:11, color:'var(--text3)' }}>{tipoLabel[h.tipo] || h.tipo}</span>
          </div>
          <div style={{ fontSize:13, fontWeight:600 }}>{h.titulo}</div>
          {h.lugar && <div style={{ fontSize:11, color:'var(--text3)', marginTop:3 }}>📍 {h.lugar}</div>}
          {h.fecha && <div style={{ fontSize:11, color:'var(--text3)' }}>📅 {h.fecha?.split('-').reverse().join('/')}</div>}
          <div style={{ display:'flex', gap:8, marginTop:6 }}>
            <button onClick={onEdit} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:12, padding:0 }}>✏️ Editar</button>
            <button onClick={onDelete} style={{ background:'none', border:'none', cursor:'pointer', color:'#991a1a', fontSize:12, padding:0 }}>🗑️ Eliminar</button>
          </div>
        </div>
      </div>

      {/* Editor de encuadre */}
      {editandoEncuadre && (
        <EditorEncuadre
          src={`${BASE}/uploads/hitos/${h.imagen_url}`}
          posicion={posicion}
          onGuardar={pos => { cambiarPosicion(pos); setEditandoEncuadre(false) }}
          onCerrar={() => setEditandoEncuadre(false)}
        />
      )}

      {/* Visor fullscreen */}
      {visor && (
        <div onClick={() => setVisor(false)} style={{
          position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.9)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out',
          flexDirection:'column', gap:12,
        }}>
          <img src={`${BASE}/uploads/hitos/${h.imagen_url}`} alt={h.titulo}
            style={{ maxWidth:'92vw', maxHeight:'88vh', objectFit:'contain', borderRadius:6, boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }} />
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>{h.titulo} · click para cerrar</div>
        </div>
      )}
    </>
  )
}

const BANDERAS = { 'Argentina':'🇦🇷', 'Uruguay':'🇺🇾', 'Chile':'🇨🇱', 'Brasil':'🇧🇷', 'México':'🇲🇽' }
function bandera(pais) { return BANDERAS[pais] || '🌍' }

// ─── Tarjeta Camada (con chips expandibles) ───────────────────────────────────
function TarjetaCamada({ c, onSeleccionar, onEditar, onEliminar }) {
  const [expand, setExpand] = useState(null)
  const [chipData, setChipData] = useState([])
  const [loadingChip, setLoadingChip] = useState(false)

  async function toggleChip(tipo, e) {
    e.stopPropagation()
    if (expand === tipo) { setExpand(null); return }
    setExpand(tipo)
    if (tipo === 'jovenes') {
      setLoadingChip(true)
      setChipData(await api.get(`/api/ndc/participantes?camada_id=${c.id}`))
      setLoadingChip(false)
    } else if (tipo === 'escuelas') {
      setLoadingChip(true)
      setChipData(await api.get(`/api/ndc/escuelas?camada_id=${c.id}`))
      setLoadingChip(false)
    } else {
      setChipData([])
    }
  }

  let progreso = null
  if (c.estado === 'en_curso' && c.fecha_inicio_real && c.fecha_fin_real) {
    const ini = new Date(c.fecha_inicio_real), fin = new Date(c.fecha_fin_real), hoy = new Date()
    const total = (fin - ini) / 86400000
    progreso = Math.round(Math.min(Math.max((hoy - ini) / 86400000, 0), total) / total * 100)
  }

  const fmtFecha = d => d?.split('-').reverse().join('/')

  const chipStyle = (tipo) => ({
    fontSize:10, padding:'2px 8px', borderRadius:10, fontWeight:500, cursor:'pointer',
    border: `1px solid ${expand===tipo ? 'currentColor' : 'transparent'}`,
    transition:'border .1s',
  })

  return (
    <div style={{ background:'var(--bg2)', border:`1px solid ${c.estado==='en_curso' ? '#1a1a2e' : 'var(--border)'}`, borderRadius:12, padding:'14px 16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div style={{ fontSize:14, fontWeight:600, cursor:'pointer', flex:1, display:'flex', alignItems:'center', gap:6 }} onClick={onSeleccionar}>
          <span style={{ fontSize:16 }}>{bandera(c.pais)}</span> {c.nombre}
        </div>
        <span style={{ fontSize:10, padding:'2px 7px', borderRadius:10, background:(ESTADO_COLORS[c.estado]||ESTADO_COLORS.completada).bg, color:(ESTADO_COLORS[c.estado]||ESTADO_COLORS.completada).color, flexShrink:0 }}>
          {(ESTADO_COLORS[c.estado]||ESTADO_COLORS.completada).label}
        </span>
      </div>

      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8, cursor:'pointer' }} onClick={onSeleccionar}>
        📍 {c.sede} · {c.fecha_inicio_real ? `${fmtFecha(c.fecha_inicio_real)} → ${fmtFecha(c.fecha_fin_real)}` : c.anio}
      </div>

      {/* Chips expandibles */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
        {c.participantes_reales > 0 && (
          <span onClick={e => toggleChip('jovenes', e)} style={{ ...chipStyle('jovenes'), background:'#EAF3DE', color:'#1A4D00' }}>
            👥 {c.participantes_reales} jóvenes {expand==='jovenes' ? '▲' : '▼'}
          </span>
        )}
        {c.cantidad_escuelas > 0 && (
          <span onClick={e => toggleChip('escuelas', e)} style={{ ...chipStyle('escuelas'), background:'#E6F1FB', color:'#185FA5' }}>
            🏫 {c.cantidad_escuelas} escuelas {expand==='escuelas' ? '▲' : '▼'}
          </span>
        )}
        {c.cantidad_dias > 0 && (
          <span onClick={e => toggleChip('dias', e)} style={{ ...chipStyle('dias'), background:'#FAEEDA', color:'#633806' }}>
            📅 {c.cantidad_dias} días {expand==='dias' ? '▲' : '▼'}
          </span>
        )}
        {!c.participantes_reales && !c.cantidad_escuelas && (
          <span style={{ fontSize:10, color:'var(--text3)' }}>{c.participantes_esperados} jóvenes esperados</span>
        )}
      </div>

      {/* Panel expandido */}
      {expand && (
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px', marginBottom:8, fontSize:11, maxHeight:220, overflowY:'auto' }}>
          {loadingChip && <div style={{ color:'var(--text3)' }}>Cargando…</div>}

          {expand === 'dias' && (
            <div style={{ display:'flex', gap:16 }}>
              <div><div style={{ color:'var(--text3)', marginBottom:2 }}>Inicio</div><div style={{ fontWeight:600 }}>{fmtFecha(c.fecha_inicio_real)}</div></div>
              <div><div style={{ color:'var(--text3)', marginBottom:2 }}>Fin</div><div style={{ fontWeight:600 }}>{fmtFecha(c.fecha_fin_real)}</div></div>
              <div><div style={{ color:'var(--text3)', marginBottom:2 }}>Duración</div><div style={{ fontWeight:600 }}>{c.cantidad_dias} días</div></div>
            </div>
          )}

          {expand === 'jovenes' && !loadingChip && (
            chipData.length === 0
              ? <div style={{ color:'var(--text3)' }}>Sin participantes cargados. Abrí la camada para agregar.</div>
              : chipData.map(p => (
                <div key={p.id} style={{ padding:'5px 0', borderBottom:'0.5px solid var(--border)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2px 12px' }}>
                  <div style={{ fontWeight:600 }}>{p.apodo || '—'} {p.nombre && p.apellido ? <span style={{fontWeight:400,color:'var(--text3)'}}>({p.nombre} {p.apellido})</span> : ''}</div>
                  <div style={{ color:'var(--text3)' }}>{p.dni ? `DNI ${p.dni}` : ''} {p.edad ? `· ${p.edad} años` : ''}</div>
                  {(p.padre_madre || p.responsable) && <div style={{ color:'var(--text3)', gridColumn:'1/-1' }}>
                    {p.padre_madre && <span>Padre/Madre: {p.padre_madre}</span>}
                    {p.responsable && <span> · Resp: {p.responsable}</span>}
                    {p.contacto_responsable && <span> · {p.contacto_responsable}</span>}
                  </div>}
                  {p.escuela && <div style={{ color:'var(--text3)', gridColumn:'1/-1' }}>🏫 {p.escuela}</div>}
                </div>
              ))
          )}

          {expand === 'escuelas' && !loadingChip && (
            chipData.length === 0
              ? <div style={{ color:'var(--text3)' }}>Sin escuelas cargadas. Abrí la camada para agregar.</div>
              : chipData.map(e => (
                <div key={e.id} style={{ padding:'5px 0', borderBottom:'0.5px solid var(--border)' }}>
                  <div style={{ fontWeight:600 }}>{e.nombre}</div>
                  {e.localidad && <div style={{ color:'var(--text3)' }}>📍 {e.localidad}{e.direccion ? ` · ${e.direccion}` : ''}</div>}
                  {e.referente_nombre && <div style={{ color:'var(--text3)' }}>
                    Ref: {e.referente_nombre}
                    {e.referente_tel && ` · 📞 ${e.referente_tel}`}
                    {e.referente_email && ` · ✉️ ${e.referente_email}`}
                  </div>}
                  {e.notas && <div style={{ color:'var(--text3)', fontStyle:'italic' }}>{e.notas}</div>}
                </div>
              ))
          )}
        </div>
      )}

      {/* Barra de progreso */}
      {progreso !== null && (
        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text3)', marginBottom:3 }}>
            <span>Progreso</span><span>{progreso}%</span>
          </div>
          <div style={{ height:5, background:'var(--border)', borderRadius:3 }}>
            <div style={{ height:'100%', width:`${progreso}%`, background:'#1a1a2e', borderRadius:3 }} />
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
        <button onClick={e => { e.stopPropagation(); onEditar() }} style={{background:'none',border:'none',cursor:'pointer',fontSize:14}}>✏️</button>
        <button onClick={e => { e.stopPropagation(); onEliminar() }} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,color:'#991a1a'}}>🗑️</button>
      </div>
    </div>
  )
}

// ─── Sección Camadas ─────────────────────────────────────────────────────────
function SeccionCamadas({ tabExterno = 'camadas', onSalirEgresados }) {
  const [camadas, setCamadas] = useState([])
  const [seleccionada, setSeleccionada] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editCamada, setEditCamada] = useState(null)
  const [form, setForm] = useState({ nombre:'', sede:'Mar del Plata', pais:'Argentina', anio: new Date().getFullYear(), mes_inicio:'', mes_fin:'', estado:'en_curso', descripcion:'', participantes_esperados:30, cantidad_escuelas:0, cantidad_dias:0, participantes_reales:0, fecha_inicio_real:'', fecha_fin_real:'' })
  const [participantes, setParticipantes] = useState([])
  const [escuelas, setEscuelas] = useState([])
  const [encuentros, setEncuentros] = useState([])
  const [hitos, setHitos] = useState([])
  const [presupuesto, setPresupuesto] = useState([])
  const [tabPrincipal, setTabPrincipal] = useState(tabExterno)
  const [subTab, setSubTab] = useState('participantes')
  const [editParticipante, setEditParticipante] = useState(null)
  const [busquedaP, setBusquedaP] = useState('')
  const [formP, setFormP] = useState({ apodo:'', nombre:'', apellido:'', dni:'', edad:'', escuela:'', padre_madre:'', responsable:'', contacto_responsable:'', tutor_mail:'', telefono:'', email:'', testimonio:'', comentario:'' })
  const [apodoEditId, setApodoEditId] = useState(null)
  const [apodoVal, setApodoVal] = useState('')
  const [formPAbierto, setFormPAbierto] = useState(false)
  const [formHAbierto, setFormHAbierto] = useState(false)
  const [formEsAbierto, setFormEsAbierto] = useState(false)
  const [lugarEdit, setLugarEdit] = useState(false)
  const [lugarVal, setLugarVal] = useState('')
  const [formE, setFormE] = useState({ fecha: new Date().toISOString().slice(0,10), actividad:'', presentes:0, notas:'' })
  const [formH, setFormH] = useState({ tipo:'mural', titulo:'', fecha:'', lugar:'', descripcion:'' })
  const [editHito, setEditHito] = useState(null)
  const [formPres, setFormPres] = useState({ categoria:'materiales', descripcion:'', monto:'', tipo:'gasto', fecha: new Date().toISOString().slice(0,10) })
  const [formEs, setFormEs] = useState({ nombre:'', direccion:'', localidad:'', referente_nombre:'', referente_tel:'', referente_email:'', notas:'' })
  const [editEscuela, setEditEscuela] = useState(null)

  useEffect(() => { api.get('/api/ndc/camadas').then(setCamadas) }, [])
  useEffect(() => {
    if (editCamada) {
      setForm({ nombre:editCamada.nombre, sede:editCamada.sede, pais:editCamada.pais, anio:editCamada.anio, mes_inicio:editCamada.mes_inicio||'', mes_fin:editCamada.mes_fin||'', estado:editCamada.estado, descripcion:editCamada.descripcion||'', participantes_esperados:editCamada.participantes_esperados, cantidad_escuelas:editCamada.cantidad_escuelas||0, cantidad_dias:editCamada.cantidad_dias||0, participantes_reales:editCamada.participantes_reales||0, fecha_inicio_real:editCamada.fecha_inicio_real||'', fecha_fin_real:editCamada.fecha_fin_real||'' })
    }
  }, [editCamada])
  useEffect(() => {
    if (!seleccionada) return
    api.get(`/api/ndc/participantes?camada_id=${seleccionada.id}`).then(setParticipantes)
    api.get(`/api/ndc/escuelas?camada_id=${seleccionada.id}`).then(setEscuelas)
    api.get(`/api/ndc/encuentros?camada_id=${seleccionada.id}`).then(setEncuentros)
    api.get(`/api/ndc/hitos?camada_id=${seleccionada.id}`).then(setHitos)
    api.get(`/api/ndc/presupuesto?camada_id=${seleccionada.id}`).then(setPresupuesto)
  }, [seleccionada])

  async function guardarCamada() {
    if (editCamada) {
      await api.put(`/api/ndc/camadas/${editCamada.id}`, form)
    } else {
      await api.post('/api/ndc/camadas', form)
    }
    setCamadas(await api.get('/api/ndc/camadas'))
    setShowForm(false)
    setEditCamada(null)
    setForm({ nombre:'', sede:'Mar del Plata', pais:'Argentina', anio: new Date().getFullYear(), mes_inicio:'', mes_fin:'', estado:'en_curso', descripcion:'', participantes_esperados:30, cantidad_escuelas:0, cantidad_dias:0, participantes_reales:0, fecha_inicio_real:'', fecha_fin_real:'' })
  }

  async function moverCamada(id, dir) {
    const idx = camadas.findIndex(c => c.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= camadas.length) return
    // Swap local inmediato
    const nuevas = [...camadas]
    const tmp = nuevas[idx]; nuevas[idx] = nuevas[newIdx]; nuevas[newIdx] = tmp
    setCamadas(nuevas)
    // Persistir en backend
    await api.put(`/api/ndc/camadas/${nuevas[newIdx].id}`, {...nuevas[newIdx], orden: idx})
    await api.put(`/api/ndc/camadas/${nuevas[idx].id}`, {...nuevas[idx], orden: newIdx})
  }
  async function guardarParticipante() {
    if (editParticipante) {
      await api.put(`/api/ndc/participantes/${editParticipante.id}`, { ...formP, asistencias: editParticipante.asistencias, total_encuentros: editParticipante.total_encuentros, activo: editParticipante.activo, egresado: editParticipante.egresado || 0 })
      setEditParticipante(null)
    } else {
      await api.post('/api/ndc/participantes', { ...formP, camada_id: seleccionada.id })
    }
    setParticipantes(await api.get(`/api/ndc/participantes?camada_id=${seleccionada.id}`))
    setFormP({ apodo:'', nombre:'', apellido:'', dni:'', edad:'', escuela:'', padre_madre:'', responsable:'', contacto_responsable:'', tutor_mail:'', telefono:'', email:'', testimonio:'', comentario:'' })
  }

  async function guardarLugar() {
    const updated = { ...seleccionada, lugar: lugarVal }
    await api.put(`/api/ndc/camadas/${seleccionada.id}`, updated)
    setSeleccionada(updated)
    setCamadas(cs => cs.map(c => c.id === seleccionada.id ? updated : c))
    setLugarEdit(false)
  }

  async function toggleEgresado(p) {
    const nuevo = p.egresado ? 0 : 1
    await api.put(`/api/ndc/participantes/${p.id}`, { ...p, egresado: nuevo })
    setParticipantes(await api.get(`/api/ndc/participantes?camada_id=${seleccionada.id}`))
  }

  async function guardarApodo(p) {
    await api.put(`/api/ndc/participantes/${p.id}`, { ...p, apodo: apodoVal })
    setApodoEditId(null)
    setParticipantes(await api.get(`/api/ndc/participantes?camada_id=${seleccionada.id}`))
  }

  async function guardarEscuela() {
    if (editEscuela) {
      await api.put(`/api/ndc/escuelas/${editEscuela.id}`, formEs)
      setEditEscuela(null)
    } else {
      await api.post('/api/ndc/escuelas', { ...formEs, camada_id: seleccionada.id })
    }
    setEscuelas(await api.get(`/api/ndc/escuelas?camada_id=${seleccionada.id}`))
    setFormEs({ nombre:'', direccion:'', localidad:'', referente_nombre:'', referente_tel:'', referente_email:'', notas:'' })
  }
  async function guardarEncuentro() {
    await api.post('/api/ndc/encuentros', { ...formE, camada_id: seleccionada.id })
    setEncuentros(await api.get(`/api/ndc/encuentros?camada_id=${seleccionada.id}`))
    setFormE({ fecha: new Date().toISOString().slice(0,10), actividad:'', presentes:0, notas:'' })
  }
  async function importarEscuelas() {
    const nombres = [...new Set(participantes.map(p=>p.escuela).filter(Boolean))]
    const existentes = new Set(escuelas.map(e=>e.nombre))
    const nuevas = nombres.filter(n => !existentes.has(n))
    if (nuevas.length === 0) { alert('Todas las escuelas de los participantes ya están cargadas.'); return }
    for (const nombre of nuevas)
      await api.post('/api/ndc/escuelas', { nombre, camada_id: seleccionada.id })
    setEscuelas(await api.get(`/api/ndc/escuelas?camada_id=${seleccionada.id}`))
  }

  async function guardarHito() {
    if (editHito) {
      await api.put(`/api/ndc/hitos/${editHito.id}`, formH)
      setEditHito(null)
    } else {
      await api.post('/api/ndc/hitos', { ...formH, camada_id: seleccionada.id })
    }
    setHitos(await api.get(`/api/ndc/hitos?camada_id=${seleccionada.id}`))
    setFormH({ tipo:'mural', titulo:'', fecha:'', lugar:'', descripcion:'' })
  }
  async function guardarPres() {
    await api.post('/api/ndc/presupuesto', { ...formPres, camada_id: seleccionada.id })
    setPresupuesto(await api.get(`/api/ndc/presupuesto?camada_id=${seleccionada.id}`))
    setFormPres({ categoria:'materiales', descripcion:'', monto:'', tipo:'gasto', fecha: new Date().toISOString().slice(0,10) })
  }

  const asistenciaPromedio = encuentros.length > 0 ? Math.round(encuentros.reduce((s,e)=>s+(e.presentes||0),0)/encuentros.length) : 0
  const gastos = presupuesto.filter(p=>p.tipo==='gasto').reduce((s,p)=>s+p.monto,0)
  const ingresos = presupuesto.filter(p=>p.tipo==='ingreso').reduce((s,p)=>s+p.monto,0)
  const costoPorJoven = participantes.length > 0 ? Math.round(gastos / participantes.length) : 0

  const fhParts = (formH.fecha || '').split('-')
  const fhAnio = fhParts[0] || ''
  const fhMes  = fhParts[1] || ''
  const fhDia  = fhParts[2] || ''
  function setFechaHito(a, m, d) {
    setFormH(prev => ({ ...prev, fecha: [a, m, d].filter(Boolean).join('-') }))
  }

  const input = { fontSize:12, padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', width:'100%' }
  const btnPrimary = { fontSize:11, padding:'4px 12px', borderRadius:6, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }
  const btnSec = { fontSize:11, padding:'4px 12px', borderRadius:6, border:'0.5px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer' }

  const egresadosCamada = camadas.find(c => c.nombre === 'Egresados')
  const camadasSinEgresados = camadas.filter(c => c.nombre !== 'Egresados')
  const camadasVis = camadasSinEgresados

  useEffect(() => {
    setTabPrincipal(tabExterno)
    if (tabExterno !== 'egresados') setSeleccionada(null)
  }, [tabExterno])

  useEffect(() => {
    if (tabExterno === 'egresados' && camadas.length > 0) {
      const ec = camadas.find(c => c.nombre === 'Egresados')
      if (ec) setSeleccionada(ec)
    }
  }, [tabExterno, camadas])

  const formCamada = (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:14 }}>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>{editCamada ? `Editar: ${editCamada.nombre}` : 'Nueva camada'}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Nombre</label><input style={input} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Sede</label><input style={input} value={form.sede} onChange={e=>setForm(f=>({...f,sede:e.target.value}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>País</label><input style={input} value={form.pais} onChange={e=>setForm(f=>({...f,pais:e.target.value}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Año</label><input style={input} type="number" value={form.anio} onChange={e=>setForm(f=>({...f,anio:parseInt(e.target.value)}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Fecha inicio</label><input style={input} type="date" value={form.fecha_inicio_real} onChange={e=>setForm(f=>({...f,fecha_inicio_real:e.target.value,mes_inicio:e.target.value.slice(0,7),anio:parseInt(e.target.value.slice(0,4))}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Fecha fin</label><input style={input} type="date" value={form.fecha_fin_real} onChange={e=>setForm(f=>({...f,fecha_fin_real:e.target.value,mes_fin:e.target.value.slice(0,7)}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Estado</label>
          <select style={input} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
            {Object.entries(ESTADO_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Jóvenes reales</label><input style={input} type="number" value={form.participantes_reales} onChange={e=>setForm(f=>({...f,participantes_reales:parseInt(e.target.value)||0}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Jóvenes esperados</label><input style={input} type="number" value={form.participantes_esperados} onChange={e=>setForm(f=>({...f,participantes_esperados:parseInt(e.target.value)||0}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Escuelas</label><input style={input} type="number" value={form.cantidad_escuelas} onChange={e=>setForm(f=>({...f,cantidad_escuelas:parseInt(e.target.value)||0}))} /></div>
        <div><label style={{fontSize:11,color:'var(--text3)'}}>Días de programa</label><input style={input} type="number" value={form.cantidad_dias} onChange={e=>setForm(f=>({...f,cantidad_dias:parseInt(e.target.value)||0}))} /></div>
      </div>
      <div style={{marginBottom:8}}><label style={{fontSize:11,color:'var(--text3)'}}>Descripción</label><textarea style={{...input,height:60}} value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} /></div>
      <div style={{display:'flex',gap:8}}><button style={btnPrimary} onClick={guardarCamada}>Guardar</button><button style={btnSec} onClick={()=>setShowForm(false)}>Cancelar</button></div>
    </div>
  )

  return (
    <div style={{ display: seleccionada ? 'block' : undefined }}>

      {!seleccionada && tabPrincipal === 'camadas' && (
        <>
          {showForm && formCamada}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {camadasVis.map(c => (
            <TarjetaCamada key={c.id} c={c}
              onSeleccionar={() => setSeleccionada(c)}
              onEditar={() => { setEditCamada(c); setShowForm(true) }}
              onEliminar={async () => { if(window.confirm('¿Eliminar camada?')){ await api.del(`/api/ndc/camadas/${c.id}`); setCamadas(await api.get('/api/ndc/camadas')) }}}
            />
          ))}
          <div onClick={() => { setEditCamada(null); setForm({ nombre:'', sede:'Mar del Plata', pais:'Argentina', anio: new Date().getFullYear(), mes_inicio:'', mes_fin:'', estado:'en_curso', descripcion:'', participantes_esperados:30, cantidad_escuelas:0, cantidad_dias:0, participantes_reales:0, fecha_inicio_real:'', fecha_fin_real:'' }); setShowForm(true) }} style={{ background:'var(--bg3)', border:'1.5px dashed var(--border)', borderRadius:12, padding:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, color:'var(--text3)', fontSize:13 }}>
            + Nueva camada
          </div>
          </div>{/* cierre grid */}
        </>
      )}

      {seleccionada && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <button onClick={() => { if (tabExterno === 'egresados') { onSalirEgresados?.() } else { setSeleccionada(null) } }} style={btnSec}>← Volver</button>
            <button onClick={() => { setEditCamada(seleccionada); setSeleccionada(null); setShowForm(true); setTabPrincipal('camadas') }} style={{ ...btnSec, display:'flex', alignItems:'center', gap:4 }}>✏️ Editar camada</button>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <h3 style={{ fontSize:18, fontWeight:700, margin:0, display:'flex', alignItems:'center', gap:8 }}><span style={{ fontSize:20 }}>{bandera(seleccionada.pais)}</span> {seleccionada.nombre}</h3>
              <div style={{ fontSize:12, color:'var(--text3)' }}>{seleccionada.sede === 'Mar del Plata' ? '🦭' : bandera(seleccionada.pais)} {seleccionada.sede}, {seleccionada.pais} · {seleccionada.anio}</div>
              <div style={{ marginTop:3, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ color:'var(--text3)' }}>📍</span>
                {lugarEdit
                  ? <input autoFocus value={lugarVal}
                      onChange={e=>setLugarVal(e.target.value)}
                      onBlur={guardarLugar}
                      onKeyDown={e=>{ if(e.key==='Enter') guardarLugar(); if(e.key==='Escape') setLugarEdit(false) }}
                      placeholder="Nombre del espacio…"
                      style={{ fontSize:12, border:'1px solid var(--border2)', borderRadius:4, padding:'1px 7px', background:'var(--bg3)', color:'var(--text)', width:200 }} />
                  : <span onClick={()=>{ setLugarVal(seleccionada.lugar||''); setLugarEdit(true) }}
                      title="Click para editar sede"
                      style={{ cursor:'pointer', color: seleccionada.lugar?'var(--text2)':'var(--text3)', fontStyle: seleccionada.lugar?'normal':'italic' }}>
                      {seleccionada.lugar || '+ agregar sede'}
                    </span>
                }
              </div>
            </div>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:10, background:ESTADO_COLORS[seleccionada.estado]?.bg, color:ESTADO_COLORS[seleccionada.estado]?.color }}>{ESTADO_COLORS[seleccionada.estado]?.label}</span>
          </div>

          {/* Métricas */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:8, marginBottom:16 }}>
            {[
              [seleccionada.participantes_reales || participantes.length, 'Jóvenes'],
              [participantes.filter(p=>p.egresado).length || '—', 'Egresados'],
              [seleccionada.cantidad_escuelas || '—', 'Escuelas'],
              [seleccionada.cantidad_dias || '—', 'Días'],
            ].map(([v,l]) => (
              <div key={l} className="metric">
                <div className="metric-label">{l}</div>
                <div style={{ fontSize:18, fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* SubTabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:16, flexWrap:'wrap' }}>
            {[['participantes','👥 Participantes'],['escuelas','🏫 Escuelas'],['hitos','🎨 Hitos'],['presupuesto','💰 Presupuesto']].map(([id,label]) => (
              <button key={id} onClick={()=>setSubTab(id)} style={{ padding:'7px 16px', fontSize:12, fontWeight:subTab===id?600:400, border:'none', borderBottom:subTab===id?'2px solid #1a1a2e':'2px solid transparent', background:'none', cursor:'pointer', color:subTab===id?'var(--text)':'var(--text3)', marginBottom:-1 }}>{label}</button>
            ))}
          </div>

          {/* Participantes */}
          {subTab === 'participantes' && (
            <div>
              <div style={{ background:'var(--bg3)', borderRadius:8, marginBottom:12, overflow:'hidden' }}>
                <div onClick={()=>{ setFormPAbierto(v=>!v) }}
                  style={{ fontSize:11, fontWeight:600, padding:'10px 12px', color:'var(--text3)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', userSelect:'none' }}>
                  <span>+ Agregar participante</span>
                  <span style={{ fontSize:10 }}>{formPAbierto ? '▲' : '▼'}</span>
                </div>
                {formPAbierto && <div style={{ padding:'0 12px 12px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:6 }}>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Apodo</label><input style={input} value={formP.apodo} onChange={e=>setFormP(f=>({...f,apodo:e.target.value}))} placeholder="Ninfa, Cosmos…" /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Nombre</label><input style={input} value={formP.nombre} onChange={e=>setFormP(f=>({...f,nombre:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Apellido</label><input style={input} value={formP.apellido} onChange={e=>setFormP(f=>({...f,apellido:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>DNI</label><input style={input} value={formP.dni} onChange={e=>setFormP(f=>({...f,dni:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Edad</label><input style={input} type="number" value={formP.edad} onChange={e=>setFormP(f=>({...f,edad:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Escuela</label><input style={input} value={formP.escuela} onChange={e=>setFormP(f=>({...f,escuela:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Tutor nombre</label><input style={input} value={formP.padre_madre} onChange={e=>setFormP(f=>({...f,padre_madre:e.target.value,responsable:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Tutor celular</label><input style={input} value={formP.contacto_responsable} onChange={e=>setFormP(f=>({...f,contacto_responsable:e.target.value}))} placeholder="223..." /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Tutor mail</label><input style={input} value={formP.tutor_mail} onChange={e=>setFormP(f=>({...f,tutor_mail:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Teléfono propio</label><input style={input} value={formP.telefono} onChange={e=>setFormP(f=>({...f,telefono:e.target.value}))} /></div>
                  <div><label style={{fontSize:10,color:'var(--text3)'}}>Email propio</label><input style={input} value={formP.email} onChange={e=>setFormP(f=>({...f,email:e.target.value}))} /></div>
                </div>
                <div style={{marginBottom:6}}><label style={{fontSize:10,color:'var(--text3)'}}>Testimonio</label><textarea style={{...input,height:44}} value={formP.testimonio} onChange={e=>setFormP(f=>({...f,testimonio:e.target.value}))} /></div>
                <div style={{marginBottom:6}}><label style={{fontSize:10,color:'var(--text3)'}}>Comentario interno</label><textarea style={{...input,height:44}} value={formP.comentario} onChange={e=>setFormP(f=>({...f,comentario:e.target.value}))} placeholder="Notas internas sobre este participante…" /></div>
                <div style={{display:'flex',gap:6}}>
                  <button style={btnPrimary} onClick={()=>{ guardarParticipante(); setFormPAbierto(false) }}>+ Agregar</button>
                </div>
                </div>}
              </div>

              {/* Buscador */}
              {participantes.length > 0 && (
                <div style={{ position:'relative', marginBottom:6 }}>
                  <i className="ti ti-search" style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:13, pointerEvents:'none' }} />
                  <input
                    value={busquedaP ?? ''}
                    onChange={e => setBusquedaP(e.target.value)}
                    placeholder="Buscar participante…"
                    style={{ width:'100%', boxSizing:'border-box', paddingLeft:30, paddingRight: busquedaP ? 28 : 10, paddingTop:7, paddingBottom:7, borderRadius:8, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:13, outline:'none' }}
                  />
                  {busquedaP && (
                    <button onClick={() => setBusquedaP('')} style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:14, lineHeight:1, padding:2 }}>×</button>
                  )}
                </div>
              )}

              {/* Lista de participantes: egresados primero */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {[...participantes].sort((a,b) => (b.egresado||0)-(a.egresado||0) || (a.apellido||'').localeCompare(b.apellido||'')).filter(p => {
                  if (!busquedaP) return true
                  const q = busquedaP.toLowerCase()
                  return (p.apodo||'').toLowerCase().includes(q) || (p.nombre||'').toLowerCase().includes(q) || (p.apellido||'').toLowerCase().includes(q)
                }).map(p => {
                  const isEditing = editParticipante?.id === p.id
                  return (
                  <React.Fragment key={p.id}>
                    <div style={{ background:'var(--bg2)', border:`1px solid ${isEditing?'var(--border2)':p.egresado?'#3B6D11':'var(--border)'}`, borderRadius: isEditing ? '8px 8px 0 0' : 8, padding:'10px 14px', display:'flex', gap:12, alignItems:'flex-start' }}>
                      <FotoParticipante participante={p} onFotoChange={foto_url => setParticipantes(ps => ps.map(x => x.id === p.id ? {...x, foto_url} : x))} />
                      {/* Izquierda: info del participante */}
                      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
                        <div style={{ fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                          {apodoEditId === p.id
                            ? <input autoFocus value={apodoVal} onChange={e=>setApodoVal(e.target.value)}
                                onBlur={()=>guardarApodo(p)}
                                onKeyDown={e=>{ if(e.key==='Enter') guardarApodo(p); if(e.key==='Escape') setApodoEditId(null) }}
                                style={{ fontSize:13, fontWeight:600, border:'1px solid var(--border2)', borderRadius:4, padding:'1px 6px', width:120, background:'var(--bg3)', color:'var(--text)' }} />
                            : <span onClick={()=>{ setApodoEditId(p.id); setApodoVal(p.apodo||'') }}
                                title="Click para editar apodo"
                                style={{ cursor:'pointer', minWidth:60, color: p.apodo ? 'var(--text)' : 'var(--text3)', fontStyle: p.apodo ? 'normal' : 'italic', fontSize: p.apodo ? 13 : 11 }}>
                                {p.apodo || '+ apodo'}
                              </span>
                          }
                          {(p.nombre || p.apellido) && <span style={{ fontWeight:400, color:'var(--text3)', fontSize:12 }}>{p.nombre} {p.apellido}</span>}
                          {p.egresado ? <span style={{ fontSize:10, background:'#EAF3DE', color:'#1A4D00', padding:'1px 7px', borderRadius:8, fontWeight:600 }}>🎓 Egresado</span> : null}
                        </div>
                        {(p.dni || p.edad) && <div style={{ fontSize:11, color:'var(--text3)' }}>{p.dni && `DNI ${p.dni}`}{p.dni && p.edad && ' · '}{p.edad && `${p.edad}a`}</div>}
                        {p.escuela && <div style={{ fontSize:11, color:'var(--text3)' }}>🏫 {p.escuela}</div>}
                        {(p.telefono || p.email) && <div style={{ fontSize:11, color:'var(--text3)' }}>{p.telefono && `📱 ${p.telefono}`}{p.telefono && p.email && ' · '}{p.email && `✉️ ${p.email}`}</div>}
                        {p.testimonio && <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', marginTop:2 }}>"{p.testimonio.slice(0,100)}{p.testimonio.length>100?'…':''}"</div>}
                        {p.comentario && <div style={{ fontSize:11, color:'var(--amber)', background:'var(--amber-bg,#2a2000)', borderRadius:4, padding:'2px 7px', marginTop:2, display:'inline-block' }}>💬 {p.comentario.slice(0,120)}{p.comentario.length>120?'…':''}</div>}
                        <div style={{ display:'flex', gap:6, marginTop:4, alignItems:'center' }}>
                          <button onClick={()=>toggleEgresado(p)} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:`1px solid ${p.egresado?'#3B6D11':'var(--border2)'}`, background: p.egresado?'#EAF3DE':'transparent', color: p.egresado?'#1A4D00':'var(--text3)', cursor:'pointer' }}>
                            {p.egresado ? '🎓 Egresado' : '○ Terminó'}
                          </button>
                          <button onClick={() => {
                            if (isEditing) { setEditParticipante(null); return }
                            setEditParticipante(p)
                            setFormP({ apodo:p.apodo||'', nombre:p.nombre||'', apellido:p.apellido||'', dni:p.dni||'', edad:p.edad||'', escuela:p.escuela||'', padre_madre:p.padre_madre||'', responsable:p.responsable||'', contacto_responsable:p.contacto_responsable||'', tutor_mail:p.tutor_mail||'', telefono:p.telefono||'', email:p.email||'', testimonio:p.testimonio||'', comentario:p.comentario||'' })
                            setFormPAbierto(false)
                          }} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color: isEditing ? 'var(--text)' : 'var(--text3)', fontWeight: isEditing ? 600 : 400}}>
                            {isEditing ? '✏️ Editando' : '✏️ Editar'}
                          </button>
                          <button onClick={async()=>{ if(window.confirm('¿Eliminar?')){ await api.del(`/api/ndc/participantes/${p.id}`); setParticipantes(await api.get(`/api/ndc/participantes?camada_id=${seleccionada.id}`)) }}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#991a1a'}}>🗑️</button>
                        </div>
                      </div>
                      {/* Derecha: responsable */}
                      {(p.padre_madre || p.responsable || p.contacto_responsable || p.tutor_mail) && (
                        <div style={{ borderLeft:'1px solid var(--border)', paddingLeft:10, minWidth:140, maxWidth:200 }}>
                          <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4, textAlign:'right' }}>Responsable</div>
                          <div style={{ fontSize:11, color:'var(--text2)', display:'flex', flexDirection:'column', gap:2, alignItems:'flex-end' }}>
                            {(p.padre_madre || p.responsable) && <span>👤 {p.padre_madre || p.responsable}</span>}
                            {p.contacto_responsable && <span>📞 {p.contacto_responsable}</span>}
                            {p.tutor_mail && <span>✉️ {p.tutor_mail}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Form de edición inline, debajo de la tarjeta */}
                    {isEditing && (
                      <div ref={el => el && el.scrollIntoView({behavior:'smooth', block:'nearest'})}
                        style={{ background:'var(--bg3)', border:'1px solid var(--border2)', borderTop:'none', borderRadius:'0 0 8px 8px', padding:'12px 14px' }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'var(--text3)', marginBottom:10 }}>Editando datos de {editParticipante.apodo || editParticipante.nombre}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:6 }}>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Apodo</label><input style={input} value={formP.apodo} onChange={e=>setFormP(f=>({...f,apodo:e.target.value}))} placeholder="Ninfa, Cosmos…" /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Nombre</label><input style={input} value={formP.nombre} onChange={e=>setFormP(f=>({...f,nombre:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Apellido</label><input style={input} value={formP.apellido} onChange={e=>setFormP(f=>({...f,apellido:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>DNI</label><input style={input} value={formP.dni} onChange={e=>setFormP(f=>({...f,dni:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Edad</label><input style={input} type="number" value={formP.edad} onChange={e=>setFormP(f=>({...f,edad:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Escuela</label><input style={input} value={formP.escuela} onChange={e=>setFormP(f=>({...f,escuela:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Tutor nombre</label><input style={input} value={formP.padre_madre} onChange={e=>setFormP(f=>({...f,padre_madre:e.target.value,responsable:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Tutor celular</label><input style={input} value={formP.contacto_responsable} onChange={e=>setFormP(f=>({...f,contacto_responsable:e.target.value}))} placeholder="223..." /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Tutor mail</label><input style={input} value={formP.tutor_mail} onChange={e=>setFormP(f=>({...f,tutor_mail:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Teléfono propio</label><input style={input} value={formP.telefono} onChange={e=>setFormP(f=>({...f,telefono:e.target.value}))} /></div>
                          <div><label style={{fontSize:10,color:'var(--text3)'}}>Email propio</label><input style={input} value={formP.email} onChange={e=>setFormP(f=>({...f,email:e.target.value}))} /></div>
                        </div>
                        <div style={{marginBottom:6}}><label style={{fontSize:10,color:'var(--text3)'}}>Testimonio</label><textarea style={{...input,height:44}} value={formP.testimonio} onChange={e=>setFormP(f=>({...f,testimonio:e.target.value}))} /></div>
                        <div style={{marginBottom:6}}><label style={{fontSize:10,color:'var(--text3)'}}>Comentario interno</label><textarea style={{...input,height:44}} value={formP.comentario} onChange={e=>setFormP(f=>({...f,comentario:e.target.value}))} placeholder="Notas internas sobre este participante…" /></div>
                        <div style={{display:'flex',gap:6}}>
                          <button style={btnPrimary} onClick={guardarParticipante}>Guardar cambios</button>
                          <button style={btnSec} onClick={()=>{ setEditParticipante(null); setFormP({ apodo:'', nombre:'', apellido:'', dni:'', edad:'', escuela:'', padre_madre:'', responsable:'', contacto_responsable:'', tutor_mail:'', telefono:'', email:'', testimonio:'', comentario:'' }) }}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                  )
                })}
              </div>
            </div>
          )}

          {/* Escuelas */}
          {subTab === 'escuelas' && (
            <div>
              {participantes.some(p=>p.escuela) && (
                <div style={{ marginBottom:10, display:'flex', alignItems:'center', gap:10 }}>
                  <button style={btnSec} onClick={importarEscuelas}>
                    ↓ Importar desde participantes ({[...new Set(participantes.map(p=>p.escuela).filter(Boolean))].length} escuelas)
                  </button>
                </div>
              )}
              <div style={{ background:'var(--bg3)', borderRadius:8, marginBottom:12, overflow:'hidden' }}>
                <div onClick={()=>{ if(!editEscuela) setFormEsAbierto(v=>!v) }}
                  style={{ fontSize:11, fontWeight:600, padding:'10px 12px', color:'var(--text3)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor: editEscuela?'default':'pointer', userSelect:'none' }}>
                  <span>{editEscuela ? `✏️ Editando: ${editEscuela.nombre}` : '+ Agregar escuela'}</span>
                  {!editEscuela && <span style={{ fontSize:10 }}>{formEsAbierto ? '▲' : '▼'}</span>}
                </div>
                {(formEsAbierto || editEscuela) && <div style={{ padding:'0 12px 12px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:6 }}>
                    <div style={{gridColumn:'1/-1'}}><label style={{fontSize:10,color:'var(--text3)'}}>Nombre *</label><input style={input} value={formEs.nombre} onChange={e=>setFormEs(f=>({...f,nombre:e.target.value}))} placeholder="Nombre de la institución" /></div>
                    <div><label style={{fontSize:10,color:'var(--text3)'}}>Localidad</label><input style={input} value={formEs.localidad} onChange={e=>setFormEs(f=>({...f,localidad:e.target.value}))} /></div>
                    <div style={{gridColumn:'2/-1'}}><label style={{fontSize:10,color:'var(--text3)'}}>Dirección</label><input style={input} value={formEs.direccion} onChange={e=>setFormEs(f=>({...f,direccion:e.target.value}))} /></div>
                    <div><label style={{fontSize:10,color:'var(--text3)'}}>Referente</label><input style={input} value={formEs.referente_nombre} onChange={e=>setFormEs(f=>({...f,referente_nombre:e.target.value}))} /></div>
                    <div><label style={{fontSize:10,color:'var(--text3)'}}>Tel referente</label><input style={input} value={formEs.referente_tel} onChange={e=>setFormEs(f=>({...f,referente_tel:e.target.value}))} /></div>
                    <div><label style={{fontSize:10,color:'var(--text3)'}}>Email referente</label><input style={input} value={formEs.referente_email} onChange={e=>setFormEs(f=>({...f,referente_email:e.target.value}))} /></div>
                    <div style={{gridColumn:'1/-1'}}><label style={{fontSize:10,color:'var(--text3)'}}>Notas</label><input style={input} value={formEs.notas} onChange={e=>setFormEs(f=>({...f,notas:e.target.value}))} /></div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button style={btnPrimary} onClick={()=>{ guardarEscuela(); setFormEsAbierto(false) }} disabled={!formEs.nombre}>{editEscuela ? 'Guardar cambios' : '+ Agregar'}</button>
                    {editEscuela && <button style={btnSec} onClick={()=>{ setEditEscuela(null); setFormEs({ nombre:'', direccion:'', localidad:'', referente_nombre:'', referente_tel:'', referente_email:'', notas:'' }) }}>Cancelar</button>}
                  </div>
                </div>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {escuelas.length === 0 && <div style={{ fontSize:12, color:'var(--text3)' }}>Sin escuelas cargadas aún.</div>}
                {escuelas.map(e => (
                  <div key={e.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:2, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                      <span>{e.nombre}</span>
                      <a href={`https://www.google.com/maps/search/${encodeURIComponent(e.nombre + ', ' + (e.localidad || seleccionada.sede))}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:11, color:'#1a73e8', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}
                        title="Ver en Google Maps">
                        🗺️ Maps
                      </a>
                    </div>
                    {e.localidad && <div style={{ fontSize:11, color:'var(--text3)' }}>📍 {e.localidad}{e.direccion ? ` · ${e.direccion}` : ''}</div>}
                    {e.referente_nombre && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                      Ref: {e.referente_nombre}
                      {e.referente_tel && ` · 📞 ${e.referente_tel}`}
                      {e.referente_email && ` · ✉️ ${e.referente_email}`}
                    </div>}
                    {e.notas && <div style={{ fontSize:11, color:'var(--text3)', fontStyle:'italic', marginTop:2 }}>{e.notas}</div>}
                    <div style={{ display:'flex', gap:6, marginTop:6 }}>
                      <button onClick={() => { setEditEscuela(e); setFormEsAbierto(true); setFormEs({ nombre:e.nombre, direccion:e.direccion||'', localidad:e.localidad||'', referente_nombre:e.referente_nombre||'', referente_tel:e.referente_tel||'', referente_email:e.referente_email||'', notas:e.notas||'' }); window.scrollTo({top:0,behavior:'smooth'}) }} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--text3)'}}>✏️ Editar</button>
                      <button onClick={async()=>{ if(window.confirm('¿Eliminar escuela?')){ await api.del(`/api/ndc/escuelas/${e.id}`); setEscuelas(await api.get(`/api/ndc/escuelas?camada_id=${seleccionada.id}`)) }}} style={{background:'none',border:'none',cursor:'pointer',fontSize:13,color:'#991a1a'}}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Encuentros */}
          {subTab === 'encuentros' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 80px 1fr auto', gap:8, marginBottom:12, background:'var(--bg3)', padding:12, borderRadius:8, alignItems:'end' }}>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Fecha</label><input style={input} type="date" value={formE.fecha} onChange={e=>setFormE(f=>({...f,fecha:e.target.value}))} /></div>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Actividad</label><input style={input} value={formE.actividad} onChange={e=>setFormE(f=>({...f,actividad:e.target.value}))} /></div>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Presentes</label><input style={input} type="number" value={formE.presentes} onChange={e=>setFormE(f=>({...f,presentes:parseInt(e.target.value)||0}))} /></div>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Notas</label><input style={input} value={formE.notas} onChange={e=>setFormE(f=>({...f,notas:e.target.value}))} /></div>
                <button style={btnPrimary} onClick={guardarEncuentro}>+ Agregar</button>
              </div>
              <div>
                {encuentros.map(e => (
                  <div key={e.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'7px 0', borderBottom:'0.5px solid var(--border)', fontSize:12 }}>
                    <span style={{ color:'var(--text3)', minWidth:80 }}>{e.fecha?.split('-').reverse().join('/')}</span>
                    <span style={{ flex:1 }}>{e.actividad}</span>
                    <span style={{ background:'var(--bg3)', padding:'1px 8px', borderRadius:10, fontWeight:500 }}>{e.presentes} presentes</span>
                    {e.notas && <span style={{ color:'var(--text3)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.notas}</span>}
                    <button onClick={async()=>{ await api.del(`/api/ndc/encuentros/${e.id}`); setEncuentros(await api.get(`/api/ndc/encuentros?camada_id=${seleccionada.id}`)) }} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:13}}>🗑️</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hitos */}
          {subTab === 'hitos' && (
            <div>
              <div style={{ background:'var(--bg3)', borderRadius:8, marginBottom:12, overflow:'hidden' }}>
                <div onClick={()=>{ if(!editHito) setFormHAbierto(v=>!v) }}
                  style={{ fontSize:11, fontWeight:600, padding:'10px 12px', color:'var(--text3)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor: editHito?'default':'pointer', userSelect:'none' }}>
                  <span>{editHito ? `✏️ Editando: ${editHito.titulo}` : '+ Agregar hito'}</span>
                  {!editHito && <span style={{ fontSize:10 }}>{formHAbierto ? '▲' : '▼'}</span>}
                </div>
                {(formHAbierto || editHito) && <div style={{ padding:'0 12px 12px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr', gap:8, marginBottom:8 }}>
                    <div><label style={{fontSize:11,color:'var(--text3)'}}>Tipo</label>
                      <select style={input} value={formH.tipo} onChange={e=>setFormH(f=>({...f,tipo:e.target.value}))}>
                        <option value="mural_interno">🏠 Mural Interno</option>
                        <option value="mural_vp">🏙️ Mural Vía Pública</option>
                        <option value="mural">🎨 Mural (general)</option>
                        <option value="exposicion">🖼️ Exposición</option>
                        <option value="evento">📅 Evento</option>
                        <option value="otro">📌 Otro</option>
                      </select>
                    </div>
                    <div style={{gridColumn:'2/-1'}}><label style={{fontSize:11,color:'var(--text3)'}}>Título</label><input style={input} value={formH.titulo} onChange={e=>setFormH(f=>({...f,titulo:e.target.value}))} /></div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'60px 80px 60px 1fr', gap:8, marginBottom:8, alignItems:'end' }}>
                    <div><label style={{fontSize:11,color:'var(--text3)'}}>Año</label><input style={input} value={fhAnio} maxLength={4} placeholder="2024" onChange={e=>setFechaHito(e.target.value,fhMes,fhDia)} /></div>
                    <div><label style={{fontSize:11,color:'var(--text3)'}}>Mes</label>
                      <select style={input} value={fhMes} onChange={e=>setFechaHito(fhAnio,e.target.value,fhDia)}>
                        <option value="">—</option>
                        {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m,i)=>
                          <option key={m} value={m}>{['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i]}</option>
                        )}
                      </select>
                    </div>
                    <div><label style={{fontSize:11,color:'var(--text3)'}}>Día <span style={{fontSize:9,color:'var(--text3)'}}>(opc)</span></label><input style={input} value={fhDia} maxLength={2} placeholder="—" onChange={e=>setFechaHito(fhAnio,fhMes,e.target.value)} /></div>
                    <div><label style={{fontSize:11,color:'var(--text3)'}}>Lugar</label><input style={input} value={formH.lugar} onChange={e=>setFormH(f=>({...f,lugar:e.target.value}))} /></div>
                  </div>
                  <div style={{marginBottom:8}}><label style={{fontSize:11,color:'var(--text3)'}}>Descripción</label><textarea style={{...input,height:40}} value={formH.descripcion} onChange={e=>setFormH(f=>({...f,descripcion:e.target.value}))} /></div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button style={btnPrimary} onClick={()=>{ guardarHito(); setFormHAbierto(false) }} disabled={!formH.titulo}>{editHito ? 'Guardar cambios' : '+ Agregar'}</button>
                    {editHito && <button style={btnSec} onClick={()=>{ setEditHito(null); setFormH({ tipo:'mural', titulo:'', fecha:'', lugar:'', descripcion:'' }) }}>Cancelar</button>}
                  </div>
                </div>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
                {hitos.map(h => (
                  <TarjetaHito key={h.id} hito={h}
                    onEdit={() => { setEditHito(h); setFormHAbierto(true); setFormH({ tipo:h.tipo, titulo:h.titulo, fecha:h.fecha||'', lugar:h.lugar||'', descripcion:h.descripcion||'' }); window.scrollTo({top:0,behavior:'smooth'}) }}
                    onDelete={async () => {
                      if (!window.confirm('¿Eliminar este hito?')) return
                      await api.del(`/api/ndc/hitos/${h.id}`)
                      setHitos(await api.get(`/api/ndc/hitos?camada_id=${seleccionada.id}`))
                    }} onImagenChange={async (imagen_url) => {
                      setHitos(hs => hs.map(x => x.id === h.id ? {...x, imagen_url} : x))
                    }} />
                ))}
              </div>
            </div>
          )}

          {/* Presupuesto */}
          {subTab === 'presupuesto' && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'120px 1fr 100px 80px 100px auto', gap:8, marginBottom:12, background:'var(--bg3)', padding:12, borderRadius:8, alignItems:'end' }}>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Categoría</label>
                  <select style={input} value={formPres.categoria} onChange={e=>setFormPres(f=>({...f,categoria:e.target.value}))}>
                    {['materiales','facilitadores','espacio','comunicacion','transporte','alimentacion','otro'].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Descripción</label><input style={input} value={formPres.descripcion} onChange={e=>setFormPres(f=>({...f,descripcion:e.target.value}))} /></div>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Monto $</label><input style={input} type="number" value={formPres.monto} onChange={e=>setFormPres(f=>({...f,monto:parseFloat(e.target.value)||0}))} /></div>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Tipo</label>
                  <select style={input} value={formPres.tipo} onChange={e=>setFormPres(f=>({...f,tipo:e.target.value}))}>
                    <option value="gasto">Gasto</option><option value="ingreso">Ingreso</option>
                  </select>
                </div>
                <div><label style={{fontSize:11,color:'var(--text3)'}}>Fecha</label><input style={input} type="date" value={formPres.fecha} onChange={e=>setFormPres(f=>({...f,fecha:e.target.value}))} /></div>
                <button style={btnPrimary} onClick={guardarPres}>+ Agregar</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                <div className="metric"><div className="metric-label">Total gastos</div><div style={{fontSize:18,fontWeight:600,color:'#791F1F'}}>${fmt(gastos)}</div></div>
                <div className="metric"><div className="metric-label">Total ingresos</div><div style={{fontSize:18,fontWeight:600,color:'#1A4D00'}}>${fmt(ingresos)}</div></div>
              </div>
              {presupuesto.map(p => (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'0.5px solid var(--border)', fontSize:12 }}>
                  <span style={{ fontSize:10, color:'var(--text3)', minWidth:70 }}>{p.fecha?.split('-').reverse().join('/')}</span>
                  <span style={{ background:'var(--bg3)', padding:'1px 6px', borderRadius:8, fontSize:10 }}>{p.categoria}</span>
                  <span style={{ flex:1 }}>{p.descripcion}</span>
                  <span style={{ fontWeight:600, color: p.tipo==='gasto'?'#791F1F':'#1A4D00' }}>{p.tipo==='ingreso'?'+':'-'}${fmt(p.monto)}</span>
                  <button onClick={async()=>{ await api.del(`/api/ndc/presupuesto/${p.id}`); setPresupuesto(await api.get(`/api/ndc/presupuesto?camada_id=${seleccionada.id}`)) }} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:13}}>🗑️</button>
                </div>
              ))}
            </div>
          )}

          {/* Egresados */}
          {subTab === 'egresados' && (
            <div>
              <div style={{ background:'var(--bg3)', borderRadius:8, padding:12, marginBottom:16 }}>
                <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12 }}>
                  Los egresados son participantes que completaron el programa con más del 80% de asistencia.
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {[
                    [participantes.filter(p=>p.activo).length, 'En curso'],
                    [participantes.filter(p=>!p.activo && p.total_encuentros > 0).length, 'Egresados'],
                    [participantes.length > 0 ? Math.round(participantes.filter(p=>!p.activo).length/participantes.length*100)+'%' : '-', 'Tasa egreso'],
                  ].map(([v,l]) => (
                    <div key={l} className="metric">
                      <div className="metric-label">{l}</div>
                      <div style={{ fontSize:20, fontWeight:600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
                {participantes.map(p => {
                  const asistPct = p.total_encuentros > 0 ? Math.round(p.asistencias/p.total_encuentros*100) : null
                  const egresado = asistPct !== null && asistPct >= 80
                  return (
                    <div key={p.id} style={{ background:'var(--bg2)', border:`1px solid ${egresado?'#3B6D11':'var(--border)'}`, borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <div style={{ fontSize:14, fontWeight:600 }}>{p.apodo}</div>
                        {egresado && <span style={{ fontSize:10, background:'#EAF3DE', color:'#1A4D00', padding:'1px 6px', borderRadius:8 }}>🎓 Egresado</span>}
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:6 }}>
                        <div>
                          <div style={{ fontSize:9, color:'var(--text3)' }}>Asistencias</div>
                          <input type="number" defaultValue={p.asistencias}
                            onBlur={async e => { await api.put(`/api/ndc/participantes/${p.id}`, {...p, asistencias: parseInt(e.target.value)||0}); setParticipantes(await api.get(`/api/ndc/participantes?camada_id=${seleccionada.id}`)) }}
                            style={{ width:'100%', fontSize:13, fontWeight:600, border:'0.5px solid var(--border)', borderRadius:4, padding:'2px 4px', background:'var(--bg3)', color:'var(--text)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize:9, color:'var(--text3)' }}>Total encuentros</div>
                          <input type="number" defaultValue={p.total_encuentros}
                            onBlur={async e => { await api.put(`/api/ndc/participantes/${p.id}`, {...p, total_encuentros: parseInt(e.target.value)||0}); setParticipantes(await api.get(`/api/ndc/participantes?camada_id=${seleccionada.id}`)) }}
                            style={{ width:'100%', fontSize:13, fontWeight:600, border:'0.5px solid var(--border)', borderRadius:4, padding:'2px 4px', background:'var(--bg3)', color:'var(--text)' }} />
                        </div>
                      </div>
                      {asistPct !== null && (
                        <div>
                          <div style={{ height:4, background:'var(--border)', borderRadius:2 }}>
                            <div style={{ height:'100%', width:`${Math.min(asistPct,100)}%`, background: asistPct>=80?'#3B6D11':'#F0A832', borderRadius:2 }} />
                          </div>
                          <div style={{ fontSize:9, color:'var(--text3)', textAlign:'right', marginTop:2 }}>{asistPct}%</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Donantes ─────────────────────────────────────────────────────────────────
const FORM_VACIO_D = { nombre:'', tipo:'donante', contacto:'', aporte_tipo:'monetario', monto:0, estado:'activo', proximo_contacto:'', notas:'' }

function SeccionDonantes() {
  const [donantes, setDonantes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO_D)
  const [expandido, setExpandido] = useState(null)

  useEffect(() => { api.get('/api/ndc/donantes').then(setDonantes) }, [])

  useEffect(() => {
    if (editando) {
      setForm({
        nombre: editando.nombre || '',
        tipo: editando.tipo || 'donante',
        contacto: editando.contacto || '',
        aporte_tipo: editando.aporte_tipo || 'monetario',
        monto: editando.monto || 0,
        estado: editando.estado || 'activo',
        proximo_contacto: editando.proximo_contacto || '',
        notas: editando.notas || '',
      })
    } else {
      setForm(FORM_VACIO_D)
    }
  }, [editando])

  async function guardar() {
    if (!form.nombre.trim()) return
    if (editando) await api.put(`/api/ndc/donantes/${editando.id}`, form)
    else await api.post('/api/ndc/donantes', form)
    setDonantes(await api.get('/api/ndc/donantes'))
    setShowForm(false)
    setEditando(null)
  }

  function abrirEditar(d) { setEditando(d); setShowForm(true); setExpandido(null) }
  function abrirNuevo() { setEditando(null); setShowForm(true) }
  function cancelar() { setShowForm(false); setEditando(null) }

  const input = { fontSize:12, padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', width:'100%' }
  const TIPO_COLOR = { donante:'#185FA5', sponsor:'#633806', institucion:'#1A4D00', voluntario:'#4A2D8C' }
  const ESTADO_D = { activo:'#1A4D00', inactivo:'#999', prospecto:'#F0A832', perdido:'#791F1F' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, flex:1, marginRight:12 }}>
          {[['donante','Donantes'],['sponsor','Sponsors'],['institucion','Instituciones'],['voluntario','Voluntarios']].map(([tipo,label]) => (
            <div key={tipo} className="metric">
              <div className="metric-label">{label}</div>
              <div style={{ fontSize:20, fontWeight:600 }}>{donantes.filter(d=>d.tipo===tipo).length}</div>
            </div>
          ))}
        </div>
        <button onClick={abrirNuevo}
          style={{ fontSize:12, padding:'8px 16px', borderRadius:8, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer', whiteSpace:'nowrap', alignSelf:'center' }}>
          + Agregar
        </button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:14, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:8 }}>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Nombre</label><input style={input} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Tipo</label>
              <select style={input} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                <option value="donante">Donante</option><option value="sponsor">Sponsor</option><option value="institucion">Institución</option><option value="voluntario">Voluntario</option>
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Contacto</label><input style={input} value={form.contacto} onChange={e=>setForm(f=>({...f,contacto:e.target.value}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Tipo de aporte</label>
              <select style={input} value={form.aporte_tipo} onChange={e=>setForm(f=>({...f,aporte_tipo:e.target.value}))}>
                <option value="monetario">Monetario</option><option value="especie">En especie</option><option value="servicios">Servicios</option><option value="espacio">Espacio</option>
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Monto $</label><input style={input} type="number" value={form.monto} onChange={e=>setForm(f=>({...f,monto:parseFloat(e.target.value)||0}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Estado</label>
              <select style={input} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                <option value="activo">Activo</option><option value="prospecto">Prospecto</option><option value="inactivo">Inactivo</option><option value="perdido">Perdido</option>
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Próximo contacto</label><input style={input} type="date" value={form.proximo_contacto} onChange={e=>setForm(f=>({...f,proximo_contacto:e.target.value}))} /></div>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:11,color:'var(--text3)'}}>Notas</label><textarea style={{...input,height:50}} value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} /></div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{fontSize:12,fontWeight:600,marginRight:8}}>{editando ? `Editando: ${editando.nombre}` : 'Nuevo donante'}</div>
            <button onClick={guardar} style={{ fontSize:11, padding:'4px 12px', borderRadius:6, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }}>{editando?'Guardar cambios':'Agregar'}</button>
            <button onClick={cancelar} style={{ fontSize:11, padding:'4px 12px', borderRadius:6, border:'0.5px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {donantes.map(d => (
          <div key={d.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            {/* Fila resumen - clickeable */}
            <div onClick={() => setExpandido(expandido===d.id ? null : d.id)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', fontSize:12, cursor:'pointer' }}>
              <span style={{ fontSize:18 }}>{expandido===d.id ? '▾' : '▸'}</span>
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:'#e8e8f0', color:TIPO_COLOR[d.tipo]||'#333', fontWeight:600, flexShrink:0 }}>{d.tipo}</span>
              <span style={{ fontWeight:600, flex:1 }}>{d.nombre}</span>
              {d.monto > 0 && <span style={{ fontWeight:500, color:'#1A4D00' }}>${fmt(d.monto)}</span>}
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:8, color:ESTADO_D[d.estado]||'#999', border:`1px solid ${ESTADO_D[d.estado]||'#999'}`, flexShrink:0 }}>{d.estado}</span>
              {d.proximo_contacto && <span style={{ fontSize:10, color:'#633806', flexShrink:0 }}>📅 {d.proximo_contacto?.split('-').reverse().join('/')}</span>}
            </div>
            {/* Detalle expandido */}
            {expandido === d.id && (
              <div style={{ padding:'0 12px 12px 12px', borderTop:'0.5px solid var(--border)', paddingTop:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
                  <div><div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>CONTACTO</div><div style={{fontSize:12}}>{d.contacto || '—'}</div></div>
                  <div><div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>TIPO DE APORTE</div><div style={{fontSize:12}}>{d.aporte_tipo || '—'}</div></div>
                  <div><div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>MONTO</div><div style={{fontSize:12,fontWeight:600}}>{d.monto > 0 ? '$'+fmt(d.monto) : '—'}</div></div>
                  <div><div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>PRÓXIMO CONTACTO</div><div style={{fontSize:12}}>{d.proximo_contacto ? d.proximo_contacto.split('-').reverse().join('/') : '—'}</div></div>
                  <div><div style={{fontSize:9,color:'var(--text3)',marginBottom:2}}>ESTADO</div><div style={{fontSize:12}}>{d.estado || '—'}</div></div>
                </div>
                {d.notas && <div style={{fontSize:12,color:'var(--text3)',fontStyle:'italic',marginBottom:10,padding:'6px 8px',background:'var(--bg3)',borderRadius:6}}>"{d.notas}"</div>}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>abrirEditar(d)} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'0.5px solid var(--border)',background:'transparent',color:'var(--text)',cursor:'pointer'}}>✏️ Editar</button>
                  <button onClick={async()=>{ if(window.confirm('¿Eliminar?')){ await api.del(`/api/ndc/donantes/${d.id}`); setDonantes(await api.get('/api/ndc/donantes')) }}} style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'none',background:'transparent',color:'#991a1a',cursor:'pointer'}}>🗑️ Eliminar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Comunicación ─────────────────────────────────────────────────────────────
function SeccionComunicacion() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ titulo:'', canal:'instagram', estado:'idea', fecha_planificada:'', responsable:'', contenido:'' })

  useEffect(() => { api.get('/api/ndc/comunicacion').then(setItems) }, [])

  async function guardar() {
    if (editId) await api.put(`/api/ndc/comunicacion/${editId}`, form)
    else await api.post('/api/ndc/comunicacion', form)
    setItems(await api.get('/api/ndc/comunicacion'))
    setShowForm(false); setEditId(null)
  }

  const input = { fontSize:12, padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', width:'100%' }
  const ESTADOS_COM = { idea:'💡 Idea', borrador:'📝 Borrador', listo:'✅ Listo', publicado:'🚀 Publicado', descartado:'❌ Descartado' }

  const porEstado = (est) => items.filter(i=>i.estado===est)

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {Object.entries(ESTADOS_COM).map(([k,v]) => (
            <span key={k} style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:'var(--bg3)', color:'var(--text3)' }}>
              {v} <strong>{porEstado(k).length}</strong>
            </span>
          ))}
        </div>
        <button onClick={()=>{ setShowForm(true); setEditId(null); setForm({ titulo:'', canal:'instagram', estado:'idea', fecha_planificada:'', responsable:'', contenido:'' }) }}
          style={{ fontSize:12, padding:'6px 14px', borderRadius:8, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }}>
          + Agregar
        </button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:14, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:8 }}>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:11,color:'var(--text3)'}}>Título / Idea</label><input style={input} value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Canal</label>
              <select style={input} value={form.canal} onChange={e=>setForm(f=>({...f,canal:e.target.value}))}>
                {['instagram','facebook','prensa','email','whatsapp','otro'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Estado</label>
              <select style={input} value={form.estado} onChange={e=>setForm(f=>({...f,estado:e.target.value}))}>
                {Object.entries(ESTADOS_COM).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Fecha</label><input style={input} type="date" value={form.fecha_planificada} onChange={e=>setForm(f=>({...f,fecha_planificada:e.target.value}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Responsable</label><input style={input} value={form.responsable} onChange={e=>setForm(f=>({...f,responsable:e.target.value}))} /></div>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:11,color:'var(--text3)'}}>Contenido / Copy</label><textarea style={{...input,height:70}} value={form.contenido} onChange={e=>setForm(f=>({...f,contenido:e.target.value}))} /></div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{fontSize:12,fontWeight:600,marginRight:8}}>{editando ? `Editando: ${editando.nombre}` : 'Nuevo donante'}</div>
            <button onClick={guardar} style={{ fontSize:11, padding:'4px 12px', borderRadius:6, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }}>{editando?'Guardar cambios':'Agregar'}</button>
            <button onClick={cancelar} style={{ fontSize:11, padding:'4px 12px', borderRadius:6, border:'0.5px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Kanban simple */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        {[['idea','borrador'],['listo'],['publicado','descartado']].map((grupos, col) => (
          <div key={col} style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {grupos.map(est => (
              <div key={est}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{ESTADOS_COM[est]}</div>
                {porEstado(est).map(item => (
                  <div key={item.id} style={{ background:'var(--bg2)', border:`1px solid var(--border)`, borderLeft:`3px solid ${CANAL_COLORS[item.canal]||'#999'}`, borderRadius:6, padding:'8px 10px', marginBottom:5 }}>
                    <div style={{ fontSize:12, fontWeight:500, marginBottom:2 }}>{item.titulo}</div>
                    <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                      <span style={{ fontSize:10, color:CANAL_COLORS[item.canal]||'#999' }}>{item.canal}</span>
                      {item.fecha_planificada && <span style={{ fontSize:10, color:'var(--text3)' }}>📅 {item.fecha_planificada?.split('-').reverse().join('/')}</span>}
                      {item.responsable && <span style={{ fontSize:10, color:'var(--text3)' }}>👤 {item.responsable}</span>}
                    </div>
                    <div style={{ display:'flex', gap:4, marginTop:4 }}>
                      <button onClick={()=>{ setEditId(item.id); setForm({titulo:item.titulo,canal:item.canal,estado:item.estado,fecha_planificada:item.fecha_planificada||'',responsable:item.responsable||'',contenido:item.contenido||''}); setShowForm(true) }} style={{background:'none',border:'none',cursor:'pointer',fontSize:12}}>✏️</button>
                      <button onClick={async()=>{ await api.del(`/api/ndc/comunicacion/${item.id}`); setItems(await api.get('/api/ndc/comunicacion')) }} style={{background:'none',border:'none',cursor:'pointer',color:'#991a1a',fontSize:12}}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Materiales ───────────────────────────────────────────────────────────────
const CATEGORIAS_MAT = ['pintura','didáctico','herramientas','alimentación','mobiliario','transporte','comunicación','otro']
const MONEDAS = [
  { code:'ARS', simbolo:'$', nombre:'Peso argentino' },
  { code:'UYU', simbolo:'$U', nombre:'Peso uruguayo' },
  { code:'USD', simbolo:'U$S', nombre:'Dólar' },
  { code:'CLP', simbolo:'$', nombre:'Peso chileno' },
  { code:'BRL', simbolo:'R$', nombre:'Real brasileño' },
]
const FORM_VACIO_MAT = { nombre:'', categoria:'pintura', unidad:'unidad', cantidad:1, costo_unitario:0, moneda:'ARS', es_donacion:false, proveedor:'', url:'', se_repone:true, seccion_id:null }
const BASE = ''

const ICONOS_SECCION = [
  // Arte y creación
  '🎨','🖌️','🖍️','✏️','🖊️','🖋️','🖼️','🎭','🎪','🎬',
  '📷','🎞️','🎯','🧩','🎲','🏆','🥇','🌀','💫','✨',
  // Herramientas y materiales
  '📦','🧰','🪣','🪜','🔧','🔨','⚒️','🛠️','✂️','🪚',
  '🔩','🪛','🧲','📌','📍','📐','📏','🔑','🧱','🪨',
  // Organización
  '📋','📝','📁','🗂️','📂','📊','📈','📚','📖','📜',
  '🏷️','💬','📣','📢','🔔','💡','🔍','🔮','📱','💻',
  // Naturaleza
  '🌱','🌿','🌸','🌺','🌻','🌊','🌈','☀️','🌙','⭐',
  '🔥','💧','⚡','❄️','🌍','🏔️','🌅','🌄','🍃','🌾',
  // Comida y bebida
  '🍕','🍔','🌮','🍜','🍣','🥗','🍎','🍊','🍋','🍇',
  '🍰','🎂','🧁','🍩','🍫','🍬','☕','🧃','🥤','🍵',
  '🥩','🍗','🥚','🧀','🥕','🌽','🍞','🥐','🫙','🥢',
  // Personas y comunidad
  '👥','🤝','💪','🙌','✊','🫂','👶','🧒','👦','👧',
  // Colores y formas
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🟥','🟨',
  '🟩','🟦','🟪','⬛','⬜','🔶','🔷','🔸','🔹','🔺',
]

function SelectorIcono({ value, onChange }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} style={{
        fontSize:20, padding:'4px 8px', borderRadius:6, border:'0.5px solid var(--border)',
        background:'var(--bg3)', cursor:'pointer', lineHeight:1, display:'block', flexShrink:0,
      }}>{value || '📦'}</button>
      {abierto && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}
          onMouseDown={() => setAbierto(false)}>
          <div onMouseDown={e => e.stopPropagation()} style={{
            background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:12,
            padding:10, boxShadow:'0 16px 40px rgba(0,0,0,0.25)',
            display:'grid', gridTemplateColumns:'repeat(10, 36px)', gap:2,
          }}>
            {ICONOS_SECCION.map(ic => (
              <button key={ic} type="button" onClick={() => { onChange(ic); setAbierto(false) }} style={{
                width:36, height:36, fontSize:20, padding:0, border:'none', borderRadius:6, cursor:'pointer',
                background: value === ic ? 'var(--bg3)' : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'background .1s', overflow:'hidden',
              }}>{ic}</button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function FotoMaterial({ foto, nombre, itemId, onFotoChange }) {
  const [hover, setHover] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('foto', file)
    const r = await authFetch(`${BASE}/api/ndc/materiales/items/${itemId}/foto`, { method:'POST', body:fd })
    const data = await r.json()
    if (data.ok) onFotoChange(data.foto)
    setUploading(false)
  }

  async function borrarFoto(e) {
    e.stopPropagation()
    await authFetch(`${BASE}/api/ndc/materiales/items/${itemId}/foto`, { method:'DELETE' })
    onFotoChange(null)
  }

  if (!foto) return (
    <div style={{ position:'relative', width:28, height:28, flexShrink:0 }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      <div onClick={() => inputRef.current?.click()}
        style={{ width:28, height:28, borderRadius:6, border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'var(--text3)', background:'var(--bg3)' }}
        title="Agregar foto">
        {uploading ? '⏳' : '📷'}
      </div>
    </div>
  )

  return (
    <div style={{ position:'relative', width:28, height:28, flexShrink:0 }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      <img src={`${BASE}/uploads/materiales/${foto}`} alt={nombre}
        onClick={() => inputRef.current?.click()}
        style={{ width:28, height:28, borderRadius:6, objectFit:'cover', cursor:'pointer', border:'1px solid var(--border)' }} />
      {hover && (
        <div style={{ position:'fixed', zIndex:9999, background:'#fff', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', padding:8, left:'50%', top:'30%', transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
          <img src={`${BASE}/uploads/materiales/${foto}`} alt={nombre}
            style={{ width:200, height:200, objectFit:'contain', borderRadius:8, display:'block' }} />
          <div style={{ fontSize:11, color:'#666', textAlign:'center', marginTop:4 }}>{nombre}</div>
        </div>
      )}
      {hover && (
        <button onClick={borrarFoto}
          style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'#991a1a', color:'#fff', border:'none', cursor:'pointer', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'auto' }}>
          ×
        </button>
      )}
    </div>
  )
}

function FilaMaterial({ item, estadoByCamada, camadaId, monedaCamada, secciones, onEdit, onDelete, onToggleRepuesto, onRecargar, onDragStart, onDragOver, onDragEnd, isDragging, seleccionado, onToggleSelect }) {
  const estado = estadoByCamada[item.id]
  const repuesto = !!estado?.repuesto

  function toLocal(item) {
    if (!item.costo_unitario || item.es_donacion) return null
    if (item.moneda === monedaCamada.moneda_local) return item.costo_unitario * item.cantidad
    if (item.moneda === 'USD') return item.costo_unitario * item.cantidad * monedaCamada.tc_usd
    return item.costo_unitario * item.cantidad
  }
  function toUSD(item) {
    if (!item.costo_unitario || item.es_donacion) return null
    if (item.moneda === 'USD') return item.costo_unitario * item.cantidad
    if (monedaCamada.tc_usd > 0) return (item.costo_unitario * item.cantidad) / monedaCamada.tc_usd
    return null
  }

  const localTotal = toLocal(item)
  const usdTotal = toUSD(item)

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, item.id)}
      onDragOver={e => onDragOver(e, item.id)}
      onDragEnd={onDragEnd}
      style={{
        display:'grid', gridTemplateColumns:'18px 20px 28px 1fr 80px 70px 90px 75px 70px 60px',
        gap:6, padding:'7px 8px', borderRadius:6, fontSize:12, alignItems:'center',
        background: seleccionado ? '#eef3ff' : isDragging ? 'var(--bg3)' : repuesto ? '#f0f7ea' : 'var(--bg2)',
        border: `1px solid ${seleccionado ? '#4285f4' : repuesto ? '#c8e6b0' : 'var(--border)'}`,
        opacity: isDragging ? 0.4 : 1,
        cursor:'grab', marginBottom:2,
      }}>
      <input type="checkbox" checked={!!seleccionado} onChange={() => onToggleSelect(item.id)}
        onClick={e => e.stopPropagation()}
        style={{ width:'auto', margin:0, cursor:'pointer' }} />
      <div style={{ color:'var(--text3)', fontSize:14, textAlign:'center', cursor:'grab' }}>⠿</div>
      <FotoMaterial foto={item.foto} nombre={item.nombre} itemId={item.id} onFotoChange={onRecargar} />
      <div>
        <div style={{ fontWeight:500, display:'flex', gap:5, alignItems:'center', flexWrap:'wrap' }}>
          {repuesto && <span style={{ fontSize:10, color:'#3B6D11' }}>✓</span>}
          {item.nombre}
          {!!item.es_donacion && <span style={{ fontSize:9, background:'#FFF3DC', color:'#8B5E00', padding:'1px 5px', borderRadius:8 }}>🎁</span>}
          {!item.se_repone && <span style={{ fontSize:9, color:'var(--text3)' }}>permanente</span>}
        </div>
        {item.proveedor && <div style={{ fontSize:10, color:'var(--text3)' }}>📦 {item.proveedor}</div>}
        {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize:10, color:'#185FA5' }}>ver →</a>}
      </div>
      <div><span style={{ fontSize:10, background:'var(--bg3)', padding:'1px 5px', borderRadius:8 }}>{item.categoria}</span></div>
      <div style={{ color:'var(--text3)' }}>{item.cantidad} {item.unidad}</div>
      <div style={{ color:'var(--text3)' }}>
        {item.es_donacion ? <span style={{ color:'#8B5E00' }}>donación</span>
          : item.costo_unitario > 0 ? `${MONEDAS.find(m=>m.code===item.moneda)?.simbolo||'$'}${fmt(item.costo_unitario)}`
          : '—'}
      </div>
      <div style={{ fontWeight:500 }}>{item.es_donacion ? '—' : localTotal!==null ? `${monedaCamada.simbolo}${fmt(localTotal)}` : '—'}</div>
      <div style={{ color:'var(--text3)' }}>{item.es_donacion ? '—' : usdTotal!==null ? `U$S${fmt(usdTotal)}` : '—'}</div>
      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
        <input type="checkbox" checked={repuesto} onChange={() => camadaId && onToggleRepuesto(item)}
          style={{ cursor:'pointer', accentColor:'#3B6D11' }} title="Marcar repuesto" />
        <button onClick={() => onEdit(item)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:0 }}>✏️</button>
        <button onClick={() => onDelete(item.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#991a1a', padding:0 }}>🗑️</button>
      </div>
    </div>
  )
}

function SeccionBloque({ seccion, items, estadoByCamada, camadaId, monedaCamada, secciones, todasSecciones, onEdit, onDelete, onToggleRepuesto, onRecargar, onMoverASeccion, onEditSeccion, onOcultarSeccion, onDragStartItem, onDragOverItem, onDragEndItem, draggingItem, seleccionados, onToggleSelect, onSubir, onBajar, esUltima, esPrimera }) {
  const [colapsada, setColapsada] = useState(false)
  const [showSecEdit, setShowSecEdit] = useState(false)
  const [secForm, setSecForm] = useState({ nombre: seccion.nombre, icono: seccion.icono })
  const [dragOver, setDragOver] = useState(false)

  const input = { fontSize:12, padding:'4px 7px', borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)' }

  function onDragOverSeccion(e) {
    e.preventDefault()
    setDragOver(true)
  }
  function onDragLeave() { setDragOver(false) }
  function onDropSeccion(e) {
    e.preventDefault()
    setDragOver(false)
    const itemId = parseInt(e.dataTransfer.getData('itemId'))
    if (itemId) onMoverASeccion(itemId, seccion.id)
  }

  return (
    <div style={{ marginBottom:12 }}
      onDragOver={onDragOverSeccion}
      onDragLeave={onDragLeave}
      onDrop={onDropSeccion}>
      {/* Header sección */}
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
        background: dragOver ? '#e8f0fe' : 'var(--bg2)',
        border: `1px solid ${dragOver ? '#4285f4' : 'var(--border)'}`,
        borderRadius: colapsada ? 8 : '8px 8px 0 0',
        cursor:'pointer', userSelect:'none',
        transition:'all .15s',
      }}>
        <span onClick={() => setColapsada(c=>!c)} style={{ fontSize:11, color:'var(--text3)', width:16, flexShrink:0 }}>
          {colapsada ? '▶' : '▼'}
        </span>
        <span onClick={() => setColapsada(c=>!c)} style={{ flex:1, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>{seccion.icono}</span>
          <span style={{ fontSize:13, fontWeight:600 }}>{seccion.nombre}</span>
          <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>({items.length} items)</span>
          {dragOver && <span style={{ fontSize:11, color:'#4285f4' }}>← soltar acá</span>}
        </span>
        <div style={{ display:'flex', gap:2, alignItems:'center' }}>
          {!esPrimera && (
            <button onClick={e=>{e.stopPropagation();onSubir && onSubir(seccion)}}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, padding:'2px 4px', color:'var(--text3)' }} title="Subir">▲</button>
          )}
          {!esUltima && (
            <button onClick={e=>{e.stopPropagation();onBajar && onBajar(seccion)}}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, padding:'2px 4px', color:'var(--text3)' }} title="Bajar">▼</button>
          )}
          {!seccion.es_propia && (
            <button onClick={e=>{e.stopPropagation();setShowSecEdit(s=>!s)}}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:'2px 4px' }} title="Editar sección">✏️</button>
          )}
          {seccion.id && (
            <button onClick={e=>{e.stopPropagation(); if(window.confirm('¿Ocultar esta sección para esta camada?')) onOcultarSeccion(seccion)}}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, padding:'2px 4px', color:'var(--text3)' }} title="Ocultar en esta camada">👁️</button>
          )}
        </div>
      </div>

      {/* Form editar sección */}
      {showSecEdit && (
        <div style={{ display:'flex', gap:8, padding:'8px 12px', background:'var(--bg3)', borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)', alignItems:'center' }}>
          <SelectorIcono value={secForm.icono} onChange={ic => setSecForm(f=>({...f,icono:ic}))} />
          <input style={{ ...input, flex:1 }} value={secForm.nombre} onChange={e=>setSecForm(f=>({...f,nombre:e.target.value}))} />
          <button onClick={async()=>{ await onEditSeccion(seccion, secForm); setShowSecEdit(false) }}
            style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }}>Guardar</button>
          <button onClick={()=>setShowSecEdit(false)}
            style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'0.5px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer' }}>Cancelar</button>
        </div>
      )}

      {/* Items */}
      {!colapsada && (
        <div style={{ border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 8px 8px', padding:'6px 8px', background: dragOver ? '#f8fbff' : 'transparent', minHeight:40 }}>
          {items.length === 0 && (
            <div style={{ textAlign:'center', padding:'12px 0', color:'var(--text3)', fontSize:12 }}>
              {dragOver ? '🎯 Soltar acá para mover a esta sección' : 'Sin items — arrastrá items acá'}
            </div>
          )}
          {/* Encabezado columnas */}
          {items.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'18px 20px 28px 1fr 80px 70px 90px 75px 70px 60px', gap:6, padding:'2px 8px', fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>
              <div></div><div></div><div></div><div>Material</div><div>Categ.</div><div>Cant.</div><div>Costo unit.</div><div>{monedaCamada.moneda_local}</div><div>USD</div><div></div>
            </div>
          )}
          {items.map(item => (
            <FilaMaterial key={item.id}
              item={item}
              estadoByCamada={estadoByCamada}
              camadaId={camadaId}
              monedaCamada={monedaCamada}
              secciones={todasSecciones}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleRepuesto={onToggleRepuesto}
              onRecargar={onRecargar}
              onDragStart={(e, id) => { e.dataTransfer.setData('itemId', id); onDragStartItem(e, id) }}
              onDragOver={onDragOverItem}
              onDragEnd={onDragEndItem}
              isDragging={draggingItem === item.id}
              seleccionado={seleccionados?.has(item.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SeccionMateriales() {
  const [items, setItems] = useState([])
  const [secciones, setSecciones] = useState([])
  const [camadas, setCamadas] = useState([])
  const [camadaId, setCamadaId] = useState(null)
  const [estadoByCamada, setEstadoByCamada] = useState({})
  const [monedaCamada, setMonedaCamada] = useState({ moneda_local:'ARS', simbolo:'$', tc_usd:1 })
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(FORM_VACIO_MAT)
  const [filtroCat, setFiltroCat] = useState('todas')
  const [showMonedaConfig, setShowMonedaConfig] = useState(false)
  const [tcInput, setTcInput] = useState('')
  const [showNuevaSeccion, setShowNuevaSeccion] = useState(false)
  const [nuevaSecForm, setNuevaSecForm] = useState({ nombre:'', icono:'📦' })
  const [draggingItem, setDraggingItem] = useState(null)
  const [draggingOrder, setDraggingOrder] = useState(null)
  const [seleccionados, setSeleccionados] = useState(new Set())

  useEffect(() => {
    Promise.all([
      api.get('/api/ndc/materiales/items'),
      api.get('/api/ndc/camadas')
    ]).then(([its, cams]) => {
      setItems(its)
      setCamadas(cams)
      if (cams.length > 0) setCamadaId(cams[0].id)
    })
  }, [])

  useEffect(() => {
    if (!camadaId) return
    Promise.all([
      api.get(`/api/ndc/materiales/estado/${camadaId}`),
      api.get(`/api/ndc/materiales/moneda/${camadaId}`),
      api.get(`/api/ndc/secciones?camada_id=${camadaId}`),
    ]).then(([est, mon, secs]) => {
      const map = {}; est.forEach(e => { map[e.item_id] = e }); setEstadoByCamada(map)
      setMonedaCamada(mon); setTcInput(mon.tc_usd)
      setSecciones(secs)
    })
  }, [camadaId])

  async function recargarItems() { setItems(await api.get('/api/ndc/materiales/items')) }
  async function recargarSecciones() { setSecciones(await api.get(`/api/ndc/secciones?camada_id=${camadaId}`)) }

  async function guardar() {
    if (!form.nombre.trim()) return
    if (editId) await api.put(`/api/ndc/materiales/items/${editId}`, form)
    else await api.post('/api/ndc/materiales/items', form)
    await recargarItems()
    setShowForm(false); setEditId(null); setForm(FORM_VACIO_MAT)
  }

  function abrirEditar(item) {
    setEditId(item.id)
    setForm({ nombre:item.nombre, categoria:item.categoria, unidad:item.unidad, cantidad:item.cantidad, costo_unitario:item.costo_unitario, moneda:item.moneda, es_donacion:!!item.es_donacion, proveedor:item.proveedor||'', url:item.url||'', se_repone:!!item.se_repone, seccion_id:item.seccion_id||null })
    setShowForm(true)
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar?')) return
    await api.del(`/api/ndc/materiales/items/${id}`)
    await recargarItems()
  }

  async function toggleRepuesto(item) {
    const actual = estadoByCamada[item.id]
    const nuevo = actual ? !actual.repuesto : true
    await api.post('/api/ndc/materiales/estado', { item_id:item.id, camada_id:camadaId, repuesto:nuevo, cantidad_real:actual?.cantidad_real||null, notas:actual?.notas||'' })
    const data = await api.get(`/api/ndc/materiales/estado/${camadaId}`)
    const map = {}; data.forEach(e => { map[e.item_id] = e }); setEstadoByCamada(map)
  }

  async function moverASeccion(itemId, seccionId) {
    await authFetch(`${BASE}/api/ndc/materiales/items/${itemId}/seccion`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ seccion_id: seccionId }) })
    await recargarItems()
  }

  async function guardarMoneda() {
    const monedaInfo = MONEDAS.find(m => m.code === monedaCamada.moneda_local) || MONEDAS[0]
    await api.put(`/api/ndc/materiales/moneda/${camadaId}`, { moneda_local:monedaCamada.moneda_local, simbolo:monedaInfo.simbolo, tc_usd:parseFloat(tcInput)||1 })
    setMonedaCamada(m => ({ ...m, simbolo:monedaInfo.simbolo, tc_usd:parseFloat(tcInput)||1 }))
    setShowMonedaConfig(false)
  }

  async function crearSeccion() {
    if (!nuevaSecForm.nombre.trim()) return
    await api.post('/api/ndc/secciones', nuevaSecForm)
    await recargarSecciones()
    setShowNuevaSeccion(false)
    setNuevaSecForm({ nombre:'', icono:'📦' })
  }

  async function editarSeccion(seccion, form) {
    await api.put(`/api/ndc/secciones/${seccion.id}`, { ...seccion, ...form })
    await recargarSecciones()
  }

  async function moverSeccion(seccion, dir) {
    const idx = secciones.findIndex(s => s.id === seccion.id)
    const otro = secciones[idx + dir]
    if (!otro) return
    await api.put(`/api/ndc/secciones/${seccion.id}`, { ...seccion, orden: otro.orden })
    await api.put(`/api/ndc/secciones/${otro.id}`, { ...otro, orden: seccion.orden })
    await recargarSecciones()
  }

  async function convertirSinSeccion(form, itemsActuales) {
    if (!form.nombre.trim()) return
    const result = await api.post('/api/ndc/secciones', { nombre: form.nombre, icono: form.icono })
    for (const item of itemsActuales) {
      await authFetch(`${BASE}/api/ndc/materiales/items/${item.id}/seccion`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ seccion_id: result.id })
      })
    }
    await recargarSecciones()
    await recargarItems()
  }

  async function ocultarSeccion(seccion) {
    // Crear override de camada para ocultar
    await api.post('/api/ndc/secciones/camada', { camada_id:camadaId, seccion_id:seccion.id, oculta:true })
    await recargarSecciones()
  }

  function toggleSelect(id) {
    setSeleccionados(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function moverSeleccionados(seccionId) {
    for (const id of seleccionados) {
      await authFetch(`${BASE}/api/ndc/materiales/items/${id}/seccion`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ seccion_id: seccionId === 0 ? null : seccionId })
      })
    }
    setSeleccionados(new Set())
    await recargarItems()
  }

  // Drag dentro de sección (reordenar)
  function onDragStartItem(e, id) { setDraggingOrder(id); setDraggingItem(id) }
  function onDragOverItem(e, id) {
    e.preventDefault()
    if (!draggingOrder || draggingOrder === id) return
    const newItems = [...items]
    const fromIdx = newItems.findIndex(i => i.id === draggingOrder)
    const toIdx = newItems.findIndex(i => i.id === id)
    if (fromIdx < 0 || toIdx < 0) return
    const [moved] = newItems.splice(fromIdx, 1)
    newItems.splice(toIdx, 0, moved)
    setItems(newItems)
  }
  async function onDragEndItem() {
    setDraggingItem(null); setDraggingOrder(null)
    for (let i = 0; i < items.length; i++) {
      await authFetch(`${BASE}/api/ndc/materiales/items/${items[i].id}/orden`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orden:i }) })
    }
  }

  // Agrupar items por sección
  const filtrados = filtroCat === 'todas' ? items : items.filter(i => i.categoria === filtroCat)
  const seccionIds = secciones.map(s => s.id)
  const sinSeccion = filtrados.filter(i => !i.seccion_id || !seccionIds.includes(i.seccion_id))

  const totalLocal = filtrados.reduce((s,i) => {
    if (!i.costo_unitario || i.es_donacion) return s
    if (i.moneda === monedaCamada.moneda_local) return s + i.costo_unitario * i.cantidad
    if (i.moneda === 'USD') return s + i.costo_unitario * i.cantidad * monedaCamada.tc_usd
    return s + i.costo_unitario * i.cantidad
  }, 0)
  const totalUSD = filtrados.reduce((s,i) => {
    if (!i.costo_unitario || i.es_donacion) return s
    if (i.moneda === 'USD') return s + i.costo_unitario * i.cantidad
    if (monedaCamada.tc_usd > 0) return s + (i.costo_unitario * i.cantidad) / monedaCamada.tc_usd
    return s
  }, 0)
  const repuestosCount = filtrados.filter(i => estadoByCamada[i.id]?.repuesto).length
  const donacionCount = filtrados.filter(i => i.es_donacion).length

  const input = { fontSize:12, padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', width:'100%' }
  const btnPrimary = { fontSize:11, padding:'4px 12px', borderRadius:6, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }
  const btnSec = { fontSize:11, padding:'4px 12px', borderRadius:6, border:'0.5px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer' }

  const propsComunes = { estadoByCamada, camadaId, monedaCamada, todasSecciones:secciones, onEdit:abrirEditar, onDelete:eliminar, onToggleRepuesto:toggleRepuesto, onRecargar:recargarItems, onMoverASeccion:moverASeccion, onEditSeccion:editarSeccion, onOcultarSeccion:ocultarSeccion, onDragStartItem, onDragOverItem, onDragEndItem, draggingItem, seleccionados, onToggleSelect:toggleSelect }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200 }}>
          <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:3 }}>Estado para camada:</label>
          <select style={{ ...input, fontWeight:500 }} value={camadaId||''} onChange={e => setCamadaId(parseInt(e.target.value))}>
            {camadas.map(c => <option key={c.id} value={c.id}>{bandera(c.pais)} {c.nombre} — {c.sede}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'flex-end', flexWrap:'wrap' }}>
          <button onClick={() => setShowMonedaConfig(s=>!s)} style={{ ...btnSec, fontSize:12 }}>
            💱 {monedaCamada.moneda_local} · TC: {monedaCamada.simbolo}{fmt(monedaCamada.tc_usd)}/USD
          </button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(FORM_VACIO_MAT) }} style={{ ...btnPrimary, fontSize:12, padding:'6px 14px' }}>+ Item</button>
        </div>
      </div>

      {/* Config moneda */}
      {showMonedaConfig && (
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:12, marginBottom:14, display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:8, alignItems:'end' }}>
          <div>
            <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:3 }}>Moneda local</label>
            <select style={input} value={monedaCamada.moneda_local} onChange={e => setMonedaCamada(m => ({ ...m, moneda_local:e.target.value }))}>
              {MONEDAS.map(m => <option key={m.code} value={m.code}>{m.simbolo} {m.nombre} ({m.code})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text3)', display:'block', marginBottom:3 }}>1 USD = ? {monedaCamada.moneda_local}</label>
            <input style={input} type="number" value={tcInput} onChange={e => setTcInput(e.target.value)} />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={guardarMoneda} style={btnPrimary}>Guardar</button>
            <button onClick={() => setShowMonedaConfig(false)} style={btnSec}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Totales */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
        {[
          [items.length, 'Items totales'],
          [donacionCount, 'Por donación'],
          [`${repuestosCount}/${filtrados.length}`, 'Repuestos'],
          [`${monedaCamada.simbolo}${fmt(totalLocal)} · U$S${fmt(totalUSD)}`, 'Costo estimado'],
        ].map(([v,l]) => (
          <div key={l} className="metric">
            <div className="metric-label">{l}</div>
            <div style={{ fontSize:l==='Costo estimado'?11:18, fontWeight:600 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Filtro categoría */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {['todas', ...CATEGORIAS_MAT].map(cat => (
          <button key={cat} onClick={() => setFiltroCat(cat)} style={{
            fontSize:11, padding:'3px 10px', borderRadius:12,
            border: filtroCat===cat ? 'none' : '0.5px solid var(--border)',
            background: filtroCat===cat ? '#1a1a2e' : 'transparent',
            color: filtroCat===cat ? '#fff' : 'var(--text3)',
            cursor:'pointer', textTransform:'capitalize'
          }}>{cat}</button>
        ))}
      </div>

      {/* Form nuevo/editar item */}
      {showForm && (
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:14, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>{editId ? 'Editar material' : 'Nuevo material'}</div>
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8, marginBottom:8 }}>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Nombre *</label><input style={input} value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Categoría</label>
              <select style={input} value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>
                {CATEGORIAS_MAT.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Sección</label>
              <select style={input} value={form.seccion_id||''} onChange={e=>setForm(f=>({...f,seccion_id:e.target.value?parseInt(e.target.value):null}))}>
                <option value="">Sin sección</option>
                {secciones.map(s=><option key={s.id} value={s.id}>{s.icono} {s.nombre}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Unidad</label><input style={input} value={form.unidad} onChange={e=>setForm(f=>({...f,unidad:e.target.value}))} placeholder="lts, unidad, kg..." /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Cantidad</label><input style={input} type="number" value={form.cantidad} onChange={e=>setForm(f=>({...f,cantidad:parseFloat(e.target.value)||1}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Costo unitario</label><input style={input} type="number" value={form.costo_unitario} onChange={e=>setForm(f=>({...f,costo_unitario:parseFloat(e.target.value)||0}))} disabled={form.es_donacion} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Moneda</label>
              <select style={input} value={form.moneda} onChange={e=>setForm(f=>({...f,moneda:e.target.value}))} disabled={form.es_donacion}>
                {MONEDAS.map(m=><option key={m.code} value={m.code}>{m.simbolo} {m.code}</option>)}
              </select>
            </div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Proveedor</label><input style={input} value={form.proveedor} onChange={e=>setForm(f=>({...f,proveedor:e.target.value}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Link / URL</label><input style={input} value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} /></div>
          </div>
          <div style={{ display:'flex', gap:16, marginBottom:10 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer' }}>
              <input type="checkbox" checked={form.es_donacion} onChange={e=>setForm(f=>({...f,es_donacion:e.target.checked,costo_unitario:0}))} />
              🎁 Es donación
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer' }}>
              <input type="checkbox" checked={form.se_repone} onChange={e=>setForm(f=>({...f,se_repone:e.target.checked}))} />
              🔄 Se repone cada camada
            </label>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={guardar} style={btnPrimary}>Guardar</button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(FORM_VACIO_MAT) }} style={btnSec}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Barra de selección múltiple */}
      {seleccionados.size > 0 && (
        <div style={{ position:'sticky', top:0, zIndex:10, background:'#1a1a2e', color:'#fff', borderRadius:8, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:13, fontWeight:500 }}>{seleccionados.size} {seleccionados.size === 1 ? 'item seleccionado' : 'items seleccionados'}</span>
          <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>→ Mover a:</span>
          <select defaultValue="" onChange={e => e.target.value !== '' && moverSeleccionados(parseInt(e.target.value))}
            style={{ fontSize:12, padding:'4px 8px', borderRadius:6, border:'none', background:'rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer' }}>
            <option value="">Elegir sección...</option>
            {secciones.map(s => <option key={s.id} value={s.id}>{s.icono} {s.nombre}</option>)}
            <option value="0">Sin sección</option>
          </select>
          <button onClick={() => setSeleccionados(new Set())}
            style={{ fontSize:11, padding:'3px 10px', borderRadius:6, border:'none', background:'rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer', marginLeft:'auto' }}>
            Cancelar
          </button>
        </div>
      )}

      {/* Secciones */}
      {secciones.map((sec, idx) => (
        <SeccionBloque key={sec.id}
          seccion={sec}
          items={filtrados.filter(i => i.seccion_id === sec.id)}
          secciones={secciones}
          {...propsComunes}
          esPrimera={idx === 0}
          esUltima={idx === secciones.length - 1}
          onSubir={s => moverSeccion(s, -1)}
          onBajar={s => moverSeccion(s, 1)}
        />
      ))}

      {/* Sin sección */}
      {sinSeccion.length > 0 && (
        <SeccionBloque
          seccion={{ id:null, nombre:'Sin sección', icono:'📋', es_propia:false }}
          items={sinSeccion}
          secciones={secciones}
          {...propsComunes}
          onOcultarSeccion={()=>{}}
          onEditSeccion={(sec, form) => convertirSinSeccion(form, sinSeccion)}
        />
      )}

      {/* Agregar sección */}
      {showNuevaSeccion ? (
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'10px 12px', border:'1px dashed var(--border)', borderRadius:8 }}>
          <SelectorIcono value={nuevaSecForm.icono} onChange={ic => setNuevaSecForm(f=>({...f,icono:ic}))} />
          <input style={{ ...input, flex:1 }} value={nuevaSecForm.nombre} onChange={e=>setNuevaSecForm(f=>({...f,nombre:e.target.value}))} placeholder="Nombre de la sección..." autoFocus
            onKeyDown={e => { if (e.key === 'Enter') crearSeccion(); if (e.key === 'Escape') { setShowNuevaSeccion(false); setNuevaSecForm({ nombre:'', icono:'📦' }) } }} />
          <button onClick={crearSeccion} style={btnPrimary}>Crear</button>
          <button onClick={() => { setShowNuevaSeccion(false); setNuevaSecForm({ nombre:'', icono:'📦' }) }} style={btnSec}>Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setShowNuevaSeccion(true)} style={{
          width:'100%', padding:'10px', borderRadius:8, border:'1px dashed var(--border)',
          background:'transparent', color:'var(--text3)', cursor:'pointer', fontSize:13,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        }}>
          <span style={{ fontSize:18, lineHeight:1 }}>+</span> Nueva sección
        </button>
      )}
    </div>
  )
}

// ─── Material educativo ───────────────────────────────────────────────────────
function SeccionMaterial() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo:'', tipo:'documento', descripcion:'', url:'', publico:false })

  useEffect(() => { api.get('/api/ndc/material').then(setItems) }, [])

  async function guardar() {
    await api.post('/api/ndc/material', form)
    setItems(await api.get('/api/ndc/material'))
    setShowForm(false)
    setForm({ titulo:'', tipo:'documento', descripcion:'', url:'', publico:false })
  }

  const input = { fontSize:12, padding:'5px 8px', borderRadius:6, border:'0.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', width:'100%' }
  const TIPO_ICONO = { documento:'📄', guia:'📋', video:'🎬', imagen:'🖼️', presentacion:'📊', otro:'📎' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <button onClick={()=>setShowForm(s=>!s)} style={{ fontSize:12, padding:'6px 14px', borderRadius:8, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }}>+ Agregar material</button>
      </div>

      {showForm && (
        <div style={{ background:'var(--bg3)', borderRadius:8, padding:14, marginBottom:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:8, marginBottom:8 }}>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Título</label><input style={input} value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} /></div>
            <div><label style={{fontSize:11,color:'var(--text3)'}}>Tipo</label>
              <select style={input} value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                {Object.keys(TIPO_ICONO).map(t=><option key={t} value={t}>{TIPO_ICONO[t]} {t}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:11,color:'var(--text3)'}}>Descripción</label><textarea style={{...input,height:50}} value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} /></div>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:11,color:'var(--text3)'}}>URL (Google Drive, YouTube, etc.)</label><input style={input} value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} /></div>
            <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" checked={form.publico} onChange={e=>setForm(f=>({...f,publico:e.target.checked}))} id="publico" />
              <label htmlFor="publico" style={{fontSize:12}}>Material público (compartible externamente)</label>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={guardar} style={{ fontSize:11, padding:'4px 12px', borderRadius:6, border:'none', background:'#1a1a2e', color:'#fff', cursor:'pointer' }}>Guardar</button>
            <button onClick={()=>setShowForm(false)} style={{ fontSize:11, padding:'4px 12px', borderRadius:6, border:'0.5px solid var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:8 }}>
        {items.map(item => (
          <div key={item.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
              <div style={{ fontSize:20 }}>{TIPO_ICONO[item.tipo]||'📎'}</div>
              {item.publico ? <span style={{ fontSize:9, padding:'1px 6px', borderRadius:8, background:'#EAF3DE', color:'#1A4D00' }}>PÚBLICO</span> : <span style={{ fontSize:9, padding:'1px 6px', borderRadius:8, background:'#F1EFE8', color:'#5F5E5A' }}>INTERNO</span>}
            </div>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{item.titulo}</div>
            {item.descripcion && <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>{item.descripcion}</div>}
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#185FA5' }}>Abrir →</a>}
              <button onClick={async()=>{ if(window.confirm('¿Eliminar?')){ await api.del(`/api/ndc/material/${item.id}`); setItems(await api.get('/api/ndc/material')) }}} style={{background:'none',border:'none',cursor:'pointer',color:'#991a1a',fontSize:13,marginLeft:'auto'}}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
function BuscadorGlobal() {
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!q.trim()) { setResultados([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setBuscando(true)
      api.get(`/api/ndc/participantes?buscar=${encodeURIComponent(q.trim())}`)
        .then(r => { setResultados(r); setBuscando(false) })
        .catch(() => setBuscando(false))
    }, 280)
    return () => clearTimeout(timerRef.current)
  }, [q])

  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ position:'relative' }}>
        <i className="ti ti-search" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:15, pointerEvents:'none' }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar joven en todas las camadas…"
          style={{ width:'100%', boxSizing:'border-box', paddingLeft:34, paddingRight: q ? 32 : 12, paddingTop:10, paddingBottom:10, borderRadius:10, border:'1px solid var(--border2)', background:'var(--bg3)', color:'var(--text)', fontSize:14, outline:'none' }}
        />
        {q && (
          <button onClick={() => { setQ(''); setResultados([]) }} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16, lineHeight:1, padding:2 }}>×</button>
        )}
      </div>

      {q.trim() && (
        <div style={{ marginTop:8, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          {buscando && (
            <div style={{ padding:'12px 16px', fontSize:13, color:'var(--text3)' }}>Buscando…</div>
          )}
          {!buscando && resultados.length === 0 && (
            <div style={{ padding:'12px 16px', fontSize:13, color:'var(--text3)' }}>Sin resultados para "{q}"</div>
          )}
          {!buscando && resultados.map(p => (
            <div key={p.id} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>
                  {p.apodo && p.apodo !== p.nombre ? <><span>{p.apodo}</span> <span style={{ fontWeight:400, color:'var(--text3)', fontSize:12 }}>{p.nombre} {p.apellido}</span></> : <span>{p.nombre} {p.apellido}</span>}
                  {p.egresado ? <span style={{ marginLeft:6, fontSize:10, background:'#EAF3DE', color:'#1A4D00', padding:'1px 7px', borderRadius:8, fontWeight:600 }}>🎓 Egresado</span> : null}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2, display:'flex', gap:10, flexWrap:'wrap' }}>
                  {p.camada_nombre && <span>🌀 {p.camada_nombre} {p.camada_anio}</span>}
                  {p.escuela && <span>🏫 {p.escuela}</span>}
                  {p.dni && <span>DNI {p.dni}</span>}
                </div>
              </div>
              {(p.padre_madre || p.contacto_responsable) && (
                <div style={{ fontSize:11, color:'var(--text3)', textAlign:'right' }}>
                  {p.padre_madre && <div>👤 {p.padre_madre}</div>}
                  {p.contacto_responsable && <div>📞 {p.contacto_responsable}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NacerDelCaos({ user }) {
  const [tab, setTab] = useState('camadas')
  const [stats, setStats] = useState({})
  const [visibilidad, setVisibilidad] = useState([])
  const esAdmin = user?.rol === 'admin'

  useEffect(() => { api.get('/api/ndc/stats').then(setStats) }, [tab])
  useEffect(() => {
    api.get('/api/visibilidad').then(setVisibilidad).catch(() => {})
  }, [])

  function seccionBloqueada(id) {
    if (esAdmin) return false
    return !!visibilidad.find(v => v.seccion === id)?.bloqueada
  }

  const TODAS_TABS = [
    ['camadas', '🌀 Camadas'],
    ['egresados', '🎓 Egresados'],
    ['donantes', '🤝 Donantes'],
    ['materiales', '🎨 Materiales'],
    ['comunicacion', '📣 Comunicación'],
  ]

  const TABS = TODAS_TABS.filter(([id]) => {
    if (id === 'egresados') return !seccionBloqueada('camadas')
    return !seccionBloqueada(id)
  })

  // Si el tab activo fue bloqueado, volver al primero visible
  useEffect(() => {
    const ids = TABS.map(([id]) => id)
    if (!ids.includes(tab) && ids.length > 0) setTab(ids[0])
  }, [visibilidad])

  return (
    <div>
      <CuadroDinamico stats={stats} />

      <BuscadorGlobal />

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'9px 20px', fontSize:13, fontWeight: tab===id ? 600 : 400,
            border:'none', borderBottom: tab===id ? '2px solid #1a1a2e' : '2px solid transparent',
            background:'none', cursor:'pointer',
            color: tab===id ? 'var(--text)' : 'var(--text3)',
            marginBottom:-1, transition:'all .15s'
          }}>{label}</button>
        ))}
      </div>

      <div style={{display: (tab==='camadas'||tab==='egresados')?'block':'none'}}>
        <SeccionCamadas tabExterno={tab==='egresados'?'egresados':'camadas'} onSalirEgresados={()=>setTab('camadas')} />
      </div>
      <div style={{display: tab==='donantes'?'block':'none'}}><SeccionDonantes /></div>
      <div style={{display: tab==='materiales'?'block':'none'}}><SeccionMateriales /></div>
      <div style={{display: tab==='comunicacion'?'block':'none'}}><SeccionComunicacion /></div>
    </div>
  )
}
