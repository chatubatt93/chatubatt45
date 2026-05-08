import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itens } = body

    if (!itens || !Array.isArray(itens)) {
      return NextResponse.json({ error: 'Itens obrigatório' }, { status: 400 })
    }

    const ids = itens.map((i: { row_index: number }) => i.row_index)
    const result = await db.lancamento.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('Error in excluir:', error)
    return NextResponse.json({ error: 'Erro ao excluir lançamento(s)' }, { status: 500 })
  }
}
