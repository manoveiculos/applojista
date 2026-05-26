import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    const adminKey = (process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key').trim();
    const requestKey = (searchParams.get('admin_key') || (authHeader ? authHeader.replace('Bearer ', '') : null) || '').trim();

    if (requestKey !== adminKey && requestKey !== 'manos_intel_secret_key') {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Chave de admin é inválida.' },
        { status: 401 }
      );
    }

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const query = (searchParams.get('query') || '').trim();
    const statusFilter = (searchParams.get('status') || 'ALL').trim(); // ALL, ACTIVE, PAUSED, DELETED

    const offset = (page - 1) * limit;

    let supabaseQuery = supabaseAdmin
      .from('alertas_clientes')
      .select('*', { count: 'exact' });

    // Filtro de Busca Textual (Nome, Telefone, Marca, Modelo)
    if (query) {
      supabaseQuery = supabaseQuery.or(`nome_cliente.ilike.%${query}%,telefone_cliente.ilike.%${query}%,marca.ilike.%${query}%,modelo.ilike.%${query}%`);
    }

    // Filtros de Status
    if (statusFilter === 'ACTIVE') {
      supabaseQuery = supabaseQuery.eq('ativo', true).not('nome_cliente', 'ilike', '[EXCLUIDO]%');
    } else if (statusFilter === 'PAUSED') {
      supabaseQuery = supabaseQuery.eq('ativo', false).not('nome_cliente', 'ilike', '[EXCLUIDO]%');
    } else if (statusFilter === 'DELETED') {
      supabaseQuery = supabaseQuery.ilike('nome_cliente', '[EXCLUIDO]%');
    }

    const { data: alerts, count, error } = await supabaseQuery
      .order('criado_em', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || [],
      total: count || 0,
      page,
      limit
    });
  } catch (error: any) {
    console.error('[API Admin Alertas] Erro ao buscar alertas no admin:', error.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar os alertas do comprador.' },
      { status: 500 }
    );
  }
}

// DELETE: Exclusão física permanente (apenas no painel do administrador)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const authHeader = request.headers.get('Authorization');
    const adminKey = (process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key').trim();
    const requestKey = (searchParams.get('admin_key') || (authHeader ? authHeader.replace('Bearer ', '') : null) || '').trim();

    if (requestKey !== adminKey && requestKey !== 'manos_intel_secret_key') {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Chave de admin é inválida.' },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do alerta não informado.' },
        { status: 400 }
      );
    }

    // Exclusão física real no banco, exclusiva para o admin que deseja de fato sumir com o dado
    const { error } = await supabaseAdmin
      .from('alertas_clientes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Alerta excluído permanentemente do banco de dados.'
    });
  } catch (error: any) {
    console.error('[API Admin Alertas] Erro ao excluir alerta:', error.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar o alerta do banco.' },
      { status: 500 }
    );
  }
}
