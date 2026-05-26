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

// GET: Retorna os repasses de forma paginada para o gerenciador administrativo
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
  const page = Math.max(Number(searchParams.get('page') || 1), 1);
  const query = searchParams.get('query') || '';
  
  const fromOffset = (page - 1) * limit;
  const toOffset = fromOffset + limit - 1;

  try {
    let selectBuilder = supabaseAdmin
      .from('repassecentral')
      .select('*', { count: 'exact' });

    if (query) {
      // Filtra por marca ou modelo
      selectBuilder = selectBuilder.or(`marca.ilike.%${query}%,modelo.ilike.%${query}%,nome_anunciante.ilike.%${query}%`);
    }

    // Ordenação decrescente por data de recebimento
    const { data: repasses, count, error } = await selectBuilder
      .order('data_hora_recebimento', { ascending: false })
      .range(fromOffset, toOffset);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      repasses: repasses || [],
      total: count || 0,
      page,
      limit
    });

  } catch (err: any) {
    console.error('[Admin Repasse API] Erro ao buscar repasses:', err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE: Exclui um repasse específico do banco de dados pelo ID (UUID)
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID é obrigatório para exclusão.' }, { status: 400 });
  }

  try {
    console.log(`[Admin Repasse] Deletando repasse individual ID: ${id}`);
    
    const { error, status } = await supabaseAdmin
      .from('repassecentral')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Registro ${id} excluído com sucesso do banco de dados.`,
      status
    });

  } catch (err: any) {
    console.error(`[Admin Repasse API] Erro ao excluir registro ${id}:`, err.message);
    return NextResponse.json({ success: false, error: `Erro ao excluir: ${err.message}` }, { status: 500 });
  }
}
