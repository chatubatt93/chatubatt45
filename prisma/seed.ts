import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const NOME_MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio',
  'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function dataStr(dia: number, mes: number): string {
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/2026`
}

const lancamentos = [
  // === JANEIRO 2026 ===
  // Salários
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(5, 1), status: 'Recebido', mes: 1, ano: 2026 },
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(20, 1), status: 'Recebido', mes: 1, ano: 2026 },
  // Despesas
  { tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 1800, parcelas: 1, data: dataStr(10, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Extra', categoria: 'Mercado', valor: 520, parcelas: 1, data: dataStr(8, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Carrefour', categoria: 'Mercado', valor: 380, parcelas: 1, data: dataStr(15, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Conta de Energia', categoria: 'Energia', valor: 220, parcelas: 1, data: dataStr(12, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Internet Vivo Fibra', categoria: 'Internet', valor: 119.90, parcelas: 1, data: dataStr(15, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Recarga Metrô', categoria: 'Transporte', valor: 200, parcelas: 1, data: dataStr(7, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Plano de Saúde Unimed', categoria: 'Saúde', valor: 450, parcelas: 1, data: dataStr(10, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Curso Udemy', categoria: 'Educação', valor: 89.90, parcelas: 1, data: dataStr(18, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Cinema e Lanche', categoria: 'Lazer', valor: 95, parcelas: 1, data: dataStr(25, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'iFood', categoria: 'Restaurante', valor: 180, parcelas: 1, data: dataStr(20, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Netflix', categoria: 'Assinaturas', valor: 55.90, parcelas: 1, data: dataStr(5, 1), status: 'Pago', mes: 1, ano: 2026 },
  { tipo: 'despesa', descricao: 'Spotify', categoria: 'Assinaturas', valor: 21.90, parcelas: 1, data: dataStr(5, 1), status: 'Pago', mes: 1, ano: 2026 },
  // Extra
  { tipo: 'receita', descricao: 'Freelance Design Logo', categoria: 'Extra', valor: 800, parcelas: 1, data: dataStr(22, 1), status: 'Recebido', mes: 1, ano: 2026 },

  // === FEVEREIRO 2026 ===
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(5, 2), status: 'Recebido', mes: 2, ano: 2026 },
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(20, 2), status: 'Recebido', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 1800, parcelas: 1, data: dataStr(10, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Extra', categoria: 'Mercado', valor: 490, parcelas: 1, data: dataStr(7, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Atacadão', categoria: 'Mercado', valor: 620, parcelas: 1, data: dataStr(14, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Conta de Energia', categoria: 'Energia', valor: 195, parcelas: 1, data: dataStr(12, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Internet Vivo Fibra', categoria: 'Internet', valor: 119.90, parcelas: 1, data: dataStr(15, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Recarga Metrô', categoria: 'Transporte', valor: 200, parcelas: 1, data: dataStr(7, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Plano de Saúde Unimed', categoria: 'Saúde', valor: 450, parcelas: 1, data: dataStr(10, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Farmácia Drogasil', categoria: 'Saúde', valor: 85, parcelas: 1, data: dataStr(18, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Restaurante Outback', categoria: 'Restaurante', valor: 145, parcelas: 1, data: dataStr(14, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Netflix', categoria: 'Assinaturas', valor: 55.90, parcelas: 1, data: dataStr(5, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Spotify', categoria: 'Assinaturas', valor: 21.90, parcelas: 1, data: dataStr(5, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Amazon Prime', categoria: 'Assinaturas', valor: 14.90, parcelas: 1, data: dataStr(5, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'despesa', descricao: 'Camiseta Renner', categoria: 'Vestuário', valor: 129.90, parcelas: 1, data: dataStr(22, 2), status: 'Pago', mes: 2, ano: 2026 },
  { tipo: 'receita', descricao: 'Venda iPhone Usado', categoria: 'Extra', valor: 1500, parcelas: 1, data: dataStr(28, 2), status: 'Recebido', mes: 2, ano: 2026 },

  // === MARÇO 2026 ===
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(5, 3), status: 'Recebido', mes: 3, ano: 2026 },
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(20, 3), status: 'Recebido', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 1800, parcelas: 1, data: dataStr(10, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Extra', categoria: 'Mercado', valor: 550, parcelas: 1, data: dataStr(8, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Carrefour', categoria: 'Mercado', valor: 410, parcelas: 1, data: dataStr(21, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Conta de Energia', categoria: 'Energia', valor: 230, parcelas: 1, data: dataStr(12, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Internet Vivo Fibra', categoria: 'Internet', valor: 119.90, parcelas: 1, data: dataStr(15, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Recarga Metrô', categoria: 'Transporte', valor: 200, parcelas: 1, data: dataStr(7, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Plano de Saúde Unimed', categoria: 'Saúde', valor: 450, parcelas: 1, data: dataStr(10, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Academia SmartFit', categoria: 'Saúde', valor: 79.90, parcelas: 1, data: dataStr(5, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Curso de Inglês Wise Up', categoria: 'Educação', valor: 350, parcelas: 1, data: dataStr(10, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'iFood', categoria: 'Restaurante', valor: 220, parcelas: 1, data: dataStr(15, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Netflix', categoria: 'Assinaturas', valor: 55.90, parcelas: 1, data: dataStr(5, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Spotify', categoria: 'Assinaturas', valor: 21.90, parcelas: 1, data: dataStr(5, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Amazon Prime', categoria: 'Assinaturas', valor: 14.90, parcelas: 1, data: dataStr(5, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Tênis Nike (3x)', categoria: 'Vestuário', valor: 399.90, parcelas: 3, data: dataStr(12, 3), status: 'Pago', mes: 3, ano: 2026 },
  { tipo: 'despesa', descricao: 'Tênis Nike (3x)', categoria: 'Vestuário', valor: 133.30, parcelas: 1, data: dataStr(12, 4), status: 'Pendente', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Tênis Nike (3x)', categoria: 'Vestuário', valor: 133.30, parcelas: 1, data: dataStr(12, 5), status: 'Pendente', mes: 5, ano: 2026 },
  { tipo: 'receita', descricao: 'Freelance Website', categoria: 'Extra', valor: 1200, parcelas: 1, data: dataStr(25, 3), status: 'Recebido', mes: 3, ano: 2026 },

  // === ABRIL 2026 ===
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(5, 4), status: 'Recebido', mes: 4, ano: 2026 },
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(20, 4), status: 'Recebido', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 1800, parcelas: 1, data: dataStr(10, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Extra', categoria: 'Mercado', valor: 480, parcelas: 1, data: dataStr(6, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Atacadão', categoria: 'Mercado', valor: 590, parcelas: 1, data: dataStr(18, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Conta de Energia', categoria: 'Energia', valor: 210, parcelas: 1, data: dataStr(12, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Internet Vivo Fibra', categoria: 'Internet', valor: 119.90, parcelas: 1, data: dataStr(15, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Recarga Metrô', categoria: 'Transporte', valor: 200, parcelas: 1, data: dataStr(7, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Plano de Saúde Unimed', categoria: 'Saúde', valor: 450, parcelas: 1, data: dataStr(10, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Academia SmartFit', categoria: 'Saúde', valor: 79.90, parcelas: 1, data: dataStr(5, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Curso de Inglês Wise Up', categoria: 'Educação', valor: 350, parcelas: 1, data: dataStr(10, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Restaurante Siri Casa', categoria: 'Restaurante', valor: 185, parcelas: 1, data: dataStr(19, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Netflix', categoria: 'Assinaturas', valor: 55.90, parcelas: 1, data: dataStr(5, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Spotify', categoria: 'Assinaturas', valor: 21.90, parcelas: 1, data: dataStr(5, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Amazon Prime', categoria: 'Assinaturas', valor: 14.90, parcelas: 1, data: dataStr(5, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'despesa', descricao: 'Conta de Água', categoria: 'Energia', valor: 85, parcelas: 1, data: dataStr(15, 4), status: 'Pago', mes: 4, ano: 2026 },
  { tipo: 'receita', descricao: 'Cashback Nubank', categoria: 'Extra', valor: 45.80, parcelas: 1, data: dataStr(1, 4), status: 'Recebido', mes: 4, ano: 2026 },

  // === MAIO 2026 ===
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(5, 5), status: 'Recebido', mes: 5, ano: 2026 },
  { tipo: 'receita', descricao: 'Salário', categoria: 'Salário', valor: 4000, parcelas: 1, data: dataStr(20, 5), status: 'Pendente', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Aluguel', categoria: 'Aluguel', valor: 1800, parcelas: 1, data: dataStr(10, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Extra', categoria: 'Mercado', valor: 530, parcelas: 1, data: dataStr(5, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Supermercado Carrefour', categoria: 'Mercado', valor: 0, parcelas: 1, data: dataStr(20, 5), status: 'Pendente', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Conta de Energia', categoria: 'Energia', valor: 245, parcelas: 1, data: dataStr(12, 5), status: 'Pendente', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Internet Vivo Fibra', categoria: 'Internet', valor: 119.90, parcelas: 1, data: dataStr(15, 5), status: 'Pendente', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Recarga Metrô', categoria: 'Transporte', valor: 200, parcelas: 1, data: dataStr(7, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Plano de Saúde Unimed', categoria: 'Saúde', valor: 450, parcelas: 1, data: dataStr(10, 5), status: 'Pendente', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Academia SmartFit', categoria: 'Saúde', valor: 79.90, parcelas: 1, data: dataStr(5, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Curso de Inglês Wise Up', categoria: 'Educação', valor: 350, parcelas: 1, data: dataStr(10, 5), status: 'Pendente', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Netflix', categoria: 'Assinaturas', valor: 55.90, parcelas: 1, data: dataStr(5, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Spotify', categoria: 'Assinaturas', valor: 21.90, parcelas: 1, data: dataStr(5, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Amazon Prime', categoria: 'Assinaturas', valor: 14.90, parcelas: 1, data: dataStr(5, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'despesa', descricao: 'Presente Dia das Mães', categoria: 'Lazer', valor: 250, parcelas: 1, data: dataStr(8, 5), status: 'Pago', mes: 5, ano: 2026 },
  { tipo: 'receita', descricao: 'Freelance App Mobile', categoria: 'Extra', valor: 2000, parcelas: 1, data: dataStr(15, 5), status: 'Pendente', mes: 5, ano: 2026 },

  // Fix: The zero-value Carrefour entry for May
]

// Fix the zero value entry
const fixedLancamentos = lancamentos.map(l => {
  if (l.descricao === 'Supermercado Carrefour' && l.mes === 5 && l.valor === 0) {
    return { ...l, valor: 445 }
  }
  return l
})

async function main() {
  console.log('🌱 Iniciando seed do Zeta Finance...')

  // Clean existing data
  await prisma.lancamento.deleteMany()
  await prisma.salarioConfig.deleteMany()

  // Create lancamentos
  for (const l of fixedLancamentos) {
    await prisma.lancamento.create({ data: l })
  }
  console.log(`✅ ${fixedLancamentos.length} lançamentos criados`)

  // Create salary configs
  const salarioConfigs = [
    // Dia 5 - all months
    ...Array.from({ length: 12 }, (_, i) => ({
      tipo: 'dia5',
      mes: i + 1,
      valor: 4000,
    })),
    // Dia 20 - all months
    ...Array.from({ length: 12 }, (_, i) => ({
      tipo: 'dia20',
      mes: i + 1,
      valor: 4000,
    })),
  ]

  for (const s of salarioConfigs) {
    await prisma.salarioConfig.create({ data: s })
  }
  console.log(`✅ ${salarioConfigs.length} configs de salário criados`)

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
