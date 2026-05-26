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

// DELETE: Exclui um lead específico do Facebook pelo mensagem_id
export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Não autorizado.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mensagemId = searchParams.get('mensagem_id');

  if (!mensagemId) {
    return NextResponse.json({ success: false, error: 'mensagem_id é obrigatório para exclusão.' }, { status: 400 });
  }

  try {
    console.log(`[Admin Facebook] Deletando lead individual ID: ${mensagemId}`);
    
    const { error, status } = await supabaseAdmin
      .from('veiculosdecompraanunciofacebook')
      .delete()
      .eq('mensagem_id', mensagemId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Lead ${mensagemId} excluído com sucesso do banco de dados.`,
      status
    });

  } catch (err: any) {
    console.error(`[Admin Facebook API] Erro ao excluir lead ${mensagemId}:`, err.message);
    return NextResponse.json({ success: false, error: `Erro ao excluir lead: ${err.message}` }, { status: 500 });
  }
}
