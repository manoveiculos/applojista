'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function ManosVeiculosAcessoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'authorized' | 'error'>('checking');

  useEffect(() => {
    try {
      // 1. Injeta chaves administrativas e desbloqueio no LocalStorage
      localStorage.setItem('vyro_admin_key', 'manos_intel_secret_key');
      localStorage.setItem('vyro_hidden_unlocked', 'true');

      // 2. Cria o cookie de sessão pública com bypass administrativo para o Radar
      const adminSession = {
        nome: 'Equipe Manos',
        telefone: '00000000000'
      };
      document.cookie = `vyro_public_session=${encodeURIComponent(JSON.stringify(adminSession))}; path=/; max-age=31536000;`;

      setStatus('authorized');

      // 3. Redireciona para o painel de oportunidades de repasse após 2 segundos
      const timer = setTimeout(() => {
        router.push('/oportunidades?admin_key=manos_intel_secret_key');
      }, 2000);

      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Erro ao injetar credenciais da equipe:', err);
      setStatus('error');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Luzes decorativas de fundo premium */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/20 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/10 blur-[180px] pointer-events-none" />

      {/* Card Central */}
      <div className="w-full max-w-md bg-zinc-950/40 border border-zinc-850 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center text-center gap-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {status === 'checking' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Validando Acesso</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Conectando ao canal seguro da equipe...
              </p>
            </div>
          </>
        )}

        {status === 'authorized' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(239,68,68,0.25)] animate-pulse-soft">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center justify-center gap-1.5">
                Equipe Autorizada <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Credenciais injetadas com segurança. Painel de oportunidades desbloqueado!
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900 border border-zinc-850 px-3 py-1.5 rounded-xl mt-2">
              Redirecionando em instantes...
            </span>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center justify-center text-red-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Erro de Acesso</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Falha ao injetar credenciais da equipe localmente. Verifique se o seu navegador aceita localStorage.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[10px] text-zinc-650 z-10">
        Todos os direitos reservados a drivvoo &copy; 2026. Acesso Seguro de Engenharia.
      </div>
    </div>
  );
}
