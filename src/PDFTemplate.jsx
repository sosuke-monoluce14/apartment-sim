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

// ─── 共通フォント設定 ─────────────────────────────────────────────
const FF = "'Noto Sans JP','Hiragino Kaku Gothic ProN','Meiryo',sans-serif"

// ─── 数値フォーマット ─────────────────────────────────────────────
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
    lineHeight: 1.7,
    boxSizing: 'border-box',
    position: 'relative',
    ...style,
  }}>
    {children}
  </div>
)

// ─── ページヘッダーバー（P2〜P4用） ──────────────────────────────
const PageHeader = ({ customerName, pageNo, pageTotal, subtitle }) => (
  <div style={{ background: T.navy, padding: '14px 40px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <div>
        <div style={{ fontSize: 9, color: T.gray3, letterSpacing: '0.15em', marginBottom: 3 }}>
          APARTMENT INVESTMENT PROPOSAL
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.white }}>
          {customerName} 様
          <span style={{ fontSize: 11, fontWeight: 400, color: T.gray3, marginLeft: 12 }}>{subtitle}</span>
        </div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontSize: 9, color: T.gray3 }}>— {pageNo} / {pageTotal} —</div>
      </div>
    </div>
  </div>
)

// ─── セクションタイトル ───────────────────────────────────────────
const SecTitle = ({ label, en }) => (
  <div style={{ marginBottom: 14, marginTop: 4 }}>
    <div style={{ display:'flex', alignItems:'baseline', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.navy }}>{label}</div>
      <div style={{ fontSize: 9, color: T.gray4, letterSpacing: '0.1em' }}>{en}</div>
    </div>
    <div style={{ height: 1, background: `linear-gradient(to right, ${T.blue}, ${T.gray2})`, marginTop: 5 }}/>
  </div>
)

// ─── テーブル行 ───────────────────────────────────────────────────
const TR = ({ label, value, bold, highlight }) => (
  <div style={{
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding: '5px 10px',
    background: highlight ? T.gray1 : 'transparent',
    borderBottom: `1px solid ${T.gray2}`,
  }}>
    <span style={{ fontSize: 10, color: T.sub }}>{label}</span>
    <span style={{ fontSize: 11, fontWeight: bold ? 700 : 400, color: T.text }}>{value}</span>
  </div>
)

// ─── KPIカード ────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, ok, large }) => {
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
      padding: '10px 12px',
    }}>
      <div style={{ fontSize: 9, color: T.sub, marginBottom: 4, fontWeight: 600, letterSpacing:'0.03em' }}>{label}</div>
      <div style={{ fontSize: large ? 22 : 18, fontWeight: 700, color: col, lineHeight: 1.2 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 8, color: col, marginTop: 4 }}>{mark} {sub}</div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE 1 ── 表紙
// ════════════════════════════════════════════════════════════════════
export function Page1({ customerName, date, p, sim }) {
  const totalInvest = p.buildCost + (p.hasLand?0:p.landCost) + p.otherCost

  return (
    <Page>
      {/* 上部カラーバンド */}
      <div style={{ height: 8, background: `linear-gradient(to right, ${T.navy}, ${T.blueL})` }}/>

      {/* ゴールドライン */}
      <div style={{ height: 2, background: T.gold }}/>

      {/* メインエリア */}
      <div style={{ padding: '60px 60px 40px' }}>

        {/* 書類種別 */}
        <div style={{
          display: 'inline-block',
          background: T.navy,
          color: T.white,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.2em',
          padding: '5px 16px',
          marginBottom: 40,
        }}>
          APARTMENT INVESTMENT PROPOSAL
        </div>

        {/* タイトル */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 8, letterSpacing: '0.05em' }}>
            収支シミュレーションシート
          </div>
          <div style={{
            fontSize: 34,
            fontWeight: 700,
            color: T.navy,
            letterSpacing: '0.02em',
            lineHeight: 1.3,
            borderLeft: `5px solid ${T.gold}`,
            paddingLeft: 18,
          }}>
            アパート一棟建て<br/>
            投資収支シミュレーション
          </div>
        </div>

        {/* お客様名 */}
        <div style={{
          marginTop: 50,
          paddingBottom: 12,
          borderBottom: `1px solid ${T.gray2}`,
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
        }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.navy }}>{customerName} 様</div>
        </div>

        {/* 物件概要バッジ */}
        <div style={{ display:'flex', gap: 10, marginTop: 16, flexWrap:'wrap' }}>
          {[
            `📍 ${p.pref} ${p.city}`,
            `🏗 ${STRUCT[p.structure]||'木造'}`,
            `🏠 ${sim.totalUnits}戸`,
            `💴 総投資額 ${fmtOku(totalInvest)}`,
            `📅 保有期間 ${p.holdYrs}年`,
          ].map(t=>(
            <div key={t} style={{
              background: T.gray1,
              border: `1px solid ${T.gray2}`,
              borderRadius: 3,
              padding: '4px 12px',
              fontSize: 10,
              color: T.sub,
            }}>{t}</div>
          ))}
        </div>

        {/* メインサマリボックス */}
        <div style={{
          marginTop: 48,
          background: T.navy,
          borderRadius: 6,
          padding: '28px 36px',
          color: T.white,
        }}>
          <div style={{ fontSize: 10, color: T.gray3, letterSpacing: '0.1em', marginBottom: 6 }}>
            INVESTMENT SUMMARY
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap: 0 }}>
            {[
              { l:'表面利回り', v: fmtP(sim.grossY), ok: sim.grossY>=6 },
              { l:'IRR（内部収益率）', v: fmtP(sim.irr), ok: sim.irr>=5 },
              { l:'DSCR（返済余裕率）', v: sim.dscr.toFixed(2), ok: sim.dscr>=1.2 },
              { l:`${p.holdYrs}年 実質負担額`, v:`${sim.netBurden<=0?'−':'+'}${fmtOku(Math.abs(sim.netBurden))}`, ok:sim.netBurden<=0 },
            ].map((k,i)=>(
              <div key={k.l} style={{
                padding: '12px 20px',
                borderRight: i<3 ? `1px solid rgba(255,255,255,0.15)` : 'none',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, color: T.gray3, marginBottom: 6 }}>{k.l}</div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: k.ok ? '#5BE58A' : '#F87171',
                }}>{k.v}</div>
                <div style={{ fontSize: 8, color: k.ok ? '#5BE58A' : '#F87171', marginTop: 4 }}>
                  {k.ok ? '◎ 基準達成' : '▲ 要確認'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 実質負担額ハイライト */}
        <div style={{
          marginTop: 20,
          padding: '16px 24px',
          background: sim.netBurden<=0 ? T.greenL : T.redL,
          border: `1px solid ${sim.netBurden<=0 ? T.green : T.red}33`,
          borderLeft: `4px solid ${sim.netBurden<=0 ? T.green : T.red}`,
          borderRadius: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 3 }}>
              {p.holdYrs}年保有後の最終的な持ち出し（CF累計＋売却手取り反映済み）
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: sim.netBurden<=0 ? T.green : T.red }}>
              {sim.netBurden<=0 ? '−' : '＋'} {fmtOku(Math.abs(sim.netBurden))}
            </div>
          </div>
          <div style={{ fontSize: 32 }}>{sim.netBurden<=0 ? '✅' : '⚠️'}</div>
        </div>
      </div>

      {/* フッター */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        borderTop: `1px solid ${T.gray2}`,
        padding: '12px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 9,
        color: T.gray4,
      }}>
        <div>作成日：{date}</div>
        <div style={{ fontSize: 8 }}>
          ※本資料は概算・参考値です。実際の収支は物件状況・金融機関審査・税法等により異なります。
        </div>
        <div>1 / 4</div>
      </div>

      {/* 下部カラーバンド */}
      <div style={{ height: 2, background: T.gold, position:'absolute', bottom: 40, left: 0, right: 0 }}/>
    </Page>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE 2 ── 投資指標サマリ
// ════════════════════════════════════════════════════════════════════
export function Page2({ customerName, date, p, sim }) {
  const kpis = [
    { l:'表面利回り',         v: fmtP(sim.grossY),               ok: sim.grossY>=6,       sub: `基準：6%以上` },
    { l:'実質利回り（NOI）',  v: fmtP(sim.noiY),                 ok: sim.noiY>=4,         sub: `基準：4%以上` },
    { l:'IRR（内部収益率）',  v: fmtP(sim.irr),                  ok: sim.irr>=5,          sub: `基準：5%以上` },
    { l:'CCR（自己資金利回）', v: fmtP(sim.ccr),                 ok: sim.ccr>=5,          sub: `基準：5%以上` },
    { l:'DSCR（返済余裕率）', v: sim.dscr.toFixed(2),            ok: sim.dscr>=1.2,       sub: `基準：1.20以上` },
    { l:'LTV（融資比率）',    v: fmtP(sim.ltv),                  ok: sim.ltv<=70,         sub: `基準：70%以下` },
    { l:'CF回収期間',         v: sim.pbp ? `${sim.pbp}年` : '未回収', ok: !!(sim.pbp&&sim.pbp<=p.holdYrs), sub: `保有期間内回収` },
    { l:`${p.holdYrs}年 実質負担額`, v:`${sim.netBurden<=0?'−':'+'}${fmtOku(Math.abs(sim.netBurden))}`, ok:sim.netBurden<=0, sub:'マイナス＝プラスリターン' },
  ]

  return (
    <Page>
      <PageHeader customerName={customerName} pageNo={2} pageTotal={4} subtitle="投資指標サマリ"/>

      <div style={{ padding: '24px 40px 20px' }}>

        {/* KPI グリッド */}
        <SecTitle label="投資指標" en="INVESTMENT KPIs"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap: 10, marginBottom: 28 }}>
          {kpis.map(k=><KpiCard key={k.l} label={k.l} value={k.v} ok={k.ok} sub={k.sub}/>)}
        </div>

        {/* 投資収益詳細 */}
        <SecTitle label="投資収益詳細" en="FINANCIAL SUMMARY"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, marginBottom: 24 }}>
          {/* 左: 投資・資金 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, marginBottom: 8, background: T.gray1, padding:'5px 10px' }}>
              投資・資金計画
            </div>
            <TR label="総投資額"          value={fmtOku(sim.totalInvest)} bold/>
            <TR label="うち 自己資金"     value={fmtM(p.equity)} highlight/>
            <TR label="うち 借入金額"     value={fmtOku(sim.loan)}/>
            <TR label="月次返済額"        value={`${sim.monthPay?.toFixed(1)}万円 / 月`} highlight/>
            <TR label="年間返済額（初年）" value={fmtM(sim.yr1?.annPay||0)}/>
          </div>
          {/* 右: 収益・出口 */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, marginBottom: 8, background: T.gray1, padding:'5px 10px' }}>
              収益・出口シナリオ
            </div>
            <TR label="初年度 NOI"            value={fmtM(sim.yr1?.noi||0)} bold/>
            <TR label={`${p.holdYrs}年 CF累計`}  value={fmtM(sim.last?.cum||0)} highlight/>
            <TR label="売却想定価格"          value={fmtOku(sim.exitPrice)}/>
            <TR label="売却手取り（税・残債後）" value={fmtM(sim.exitNet)} highlight/>
            <TR label="節税累計（損益通算）"  value={`＋${fmtM(sim.taxSavingSum)}`}/>
          </div>
        </div>

        {/* 不動産鑑定3手法 */}
        <SecTitle label="不動産鑑定評価（3手法）" en="PROPERTY VALUATION"/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { no:'①', name:'原価法',       value: sim.costApproach,   color: T.blueL, desc:'土地価格＋建物再調達原価×(1−経年減点率)', note:'担保・保険評価で主に使用' },
            { no:'②', name:'収益還元法',   value: sim.incomeApproach, color: '#6B3FA0', desc:`NOI ÷ 売却想定利回り（${p.exitYield}%）`, note:'投資家・売買で最重視される評価' },
            ...(sim.compApproach!=null ? [{ no:'③', name:'取引事例比較法', value: sim.compApproach, color: T.green, desc:`成約事例 ${p.comparables?.length||0}件の平均`, note:'近隣市場実態を直接反映' }] : []),
          ].map(item=>(
            <div key={item.no} style={{
              border: `1px solid ${item.color}33`,
              borderTop: `3px solid ${item.color}`,
              borderRadius: 4,
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: 9, color: T.sub, marginBottom: 4 }}>{item.no} {item.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: item.color, marginBottom: 6 }}>{fmtOku(item.value)}</div>
              <div style={{ fontSize: 8, color: T.sub, background: T.gray1, padding:'2px 6px', borderRadius:2, marginBottom:4, fontFamily:'monospace' }}>{item.desc}</div>
              <div style={{ fontSize: 8, color: T.gray4 }}>{item.note}</div>
            </div>
          ))}
        </div>

        {/* 税務概算 */}
        <SecTitle label="税務概算" en="TAX ESTIMATION"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, marginBottom: 8, background: T.gray1, padding:'5px 10px' }}>
              保有期間中の節税効果
            </div>
            <TR label="減価償却費（年間）"     value={`${fmtM(sim.deprAnnual)} / 年`}/>
            <TR label={`${p.holdYrs}年 節税累計`} value={`＋${fmtM(sim.taxSavingSum)}`} bold highlight/>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, marginBottom: 8, background: T.gray1, padding:'5px 10px' }}>
              初期・売却時の諸税
            </div>
            <TR label="不動産取得税（概算）"   value={fmtM(sim.acqTax)}/>
            <TR label="登録免許税（概算）"     value={fmtM(sim.regTax)} highlight/>
            <TR label="売却時 譲渡税（概算）"  value={fmtM(sim.transferTax)}/>
            <TR label="売却時 仲介手数料"      value={fmtM(sim.exitBrokFee)} highlight/>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div style={{
        borderTop: `1px solid ${T.gray2}`,
        padding: '10px 40px',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 8, color: T.gray4,
        position: 'absolute', bottom: 0, left: 0, right: 0,
      }}>
        <div>作成日：{date}</div>
        <div>※本資料は概算・参考値です。専門家へのご相談を推奨します。</div>
        <div>2 / 4</div>
      </div>
    </Page>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE 3 ── 物件概要・設定条件
// ════════════════════════════════════════════════════════════════════
export function Page3({ customerName, date, p, sim }) {
  return (
    <Page>
      <PageHeader customerName={customerName} pageNo={3} pageTotal={4} subtitle="物件概要・設定条件"/>

      <div style={{ padding: '24px 40px 20px' }}>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* 左列 */}
          <div>
            <SecTitle label="エリア・物件概要" en="PROPERTY OVERVIEW"/>
            <TR label="所在地"       value={`${p.pref} ${p.city}`} bold/>
            <TR label="建物構造"     value={`${STRUCT[p.structure]||'木造'}`} highlight/>
            <TR label="耐用年数"     value={`${p.structure==='wood'?22:p.structure==='steel'?27:47}年`}/>
            <TR label="土地"         value={p.hasLand ? '自己所有' : `取得（${fmtM(p.landCost)}）`} highlight/>
            <TR label="建築費"       value={fmtM(p.buildCost)} bold/>
            <TR label="諸費用"       value={fmtM(p.otherCost)} highlight/>
            <TR label="総投資額"     value={fmtOku(p.buildCost+(p.hasLand?0:p.landCost)+p.otherCost)} bold/>

            <div style={{ marginTop: 16 }}/>
            <SecTitle label="間取り・賃料" en="FLOOR PLAN & RENT"/>
            {p.rooms?.map((r,i)=>(
              <TR key={i} label={`${r.madori}（${r.count}戸）`} value={`${r.rent.toFixed(1)}万円 / 戸・月`} highlight={i%2===0}/>
            ))}
            <TR label="合計戸数"               value={`${sim.totalUnits}戸`} bold/>
            <TR label="満室時月収"             value={`${(sim.blendedRent*sim.totalUnits).toFixed(1)}万円 / 月`} highlight/>
            <TR label="満室時年収"             value={fmtM(sim.blendedRent*sim.totalUnits*12)} bold/>
            {p.parking>0 && <TR label="駐車場" value={`${p.parking}台 × ${p.parkRent}万円 / 月`} highlight/>}

            <div style={{ marginTop: 16 }}/>
            <SecTitle label="収益・稼働想定" en="REVENUE ASSUMPTIONS"/>
            <TR label="初年度入居率"  value={`${p.occInit}%`}/>
            <TR label="安定期入居率"  value={`${p.occ}%`} highlight/>
            <TR label="賃料下落率"    value={`${p.rentDecline}%/年`}/>
            <TR label="地価変動率"    value={`${p.landChg>=0?'+':''}${p.landChg}%/年`} highlight/>
          </div>

          {/* 右列 */}
          <div>
            <SecTitle label="資金計画" en="FINANCING PLAN"/>
            <TR label="自己資金"         value={fmtM(p.equity)} bold/>
            <TR label="借入金額"         value={fmtOku(sim.loan)} highlight/>
            <TR label="LTV（融資比率）"  value={fmtP(sim.ltv)}/>
            <TR label="借入金利"         value={`${p.loanRate}%`} highlight/>
            <TR label="返済期間"         value={`${p.loanYears}年`}/>
            <TR label="返済方式"         value={REPAY[p.repayType]||'元利均等返済'} highlight/>
            <TR label="月次返済額"       value={`${sim.monthPay?.toFixed(1)}万円 / 月`} bold/>
            {p.rateChgYr>0 && <TR label="金利変動シナリオ" value={`${p.rateChgYr}年目〜 ${p.rateAfter}%`} highlight/>}

            <div style={{ marginTop: 16 }}/>
            <SecTitle label="年間コスト設定" en="ANNUAL OPERATING COSTS"/>
            <TR label="管理委託費率"     value={`${p.mgmtRate}%（賃料収入比）`}/>
            <TR label="修繕積立（年間）" value={fmtM(p.repairRes)} highlight/>
            <TR label="固定資産税"       value={`${p.propTax}万円 / 年`}/>
            <TR label="火災保険料"       value={`${p.insure}万円 / 年`} highlight/>
            <TR label="共用部光熱費"     value={`${p.util}万円 / 年`}/>

            <div style={{ marginTop: 8 }}/>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.navy, marginBottom: 6, background: T.gray1, padding:'5px 10px' }}>
              大規模修繕計画
            </div>
            {p.majorRepairs?.length>0
              ? p.majorRepairs.map((r,i)=>(
                  <TR key={i} label={`${r.yr}年目 大規模修繕`} value={fmtM(r.cost)} highlight={i%2===0}/>
                ))
              : <div style={{ fontSize: 10, color: T.gray4, padding:'5px 10px' }}>計画なし</div>
            }

            <div style={{ marginTop: 16 }}/>
            <SecTitle label="出口・税務設定" en="EXIT STRATEGY"/>
            <TR label="保有期間"             value={`${p.holdYrs}年`} bold/>
            <TR label="売却想定利回り"       value={`${p.exitYield}%`} highlight/>
            <TR label="売却仲介手数料"       value={`${p.exitBrok}%`}/>
            <TR label="給与年収（節税計算）" value={`${p.salary}万円`} highlight/>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div style={{
        borderTop: `1px solid ${T.gray2}`,
        padding: '10px 40px',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 8, color: T.gray4,
        position: 'absolute', bottom: 0, left: 0, right: 0,
      }}>
        <div>作成日：{date}</div>
        <div>※本資料は概算・参考値です。専門家へのご相談を推奨します。</div>
        <div>3 / 4</div>
      </div>
    </Page>
  )
}

// ════════════════════════════════════════════════════════════════════
// PAGE 4 ── 年次収支シミュレーション
// ════════════════════════════════════════════════════════════════════
export function Page4({ customerName, date, p, sim }) {
  const rows = sim.rows || []

  // 表示年を選定（保有年数に応じて調整）
  const candidates = [1,2,3,5,7,10,12,15,18,20,25,30,35,40,50]
  const displayYears = candidates.filter(y=>y<=p.holdYrs)
  if (!displayYears.includes(p.holdYrs)) displayYears.push(p.holdYrs)
  const displayRows = rows.filter(r=>displayYears.includes(r.year))

  const cols = [
    { key:'totalInc',  label:'総収入',     signed:false, bold:false },
    { key:'totalCost', label:'費用計',     signed:false, bold:false, neg:true },
    { key:'noi',       label:'NOI',        signed:true,  bold:true  },
    { key:'annPay',    label:'年間返済',   signed:false, bold:false, neg:true },
    { key:'cfAD',      label:'年次CF',     signed:true,  bold:true  },
    { key:'cum',       label:'累計CF',     signed:true,  bold:true  },
    { key:'bal',       label:'残債残高',   signed:false, bold:false },
    { key:'incVal',    label:'収益還元価値', signed:false, bold:false },
    { key:'nw',        label:'ネットWS',  signed:true,  bold:true  },
    { key:'taxSaving', label:'節税額',     signed:false, bold:false },
  ]

  const numColor = (val, signed, neg) => {
    if (signed) return val >= 0 ? T.green : T.red
    if (neg) return T.amber
    return T.text
  }

  return (
    <Page>
      <PageHeader customerName={customerName} pageNo={4} pageTotal={4} subtitle="年次収支シミュレーション"/>

      <div style={{ padding: '24px 40px 50px' }}>
        <SecTitle label="年次収支シミュレーション" en="ANNUAL CASH FLOW SIMULATION"/>

        <div style={{ fontSize: 9, color: T.sub, marginBottom: 12 }}>
          単位：万円　🔧 大規模修繕実施年　◆ 累計CF回収完了年
        </div>

        {/* テーブル */}
        <div style={{ overflowX:'hidden', marginBottom: 20 }}>
          <table style={{ borderCollapse:'collapse', width:'100%', fontSize: 8.5 }}>
            <thead>
              <tr>
                <th style={{
                  background: T.navy, color: T.white,
                  padding: '7px 8px', textAlign:'left', fontSize: 9, fontWeight: 600,
                  borderRight: `1px solid rgba(255,255,255,0.2)`, whiteSpace:'nowrap',
                  position:'sticky', left:0,
                }}>項目</th>
                {displayRows.map(r=>{
                  const prev = rows[r.year-2]
                  const recovered = r.cum>=0 && (!prev||prev.cum<0)
                  return (
                    <th key={r.year} style={{
                      background: r.majorR>0 ? '#2A3F5F' : T.navy,
                      color: T.white,
                      padding: '7px 6px', textAlign:'right', fontSize: 9, fontWeight: 600,
                      borderRight: `1px solid rgba(255,255,255,0.15)`, whiteSpace:'nowrap',
                    }}>
                      {r.year}年
                      {r.majorR>0 && <span style={{fontSize:7,display:'block',color:'#FCD34D'}}>🔧</span>}
                      {recovered && <span style={{fontSize:7,display:'block',color:'#6EE7B7'}}>◆</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {cols.map((col,ci)=>(
                <tr key={col.key} style={{ background: ci%2===0 ? T.white : T.gray1 }}>
                  <td style={{
                    padding: '5px 8px',
                    fontWeight: col.bold ? 700 : 400,
                    color: col.bold ? T.navy : T.sub,
                    borderBottom: `1px solid ${T.gray2}`,
                    borderRight: `1px solid ${T.gray2}`,
                    whiteSpace: 'nowrap',
                    fontSize: 9,
                    background: col.bold ? '#EBF1FA' : (ci%2===0 ? T.white : T.gray1),
                  }}>{col.label}</td>
                  {displayRows.map(r=>{
                    const val = r[col.key] ?? 0
                    const color = numColor(val, col.signed, col.neg)
                    return (
                      <td key={r.year} style={{
                        padding: '5px 6px', textAlign:'right',
                        color, fontWeight: col.bold ? 700 : 400,
                        borderBottom: `1px solid ${T.gray2}`,
                        borderRight: `0.5px solid ${T.gray2}`,
                        fontSize: 8.5,
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
        </div>

        {/* CF推移ミニサマリ */}
        <SecTitle label="キャッシュフロー推移概要" en="CASH FLOW TIMELINE"/>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(displayRows.length,6)},1fr)`, gap: 8, marginBottom: 20 }}>
          {displayRows.slice(0,6).map(r=>{
            const cfOk  = r.cfAD >= 0
            const cumOk = r.cum  >= 0
            return (
              <div key={r.year} style={{
                border: `1px solid ${T.gray2}`,
                borderTop: `3px solid ${cumOk?T.green:T.blueL}`,
                borderRadius: 4, padding: '8px 10px', textAlign:'center',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.navy, marginBottom: 6 }}>{r.year}年目</div>
                <div style={{ fontSize: 8, color: T.sub }}>年次CF</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: cfOk?T.green:T.red }}>
                  {cfOk?'＋':'－'}{Math.abs(R(r.cfAD)).toLocaleString()}万
                </div>
                <div style={{ height:1, background:T.gray2, margin:'5px 0' }}/>
                <div style={{ fontSize: 8, color: T.sub }}>累計CF</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: cumOk?T.green:T.red }}>
                  {cumOk?'＋':'－'}{Math.abs(R(r.cum)).toLocaleString()}万
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
          padding: '10px 14px',
          fontSize: 8,
          color: T.gray4,
          lineHeight: 1.7,
        }}>
          <strong style={{color:T.sub}}>【免責事項】</strong>
          本シミュレーション資料は一般的な条件に基づく概算・参考値であり、将来の収益を保証するものではありません。
          実際の収支・税額は物件の状況・立地・金融機関の審査条件・税法改正・市場環境等により大きく異なる場合があります。
          本資料の数値のみを根拠とした投資判断はお控えください。投資判断に際しては税理士・ファイナンシャルプランナー等の
          専門家へのご相談を強く推奨いたします。
        </div>
      </div>

      {/* フッター */}
      <div style={{
        borderTop: `1px solid ${T.gray2}`,
        padding: '10px 40px',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 8, color: T.gray4,
        position: 'absolute', bottom: 0, left: 0, right: 0,
      }}>
        <div>作成日：{date}</div>
        <div>Apartment Investment Simulation — Confidential</div>
        <div>4 / 4</div>
      </div>
    </Page>
  )
}
