import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const N8N_OTP_WEBHOOK = 'https://n8n.drivvoo.com/webhook/c58a4820-f104-4edf-a62f-9d6ddaf9b792';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, telefone } = body;

    if (!nome || !telefone) {
      return NextResponse.json(
        { success: false, error: 'Nome e telefone são obrigatórios.' },
        { status: 400 }
      );
    }

    // Limpa o telefone para conter apenas números
    const cleanPhone = telefone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe um telefone válido com DDD.' },
        { status: 400 }
      );
    }

    // Gera um código de 4 dígitos aleatório
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Expiração em 10 minutos
    const expiraEm = Date.now() + 10 * 60 * 1000;

    // Cria a hash stateless
    const dataToHash = `${cleanPhone}:${otp}:${expiraEm}`;
    const hash = crypto
      .createHmac('sha256', ADMIN_SECRET_KEY)
      .update(dataToHash)
      .digest('hex');

    console.log(`[Auth OTP] OTP Gerado para ${nome} (${cleanPhone}): ${otp}. Expiração: ${new Date(expiraEm).toISOString()}`);

    // Dispara o webhook para o n8n
    try {
      const response = await fetch(N8N_OTP_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: cleanPhone,
          codigo: otp,
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n retornou status ${response.status}`);
      }
    } catch (webhookErr: any) {
      console.error('[Auth OTP] Falha ao notificar n8n:', webhookErr.message);
      // Retorna o erro mas permite continuar caso o desenvolvedor queira debugar no console
      return NextResponse.json({
        success: false,
        error: 'Erro de comunicação ao enviar o código para o WhatsApp. Tente novamente.',
        details: webhookErr.message
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      hash,
      expiraEm,
      message: 'Código enviado com sucesso para o WhatsApp!',
    });

  } catch (err: any) {
    console.error('[Auth OTP] Erro crítico:', err.message);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar o envio de OTP.' },
      { status: 500 }
    );
  }
}
