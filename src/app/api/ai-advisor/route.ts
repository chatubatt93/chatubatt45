import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const lancamentos = await db.lancamento.findMany({
      orderBy: [{ ano: 'asc' }, { mes: 'asc' }, { data: 'asc' }, { id: 'asc' }],
      take: 100,
    })

    const totalReceita = lancamentos.filter(l => l.tipo === 'receita').reduce((s, l) => s + l.valor, 0)
    const totalDespesa = lancamentos.filter(l => l.tipo === 'despesa').reduce((s, l) => s + l.valor, 0)

    const porCategoria: Record<string, number> = {}
    for (const l of lancamentos) {
      if (l.tipo === 'despesa') {
        porCategoria[l.categoria] = (porCategoria[l.categoria] || 0) + l.valor
      }
    }

    const topCategorias = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)}`)
      .join(', ')

    const systemPrompt = `Você é um consultor financeiro pessoal brasileiro chamado Zeta AI. 
Analise os dados financeiros do usuário e dê conselhos práticos em português brasileiro.

Dados atuais:
- Total Receita: R$ ${totalReceita.toFixed(2)}
- Total Despesa: R$ ${totalDespesa.toFixed(2)}
- Saldo: R$ ${(totalReceita - totalDespesa).toFixed(2)}
- Top categorias de despesa: ${topCategorias}
- Total de transações: ${lancamentos.length}

Seja conciso, prático e use emojis. Dê dicas acionáveis.`

    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const reply = completion.choices?.[0]?.message?.content || 'Desculpe, não consegui analisar seus dados agora.'

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI Advisor error:', error)
    return NextResponse.json({ error: 'Erro ao processar análise' }, { status: 500 })
  }
}
