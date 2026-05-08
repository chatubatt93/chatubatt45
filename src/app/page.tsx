'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts'
import {
  LayoutDashboard, FileText, CalendarDays, Calculator,
  Settings, MessageSquare, Bot, Plus, Trash2, Check,
  Phone, TrendingUp, TrendingDown, Wallet, DollarSign,
  Menu, X, ChevronRight, Edit2, Search, Filter,
  Zap, Eye, CreditCard, ArrowUpRight, ArrowDownRight,
  Send, Wifi, WifiOff, RefreshCw, Hash
} from 'lucide-react'

// ==================== TYPES ====================
interface LancamentoRow {
  row_index: number
  aba: string
  data: string
  descricao: string
  categoria: string
  valor: number
  status: string
  mes: number
  origem: string
  parcelas: number
}

interface MensalRow {
  mes: string
  mes_num: number
  salario: number
  extra: number
  receita: number
  despesa: number
  delta: number
  acumulado: number
}

interface ResumoData {
  por_categoria: Record<string, number>
  mensal: MensalRow[]
  todos_lancamentos: LancamentoRow[]
}

interface SalarioConfig {
  tipo: string
  mes: number
  valor: number
}

interface EditField {
  id: number
  field: string
  value: string | number
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  options?: string[]
}

interface ToastMsg {
  id: number
  message: string
  type: 'success' | 'error'
}

interface WhatsAppMessage {
  role: 'user' | 'bot'
  text: string
  timestamp: string
}

// ==================== CONSTANTS ====================
const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const CATEGORIAS_DESPESA = ['Aluguel', 'Mercado', 'Energia', 'Internet', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Restaurante', 'Assinaturas', 'Vestuário', 'Outros']

const CHART_COLORS = ['#22d3ee', '#8b5cf6', '#ec4899', '#10b981', '#f43f5e', '#f59e0b', '#6366f1', '#14b8a6', '#f97316', '#a855f7', '#06b6d4', '#84cc16']

// ==================== HELPERS ====================
function fmt(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1000) {
    return `R$ ${(v / 1000).toFixed(1).replace('.', ',')}k`
  }
  return `R$ ${v.toFixed(0).replace('.', ',')}`
}

function todayStr(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function parseDataToInputDate(data: string): string {
  const parts = data.split('/')
  if (parts.length !== 3) return ''
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

function inputDateToData(val: string): string {
  const parts = val.split('-')
  if (parts.length !== 3) return ''
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// ==================== NAV ITEMS ====================
const NAV_ITEMS = [
  { section: 'Visões', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'extrato', label: 'Extrato Geral', icon: FileText },
    { id: 'anual', label: 'Visão Anual', icon: CalendarDays },
    { id: 'holerite', label: 'Calculadora Holerite', icon: Calculator },
  ]},
  { section: 'Ferramentas', items: [
    { id: 'config', label: 'Configurações', icon: Settings },
    { id: 'whatsapp', label: 'WhatsApp Sync', icon: MessageSquare },
  ]},
]

// ==================== MAIN COMPONENT ====================
export default function ZetaFinance() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [data, setData] = useState<ResumoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  // Quick Add
  const [addTipo, setAddTipo] = useState('despesa')
  const [addDesc, setAddDesc] = useState('')
  const [addValor, setAddValor] = useState('')
  const [addParcelas, setAddParcelas] = useState('1')
  const [addData, setAddData] = useState(todayStr())

  // Extrato
  const [filterMes, setFilterMes] = useState(0) // 0 = all
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [editField, setEditField] = useState<EditField | null>(null)

  // WhatsApp
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([])
  const [waInput, setWaInput] = useState('')

  // Config
  const [configValor, setConfigValor] = useState('4000')
  const [configMeses, setConfigMeses] = useState<Set<number>>(new Set(Array.from({ length: 12 }, (_, i) => i + 1)))

  // Holerite
  const [holerite, setHolerite] = useState({
    salarioBase: 4000,
    horasNormais: 220,
    he50: 0,
    he100: 0,
    dependentesIRRF: 0,
    diasUteis: 22,
    dsr: 0,
    pensao: 0,
    consignado: 0,
    pan: 0,
    bioSaude1: 0,
    bioSaude2: 0,
    odonto: 0,
    outrosDesc: 0,
  })

  // ==================== DATA FETCHING ====================
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/resumo')
      const json = await res.json()
      setData(json)
    } catch (err) {
      showToast('Erro ao carregar dados', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ==================== TOAST ====================
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  // ==================== QUICK ADD ====================
  const handleAdd = async () => {
    if (!addDesc || !addValor) {
      showToast('Preencha descrição e valor', 'error')
      return
    }
    try {
      const res = await fetch('/api/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: addTipo,
          descricao: addDesc,
          valor: parseFloat(addValor),
          parcelas: parseInt(addParcelas),
          data: addData,
        }),
      })
      const json = await res.json()
      if (json.success) {
        showToast(`Lançamento adicionado!`, 'success')
        setAddDesc('')
        setAddValor('')
        setAddParcelas('1')
        fetchData()
      } else {
        showToast(json.error || 'Erro ao adicionar', 'error')
      }
    } catch {
      showToast('Erro de conexão', 'error')
    }
  }

  // ==================== EXTRATO BULK ====================
  const handleBulkPay = async () => {
    if (selectedRows.size === 0) return
    try {
      const itens = Array.from(selectedRows).map(row_index => ({ aba: '', row_index }))
      const res = await fetch('/api/pagar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens }),
      })
      const json = await res.json()
      if (json.success) {
        showToast(`${json.updated} itens marcados como pago`, 'success')
        setSelectedRows(new Set())
        fetchData()
      }
    } catch {
      showToast('Erro ao marcar como pago', 'error')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return
    try {
      const itens = Array.from(selectedRows).map(row_index => ({ aba: '', row_index }))
      const res = await fetch('/api/excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens }),
      })
      const json = await res.json()
      if (json.success) {
        showToast(`${json.deleted} itens excluídos`, 'success')
        setSelectedRows(new Set())
        fetchData()
      }
    } catch {
      showToast('Erro ao excluir', 'error')
    }
  }

  // ==================== EDIT ====================
  const handleEdit = async () => {
    if (!editField) return
    try {
      const updateData: Record<string, unknown> = {}
      if (editField.field === 'data') {
        updateData.data = editField.value as string
      } else if (editField.field === 'valor') {
        updateData.valor = parseFloat(editField.value as string)
      } else {
        updateData[editField.field] = editField.value
      }
      const res = await fetch('/api/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editField.id, ...updateData }),
      })
      const json = await res.json()
      if (json.success) {
        showToast('Editado com sucesso', 'success')
        setEditField(null)
        fetchData()
      }
    } catch {
      showToast('Erro ao editar', 'error')
    }
  }

  // ==================== SALARIO CONFIG ====================
  const saveSalarioConfig = async (tipo: string, valor: number, meses: number[]) => {
    try {
      const res = await fetch('/api/salario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, valor, meses }),
      })
      const json = await res.json()
      if (json.success) {
        showToast('Configuração salva', 'success')
      }
    } catch {
      showToast('Erro ao salvar configuração', 'error')
    }
  }

  // ==================== WHATSAPP SIMULATOR ====================
  const sendWhatsApp = async () => {
    if (!waInput.trim()) return
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setWaMessages(prev => [...prev, { role: 'user', text: waInput, timestamp }])
    const msg = waInput
    setWaInput('')

    try {
      const res = await fetch('/api/webhook/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const json = await res.json()
      setTimeout(() => {
        if (json.status === 'success') {
          setWaMessages(prev => [...prev, {
            role: 'bot',
            text: `✅ Registrado: ${json.desc} — ${fmt(json.valor)} (${json.tipo})`,
            timestamp,
          }])
          fetchData()
        } else {
          setWaMessages(prev => [...prev, {
            role: 'bot',
            text: `❌ ${json.error || 'Não foi possível processar'}`,
            timestamp,
          }])
        }
      }, 500)
    } catch {
      setWaMessages(prev => [...prev, {
        role: 'bot',
        text: '❌ Erro de conexão com o servidor',
        timestamp,
      }])
    }
  }

  // ==================== HOLERITE CALC ====================
  const holeriteCalc = useMemo(() => {
    const h = holerite
    const horaNormal = h.salarioBase / h.horasNormais
    const valorHE50 = horaNormal * 1.5
    const valorHE100 = horaNormal * 2.0
    const totalHE = (h.he50 * valorHE50) + (h.he100 * valorHE100)
    const dsr = h.dsr
    const bruto = h.salarioBase + totalHE + dsr

    // INSS 2026
    let inss = 0
    if (bruto <= 1518) inss = bruto * 0.075
    else if (bruto <= 2793.88) inss = bruto * 0.09
    else if (bruto <= 4190.83) inss = bruto * 0.12
    else if (bruto <= 8157.41) inss = bruto * 0.14
    else inss = 8157.41 * 0.14

    // IRRF 2026
    const baseIRRF = bruto - inss - (h.dependentesIRRF * 189.59)
    let irrf = 0
    if (baseIRRF <= 2259.20) irrf = 0
    else if (baseIRRF <= 2826.65) irrf = baseIRRF * 0.075 - 169.44
    else if (baseIRRF <= 3751.05) irrf = baseIRRF * 0.15 - 381.44
    else if (baseIRRF <= 4664.68) irrf = baseIRRF * 0.225 - 662.77
    else irrf = baseIRRF * 0.275 - 896.00
    if (irrf < 0) irrf = 0

    const descPessoais = h.pensao + h.consignado + h.pan + h.bioSaude1 + h.bioSaude2 + h.odonto + h.outrosDesc
    const totalDescontos = inss + irrf + descPessoais
    const liquido = bruto - totalDescontos

    const percReal = bruto > 0 ? (liquido / bruto) * 100 : 0

    return {
      horaNormal, valorHE50, valorHE100, totalHE, dsr, bruto,
      inss, irrf, descPessoais, totalDescontos, liquido, percReal,
    }
  }, [holerite])

  // ==================== FILTERED DATA ====================
  const filteredLancamentos = useMemo(() => {
    if (!data) return []
    return data.todos_lancamentos.filter(l => {
      if (filterMes !== 0 && l.mes !== filterMes) return false
      if (filterSearch && !l.descricao.toLowerCase().includes(filterSearch.toLowerCase()) && !l.categoria.toLowerCase().includes(filterSearch.toLowerCase())) return false
      return true
    })
  }, [data, filterMes, filterSearch])

  // ==================== DASHBOARD CHARTS DATA ====================
  const categoryChartData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.por_categoria)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  const monthlyChartData = useMemo(() => data?.mensal || [], [data])

  const kpis = useMemo(() => {
    if (!data) return { despesas: 0, receitas: 0, saldo: 0 }
    const despesas = data.mensal.reduce((s, m) => s + m.despesa, 0)
    const receitas = data.mensal.reduce((s, m) => s + m.receita, 0)
    const saldo = data.mensal.length > 0 ? data.mensal[data.mensal.length - 1].acumulado : 0
    return { despesas, receitas, saldo }
  }, [data])

  const insights = useMemo(() => {
    if (!data || data.mensal.length === 0) return { consumo: 0, mediaDiaria: 0, taxaPoupanca: 0 }
    const lastMonth = data.mensal[data.mensal.length - 1]
    const consumo = lastMonth.receita > 0 ? (lastMonth.despesa / lastMonth.receita) * 100 : 0
    const mediaDiaria = lastMonth.despesa / 30
    const taxaPoupanca = lastMonth.receita > 0 ? ((lastMonth.receita - lastMonth.despesa) / lastMonth.receita) * 100 : 0
    return { consumo, mediaDiaria, taxaPoupanca }
  }, [data])

  const topDespesasMes = useMemo(() => {
    if (!data) return []
    const currentMes = new Date().getMonth() + 1
    const mesLancs = data.todos_lancamentos
      .filter(l => l.tipo === 'despesa' && l.mes === currentMes)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
    return mesLancs
  }, [data])

  // ==================== RENDER FUNCTIONS ====================

  const renderToast = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
              t.type === 'success'
                ? 'bg-emerald-500/90 text-white border border-emerald-400/30'
                : 'bg-red-500/90 text-white border border-red-400/30'
            }`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )

  const renderSidebar = () => (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col border-r border-white/[0.08] bg-[rgba(17,24,39,0.9)] overflow-hidden flex-shrink-0"
      >
        <div className="p-5 min-w-[280px]">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
              Zeta Finance
            </h1>
          </div>

          {NAV_ITEMS.map(section => (
            <div key={section.section} className="mb-6">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 px-3">{section.section}</p>
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto p-4 min-w-[280px]">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Advisor</p>
                <p className="text-[10px] text-gray-400">Insights inteligentes</p>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Análises automáticas das suas finanças com sugestões personalizadas.
            </p>
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-[rgba(10,15,30,0.98)] border-r border-white/[0.08] z-50 flex flex-col lg:hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                      Zeta Finance
                    </h1>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {NAV_ITEMS.map(section => (
                  <div key={section.section} className="mb-6">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 px-3">{section.section}</p>
                    <div className="space-y-1">
                      {section.items.map(item => {
                        const Icon = item.icon
                        const isActive = activeTab === item.id
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false) }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                              isActive
                                ? 'bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )

  const renderQuickAdd = () => (
    <div className="glass-card p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[120px]">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Tipo</label>
          <select
            value={addTipo}
            onChange={e => setAddTipo(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="despesa">Despesa</option>
            <option value="receita">Receita</option>
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Descrição</label>
          <input
            type="text"
            value={addDesc}
            onChange={e => setAddDesc(e.target.value)}
            placeholder="Ex: Supermercado"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="min-w-[120px]">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            value={addValor}
            onChange={e => setAddValor(e.target.value)}
            placeholder="0,00"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div className="min-w-[80px]">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Parcelas</label>
          <select
            value={addParcelas}
            onChange={e => setAddParcelas(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}x</option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 block">Data</label>
          <input
            type="date"
            value={parseDataToInputDate(addData)}
            onChange={e => setAddData(inputDateToData(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Lançar
        </button>
      </div>
    </div>
  )

  // ==================== TAB: DASHBOARD ====================
  const renderDashboard = () => {
    if (!data) return <div className="text-gray-500 text-center py-12">Carregando...</div>

    return (
      <motion.div
        key="dashboard"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Despesas (Ano)</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{fmt(kpis.despesas)}</p>
          </div>
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Receitas (Ano)</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{fmt(kpis.receitas)}</p>
          </div>
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Saldo Acumulado</span>
            </div>
            <p className={`text-2xl font-bold ${kpis.saldo >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {fmt(kpis.saldo)}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut Chart */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Despesas por Categoria</h3>
            {categoryChartData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-[200px] h-[200px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{
                          background: 'rgba(17,24,39,0.95)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#f9fafb',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 max-h-[200px] overflow-y-auto">
                  {categoryChartData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="text-gray-400 flex-1">{item.name}</span>
                      <span className="text-gray-200 font-medium">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Sem dados</p>
            )}
          </div>

          {/* Line Chart */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Receita vs Despesa (Mensal)</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="mes" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} tickFormatter={v => fmtCompact(v)} />
                  <Tooltip
                    formatter={(value: number) => fmt(value)}
                    contentStyle={{
                      background: 'rgba(17,24,39,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Receita" />
                  <Line type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} name="Despesa" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Consumo da Receita</p>
            <p className="text-xl font-bold text-purple-400">{insights.consumo.toFixed(1)}%</p>
            <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(insights.consumo, 100)}%` }} />
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Média Diária</p>
            <p className="text-xl font-bold text-pink-400">{fmt(insights.mediaDiaria)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Taxa Poupança</p>
            <p className={`text-xl font-bold ${insights.taxaPoupanca >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {insights.taxaPoupanca.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Top 5 Expenses */}
        {topDespesasMes.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Top 5 Despesas — {MESES_FULL[new Date().getMonth()]}
            </h3>
            <div className="space-y-2">
              {topDespesasMes.map((l, idx) => (
                <div key={l.row_index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-5">#{idx + 1}</span>
                    <span className="text-sm text-gray-300">{l.descricao}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{l.categoria}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-400">{fmt(l.valor)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consolidation Table */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Consolidação Mensal</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left py-2 px-3">Mês</th>
                  <th className="text-right py-2 px-3">Salário</th>
                  <th className="text-right py-2 px-3">Extra</th>
                  <th className="text-right py-2 px-3">Despesas</th>
                  <th className="text-right py-2 px-3">Delta</th>
                  <th className="text-right py-2 px-3">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {data.mensal.map((m, idx) => (
                  <tr key={idx} className="border-t border-white/5">
                    <td className="py-2.5 px-3 font-medium text-gray-300">{m.mes}</td>
                    <td className="py-2.5 px-3 text-right text-gray-400">{fmt(m.salario)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-400">{fmt(m.extra)}</td>
                    <td className="py-2.5 px-3 text-right text-red-400">{fmt(m.despesa)}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${m.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.delta >= 0 ? '+' : ''}{fmt(m.delta)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${m.acumulado >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                      {fmt(m.acumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    )
  }

  // ==================== TAB: EXTRATO GERAL ====================
  const renderExtrato = () => {
    return (
      <motion.div
        key="extrato"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterMes}
              onChange={e => setFilterMes(parseInt(e.target.value))}
              className="bg-transparent text-sm text-gray-200 focus:outline-none"
            >
              <option value={0} className="bg-gray-900">Todos os meses</option>
              {MESES_FULL.map((m, i) => (
                <option key={i} value={i + 1} className="bg-gray-900">{m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              placeholder="Buscar por descrição ou categoria..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-3 flex items-center gap-3"
          >
            <span className="text-sm text-gray-400">{selectedRows.size} selecionado(s)</span>
            <button
              onClick={handleBulkPay}
              className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Marcar como Pago
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-xs text-gray-500 hover:text-gray-300 ml-auto"
            >
              Limpar seleção
            </button>
          </motion.div>
        )}

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[rgba(17,24,39,0.95)] z-10">
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="py-3 px-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={filteredLancamentos.length > 0 && selectedRows.size === filteredLancamentos.length}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedRows(new Set(filteredLancamentos.map(l => l.row_index)))
                        } else {
                          setSelectedRows(new Set())
                        }
                      }}
                      className="rounded border-gray-600"
                    />
                  </th>
                  <th className="py-3 px-3 text-left">Data</th>
                  <th className="py-3 px-3 text-left">Descrição</th>
                  <th className="py-3 px-3 text-left">Categoria</th>
                  <th className="py-3 px-3 text-right">Valor</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredLancamentos.map(l => (
                  <tr
                    key={l.row_index}
                    className="border-t border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(l.row_index)}
                        onChange={() => {
                          const next = new Set(selectedRows)
                          if (next.has(l.row_index)) next.delete(l.row_index)
                          else next.add(l.row_index)
                          setSelectedRows(next)
                        }}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td
                      className="py-2.5 px-3 text-gray-400 cursor-pointer hover:text-cyan-400 transition-colors"
                      onDoubleClick={() => setEditField({ id: l.row_index, field: 'data', value: l.data, label: 'Data', type: 'date' })}
                    >
                      <div className="flex items-center gap-1.5">
                        {l.origem === 'WhatsApp' && <Phone className="w-3 h-3 text-emerald-400" />}
                        {l.data}
                      </div>
                    </td>
                    <td
                      className="py-2.5 px-3 text-gray-200 cursor-pointer hover:text-cyan-400 transition-colors max-w-[200px] truncate"
                      onDoubleClick={() => setEditField({ id: l.row_index, field: 'descricao', value: l.descricao, label: 'Descrição', type: 'text' })}
                    >
                      {l.descricao}
                    </td>
                    <td
                      className="py-2.5 px-3 cursor-pointer hover:text-cyan-400 transition-colors"
                      onDoubleClick={() => setEditField({ id: l.row_index, field: 'categoria', value: l.categoria, label: 'Categoria', type: 'select', options: CATEGORIAS_DESPESA })}
                    >
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                        l.tipo === 'receita'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-white/5 text-gray-400'
                      }`}>
                        {l.categoria}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-medium cursor-pointer hover:text-cyan-400 transition-colors ${
                        l.tipo === 'receita' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                      onDoubleClick={() => setEditField({ id: l.row_index, field: 'valor', value: l.valor, label: 'Valor (R$)', type: 'number' })}
                    >
                      {l.tipo === 'receita' ? '+' : '-'}{fmt(l.valor)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        l.status === 'Pago' || l.status === 'Recebido'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setEditField({ id: l.row_index, field: 'status', value: l.status, label: 'Status', type: 'select', options: ['Pendente', 'Pago', 'Recebido', 'Cancelado'] })}
                        className="text-gray-500 hover:text-cyan-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLancamentos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Nenhum lançamento encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    )
  }

  // ==================== TAB: VISÃO ANUAL ====================
  const renderAnual = () => {
    if (!data) return <div className="text-gray-500 text-center py-12">Carregando...</div>
    const mensal = data.mensal

    const totais = mensal.reduce(
      (acc, m) => ({
        salario: acc.salario + m.salario,
        extra: acc.extra + m.extra,
        receita: acc.receita + m.receita,
        despesa: acc.despesa + m.despesa,
        delta: acc.delta + m.delta,
      }),
      { salario: 0, extra: 0, receita: 0, despesa: 0, delta: 0 }
    )

    return (
      <motion.div
        key="anual"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-gray-200">Visão Anual 2026</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="text-left py-3 px-3">Mês</th>
                  <th className="text-right py-3 px-3">Receita Base</th>
                  <th className="text-right py-3 px-3">Extra Receita</th>
                  <th className="text-right py-3 px-3">Total Receita</th>
                  <th className="text-right py-3 px-3">Despesas</th>
                  <th className="text-right py-3 px-3">Delta R$</th>
                  <th className="text-right py-3 px-3">Acumulado</th>
                  <th className="text-right py-3 px-3">Delta %</th>
                  <th className="text-center py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mensal.map((m, idx) => {
                  const deltaPerc = m.receita > 0 ? ((m.delta / m.receita) * 100) : 0
                  const isPositive = m.delta >= 0
                  return (
                    <tr key={idx} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-medium text-gray-300">{MESES_FULL[m.mes_num - 1]}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{fmt(m.salario)}</td>
                      <td className="py-2.5 px-3 text-right text-purple-400">{fmt(m.extra)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">{fmt(m.receita)}</td>
                      <td className="py-2.5 px-3 text-right text-red-400">{fmt(m.despesa)}</td>
                      <td className={`py-2.5 px-3 text-right font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{fmt(m.delta)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${m.acumulado >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {fmt(m.acumulado)}
                      </td>
                      <td className={`py-2.5 px-3 text-right ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {deltaPerc.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                          isPositive
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isPositive ? 'Positivo' : 'Negativo'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/10 font-semibold">
                  <td className="py-3 px-3 text-gray-200">TOTAL</td>
                  <td className="py-3 px-3 text-right text-gray-400">{fmt(totais.salario)}</td>
                  <td className="py-3 px-3 text-right text-purple-400">{fmt(totais.extra)}</td>
                  <td className="py-3 px-3 text-right text-emerald-400">{fmt(totais.receita)}</td>
                  <td className="py-3 px-3 text-right text-red-400">{fmt(totais.despesa)}</td>
                  <td className={`py-3 px-3 text-right ${totais.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totais.delta >= 0 ? '+' : ''}{fmt(totais.delta)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-400">{mensal.length > 0 ? fmt(mensal[mensal.length - 1].acumulado) : '-'}</td>
                  <td className={`py-3 px-3 text-right ${totais.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totais.receita > 0 ? ((totais.delta / totais.receita) * 100).toFixed(1) : '0.0'}%
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Annual Bar Chart */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Comparativo Mensal</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="mes" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={v => fmtCompact(v)} />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{
                    background: 'rgba(17,24,39,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="receita" fill="#10b981" name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" fill="#f43f5e" name="Despesa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    )
  }

  // ==================== TAB: CALCULADORA HOLERITE ====================
  const renderHolerite = () => {
    const c = holeriteCalc
    const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
    const labelClass = "text-[10px] uppercase tracking-wider text-gray-500 mb-1 block"

    return (
      <motion.div
        key="holerite"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-gray-200">Calculadora Holerite 2026</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Col 1: Inputs */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              Dados do Salário
            </h3>
            {[
              { label: 'Salário Base (R$)', key: 'salarioBase', step: '0.01' },
              { label: 'Horas Normais', key: 'horasNormais', step: '1' },
              { label: 'HE 50% (horas)', key: 'he50', step: '0.5' },
              { label: 'HE 100% (horas)', key: 'he100', step: '0.5' },
              { label: 'Dependentes IRRF', key: 'dependentesIRRF', step: '1' },
              { label: 'Dias Úteis', key: 'diasUteis', step: '1' },
              { label: 'DSR (R$)', key: 'dsr', step: '0.01' },
            ].map(field => (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <input
                  type="number"
                  step={field.step}
                  value={holerite[field.key as keyof typeof holerite]}
                  onChange={e => setHolerite(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                  className={inputClass}
                />
              </div>
            ))}

            <h3 className="text-sm font-semibold text-gray-300 pt-2 border-t border-white/5 flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
              Descontos Pessoais
            </h3>
            {[
              { label: 'Pensão Alimentícia (R$)', key: 'pensao' },
              { label: 'Consignado (R$)', key: 'consignado' },
              { label: 'PAN (R$)', key: 'pan' },
              { label: 'Bio Saúde 1 (R$)', key: 'bioSaude1' },
              { label: 'Bio Saúde 2 (R$)', key: 'bioSaude2' },
              { label: 'Odonto (R$)', key: 'odonto' },
              { label: 'Outros (R$)', key: 'outrosDesc' },
            ].map(field => (
              <div key={field.key}>
                <label className={labelClass}>{field.label}</label>
                <input
                  type="number"
                  step="0.01"
                  value={holerite[field.key as keyof typeof holerite]}
                  onChange={e => setHolerite(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          {/* Col 2: Calculated Breakdown */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Demonstrativo
            </h3>

            <div className="space-y-2">
              {[
                { label: 'Valor Hora Normal', value: fmt(c.horaNormal), color: 'text-gray-400' },
                { label: 'Valor HE 50%', value: fmt(c.valorHE50), color: 'text-gray-400' },
                { label: 'Valor HE 100%', value: fmt(c.valorHE100), color: 'text-gray-400' },
                { label: 'Total HE', value: fmt(c.totalHE), color: 'text-yellow-400' },
                { label: 'DSR', value: fmt(c.dsr), color: 'text-gray-400' },
                { label: 'Salário Bruto', value: fmt(c.bruto), color: 'text-emerald-400', bold: true },
                { label: '─────────', value: '─────────', color: 'text-gray-700' },
                { label: 'INSS', value: `- ${fmt(c.inss)}`, color: 'text-red-400' },
                { label: 'IRRF', value: `- ${fmt(c.irrf)}`, color: 'text-red-400' },
                { label: 'Desc. Pessoais', value: `- ${fmt(c.descPessoais)}`, color: 'text-red-400' },
                { label: 'Total Descontos', value: `- ${fmt(c.totalDescontos)}`, color: 'text-red-400', bold: true },
                { label: '══════════', value: '══════════', color: 'text-gray-700' },
                { label: 'LÍQUIDO', value: fmt(c.liquido), color: 'text-cyan-400', bold: true },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className={`text-sm ${item.bold ? 'font-bold' : ''} ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Thermometer */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Termômetro Salarial
            </h3>

            <div className="space-y-6 py-4">
              {/* Thermometer Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Bruto: {fmt(c.bruto)}</span>
                  <span className="text-cyan-400 font-medium">{c.percReal.toFixed(1)}% real</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-6 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(c.percReal, 0)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full flex items-center justify-end pr-2"
                  >
                    <span className="text-[10px] font-bold text-gray-900">{c.percReal.toFixed(0)}%</span>
                  </motion.div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider">Detalhamento Descontos</h4>
                {[
                  { label: 'INSS', value: c.inss, pct: c.bruto > 0 ? (c.inss / c.bruto) * 100 : 0, color: 'bg-red-500' },
                  { label: 'IRRF', value: c.irrf, pct: c.bruto > 0 ? (c.irrf / c.bruto) * 100 : 0, color: 'bg-purple-500' },
                  { label: 'Pessoais', value: c.descPessoais, pct: c.bruto > 0 ? (c.descPessoais / c.bruto) * 100 : 0, color: 'bg-pink-500' },
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{d.label}</span>
                      <span className="text-gray-300">{fmt(d.value)} ({d.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className={`h-full ${d.color} rounded-full`} style={{ width: `${Math.min(d.pct, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Reference Tables */}
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">INSS 2026</h4>
                <div className="text-[11px] text-gray-500 space-y-1">
                  <p>7.5% até R$ 1.518,00</p>
                  <p>9.0% até R$ 2.793,88</p>
                  <p>12.0% até R$ 4.190,83</p>
                  <p>14.0% até R$ 8.157,41</p>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2">IRRF 2026</h4>
                <div className="text-[11px] text-gray-500 space-y-1">
                  <p>0% até R$ 2.259,20</p>
                  <p>7.5% (-169,44) até R$ 2.826,65</p>
                  <p>15% (-381,44) até R$ 3.751,05</p>
                  <p>22.5% (-662,77) até R$ 4.664,68</p>
                  <p>27.5% (-896,00) acima</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 text-center cyan-glow">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Salário Líquido</p>
            <p className="text-xl font-bold text-cyan-400">{fmt(c.liquido)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Desc. Pessoais</p>
            <p className="text-xl font-bold text-pink-400">{fmt(c.descPessoais)}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Real na Conta</p>
            <p className={`text-xl font-bold ${c.percReal >= 70 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {c.percReal.toFixed(1)}%
            </p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Total Descontos</p>
            <p className="text-xl font-bold text-red-400">{fmt(c.totalDescontos)}</p>
          </div>
        </div>
      </motion.div>
    )
  }

  // ==================== TAB: CONFIGURAÇÕES ====================
  const renderConfig = () => {
    const configTypes = [
      { tipo: 'dia5', label: 'Dia 5', icon: Hash, desc: 'Primeiro pagamento do mês' },
      { tipo: 'dia20', label: 'Dia 20', icon: Hash, desc: 'Segundo pagamento do mês' },
      { tipo: 'diautil', label: '5º Dia Útil', icon: CalendarDays, desc: 'Quinto dia útil do mês' },
    ]

    return (
      <motion.div
        key="config"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-gray-200">Configurações de Salário</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {configTypes.map(ct => {
            const Icon = ct.icon

            const toggleMes = (m: number) => {
              const next = new Set(configMeses)
              if (next.has(m)) next.delete(m)
              else next.add(m)
              setConfigMeses(next)
            }

            const toggleAll = () => {
              if (configMeses.size === 12) setConfigMeses(new Set())
              else setConfigMeses(new Set(Array.from({ length: 12 }, (_, i) => i + 1)))
            }

            return (
              <div key={ct.tipo} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">{ct.label}</h3>
                    <p className="text-[10px] text-gray-500">{ct.desc}</p>
                  </div>
                </div>

                {/* Month Grid */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Meses Ativos</p>
                    <button
                      onClick={toggleAll}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300"
                    >
                      {configMeses.size === 12 ? 'Desmarcar todos' : 'Todos'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {MESES_ABREV.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => toggleMes(i + 1)}
                        className={`text-[11px] py-1.5 rounded-md transition-all ${
                          configMeses.has(i + 1)
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/10'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value */}
                <div className="mb-4">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configValor}
                    onChange={e => setConfigValor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => saveSalarioConfig(ct.tipo, parseFloat(configValor) || 0, Array.from(configMeses))}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>
    )
  }

  // ==================== TAB: WHATSAPP ====================
  const renderWhatsApp = () => {
    return (
      <motion.div
        key="whatsapp"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-gray-200">WhatsApp Sync</h2>
        </div>

        {/* Connection Status */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-200">Status da Conexão</h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Conectado — Simulação ativa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Phone Number ID</p>
              <p className="text-xs text-gray-300 font-mono">55011999999999</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">WABA ID</p>
              <p className="text-xs text-gray-300 font-mono">123456789012345</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Webhook Endpoint</p>
              <p className="text-xs text-gray-300 font-mono truncate">/api/webhook/whatsapp</p>
            </div>
          </div>
        </div>

        {/* Chat Simulator */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            Simulador de Chat
          </h3>

          <div className="bg-black/30 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto mb-4 space-y-3">
            {waMessages.length === 0 && (
              <p className="text-center text-gray-600 text-sm py-8">
                Envie uma mensagem para testar o parsing financeiro.
                <br />
                <span className="text-xs text-gray-700">Ex: "Mercado 200 reais", "Freelance 500", "Uber 45"</span>
              </p>
            )}
            {waMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-emerald-500/20 text-emerald-200 rounded-br-none'
                    : 'bg-white/5 text-gray-300 rounded-bl-none'
                }`}>
                  <p>{msg.text}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{msg.timestamp}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={waInput}
              onChange={e => setWaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendWhatsApp()}
              placeholder="Ex: Mercado 200 reais"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={sendWhatsApp}
              className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // ==================== EDIT MODAL ====================
  const renderEditModal = () => {
    if (!editField) return null

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setEditField(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass-card p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Editar: {editField.label}</h3>

            {editField.type === 'select' ? (
              <select
                value={editField.value as string}
                onChange={e => setEditField({ ...editField, value: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none mb-4"
              >
                {editField.options?.map(opt => (
                  <option key={opt} value={opt} className="bg-gray-900">{opt}</option>
                ))}
              </select>
            ) : editField.type === 'date' ? (
              <input
                type="date"
                value={parseDataToInputDate(editField.value as string)}
                onChange={e => setEditField({ ...editField, value: inputDateToData(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none mb-4"
              />
            ) : (
              <input
                type={editField.type}
                step={editField.type === 'number' ? '0.01' : undefined}
                value={editField.value as string}
                onChange={e => setEditField({ ...editField, value: editField.type === 'number' ? e.target.value : e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-cyan-500 focus:outline-none mb-4"
                autoFocus
              />
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditField(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ==================== LOADING ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    )
  }

  // ==================== MAIN RENDER ====================
  return (
    <div className="min-h-screen bg-[#030712] flex flex-col lg:flex-row">
      {renderSidebar()}

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] bg-[rgba(17,24,39,0.5)] backdrop-blur-md flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-gray-400 hover:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block text-gray-400 hover:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400 lg:hidden" />
            <span className="text-sm font-semibold text-gray-300">
              {NAV_ITEMS.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={fetchData}
              className="text-gray-400 hover:text-cyan-400 transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
              ZF
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderQuickAdd()}

          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'extrato' && renderExtrato()}
            {activeTab === 'anual' && renderAnual()}
            {activeTab === 'holerite' && renderHolerite()}
            {activeTab === 'config' && renderConfig()}
            {activeTab === 'whatsapp' && renderWhatsApp()}
          </AnimatePresence>
        </div>
      </main>

      {renderToast()}
      {renderEditModal()}
    </div>
  )
}
