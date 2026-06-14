// A4提案資料テンプレート（794 × 1123 px @ 96dpi）
// html2canvas でキャプチャしてPDF化する

const W = 794
const H = 1123

// ─── カラーパレット ────────────────────────────────────────────────
const T = {
  navy:   '#0F2D52',
  blue:   '#1A5EA8',
  blueL:  '#2E75B6',
  gold:   '#C49A2A',
  goldL:  '#F0D080',
  gray1:  '#F4F6F9',
  gray2:  '#E8ECF1',
  gray3:  '#B0BAC8',
  gray4:  '#7A8799',
  text:   '#1A2535',
  sub:    '#4A5568',
  white:  '#FFFFFF',
  green:  '#1A6B3A',
  greenL: '#EBF7F0',
  red:    '#8B1A1A',
  redL:   '#FBF0F0',
  amber:  '#7A4F00',
  amberL: '#FDF6E3',
}

const FF     = "'Noto Sans JP','Hiragino Kaku Gothic ProN','Meiryo',sans-serif"
const fmtM   = v => `${Math.round(v).toLocaleString()}万円`
const fmtOku = v => Math.abs(v)>=10000 ? `${(v/10000).toFixed(2)}億円` : `${Math.round(v).toLocaleString()}万円`
const fmtP   = (v, d=1) => `${v.toFixed(d)}%`
const R      = v => Math.round(v)
const STRUCT  = { wood:'木造', steel:'軽量鉄骨造', rc:'RC造' }
const REPAY   = { annuity:'元利均等返済', principal:'元金均等返済' }

// ─── ページ共通ラッパー ───────────────────────────────────────────
const Page = ({ children, style }) => (
  <div style={{
    width: W, minHeight: H,
    background: T.white,
    fontFamily: FF,
    color: T.text,
    fontSize: 11,
    lineHeight: 1.65,
    boxSizing: 'border-box',
    position: 'relative',
    ...style,
  }}>
    {children}
  </div>
)

// ─── ページヘッダーバー ───────────────────────────────────────────
const PageHeader = ({ customerName, pageNo, pageTotal, subtitle }) => (
  <div style={{ background: T.navy, padding: '12px 36px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <div style={{ fontSize: 8, color: T.gray3, letterSpacing: '0.15em', marginBottom: 2 }}>
          APARTMENT INVESTMENT PROPOSAL
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>
          {customerName} 様
          <span style={{ fontSize: 10, fontWeight: 400, color: T.gray3, marginLeft: 10 }}>{subtitle}</span>
        </div>
      </div>
      <div style={{ textAlign:'right', fontSize: 8, color: T.gray3 }}>— {pageNo} / {pageTotal} —</div>
    </div>
  </div>
)

// ─── セクションタイトル ───────────────────────────────────────────
const SecTitle = ({ label, en }) => (
  <div style={{ marginBottom: 10, marginTop: 2 }}>
    <div style={{ display:'flex', alignItems:'baseline', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{label}</div>
      <div style={{ fontSize: 8, color: T.gray4, letterSpacing: '0.1em' }}>{en}</div>
    </div>
    <div style={{ height: 1, background: `linear-gradient(to right, ${T.blue}, ${T.gray2})`, marginTop: 4 }}/>
  </div>
)

// ─── テーブル行 ───────────────────────────────────────────────────
const TR = ({ label, value, bold, highlight, indent }) => (
  <div style={{
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding: `4px ${indent?'8px 4px 16px':'8px'}`,
    background: highlight ? T.gray1 : 'transparent',
    borderBottom: `1px solid ${T.gray2}`,
  }}>
    <span style={{ fontSize: 9.5, color: indent ? T.gray4 : T.sub }}>{indent ? `└ ${label}` : label}</span>
    <span style={{ fontSize: 10, fontWeight: bold ? 700 : 400, color: T.text }}>{value}</span>
  </div>
)

// ─── KPIカード ────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, ok }) => {
  const bg   = ok===true ? T.greenL  : ok===false ? T.redL  : T.amberL
  const bord = ok===true ? T.green   : ok===false ? T.red   : T.amber
  const col  = ok===true ? T.green   : ok===false ? T.red   : T.amber
  const mark = ok===true ? '◎'       : ok===false ? '▲'     : '△'
  return (
    <div style={{
      background: bg,
      border: `1px solid ${bord}22`,
      borderTop: `3px solid ${bord}`,
      borderRadius: 4,
      padding: '9px 10px',
    }}>
      <div style={{ fontSize: 8, color: T.sub, marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: col, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 7.5, color: col, marginTop: 3 }}>{mark} {sub}</div>}
    </div>
  )
}

// ─── フッター ─────────────────────────────────────────────────────
const Footer = ({ date, pageNo, pageTotal, note }) => (
  <div style={{
    borderTop: `1px solid ${T.gray2}`,
    padding: '8px 36px',
    display: 'flex', justifyContent: 'space-between',
    fontSize: 7.5, color: T.gray4,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  }}>
    <div>作成日：{date}</div>
    <div>{note || '※本資料は概算・参考値です。専門家へのご相談を推奨します。'}</div>
    <div>{pageNo} / {pageTotal}</div>
  </div>
)

// ════════════════════════════════════════════════════════════════════
// PAGE 1 ── 表紙 + 設定条件詳細
// ════════════════════════════════════════════════════════════════════
export function Page1({ customerName, date, p, sim }) {
  const totalInvest = p.buildCost + (p.hasLand?0:p.landCost) + p.otherCost

  // ミニサマリ用 KPI（4つだけ、コンパクトに）
  const miniKpis = [
    { l:'表面利回り', v: fmtP(sim.grossY), ok: sim.grossY>=6 },
    { l:'IRR',        v: fmtP(sim.irr),    ok: sim.irr>=5    },
    { l:'DSCR',       v: sim.dscr.toFixed(2), ok: sim.dscr>=1.2 },
    { l:`${p.holdYrs}年 実質負担`, v:`${sim.netBurden<=0?'▲':''}${fmtOku(Math.abs(sim.netBurden))}`, ok: sim.netBurden<=0 },
  ]

  return (
    <Page>
      {/* 上部カラーバンド */}
      <div style={{ height: 6, background: `linear-gradient(to right, ${T.navy}, ${T.blueL})` }}/>
      <div style={{ height: 2, background: T.gold }}/>

      {/* ──── ヘッダー（書類タイトル） ──── */}
      <div style={{ background: T.navy, padding: '18px 36px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize: 8, color: T.gray3, letterSpacing: '0.18em', marginBottom: 6 }}>
              APARTMENT INVESTMENT PROPOSAL
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: T.white, lineHeight: 1.3 }}>
              アパート一棟建て投資　収支シミュレーションシート
            </div>
            <div style={{ fontSize: 14, color: '#A8C4E8', marginTop: 6, fontWeight: 400 }}>
              {customerName} 様
            </div>
          </div>
          <div style={{ textAlign:'right', fontSize: 8, color: T.gray3 }}>
            <div>作成日：{date}</div>
            <div style={{ marginTop: 3 }}>1 / 3</div>
          </div>
        </div>
      </div>

      {/* ──── ミニサマリ（4KPI 横並び） ──── */}
      <div style={{
        background: '#1A3F68',
        padding: '10px 36px',
        display: 'flex', gap: 0,
        borderBottom: `2px solid ${T.gold}`,
      }}>
        {miniKpis.map((k,i)=>{
          const col = k.ok ? '#5BE58A' : '#F87171'
          return (
            <div key={k.l} style={{
              flex: 1,
              textAlign: 'center',
              padding: '6px 10px',
              borderRight: i<3 ? `1px solid rgba(255,255,255,0.15)` : 'none',
            }}>
              <div style={{ fontSize: 8, color: T.gray3, marginBottom: 3 }}>{k.l}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: col }}>{k.v}</div>
            </div>
          )
        })}
      </div>

      {/* ──── メイン：設定条件詳細 ──── */}
      <div style={{ padding: '18px 36px 50px' }}>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 18 }}>

          {/* 左列 */}
          <div>
            {/* エリア・物件概要 */}
            <SecTitle label="エリア・物件概要" en="PROPERTY OVERVIEW"/>
            <TR label="所在地"       value={`${p.pref} ${p.city}`} bold/>
            <TR label="建物構造"     value={`${STRUCT[p.structure]||'木造'}`} highlight/>
            <TR label="耐用年数"     value={`${p.structure==='wood'?22:p.structure==='steel'?27:47}年`}/>
            <TR label="土地"         value={p.hasLand ? '自己所有' : `取得（${fmtM(p.landCost)}）`} highlight/>
            <TR label="建築費"       value={fmtM(p.buildCost)} bold/>
            <TR label="諸費用"       value={fmtM(p.otherCost)} highlight/>
            <TR label="総投資額"     value={fmtOku(totalInvest)} bold/>

            <div style={{ marginTop: 14 }}/>

            {/* 間取り・賃料 */}
            <SecTitle label="間取り・賃料設定" en="FLOOR PLAN & RENT"/>
            {p.rooms?.map((r,i)=>(
              <TR key={i} label={`${r.madori}（${r.count}戸）`} value={`${r.rent.toFixed(1)}万円 / 戸・月`} highlight={i%2===0}/>
            ))}
            {p.parking>0 && <TR label="駐車場" value={`${p.parking}台 × ${p.parkRent}万円 / 月`}/>}
            <TR label="合計戸数"         value={`${sim.totalUnits}戸`} bold highlight/>
            <TR label="満室時 月収"       value={`${(sim.blendedRent*sim.totalUnits).toFixed(1)}万円 / 月`} bold/>
            <TR label="満室時 年収"       value={fmtM(sim.blendedRent*sim.totalUnits*12)} bold highlight/>

            <div style={{ marginTop: 14 }}/>

            {/* 稼働・相場想定 */}
            <SecTitle label="稼働・相場想定" en="REVENUE ASSUMPTIONS"/>
            <TR label="初年度入居率"  value={`${p.occInit}%`}/>
            <TR label="安定期入居率"  value={`${p.occ}%`} highlight/>
            <TR label="賃料下落率"    value={`${p.rentDecline}%/年`}/>
            <TR label="地価変動率"    value={`${p.landChg>=0?'+':''}${p.landChg}%/年`} highlight/>
          </div>

          {/* 右列 */}
          <div>
            {/* 資金計画 */}
            <SecTitle label="資金計画" en="FINANCING PLAN"/>
            <TR label="自己資金"          value={fmtM(p.equity)} bold/>
            <TR label="借入金額"          value={fmtOku(sim.loan)} highlight/>
            <TR label="LTV（融資比率）"   value={fmtP(sim.ltv)}/>
            <TR label="借入金利"          value={`${p.loanRate}%`} highlight/>
            <TR label="返済期間"          value={`${p.loanYears}年`}/>
            <TR label="返済方式"          value={REPAY[p.repayType]||'元利均等返済'} highlight/>
            <TR label="月次返済額（初年）" value={`${sim.monthPay?.toFixed(1)}万円 / 月`} bold/>
            {p.rateChgYr>0 && <TR label="金利変動シナリオ" value={`${p.rateChgYr}年目〜 ${p.rateAfter}%`} highlight/>}

            <div style={{ marginTop: 14 }}/>

            {/* 年間コスト */}
            <SecTitle label="年間コスト設定" en="OPERATING COSTS"/>
            <TR label="管理委託費率"       value={`${p.mgmtRate}%（賃料収入比）`}/>
            <TR label="修繕積立（年間）"   value={fmtM(p.repairRes)} highlight/>
            <TR label="固定資産税"         value={`${p.propTax}万円 / 年`}/>
            <TR label="火災保険料"         value={`${p.insure}万円 / 年`} highlight/>
            <TR label="共用部光熱費"       value={`${p.util}万円 / 年`}/>

            <div style={{ marginTop: 14 }}/>

            {/* 大規模修繕 */}
            <SecTitle label="大規模修繕計画" en="MAJOR REPAIRS"/>
            {p.majorRepairs?.length>0
              ? p.majorRepairs.map((r,i)=>(
                  <TR key={i} label={`${r.yr}年目`} value={fmtM(r.cost)} highlight={i%2===0}/>
                ))
              : <div style={{ fontSize: 9, color: T.gray4, padding:'4px 8px', borderBottom:`1px solid ${T.gray2}` }}>計画なし</div>
            }

            <div style={{ marginTop: 14 }}/>

            {/* 出口・税務設定 */}
            <SecTitle label="出口・税務設定" en="EXIT STRATEGY"/>
            <TR label="保有期間"             value={`${p.holdYrs}年`} bold/>
            <TR label="売却想定利回り"       value={`${p.exitYield}%`} highlight/>
            <TR label="売却仲介手数料"       value={`${p.exitBrok}%`}/>
            <TR label="給与年収（節税計算）" value={`${p.salary}万円`} highlight/>
          </div>
        </div>
      </div>

      <Footer date={date} pageNo={1} pageTotal={3}/>
    </Page>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE 2 ── 投資指標サマリ
// ════════════════════════════════════════════════════════════════════
export function Page2({ customerName, date, p, sim }) {
  const kpis = [
    { l:'表面利回り',         v: fmtP(sim.grossY),      ok: sim.grossY>=6,  sub: '基準：6%以上' },
    { l:'実質利回り（NOI）',  v: fmtP(sim.noiY),         ok: sim.noiY>=4,    sub: '基準：4%以上' },
    { l:'IRR（内部収益率）',  v: fmtP(sim.irr),          ok: sim.irr>=5,     sub: '基準：5%以上' },
    { l:'CCR（自己資金利回）', v: fmtP(sim.ccr),          ok: sim.ccr>=5,     sub: '基準：5%以上' },
    { l:'DSCR（返済余裕率）', v: sim.dscr.toFixed(2),    ok: sim.dscr>=1.2,  sub: '基準：1.20以上' },
    { l:'LTV（融資比率）',    v: fmtP(sim.ltv),          ok: sim.ltv<=70,    sub: '基準：70%以下' },
    { l:'CF回収期間',         v: sim.pbp ? `${sim.pbp}年` : '未回収', ok: !!(sim.pbp&&sim.pbp<=p.holdYrs), sub: '保有期間内回収' },
    { l:`${p.holdYrs}年 実質負担額`, v:`${sim.netBurden<=0?'−':'+'}${fmtOku(Math.abs(sim.netBurden))}`, ok: sim.netBurden<=0, sub:'マイナス＝プラスリターン' },
  ]

  return (
    <Page>
      <PageHeader customerName={customerName} pageNo={2} pageTotal={3} subtitle="投資指標サマリ"/>

      <div style={{ padding: '20px 36px 50px' }}>

        {/* KPI グリッド */}
        <SecTitle label="投資指標" en="INVESTMENT KPIs"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
          {kpis.map(k=><KpiCard key={k.l} label={k.l} value={k.v} ok={k.ok} sub={k.sub}/>)}
        </div>

        {/* 投資収益詳細 */}
        <SecTitle label="投資収益詳細" en="FINANCIAL SUMMARY"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: T.navy, background: T.gray1, padding:'5px 8px', marginBottom: 2 }}>
              投資・資金計画
            </div>
            <TR label="総投資額"           value={fmtOku(sim.totalInvest)} bold/>
            <TR label="うち 自己資金"      value={fmtM(p.equity)} highlight/>
            <TR label="うち 借入金額"      value={fmtOku(sim.loan)}/>
            <TR label="月次返済額"         value={`${sim.monthPay?.toFixed(1)}万円 / 月`} highlight/>
            <TR label="年間返済額（初年）" value={fmtM(sim.yr1?.annPay||0)}/>
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: T.navy, background: T.gray1, padding:'5px 8px', marginBottom: 2 }}>
              収益・出口シナリオ
            </div>
            <TR label="初年度 NOI"              value={fmtM(sim.yr1?.noi||0)} bold/>
            <TR label={`${p.holdYrs}年 CF累計`} value={fmtM(sim.last?.cum||0)} highlight/>
            <TR label="売却想定価格"             value={fmtOku(sim.exitPrice)}/>
            <TR label="売却手取り（税・残債後）" value={fmtM(sim.exitNet)} highlight/>
            <TR label="節税累計（損益通算）"     value={`＋${fmtM(sim.taxSavingSum)}`}/>
          </div>
        </div>

        {/* 不動産鑑定3手法 */}
        <SecTitle label="不動産鑑定評価（3手法）" en="PROPERTY VALUATION"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
          {[
            { no:'①', name:'原価法',       value: sim.costApproach,   color: T.blueL, desc:`土地 ＋ 建物再調達原価 × (1 − 経年減点率)`, note:'担保・保険評価で主に使用' },
            { no:'②', name:'収益還元法',   value: sim.incomeApproach, color: '#6B3FA0', desc:`NOI ÷ 売却想定利回り（${p.exitYield}%）`, note:'投資家・売買で最重視' },
            ...(sim.compApproach!=null ? [{ no:'③', name:'取引事例比較法', value: sim.compApproach, color: T.green, desc:`成約事例の平均`, note:'近隣市場実態を反映' }] : []),
          ].map(item=>(
            <div key={item.no} style={{
              border: `1px solid ${item.color}33`,
              borderTop: `3px solid ${item.color}`,
              borderRadius: 4, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 8.5, color: T.sub, marginBottom: 4 }}>{item.no} {item.name}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: item.color, marginBottom: 5 }}>{fmtOku(item.value)}</div>
              <div style={{ fontSize: 7.5, color: T.sub, background: T.gray1, padding:'2px 6px', borderRadius:2, marginBottom:3 }}>{item.desc}</div>
              <div style={{ fontSize: 7.5, color: T.gray4 }}>{item.note}</div>
            </div>
          ))}
        </div>

        {/* 税務概算 */}
        <SecTitle label="税務概算" en="TAX ESTIMATION"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: 10 }}>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: T.navy, background: T.gray1, padding:'5px 8px', marginBottom: 2 }}>
              保有期間中の節税効果
            </div>
            <TR label="減価償却費（年間）"       value={`${fmtM(sim.deprAnnual)} / 年`}/>
            <TR label={`${p.holdYrs}年 節税累計`} value={`＋${fmtM(sim.taxSavingSum)}`} bold highlight/>
          </div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: T.navy, background: T.gray1, padding:'5px 8px', marginBottom: 2 }}>
              初期・売却時の諸税
            </div>
            <TR label="不動産取得税（概算）"  value={fmtM(sim.acqTax)}/>
            <TR label="登録免許税（概算）"    value={fmtM(sim.regTax)} highlight/>
            <TR label="売却時 譲渡税（概算）" value={fmtM(sim.transferTax)}/>
            <TR label="売却時 仲介手数料"     value={fmtM(sim.exitBrokFee)} highlight/>
          </div>
        </div>
      </div>

      <Footer date={date} pageNo={2} pageTotal={3}/>
    </Page>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE 3 ── 年次収支シミュレーション
// ════════════════════════════════════════════════════════════════════
export function Page3({ customerName, date, p, sim }) {
  const rows = sim.rows || []

  const candidates = [1,2,3,5,7,10,12,15,18,20,25,30,35,40,50]
  const displayYears = candidates.filter(y=>y<=p.holdYrs)
  if (!displayYears.includes(p.holdYrs)) displayYears.push(p.holdYrs)
  const displayRows = rows.filter(r=>displayYears.includes(r.year))

  const cols = [
    { key:'totalInc',  label:'総収入',       signed:false, bold:false },
    { key:'totalCost', label:'費用計',        signed:false, bold:false, neg:true },
    { key:'noi',       label:'NOI',          signed:true,  bold:true  },
    { key:'annPay',    label:'年間返済',      signed:false, bold:false, neg:true },
    { key:'cfAD',      label:'年次CF',       signed:true,  bold:true  },
    { key:'cum',       label:'累計CF',       signed:true,  bold:true  },
    { key:'bal',       label:'残債残高',     signed:false, bold:false },
    { key:'incVal',    label:'収益還元価値', signed:false, bold:false },
    { key:'nw',        label:'ネットWS',    signed:true,  bold:true  },
    { key:'taxSaving', label:'節税額',       signed:false, bold:false },
  ]

  return (
    <Page>
      <PageHeader customerName={customerName} pageNo={3} pageTotal={3} subtitle="年次収支シミュレーション"/>

      <div style={{ padding: '20px 36px 50px' }}>

        <SecTitle label="年次収支シミュレーション" en="ANNUAL CASH FLOW SIMULATION"/>
        <div style={{ fontSize: 8.5, color: T.sub, marginBottom: 10 }}>
          単位：万円　🔧 大規模修繕実施年　◆ 累計CF回収完了年
        </div>

        {/* テーブル */}
        <table style={{ borderCollapse:'collapse', width:'100%', fontSize: 8, marginBottom: 20 }}>
          <thead>
            <tr>
              <th style={{
                background: T.navy, color: T.white,
                padding: '6px 8px', textAlign:'left', fontSize: 8.5, fontWeight: 600,
                borderRight: `1px solid rgba(255,255,255,0.2)`, whiteSpace:'nowrap',
              }}>項目</th>
              {displayRows.map(r=>{
                const prev = rows[r.year-2]
                const recovered = r.cum>=0 && (!prev||prev.cum<0)
                return (
                  <th key={r.year} style={{
                    background: r.majorR>0 ? '#243B5A' : T.navy,
                    color: T.white,
                    padding: '6px 5px', textAlign:'right', fontSize: 8.5, fontWeight: 600,
                    borderRight: `1px solid rgba(255,255,255,0.15)`, whiteSpace:'nowrap',
                  }}>
                    {r.year}年
                    {r.majorR>0 && <span style={{fontSize:6.5,display:'block',color:'#FCD34D'}}>🔧</span>}
                    {recovered && <span style={{fontSize:6.5,display:'block',color:'#6EE7B7'}}>◆</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {cols.map((col,ci)=>(
              <tr key={col.key} style={{ background: ci%2===0 ? T.white : T.gray1 }}>
                <td style={{
                  padding: '4px 8px',
                  fontWeight: col.bold ? 700 : 400,
                  color: col.bold ? T.navy : T.sub,
                  borderBottom: `1px solid ${T.gray2}`,
                  borderRight: `1px solid ${T.gray2}`,
                  whiteSpace: 'nowrap', fontSize: 8.5,
                  background: col.bold ? '#EBF1FA' : (ci%2===0 ? T.white : T.gray1),
                }}>{col.label}</td>
                {displayRows.map(r=>{
                  const val = r[col.key] ?? 0
                  const color = col.signed ? (val>=0?T.green:T.red) : col.neg ? T.amber : T.text
                  return (
                    <td key={r.year} style={{
                      padding: '4px 5px', textAlign:'right',
                      color, fontWeight: col.bold ? 700 : 400,
                      borderBottom: `1px solid ${T.gray2}`,
                      borderRight: `0.5px solid ${T.gray2}`, fontSize: 8,
                      background: col.bold ? '#EBF1FA' : (ci%2===0 ? T.white : T.gray1),
                    }}>
                      {val===0 && !col.signed
                        ? <span style={{color:T.gray3}}>—</span>
                        : R(val).toLocaleString()
                      }
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* CF推移ミニサマリ */}
        <SecTitle label="キャッシュフロー推移概要" en="CASH FLOW TIMELINE"/>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(displayRows.length,8)},1fr)`, gap: 8, marginBottom: 18 }}>
          {displayRows.slice(0,8).map(r=>{
            const cfOk  = r.cfAD >= 0
            const cumOk = r.cum  >= 0
            return (
              <div key={r.year} style={{
                border: `1px solid ${T.gray2}`,
                borderTop: `3px solid ${cumOk?T.green:T.blueL}`,
                borderRadius: 4, padding: '7px 8px', textAlign:'center',
              }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: T.navy, marginBottom: 5 }}>{r.year}年目</div>
                <div style={{ fontSize: 7.5, color: T.sub }}>年次CF</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: cfOk?T.green:T.red }}>
                  {cfOk?'＋':'－'}{Math.abs(R(r.cfAD)).toLocaleString()}
                </div>
                <div style={{ height:1, background:T.gray2, margin:'4px 0' }}/>
                <div style={{ fontSize: 7.5, color: T.sub }}>累計CF</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: cumOk?T.green:T.red }}>
                  {cumOk?'＋':'－'}{Math.abs(R(r.cum)).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>

        {/* 免責事項 */}
        <div style={{
          background: T.gray1,
          border: `1px solid ${T.gray2}`,
          borderRadius: 4,
          padding: '8px 12px',
          fontSize: 7.5, color: T.gray4, lineHeight: 1.7,
        }}>
          <strong style={{color:T.sub}}>【免責事項】</strong>
          本シミュレーション資料は一般的な条件に基づく概算・参考値であり、将来の収益を保証するものではありません。
          実際の収支・税額は物件の状況・立地・金融機関の審査条件・税法改正・市場環境等により大きく異なる場合があります。
          本資料の数値のみを根拠とした投資判断はお控えください。投資判断に際しては税理士・ファイナンシャルプランナー等の専門家へのご相談を強く推奨いたします。
        </div>
      </div>

      <Footer date={date} pageNo={3} pageTotal={3} note="Apartment Investment Simulation — Confidential"/>
    </Page>
  )
}

// 後方互換エクスポート（PCSim.jsx から Page4 も import している場合に備えて）
export const Page4 = Page3

// ─── 不動産購入資金明細 PDF ────────────────────────────────────────
export function PurchasePDFPage({ pd, landBuildYen }) {
  const miscNum  = (pd.miscItems  || []).filter(i => !i.isJitsu).reduce((s, i) => s + (i.amount || 0), 0)
  const bankNum  = (pd.bankItems  || []).filter(i => !i.isJitsu).reduce((s, i) => s + (i.amount || 0), 0)
  const otherNum = (pd.otherItems || []).filter(i => !i.isJitsu).reduce((s, i) => s + (i.amount || 0), 0)
  const grandTotal = landBuildYen + miscNum + bankNum + otherNum

  const fmt = v => (v || 0).toLocaleString()

  const baseTd = {borderBottom:"1px solid #D8DEE8", verticalAlign:"middle"}

  const SectionHd = ({ label }) => (
    <tr>
      <td colSpan={3} style={{...baseTd, background:"#EEF2F7", padding:"6px 14px", fontSize:11.5, fontWeight:700, color:"#1B3F6B", borderBottom:"1px solid #C5CDD8"}}>
        {label}
      </td>
    </tr>
  )

  const ItemRow = ({ label, amount, note, isJitsu, isConsumeTax }) => (
    <tr>
      <td style={{...baseTd, padding:"7px 14px 7px 24px", fontSize:12, color:"#2D3748", width:"38%"}}>{label}</td>
      <td style={{...baseTd, padding:"7px 14px", fontSize:12, textAlign:"right", color:"#1A2535", width:"25%"}}>
        {isConsumeTax ? <span style={{fontSize:11, color:"#555"}}>{note}</span>
          : isJitsu   ? <span style={{fontSize:11, color:"#666"}}>実費</span>
          : fmt(amount)}
      </td>
      <td style={{...baseTd, padding:"7px 14px", fontSize:11, color:"#64748B", width:"37%"}}>
        {isConsumeTax ? "" : note}
      </td>
    </tr>
  )

  const SubtotalRow = ({ amount, note }) => (
    <tr style={{background:"#F5F7FA"}}>
      <td style={{...baseTd, padding:"6px 14px 6px 24px", fontWeight:700, fontSize:12, color:"#1B3F6B"}} colSpan={1}>小計</td>
      <td style={{...baseTd, padding:"6px 14px", fontWeight:700, fontSize:12, textAlign:"right", color:"#1B3F6B"}}>{fmt(amount)}</td>
      <td style={{...baseTd, padding:"6px 14px", fontSize:11, color:"#64748B"}}>{note || "（概算）"}</td>
    </tr>
  )

  return (
    <div style={{width:W, minHeight:H, background:"#fff", fontFamily:FF, color:"#1A2535", padding:"52px 60px 48px", boxSizing:"border-box"}}>

      {/* タイトル */}
      <h1 style={{textAlign:"center", fontSize:22, fontWeight:700, color:T.navy, marginBottom:28, letterSpacing:"0.12em", borderBottom:`3px solid ${T.gold}`, paddingBottom:14}}>
        不動産購入資金明細
      </h1>

      {/* 物件名・日付 */}
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:20, alignItems:"baseline"}}>
        <div style={{fontSize:14, fontWeight:700, color:T.navy}}>【{pd.propertyName || "　　　　　　　　　　"}】</div>
        <div style={{fontSize:12, color:T.sub}}>{pd.date || ""}</div>
      </div>

      {/* テーブル */}
      <table style={{width:"100%", borderCollapse:"collapse", border:"1px solid #C5CDD8", fontSize:12}}>
        <thead>
          <tr style={{background:T.navy}}>
            <th style={{padding:"9px 14px", color:"#fff", fontSize:12, textAlign:"left", fontWeight:600}}>項目</th>
            <th style={{padding:"9px 14px", color:"#fff", fontSize:12, textAlign:"right", fontWeight:600}}>金額（円）</th>
            <th style={{padding:"9px 14px", color:"#fff", fontSize:12, textAlign:"left", fontWeight:600}}>備考</th>
          </tr>
        </thead>
        <tbody>
          {/* 購入費内訳 */}
          <SectionHd label="購入費内訳" />
          <ItemRow label="土地建物購入費" amount={landBuildYen} note="" isJitsu={false} isConsumeTax={false}/>
          <ItemRow label="消費税" amount={0} note={pd.taxNote || "本体工事費に含む"} isJitsu={false} isConsumeTax={true}/>
          <SubtotalRow amount={landBuildYen} note=""/>

          {/* 諸費用内訳 */}
          <SectionHd label="諸費用内訳" />
          {(pd.miscItems || []).map((i,idx) => <ItemRow key={i.id||idx} label={i.label} amount={i.amount} note={i.note} isJitsu={i.isJitsu}/>)}
          <SubtotalRow amount={miscNum}/>

          {/* 銀行費用内訳 */}
          <SectionHd label="銀行費用内訳" />
          {(pd.bankItems || []).map((i,idx) => <ItemRow key={i.id||idx} label={i.label} amount={i.amount} note={i.note} isJitsu={i.isJitsu}/>)}
          <SubtotalRow amount={bankNum}/>

          {/* その他 */}
          {(pd.otherItems || []).length > 0 && <>
            <SectionHd label="その他" />
            {(pd.otherItems || []).map((i,idx) => <ItemRow key={i.id||idx} label={i.label} amount={i.amount} note={i.note} isJitsu={i.isJitsu}/>)}
          </>}

          {/* 合計 */}
          <tr style={{background:T.navy}}>
            <td style={{padding:"13px 14px", color:"#fff", fontWeight:700, fontSize:15, letterSpacing:"0.2em"}}>合　計</td>
            <td style={{padding:"13px 14px", color:"#FFD700", fontWeight:700, fontSize:15, textAlign:"right"}}>{fmt(grandTotal)}</td>
            <td style={{padding:"13px 14px", color:"#93C5FD", fontSize:11}}>（概算）</td>
          </tr>
        </tbody>
      </table>

      {/* 会社情報 */}
      <div style={{marginTop:36, textAlign:"right", fontSize:12, lineHeight:2, color:T.sub}}>
        <div style={{fontWeight:700, color:T.navy}}>{pd.company || ""}</div>
        <div>{pd.address || ""}</div>
        {pd.tel && <div>ＴＥＬ　{pd.tel}</div>}
      </div>
    </div>
  )
}
