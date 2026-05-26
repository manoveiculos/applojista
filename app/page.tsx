'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Car, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Calculator,
  Bell,
  Lock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

// Exemplo de carros para o simulador interativo
const SIMULATOR_CARS = [
  {
    brand: 'CHEVROLET',
    model: 'Onix Hatch LT 1.0 Flex 2020',
    askPrice: 52000,
    fipePrice: 62000,
    km: 42000,
    rating: 'EXCELENTE',
    score: 92,
    reasons: [
      'Preço de repasse 16% abaixo da Tabela FIPE oficial',
      'Baixíssima quilometragem para o ano do modelo (média de 10k km/ano)',
      'Líder nacional de vendas com giro extremamente rápido de estoque'
    ],
    badgeColor: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
    circleColor: '#84cc16'
  },
  {
    brand: 'TOYOTA',
    model: 'Corolla XEi 2.0 Automatico 2018',
    askPrice: 86500,
    fipePrice: 95000,
    km: 98000,
    rating: 'BOM',
    score: 76,
    reasons: [
      'Preço atrativo: margem de 9% abaixo da FIPE',
      'Quilometragem compatível com o ano de uso do sedan',
      'Alta liquidez: Toyota Corolla é sinônimo de revenda estável e sem surpresas'
    ],
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    circleColor: '#10b981'
  },
  {
    brand: 'FORD',
    model: 'Ka Hatch SE 1.5 Powershift 2019',
    askPrice: 43000,
    fipePrice: 48000,
    km: 115000,
    rating: 'EVITAR',
    score: 35,
    reasons: [
      'Desgaste acentuado: quilometragem muito acima da média esperada',
      'Risco de mercado: câmbio Powershift possui alta rejeição e manutenção cara',
      'Margem de repasse anulada devido ao alto custo previsto para pátio'
    ],
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    circleColor: '#ef4444'
  }
];

export default function Home() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isLogged, setIsLogged] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // Simulador de carros
  const [selectedSimIndex, setSelectedSimIndex] = useState(0);

  useEffect(() => {
    const checkUserSession = () => {
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const isUnlocked = localStorage.getItem('vyro_hidden_unlocked') === 'true';
      setUnlocked(isUnlocked);

      const sessionCookie = getCookie('vyro_public_session');
      const logged = !!sessionCookie || isUnlocked;
      setIsLogged(logged);

      if (!logged) {
        router.push('/portal');
      } else {
        setLoadingSession(false);
      }
    };

    checkUserSession();
  }, [router]);

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
            localStorage.setItem('vyro_admin_key', 'manos_intel_secret_key');
            setUnlocked(true);
            setIsLogged(true);
          } else {
            try {
              const res = await fetch(`/api/facebook?admin_key=${encodeURIComponent(cleanPassword)}`);
              if (res.ok) {
                localStorage.setItem('vyro_hidden_unlocked', 'true');
                localStorage.setItem('vyro_admin_key', cleanPassword);
                setUnlocked(true);
                setIsLogged(true);
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
        localStorage.removeItem('vyro_admin_key');
        setUnlocked(false);
        setIsLogged(false);
      }
    } else {
      setClickCount(nextCount);
    }
  };

  const handleRadarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (unlocked) {
      router.push('/oportunidades?admin_key=manos_intel_secret_key');
    } else if (isLogged) {
      router.push('/portal/radar');
    } else {
      router.push('/portal');
    }
  };

  const activeCar = SIMULATOR_CARS[selectedSimIndex];
  
  // Parâmetros para o círculo de progresso da simulação
  const radius = 26;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activeCar.score / 100) * circumference;

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium">Verificando acesso...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center bg-black text-zinc-100 relative overflow-hidden font-sans">
      
      {/* Imagem de Fundo de Veículo Premium */}
      <div className="absolute inset-0 bg-[url('/images/bg_vehicle.png')] bg-cover bg-center opacity-[0.06] mix-blend-screen pointer-events-none" />

      {/* Luzes de fundo / Gradients decorativos */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-red-950/15 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] rounded-full bg-zinc-900/10 blur-[160px] pointer-events-none" />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-16 flex flex-col items-center gap-16 z-10">
        
        {/* Hero Title */}
        <div className="flex flex-col items-center gap-5 text-center max-w-4xl">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-none">
            vyro<span 
              onClick={handleLogoClick}
              className="text-primary glow-primary px-3 py-0.5 bg-primary/10 border border-primary/20 rounded-2xl cursor-pointer hover:bg-primary/20 transition-all select-none"
            >
              br
            </span>
          </h1>
          <p className="text-lg sm:text-2xl text-zinc-400 mt-2 font-medium max-w-2xl leading-relaxed select-none">
            O radar de ofertas de repasse inteligente. Encontramos, avaliamos e filtramos as melhores oportunidades para você.
          </p>
        </div>

        {/* BOTOES DE AÇÃO PRINCIPAIS (Caminhos estruturados e seguros) */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${unlocked ? 'lg:grid-cols-4' : 'lg:grid-cols-2 max-w-2xl'} gap-4 w-full max-w-5xl`}>
          
          <button 
            onClick={handleRadarClick}
            className="py-5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer text-center relative overflow-hidden shadow-lg shadow-black/40"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <TrendingUp className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="block text-white text-sm font-extrabold">Radar 24hrs</span>
              <span className="block text-[10px] text-zinc-500 font-medium mt-0.5">Repasses avaliados em tempo real</span>
            </div>
          </button>

          <Link 
            href="/alertas"
            className="py-5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer text-center relative overflow-hidden shadow-lg shadow-black/40"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none" />
            <Bell className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <span className="block text-white text-sm font-extrabold">Configurar Alertas</span>
              <span className="block text-[10px] text-zinc-500 font-medium mt-0.5">Cadastre o que procura e receba no WhatsApp</span>
            </div>
          </Link>

          {unlocked && (
            <>
              <Link 
                href="/facebook"
                className="py-5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-white font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer text-center relative overflow-hidden shadow-lg shadow-black/40"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
                <Lock className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-white text-sm font-extrabold">Exclusivas Drivvoo</span>
                  <span className="block text-[10px] text-zinc-500 font-medium mt-0.5">Captações diretas de clientes (Equipe)</span>
                </div>
              </Link>

              <Link 
                href="/avaliacao"
                className="py-5 px-4 rounded-2xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer text-center shadow-lg glow-primary glow-primary-hover relative overflow-hidden"
              >
                <Calculator className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-white text-sm font-extrabold">Calculadora FIPE</span>
                  <span className="block text-[10px] text-red-100 font-semibold mt-0.5">Avaliação rápida por km e estado</span>
                </div>
              </Link>
            </>
          )}

        </div>

        {/* SEÇÃO INFORMATIVA PARA O PÚBLICO LEIGO */}
        <section className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-t border-zinc-900 pt-16">
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 w-fit">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">Como o Radar funciona?</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Comprar carro de repasse sempre exigiu ficar horas lendo grupos de WhatsApp e comparando valores. Nosso robô faz isso por você instantaneamente:
            </p>
            <ul className="flex flex-col gap-3 text-xs text-zinc-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Mineração Direta:</strong> Lemos e estruturamos milhares de ofertas recebidas a cada segundo em canais do WhatsApp.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Cálculo de Deságio:</strong> Cruzamos o valor pedido com a tabela FIPE oficial correspondente ao modelo e ano.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Nota de Oportunidade (0-100):</strong> Avaliamos o desconto, quilometragem e liquidez de revenda para dar o **Deal Score** da oferta.</span>
              </li>
            </ul>
          </div>

          {/* SIMULADOR INTERATIVO PRÁTICO (LGPD OK - Sem dados de clientes) */}
          <div className="lg:col-span-7 w-full">
            <div className="glass-panel border border-zinc-850 rounded-3xl p-6 bg-zinc-950/30 shadow-xl flex flex-col gap-5 relative">
              <div className="absolute top-0 left-6 -translate-y-1/2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                Simulador na Prática
              </div>

              {/* Seletores do Simulador */}
              <div className="flex gap-2 p-1 bg-zinc-950 border border-zinc-900 rounded-xl">
                {SIMULATOR_CARS.map((car, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedSimIndex(idx)}
                    className={`flex-1 py-2 px-1 text-center rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                      selectedSimIndex === idx 
                        ? 'bg-zinc-900 border border-zinc-800 text-white shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-350'
                    }`}
                  >
                    Exemplo {idx + 1}
                  </button>
                ))}
              </div>

              {/* Resultado do Simulador */}
              <div className="flex flex-col gap-4 animate-fade-in">
                
                {/* Header do Card */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${activeCar.badgeColor}`}>
                      {activeCar.rating}
                    </span>
                    <h3 className="font-extrabold text-base sm:text-lg text-white mt-1.5 leading-snug">{activeCar.model}</h3>
                    <p className="text-[10px] text-zinc-500 font-semibold mt-1">KM: {activeCar.km.toLocaleString('pt-BR')} km</p>
                  </div>

                  {/* Circular Score */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <svg className="w-14 h-14 transform -rotate-90">
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke="#18181b"
                        strokeWidth={strokeWidth}
                        fill="transparent"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r={radius}
                        stroke={activeCar.circleColor}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-white leading-none">{activeCar.score}</span>
                      <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-wide mt-0.5">Score</span>
                    </div>
                  </div>
                </div>

                {/* Preço FIPE vs Repasse */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 text-xs">
                  <div>
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">Valor Repasse</span>
                    <span className="text-white font-black text-base mt-0.5 block">
                      {activeCar.askPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">Tabela FIPE</span>
                    <span className="text-zinc-400 font-bold text-base mt-0.5 block">
                      {activeCar.fipePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Avaliação Didática do Robô */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Análise de IA (Como calculamos):</span>
                  <div className="flex flex-col gap-2 bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 text-[11px] text-zinc-350 leading-relaxed">
                    {activeCar.reasons.map((reason, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Roadmap de engenharia ocultado/simplificado para manter layout clean */}
        {unlocked && (
          <section className="w-full mt-4 flex flex-col gap-4 border-t border-zinc-900 pt-10">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Configurações de Admin</h2>
            <div className="flex justify-center gap-4">
              <Link 
                href="/importar"
                className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                Importar Logs <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link 
                href="/admin"
                className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                Painel Admin <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              </Link>
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-950 py-8 text-center text-xs text-zinc-650 z-10">
        Todos os direitos reservados a drivvoo &copy; {new Date().getFullYear()}.
      </footer>
    </div>
  );
}
