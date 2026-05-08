import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tipo, descricao, valor, parcelas = 1, data } = body

    if (!tipo || !descricao || !valor || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios: tipo, descricao, valor, data' }, { status: 400 })
    }

    // Parse date DD/MM/YYYY to get mes and ano
    const parts = data.split('/')
    if (parts.length !== 3) {
      return NextResponse.json({ error: 'Data deve estar no formato DD/MM/YYYY' }, { status: 400 })
    }
    const mes = parseInt(parts[1], 10)
    const ano = parseInt(parts[2], 10)

    const categoria = tipo === 'receita' ? 'Extra' : 'Outros'
    const status = 'Pendente'

    if (parcelas > 1) {
      // Create multiple entries spread across months
      const created = []
      const valorParcela = Math.round((valor / parcelas) * 100) / 100
      for (let i = 0; i < parcelas; i++) {
        let pMes = mes + i
        let pAno = ano
        while (pMes > 12) {
          pMes -= 12
          pAno += 1
        }
        const pData = `${parts[0].padStart(2, '0')}/${String(pMes).padStart(2, '0')}/${pAno}`
        const lanc = await db.lancamento.create({
          data: {
            tipo,
            descricao: `${descricao} (${i + 1}/${parcelas})`,
            categoria,
            valor: valorParcela,
            parcelas: 1,
            data: pData,
            status,
            mes: pMes,
            ano: pAno,
            origem: 'Manual',
          },
        })
        created.push(lanc)
      }
      return NextResponse.json({ success: true, count: created.length, itens: created })
    }

    const lanc = await db.lancamento.create({
      data: {
        tipo,
        descricao,
        categoria,
        valor,
        parcelas: 1,
        data,
        status,
        mes,
        ano,
        origem: 'Manual',
      },
    })

    // If it's a salary entry, also create/update SalarioConfig
    if (tipo === 'receita' && descricao.toLowerCase().includes('salário')) {
      await db.salarioConfig.upsert({
        where: { tipo_mes: { tipo: 'dia5', mes } },
        create: { tipo: 'dia5', mes, valor },
        update: { valor },
      })
    }

    return NextResponse.json({ success: true, lancamento: lanc })
  } catch (error) {
    console.error('Error in adicionar:', error)
    return NextResponse.json({ error: 'Erro ao adicionar lançamento' }, { status: 500 })
  }
}
