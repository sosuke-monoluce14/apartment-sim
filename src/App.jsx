import { useState, useCallback } from 'react'
import CustomerList from './CustomerList.jsx'
import SetupWizard from './SetupWizard.jsx'
import PCSim from './PCSim.jsx'
import MobileSim from './MobileSim.jsx'

const STORAGE_KEY = 'apt_sim_customers'

function loadCustomers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}
function saveCustomers(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}
function genId() {
  return `cust_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
}

export default function App() {
  const [isSP, setIsSP] = useState(() => window.innerWidth < 768)
  const [page, setPage] = useState('list')       // 'list' | 'sim'
  const [activeId, setActiveId] = useState(null)
  const [customers, setCustomers] = useState(loadCustomers)

  // ウィザード用の一時的な顧客情報
  const [pendingCustomer, setPendingCustomer] = useState(null) // {id, name, memo}

  // ── 新規作成（顧客名入力後 → ウィザードへ）─────────────────────
  const handleCreate = useCallback((name, memo) => {
    const newCustomer = {
      id: genId(),
      name,
      memo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      params: null,
      kpi: null,
    }
    // まずリストに追加（ウィザード中断時も残す）
    const next = [newCustomer, ...customers]
    setCustomers(next)
    saveCustomers(next)
    // ウィザードを開く
    setPendingCustomer(newCustomer)
  }, [customers])

  // ── ウィザード完了 → シミュレーションへ ──────────────────────
  const handleWizardComplete = useCallback((params) => {
    if (!pendingCustomer) return
    // paramsを保存
    setCustomers(prev => {
      const next = prev.map(c =>
        c.id === pendingCustomer.id
          ? { ...c, params, updatedAt: new Date().toISOString() }
          : c
      )
      saveCustomers(next)
      return next
    })
    setPendingCustomer(null)
    setActiveId(pendingCustomer.id)
    setPage('sim')
  }, [pendingCustomer])

  // ── ウィザードキャンセル ────────────────────────────────────
  const handleWizardClose = useCallback(() => {
    // 顧客はリストに残す（paramsなし状態）
    setPendingCustomer(null)
  }, [])

  // ── 既存を開く ────────────────────────────────────────────────
  const handleOpen = useCallback((id) => {
    setActiveId(id)
    setPage('sim')
  }, [])

  // ── 削除 ─────────────────────────────────────────────────────
  const handleDelete = useCallback((id) => {
    const next = customers.filter(c => c.id !== id)
    setCustomers(next)
    saveCustomers(next)
  }, [customers])

  // ── シミュレーション保存 ──────────────────────────────────────
  const handleSave = useCallback((id, params, kpi) => {
    setCustomers(prev => {
      const next = prev.map(c =>
        c.id === id
          ? { ...c, params, kpi, updatedAt: new Date().toISOString() }
          : c
      )
      saveCustomers(next)
      return next
    })
  }, [])

  // ── 一覧に戻る ────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setPage('list')
    setActiveId(null)
  }, [])

  const activeCustomer = customers.find(c => c.id === activeId) || null

  return (
    <>
      {/* ウィザード（顧客名入力後に表示） */}
      {pendingCustomer && (
        <SetupWizard
          customerName={pendingCustomer.name}
          onComplete={handleWizardComplete}
          onClose={handleWizardClose}
        />
      )}

      {/* メインコンテンツ */}
      {page === 'list' ? (
        <CustomerList
          customers={customers}
          onOpen={handleOpen}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      ) : (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* PC/SPモード切り替え */}
          <div style={{
            position: 'fixed', bottom: 16, right: 16, zIndex: 10000,
            display: 'flex', gap: 6, background: '#1B3F6B',
            borderRadius: 24, padding: '6px 10px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}>
            {[{k:'pc',l:'💻 PC版'},{k:'sp',l:'📱 SP版'}].map(t => (
              <button key={t.k} onClick={()=>setIsSP(t.k==='sp')} style={{
                padding: '5px 12px', fontSize: 11, fontWeight: 700, borderRadius: 16,
                border: 'none', cursor: 'pointer',
                background: (!isSP&&t.k==='pc')||(isSP&&t.k==='sp') ? '#2E75B6' : 'transparent',
                color: '#fff',
              }}>{t.l}</button>
            ))}
          </div>

          {isSP
            ? <MobileSim customer={activeCustomer} onSave={handleSave} onBack={handleBack}/>
            : <PCSim     customer={activeCustomer} onSave={handleSave} onBack={handleBack}/>
          }
        </div>
      )}
    </>
  )
}
