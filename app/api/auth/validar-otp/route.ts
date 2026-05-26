import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'manos_intel_secret_key';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, telefone, otp, hash, expiraEm } = body;

    if (!nome || !telefone || !otp || !hash || !expiraEm) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos para validação.' },
        { status: 400 }
      );
    }

    const cleanPhone = telefone.replace(/[^\d]/g, '');

    // 1. Verifica expiração
    if (Date.now() > Number(expiraEm)) {
      return NextResponse.json(
        { success: false, error: 'O código de verificação expirou. Por favor, solicite um novo código.' },
        { status: 400 }
      );
    }

    // 2. Valida a assinatura da hash
    const dataToHash = `${cleanPhone}:${otp}:${expiraEm}`;
    const calculatedHash = crypto
      .createHmac('sha256', ADMIN_SECRET_KEY)
      .update(dataToHash)
      .digest('hex');

    if (calculatedHash !== hash) {
      return NextResponse.json(
        { success: false, error: 'Código de verificação incorreto.' },
        { status: 400 }
      );
    }

    // 3. Define a sessão pública em cookie
    const cookieStore = await cookies();
    cookieStore.set('vyro_public_session', JSON.stringify({
      nome: nome.trim(),
      telefone: cleanPhone,
      autenticadoEm: Date.now()
    }), {
      path: '/',
      httpOnly: false, // Mantido false para que o client-side possa ler o Nome do usuário logado se precisar
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    return NextResponse.json({
      success: true,
      message: 'Autenticado com sucesso!',
      user: {
        nome: nome.trim(),
        telefone: cleanPhone
      }
    });

  } catch (err: any) {
    console.error('[Auth OTP Validate] Erro crítico:', err.message);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao validar o código.' },
      { status: 500 }
    );
  }
}
