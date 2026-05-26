'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Database, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Gauge,
  Calculator,
  Bell,
  Lock
} from 'lucide-react';

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const isUnlocked = localStorage.getItem('vyro_hidden_unlocked') === 'true';
    setUnlocked(isUnlocked);
  }, []);

  const handleLogoClick = async () => {
    const nextCount = clickCount + 1;
    if (nextCount >= 5) {
      setClickCount(0);
      if (!unlocked) {
        const password = window.prompt('Digite a senha de administrador para liberar as abas:');
        if (password !== null) {
          const cleanPassword = password.trim();
          if (cleanPassword === 'manos_intel_secret_key') {
            localStorage.setItem('vyro_hidden_unlocked', 'true');
            setUnlocked(true);
          } else {
            try {
              const res = await fetch(`/api/facebook?admin_key=${encodeURIComponent(cleanPassword)}`);
              if (res.ok) {
                localStorage.setItem('vyro_hidden_unlocked', 'true');
                localStorage.setItem('vyro_admin_key', cleanPassword);
                setUnlocked(true);
              } else {
                alert('Senha incorreta!');
              }
            } catch (err) {
              alert('Erro de conexão ao validar a senha.');
            }
          }
        }
      } else {
        localStorage.setItem('vyro_hidden_unlocked', 'false');
        setUnlocked(false);
      }
    } else {
      setClickCount(nextCount);
    }
  };

  const modules = [
    {
      title: "Ingestão & Parsing IA",
      description: "Upload de logs e extração inteligente estruturada de ofertas usando LLM Sonnet.",
      status: "Pronto",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: Database
    },
    {
      title: "FIPE & Avaliação de Compra",
      description: "Pesquisa oficial, ajuste dinâmico por KM/conservação e cálculo inteligente de margem.",
      status: "Pronto",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: ShieldCheck
    },
    {
      title: "Deal Score & Histórico",
      description: "Classificação automática de 0-100 para apontar os melhores negócios de repasse.",
      status: "Pronto",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: TrendingUp
    },
    {
      title: "Ofertas Exclusivas Manos",
      description: "Leads e ofertas exclusivas coletados em tempo real de campanhas e anúncios Manos.",
      status: "Pronto",
      statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: Facebook
    }
  ];

  return (
    <div className="flex-1 flex flex-col justify-center bg-black text-zinc-100 relative overflow-hidden">
      
      {/* Luzes de fundo / Gradients decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/10 blur-[150px] pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col justify-center items-center gap-12 z-10">
        
        {/* Badge superior */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-semibold tracking-wider text-zinc-300 uppercase animate-pulse-soft">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulos de Avaliação & Ingestão Ativos
        </div>

        {/* Hero Title */}
        <div className="flex flex-col items-center gap-4 text-center max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white flex flex-col sm:flex-row items-center gap-2 sm:gap-4 leading-none">
            vyro<span 
              onClick={handleLogoClick}
              className="text-primary glow-primary px-3 py-1 bg-primary/10 border border-primary/20 rounded-2xl cursor-pointer hover:bg-primary/25 transition-colors select-none"
            >
              br
            </span>
          </h1>
          <p className="text-lg sm:text-2xl text-zinc-400 mt-2 font-medium max-w-2xl leading-relaxed select-none">
            O <span className="text-white font-semibold">Bloomberg Terminal</span> dos lojistas de carro — transforma logs de WhatsApp de grupos de repasse em inteligência de mercado em tempo real.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col lg:flex-row gap-2.5 w-full max-w-6xl">
          {unlocked && (
            <Link 
              href="/importar"
              className="flex-1 py-4 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-300 hover:text-white font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer text-center"
            >
              Importar Logs <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform animate-pulse-soft" />
            </Link>
          )}
          
          <Link 
            href="/oportunidades"
            className="flex-1 py-4 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer text-center"
          >
            Radar 24hrs <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse-soft" />
          </Link>

          <Link 
            href="/facebook"
            className="flex-1 py-4 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer text-center"
          >
            Exclusivas Manos <Lock className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
          </Link>

          <Link 
            href="/alertas"
            className="flex-1 py-4 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer text-center animate-pulse-soft"
          >
            Configurar Alertas <Bell className="w-3.5 h-3.5 text-primary" />
          </Link>

          {unlocked && (
            <Link 
              href="/admin"
              className="flex-1 py-4 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer text-center"
            >
              Painel Admin <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
            </Link>
          )}
          
          <Link 
            href="/avaliacao"
            className="flex-1 py-4 px-3 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer glow-primary glow-primary-hover text-center"
          >
            Calculadora FIPE <Calculator className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Módulos do Sistema */}
        <section className="w-full mt-12 flex flex-col gap-6">
          <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider text-center">Status do Roadmap de Engenharia</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div 
                  key={idx}
                  className="glass-panel rounded-2xl p-6 flex flex-col justify-between gap-4 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900/20"
                >
                  <div className="flex flex-col gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 w-fit">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-none">{m.title}</h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{m.description}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border w-fit ${m.statusColor}`}>
                    {m.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
