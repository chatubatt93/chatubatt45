import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, valor, meses } = body

    if (!tipo || valor === undefined || !meses || !Array.isArray(meses)) {
      return NextResponse.json({ error: 'Campos obrigatórios: tipo, valor, meses' }, { status: 400 })
    }

    const validTipos = ['dia5', 'dia20', 'diautil']
    if (!validTipos.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo inválido. Use: dia5, dia20, diautil' }, { status: 400 })
    }

    let upserted = 0
    for (const mes of meses) {
      await db.salarioConfig.upsert({
        where: { tipo_mes: { tipo, mes } },
        create: { tipo, mes, valor },
        update: { valor },
      })
      upserted++
    }

    return NextResponse.json({ success: true, upserted })
  } catch (error) {
    console.error('Error in salario:', error)
    return NextResponse.json({ error: 'Erro ao salvar config de salário' }, { status: 500 })
  }
}
