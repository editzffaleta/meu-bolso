import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { generateStatementFingerprint } from '@meubolso/imports';

// Script de recalculo de fingerprints (auditoria M5).
//
// Contexto: `generateStatementFingerprint` passou a incluir `accountId` e o
// valor da transacao COM SINAL (antes usava `Math.abs`). Fingerprints
// gravados antes dessa mudanca (transacoes `source = 'import'`) ficam
// incompativeis com a nova formula -- este script releitura todas as
// transacoes importadas, recalcula o fingerprint com a formula nova e
// atualiza o valor persistido.
//
// Execucao: `npm run fingerprints:recalc --workspace=@meubolso/backend`
// (ou `npx tsx prisma/scripts/recalc-import-fingerprints.ts` dentro de
// `apps/backend`), com `DATABASE_URL` apontando para o Postgres real.
//
// Seguranca: roda tudo dentro de uma UNICA transacao de banco
// (`prisma.$transaction`). A nova formula e MAIS especifica que a antiga
// (accountId + sinal), entao duas transacoes que colidiam antes nao devem
// colidir agora -- mas se, ainda assim, o indice unico parcial
// `(userId, fingerprint) WHERE source='import'` for violado (P2002), o
// script aborta com um erro claro e reverte tudo (nada fica parcialmente
// atualizado).

const DATABASE_URL = process.env.DATABASE_URL ?? '';

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface ImportedTransactionRaw {
  id: string;
  date: Date;
  description: string;
  amount: Prisma.Decimal;
  accountId: string;
  type: string;
  fingerprint: string;
}

async function main(): Promise<void> {
  const transactions = await prisma.transaction.findMany({
    where: { source: 'import' },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      accountId: true,
      type: true,
      fingerprint: true,
    },
  });

  console.log(
    `Encontradas ${transactions.length} transacoes com source='import' para recalcular.`,
  );

  if (transactions.length === 0) {
    console.log('Nada a fazer. Script concluido.');
    return;
  }

  const updates = transactions.map((transaction: ImportedTransactionRaw) => {
    const signedAmount =
      transaction.type === 'expense'
        ? -Math.abs(Number(transaction.amount))
        : Math.abs(Number(transaction.amount));

    const newFingerprint = generateStatementFingerprint({
      date: transaction.date,
      amount: signedAmount,
      accountId: transaction.accountId,
      description: transaction.description,
    });

    return { id: transaction.id, oldFingerprint: transaction.fingerprint, newFingerprint };
  });

  const changed = updates.filter((item) => item.oldFingerprint !== item.newFingerprint);

  console.log(
    `${changed.length} de ${updates.length} fingerprints mudam de valor com a nova formula.`,
  );

  try {
    await prisma.$transaction(
      updates.map((item) =>
        prisma.transaction.update({
          where: { id: item.id },
          data: { fingerprint: item.newFingerprint },
        }),
      ),
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new Error(
        'Recalculo abortado: a nova formula de fingerprint gerou uma colisao ' +
          'inesperada no indice unico parcial (userId, fingerprint) WHERE ' +
          "source='import'. Nenhuma transacao foi atualizada (rollback). " +
          'Investigue as transacoes envolvidas antes de rodar o script novamente.',
      );
    }

    throw error;
  }

  console.log(
    `Recalculo concluido com sucesso: ${changed.length} fingerprints atualizados dentro de uma unica transacao de banco.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Falha no recalculo de fingerprints:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
