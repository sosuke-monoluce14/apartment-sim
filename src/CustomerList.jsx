import { useState } from 'react'

const C = {
  navy:"#1B3F6B", blue:"#2E75B6", green:"#166534", greenBg:"#F0FDF4",
  red:"#991B1B", amber:"#854F0B", purple:"#3C3489",
  gray:"#64748B", border:"#E2E8F0", slate:"#334155", light:"#F8FAFC",
}

const fmtOku = v => Math.abs(v)>=10000?`${(v/10000).toFixed(2)}億`:`${Math.round(v).toLocaleString()}万`
const fmtDate = iso => {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}

// ── 新規作成モーダル ──────────────────────────────────────────────
function NewModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [memo, setMemo] = useState('')
  return (
    <div style={{position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)'}} onClick={onClose}/>
      <div style={{position:'relative',background:'#fff',borderRadius:16,padding:'28px 32px',width:440,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{fontSize:16,fontWeight:700,color:C.navy,marginBottom:4}}>🏢 新規シミュレーション作成</div>
        <div style={{fontSize:12,color:C.gray,marginBottom:20}}>お客様情報を入力してください</div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:C.slate,marginBottom:6}}>お客様名 <span style={{fontSize:10,fontWeight:600,background:'#FEE2E2',color:C.red,borderRadius:4,padding:'1px 5px',marginLeft:4}}>必須</span></div>
          <input
            autoFocus
            value={name}
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&name.trim()&&onCreate(name.trim(),memo)}
            placeholder="例：山田 太郎 様"
            style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${name?C.blue:C.border}`,borderRadius:8,fontSize:14,color:C.navy,outline:'none',boxSizing:'border-box',transition:'border-color 0.15s'}}
          />
        </div>

        <div style={{marginBottom:24}}>
          <div style={{fontSize:12,fontWeight:600,color:C.slate,marginBottom:6}}>メモ <span style={{fontSize:10,background:'#F1F5F9',color:C.gray,borderRadius:4,padding:'1px 5px',marginLeft:4}}>任意</span></div>
          <textarea
            value={memo}
            onChange={e=>setMemo(e.target.value)}
            placeholder="物件概要・面談メモなど"
            rows={3}
            style={{width:'100%',padding:'10px 12px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,color:C.slate,resize:'none',outline:'none',boxSizing:'border-box',fontFamily:'inherit'}}
          />
        </div>

        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'11px',background:C.light,color:C.gray,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>キャンセル</button>
          <button
            onClick={()=>name.trim()&&onCreate(name.trim(),memo)}
            disabled={!name.trim()}
            style={{flex:2,padding:'11px',background:name.trim()?C.navy:'#CBD5E1',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:name.trim()?'pointer':'not-allowed',transition:'background 0.15s'}}
          >作成してシミュレーションを開始 →</button>
        </div>
      </div>
    </div>
  )
}

// ── 削除確認モーダル ──────────────────────────────────────────────
function DeleteModal({ customer, onClose, onDelete }) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)'}} onClick={onClose}/>
      <div style={{position:'relative',background:'#fff',borderRadius:16,padding:'28px 32px',width:380,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
        <div style={{fontSize:16,fontWeight:700,color:C.red,marginBottom:8}}>🗑 ファイルを削除</div>
        <div style={{fontSize:13,color:C.slate,marginBottom:6}}>以下のシミュレーションを削除しますか？</div>
        <div style={{background:'#FEF2F2',borderRadius:8,padding:'10px 14px',marginBottom:20,fontSize:13,fontWeight:600,color:C.red}}>{customer.name}</div>
        <div style={{fontSize:11,color:C.gray,marginBottom:20}}>この操作は取り消せません。</div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'10px',background:C.light,color:C.slate,border:`1px solid ${C.border}`,borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>キャンセル</button>
          <button onClick={onDelete} style={{flex:1,padding:'10px',background:C.red,color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer'}}>削除する</button>
        </div>
      </div>
    </div>
  )
}

// ── ステータスバッジ ──────────────────────────────────────────────
function StatusBadge({ irr, netBurden }) {
  if (irr >= 8 && netBurden <= 0) return <span style={{background:'#DCFCE7',color:'#166534',borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:700}}>◎ 優良</span>
  if (irr >= 5 && netBurden <= 0) return <span style={{background:'#DBEAFE',color:'#1E40AF',borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:700}}>○ 良好</span>
  if (netBurden <= 0)              return <span style={{background:'#FEF9C3',color:'#854D0E',borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:700}}>△ 検討中</span>
  return                                  <span style={{background:'#FEE2E2',color:C.red,borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:700}}>× 要見直し</span>
}

// ── レコード行アイテム ────────────────────────────────────────────
function CustomerRow({ customer, onOpen, onDelete, isEven }) {
  const [hover, setHover] = useState(false)
  const { kpi, params } = customer
  const units = params?.rooms?.reduce((s,r)=>s+r.count,0)
  const invest = params ? fmtOku(params.buildCost+(params.hasLand?0:params.landCost)+params.otherCost) : '—'

  return (
    <div
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      onClick={onOpen}
      style={{
        display:'grid',
        gridTemplateColumns:'28px 1fr 110px 72px 60px 60px 60px 90px 36px',
        alignItems:'center',
        gap:'0 12px',
        padding:'0 16px',
        height:44,
        background: hover ? '#EFF6FF' : isEven ? '#fff' : '#FAFBFC',
        cursor:'pointer',
        borderBottom:`1px solid ${C.border}`,
        transition:'background 0.1s',
      }}
    >
      {/* アイコン */}
      <div style={{fontSize:16,textAlign:'center',flexShrink:0}}>🏢</div>

      {/* お客様名 ＋ メモ */}
      <div style={{minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:C.navy,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{customer.name}</div>
        {customer.memo && <div style={{fontSize:10,color:C.gray,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{customer.memo}</div>}
      </div>

      {/* エリア */}
      <div style={{fontSize:11,color:C.slate,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
        {params ? `${params.city}` : <span style={{color:'#CBD5E1'}}>—</span>}
        {units ? <span style={{color:C.gray}}> / {units}戸</span> : null}
      </div>

      {/* 総投資額 */}
      <div style={{fontSize:11,color:C.slate,textAlign:'right',fontVariantNumeric:'tabular-nums'}}>
        {params ? invest : <span style={{color:'#CBD5E1'}}>—</span>}
      </div>

      {/* 表面利回り */}
      <div style={{textAlign:'right'}}>
        {kpi
          ? <span style={{fontSize:12,fontWeight:700,color:kpi.grossY>=6?C.green:C.red}}>{kpi.grossY?.toFixed(1)}%</span>
          : <span style={{fontSize:11,color:'#CBD5E1'}}>—</span>}
      </div>

      {/* IRR */}
      <div style={{textAlign:'right'}}>
        {kpi
          ? <span style={{fontSize:12,fontWeight:700,color:kpi.irr>=5?C.green:C.red}}>{kpi.irr?.toFixed(1)}%</span>
          : <span style={{fontSize:11,color:'#CBD5E1'}}>—</span>}
      </div>

      {/* DSCR */}
      <div style={{textAlign:'right'}}>
        {kpi
          ? <span style={{fontSize:12,fontWeight:700,color:kpi.dscr>=1.2?C.green:C.red}}>{kpi.dscr?.toFixed(2)}</span>
          : <span style={{fontSize:11,color:'#CBD5E1'}}>—</span>}
      </div>

      {/* ステータス ＋ 更新日 */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
        {kpi && <StatusBadge irr={kpi.irr} netBurden={kpi.netBurden}/>}
        <span style={{fontSize:9,color:'#94A3B8'}}>{fmtDate(customer.updatedAt)}</span>
      </div>

      {/* 削除ボタン */}
      <button
        onClick={e=>{e.stopPropagation();onDelete()}}
        style={{
          width:28,height:28,borderRadius:6,
          background:'transparent',border:`1px solid transparent`,
          color:'#CBD5E1',fontSize:13,cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          transition:'all 0.15s',
        }}
        onMouseEnter={e=>{e.currentTarget.style.background='#FEE2E2';e.currentTarget.style.color=C.red;e.currentTarget.style.borderColor='#FECACA'}}
        onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#CBD5E1';e.currentTarget.style.borderColor='transparent'}}
      >🗑</button>
    </div>
  )
}

// ── メインコンポーネント ──────────────────────────────────────────
export default function CustomerList({ customers, onOpen, onCreate, onDelete }) {
  const [showNew, setShowNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    c.name.includes(search) || (c.memo||'').includes(search) ||
    (c.params?.city||'').includes(search) || (c.params?.pref||'').includes(search)
  )

  const handleCreate = (name, memo) => {
    setShowNew(false)
    onCreate(name, memo)
  }

  return (
    <div style={{minHeight:'100vh',background:C.light,fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif",color:C.slate}}>

      {/* ヘッダー */}
      <div style={{background:C.navy,padding:'0 32px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:4,height:24,background:C.blue,borderRadius:2}}/>
          <span style={{fontSize:15,fontWeight:700,color:'#fff'}}>アパート収支シミュレーター</span>
          <span style={{fontSize:10,color:'#93C5FD',marginLeft:4}}>顧客ファイル管理</span>
        </div>
        <button
          onClick={()=>setShowNew(true)}
          style={{
            display:'flex',alignItems:'center',gap:8,
            padding:'8px 20px',background:C.blue,color:'#fff',
            border:'none',borderRadius:8,fontSize:13,fontWeight:700,
            cursor:'pointer',boxShadow:'0 2px 8px rgba(46,117,182,0.4)',
            transition:'background 0.15s',
          }}
          onMouseEnter={e=>e.currentTarget.style.background='#1E5FA0'}
          onMouseLeave={e=>e.currentTarget.style.background=C.blue}
        >
          <span style={{fontSize:16}}>＋</span> 新規作成
        </button>
      </div>

      {/* メインコンテンツ */}
      <div style={{maxWidth:960,margin:'0 auto',padding:'32px 24px'}}>

        {/* ページタイトル＋検索 */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:24,flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:C.navy,marginBottom:4}}>顧客シミュレーション一覧</div>
            <div style={{fontSize:12,color:C.gray}}>全 <strong style={{color:C.navy}}>{customers.length}</strong> 件</div>
          </div>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:14,color:C.gray,pointerEvents:'none'}}>🔍</span>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="お客様名・エリアで検索"
              style={{padding:'9px 14px 9px 36px',border:`1.5px solid ${search?C.blue:C.border}`,borderRadius:8,fontSize:13,width:240,outline:'none',color:C.navy,transition:'border-color 0.15s'}}
            />
          </div>
        </div>

        {/* リスト */}
        {customers.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 0',color:C.gray}}>
            <div style={{fontSize:48,marginBottom:16}}>📂</div>
            <div style={{fontSize:16,fontWeight:600,color:C.slate,marginBottom:8}}>まだシミュレーションがありません</div>
            <div style={{fontSize:13,marginBottom:24}}>右上の「新規作成」ボタンから<br/>お客様のシミュレーションを始めましょう</div>
            <button
              onClick={()=>setShowNew(true)}
              style={{padding:'12px 28px',background:C.navy,color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer'}}
            >＋ 新規作成</button>
          </div>
        ) : (
          <div style={{background:'#fff',borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
            {/* テーブルヘッダー */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'28px 1fr 110px 72px 60px 60px 60px 90px 36px',
              gap:'0 12px',
              padding:'0 16px',
              height:36,
              background:'#F1F5F9',
              borderBottom:`1px solid ${C.border}`,
              alignItems:'center',
            }}>
              <div/>
              <div style={{fontSize:10,fontWeight:700,color:C.gray,letterSpacing:'0.04em'}}>お客様名</div>
              <div style={{fontSize:10,fontWeight:700,color:C.gray,letterSpacing:'0.04em'}}>エリア / 戸数</div>
              <div style={{fontSize:10,fontWeight:700,color:C.gray,textAlign:'right',letterSpacing:'0.04em'}}>総投資額</div>
              <div style={{fontSize:10,fontWeight:700,color:C.gray,textAlign:'right',letterSpacing:'0.04em'}}>表面利回</div>
              <div style={{fontSize:10,fontWeight:700,color:C.gray,textAlign:'right',letterSpacing:'0.04em'}}>IRR</div>
              <div style={{fontSize:10,fontWeight:700,color:C.gray,textAlign:'right',letterSpacing:'0.04em'}}>DSCR</div>
              <div style={{fontSize:10,fontWeight:700,color:C.gray,textAlign:'right',letterSpacing:'0.04em'}}>ステータス</div>
              <div/>
            </div>

            {/* レコード一覧 */}
            {filtered.length === 0 ? (
              <div style={{padding:'32px',textAlign:'center',color:C.gray,fontSize:13}}>
                🔍 「{search}」に一致するファイルが見つかりません
              </div>
            ) : (
              filtered.map((c, i) => (
                <CustomerRow
                  key={c.id}
                  customer={c}
                  isEven={i % 2 === 0}
                  onOpen={()=>onOpen(c.id)}
                  onDelete={()=>setDeleteTarget(c)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* モーダル */}
      {showNew && <NewModal onClose={()=>setShowNew(false)} onCreate={handleCreate}/>}
      {deleteTarget && (
        <DeleteModal
          customer={deleteTarget}
          onClose={()=>setDeleteTarget(null)}
          onDelete={()=>{ onDelete(deleteTarget.id); setDeleteTarget(null) }}
        />
      )}
    </div>
  )
}
