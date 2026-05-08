import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, valor, descricao, categoria, status, data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (valor !== undefined) updateData.valor = valor
    if (descricao !== undefined) updateData.descricao = descricao
    if (categoria !== undefined) updateData.categoria = categoria
    if (status !== undefined) updateData.status = status
    if (data !== undefined) {
      updateData.data = data
      const parts = data.split('/')
      if (parts.length === 3) {
        updateData.mes = parseInt(parts[1], 10)
        updateData.ano = parseInt(parts[2], 10)
      }
    }

    const lanc = await db.lancamento.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, lancamento: lanc })
  } catch (error) {
    console.error('Error in editar:', error)
    return NextResponse.json({ error: 'Erro ao editar lançamento' }, { status: 500 })
  }
}
