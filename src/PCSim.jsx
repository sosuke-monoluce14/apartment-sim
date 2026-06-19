import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { Page1, Page2, Page3, Page4, PurchasePDFPage } from "./PDFTemplate.jsx";
import { exportToPDF } from "./generatePDF.js";
import {
  LineChart, Line, BarChart, Bar, ComposedChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from "recharts";

// ── constants ──────────────────────────────────────────────────────
const MADORI = [
  { key:"1R",   label:"1R",   sqm:18, ref:6.0 },
  { key:"1K",   label:"1K",   sqm:25, ref:7.5 },
  { key:"1DK",  label:"1DK",  sqm:30, ref:8.5 },
  { key:"1LDK", label:"1LDK", sqm:40, ref:10.2 },
  { key:"2K",   label:"2K",   sqm:35, ref:9.0 },
  { key:"2DK",  label:"2DK",  sqm:45, ref:11.0 },
  { key:"2LDK", label:"2LDK", sqm:55, ref:13.5 },
  { key:"3DK",  label:"3DK",  sqm:60, ref:14.0 },
  { key:"3LDK", label:"3LDK", sqm:70, ref:16.0 },
];
const STRUCTURES = { wood:{label:"木造",life:22}, steel:{label:"軽鉄",life:27}, rc:{label:"RC造",life:47} };
const TAX_BRACKETS = [
  {max:1950000,  rate:0.05,deduct:0},
  {max:3300000,  rate:0.10,deduct:97500},
  {max:6950000,  rate:0.20,deduct:427500},
  {max:9000000,  rate:0.23,deduct:636000},
  {max:18000000, rate:0.33,deduct:1536000},
  {max:40000000, rate:0.40,deduct:2796000},
  {max:Infinity, rate:0.45,deduct:4796000},
];
const incDeduct = s => s<=1625000?550000:s<=1800000?s*0.4-100000:s<=3600000?s*0.3+80000:s<=6600000?s*0.2+440000:s<=8500000?s*0.1+1100000:1950000;
const calcTax = ti => { const b=TAX_BRACKETS.find(b=>ti<=b.max); return Math.max(0,ti*b.rate-b.deduct); };

const fmtM   = v => `${Math.round(v).toLocaleString()}万`;
const fmtOku = v => Math.abs(v)>=10000?`${(v/10000).toFixed(2)}億`:`${Math.round(v).toLocaleString()}万`;
const fmtP   = (v,d=1) => `${v.toFixed(d)}%`;
const R      = v => Math.round(v);

const C = {
  navy:"#1B3F6B", blue:"#2E75B6", green:"#166534", greenBg:"#F0FDF4",
  red:"#991B1B", amber:"#854F0B", purple:"#3C3489",
  gray:"#64748B", border:"#E2E8F0", slate:"#334155", light:"#F8FAFC",
};

const AREA_DATA = {
  "世田谷区":{ rent1K:7.7,rent1LDK:10.4,vacancy:6.5,landChgYoy:3.1 },
  "渋谷区":  { rent1K:10.5,rent1LDK:15.4,vacancy:5.2,landChgYoy:4.2 },
  "新宿区":  { rent1K:8.8,rent1LDK:12.8,vacancy:6.0,landChgYoy:3.5 },
  "港区":    { rent1K:14.5,rent1LDK:21.5,vacancy:4.0,landChgYoy:5.0 },
  "品川区":  { rent1K:8.2,rent1LDK:11.8,vacancy:6.8,landChgYoy:2.8 },
};


// ── 用語辞書（観点ベース） ──────────────────────────────────────────
const GLOSSARY = {
  "表面利回り": {
    en: "Gross Yield",
    formula: "年間賃料収入（満室想定）÷ 総投資額 × 100",
    what: "「この物件は投資額に対してどれだけ家賃を生むか」を示す最も基本的な数字です。ただし空室・管理費・税金は一切含まれていません。",
    howto: "物件同士を横並びで比べるときの第一段階として使います。同エリア・同規模の物件で表面利回りが大きく違う場合は「なぜ安いのか」を掘り下げるサインです。この数字だけで投資判断はしないでください。",
    caution: "表面利回りが高くても、実質利回りが低い物件は費用負担が重い可能性があります。必ずセットで確認してください。",
    bench: "6%以上が提案の最低ライン"
  },
  "実質利回り": {
    en: "Net Yield",
    formula: "（年間賃料収入 − 年間運営費用）÷ 総投資額 × 100",
    what: "管理費・修繕費・固定資産税・保険料などの費用を引いた後の、実際の稼ぎを示す数字です。「手元に残る収益」の利回りです。",
    howto: "表面利回りとの差が大きい物件は費用負担が重い証拠。差が2%以上ある場合は費用の内訳を投資家に丁寧に説明する必要があります。この数字が投資家にとっての「本当の利回り」です。",
    caution: "ローン返済はまだ引いていません。実質利回りがローン金利より低い場合、毎月のキャッシュフローはマイナスになります。",
    bench: "4%以上。ローン金利との差（イールドギャップ）が2%以上あると安定的"
  },
  "IRR": {
    en: "Internal Rate of Return（内部収益率）",
    formula: "毎年のCF＋最終年の売却手取りを含めてNPV＝0になる年利回り",
    what: "「この投資全体を通じると、自己資金を年率何%で運用したのと同じ結果になるか」を示します。毎年のキャッシュフローと最終的な売却益を両方まとめて一つの数字にしたものです。",
    howto: "「銀行預金は0.1%、この投資はIRR6%です」という形で他の運用手段と比較できます。投資家が「この投資は本当に割に合うか」を判断する際の最終的な拠り所になります。数字が高いほど良いですが、高すぎる場合は前提条件が楽観的すぎないか確認してください。",
    caution: "IRRは売却価格の想定に大きく左右されます。売却利回りを低く（＝高値売却）設定しすぎると、IRRが実態より良く見えます。",
    bench: "5%以上。8%を超えると投資家に非常に魅力的に映る水準"
  },
  "CCR": {
    en: "Cash on Cash Return（自己資金配当率）",
    formula: "年間キャッシュフロー（ローン返済後）÷ 自己資金 × 100",
    what: "「今年、自分が出したお金に対して何%のキャッシュが戻ってきたか」を示します。毎年の現金の効率を測る指標です。",
    howto: "自己資金が少ないほど（レバレッジが高いほど）CCRは高くなります。「自己資金3,000万で年間150万の手取り＝CCR5%」のように、投資家が「毎年いくら手に入るか」を実感しやすい形で伝えられます。IRRが「20年後も含めた総合評価」なら、CCRは「今年の成績表」です。",
    caution: "CCRが高くてもDSCRが低い（返済余裕がない）場合は危険。空室が増えたとたんに返済が厳しくなります。",
    bench: "5%以上。自己資金に対して年5%以上のキャッシュが戻る水準"
  },
  "DSCR": {
    en: "Debt Service Coverage Ratio（返済余裕率）",
    formula: "NOI（純営業利益）÷ 年間ローン返済額",
    what: "「家賃収入でローンの何倍まで余裕があるか」を示します。1.0だとぴったり。1.2だと20%の余裕がある状態です。",
    howto: "融資の審査では1.2以上が一般的な基準です。提案時に「DSCRは1.3で、空室が10%増えても返済に影響ありません」という形で安全性を説明できます。この数字が低い物件は、金利上昇や空室増加が直接ローン返済に響くリスクがあります。",
    caution: "1.0を下回ると家賃収入だけでは返済できません。自己資金を毎月補填する必要が生じます。",
    bench: "1.2以上が融資の一般基準。1.3以上あると安心感を持って提案できる"
  },
  "LTV": {
    en: "Loan to Value（融資比率）",
    formula: "借入金額 ÷ 総投資額 × 100",
    what: "「総投資額のうち、借りたお金が何%を占めているか」を示します。自己資金の割合が少ないほどLTVは高くなります。",
    howto: "LTVが高い＝レバレッジが大きい＝少ない自己資金で大きな投資ができる一方、リスクも大きくなります。金融機関は通常70〜80%を上限として融資審査を行います。投資家が「自己資金をどれだけ温存して別の投資に回せるか」を考える際の基準になります。",
    caution: "LTVが高いほど金利変動の影響を強く受けます。将来の金利上昇シナリオと組み合わせて必ず確認してください。",
    bench: "70%以下が安全圏。80%超は金融機関の審査が通りにくくなるケースが多い"
  },
  "回収期間": {
    en: "Payback Period",
    formula: "毎年の手取りCFを積み上げていき、自己資金の投入額を上回った年",
    what: "「自分が最初に出したお金を、毎年の家賃収入（返済後）だけで何年後に取り戻せるか」を示します。売却収入は含みません。",
    howto: "「15年で回収できます」は投資家にとってわかりやすいリターンの説明になります。ただし、回収期間が短い＝毎年のCFが大きいということなので、DSCRや実質利回りと合わせて確認してください。回収後の年数が「純粋な利益期間」になります。",
    caution: "回収期間だけを見て判断しないでください。売却タイミングや資産価値の変化を合わせて見ることが重要です。",
    bench: "15〜20年以内が目安。保有期間内に回収できているか確認"
  },
  "NOI": {
    en: "Net Operating Income（純営業利益）",
    formula: "総収入 − 管理費・修繕費・固定資産税・保険料等の運営費用",
    what: "「ローン返済を引く前の、物件そのものの稼ぎ」です。借り入れ条件に関係なく、物件自体の収益力を純粋に表します。",
    howto: "NOIは融資条件や自己資金の多寡に左右されないため、物件同士の収益力を比較するときに使います。また金融機関はこの数字をベースにDSCRを計算して融資審査を行います。「物件の体力」を示す数字として、提案の核心に置いてください。",
    caution: "NOIが高くても、それがローン返済額を大きく上回らないと手元には残りません。NOIとローン返済額の差が実際のCFです。",
    bench: "明確な基準値はないが、年間ローン返済額の1.2倍以上あることが望ましい"
  },
  "収益還元法": {
    en: "Income Approach",
    formula: "NOI ÷ 想定売却利回り",
    what: "「この物件が生む収益をもとに、買い手はいくらの価値があると判断するか」を算出する鑑定手法です。投資用不動産の売買で最も重視される考え方です。",
    howto: "売却時に買い手が提示する価格はほぼこの計算式で決まります。売却利回りを下げると（＝買い手が低い利回りでも買う）高値売却になり、上げると安値になります。「将来いくらで売れるか」を投資家と話すときの共通言語として使ってください。",
    caution: "売却利回りの想定が楽観的すぎると、計算上の売却価格が現実より高くなります。エリアの相場利回りと比較して妥当な数字を設定することが重要です。",
    bench: "収益還元価値が残債を大きく上回っている状態が理想"
  },
  "原価法": {
    en: "Cost Approach",
    formula: "土地価格 ＋ 建物の再調達費用 × (1 − 経年減点率)",
    what: "「もし今この物件を1から建てたとしたらいくらかかるか」という観点で価値を算出する手法です。建物は古くなるほど評価が下がります。",
    howto: "投資家への説明では「銀行の担保評価や相続税評価はこの考え方に近い」と伝えると理解されやすいです。収益還元法と比較して原価法が高い場合は「建物の価値に対して収益が出ていない」、低い場合は「建物の価値以上の収益を生んでいる優良物件」といった読み方ができます。",
    caution: "投資用アパートの実際の売買価格は収益還元法で決まることがほとんどです。原価法の数字は参考値として位置づけてください。",
    bench: "収益還元法の評価額と大きく乖離していないかを確認"
  },
  "取引事例比較法": {
    en: "Sales Comparison Approach",
    formula: "近隣の類似物件の成約価格の平均・加重平均",
    what: "「実際に近くで似た物件がいくらで売れたか」から価値を算出する手法です。市場の生の相場感を反映します。",
    howto: "「このエリアでは最近同規模のアパートがX億円で売れています」という形で、投資家に市場の実態を示すときに使います。収益還元法と取引事例がほぼ一致していれば、価格設定の信頼性が高まります。成約事例データを持っている場合は積極的に入力してください。",
    caution: "成約事例は物件の状態・立地・時期によって大きく異なります。条件が異なる事例を単純比較するのは危険です。",
    bench: "収益還元法の結果と±10%程度の範囲に収まっていると整合性が高い"
  },
  "減価償却": {
    en: "Depreciation",
    formula: "建物取得価格 ÷ 耐用年数（木造22年・RC造47年など）",
    what: "建物は毎年少しずつ「古くなる分の価値の目減り」を税務上の経費として計上できます。実際にお金が出ていくわけではありませんが、税金の計算上はコストとして扱われます。",
    howto: "この「帳簿上の経費」が大きいほど不動産所得が圧縮され、給与所得との合算で税金が下がります。特に借入初期は減価償却費＋利息で不動産所得が赤字になりやすく、節税効果が大きくなります。年収が高い投資家ほど節税メリットが大きくなるため、年収に応じた試算を必ず見せてください。",
    caution: "減価償却が終わると節税効果はなくなります。また売却時には減価償却分だけ取得費が下がり、譲渡益が大きくなるため、出口での税負担が増える点も合わせて説明してください。",
    bench: "木造なら建物価格の約4.5%/年、RC造なら約2.1%/年が目安"
  },
  "損益通算": {
    en: "Loss Offset",
    formula: "（給与所得 ＋ 不動産所得）が赤字になった分だけ課税所得を圧縮",
    what: "不動産の収支が帳簿上マイナスになると、給与所得と合算して課税所得を減らすことができます。その結果、所得税・住民税が下がります。",
    howto: "「毎月家賃が入ってくるのに節税にもなる」という点が高年収の投資家に響くポイントです。年収800万円の方なら所得税率23%＋住民税10%＝33%が適用されるため、100万円の不動産赤字で33万円の節税になります。シミュレーションの節税累計を見ながら「何年でいくら節税できるか」を具体的に伝えてください。",
    caution: "土地購入にかかった借入利息は損益通算できません（建物分の利息は可）。また2022年以降のルール変更により、特定の場合は通算に制限があります。税理士への確認を促してください。",
    bench: "年収が高いほど効果大。年収1,000万円超の投資家には特に訴求ポイントになる"
  },
  "譲渡税": {
    en: "Capital Gains Tax",
    formula: "（売却価格 − 取得費）× 税率（長期20.315% / 短期39.63%）",
    what: "物件を売却して利益が出たときにかかる税金です。保有期間5年を超えると税率がほぼ半分になります。",
    howto: "「いつ売るか」で手取りが大きく変わります。保有5年を超えてから売却するだけで、同じ売却益でも手取りが大幅に増えます。投資家が「5年後に売りたい」と言っている場合は、5年と1日以上保有すると長期譲渡扱いになる点を必ず案内してください。また取得費の計算には減価償却後の帳簿価額が使われるため、長期保有ほど譲渡益が大きくなる傾向があります。",
    caution: "シミュレーションの譲渡税はあくまで概算です。実際の納税額は取得費の内訳・保有期間・控除の有無によって変わります。必ず税理士に確認するよう伝えてください。",
    bench: "保有5年超（長期譲渡）で税率約20%、5年以下（短期譲渡）で約39%。売却タイミングの設計が重要"
  },
  "元利均等": {
    en: "Level Payment Method",
    formula: "毎月の返済額（元金＋利息の合計）が一定",
    what: "返済期間中ずっと月の支払額が変わらない返済方式です。返済初期は利息の割合が多く、終盤になるほど元金の割合が増えます。",
    howto: "「毎月いくら返済するか」が最初から固定されるため、キャッシュフローの計算が簡単です。投資家が資金計画を立てやすく、CFのブレが少ないため、シミュレーションの数字が現実に近くなります。ほとんどの案件でこちらを選ぶケースが多いです。",
    caution: "元金均等と比べると総返済額は多くなります。ただし毎月の負担が一定なのでリスク管理がしやすい点がメリットです。",
    bench: "返済額の安定性を重視するなら元利均等を選択"
  },
  "元金均等": {
    en: "Fixed Principal Payment Method",
    formula: "毎月の元金返済額が一定。利息は残高に応じて毎月減っていく",
    what: "毎月返済する元金の額が固定され、ローン残高が減るにつれて利息も減るため、返済額が徐々に小さくなっていく方式です。",
    howto: "返済初期は元利均等より月々の負担が大きいですが、総返済額は少なくなります。残債の減りが早いためDSCRが改善しやすく、将来の金利上昇への耐性が高まります。手元資金に余裕がある投資家や、返済総額を抑えたい投資家に向いています。",
    caution: "返済初期の月々負担が重いため、空室リスクに備えた手元資金の確保が元利均等より重要になります。",
    bench: "初期の余裕資金が十分な投資家、総コストを重視する投資家向け"
  },
  "ネットワース": {
    en: "Net Worth（正味資産価値）",
    formula: "物件の収益還元価値 − ローン残高",
    what: "「今この瞬間に物件を売ってローンを全額返済したら、手元にいくら残るか」を示します。投資家の不動産資産の実質的な価値です。",
    howto: "グラフでネットワースが増加し続けている物件は「保有するほど資産が積み上がっている」状態です。ネットワースが残債を大きく上回ってきたタイミングが、売却を検討するサインになります。将来的に物件を担保に次の投資をしたい投資家にとって、ネットワースの大きさが次の資金調達力に直結します。",
    caution: "ネットワースは収益還元価値（売却利回りの想定）に大きく左右されます。売却利回りを低く設定しすぎると、ネットワースが実態より高く見えます。",
    bench: "プラスかつ増加傾向にあることが理想。マイナスは「物件価値が残債を下回っている」状態"
  },
  "不動産取得税": {
    en: "Real Estate Acquisition Tax",
    formula: "固定資産税評価額 × 3%（土地・建物それぞれ）",
    what: "物件を取得したときに1回だけかかる税金です。購入後6ヶ月〜1年半程度で都道府県から納税通知書が届きます。",
    howto: "初期費用として必ず計画に組み込んでください。見落としがちなコストで、投資家が「想定外の出費」として驚くことが多い費用です。建物は新築の場合に軽減措置があり、実際の税額はシミュレーションより低くなるケースもあります。資金計画の段階で「購入後1年以内にX万円の支出がある」ことを事前に伝えておくと信頼につながります。",
    caution: "軽減措置の適用条件や計算は複雑です。正確な金額は税理士・司法書士に確認を促してください。",
    bench: "購入初年度の追加支出として事前に資金を確保しておく必要がある"
  },
  "固定資産税": {
    en: "Fixed Asset Tax",
    formula: "固定資産税評価額 × 1.4%（土地・建物それぞれ）",
    what: "物件を所有している間、毎年かかり続ける税金です。1月1日時点の所有者が、その年度分を支払います。",
    howto: "毎年の保有コストとして必ずシミュレーションに組み込んでください。アパートの場合、住宅用地の特例（土地の固定資産税が1/6に軽減）が適用されることが多く、更地より税金が安くなります。「土地を持っている親族がアパートを建てることで固定資産税が下がる」という節税メリットも投資家への訴求ポイントになります。",
    caution: "固定資産税評価額は市区町村が決めるため、実際の取引価格とは異なります。また3年ごとに評価額が見直されます。",
    bench: "年間の運営コストとして確実に計上。忘れると実質利回りが過大評価される"
  },
  "修繕積立": {
    en: "Repair Reserve",
    formula: "毎年の運営費に計上する将来修繕のための積立金",
    what: "建物は年数とともに劣化するため、将来の大規模修繕（外壁・屋根・設備更新など）に備えて毎年お金を積み立てておく費用です。",
    howto: "シミュレーション上はCFを減らす費用として計上されますが、実際には手元に残ります。大規模修繕が発生した年（シミュレーションで🔧が付いた年）にまとめて使うイメージです。この積立が少なすぎると、大規模修繕の年に急激なCF悪化が起きます。投資家に「毎月の手取りは少し減るが、将来の大きな出費に備えている」と説明してください。",
    caution: "積立を省いてシミュレーションを良く見せることはできますが、現実には必ず発生する費用です。保守的に計上することが誠実な提案につながります。",
    bench: "建築費の0.3〜0.5%/年。木造で年間40〜50万円程度が多い"
  },
  "実質負担額": {
    en: "Net Real Burden",
    formula: "自己資金 − 保有期間の累計CF − 売却手取り",
    what: "「投資全体を終えて、最終的に自分のお金はいくら増えた（または減った）か」を示す最終的な成績表です。マイナス＝利益、プラス＝元本割れです。",
    howto: "投資家にとって最もシンプルに結果がわかる数字です。「30年保有して最終的に−X万円（＝X万円の利益）になります」という形で伝えてください。節税効果を含めると実質負担がさらに下がるケースも多いため、「節税込みの実質負担額」と「節税なしの実質負担額」を比較して見せると訴求力が増します。",
    caution: "この数字は売却価格の想定に大きく左右されます。「売却価格が想定より10%低かった場合」のシナリオも合わせて確認してください。",
    bench: "マイナス（＝利益）になっていることが投資成立の最低条件"
  },
};

// ── Iアイコン＋ポップオーバー ──────────────────────────────────────
function InfoIcon({ term }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({top:0,left:0});
  const info = GLOSSARY[term];
  if (!info) return null;

  const handleClick = e => {
    e.stopPropagation();
    if (!open) {
      const r = e.currentTarget.getBoundingClientRect();
      const pw = 320;
      let left = r.left + r.width/2 - pw/2;
      left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
      let top = r.bottom + 6;
      if (top + 420 > window.innerHeight) top = Math.max(8, r.top - 426);
      setPos({ top, left });
    }
    setOpen(o => !o);
  };

  const Popover = () => (
    <>
      <div style={{position:"fixed",inset:0,zIndex:9998,background:"transparent"}} onClick={()=>setOpen(false)}/>
      <div style={{
        position:"fixed",top:pos.top,left:pos.left,zIndex:9999,
        background:"#fff",border:`1px solid ${C.border}`,
        borderRadius:12,padding:"16px 18px",
        boxShadow:"0 12px 40px rgba(0,0,0,0.18)",
        width:320,fontSize:12,lineHeight:1.7,
        maxHeight:"70vh",overflowY:"auto",
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{term}</div>
            <div style={{fontSize:10,color:C.gray,marginTop:1}}>{info.en}</div>
          </div>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer",color:C.gray,fontSize:20,lineHeight:1,padding:"0 0 0 8px",flexShrink:0}}>×</button>
        </div>
        <div style={{background:"#F8FAFC",borderRadius:6,padding:"6px 10px",marginBottom:12,fontSize:10,color:C.gray,fontFamily:"monospace",lineHeight:1.6}}>
          計算式：{info.formula}
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:C.blue,marginBottom:4,letterSpacing:"0.04em"}}>▌ この指標は何を示すか</div>
          <div style={{color:C.slate,fontSize:12}}>{info.what}</div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:"#059669",marginBottom:4,letterSpacing:"0.04em"}}>▌ どう読むか・どう使うか</div>
          <div style={{color:C.slate,fontSize:12}}>{info.howto}</div>
        </div>
        {info.caution&&(
          <div style={{marginBottom:10,background:"#FFFBEB",borderRadius:6,padding:"8px 12px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.amber,marginBottom:3}}>⚠ 注意点</div>
            <div style={{color:"#92400E",fontSize:11}}>{info.caution}</div>
          </div>
        )}
        {info.bench&&(
          <div style={{background:"#F0FDF4",borderRadius:6,padding:"7px 12px",fontSize:11,color:"#166534",fontWeight:600}}>
            📊 判断目安：{info.bench}
          </div>
        )}
      </div>
    </>
  );

  return (
    <span style={{position:"relative",display:"inline-flex",alignItems:"center",marginLeft:5}}>
      <button
        onClick={handleClick}
        style={{
          width:16,height:16,borderRadius:"50%",
          background:open?C.blue:"#CBD5E1",
          color:"#fff",border:"none",cursor:"pointer",
          fontSize:10,fontWeight:700,lineHeight:1,
          display:"inline-flex",alignItems:"center",justifyContent:"center",
          flexShrink:0,transition:"background 0.15s",
        }}
        title={`${term}の説明を見る`}
      >i</button>
      {open && <Popover/>}
    </span>
  );
}

// ── 用語ラベル（iアイコン付き） ────────────────────────────────────
const Term = ({ children }) => (
  <span style={{ display: "inline-flex", alignItems: "center" }}>
    {children}
    <InfoIcon term={children} />
  </span>
);

// ── simulation ─────────────────────────────────────────────────────
function runSim(p) {
  const totalUnits=p.rooms.reduce((s,r)=>s+r.count,0);
  const blendedRent=totalUnits>0?p.rooms.reduce((s,r)=>s+r.rent*r.count,0)/totalUnits:0;
  const totalInvest=p.buildCost+(p.hasLand?0:p.landCost)+p.otherCost;
  const loan=Math.max(0,totalInvest-p.equity);
  const mRate=p.loanRate/100/12, nMon=p.loanYears*12;
  const basePay=loan>0&&mRate>0?loan*10000*(mRate*Math.pow(1+mRate,nMon))/(Math.pow(1+mRate,nMon)-1):(nMon>0?loan*10000/nMon:0);
  const life=STRUCTURES[p.structure]?.life||22;
  const deprAnnual=p.buildCost/life;
  const salaryBase=Math.max(0,p.salary-incDeduct(p.salary*10000)/10000);
  const salaryTaxOnly=calcTax(Math.max(0,salaryBase*10000));
  const maxYrs=Math.max(p.holdYrs,p.loanYears||0,1);
  const avgMonthlyRent=blendedRent; // 万円/月
  const rows=[]; let bal=loan,cum=-p.equity;
  for(let yr=1;yr<=maxYrs;yr++){
    const effRate=(p.rateChgYr>0&&yr>=p.rateChgYr&&p.rateAfter>0)?p.rateAfter:p.loanRate;
    const curM=effRate/100/12, remMon=Math.max(0,nMon-(yr-1)*12);
    const rd=Math.pow(1-p.rentDecline/100,yr-1), occ=(yr===1?p.occInit:p.occ)/100;
    const rentInc=blendedRent*totalUnits*12*occ*rd, parkInc=p.parkRent*p.parking*12;
    // 礼金・更新料（入退去年のみ）
    const avgTY=Math.max(1,p.avgTenantYears||3);
    const renewYr=Math.max(1,p.renewalYears||2);
    const isNewTenant=(yr===1)||((yr-1)%avgTY===0);
    const isRenewal=!isNewTenant&&((yr-1)%renewYr===0);
    const keyMoneyInc=isNewTenant?R(totalUnits*(p.keyMoneys||0)*avgMonthlyRent):0;
    const renewalInc=isRenewal?R(totalUnits*(p.renewalFee||0)*avgMonthlyRent):0;
    const totalInc=rentInc+parkInc+keyMoneyInc+renewalInc;
    const mgmt=rentInc*p.mgmtRate/100;
    const majorR=p.majorRepairs.reduce((s,r)=>r.yr===yr?s+r.cost:s,0);
    const annualRepair=p.annualRepair||0;
    const totalCost=mgmt+p.repairRes+p.propTax+p.insure+p.util+majorR+annualRepair;
    const noi=totalInc-totalCost;
    let annPay=0,interest=0,principal=0;
    if(yr<=p.loanYears&&bal>0){
      if(p.repayType==="annuity"){
        const rp=bal*10000*(curM*Math.pow(1+curM,remMon))/(Math.pow(1+curM,remMon)-1);
        annPay=rp*12/10000;interest=bal*effRate/100;principal=annPay-interest;
      } else {principal=loan/p.loanYears;interest=bal*effRate/100;annPay=principal+interest;}
      bal=Math.max(0,bal-principal);
    }
    const cfAD=noi-annPay; cum+=cfAD;
    const deprYr=yr<=life?deprAnnual:0;
    const reiEst=rentInc+parkInc-totalCost-deprYr-interest;
    const taxableTotal=Math.max(0,(salaryBase+reiEst)*10000);
    const taxSaving=Math.max(0,(salaryTaxOnly-calcTax(taxableTotal))/10000)+Math.max(0,-reiEst*0.1);
    const buildBook=Math.max(0,p.buildCost*(1-yr/life));
    const landVal=(p.hasLand?p.landCost:p.landCost)*Math.pow(1+p.landChg/100,yr);
    const incVal=p.exitYield>0?noi/(p.exitYield/100):0;
    rows.push({year:yr,rentInc:R(rentInc),parkInc:R(parkInc),keyMoney:keyMoneyInc,renewal:renewalInc,totalInc:R(totalInc),
      mgmt:R(mgmt),repairRes:R(p.repairRes),propTax:R(p.propTax),insure:R(p.insure),annualRepair:R(annualRepair),
      adAnnual:0,util:R(p.util),majorR:R(majorR),totalCost:R(totalCost),
      noi:R(noi),interest:R(interest),principal:R(principal),annPay:R(annPay),bal:R(bal),
      cfAD:R(cfAD),cum:R(cum),buildBook:R(buildBook),landVal:R(landVal),
      assetTotal:R(buildBook+landVal),incVal:R(incVal),nw:R(incVal-bal),
      depr:R(deprYr),reiEst:R(reiEst),taxSaving:R(taxSaving),
      remDeprYrs:Math.max(0,life-yr),
      remDeprAmt:Math.max(0,p.buildCost*(life-yr)/life)});
  }
  const yr1=rows[0]||{}, last=rows[p.holdYrs-1]||rows[rows.length-1]||{};
  const exitPrice=last.incVal||0;
  const depBook=Math.max(0,p.buildCost*(1-p.holdYrs/life));
  const transferGain=Math.max(0,exitPrice-((p.hasLand?p.landCost:0)+depBook));
  const transferTax=transferGain*(p.holdYrs>5?0.20315:0.39363);
  const exitBrokFee=exitPrice*p.exitBrok/100;
  const exitNet=exitPrice-transferTax-exitBrokFee-(last.bal||0);
  const totalReturn=(last.cum||0)+exitNet;
  const netBurden=p.equity-(last.cum||0)-exitNet;
  const acqTax=(p.hasLand?0:p.landCost)*0.03+p.buildCost*0.03;
  const regTax=(p.hasLand?0:p.landCost)*0.015+p.buildCost*0.02;
  const grossY=totalInvest>0?(blendedRent*totalUnits*12/totalInvest)*100:0;
  const noiY=totalInvest>0?((yr1.noi||0)/totalInvest)*100:0;
  const ccr=p.equity>0?((yr1.cfAD||0)/p.equity)*100:0;
  const dscr=(yr1.annPay||0)>0?(yr1.noi||0)/yr1.annPay:0;
  const ltv=totalInvest>0?(loan/totalInvest)*100:0;
  let pbp=null; for(const r of rows){if(r.cum>=0){pbp=r.year;break;}}
  const cfs=[-p.equity,...rows.map((r,i)=>i===rows.length-1?r.cfAD+exitNet:r.cfAD)];
  let irr=0.06;
  for(let it=0;it<200;it++){
    const npv=cfs.reduce((s,c,t)=>s+c/Math.pow(1+irr,t),0);
    const dn=cfs.reduce((s,c,t)=>s-t*c/Math.pow(1+irr,t+1),0);
    if(Math.abs(dn)<1e-10)break;irr-=npv/dn;if(Math.abs(npv)<0.001)break;
  }
  const taxSavingSum=rows.reduce((s,r)=>s+r.taxSaving,0);
  const costApproach=(p.hasLand?p.landCost:p.landCost)+p.buildCost*(1-p.holdYrs/life);
  const incomeApproach=last.incVal||0;
  const compApproach=p.comparables.length>0?p.comparables.reduce((s,c)=>s+c.price,0)/p.comparables.length:null;
  const monthPay=loan>0&&mRate>0?loan*10000*(mRate*Math.pow(1+mRate,nMon))/(Math.pow(1+mRate,nMon)-1):(nMon>0?loan*10000/nMon:0);
  return {rows,totalInvest,loan,monthPay:monthPay/10000,grossY,noiY,ccr,dscr,ltv,pbp,
    irr:irr*100,exitPrice,exitNet,totalReturn,netBurden,yr1,last,
    totalUnits,blendedRent,acqTax,regTax,transferTax,exitBrokFee,
    costApproach,incomeApproach,compApproach,taxSavingSum,deprAnnual};
}

const BANKS = [
  { id:'mizuho',      name:'みずほ銀行',          rate:1.25,  reviewRate:3.50, ratioTiers:[{max:375,r:35},{max:675,r:40},{max:9999,r:45}] },
  { id:'mufg',        name:'三菱UFJ銀行',          rate:0.945, reviewRate:3.54, ratioTiers:[{max:375,r:35},{max:675,r:40},{max:9999,r:45}] },
  { id:'smbc',        name:'三井住友銀行',          rate:1.275, reviewRate:3.50, ratioTiers:[{max:9999,r:40}] },
  { id:'musashino',   name:'武蔵野銀行',            rate:1.03,  reviewRate:3.50, ratioTiers:[{max:9999,r:35}] },
  { id:'sbi',         name:'住信SBI銀行',           rate:0.950, reviewRate:3.25, ratioTiers:[{max:9999,r:40}] },
  { id:'saitamaresona',name:'埼玉りそな銀行',        rate:0.95,  reviewRate:3.125,ratioTiers:[{max:375,r:30},{max:9999,r:35}] },
  { id:'kiraboshi',   name:'きらぼし銀行',           rate:2.475, reviewRate:2.475,ratioTiers:[{max:375,r:30},{max:725,r:35},{max:9999,r:40}] },
  { id:'saitamaken',  name:'埼玉縣信用金庫',         rate:0.895, reviewRate:3.125,ratioTiers:[{max:375,r:30},{max:9999,r:35}] },
  { id:'sony',        name:'ソニー銀行',             rate:1.347, reviewRate:1.347,ratioTiers:[{max:375,r:30},{max:9999,r:35}] },
  { id:'shinsei',     name:'新生銀行',               rate:1.08,  reviewRate:1.08, ratioTiers:[{max:9999,r:35}] },
  { id:'rakuten',     name:'楽天銀行',               rate:1.333, reviewRate:1.333,ratioTiers:[{max:9999,r:35}] },
  { id:'flat20',      name:'フラット35（〜20年）',    rate:2.39,  reviewRate:1.85, ratioTiers:[{max:375,r:30},{max:9999,r:35}] },
  { id:'flat35',      name:'フラット35（21〜35年）',  rate:2.71,  reviewRate:1.85, ratioTiers:[{max:375,r:30},{max:9999,r:35}] },
  { id:'custom',      name:'カスタム入力',            rate:1.8,   reviewRate:3.5,  ratioTiers:[{max:9999,r:35}] },
];

const DEFAULT_PD = {
  propertyName:"",
  date:"",
  taxNote:"本体工事費に含む",
  miscItems:[
    {id:"broker",  label:"仲介手数料",     amount:0,      note:"",                                       isJitsu:false},
    {id:"stamp",   label:"契約書印紙代",   amount:30000,  note:"",                                       isJitsu:false},
    {id:"regOwn",  label:"所有権移転費用", amount:350000, note:"登録免許税+司法書士手数料（概算）",      isJitsu:false},
    {id:"regPres", label:"表題・保存登記", amount:150000, note:"（概算）",                               isJitsu:false},
    {id:"option",  label:"オプション工事費",amount:0,     note:"",                                       isJitsu:true},
  ],
  bankItems:[
    {id:"bankStamp",label:"金消契約書印紙代",amount:60200,   note:"金融機関により異なります。（電子契約の場合不要）",isJitsu:false},
    {id:"bankFee",  label:"銀行事務手数料", amount:55000,   note:"金融機関により異なります。",             isJitsu:false},
    {id:"loanFee",  label:"ローン手数料",   amount:0,       note:"保証料内枠の場合は金利＋0.2％となります。",isJitsu:false},
    {id:"mtgSet",   label:"抵当権設定料",   amount:350000,  note:"（概算）",                               isJitsu:false},
    {id:"fire",     label:"火災保険料",     amount:300000,  note:"付保額・支払方法によります。（概算）",    isJitsu:false},
  ],
  otherItems:[
    {id:"propTax", label:"固定資産税負担金",amount:0, note:"日割計算となります。", isJitsu:true},
  ],
  company:"ワイケイホーム株式会社",
  address:"朝霞市西原２－１５－２７",
  tel:"０４８－４８６－１２２２",
};

const INIT={
  pref:"東京都",city:"世田谷区",
  rooms:[{madori:"1K",count:8,rent:7.5},{madori:"1LDK",count:4,rent:10.0}],
  buildCost:9600,hasLand:false,landCost:5000,otherCost:500,
  equity:3000,loanRate:1.8,loanYears:30,repayType:"annuity",rateChgYr:0,rateAfter:2.5,
  occ:93,occInit:85,rentDecline:0.5,parking:4,parkRent:1.5,
  mgmtRate:5,repairRes:50,propTax:80,insure:5,util:12,
  majorRepairs:[{yr:15,cost:600}],structure:"wood",landChg:0.5,
  holdYrs:20,exitYield:5.5,exitBrok:3,salary:800,comparables:[],
  yieldRef:5.0,
  annualRepair:0,
  keyMoneys:0.5,renewalFee:1.0,renewalYears:2,avgTenantYears:3,depositMonths:1,
  purchaseDetail:{...DEFAULT_PD},
};

// ── primitives ─────────────────────────────────────────────────────
const Req = () => <span style={{fontSize:10,fontWeight:600,background:"#FEE2E2",color:"#991B1B",borderRadius:4,padding:"1px 5px",marginLeft:4}}>必須</span>;
const Opt = () => <span style={{fontSize:10,background:"#F1F5F9",color:C.gray,borderRadius:4,padding:"1px 5px",marginLeft:4}}>任意</span>;
const FL  = ({children}) => <div style={{fontSize:11,fontWeight:600,color:C.slate,marginBottom:4,display:"flex",alignItems:"center"}}>{children}</div>;
function Slider({min,max,step,value,onChange,display,hint,unit}){
  const [local,setLocal]=useState(value);
  useEffect(()=>setLocal(value),[value]);
  return(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <input type="number" min={min} max={max} step={step} value={local}
          onChange={e=>setLocal(e.target.value)}
          onBlur={e=>{const v=Math.min(max,Math.max(min,+e.target.value||min));setLocal(v);onChange(v);}}
          style={{flex:1,padding:"5px 8px",border:`1.5px solid ${C.border}`,borderRadius:6,fontSize:13,fontWeight:600,color:C.navy,textAlign:"right"}}/>
        {unit&&<span style={{fontSize:11,color:C.gray,flexShrink:0,minWidth:20}}>{unit}</span>}
      </div>
      {hint&&<div style={{fontSize:10,color:C.gray,marginTop:2,lineHeight:1.4}}>{hint}</div>}
    </div>
  );
}
function TextIn({value,onChange,placeholder,style}){
  const [local,setLocal]=useState(value);
  useEffect(()=>setLocal(value),[value]);
  return <input value={local}
    onChange={e=>setLocal(e.target.value)}
    onBlur={e=>onChange(e.target.value)}
    placeholder={placeholder}
    style={style}/>;
}
function NIn({value,onChange}){
  const [local,setLocal]=useState(value);
  useEffect(()=>setLocal(value),[value]);
  return <input type="number" value={local}
    onChange={e=>setLocal(e.target.value)}
    onBlur={e=>onChange(+e.target.value||0)}
    style={{padding:"5px 7px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,fontWeight:600,color:C.navy,width:"100%",background:"#fff"}}/>;
};
const SelBtn = ({active,onClick,children}) => <button onClick={onClick} style={{flex:1,padding:"6px 4px",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",border:"none",background:active?C.navy:C.light,color:active?"#fff":C.gray,lineHeight:1.3}}>{children}</button>;
const TabBtn = ({active,onClick,children}) => <button onClick={onClick} style={{padding:"7px 13px",fontSize:12,fontWeight:600,border:"none",background:"none",cursor:"pointer",color:active?C.blue:C.gray,borderBottom:active?`2px solid ${C.blue}`:"2px solid transparent",whiteSpace:"nowrap"}}>{children}</button>;
function KpiCard({label,value,ok,term}) {
  const [open,setOpen]=useState(false);
  const [pos,setPos]=useState({top:0,left:0});
  const col=ok===true?C.green:ok===false?C.red:C.amber;
  const info=term?GLOSSARY[term]:null;

  const handleClick=e=>{
    if(!info)return;
    if(!open){
      const r=e.currentTarget.getBoundingClientRect();
      const pw=340;
      let left=r.left+r.width/2-pw/2;
      left=Math.max(8,Math.min(left,window.innerWidth-pw-8));
      let top=r.bottom+8;
      if(top+420>window.innerHeight)top=Math.max(8,r.top-428);
      setPos({top,left});
    }
    setOpen(o=>!o);
  };

  const Popover=()=>(
    <>
      <div style={{position:"fixed",inset:0,zIndex:9998,background:"transparent"}} onClick={()=>setOpen(false)}/>
      <div style={{
        position:"fixed",top:pos.top,left:pos.left,zIndex:9999,
        background:"#fff",border:`1px solid ${C.border}`,
        borderRadius:12,padding:"16px 18px",
        boxShadow:"0 12px 40px rgba(0,0,0,0.18)",
        width:340,fontSize:12,lineHeight:1.7,
        maxHeight:"70vh",overflowY:"auto",
      }}>
        {/* header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:C.navy}}>{term}</div>
            <div style={{fontSize:10,color:C.gray,marginTop:1}}>{info.en}</div>
          </div>
          <button onClick={e=>{e.stopPropagation();setOpen(false);}} style={{background:"none",border:"none",cursor:"pointer",color:C.gray,fontSize:20,lineHeight:1,padding:"0 0 0 8px",flexShrink:0}}>×</button>
        </div>
        {/* current value */}
        <div style={{background:ok===true?"#F0FDF4":ok===false?"#FEF2F2":"#FFFBEB",borderRadius:8,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:C.gray}}>現在の値</span>
          <span style={{fontSize:20,fontWeight:700,color:col}}>{value}</span>
          <span style={{fontSize:11,fontWeight:600,color:col}}>{ok===true?"✅ 良好":ok===false?"⚠️ 要確認":"△ 注意"}</span>
        </div>
        {/* formula */}
        <div style={{background:"#F8FAFC",borderRadius:6,padding:"6px 10px",marginBottom:12,fontSize:10,color:C.gray,fontFamily:"monospace",lineHeight:1.6}}>
          計算式：{info.formula}
        </div>
        {/* what */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:C.blue,marginBottom:4,letterSpacing:"0.04em"}}>▌ この指標は何を示すか</div>
          <div style={{color:C.slate,fontSize:12}}>{info.what}</div>
        </div>
        {/* howto */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:"#059669",marginBottom:4,letterSpacing:"0.04em"}}>▌ どう読むか・どう使うか</div>
          <div style={{color:C.slate,fontSize:12}}>{info.howto}</div>
        </div>
        {/* caution */}
        {info.caution&&(
          <div style={{marginBottom:10,background:"#FFFBEB",borderRadius:6,padding:"8px 12px"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.amber,marginBottom:3}}>⚠ 注意点</div>
            <div style={{color:"#92400E",fontSize:11}}>{info.caution}</div>
          </div>
        )}
        {/* bench */}
        {info.bench&&(
          <div style={{background:"#F0FDF4",borderRadius:6,padding:"7px 12px",fontSize:11,color:"#166534",fontWeight:600}}>
            📊 判断目安：{info.bench}
          </div>
        )}
      </div>
    </>
  );

  return(
    <div style={{position:"relative",flex:1,minWidth:80}}>
      <div
        onClick={handleClick}
        style={{
          background:open?"#EFF6FF":C.light,
          borderRadius:8,padding:"7px 10px",textAlign:"center",
          cursor:info?"pointer":"default",
          border:`1px solid ${open?C.blue:C.border}`,
          transition:"border-color 0.15s,background 0.15s",
          userSelect:"none",
        }}
      >
        <div style={{fontSize:10,color:open?C.blue:C.gray,marginBottom:2,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
          {label}
          {info&&<span style={{fontSize:9,color:open?C.blue:"#94A3B8",fontWeight:700}}>ⓘ</span>}
        </div>
        <div style={{fontSize:15,fontWeight:700,color:col}}>{value}</div>
      </div>
      {open&&info&&<Popover/>}
    </div>
  );
}
const Tip = ({active,payload,label}) => {
  if(!active||!payload?.length)return null;
  return(<div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 12px rgba(0,0,0,0.08)",fontSize:11}}>
    <div style={{fontWeight:700,color:C.navy,marginBottom:6}}>{label}年目</div>
    {payload.map((p,i)=>(
      <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
        <div style={{width:10,height:10,borderRadius:2,background:p.color||p.fill}}/>
        <span style={{color:C.gray}}>{p.name}：</span>
        <span style={{fontWeight:700}}>{Math.round(p.value).toLocaleString()}万円</span>
      </div>
    ))}
  </div>);
};
function Acc({title,children,defaultOpen=false}){
  const[open,setOpen]=useState(defaultOpen);
  return(<div style={{borderTop:`1px solid ${C.border}`,marginTop:4}}>
    <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",background:"none",border:"none",cursor:"pointer"}}>
      <span style={{fontSize:11,fontWeight:600,color:C.gray}}>{title}</span>
      <span style={{fontSize:10,color:C.blue,transform:open?"rotate(180deg)":"none",transition:"0.2s"}}>▼</span>
    </button>
    {open&&<div style={{paddingBottom:8}}>{children}</div>}
  </div>);
}
const CS = ({title,desc,children}) => (
  <div style={{background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:14}}>
    <div style={{padding:"11px 15px",borderBottom:`1px solid ${C.border}`,background:"#FAFAFA"}}>
      <div style={{fontSize:13,fontWeight:700,color:C.navy,display:"flex",alignItems:"center",gap:6}}>{title}</div>
      {desc&&<div style={{fontSize:11,color:C.gray,marginTop:2,lineHeight:1.5}}>{desc}</div>}
    </div>
    <div style={{padding:"13px 12px 10px"}}>{children}</div>
  </div>
);

// ── TABLE ROW DEFS ─────────────────────────────────────────────────
const TABLE_ROWS=[
  {type:"group",label:"収入"},
  {type:"parent",label:"総収入",key:"totalInc",color:"#0C447C"},
  {type:"child",label:"賃料収入",key:"rentInc",color:"#185FA5"},
  {type:"child",label:"駐車場収入",key:"parkInc",color:"#185FA5"},
  {type:"child",label:"礼金",key:"keyMoney",color:"#185FA5",dashIfZero:true},
  {type:"child",label:"更新料",key:"renewal",color:"#185FA5",dashIfZero:true},
  {type:"group",label:"費用"},
  {type:"parent",label:"費用計",key:"totalCost",color:"#854F0B"},
  {type:"child",label:"管理委託費",key:"mgmt",color:"#92400E"},
  {type:"child",label:"修繕積立",key:"repairRes",color:"#92400E"},
  {type:"child",label:"年間修繕費",key:"annualRepair",color:"#92400E",dashIfZero:true},
  {type:"child",label:"固定資産税",key:"propTax",color:"#92400E"},
  {type:"child",label:"火災保険料",key:"insure",color:"#92400E"},
  {type:"child",label:"共用部光熱費",key:"util",color:"#92400E"},
  {type:"child",label:"大規模修繕",key:"majorR",color:"#991B1B"},
  {type:"single",label:"NOI（純営業利益）",term:"NOI",key:"noi",bold:true,signed:true},
  {type:"group",label:"返済"},
  {type:"parent",label:"年間返済計",key:"annPay",color:"#991B1B"},
  {type:"child",label:"元金返済",key:"principal",color:"#7F1D1D"},
  {type:"child",label:"利息支払",key:"interest",color:"#7F1D1D"},
  {type:"single",label:"残債残高",key:"bal",color:C.gray},
  {type:"group",label:"キャッシュフロー"},
  {type:"single",label:"年次CF（返済後）",key:"cfAD",bold:true,signed:true},
  {type:"single",label:"累計CF",key:"cum",bold:true,signed:true},
  {type:"group",label:"税務・減価償却"},
  {type:"single",label:"不動産所得（賃料－経費－償却－利子）",key:"reiEst",signed:true,color:"#7C3AED"},
  {type:"single",label:"節税額（所得税＋住民税）",term:"損益通算",key:"taxSaving",color:C.green},
  {type:"single",label:"年間減価償却費",term:"減価償却",key:"depr",color:"#2563EB"},
  {type:"single",label:"残償却金額",key:"remDeprAmt",color:"#7C3AED"},
  {type:"single",label:"残償却期間（年）",key:"remDeprYrs",color:"#6B7280"},
  {type:"group",label:"資産価値"},
  {type:"parent",label:"帳簿価値合計",term:"原価法",key:"assetTotal",color:C.slate},
  {type:"child",label:"建物帳簿価値",key:"buildBook",color:C.gray},
  {type:"child",label:"土地推定価値",key:"landVal",color:C.gray},
  {type:"single",label:"収益還元価値",term:"収益還元法",key:"incVal",bold:true,color:C.purple},
  {type:"single",label:"ネットワース",term:"ネットワース",key:"nw",bold:true,signed:true,color:C.purple},
];

// ── main PC component ──────────────────────────────────────────────
export default function PCSim({ customer, onSave, onBack }) {
  const[inputTab,setInputTab]=useState("main");
  const[viewMode,setViewMode]=useState("chart");
  const[p,setP]=useState(()=>({...INIT,...(customer?.params||{})}));
  const[saved,setSaved]=useState(false);
  const[pdfLoading,setPdfLoading]=useState(false);
  const set=k=>v=>setP(prev=>({...prev,[k]:v}));
  const sim=useMemo(()=>runSim(p),[p]);

  // ── PDF生成 ──────────────────────────────────────────────────────
  const handlePDF = useCallback(async () => {
    if(pdfLoading) return;
    setPdfLoading(true);
    const date = new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"});
    const customerName = customer?.name || "お客様";
    const pageData = { customerName, date, p, sim };

    // 一時コンテナを body に追加
    const container = document.createElement("div");
    container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;";
    document.body.appendChild(container);

    // 3ページ分の要素を生成してレンダリング
    const pageEls = [];
    const pageComponents = [
      <Page1 key={1} {...pageData}/>,
      <Page2 key={2} {...pageData}/>,
      <Page3 key={3} {...pageData}/>,
    ];

    for(const comp of pageComponents) {
      const el = document.createElement("div");
      container.appendChild(el);
      const root = ReactDOM.createRoot(el);
      root.render(comp);
      pageEls.push(el);
    }

    // レンダリング完了を待つ
    await new Promise(r => setTimeout(r, 600));

    try {
      const filename = `${customerName}_シミュレーション_${date.replace(/[年月日]/g,"")}.pdf`;
      await exportToPDF(pageEls, filename);
    } finally {
      document.body.removeChild(container);
      setPdfLoading(false);
    }
  }, [customer, p, sim, pdfLoading]);
  const{rows}=sim;
  const totalInvest=p.buildCost+p.landCost+p.otherCost;
  const areaInfo=AREA_DATA[p.city]||{rent1K:7,rent1LDK:9,vacancy:8,landChgYoy:1};
  const chartRows=rows.slice(0,Math.min(40,rows.length));
  const tf=v=>Math.abs(v)>=10000?`${(v/10000).toFixed(1)}億`:`${R(v/100)*100}万`;

  const addRoom=()=>{
    const used=p.rooms.map(r=>r.madori);
    const next=MADORI.find(m=>!used.includes(m.key))||MADORI[0];
    set("rooms")([...p.rooms,{madori:next.key,count:2,rent:next.ref}]);
  };
  const updRoom=(i,f,v)=>{
    const nr=[...p.rooms];nr[i]={...nr[i],[f]:v};
    if(f==="madori"){const m=MADORI.find(m=>m.key===v);if(m)nr[i].rent=m.ref;}
    set("rooms")(nr);
  };

  const kpiDefs=[
    {l:"表面利回り", term:"表面利回り", v:fmtP(sim.grossY),           ok:sim.grossY>=p.yieldRef},
    {l:"実質利回り", term:"実質利回り", v:fmtP(sim.noiY),             ok:sim.noiY>=(p.yieldRef-1.5)},
    {l:"IRR",        term:"IRR",        v:fmtP(sim.irr),              ok:sim.irr>=5},
    {l:"CCR",        term:"CCR",        v:fmtP(sim.ccr),              ok:sim.ccr>=3},
    {l:"DSCR",       term:"DSCR",       v:sim.dscr.toFixed(2),        ok:sim.dscr>=1.2},
    {l:"LTV",        term:"LTV",        v:fmtP(sim.ltv),              ok:sim.ltv<=70},
    {l:"回収期間",   term:"回収期間",   v:sim.pbp?`${sim.pbp}年`:"未回収", ok:sim.pbp&&sim.pbp<=20},
    {l:`${p.holdYrs}年総収益`, term:"実質負担額", v:fmtOku(sim.totalReturn), ok:sim.totalReturn>0},
  ];

  // INPUT PANEL
  const InputMain=()=>(<div>
    <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:10}}>📍 エリア・土地</div>
    <div style={{marginBottom:8}}><FL>都道府県<Req/></FL>
      <select value={p.pref} onChange={e=>set("pref")(e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.navy}}>
        {["東京都","神奈川県","大阪府","愛知県","福岡県"].map(v=><option key={v}>{v}</option>)}
      </select>
    </div>
    <div style={{marginBottom:10}}><FL>市区町村<Req/></FL>
      <select value={p.city} onChange={e=>set("city")(e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:12,color:C.navy}}>
        {Object.keys(AREA_DATA).map(v=><option key={v}>{v}</option>)}
      </select>
    </div>
    <div style={{background:"#EFF6FF",border:`1px solid #BAE6FD`,borderRadius:8,padding:"8px 10px",marginBottom:12,fontSize:11}}>
      <div style={{fontWeight:700,color:C.blue,marginBottom:4}}>📡 {p.city} エリアデータ（速報）</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11}}>
        <div><span style={{color:C.gray}}>1K平均賃料</span><br/><strong>{areaInfo.rent1K}万円</strong></div>
        <div><span style={{color:C.gray}}>空室率</span><br/><strong>{areaInfo.vacancy}%</strong></div>
        <div><span style={{color:C.gray}}>地価前年比</span><br/><strong style={{color:C.green}}>+{areaInfo.landChgYoy}%</strong></div>
        <div><span style={{color:C.gray}}>1LDK平均</span><br/><strong>{areaInfo.rent1LDK}万円</strong></div>
      </div>
    </div>
    <div style={{marginBottom:10}}>
      <FL>土地の所有<Req/></FL>
      <div style={{display:"flex",gap:5}}>
        <SelBtn active={p.hasLand} onClick={()=>set("hasLand")(true)}>土地あり</SelBtn>
        <SelBtn active={!p.hasLand} onClick={()=>set("hasLand")(false)}>土地なし（取得要）</SelBtn>
      </div>
    </div>
    {!p.hasLand&&<div style={{marginBottom:10}}><FL>土地取得費<Req/></FL><Slider min={500} max={30000} step={100} value={p.landCost} onChange={set("landCost")} display={fmtOku(p.landCost)}/></div>}
    <Acc title="地価変動率（任意）">
      <Slider min={-2} max={5} step={0.1} value={p.landChg} onChange={set("landChg")} display={`${p.landChg.toFixed(1)}%/年`} hint={`${p.city}の過去実績: +${areaInfo.landChgYoy}%/年`}/>
    </Acc>
    <div style={{height:1,background:C.border,margin:"12px 0"}}/>
    <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:10}}>🏗 建物計画</div>
    <div style={{marginBottom:10}}>
      <FL>建物構造<Req/></FL>
      <div style={{display:"flex",gap:5}}>
        {Object.entries(STRUCTURES).map(([k,v])=>(
          <SelBtn key={k} active={p.structure===k} onClick={()=>set("structure")(k)}>{v.label}<br/><span style={{fontSize:9,opacity:.7}}>耐用{v.life}年</span></SelBtn>
        ))}
      </div>
      <div style={{fontSize:10,color:C.blue,background:"#EFF6FF",borderRadius:6,padding:"4px 8px",marginTop:4}}>耐用年数（減価償却・資産価値計算）にのみ影響します。</div>
    </div>
    <div style={{marginBottom:10}}><FL>建築費（総額）<Req/></FL><Slider min={1000} max={30000} step={100} value={p.buildCost} onChange={set("buildCost")} display={fmtOku(p.buildCost)}/></div>
    <div style={{marginBottom:8}}>
      <FL>諸費用<Req/></FL>
      <Slider min={0} max={3000} step={50} value={p.otherCost} onChange={set("otherCost")} display={fmtM(p.otherCost)} hint="登記・不動産取得税・司法書士・印紙税・仲介手数料など。建築費の3〜5%が目安。"/>
    </div>
    <div style={{background:C.navy,borderRadius:10,padding:"12px 14px",marginTop:10,color:"#fff"}}>
      <div style={{fontSize:10,color:"#93C5FD",marginBottom:3}}>総投資額</div>
      <div style={{fontSize:22,fontWeight:700}}>{fmtOku(totalInvest)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8,fontSize:10,color:"#BAD6F0"}}>
        <div>建築費<br/><strong style={{color:"#fff"}}>{fmtOku(p.buildCost)}</strong></div>
        <div>土地<br/><strong style={{color:"#fff"}}>{p.hasLand?"（自己所有）":fmtOku(p.landCost)}</strong></div>
        <div>諸費用<br/><strong style={{color:"#fff"}}>{fmtM(p.otherCost)}</strong></div>
      </div>
    </div>
  </div>);

  const InputRooms=()=>(<div>
    <div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:10}}>🏠 間取り・戸数・賃料</div>
    {p.rooms.map((r,i)=>(
      <div key={i} style={{background:C.light,borderRadius:10,padding:"12px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:12,fontWeight:600,color:C.navy}}>間取り {i+1}</span>
          {p.rooms.length>1&&<button onClick={()=>set("rooms")(p.rooms.filter((_,j)=>j!==i))} style={{fontSize:11,color:C.red,background:"#FEE2E2",border:"none",borderRadius:5,padding:"2px 8px",cursor:"pointer"}}>削除</button>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div><div style={{fontSize:11,color:C.gray,marginBottom:3}}>間取り</div>
            <select value={r.madori} onChange={e=>updRoom(i,"madori",e.target.value)} style={{width:"100%",padding:"7px 8px",border:`1px solid ${C.border}`,borderRadius:7,fontSize:12,background:"#fff",color:C.navy}}>
              {MADORI.map(m=><option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          <div><div style={{fontSize:11,color:C.gray,marginBottom:3}}>戸数</div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <button onClick={()=>updRoom(i,"count",Math.max(1,r.count-1))} style={{width:30,height:30,fontSize:15,background:"#E2E8F0",border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>−</button>
              <div style={{flex:1,textAlign:"center",fontSize:15,fontWeight:700,color:C.navy}}>{r.count}戸</div>
              <button onClick={()=>updRoom(i,"count",r.count+1)} style={{width:30,height:30,fontSize:15,background:C.navy,border:"none",borderRadius:6,cursor:"pointer",color:"#fff",fontWeight:700}}>＋</button>
            </div>
          </div>
        </div>
        <FL>月額賃料（1戸）<Req/></FL>
        <Slider min={3} max={30} step={0.5} value={r.rent} onChange={v=>updRoom(i,"rent",v)} display={`${r.rent.toFixed(1)}万`}/>
        <div style={{background:C.greenBg,borderRadius:6,padding:"4px 8px",fontSize:11,color:C.green}}>月収 <strong>{fmtM(r.rent*r.count)}</strong>（{r.count}戸×{r.rent}万）</div>
      </div>
    ))}
    <button onClick={addRoom} style={{width:"100%",padding:"8px",background:"#EFF6FF",border:`1.5px dashed ${C.blue}`,borderRadius:8,color:C.blue,fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:6}}>＋ 間取りを追加</button>
    <div style={{background:C.navy,borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:11}}>
      <span style={{color:"#93C5FD"}}>合計 </span><strong style={{fontSize:16}}>{sim.totalUnits}戸</strong>
      <span style={{color:"#93C5FD",marginLeft:12}}>満室時年収 </span><strong style={{fontSize:16}}>{fmtM(sim.blendedRent*sim.totalUnits*12)}</strong>
    </div>
  </div>);

  const InputFinance=()=>(<div>
    <div style={{marginBottom:10}}><FL>自己資金<Req/></FL><Slider min={500} max={15000} step={100} value={p.equity} onChange={set("equity")} display={fmtOku(p.equity)}/></div>
    <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[["借入金額",fmtOku(sim.loan)],["月次返済額",`${sim.monthPay.toFixed(1)}万/月`],["LTV",fmtP(sim.ltv)],["DSCR",sim.dscr.toFixed(2)]].map(([l,v])=>(
          <div key={l}><div style={{fontSize:10,color:C.gray}}>{l}</div><div style={{fontWeight:700,color:C.navy}}>{v}</div></div>
        ))}
      </div>
    </div>
    <div style={{marginBottom:10}}><FL>借入金利<Req/></FL><Slider min={0.5} max={5} step={0.1} value={p.loanRate} onChange={set("loanRate")} display={`${p.loanRate.toFixed(1)}%`}/></div>
    <div style={{marginBottom:10}}><FL>返済期間<Req/></FL><Slider min={10} max={35} step={1} value={p.loanYears} onChange={set("loanYears")} display={`${p.loanYears}年`}/></div>
    <div style={{marginBottom:10}}>
      <FL>返済方式（<Term>元利均等</Term>・<Term>元金均等</Term>）<Req/></FL>
      <div style={{display:"flex",gap:6}}>
        <SelBtn active={p.repayType==="annuity"} onClick={()=>set("repayType")("annuity")}>元利均等<br/><span style={{fontSize:9,opacity:.7}}>月額固定</span></SelBtn>
        <SelBtn active={p.repayType==="principal"} onClick={()=>set("repayType")("principal")}>元金均等<br/><span style={{fontSize:9,opacity:.7}}>利息逓減</span></SelBtn>
      </div>
    </div>
    <Acc title="金利変動シナリオ（任意）">
      <Slider min={0} max={25} step={1} value={p.rateChgYr} onChange={set("rateChgYr")} display={p.rateChgYr>0?`${p.rateChgYr}年目`:"なし"}/>
      {p.rateChgYr>0&&<Slider min={0.5} max={5} step={0.1} value={p.rateAfter} onChange={set("rateAfter")} display={`${p.rateAfter.toFixed(1)}%`}/>}
    </Acc>
  </div>);

  const InputRevenue=()=>(<div>
    <div style={{marginBottom:10}}><FL>安定期入居率<Req/></FL><Slider min={60} max={100} step={1} value={p.occ} onChange={set("occ")} unit="%" hint={`${p.city}の平均空室率: ${areaInfo.vacancy}% → 入居率${(100-areaInfo.vacancy).toFixed(1)}%`}/></div>
    <div style={{marginBottom:10}}><FL>賃料下落率<Req/></FL><Slider min={0} max={3} step={0.1} value={p.rentDecline} onChange={set("rentDecline")} unit="%/年"/></div>
    <Acc title="駐車場・初期入居率">
      <div style={{fontSize:10,color:C.gray,marginBottom:6}}>初年度入居率</div>
      <Slider min={50} max={100} step={1} value={p.occInit} onChange={set("occInit")} unit="%"/>
      <div style={{fontSize:10,color:C.gray,marginBottom:6}}>駐車場台数</div>
      <Slider min={0} max={20} step={1} value={p.parking} onChange={set("parking")} unit="台"/>
      <div style={{fontSize:10,color:C.gray,marginBottom:6}}>駐車場賃料</div>
      <Slider min={0} max={5} step={0.5} value={p.parkRent} onChange={set("parkRent")} unit="万/台"/>
    </Acc>
    <Acc title="一時金・入退去設定">
      <div style={{fontSize:10,color:C.gray,marginBottom:6,lineHeight:1.5}}>
        礼金・更新料は該当年のCF表に別行で反映されます。
      </div>
      <div style={{marginBottom:4}}><FL>礼金</FL><Slider min={0} max={3} step={0.5} value={p.keyMoneys} onChange={set("keyMoneys")} unit="ヶ月"/></div>
      <div style={{marginBottom:4}}><FL>更新料</FL><Slider min={0} max={3} step={0.5} value={p.renewalFee} onChange={set("renewalFee")} unit="ヶ月"/></div>
      <div style={{marginBottom:4}}><FL>更新間隔</FL><Slider min={1} max={5} step={1} value={p.renewalYears} onChange={set("renewalYears")} unit="年"/></div>
      <div style={{marginBottom:4}}><FL>平均入居年数</FL><Slider min={1} max={10} step={1} value={p.avgTenantYears} onChange={set("avgTenantYears")} unit="年"/></div>
      <div style={{marginBottom:4}}><FL>敷金</FL><Slider min={0} max={3} step={0.5} value={p.depositMonths} onChange={set("depositMonths")} unit="ヶ月"/></div>
      <div style={{fontSize:10,color:C.gray,background:"#F8FAFC",borderRadius:6,padding:"6px 8px",lineHeight:1.6}}>
        💡 礼金: {p.keyMoneys}ヶ月 × {sim.totalUnits}戸 × 月額{sim.blendedRent.toFixed(1)}万 ≈ {(p.keyMoneys*sim.totalUnits*sim.blendedRent).toFixed(0)}万/回<br/>
        更新料: {p.renewalFee}ヶ月 × {sim.totalUnits}戸 × 月額{sim.blendedRent.toFixed(1)}万 ≈ {(p.renewalFee*sim.totalUnits*sim.blendedRent).toFixed(0)}万/{p.renewalYears}年
      </div>
    </Acc>
  </div>);

  const InputCost=()=>(<div>
    <div style={{marginBottom:10}}><FL>管理委託費率<Req/></FL><Slider min={3} max={10} step={0.5} value={p.mgmtRate} onChange={set("mgmtRate")} unit="%"/></div>
    <div style={{marginBottom:10}}><FL><Term>修繕積立</Term>（年間）<Req/></FL><Slider min={10} max={200} step={5} value={p.repairRes} onChange={set("repairRes")} unit="万/年"/></div>
    <div style={{marginBottom:10}}><FL>年間修繕費（随時修繕）<Opt/></FL>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{flex:1}}><NIn value={p.annualRepair} onChange={set("annualRepair")}/></div>
        <span style={{fontSize:11,color:C.gray,whiteSpace:"nowrap"}}>万/年</span>
      </div>
      <div style={{fontSize:10,color:C.gray,marginTop:3}}>入退去時クリーニング・随時修繕費。修繕積立とは別に年単位で計上。</div>
    </div>
    <div style={{marginBottom:10}}><FL><Term>固定資産税</Term>・都市計画税<Req/></FL>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{flex:1}}><NIn value={p.propTax} onChange={set("propTax")}/></div>
        <span style={{fontSize:11,color:C.gray,whiteSpace:"nowrap"}}>万/年</span>
      </div>
    </div>
    <div style={{marginBottom:10}}><FL>火災保険料<Req/></FL>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{flex:1}}><NIn value={p.insure} onChange={set("insure")}/></div>
        <span style={{fontSize:11,color:C.gray,whiteSpace:"nowrap"}}>万/年</span>
      </div>
    </div>
    <div style={{marginBottom:10}}><FL>共用部光熱費<Opt/></FL>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{flex:1}}><NIn value={p.util} onChange={set("util")}/></div>
        <span style={{fontSize:11,color:C.gray,whiteSpace:"nowrap"}}>万/年</span>
      </div>
    </div>
    <div style={{marginBottom:12}}>
      <FL>大規模修繕計画<Req/></FL>
      {p.majorRepairs.map((r,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:6,marginBottom:6}}>
          <div><div style={{fontSize:10,color:C.gray,marginBottom:2}}>実施年</div><NIn value={r.yr} onChange={v=>{const nr=[...p.majorRepairs];nr[i]={...nr[i],yr:v};set("majorRepairs")(nr);}}/></div>
          <div><div style={{fontSize:10,color:C.gray,marginBottom:2}}>費用（万円）</div><NIn value={r.cost} onChange={v=>{const nr=[...p.majorRepairs];nr[i]={...nr[i],cost:v};set("majorRepairs")(nr);}}/></div>
          <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={()=>set("majorRepairs")(p.majorRepairs.filter((_,j)=>j!==i))} style={{padding:"6px 8px",background:"#FEE2E2",color:C.red,border:"none",borderRadius:6,cursor:"pointer",fontWeight:700}}>✕</button></div>
        </div>
      ))}
      <button onClick={()=>set("majorRepairs")([...p.majorRepairs,{yr:20,cost:600}])} style={{padding:"5px 12px",background:C.light,color:C.gray,border:`1px dashed ${C.border}`,borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>＋ 修繕計画を追加</button>
    </div>
  </div>);

  const InputExit=()=>{
    const autoBrok=sim.exitPrice>0?Math.round((sim.exitPrice*0.03+6)*1.1):0;
    return(<div>
    <div style={{marginBottom:10}}><FL>保有期間<Req/></FL><Slider min={5} max={50} step={1} value={p.holdYrs} onChange={set("holdYrs")} unit="年" hint={`表は借入${p.loanYears}年分まで表示`}/></div>
    <div style={{marginBottom:10}}><FL>売却想定利回り<Req/></FL><Slider min={3} max={15} step={0.5} value={p.exitYield} onChange={set("exitYield")} unit="%" hint="低いほど高値売却。築年数・立地・市場環境が影響します。"/></div>
    <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
      <div style={{fontSize:10,color:C.purple,fontWeight:700,marginBottom:4}}>🏷️ {p.holdYrs}年後の売却試算</div>
      <div style={{fontSize:20,fontWeight:700,color:C.purple}}>{fmtOku(sim.exitPrice)}</div>
      <div style={{fontSize:11,color:C.purple,marginTop:4}}>手取り（譲渡所得税・仲介・残債後）：<strong>{fmtOku(sim.exitNet)}</strong></div>
    </div>
    <div style={{marginBottom:10}}>
      <FL>利回り判断目標ライン<Req/></FL>
      <Slider min={1} max={15} step={0.5} value={p.yieldRef} onChange={set("yieldRef")} unit="%"/>
      <div style={{fontSize:10,color:C.gray,marginTop:2}}>KPI（表面利回り）のOK/NG判定に使用</div>
    </div>
    <Acc title="売却時 譲渡所得税・仲介手数料（任意）">
      <div style={{fontSize:10,color:C.gray,marginBottom:6}}>仲介手数料率（%）— 実際の手数料: (売却額×3%+6万)×消費税</div>
      <Slider min={0} max={5} step={0.5} value={p.exitBrok} onChange={set("exitBrok")} unit="%"/>
      <div style={{fontSize:10,color:C.blue,background:"#EFF6FF",borderRadius:6,padding:"5px 8px",marginTop:4}}>
        💡 自動計算: (売却{fmtOku(sim.exitPrice)}×3%+6万)×1.1 ≈ <strong>{fmtM(autoBrok)}</strong>
      </div>
    </Acc>
    <div style={{marginTop:12}}><FL>給与年収（節税計算用）<Req/></FL>
      <Slider min={300} max={5000} step={50} value={p.salary} onChange={set("salary")} unit="万円" hint="減価償却費との損益通算による節税額の算出に使用します。"/>
    </div>
    <Acc title="取引事例（不動産鑑定用・任意）">
      <div style={{fontSize:10,color:C.gray,marginBottom:8}}>成約事例がある場合のみ入力。取引事例比較法の算出に使用します。</div>
      {p.comparables.map((c,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:6,marginBottom:6}}>
          <input value={c.label} onChange={e=>{const nc=[...p.comparables];nc[i]={...nc[i],label:e.target.value};set("comparables")(nc);}} placeholder="事例名" style={{padding:"6px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}}/>
          <input type="number" value={c.price} onChange={e=>{const nc=[...p.comparables];nc[i]={...nc[i],price:+e.target.value};set("comparables")(nc);}} placeholder="価格（万円）" style={{padding:"6px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:11}}/>
          <button onClick={()=>set("comparables")(p.comparables.filter((_,j)=>j!==i))} style={{padding:"6px 8px",background:"#FEE2E2",color:C.red,border:"none",borderRadius:6,cursor:"pointer"}}>✕</button>
        </div>
      ))}
      <button onClick={()=>set("comparables")([...p.comparables,{label:`事例${p.comparables.length+1}`,price:8000}])} style={{width:"100%",padding:"7px",background:"#EFF6FF",border:`1.5px dashed ${C.blue}`,borderRadius:7,color:C.blue,fontSize:11,fontWeight:600,cursor:"pointer"}}>＋ 取引事例を追加</button>
    </Acc>
  </div>);};

  const InputLoanSim = () => {
    const [bankId, setBankId] = useState('mufg');
    const [ls, setLs] = useState({
      annIncome: 800,
      loanYears: 30,
      existingMonthly: 0,
    });
    const [manualRate, setManualRate] = useState(null);     // null = 銀行プリセット使用
    const [manualReviewRate, setManualReviewRate] = useState(null);
    const setL = k => v => setLs(prev=>({...prev,[k]:v}));

    const bank = BANKS.find(b=>b.id===bankId) || BANKS[0];
    const execRate    = manualRate       !== null ? manualRate       : bank.rate;
    const reviewRate  = manualReviewRate !== null ? manualReviewRate : bank.reviewRate;
    const ratio = bank.ratioTiers.find(t=>ls.annIncome<=t.max)?.r || 35;

    const maxAnnualDS   = ls.annIncome * ratio / 100;
    const maxMonthlyDS  = maxAnnualDS / 12 - ls.existingMonthly;
    const revM = reviewRate / 100 / 12;
    const nMon = ls.loanYears * 12;
    // 借入可能額は「審査金利」で算出（金融機関の実務に準拠）
    const maxLoan = maxMonthlyDS > 0 && revM > 0
      ? (maxMonthlyDS * 10000 * (1 - Math.pow(1+revM,-nMon)) / revM) / 10000
      : (maxMonthlyDS > 0 ? maxMonthlyDS * nMon : 0);
    // 実際の月次返済は「実行金利」で算出
    const execM = execRate / 100 / 12;
    const actualMonthly = maxLoan > 0 && execM > 0
      ? (maxLoan * 10000 * (execM * Math.pow(1+execM,nMon)) / (Math.pow(1+execM,nMon)-1)) / 10000
      : 0;
    const propPrice = p.buildCost + (p.hasLand?0:p.landCost);
    const minEquity = Math.max(0, propPrice - maxLoan);

    const handleBankChange = (id) => {
      setBankId(id);
      setManualRate(null);
      setManualReviewRate(null);
    };

    return (
      <div>
        <div style={{fontSize:11,color:C.gray,background:"#EFF6FF",borderRadius:8,padding:"8px 10px",marginBottom:14,lineHeight:1.6}}>
          💡 審査金利で借入可能額を算出し、実行金利で実際の返済額を計算します（金融機関の実務に準拠）。
        </div>

        {/* 金融機関セレクター */}
        <FL>金融機関を選択</FL>
        <select
          value={bankId}
          onChange={e=>handleBankChange(e.target.value)}
          style={{width:"100%",padding:"8px 10px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.navy,background:"#fff",marginBottom:14,cursor:"pointer"}}
        >
          {BANKS.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        {/* 金利プリセット表示 + 手動上書き */}
        <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:14,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,fontWeight:700,color:C.navy,marginBottom:8}}>📋 {bank.name} 金利情報（2026年5月）</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontSize:9,color:C.gray,marginBottom:3}}>実行金利（返済額計算用）</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input
                  type="number" step="0.001" min="0.1" max="10"
                  value={manualRate !== null ? manualRate : bank.rate}
                  onChange={e=>setManualRate(+e.target.value)}
                  style={{flex:1,padding:"6px 8px",border:`1px solid ${manualRate!==null?C.blue:C.border}`,borderRadius:6,fontSize:13,fontWeight:700,color:C.navy}}
                />
                <span style={{fontSize:11,color:C.gray}}>%</span>
              </div>
              {manualRate!==null&&<button onClick={()=>setManualRate(null)} style={{fontSize:9,color:C.blue,background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}>↩ リセット ({bank.rate}%)</button>}
            </div>
            <div>
              <div style={{fontSize:9,color:C.gray,marginBottom:3}}>審査金利（借入可能額計算用）</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input
                  type="number" step="0.001" min="0.1" max="10"
                  value={manualReviewRate !== null ? manualReviewRate : bank.reviewRate}
                  onChange={e=>setManualReviewRate(+e.target.value)}
                  style={{flex:1,padding:"6px 8px",border:`1px solid ${manualReviewRate!==null?C.blue:C.border}`,borderRadius:6,fontSize:13,fontWeight:700,color:C.amber}}
                />
                <span style={{fontSize:11,color:C.gray}}>%</span>
              </div>
              {manualReviewRate!==null&&<button onClick={()=>setManualReviewRate(null)} style={{fontSize:9,color:C.blue,background:"none",border:"none",cursor:"pointer",padding:"2px 0"}}>↩ リセット ({bank.reviewRate}%)</button>}
            </div>
          </div>
          <div style={{fontSize:9,color:C.gray}}>
            返済比率上限（年収 {ls.annIncome}万円）：<strong style={{color:C.navy}}>{ratio}%</strong>
            <span style={{marginLeft:6}}>（{bank.ratioTiers.map(t=>`〜${t.max===9999?"":t.max+"万"}${t.r}%`).join(' / ')}）</span>
          </div>
        </div>

        <FL>年収</FL>
        <Slider min={300} max={2000} step={50} value={ls.annIncome} onChange={setL("annIncome")} display={`${ls.annIncome}万円`}/>
        <FL>返済期間</FL>
        <Slider min={10} max={35} step={1} value={ls.loanYears} onChange={setL("loanYears")} display={`${ls.loanYears}年`}/>
        <FL>既存ローン返済額（月額）</FL>
        <Slider min={0} max={50} step={0.5} value={ls.existingMonthly} onChange={setL("existingMonthly")} display={`${ls.existingMonthly}万円/月`} hint="住宅ローン・カーローン等の既存返済額（合算）"/>

        {/* 試算結果 */}
        <div style={{background:C.navy,borderRadius:10,padding:"14px 16px",marginTop:10}}>
          <div style={{fontSize:10,color:"#93C5FD",marginBottom:10,letterSpacing:"0.05em"}}>試算結果（{bank.name}）</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:9,color:"#93C5FD",marginBottom:2}}>借入可能額（審査金利 {reviewRate}%）</div>
              <div style={{fontSize:18,fontWeight:700,color:maxLoan>0?"#86EFAC":"#FCA5A5"}}>
                {maxLoan>0?`${Math.round(maxLoan).toLocaleString()}万円`:"試算不可"}
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:9,color:"#93C5FD",marginBottom:2}}>実際の月次返済（実行金利 {execRate}%）</div>
              <div style={{fontSize:18,fontWeight:700,color:"#FDE68A"}}>
                {actualMonthly>0?`${actualMonthly.toFixed(1)}万円/月`:"—"}
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:"#93C5FD"}}>月次返済上限</div>
              <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{maxMonthlyDS.toFixed(1)}万/月</div>
            </div>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:"#93C5FD"}}>必要自己資金</div>
              <div style={{fontSize:13,fontWeight:600,color:minEquity>0?"#FCA5A5":"#86EFAC"}}>
                {minEquity>0?`${Math.round(minEquity).toLocaleString()}万+`:"自己資金不要"}
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:"#93C5FD"}}>適用返済比率</div>
              <div style={{fontSize:13,fontWeight:600,color:"#FDE68A"}}>{ratio}%</div>
            </div>
          </div>
          <div style={{marginTop:8,fontSize:9,color:"#64748B",lineHeight:1.6}}>
            ※ 借入可能額は審査金利で算出します（金融機関の実際の審査基準）。実際の月次返済は実行金利で計算しています。金融機関により審査基準は異なります。
          </div>
        </div>
      </div>
    );
  };

  const InputPurchaseDetail = () => {
    const pd = p.purchaseDetail || DEFAULT_PD;
    const updatePD = patch => set("purchaseDetail")({...pd, ...patch});
    const landBuildYen = (p.buildCost + (p.hasLand ? 0 : p.landCost)) * 10000;
    const loanFeeAuto  = Math.round(sim.loan * 10000 * 0.022);

    // アイテム操作ヘルパー
    const updateItem = (listKey, id, patch) =>
      updatePD({[listKey]: pd[listKey].map(i => i.id === id ? {...i, ...patch} : i)});
    const addItem = listKey => {
      const newId = `custom_${Date.now()}`;
      updatePD({[listKey]: [...pd[listKey], {id:newId, label:"", amount:0, note:"", isJitsu:false}]});
    };
    const removeItem = (listKey, id) =>
      updatePD({[listKey]: pd[listKey].filter(i => i.id !== id)});

    // 小計
    const miscNum  = pd.miscItems .filter(i=>!i.isJitsu).reduce((s,i)=>s+(i.amount||0),0);
    const bankNum  = pd.bankItems .filter(i=>!i.isJitsu).reduce((s,i)=>s+(i.amount||0),0);
    const otherNum = pd.otherItems.filter(i=>!i.isJitsu).reduce((s,i)=>s+(i.amount||0),0);
    const grandTotal = landBuildYen + miscNum + bankNum + otherNum;
    const fmt = v => (v||0).toLocaleString();

    // PDF出力
    const [pdLoading, setPdLoading] = useState(false);
    const handlePurchasePDF = async () => {
      if(pdLoading) return;
      setPdLoading(true);
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;";
      document.body.appendChild(container);
      const el = document.createElement("div");
      container.appendChild(el);
      const root = ReactDOM.createRoot(el);
      root.render(<PurchasePDFPage pd={pd} landBuildYen={landBuildYen}/>);
      await new Promise(r => setTimeout(r, 600));
      try {
        const name = pd.propertyName || "物件";
        const d = new Date().toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"});
        await exportToPDF([el], `${name}_購入資金明細_${d.replace(/[年月日]/g,"")}.pdf`);
      } finally {
        document.body.removeChild(container);
        setPdLoading(false);
      }
    };

    // UI部品
    const SectionBar = ({label, listKey}) => (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#EEF2F7",padding:"5px 10px",borderBottom:`1px solid ${C.border}`,borderTop:`1px solid ${C.border}`,marginTop:10}}>
        <span style={{fontSize:10.5,fontWeight:700,color:C.navy,letterSpacing:"0.04em"}}>{label}</span>
        <button onClick={()=>addItem(listKey)} style={{fontSize:10,color:C.blue,background:"#EFF6FF",border:`1px solid ${C.blue}`,borderRadius:5,padding:"2px 8px",cursor:"pointer"}}>＋ 項目追加</button>
      </div>
    );
    const SubtotalBar = ({amount}) => (
      <div style={{display:"flex",justifyContent:"space-between",padding:"5px 10px",background:"#F5F7FA",borderBottom:`1px solid ${C.border}`,borderTop:`1px solid ${C.border}`}}>
        <span style={{fontSize:10.5,fontWeight:700,color:C.navy}}>小計</span>
        <span style={{fontSize:11,fontWeight:700,color:C.navy}}>{fmt(amount)} 円</span>
      </div>
    );

    const ItemRowEdit = ({listKey, item, hint}) => {
      const isCustom = item.id.startsWith("custom_");
      return (
        <div style={{borderBottom:`1px solid ${C.border}`,padding:"7px 10px",background:"#fff"}}>
          {/* ラベル行 */}
          <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:4}}>
            {isCustom
              ? <TextIn value={item.label} onChange={v=>updateItem(listKey,item.id,{label:v})}
                  placeholder="項目名を入力" style={{flex:1,fontSize:11,padding:"2px 6px",border:`1px solid ${C.border}`,borderRadius:4,color:C.navy}}/>
              : <span style={{flex:1,fontSize:11,fontWeight:600,color:C.slate}}>{item.label}</span>
            }
            <label style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:C.gray,whiteSpace:"nowrap",cursor:"pointer"}}>
              <input type="checkbox" checked={item.isJitsu} onChange={e=>updateItem(listKey,item.id,{isJitsu:e.target.checked})} style={{accentColor:C.blue}}/>
              実費
            </label>
            {isCustom && <button onClick={()=>removeItem(listKey,item.id)} style={{fontSize:10,color:"#DC2626",background:"none",border:"none",cursor:"pointer",padding:"0 2px",lineHeight:1}}>✕</button>}
          </div>
          {/* 金額・備考 */}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {item.isJitsu
              ? <span style={{flex:"0 0 130px",fontSize:11,color:C.gray,padding:"3px 6px",border:`1px solid ${C.border}`,borderRadius:4,background:"#F8FAFC",textAlign:"right"}}>実費</span>
              : <input type="number" step="1" min="0" value={item.amount||0}
                  onChange={e=>updateItem(listKey,item.id,{amount:parseInt(e.target.value)||0})}
                  style={{flex:"0 0 130px",fontSize:12,fontWeight:600,color:C.navy,padding:"3px 6px",border:`1.5px solid ${C.border}`,borderRadius:4,textAlign:"right"}}/>
            }
            <span style={{fontSize:10,color:C.gray,whiteSpace:"nowrap"}}>円</span>
            <TextIn value={item.note||""} onChange={v=>updateItem(listKey,item.id,{note:v})}
              placeholder="備考" style={{flex:1,fontSize:10,padding:"3px 6px",border:`1px solid ${C.border}`,borderRadius:4,color:C.slate}}/>
          </div>
          {hint&&<div style={{fontSize:9,color:C.blue,marginTop:3}}>💡 {hint}</div>}
        </div>
      );
    };

    return (
      <div>
        {/* ヘッダー：物件名・日付・PDF出力 */}
        <div style={{background:"#F8FAFC",border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",marginBottom:10}}>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10.5,fontWeight:600,color:C.slate,whiteSpace:"nowrap"}}>物件名</span>
            <input value={pd.propertyName||""} onChange={e=>updatePD({propertyName:e.target.value})}
              placeholder="例：南浦和分譲 A号棟" style={{flex:1,fontSize:11,padding:"4px 8px",border:`1px solid ${C.border}`,borderRadius:5,color:C.navy}}/>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:10.5,fontWeight:600,color:C.slate,whiteSpace:"nowrap"}}>日付</span>
            <input value={pd.date||""} onChange={e=>updatePD({date:e.target.value})}
              placeholder="例：令和8年4月17日" style={{flex:1,fontSize:11,padding:"4px 8px",border:`1px solid ${C.border}`,borderRadius:5,color:C.navy}}/>
          </div>
          <button onClick={handlePurchasePDF} disabled={pdLoading} style={{width:"100%",padding:"7px",background:pdLoading?"#475569":C.navy,color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:700,cursor:pdLoading?"not-allowed":"pointer"}}>
            {pdLoading?"⏳ 生成中...":"🖨 PDF出力（購入資金明細）"}
          </button>
        </div>

        {/* 購入費内訳（参照） */}
        <div style={{background:"#EEF2F7",padding:"5px 10px",borderBottom:`1px solid ${C.border}`,fontSize:10.5,fontWeight:700,color:C.navy,letterSpacing:"0.04em"}}>購入費内訳（参照）</div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderBottom:`1px solid ${C.border}`,background:"#F8FAFC"}}>
          <span style={{fontSize:11,color:C.slate}}>土地建物購入費</span>
          <span style={{fontSize:12,fontWeight:600,color:C.navy}}>{fmt(landBuildYen)} 円</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",borderBottom:`1px solid ${C.border}`,background:"#F8FAFC"}}>
          <span style={{fontSize:11,color:C.slate}}>消費税</span>
          <input value={pd.taxNote||""} onChange={e=>updatePD({taxNote:e.target.value})}
            style={{fontSize:11,color:C.slate,border:"none",background:"transparent",textAlign:"right",width:160}}/>
        </div>
        <SubtotalBar amount={landBuildYen}/>

        {/* 諸費用内訳 */}
        <SectionBar label="諸費用内訳" listKey="miscItems"/>
        {pd.miscItems.map(item => (
          <ItemRowEdit key={item.id} listKey="miscItems" item={item}
            hint={item.id==="broker" ? `仲介手数料自動計算: (物件価格×3%+6万)×1.1 ≈ ${Math.round((landBuildYen/10000*0.03+6)*1.1)}万円` : undefined}/>
        ))}
        <SubtotalBar amount={miscNum}/>

        {/* 銀行費用内訳 */}
        <SectionBar label="銀行費用内訳" listKey="bankItems"/>
        {pd.bankItems.map(item => (
          <ItemRowEdit key={item.id} listKey="bankItems" item={item}
            hint={item.id==="loanFee" ? `借入${sim.loan}万円 × 2.2% ≈ ${loanFeeAuto.toLocaleString()}円` : undefined}/>
        ))}
        <SubtotalBar amount={bankNum}/>

        {/* その他 */}
        <SectionBar label="その他" listKey="otherItems"/>
        {pd.otherItems.map(item => <ItemRowEdit key={item.id} listKey="otherItems" item={item}/>)}

        {/* 合計 */}
        <div style={{background:C.navy,borderRadius:8,padding:"12px 14px",marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:"#93C5FD",marginBottom:3}}>合計（概算）</div>
              <div style={{fontSize:20,fontWeight:700,color:"#fff"}}>{fmt(grandTotal)} 円</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#93C5FD",marginBottom:3}}>諸費用率</div>
              <div style={{fontSize:17,fontWeight:700,color:"#FDE68A"}}>{landBuildYen>0?((miscNum+bankNum+otherNum)/landBuildYen*100).toFixed(1):0}%</div>
            </div>
          </div>
        </div>

        {/* 会社情報 */}
        <div style={{marginTop:12,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",background:"#F8FAFC"}}>
          <div style={{fontSize:10,fontWeight:700,color:C.navy,marginBottom:6}}>会社情報（PDF右下に表示）</div>
          {[["company","会社名"],["address","住所"],["tel","TEL"]].map(([k,label])=>(
            <div key={k} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:10,color:C.gray,width:36}}>{label}</span>
              <input value={pd[k]||""} onChange={e=>updatePD({[k]:e.target.value})}
                style={{flex:1,fontSize:11,padding:"3px 6px",border:`1px solid ${C.border}`,borderRadius:4,color:C.navy}}/>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const InputAssetConfig = () => {
    const life = STRUCTURES[p.structure]?.life || 22;
    const deprAnnual = R(p.buildCost / life);
    const yr1 = sim.yr1 || {};
    const Section = ({color, title, children}) => (
      <div style={{border:`1px solid ${C.border}`,borderLeft:`4px solid ${color}`,borderRadius:6,padding:"10px 12px",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:8}}>{title}</div>
        <div style={{fontSize:11,color:C.slate,lineHeight:1.9}}>{children}</div>
      </div>
    );
    const Val = ({label, value, unit=""}) => (
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 8px",background:"#F8FAFC",borderRadius:4,marginTop:4}}>
        <span style={{fontSize:10,color:C.gray}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:C.navy}}>{value}{unit}</span>
      </div>
    );
    return (
      <div>
        <div style={{fontSize:11,color:C.gray,background:"#FFF7ED",borderRadius:8,padding:"8px 10px",marginBottom:12,lineHeight:1.6,border:`1px solid #FED7AA`}}>
          📐 このシミュレーションで使っている減価償却・資産評価の考え方を説明します。
        </div>

        <Section color="#2563EB" title="① 年間の減価償却費">
          <div>建物は税務上、毎年一定額ずつ価値が目減りしていくと見なします。</div>
          <div style={{marginTop:4}}>この目減り額を「減価償却費」と呼び、<strong>建築費を法定耐用年数で均等に割った金額</strong>がそのまま毎年の経費として計上されます。</div>
          <div style={{marginTop:6,fontSize:10,color:C.gray}}>例：建築費{p.buildCost.toLocaleString()}万円 ÷ {STRUCTURES[p.structure]?.label}{life}年 ＝ 毎年 約{deprAnnual.toLocaleString()}万円を経費計上</div>
          <Val label="現在の設定での年間償却費" value={deprAnnual.toLocaleString()} unit="万円/年"/>
          <div style={{marginTop:8,fontSize:10,color:C.gray}}>※ {life}年を超えると減価償却は終了し、それ以降は経費として計上できなくなります。</div>
        </Section>

        <Section color="#7C3AED" title="② 建物の帳簿上の残存価値">
          <div>毎年償却が進むにつれて、帳簿上の建物価値は少しずつ下がります。</div>
          <div style={{marginTop:4}}>{life}年かけてちょうど0円になるイメージです。CF表の「残償却金額」欄に各年の値が表示されます。</div>
          <Val label="1年目の建物帳簿価値" value={Math.max(0,R(p.buildCost*(1-1/life))).toLocaleString()} unit="万円"/>
          <Val label={`${life}年目（耐用年数終了）`} value="0" unit="万円"/>
        </Section>

        <Section color="#059669" title="③ 売却価格の推計（収益還元法）">
          <div>「この物件を売るといくらになるか」を、<strong>その時点の年間収益（NOI）から逆算</strong>して推計します。</div>
          <div style={{marginTop:4}}>買い手が「この利回りなら買う」と考える水準で割り戻した価格です。利回り設定が低いほど高値売却を意味します。</div>
          <div style={{marginTop:6,fontSize:10,color:C.gray}}>例：初年度のNOI {(yr1.noi||0).toLocaleString()}万円 ÷ 売却想定利回 {p.exitYield}% ＝ 推計売却額 {(yr1.incVal||0).toLocaleString()}万円</div>
          <Val label="初年度の推計売却額" value={(yr1.incVal||0).toLocaleString()} unit="万円"/>
          <div style={{marginTop:8,fontSize:10,color:C.gray}}>※ 売却想定利回は「出口・税務」タブで変更できます。</div>
        </Section>

        <Section color="#DC2626" title="④ ネットワース（実質的な資産価値）">
          <div>推計売却額からローンの残債を差し引いた額が、<strong>その時点で売却した場合に手元に残るお金</strong>です。</div>
          <div style={{marginTop:4}}>プラスであれば売却益が出る状態、マイナスであれば残債の方が多い状態（いわゆる「オーバーローン」）を意味します。</div>
          <Val label="初年度のネットワース" value={`${(yr1.nw||0)>=0?"+":""}${(yr1.nw||0).toLocaleString()}`} unit="万円"/>
        </Section>

        <div style={{background:"#F1F5F9",borderRadius:8,padding:"10px 12px",marginTop:4}}>
          <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:6}}>🔧 各数値の変更方法</div>
          <div style={{fontSize:10,color:C.slate,lineHeight:1.9}}>
            <div>• 建築費 → 「土地・建物」タブ</div>
            <div>• 建物構造・耐用年数 → 「土地・建物」タブの構造選択（木造22年 / 軽鉄27年 / RC造47年）</div>
            <div>• 売却想定利回 → 「出口・税務」タブ</div>
            <div>• 賃料・入居率・コスト → 「間取り」「収益」「コスト」タブ</div>
          </div>
        </div>
      </div>
    );
  };

  // アコーディオン状態保持のため関数直接呼び出し（hook使用コンポーネントはJSX）
  const renderPanel=()=>{
    switch(inputTab){
      case"main":     return InputMain();
      case"rooms":    return InputRooms();
      case"finance":  return InputFinance();
      case"revenue":  return InputRevenue();
      case"cost":     return InputCost();
      case"exit":     return InputExit();
      case"loan":     return <InputLoanSim/>;
      case"purchase": return <InputPurchaseDetail/>;
      case"asset":    return <InputAssetConfig/>;
      default:        return null;
    }
  };

  // ── CHART VIEW ─────────────────────────────────────────────────
  const ChartView=()=>(
    <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
      {/* summary */}
      <div style={{background:C.navy,borderRadius:10,padding:"14px 18px",color:"#fff",marginBottom:14}}>
        <div style={{fontSize:11,color:"#93C5FD",marginBottom:8}}>{p.pref} {p.city} / {sim.totalUnits}戸 / {STRUCTURES[p.structure]?.label} / 保有{p.holdYrs}年</div>
        {/* 実質負担額 */}
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
          <div style={{fontSize:10,color:"#BAD6F0",marginBottom:3,display:"flex",alignItems:"center",gap:4}}>実質負担額（最終的な持ち出し）<InfoIcon term="実質負担額"/></div>
          <div style={{fontSize:22,fontWeight:700,color:sim.netBurden<=0?"#4ADE80":"#FCA5A5"}}>{sim.netBurden<=0?"−":"+"}{fmtM(Math.abs(sim.netBurden))}</div>
          <div style={{fontSize:10,color:"#93C5FD",marginTop:3}}>自己資金{fmtM(p.equity)} − CF累計{fmtM(sim.last.cum||0)} − 売却手取{fmtM(sim.exitNet)}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[{l:"総投資額",v:fmtOku(sim.totalInvest),c:"#fff"},{l:`${p.holdYrs}年CF累計`,v:fmtOku(sim.last.cum||0),c:(sim.last.cum||0)>=0?"#86EFAC":"#FCA5A5"},{l:"売却手取り",v:fmtOku(sim.exitNet),c:"#C4B5FD"},{l:"節税累計",v:`+${fmtM(sim.taxSavingSum)}`,c:"#86EFAC"}].map(x=>(
            <div key={x.l} style={{background:"rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",minWidth:88}}>
              <div style={{fontSize:10,color:"#93C5FD",marginBottom:2}}>{x.l}</div>
              <div style={{fontSize:15,fontWeight:700,color:x.c}}>{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 累計CF */}
      <CS title="① 累計キャッシュフロー推移" desc="0ラインを超えた年が投資回収完了。売却手取りは含みません。">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
            <XAxis dataKey="year" tick={{fontSize:10}} tickFormatter={v=>`${v}年`} interval="preserveStartEnd"/>
            <YAxis tick={{fontSize:10}} tickFormatter={tf} width={60}/>
            <Tooltip content={<Tip/>}/>
            <ReferenceLine y={0} stroke="#DC2626" strokeDasharray="5 3" strokeWidth={1.5}/>
            <Area type="monotone" dataKey="cum" name="累計CF" stroke="#534AB7" fill="#EDE9FE" strokeWidth={2.5} dot={false}/>
            <Line type="monotone" dataKey="bal" name="残債残高" stroke="#94A3B8" strokeDasharray="5 3" strokeWidth={1.5} dot={false}/>
          </ComposedChart>
        </ResponsiveContainer>
      </CS>

      {/* 年次CF */}
      <CS title="② 年次キャッシュフロー（返済後）" desc="各年の手元キャッシュ。大規模修繕年に落ち込み、返済終了後に改善します。">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
            <XAxis dataKey="year" tick={{fontSize:10}} tickFormatter={v=>`${v}年`} interval="preserveStartEnd"/>
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`${R(v)}万`} width={60}/>
            <Tooltip content={<Tip/>}/>
            <ReferenceLine y={0} stroke="#DC2626" strokeWidth={1}/>
            <Bar dataKey="cfAD" name="年次CF" radius={[3,3,0,0]}>
              {chartRows.map((r,i)=><Cell key={i} fill={r.cfAD>=0?"#059669":"#DC2626"}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CS>

      {/* 不動産鑑定3手法 */}
      <CS title="③ 不動産鑑定評価（3手法）" desc="同じ物件でも評価の切り口によって価格が変わります。3手法の比較で物件価値を多面的に確認できます。">
        {[
          {no:"①",name:"原価法",termKey:"原価法",value:sim.costApproach,color:"#2E75B6",bg:"#EFF6FF",
           formula:"土地価格 ＋ 建物再調達原価 × (1 − 経年減点率)",
           desc:"「今この物件を新たに作るといくらかかるか」から価値を算出。建物が古いほど評価額は下がります。担保評価・保険評価で主に使われます。"},
          {no:"②",name:"収益還元法（DCF）",termKey:"収益還元法",value:sim.incomeApproach,color:"#7C3AED",bg:"#F5F3FF",
           formula:"最終年NOI ÷ 売却想定利回り",
           desc:"「この物件がどれだけ収益を生むか」から価値を算出。投資家・ファンドが最重視し、実際の売買価格に最も近い評価です。"},
          ...(sim.compApproach!==null?[{no:"③",name:"取引事例比較法",termKey:"取引事例比較法",value:sim.compApproach,color:"#059669",bg:"#F0FDF4",
             formula:`成約事例 ${p.comparables.length}件の平均価格`,
             desc:"「近隣類似物件がいくらで売れたか」から価値を算出。市場の実態を直接反映し、実際の売却活動の根拠になります。"}]:[]),
        ].map(item=>(
          <div key={item.no} style={{background:item.bg,borderRadius:10,padding:"11px 13px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:700,color:item.color,display:"flex",alignItems:"center",gap:4}}>{item.no} {item.name}{item.termKey&&<InfoIcon term={item.termKey}/>}</span>
              <span style={{fontSize:20,fontWeight:700,color:item.color}}>{fmtM(item.value)}</span>
            </div>
            <div style={{fontSize:10,background:"rgba(255,255,255,0.7)",borderRadius:5,padding:"4px 8px",marginBottom:6,color:C.gray,fontFamily:"monospace"}}>{item.formula}</div>
            <div style={{fontSize:11,color:C.slate,lineHeight:1.5}}>{item.desc}</div>
          </div>
        ))}
        {p.comparables.length===0&&<div style={{fontSize:11,color:C.gray,background:C.light,borderRadius:7,padding:"8px 10px",marginBottom:10}}>💡 取引事例を出口タブに入力すると取引事例比較法も表示されます</div>}
        <ResponsiveContainer width="100%" height={sim.compApproach!==null?160:120}>
          <BarChart layout="vertical" data={[
            {name:"原価法",value:R(sim.costApproach)},{name:"収益還元",value:R(sim.incomeApproach)},
            ...(sim.compApproach!==null?[{name:"取引事例",value:R(sim.compApproach)}]:[]),
          ]}>
            <XAxis type="number" hide/>
            <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={58}/>
            <Tooltip formatter={v=>[fmtM(v),"評価額"]}/>
            <Bar dataKey="value" radius={[0,6,6,0]}>
              {[{fill:"#2E75B6"},{fill:"#7C3AED"},{fill:"#059669"}].map((c,i)=><Cell key={i} fill={c.fill}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"8px 10px",marginTop:8,fontSize:11,lineHeight:1.6,color:"#92400E"}}>
          <strong>📌 読み方</strong>　収益還元法が最も実態に近い売買価格の目安です。原価法より高ければ「収益性が高い物件」、低ければ「収益が不足している」状態を示します。
        </div>
      </CS>

      {/* 税務・節税 */}
      <CS title="④ 税務シミュレーション" desc={`年収${p.salary}万円ベースの節税効果試算（概算）`}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {[
            {l:<><Term>減価償却</Term>費（年間）</>,v:`${fmtM(sim.deprAnnual)}/年`,c:C.navy},
            {l:<><>{p.holdYrs}年 節税累計（<Term>損益通算</Term>）</></>,v:fmtM(sim.taxSavingSum),c:C.green},
            {l:<><Term>不動産取得税</Term>（概算）</>,v:fmtM(sim.acqTax),c:C.amber},
            {l:"登録免許税（概算）",v:fmtM(sim.regTax),c:C.amber},
            {l:<><Term>譲渡税</Term>（売却時・概算）</>,v:fmtM(sim.transferTax),c:C.red},
            {l:"売却時 仲介手数料",v:fmtM(sim.exitBrokFee),c:C.red},
          ].map(x=>(
            <div key={x.l} style={{background:C.light,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:10,color:C.gray,marginBottom:3}}>{x.l}</div>
              <div style={{fontSize:14,fontWeight:700,color:x.c}}>{x.v}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,fontWeight:600,color:C.navy,marginBottom:8}}>年次節税効果</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
            <XAxis dataKey="year" tick={{fontSize:10}} tickFormatter={v=>`${v}年`} interval="preserveStartEnd"/>
            <YAxis tick={{fontSize:10}} tickFormatter={v=>`${R(v)}万`} width={48}/>
            <Tooltip content={<Tip/>}/>
            <Bar dataKey="taxSaving" name="節税額" fill="#059669" radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
        <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"8px 10px",marginTop:8,fontSize:11,lineHeight:1.6,color:C.green}}>
          建物の減価償却費（年{fmtM(sim.deprAnnual)}）を経費計上し、給与所得と合算することで節税できます。{p.holdYrs}年間の節税累計は約<strong>{fmtM(sim.taxSavingSum)}</strong>の試算です。
        </div>
      </CS>

      {/* 資産価値 */}
      <CS title="⑤ 資産価値の推移" desc="収益還元価値（NOI÷売却利回り）が実際の売買で最重視される価格。ネットワース＝収益還元価値−残債が正味の資産。">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
            <XAxis dataKey="year" tick={{fontSize:10}} tickFormatter={v=>`${v}年`} interval="preserveStartEnd"/>
            <YAxis tick={{fontSize:10}} tickFormatter={tf} width={60}/>
            <Tooltip content={<Tip/>}/>
            <Line type="monotone" dataKey="incVal"    name="収益還元価値" stroke="#534AB7" strokeWidth={2.5} dot={false}/>
            <Line type="monotone" dataKey="nw"        name="ネットワース" stroke="#059669" strokeWidth={2}   dot={false}/>
            <Line type="monotone" dataKey="bal"       name="残債残高"     stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>
            <Line type="monotone" dataKey="buildBook" name="建物帳簿価値" stroke="#94A3B8" strokeWidth={1.5} strokeDasharray="6 2" dot={false}/>
          </LineChart>
        </ResponsiveContainer>
        <div style={{display:"flex",gap:14,marginTop:8,flexWrap:"wrap",fontSize:11,color:C.gray}}>
          {[{c:"#534AB7",l:"収益還元価値"},{c:"#059669",l:"ネットワース"},{c:"#DC2626",l:"残債残高"},{c:"#94A3B8",l:"建物帳簿価値"}].map(x=>(
            <span key={x.l} style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:16,height:3,background:x.c,display:"inline-block",borderRadius:2}}/>{x.l}</span>
          ))}
        </div>
      </CS>
    </div>
  );

  // ── TABLE VIEW ─────────────────────────────────────────────────
  const TableView=()=>(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"8px 14px",background:"#F8FAFC",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,color:C.navy}}>年次収支表（{rows.length}年分 / 保有{p.holdYrs}年）　単位：万円</div>
        <div style={{fontSize:10,color:C.gray}}>🔧 大規模修繕年　💚 回収完了年</div>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        <table style={{borderCollapse:"collapse",fontSize:11,minWidth:`${210+rows.length*70}px`}}>
          <colgroup><col style={{width:200}}/>{rows.map((_,i)=><col key={i} style={{width:70}}/>)}</colgroup>
          <thead>
            <tr>
              <th style={{padding:"8px 12px",textAlign:"left",color:"#fff",fontWeight:600,fontSize:11,background:C.navy,position:"sticky",left:0,top:0,zIndex:12,borderRight:`1px solid rgba(255,255,255,0.15)`}}>項目</th>
              {rows.map((r,i)=>{
                const prev=i>0?rows[i-1]:null;
                const recovered=r.cum>=0&&(!prev||prev.cum<0);
                return(<th key={r.year} style={{padding:"8px 4px",textAlign:"right",color:"#fff",fontWeight:600,fontSize:10,background:r.majorR>0?"#374151":C.navy,whiteSpace:"nowrap",position:"sticky",top:0,zIndex:9,borderRight:`1px solid rgba(255,255,255,0.1)`}}>
                  {r.year}年{r.majorR>0?"🔧":""}{recovered?"💚":""}
                </th>);
              })}
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((rowDef,ri)=>{
              if(rowDef.type==="group")return(<tr key={ri} style={{background:"#F1F5F9"}}>
                <td colSpan={rows.length+1} style={{padding:"5px 12px",fontSize:10,fontWeight:700,color:C.gray,letterSpacing:"0.06em",textTransform:"uppercase",borderBottom:`1px solid ${C.border}`,position:"sticky",left:0,background:"#F1F5F9"}}>{rowDef.label}</td>
              </tr>);
              const isChild=rowDef.type==="child",isParent=rowDef.type==="parent";
              const rowBg=ri%2===0?"#fff":"#FAFAFA";
              return(<tr key={ri} style={{background:rowBg}}>
                <td style={{padding:isChild?"6px 12px 6px 24px":"6px 12px",fontSize:isChild?10:11,fontWeight:(isParent||rowDef.bold)?600:400,color:isChild?C.gray:C.slate,borderRight:`1px solid ${C.border}`,borderBottom:`0.5px solid ${C.border}`,position:"sticky",left:0,background:rowBg,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                  {isChild&&<span style={{color:"#CBD5E1",fontSize:11}}>└</span>}
                  {rowDef.label}{rowDef.term&&<InfoIcon term={rowDef.term}/>}
                </td>
                {rows.map((row,ci)=>{
                  const val=row[rowDef.key]??0;
                  let color=rowDef.color||C.slate;
                  if(rowDef.signed)color=val>=0?C.green:C.red;
                  if(rowDef.key==="majorR"&&val===0)color="#CBD5E1";
                  return(<td key={ci} style={{padding:"6px 8px",textAlign:"right",color,fontWeight:(isParent||rowDef.bold)?600:400,fontSize:isChild?10:11,borderRight:`0.5px solid ${C.border}`,borderBottom:`0.5px solid ${C.border}`,background:row.majorR>0&&rowDef.key==="majorR"?"#FFFBEB":"transparent"}}>
                    {val===0&&rowDef.dashIfZero?<span style={{color:"#CBD5E1"}}>—</span>:R(val).toLocaleString()}
                  </td>);
                })}
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.light,fontFamily:"'Noto Sans JP','Hiragino Sans',sans-serif",fontSize:13,color:C.slate,overflow:"hidden"}}>
      {/* top bar */}
      <div style={{background:C.navy,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:48,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBack&&(
            <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",background:"rgba(255,255,255,0.1)",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>
              ← 一覧
            </button>
          )}
          <div style={{width:4,height:24,background:"#2E75B6",borderRadius:2}}/>
          <div>
            <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{customer?.name||"新規シミュレーション"}</span>
            <span style={{fontSize:10,color:"#93C5FD",marginLeft:8}}>アパート一棟建て 収支シミュレーター｜概算・参考値</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {saved&&<span style={{fontSize:10,color:"#86EFAC"}}>✓ 保存済み</span>}
          <button
            onClick={()=>{
              if(customer&&onSave){
                onSave(customer.id, p, {grossY:sim.grossY,noiY:sim.noiY,irr:sim.irr,ccr:sim.ccr,dscr:sim.dscr,ltv:sim.ltv,netBurden:sim.netBurden});
                setSaved(true);
                setTimeout(()=>setSaved(false),2500);
              }
            }}
            style={{padding:"5px 12px",background:"#22C55E",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}
          >💾 保存</button>
          <button
            onClick={handlePDF}
            disabled={pdfLoading}
            style={{padding:"5px 12px",background:pdfLoading?"#475569":"rgba(255,255,255,0.15)",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:pdfLoading?"not-allowed":"pointer",transition:"background 0.15s"}}
          >{pdfLoading?"⏳ 生成中...":"📄 PDF出力"}</button>
        </div>
      </div>
      {/* KPI */}
      <div style={{background:"#fff",borderBottom:`1px solid ${C.border}`,display:"flex",padding:"8px 14px",gap:6,overflowX:"auto",flexShrink:0}}>
        {kpiDefs.map((k,i)=><KpiCard key={i} label={k.l} value={k.v} ok={k.ok} term={k.term}/>)}
      </div>
      {/* split */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LEFT */}
        <div style={{width:320,flexShrink:0,display:"flex",flexDirection:"column",borderRight:`1px solid ${C.border}`,background:"#fff",overflow:"hidden"}}>
          {/* Row 1: 物件入力タブ */}
          <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:"#F8FAFC",flexShrink:0}}>
            {[{k:"main",l:"土地・建物"},{k:"rooms",l:"間取り"},{k:"finance",l:"資金"},{k:"revenue",l:"収益"},{k:"cost",l:"コスト"},{k:"exit",l:"出口・税務"}].map(t=>(
              <TabBtn key={t.k} active={inputTab===t.k} onClick={()=>setInputTab(t.k)}>{t.l}</TabBtn>
            ))}
          </div>
          {/* Row 2: ツールタブ */}
          <div style={{display:"flex",alignItems:"center",background:"#EEF2F8",borderBottom:`1px solid ${C.border}`,flexShrink:0,padding:"3px 6px",gap:4}}>
            <span style={{fontSize:9,color:C.gray,whiteSpace:"nowrap",paddingRight:2}}>🔧</span>
            {[{k:"loan",l:"💰 融資試算"},{k:"purchase",l:"🧾 購入明細"},{k:"asset",l:"📐 償却ロジック"}].map(t=>(
              <button key={t.k} onClick={()=>setInputTab(t.k)} style={{
                padding:"3px 9px",fontSize:11,fontWeight:600,borderRadius:5,border:"none",
                cursor:"pointer",whiteSpace:"nowrap",lineHeight:1.4,
                background:inputTab===t.k?C.navy:"#fff",
                color:inputTab===t.k?"#fff":C.navy,
                boxShadow:inputTab===t.k?"none":"0 1px 2px rgba(0,0,0,.12)",
              }}>{t.l}</button>
            ))}
          </div>
          <div key={inputTab} style={{flex:1,overflowY:"auto",padding:"14px 14px 20px"}}>{renderPanel()}</div>
        </div>
        {/* RIGHT */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",padding:"0 10px",borderBottom:`1px solid ${C.border}`,background:"#fff",flexShrink:0}}>
            <TabBtn active={viewMode==="chart"} onClick={()=>setViewMode("chart")}>📈 グラフ</TabBtn>
            <TabBtn active={viewMode==="table"} onClick={()=>setViewMode("table")}>🗂 表</TabBtn>
            <div style={{flex:1}}/>
            {/* 建物種別スイッチャー */}
            <div style={{display:"flex",gap:3,alignItems:"center",background:"#F1F5F9",borderRadius:8,padding:"3px 4px"}}>
              <span style={{fontSize:9,color:C.gray,paddingLeft:3,whiteSpace:"nowrap"}}>🏗</span>
              {Object.entries(STRUCTURES).map(([k,v])=>(
                <button key={k} onClick={()=>set("structure")(k)} style={{
                  padding:"3px 9px",fontSize:10,fontWeight:600,borderRadius:6,border:"none",
                  cursor:"pointer",whiteSpace:"nowrap",lineHeight:1.4,
                  background:p.structure===k?C.navy:"transparent",
                  color:p.structure===k?"#fff":C.gray,
                  transition:"background 0.15s",
                }}>
                  {v.label}<span style={{fontSize:8,opacity:.7,marginLeft:2}}>{v.life}年</span>
                </button>
              ))}
            </div>
          </div>
          {viewMode==="chart"?<ChartView/>:<TableView/>}
        </div>
      </div>
    </div>
  );
}

