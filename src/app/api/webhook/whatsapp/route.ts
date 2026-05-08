import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 })
    }

    // Parse message for financial info
    // Examples: "Mercado 200 reais", "Uber 45", "Aluguel 1800", "freelance 500"
    const cleaned = message.trim()

    // Try to find a value at the end of the message
    const valueMatch = cleaned.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|r\$|rs)?\s*$/i)
    if (!valueMatch) {
      return NextResponse.json(
        { status: 'error', error: 'Não foi possível identificar o valor. Ex: "Mercado 200 reais"' },
        { status: 400 }
      )
    }

    const valorStr = valueMatch[1].replace(',', '.')
    const valor = parseFloat(valorStr)
    if (isNaN(valor) || valor <= 0) {
      return NextResponse.json({ status: 'error', error: 'Valor inválido' }, { status: 400 })
    }

    // Extract description (everything before the value)
    const descMatch = cleaned.match(/^(.+?)\s+\d/)
    const descricao = descMatch ? descMatch[1].trim() : 'Despesa WhatsApp'

    // Auto-detect tipo: common income keywords
    const incomeKeywords = ['freelance', 'salário', 'salario', 'venda', 'renda', 'extra', 'bonus', 'bônus', 'cashback']
    const isReceita = incomeKeywords.some((kw) => descricao.toLowerCase().includes(kw))
    const tipo = isReceita ? 'receita' : 'despesa'

    const categoria = isReceita ? 'Extra' : 'Outros'

    // Use current date
    const now = new Date()
    const dia = String(now.getDate()).padStart(2, '0')
    const mes = now.getMonth() + 1
    const ano = now.getFullYear()
    const data = `${dia}/${String(mes).padStart(2, '0')}/${ano}`

    const lanc = await db.lancamento.create({
      data: {
        tipo,
        descricao,
        categoria,
        valor,
        parcelas: 1,
        data,
        status: 'Pendente',
        mes,
        ano,
        origem: 'WhatsApp',
      },
    })

    return NextResponse.json({
      status: 'success',
      desc: descricao,
      valor,
      tipo,
      lancamento: lanc,
    })
  } catch (error) {
    console.error('Error in whatsapp webhook:', error)
    return NextResponse.json({ error: 'Erro ao processar mensagem WhatsApp' }, { status: 500 })
  }
}
