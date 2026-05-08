import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export async function GET() {
  try {
    const lancamentos = await db.lancamento.findMany({
      orderBy: [{ ano: 'asc' }, { mes: 'asc' }, { data: 'asc' }, { id: 'asc' }],
    })

    // Expenses by category (despesas only)
    const porCategoria: Record<string, number> = {}
    for (const l of lancamentos) {
      if (l.tipo === 'despesa') {
        porCategoria[l.categoria] = (porCategoria[l.categoria] || 0) + l.valor
      }
    }

    // Monthly breakdown
    const monthlyMap: Record<string, {
      mes: string
      mes_num: number
      salario: number
      extra: number
      receita: number
      despesa: number
    }> = {}

    for (const l of lancamentos) {
      const key = `${l.ano}-${l.mes}`
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          mes: MESES_ABREV[l.mes - 1],
          mes_num: l.mes,
          salario: 0,
          extra: 0,
          receita: 0,
          despesa: 0,
        }
      }
      const m = monthlyMap[key]
      if (l.tipo === 'receita') {
        m.receita += l.valor
        if (l.categoria === 'Salário') {
          m.salario += l.valor
        } else {
          m.extra += l.valor
        }
      } else {
        m.despesa += l.valor
      }
    }

    // Sort and compute accumulated
    const sortedKeys = Object.keys(monthlyMap).sort()
    let acumulado = 0
    const mensal = sortedKeys.map((key) => {
      const m = monthlyMap[key]
      const delta = m.receita - m.despesa
      acumulado += delta
      return {
        mes: m.mes,
        mes_num: m.mes_num,
        salario: Math.round(m.salario * 100) / 100,
        extra: Math.round(m.extra * 100) / 100,
        receita: Math.round(m.receita * 100) / 100,
        despesa: Math.round(m.despesa * 100) / 100,
        delta: Math.round(delta * 100) / 100,
        acumulado: Math.round(acumulado * 100) / 100,
      }
    })

    // All lancamentos for table
    const todosLancamentos = lancamentos.map((l) => ({
      row_index: l.id,
      aba: l.tipo === 'receita' ? 'Receitas' : 'Lançamentos',
      data: l.data,
      descricao: l.descricao,
      categoria: l.categoria,
      valor: l.valor,
      status: l.status,
      mes: l.mes,
      origem: l.origem,
      parcelas: l.parcelas,
    }))

    return NextResponse.json({
      por_categoria: porCategoria,
      mensal,
      todos_lancamentos: todosLancamentos,
    })
  } catch (error) {
    console.error('Error in resumo:', error)
    return NextResponse.json({ error: 'Erro ao buscar resumo' }, { status: 500 })
  }
}
