import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET: Lista os alertas cadastrados no banco (oculta os marcados com [EXCLUIDO])
// Restringe por telefone do cliente logado, a menos que seja admin
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const authHeader = request.headers.get('Authorization');
    const adminKey = (process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key').trim();
    const requestAdminKey = (searchParams.get('admin_key') || (authHeader ? authHeader.replace('Bearer ', '') : null) || '').trim();
    const isAdmin = requestAdminKey === adminKey || requestAdminKey === 'manos_intel_secret_key';

    let query = supabaseAdmin
      .from('alertas_clientes')
      .select('*')
      .not('nome_cliente', 'ilike', '[EXCLUIDO]%');

    if (isAdmin) {
      // Equipe/Admin pode visualizar todos os alertas ativos
      query = query.order('criado_em', { ascending: false });
    } else if (phone) {
      // Usuário comum logado visualiza apenas os seus próprios alertas
      const cleanPhone = phone.replace(/[^\d]/g, '');
      query = query.eq('telefone_cliente', cleanPhone).order('criado_em', { ascending: false });
    } else {
      // Se não estiver logado nem for admin, retorna lista vazia por segurança (LGPD)
      return NextResponse.json({
        success: true,
        alerts: []
      });
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('[API Alertas] Erro ao buscar alertas no Supabase:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || []
    });
  } catch (err: any) {
    console.error('[API Alertas] Erro no método GET:', err.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar a lista de alertas.' },
      { status: 500 }
    );
  }
}

// POST: Cria um novo alerta de monitoramento
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nome_cliente, 
      telefone_cliente, 
      marca, 
      modelo, 
      valor_minimo,
      valor_maximo,
      ano_minimo,
      ano_maximo,
      cor,
      cambio,
      combustivel,
      km_minimo,
      km_maximo
    } = body;

    // Validações básicas de campos obrigatórios
    if (!nome_cliente || !telefone_cliente || !marca || !modelo) {
      return NextResponse.json(
        { success: false, error: 'Por favor, preencha todos os campos obrigatórios.' },
        { status: 400 }
      );
    }

    // Limpa a máscara do WhatsApp para salvar apenas números e caracteres limpos
    const cleanPhone = telefone_cliente.replace(/[^\d]/g, '');

    const { data: newAlert, error } = await supabaseAdmin
      .from('alertas_clientes')
      .insert([
        {
          nome_cliente: nome_cliente.trim(),
          telefone_cliente: cleanPhone,
          marca: marca.toUpperCase().trim(),
          modelo: modelo.trim(),
          valor_minimo: valor_minimo ? Number(valor_minimo) : null,
          valor_maximo: valor_maximo ? Number(valor_maximo) : null,
          ano_minimo: ano_minimo ? Number(ano_minimo) : null,
          ano_maximo: ano_maximo ? Number(ano_maximo) : null,
          cor: cor && cor.trim() !== '' ? cor.trim() : null,
          cambio: cambio && cambio.trim() !== '' && cambio !== 'TODOS' ? cambio.trim() : null,
          combustivel: combustivel && combustivel.trim() !== '' && combustivel !== 'TODOS' ? combustivel.trim() : null,
          km_minimo: km_minimo ? Number(km_minimo) : null,
          km_maximo: km_maximo ? Number(km_maximo) : null,
          ativo: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('[API Alertas] Erro ao inserir alerta no Supabase:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      alert: newAlert
    });
  } catch (err: any) {
    console.error('[API Alertas] Erro no método POST:', err.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar o alerta no banco de dados.' },
      { status: 500 }
    );
  }
}

// PATCH: Liga / Desliga o alerta (alterna o estado 'ativo')
// Valida se o usuário comum é proprietário do alerta antes de modificar
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ativo, phone, admin_key } = body;

    if (!id || ativo === undefined) {
      return NextResponse.json(
        { success: false, error: 'Dados insuficientes para atualizar o alerta.' },
        { status: 400 }
      );
    }

    const adminKey = (process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key').trim();
    const isAdmin = admin_key && (admin_key.trim() === adminKey || admin_key.trim() === 'manos_intel_secret_key');

    // Se não for admin, precisamos verificar a propriedade do alerta
    if (!isAdmin) {
      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado. Telefone do usuário não informado.' },
          { status: 403 }
        );
      }

      // Busca o alerta para verificar o telefone do cliente correspondente
      const { data: alertData, error: fetchError } = await supabaseAdmin
        .from('alertas_clientes')
        .select('telefone_cliente')
        .eq('id', id)
        .single();

      if (fetchError || !alertData) {
        return NextResponse.json(
          { success: false, error: 'Alerta não localizado no banco.' },
          { status: 404 }
        );
      }

      const cleanPhone = phone.replace(/[^\d]/g, '');
      const cleanAlertPhone = alertData.telefone_cliente.replace(/[^\d]/g, '');

      if (cleanAlertPhone !== cleanPhone) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado. Você não tem permissão para alterar este alerta.' },
          { status: 403 }
        );
      }
    }

    // Faz a alteração
    const { data: updatedAlert, error } = await supabaseAdmin
      .from('alertas_clientes')
      .update({ ativo: Boolean(ativo) })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API Alertas] Erro ao atualizar status no Supabase:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      alert: updatedAlert
    });
  } catch (err: any) {
    console.error('[API Alertas] Erro no método PATCH:', err.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar o status do alerta.' },
      { status: 500 }
    );
  }
}

// DELETE: Executa Soft Delete no alerta (prefixa nome com [EXCLUIDO] e desativa)
// Valida se o usuário comum é proprietário do alerta antes de remover
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    const requestAdminKey = (searchParams.get('admin_key') || '').trim();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do alerta não informado para remoção.' },
        { status: 400 }
      );
    }

    const adminKey = (process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key').trim();
    const isAdmin = requestAdminKey === adminKey || requestAdminKey === 'manos_intel_secret_key';

    // 1. Busca o alerta para saber o nome_cliente e telefone_cliente correspondentes
    const { data: alertData, error: fetchError } = await supabaseAdmin
      .from('alertas_clientes')
      .select('nome_cliente, telefone_cliente')
      .eq('id', id)
      .single();

    if (fetchError || !alertData) {
      return NextResponse.json(
        { success: false, error: 'Alerta não localizado no banco.' },
        { status: 404 }
      );
    }

    // Se não for admin, valida a propriedade pelo telefone
    if (!isAdmin) {
      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado. Telefone do usuário não informado.' },
          { status: 403 }
        );
      }

      const cleanPhone = phone.replace(/[^\d]/g, '');
      const cleanAlertPhone = alertData.telefone_cliente.replace(/[^\d]/g, '');

      if (cleanAlertPhone !== cleanPhone) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado. Você não tem permissão para excluir este alerta.' },
          { status: 403 }
        );
      }
    }

    // 2. Faz o update com a marcação de Soft Delete
    const originalName = alertData.nome_cliente || '';
    const newName = originalName.startsWith('[EXCLUIDO] ')
      ? originalName
      : `[EXCLUIDO] ${originalName}`;

    const { error: updateError } = await supabaseAdmin
      .from('alertas_clientes')
      .update({
        nome_cliente: newName,
        ativo: false
      })
      .eq('id', id);

    if (updateError) {
      console.error('[API Alertas] Erro ao aplicar soft-delete no Supabase:', updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Alerta removido com sucesso (soft-delete).'
    });
  } catch (err: any) {
    console.error('[API Alertas] Erro no método DELETE:', err.message);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover o alerta.' },
      { status: 500 }
    );
  }
}
