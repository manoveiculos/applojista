import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Chave admin de segurança
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key';

// Função para validar autorização
function isAuthorized(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const { searchParams } = new URL(request.url);
  
  const token = searchParams.get('admin_key') || (authHeader ? authHeader.replace('Bearer ', '') : null);
  return token === ADMIN_SECRET_KEY;
}

// GET: Retorna estatísticas de contagem de registros para cada tabela relevante
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }

  const tables = [
    { key: 'repassecentral', name: 'Oportunidades (repassecentral)' },
    { key: 'tracking_leads', name: 'Leads de Rastreamento (tracking_leads)' },
    { key: 'leads_master', name: 'Leads Master' },
    { key: 'leads_distribuicao', name: 'Leads de Distribuição' },
    { key: 'leads_compra', name: 'Leads de Compra' },
    { key: 'raw_messages', name: 'Mensagens Brutas (raw_messages)' },
    { key: 'offers', name: 'Ofertas Classificadas (offers)' },
    { key: 'fipe_cache', name: 'Cache FIPE' }
  ];

  try {
    const stats = await Promise.all(
      tables.map(async (t) => {
        try {
          const { count, error } = await supabaseAdmin
            .from(t.key)
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.error(`Erro ao contar tabela ${t.key}:`, error.message);
            return { key: t.key, name: t.name, count: 0, active: false, error: error.message };
          }

          return { key: t.key, name: t.name, count: count || 0, active: true };
        } catch (err: any) {
          return { key: t.key, name: t.name, count: 0, active: false, error: err.message };
        }
      })
    );

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Exclui todos os registros de uma tabela específica (limpeza em lote)
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    if (!tableName) {
      return NextResponse.json({ success: false, error: 'Parâmetro "table" é obrigatório.' }, { status: 400 });
    }

    // Listagem restrita das tabelas permitidas para segurança contra injeção ou deleções catastróficas
    const allowedTables = [
      'repassecentral',
      'tracking_leads',
      'leads_master',
      'leads_distribuicao',
      'leads_compra',
      'raw_messages',
      'offers',
      'fipe_cache'
    ];

    if (!allowedTables.includes(tableName)) {
      return NextResponse.json({ success: false, error: `Exclusão não permitida para a tabela "${tableName}".` }, { status: 403 });
    }

    console.log(`[Admin DB] Iniciando exclusão de todas as linhas da tabela: ${tableName}`);

    // Executa a exclusão de todas as linhas onde o ID não é o UUID zero (limpa tudo)
    const { error, count } = await supabaseAdmin
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Tabela ${tableName} foi totalmente limpa com sucesso.`,
      deletedRows: count
    });

  } catch (err: any) {
    console.error('[Admin DB API] Erro ao limpar tabela:', err.message);
    return NextResponse.json({ success: false, error: `Falha ao limpar a tabela: ${err.message}` }, { status: 500 });
  }
}
