import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itens } = body

    if (!itens || !Array.isArray(itens)) {
      return NextResponse.json({ error: 'Itens obrigatório' }, { status: 400 })
    }

    let updated = 0
    for (const item of itens) {
      const lanc = await db.lancamento.findUnique({ where: { id: item.row_index } })
      if (lanc) {
        const newStatus = lanc.tipo === 'receita' ? 'Recebido' : 'Pago'
        await db.lancamento.update({
          where: { id: item.row_index },
          data: { status: newStatus },
        })
        updated++
      }
    }

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('Error in pagar:', error)
    return NextResponse.json({ error: 'Erro ao marcar como pago' }, { status: 500 })
  }
}
