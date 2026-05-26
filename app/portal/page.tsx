'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Key, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { safeFetch } from '@/lib/api-client';

export default function PortalLoginPage() {
  const router = useRouter();

  // Estados dos inputs
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [otp, setOtp] = useState('');

  // Controle de fluxo
  const [step, setStep] = useState<1 | 2>(1); // 1: Dados cadastrais, 2: Inserir OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dados retornados do envio de OTP
  const [sessionHash, setSessionHash] = useState('');
  const [sessionExpiration, setSessionExpiration] = useState<number>(0);

  // Timer de reenvio
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Aplica máscara brasileira ao telefone: (99) 99999-9999
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    const len = numbers.length;
    if (len < 3) return numbers;
    if (len < 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }
    if (len < 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setTelefone(formatted);
  };

  // Passo 1: Solicitar envio do código
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await safeFetch('/api/auth/enviar-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone,
        }),
      });

      setSessionHash(data.hash);
      setSessionExpiration(data.expiraEm);
      setSuccessMsg('Código gerado! Enviando para o seu WhatsApp...');
      
      setTimeout(() => {
        setStep(2);
        setSuccessMsg(null);
      }, 1500);

      setResendTimer(60); // Aguarda 60s para poder reenviar
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Validar o código recebido
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 4) {
      setError('Por favor, digite o código de 4 dígitos enviado.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await safeFetch('/api/auth/validar-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone,
          otp: otp.trim(),
          hash: sessionHash,
          expiraEm: sessionExpiration,
        }),
      });

      setSuccessMsg('Autenticação bem-sucedida! Redirecionando...');
      
      setTimeout(() => {
        router.push('/portal/radar');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao validar o código.');
    } finally {
      setLoading(false);
    }
  };

  // Reenvio do código OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setOtp('');

    try {
      const data = await safeFetch('/api/auth/enviar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone,
        }),
      });

      setSessionHash(data.hash);
      setSessionExpiration(data.expiraEm);
      setSuccessMsg('Um novo código de confirmação foi enviado para seu WhatsApp!');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Falha ao reenviar código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Imagem de Fundo de Veículo Premium */}
      <div className="absolute inset-0 bg-[url('/images/bg_vehicle.png')] bg-cover bg-center opacity-[0.05] mix-blend-screen pointer-events-none" />

      {/* Elementos visuais de fundo */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-red-950/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-zinc-900/20 blur-[160px] pointer-events-none" />

      {/* Container de Login */}
      <div className="w-full max-w-md z-10">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <div className="text-3xl font-black tracking-tight text-white select-none">
            vyro<span className="text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-xl ml-1">portal</span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Acesso público exclusivo ao Radar de Repasses 24h</p>
        </div>

        {/* Card Principal */}
        <div className="glass-panel border border-zinc-850 rounded-3xl p-8 bg-zinc-950/40 shadow-2xl relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {error && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PASSO 1: Solicitação de Código */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-bold text-white text-lg">Seja bem-vindo</h2>
                <p className="text-xs text-zinc-400">Informe seus dados para receber o token de acesso no WhatsApp.</p>
              </div>

              {/* Input Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Seu Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Ex: João Silveira"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Input Telefone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Seu WhatsApp (com DDD)</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Ex: (47) 99999-9999"
                    value={telefone}
                    onChange={handlePhoneChange}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer glow-primary glow-primary-hover disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Enviando código...
                  </>
                ) : (
                  <>
                    Receber Código no WhatsApp
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASSO 2: Inserção do Token OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-bold text-white text-lg">Confirmar WhatsApp</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enviamos um código de verificação para o número <strong className="text-zinc-200">{telefone}</strong>.
                </p>
              </div>

              {/* Input OTP */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center mb-1">Digite o código de 4 dígitos</label>
                <div className="relative flex justify-center">
                  <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    disabled={loading}
                    placeholder="0000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-3.5 px-4 text-center text-lg font-black tracking-[0.75em] text-white focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-50 placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-700"
                  />
                </div>
              </div>

              {/* Botão de Login */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer glow-primary glow-primary-hover disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    Acessar Radar 24h
                    <Sparkles className="w-4 h-4 text-white" />
                  </>
                )}
              </button>

              {/* Reenviar Código */}
              <div className="flex flex-col items-center gap-2.5 mt-2">
                <button
                  type="button"
                  disabled={loading || resendTimer > 0}
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:hover:text-zinc-400 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Reenviar código
                </button>
                
                {resendTimer > 0 && (
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Aguarde {resendTimer}s para solicitar novamente
                  </span>
                )}
              </div>

              {/* Voltar para Passo 1 */}
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[10px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-wider text-center"
              >
                Alterar Nome ou Telefone
              </button>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[10px] text-zinc-650 select-none">
          Todos os direitos reservados a drivvoo &copy; 2026.
        </div>

      </div>
    </div>
  );
}
