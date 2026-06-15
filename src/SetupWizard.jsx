import { useState } from 'react'

const C = {
  navy:"#1B3F6B", blue:"#2E75B6", green:"#166534", greenBg:"#F0FDF4",
  red:"#991B1B", amber:"#854F0B",
  gray:"#64748B", border:"#E2E8F0", slate:"#334155", light:"#F8FAFC",
}

const MADORI = [
  { key:"1R",   label:"1R",   sqm:18, ref:6.0  },
  { key:"1K",   label:"1K",   sqm:25, ref:7.5  },
  { key:"1DK",  label:"1DK",  sqm:30, ref:8.5  },
  { key:"1LDK", label:"1LDK", sqm:40, ref:10.2 },
  { key:"2K",   label:"2K",   sqm:35, ref:9.0  },
  { key:"2DK",  label:"2DK",  sqm:45, ref:11.0 },
  { key:"2LDK", label:"2LDK", sqm:55, ref:13.5 },
  { key:"3DK",  label:"3DK",  sqm:60, ref:14.0 },
  { key:"3LDK", label:"3LDK", sqm:70, ref:16.0 },
]
const STRUCTURES = {
  wood:  { label:"木造",  life:22 },
  steel: { label:"軽鉄", life:27 },
  rc:    { label:"RC造", life:47 },
}
const AREA_DATA = {
  "世田谷区": { rent1K:7.7,  vacancy:6.5 },
  "渋谷区":   { rent1K:10.5, vacancy:5.2 },
  "新宿区":   { rent1K:8.8,  vacancy:6.0 },
  "港区":     { rent1K:14.5, vacancy:4.0 },
  "品川区":   { rent1K:8.2,  vacancy:6.8 },
}
const CITIES = Object.keys(AREA_DATA)

const fmtOku = v => Math.abs(v)>=10000 ? `${(v/10000).toFixed(2)}億` : `${Math.round(v).toLocaleString()}万`

// ── 共通UI部品 ──────────────────────────────────────────────────
const Req = () => (
  <span style={{fontSize:10,fontWeight:600,background:'#FEE2E2',color:C.red,borderRadius:4,padding:'1px 6px',marginLeft:5}}>必須</span>
)
const Def = () => (
  <span style={{fontSize:10,background:'#F0FDF4',color:C.green,borderRadius:4,padding:'1px 6px',marginLeft:5}}>デフォルト値あり</span>
)

const Label = ({ children }) => (
  <div style={{fontSize:12,fontWeight:600,color:C.slate,marginBottom:6,display:'flex',alignItems:'center'}}>{children}</div>
)

const SliderField = ({ label, min, max, step, value, onChange, display, hint, req }) => (
  <div style={{marginBottom:16}}>
    <Label>{label}{req ? <Req/> : <Def/>}</Label>
    <div style={{display:'flex',alignItems:'center',gap:10}}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(+e.target.value)}
        style={{flex:1,accentColor:C.blue,height:20,cursor:'pointer'}}/>
      <span style={{fontSize:14,fontWeight:700,color:C.navy,minWidth:80,textAlign:'right',flexShrink:0}}>{display}</span>
    </div>
    {hint && <div style={{fontSize:10,color:C.gray,marginTop:3,lineHeight:1.5}}>{hint}</div>}
  </div>
)

const SelBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    flex:1,padding:'8px 6px',fontSize:12,fontWeight:600,
    borderRadius:7,border:'none',cursor:'pointer',lineHeight:1.4,
    background:active?C.navy:C.light,color:active?'#fff':C.gray,
    transition:'background 0.15s',
  }}>{children}</button>
)

// ── STEP 1: エリア・建物 ──────────────────────────────────────────
function Step1({ form, setForm }) {
  const set = k => v => setForm(f=>({...f,[k]:v}))
  const areaInfo = AREA_DATA[form.city] || {}

  return (
    <div>
      {/* エリア */}
      <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
        <span>📍</span> エリア
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
        <div>
          <Label>都道府県<Req/></Label>
          <select value={form.pref} onChange={e=>set('pref')(e.target.value)}
            style={{width:'100%',padding:'9px 10px',border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:13,color:C.navy,background:'#fff',outline:'none'}}>
            {['東京都','神奈川県','大阪府','愛知県','福岡県'].map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <Label>市区町村<Req/></Label>
          <select value={form.city} onChange={e=>set('city')(e.target.value)}
            style={{width:'100%',padding:'9px 10px',border:`1.5px solid ${C.border}`,borderRadius:7,fontSize:13,color:C.navy,background:'#fff',outline:'none'}}>
            {CITIES.map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {areaInfo.rent1K && (
        <div style={{background:'#EFF6FF',borderRadius:8,padding:'8px 12px',marginBottom:16,fontSize:11}}>
          <span style={{color:C.blue,fontWeight:700}}>📡 {form.city} エリアデータ</span>
          <span style={{color:C.gray,marginLeft:12}}>1K平均賃料 <strong style={{color:C.navy}}>{areaInfo.rent1K}万円</strong></span>
          <span style={{color:C.gray,marginLeft:12}}>空室率 <strong style={{color:C.navy}}>{areaInfo.vacancy}%</strong></span>
        </div>
      )}

      {/* 土地 */}
      <div style={{height:1,background:C.border,margin:'4px 0 16px'}}/>
      <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
        <span>🏗</span> 建物・土地
      </div>

      <div style={{marginBottom:16}}>
        <Label>土地の所有<Req/></Label>
        <div style={{display:'flex',gap:8}}>
          <SelBtn active={form.hasLand===true}  onClick={()=>set('hasLand')(true)}>✅ 土地あり</SelBtn>
          <SelBtn active={form.hasLand===false} onClick={()=>set('hasLand')(false)}>🛒 土地なし（取得要）</SelBtn>
        </div>
      </div>

      {form.hasLand === false && (
        <SliderField
          label="土地取得費" req
          min={500} max={30000} step={100}
          value={form.landCost} onChange={set('landCost')}
          display={fmtOku(form.landCost)}
        />
      )}

      <div style={{marginBottom:16}}>
        <Label>建物構造<Req/></Label>
        <div style={{display:'flex',gap:8}}>
          {Object.entries(STRUCTURES).map(([k,v])=>(
            <SelBtn key={k} active={form.structure===k} onClick={()=>set('structure')(k)}>
              {v.label}<br/><span style={{fontSize:10,opacity:.7}}>耐用{v.life}年</span>
            </SelBtn>
          ))}
        </div>
      </div>

      <SliderField
        label="建築費（総額）" req
        min={1000} max={30000} step={100}
        value={form.buildCost} onChange={set('buildCost')}
        display={fmtOku(form.buildCost)}
        hint="坪単価 × 延床面積が目安。木造アパート（2階建て・300㎡）で8,000〜12,000万円が一般的"
      />

      {/* 総投資額プレビュー */}
      <div style={{background:C.navy,borderRadius:10,padding:'12px 16px',color:'#fff',marginTop:4}}>
        <div style={{fontSize:10,color:'#93C5FD',marginBottom:2}}>想定 総投資額</div>
        <div style={{fontSize:22,fontWeight:700}}>
          {fmtOku(form.buildCost + (form.hasLand?0:form.landCost) + 500)}
        </div>
        <div style={{fontSize:10,color:'#BAD6F0',marginTop:3}}>
          建築費 {fmtOku(form.buildCost)}
          {form.hasLand===false && ` ＋ 土地 ${fmtOku(form.landCost)}`}
          {` ＋ 諸費用（概算）500万`}
        </div>
      </div>
    </div>
  )
}

// ── STEP 2: 間取り・賃料 ──────────────────────────────────────────
function Step2({ form, setForm }) {
  const setRooms = rooms => setForm(f=>({...f,rooms}))

  const addRoom = () => {
    const used = form.rooms.map(r=>r.madori)
    const next = MADORI.find(m=>!used.includes(m.key)) || MADORI[0]
    setRooms([...form.rooms, {madori:next.key, count:2, rent:next.ref}])
  }
  const updRoom = (i,k,v) => {
    const nr = [...form.rooms]
    nr[i] = {...nr[i],[k]:v}
    if(k==='madori'){const m=MADORI.find(m=>m.key===v); if(m)nr[i].rent=m.ref}
    setRooms(nr)
  }
  const delRoom = i => setRooms(form.rooms.filter((_,j)=>j!==i))

  const totalUnits = form.rooms.reduce((s,r)=>s+r.count,0)
  const annualRent = form.rooms.reduce((s,r)=>s+r.rent*r.count,0)*12

  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
        <span>🏠</span> 間取り・戸数・賃料
      </div>
      <div style={{fontSize:11,color:C.gray,background:'#FFFBEB',borderRadius:7,padding:'8px 12px',marginBottom:16,lineHeight:1.6}}>
        💡 間取りタイプごとに戸数と月額賃料を設定してください。エリアの相場は参考値として使用しています。
      </div>

      {form.rooms.map((r,i) => (
        <div key={i} style={{background:C.light,borderRadius:10,padding:'14px',marginBottom:10,border:`1px solid ${C.border}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:C.navy}}>間取り {i+1}</span>
            {form.rooms.length>1 && (
              <button onClick={()=>delRoom(i)}
                style={{fontSize:11,color:C.red,background:'#FEE2E2',border:'none',borderRadius:5,padding:'2px 8px',cursor:'pointer'}}>
                削除
              </button>
            )}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <div>
              <div style={{fontSize:11,color:C.gray,marginBottom:4}}>間取りタイプ</div>
              <select value={r.madori} onChange={e=>updRoom(i,'madori',e.target.value)}
                style={{width:'100%',padding:'8px',border:`1px solid ${C.border}`,borderRadius:7,fontSize:13,background:'#fff',color:C.navy}}>
                {MADORI.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,color:C.gray,marginBottom:4}}>戸数</div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <button onClick={()=>updRoom(i,'count',Math.max(1,r.count-1))}
                  style={{width:32,height:32,fontSize:16,background:'#E2E8F0',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700}}>−</button>
                <div style={{flex:1,textAlign:'center',fontSize:16,fontWeight:700,color:C.navy}}>{r.count}戸</div>
                <button onClick={()=>updRoom(i,'count',r.count+1)}
                  style={{width:32,height:32,fontSize:16,background:C.navy,border:'none',borderRadius:6,cursor:'pointer',color:'#fff',fontWeight:700}}>＋</button>
              </div>
            </div>
          </div>

          <div style={{marginBottom:6}}>
            <div style={{fontSize:11,color:C.gray,marginBottom:4}}>月額賃料（1戸あたり）<span style={{fontSize:10,fontWeight:600,background:'#FEE2E2',color:C.red,borderRadius:4,padding:'1px 6px',marginLeft:5}}>必須</span></div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <input type="range" min={3} max={30} step={0.5} value={r.rent} onChange={e=>updRoom(i,'rent',+e.target.value)}
                style={{flex:1,accentColor:C.blue,height:20,cursor:'pointer'}}/>
              <span style={{fontSize:14,fontWeight:700,color:C.navy,minWidth:72,textAlign:'right',flexShrink:0}}>{r.rent.toFixed(1)}万円</span>
            </div>
          </div>
          <div style={{fontSize:11,color:C.green,background:C.greenBg,borderRadius:6,padding:'4px 10px'}}>
            月収 <strong>{(r.rent*r.count).toFixed(1)}万円</strong>（{r.count}戸 × {r.rent}万）
          </div>
        </div>
      ))}

      <button onClick={addRoom}
        style={{width:'100%',padding:'9px',background:'#EFF6FF',border:`1.5px dashed ${C.blue}`,borderRadius:8,color:C.blue,fontSize:12,fontWeight:700,cursor:'pointer',marginBottom:4}}>
        ＋ 間取りを追加
      </button>

      {/* サマリー */}
      <div style={{background:C.navy,borderRadius:10,padding:'12px 16px',color:'#fff',marginTop:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:10,color:'#93C5FD',marginBottom:2}}>合計戸数</div>
            <div style={{fontSize:22,fontWeight:700}}>{totalUnits}戸</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:10,color:'#93C5FD',marginBottom:2}}>満室時 年間賃料収入</div>
            <div style={{fontSize:22,fontWeight:700}}>{fmtOku(annualRent)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── STEP 3: 資金計画 ──────────────────────────────────────────────
function Step3({ form, setForm }) {
  const set = k => v => setForm(f=>({...f,[k]:v}))
  const totalInvest = form.buildCost + (form.hasLand?0:form.landCost) + 500
  const loan = Math.max(0, totalInvest - form.equity)
  const mRate = form.loanRate/100/12
  const nMon = form.loanYears*12
  const monthPay = loan>0&&mRate>0
    ? (loan*10000*(mRate*Math.pow(1+mRate,nMon))/(Math.pow(1+mRate,nMon)-1))/10000
    : 0

  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
        <span>💰</span> 資金計画
      </div>

      <SliderField
        label="自己資金" req
        min={500} max={15000} step={100}
        value={form.equity} onChange={set('equity')}
        display={fmtOku(form.equity)}
        hint="頭金・諸費用を含む手出し総額"
      />

      {/* 借入サマリー */}
      <div style={{background:'#EFF6FF',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
          {[
            ['借入金額',   fmtOku(loan)],
            ['月次返済額', `${monthPay.toFixed(1)}万/月`],
            ['LTV',        `${totalInvest>0?((loan/totalInvest)*100).toFixed(0):0}%`],
          ].map(([l,v])=>(
            <div key={l}>
              <div style={{fontSize:10,color:C.gray}}>{l}</div>
              <div style={{fontWeight:700,color:C.navy,fontSize:13}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{height:1,background:C.border,margin:'4px 0 16px'}}/>
      <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
        <span>⚙️</span> ローン・出口条件 <span style={{fontSize:10,fontWeight:500,color:C.gray,marginLeft:4}}>（後から変更可）</span>
      </div>

      <SliderField
        label="借入金利"
        min={0.5} max={5} step={0.1}
        value={form.loanRate} onChange={set('loanRate')}
        display={`${form.loanRate.toFixed(1)}%`}
      />
      <SliderField
        label="返済期間"
        min={10} max={35} step={1}
        value={form.loanYears} onChange={set('loanYears')}
        display={`${form.loanYears}年`}
      />

      <div style={{height:1,background:C.border,margin:'4px 0 16px'}}/>
      <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
        <span>📅</span> 保有・節税
      </div>

      <SliderField
        label="保有期間"
        min={5} max={50} step={1}
        value={form.holdYrs} onChange={set('holdYrs')}
        display={`${form.holdYrs}年`}
      />
      <SliderField
        label="給与年収（節税計算用）"
        min={300} max={5000} step={50}
        value={form.salary} onChange={set('salary')}
        display={`${form.salary}万円`}
        hint="減価償却費との損益通算による節税額の算出に使用します"
      />
    </div>
  )
}

// ── STEP設定 ────────────────────────────────────────────────────
const STEPS = [
  { no:1, icon:'📍', title:'エリア・建物',  desc:'物件の場所と建物概要を入力' },
  { no:2, icon:'🏠', title:'間取り・賃料',  desc:'部屋タイプと想定賃料を設定' },
  { no:3, icon:'💰', title:'資金計画',      desc:'自己資金とローン条件を設定' },
]

// デフォルト値（必須項目はnull or 0 = 未入力状態）
export const WIZARD_DEFAULTS = {
  pref:      '東京都',
  city:      '世田谷区',
  hasLand:   null,          // 必須・未選択
  landCost:  null,          // 必須（土地なし時）
  structure: 'wood',
  buildCost: null,          // 必須・未入力
  otherCost: 500,
  rooms:     [{madori:'1K', count:8, rent:7.5}, {madori:'1LDK', count:4, rent:10.0}],
  equity:    null,          // 必須・未入力
  loanRate:  1.8,
  loanYears: 30,
  holdYrs:   20,
  salary:    800,
  // 以下はデフォルト固定
  repayType:    'annuity',
  occ:          93,
  occInit:      85,
  rentDecline:  0.5,
  parking:      0,
  parkRent:     1.5,
  mgmtRate:     5,
  repairRes:    50,
  propTax:      80,
  insure:       5,
  util:         12,
  majorRepairs: [{yr:15, cost:600}],
  landChg:      0.5,
  rateChgYr:    0,
  rateAfter:    2.5,
  exitYield:    5.5,
  exitBrok:     3,
  comparables:  [],
}

// 各ステップのバリデーション
function validateStep(step, form) {
  if(step===1){
    if(form.hasLand===null) return 'land'
    if(form.hasLand===false && !form.landCost) return 'landCost'
    if(!form.buildCost) return 'buildCost'
  }
  if(step===2){
    if(form.rooms.length===0) return 'rooms'
  }
  if(step===3){
    if(!form.equity) return 'equity'
  }
  return null
}

// ── メインウィザード ────────────────────────────────────────────
export default function SetupWizard({ customerName, onComplete, onClose }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    ...WIZARD_DEFAULTS,
    // 必須項目を入力しやすいデフォルトで初期化（スライダーに値が必要なため）
    buildCost: 9600,
    landCost:  5000,
    equity:    3000,
  })
  const [error, setError] = useState(null)

  const goNext = () => {
    const err = validateStep(step, form)
    if(err){ setError(err); return }
    setError(null)
    if(step < 3) setStep(s=>s+1)
    else {
      // 完了 → INITフォーマットに変換して渡す
      onComplete({
        ...form,
        otherCost: form.otherCost || 500,
        hasLand: form.hasLand || false,
      })
    }
  }
  const goBack = () => { setError(null); setStep(s=>s-1) }

  // エラーメッセージ
  const errorMsg = {
    land:      '土地の所有を選択してください',
    landCost:  '土地取得費を入力してください',
    buildCost: '建築費を入力してください',
    rooms:     '間取りを1つ以上追加してください',
    equity:    '自己資金を入力してください',
  }[error]

  const StepContent = [Step1, Step2, Step3][step-1]

  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)'}} onClick={onClose}/>
      <div style={{
        position:'relative',background:'#fff',borderRadius:16,
        width:560,maxHeight:'90vh',display:'flex',flexDirection:'column',
        boxShadow:'0 24px 64px rgba(0,0,0,0.25)',overflow:'hidden',
      }}>

        {/* ヘッダー */}
        <div style={{background:C.navy,padding:'18px 24px 14px',flexShrink:0}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>🏢 {customerName}</div>
              <div style={{fontSize:11,color:'#93C5FD',marginTop:2}}>新規シミュレーション — 初期設定</div>
            </div>
            <button onClick={onClose}
              style={{width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              ×
            </button>
          </div>

          {/* ステッパー */}
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            {STEPS.map((s,i)=>(
              <div key={s.no} style={{display:'flex',alignItems:'center',flex:i<STEPS.length-1?1:'auto'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                  <div style={{
                    width:26,height:26,borderRadius:'50%',
                    background:step>s.no?'#22C55E':step===s.no?C.blue:'rgba(255,255,255,0.2)',
                    color:'#fff',fontSize:11,fontWeight:700,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    transition:'background 0.2s',
                  }}>
                    {step>s.no ? '✓' : s.no}
                  </div>
                  <span style={{fontSize:11,fontWeight:step===s.no?700:400,color:step>=s.no?'#fff':'rgba(255,255,255,0.5)',whiteSpace:'nowrap'}}>
                    {s.title}
                  </span>
                </div>
                {i<STEPS.length-1&&(
                  <div style={{flex:1,height:1,background:step>s.no?'#22C55E':'rgba(255,255,255,0.2)',margin:'0 8px',minWidth:16,transition:'background 0.2s'}}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
          <div style={{fontSize:13,color:C.gray,marginBottom:16,lineHeight:1.5}}>
            <strong style={{color:C.navy}}>{STEPS[step-1].icon} {STEPS[step-1].title}</strong>
            　{STEPS[step-1].desc}
          </div>
          <StepContent form={form} setForm={setForm}/>
        </div>

        {/* フッター */}
        <div style={{padding:'14px 24px',borderTop:`1px solid ${C.border}`,flexShrink:0,background:'#FAFAFA'}}>
          {errorMsg && (
            <div style={{fontSize:11,color:C.red,background:'#FEF2F2',borderRadius:6,padding:'6px 12px',marginBottom:10}}>
              ⚠️ {errorMsg}
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              {step>1 && (
                <button onClick={goBack}
                  style={{padding:'9px 18px',background:C.light,color:C.slate,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  ← 戻る
                </button>
              )}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:11,color:C.gray}}>{step} / {STEPS.length}</span>
              <button onClick={goNext}
                style={{
                  padding:'10px 24px',
                  background: step===3 ? '#22C55E' : C.navy,
                  color:'#fff',border:'none',borderRadius:8,
                  fontSize:13,fontWeight:700,cursor:'pointer',
                  boxShadow:step===3?'0 2px 8px rgba(34,197,94,0.3)':'none',
                }}>
                {step===3 ? '✅ シミュレーションを開始' : '次へ →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
