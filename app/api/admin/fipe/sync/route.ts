import { NextRequest, NextResponse } from 'next/server';
import { syncFipeCache } from '@/lib/fipe/sync';

export const maxDuration = 60; // Estende o timeout na Vercel (limite de 60 segundos)

export async function POST(req: NextRequest) {
  try {
    // Para simplificar a segurança, opcionalmente verifica cabeçalho de autorização ou chave de admin
    const authHeader = req.headers.get('Authorization');
    const adminKey = process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key';
    
    // Se o usuário configurar uma chave, valida, caso contrário passa livre em desenvolvimento
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    console.log('API de Sync FIPE: Iniciando sincronização sob demanda...');
    const result = await syncFipeCache();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      total: result.total,
      inserted: result.inserted,
      errors: result.errors,
      logs: result.logs
    });

  } catch (error: any) {
    console.error('Erro na API de Sync da FIPE:', error);
    return NextResponse.json({ error: 'Erro interno ao processar sincronização.', details: error.message }, { status: 500 });
  }
}

// Suporta GET também para testes rápidos no navegador se necessário
export async function GET(req: NextRequest) {
  return POST(req);
}
