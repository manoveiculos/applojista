'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { safeFetch } from '@/lib/api-client';
import { 
  TrendingUp, 
  Search, 
  DollarSign, 
  Gauge, 
  Calendar, 
  Info,
  Layers,
  Phone,
  MapPin,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Trash2,
  X,
  LogOut,
  User,
  Sparkles,
  ArrowRight,
  Bell
} from 'lucide-react';

interface Opportunity {
  id: string;
  brand: string;
  model: string;
  year_model: number;
  km: number;
  ask_price: number;
  fipe_price: number;
  fipe_price_official: number | null;
  fipe_pct: number;
  deal_score: number;
  rating: 'EXCELENTE' | 'BOM' | 'MEDIO' | 'RUIM' | 'EVITAR';
  reasons: { type: 'fipe' | 'bonus' | 'penalty' | 'info'; text: string }[];
  seller_name: string | null;
  seller_phone: string | null;
  location: string | null;
  posted_at: string;
  recovered_accident: boolean;
  notes: string | null;
  grupo_anuncio: string;
}

export default function RadarPublicoPage() {
  const router = useRouter();

  // Estados de sessão
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);

  // Estados do Radar
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estatísticas gerais
  const [dbStats, setDbStats] = useState({
    total: 0,
    excelentes: 0,
    bons: 0,
    avgDiscount: 0
  });

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [minYear, setMinYear] = useState<string>('');
  const [maxYear, setMaxYear] = useState<string>('');
  const [maxKm, setMaxKm] = useState<string>('ALL');
  const [maxFipePct, setMaxFipePct] = useState<string>('ALL');
  const [activeQuickFilter, setActiveQuickFilter] = useState<'ALL' | 'EXCELENTE' | 'BOM' | 'DESAGIO'>('ALL');

  // Controle do Modal de Interesse
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedOppForInterest, setSelectedOppForInterest] = useState<Opportunity | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submittingInterest, setSubmittingInterest] = useState(false);
  const [interestSuccess, setInterestSuccess] = useState(false);
  const [interestError, setInterestError] = useState<string | null>(null);

  // Controle do Drawer Lateral de Detalhes
  const [selectedOppForDrawer, setSelectedOppForDrawer] = useState<Opportunity | null>(null);

  // Verifica sessão no carregamento
  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const sessionCookie = getCookie('vyro_public_session');

    if (!sessionCookie) {
      router.push('/portal');
    } else {
      try {
        const decoded = decodeURIComponent(sessionCookie);
        const parsed = JSON.parse(decoded);
        setUserName(parsed.nome || 'Visitante');
        setUserPhone(parsed.telefone || '');
        // Pré-preenche os campos do formulário de interesse
        setCustomerName(parsed.nome || '');
        setCustomerPhone(formatPhoneNumber(parsed.telefone || ''));
      } catch (err) {
        console.error('Falha ao decodificar cookie de sessão:', err);
        router.push('/portal');
      } finally {
        setSessionLoading(false);
      }
    }
  }, [router]);

  // Carrega oportunidades
  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const data = await safeFetch('/api/oportunidades?limit=150');

        setOpportunities(data.opportunities || []);
        setDbStats({
          total: data.totalCount || 0,
          excelentes: data.excelentesCount || 0,
          bons: data.bonsCount || 0,
          avgDiscount: data.avgDiscount || 0
        });
      } catch (err: any) {
        console.warn('[Fetch Opportunities Warning]', err);
        setError(err.message || 'Falha ao buscar oportunidades públicas.');
      } finally {
        setLoading(false);
      }
    }

    if (!sessionLoading) {
      fetchOpportunities();
    }
  }, [sessionLoading]);

  // Limpa sessão / Logout
  const handleLogout = () => {
    document.cookie = 'vyro_public_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    router.push('/portal');
  };

  // Limpar filtros
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBrand('ALL');
    setMinYear('');
    setMaxYear('');
    setMaxKm('ALL');
    setMaxFipePct('ALL');
    setActiveQuickFilter('ALL');
  };

  // Abre modal de interesse
  const handleOpenInterestModal = (opp: Opportunity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOppForInterest(opp);
    setInterestModalOpen(true);
    setInterestSuccess(false);
    setInterestError(null);
  };

  // Máscaras de telefone
  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerPhone(formatted);
  };

  // Envio de interesse
  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForInterest) return;

    if (!customerName || !customerCity || !customerPhone) {
      setInterestError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSubmittingInterest(true);
    setInterestError(null);

    try {
      const refFipe = selectedOppForInterest.fipe_price_official || selectedOppForInterest.fipe_price || 0;
      const formattedFipe = refFipe.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
      const formattedAsk = selectedOppForInterest.ask_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

      const data = await safeFetch('/api/oportunidades/interesse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_cliente: customerName,
          telefone_cliente: customerPhone,
          cidade_cliente: customerCity,
          veiculo: `${selectedOppForInterest.brand} ${selectedOppForInterest.model} (${selectedOppForInterest.year_model}) - KM: ${selectedOppForInterest.km.toLocaleString('pt-BR')} - Preço: ${formattedAsk} (FIPE: ${formattedFipe})`,
          grupo_anuncio: selectedOppForInterest.grupo_anuncio || 'Canal Público',
          data_anuncio: selectedOppForInterest.posted_at,
          cidade_anuncio: selectedOppForInterest.location,
          oportunidade_id: selectedOppForInterest.id
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'Erro ao enviar interesse.');
      }

      setInterestSuccess(true);
    } catch (err: any) {
      console.warn('[Interest Form Warning]', err);
      setInterestError(err.message || 'Falha ao registrar interesse. Tente novamente.');
    } finally {
      setSubmittingInterest(false);
    }
  };

  // Geração de lista de marcas únicas
  const uniqueBrands = useMemo(() => {
    const brands = opportunities.map(o => o.brand ? o.brand.toUpperCase() : 'OUTROS');
    const unique = Array.from(new Set(brands)).filter(b => b && b !== 'OUTROS');
    unique.sort();
    
    const topBrands = ['VOLKSWAGEN', 'CHEVROLET', 'FIAT', 'FORD', 'HONDA', 'TOYOTA', 'VW', 'GM'];
    const sortedUnique = [
      ...topBrands.filter(b => unique.includes(b)),
      ...unique.filter(b => !topBrands.includes(b))
    ];

    return ['ALL', ...sortedUnique, 'OUTROS'];
  }, [opportunities]);

  // Filtros aplicados em tempo real
  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter(o => {
      if (activeQuickFilter === 'EXCELENTE' && o.rating !== 'EXCELENTE') return false;
      if (activeQuickFilter === 'BOM' && o.rating !== 'BOM') return false;

      const matchesSearch = 
        o.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.brand ? o.brand.toLowerCase().includes(searchQuery.toLowerCase()) : false);
      
      const matchesBrand = 
        selectedBrand === 'ALL' || 
        (selectedBrand === 'OUTROS' && (!o.brand || o.brand.toUpperCase() === 'OUTROS')) ||
        (o.brand ? o.brand.toUpperCase() === selectedBrand : false);

      const year = o.year_model;
      const matchesMinYear = !minYear || year >= parseInt(minYear, 10);
      const matchesMaxYear = !maxYear || year <= parseInt(maxYear, 10);

      const matchesKm = 
        maxKm === 'ALL' || 
        (maxKm === 'OVER_100000' ? o.km > 100000 : o.km <= parseInt(maxKm, 10));

      const matchesFipePct = 
        maxFipePct === 'ALL' || 
        (o.fipe_pct !== null && o.fipe_pct <= parseInt(maxFipePct, 10));

      return matchesSearch && matchesBrand && matchesMinYear && matchesMaxYear && matchesKm && matchesFipePct;
    });

    if (activeQuickFilter === 'DESAGIO') {
      result.sort((a, b) => (a.fipe_pct ?? 100) - (b.fipe_pct ?? 100));
    } else {
      result.sort((a, b) => {
        const timeA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
        const timeB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
        return timeB - timeA;
      });
    }

    return result;
  }, [opportunities, searchQuery, selectedBrand, minYear, maxYear, maxKm, maxFipePct, activeQuickFilter]);

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedBrand !== 'ALL' || 
    minYear !== '' || 
    maxYear !== '' || 
    maxKm !== 'ALL' || 
    maxFipePct !== 'ALL' ||
    activeQuickFilter !== 'ALL';

  const stats = useMemo(() => {
    if (!hasActiveFilters) {
      return dbStats;
    }

    const total = filteredOpportunities.length;
    const excelentes = filteredOpportunities.filter(o => o.deal_score >= 85).length;
    const bons = filteredOpportunities.filter(o => o.deal_score >= 70 && o.deal_score < 85).length;
    
    const offersWithFipe = filteredOpportunities.filter(o => (o.fipe_price_official || o.fipe_price || 0) > 0);
    
    let avgDiscount = 0;
    if (offersWithFipe.length > 0) {
      const sum = offersWithFipe.reduce((acc, o) => acc + (100 - o.fipe_pct), 0);
      avgDiscount = Math.round(sum / offersWithFipe.length);
    }

    return { total, excelentes, bons, avgDiscount };
  }, [filteredOpportunities, hasActiveFilters, dbStats]);

  const getRatingStyles = (rating: string) => {
    switch (rating) {
      case 'EXCELENTE':
        return {
          bg: 'bg-lime-500/10 border-lime-500/20 text-lime-400',
          border: 'border-lime-500/30',
          glow: 'shadow-[0_0_15px_rgba(132,204,22,0.15)]',
          circleColor: '#84cc16'
        };
      case 'BOM':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          border: 'border-emerald-500/30',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
          circleColor: '#10b981'
        };
      case 'MEDIO':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          border: 'border-zinc-800',
          glow: '',
          circleColor: '#f59e0b'
        };
      case 'RUIM':
        return {
          bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
          border: 'border-orange-500/20',
          glow: '',
          circleColor: '#f97316'
        };
      case 'EVITAR':
        return {
          bg: 'bg-red-500/10 border-red-500/20 text-red-400',
          border: 'border-red-500/30',
          glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
          circleColor: '#ef4444'
        };
      default:
        return {
          bg: 'bg-zinc-800/40 border-zinc-850 text-zinc-400',
          border: 'border-zinc-900',
          glow: '',
          circleColor: '#71717a'
        };
    }
  };

  const formatarData = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const hora = String(date.getHours()).padStart(2, '0');
      const minuto = String(date.getMinutes()).padStart(2, '0');
      return `Em ${dia}/${mes}/${ano} às ${hora}:${minuto}h`;
    } catch {
      return 'N/A';
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium">Autenticando portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col">
      
      {/* Imagem de Fundo de Veículo Premium */}
      <div className="absolute inset-0 bg-[url('/images/bg_vehicle.png')] bg-cover bg-center opacity-[0.04] mix-blend-screen pointer-events-none" />

      {/* Luzes decorativas */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/15 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/10 blur-[180px] pointer-events-none" />

      {/* Header Público Minimalista */}
      <header className="border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 select-none">
              <span className="text-xl font-black tracking-tight text-white">
                vyro<span className="text-primary px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-lg ml-0.5 text-xs font-bold uppercase">portal</span>
              </span>
            </div>
            
            {/* Navegação Pública (Apenas Radar e Alertas de Compra) */}
            <nav className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs font-bold ml-3 sm:ml-4">
              <Link href="/portal/radar" className="text-primary transition-colors">
                Radar
              </Link>
              <span className="text-zinc-800">|</span>
              <Link href="/alertas" className="text-zinc-400 hover:text-white transition-colors">
                Alertas de Compra
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-850 px-3 py-1.5 rounded-xl font-medium">
              <User className="w-3.5 h-3.5 text-primary" />
              Olá, <strong className="text-white">{userName}</strong>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 bg-zinc-900 hover:bg-red-950/20 hover:border-red-950 border border-zinc-800 rounded-xl transition-all flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-red-400 cursor-pointer"
              title="Sair do portal"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-8 z-10">
        
        {/* Título da tela */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              Radar de Repasses 24h
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Oportunidades de repasse avaliadas e prontas para negociação.</p>
          </div>
          
          <Link 
            href="/alertas" 
            className="w-full md:w-auto px-5 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg glow-primary glow-primary-hover shrink-0"
          >
            <Bell className="w-4 h-4" />
            Configurar Alertas de Compra
          </Link>
        </div>

        {/* Banner de Explicação dos Alertas de Compra */}
        <div className="glass-panel border border-primary/20 bg-primary/5 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex-1">
            <h3 className="font-extrabold text-white text-base md:text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              Não encontrou o veículo que procura no Radar?
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5 max-w-3xl leading-relaxed">
              Cadastre um <strong>Alerta de Compra</strong>! Nosso sistema monitora grupos de repasse de WhatsApp 24 horas por dia. 
              Quando identificarmos o veículo desejado anunciado, <strong>nossa Inteligência Artificial entrará em contato com você via WhatsApp notificando-o imediatamente</strong>.
            </p>
          </div>
          <Link 
            href="/alertas" 
            className="w-full md:w-auto px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            Entenda como funciona
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* KPI Cards / Estatísticas Superiores */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            type="button"
            onClick={() => setActiveQuickFilter('ALL')}
            className={`glass-panel border rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer ${
              activeQuickFilter === 'ALL' ? 'border-zinc-500 bg-zinc-900/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/20'
            }`}
          >
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total de Ofertas</span>
            <div className="flex items-end justify-between w-full">
              <span className="text-3xl font-black text-white">{loading ? '...' : stats.total}</span>
              <span className="text-[10px] text-zinc-500 font-semibold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                {!hasActiveFilters ? `Melhores ${opportunities.length}` : 'Filtradas'}
              </span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveQuickFilter(prev => prev === 'EXCELENTE' ? 'ALL' : 'EXCELENTE')}
            className={`glass-panel border rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer group hover:bg-lime-950/10 ${
              activeQuickFilter === 'EXCELENTE' ? 'border-lime-500/50 bg-lime-950/20 shadow-[0_0_15px_rgba(132,204,22,0.15)]' : 'border-zinc-900 hover:border-lime-500/30'
            }`}
          >
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider group-hover:text-lime-500/70 transition-colors">Oportunidades Excelentes</span>
            <div className="flex items-end justify-between w-full">
              <span className="text-3xl font-black text-lime-400 group-hover:text-lime-300 transition-colors">{loading ? '...' : stats.excelentes}</span>
              <span className="text-[10px] text-lime-400 bg-lime-500/10 border border-lime-500/20 font-bold px-2 py-0.5 rounded">
                Portal
              </span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveQuickFilter(prev => prev === 'BOM' ? 'ALL' : 'BOM')}
            className={`glass-panel border rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer group hover:bg-emerald-950/10 ${
              activeQuickFilter === 'BOM' ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-zinc-900 hover:border-emerald-500/30'
            }`}
          >
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider group-hover:text-emerald-500/70 transition-colors">Oportunidades Boas</span>
            <div className="flex items-end justify-between w-full">
              <span className="text-3xl font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">{loading ? '...' : stats.bons}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">
                Portal
              </span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => setActiveQuickFilter(prev => prev === 'DESAGIO' ? 'ALL' : 'DESAGIO')}
            className={`glass-panel border rounded-2xl p-5 flex flex-col justify-between gap-4 text-left transition-all cursor-pointer hover:bg-zinc-900/20 ${
              activeQuickFilter === 'DESAGIO' ? 'border-zinc-500 bg-zinc-900/40 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-zinc-900 hover:border-zinc-600'
            }`}
          >
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Média de Deságio</span>
            <div className="flex items-end justify-between w-full">
              <span className="text-3xl font-black text-white">-{loading ? '...' : stats.avgDiscount}%</span>
              <span className="text-[10px] text-zinc-500 font-semibold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                Média Geral
              </span>
            </div>
          </button>
        </section>

        {/* Filtros e Busca */}
        <section className="glass-panel border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row flex-wrap items-end gap-3">
            
            {/* Campo de Busca */}
            <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Busca Rápida</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Modelo, versão..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-10 text-zinc-200 text-sm focus:outline-none focus:border-zinc-700 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown de Marcas */}
            <div className="w-full sm:w-auto sm:flex-1 min-w-[140px] flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Marca</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-zinc-300 text-sm font-semibold focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">Todas</option>
                {uniqueBrands.filter(b => b !== 'ALL').map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Ano */}
            <div className="w-full sm:w-auto min-w-[140px] flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ano (De/Até)</label>
              <div className="flex gap-2">
                <select
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  className="w-full h-11 bg-zinc-950 border border-zinc-900 rounded-xl px-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer text-center appearance-none"
                >
                  <option value="">Min</option>
                  {Array.from({length: 17}, (_, i) => 2010 + i).map(year => (
                    <option key={`min-${year}`} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={maxYear}
                  onChange={(e) => setMaxYear(e.target.value)}
                  className="w-full h-11 bg-zinc-950 border border-zinc-900 rounded-xl px-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer text-center appearance-none"
                >
                  <option value="">Max</option>
                  {Array.from({length: 17}, (_, i) => 2010 + i).map(year => (
                    <option key={`max-${year}`} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dropdown de KM */}
            <div className="w-full sm:w-auto sm:flex-1 min-w-[140px] flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">KM Máxima</label>
              <select
                value={maxKm}
                onChange={(e) => setMaxKm(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-zinc-300 text-sm font-semibold focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">Qualquer KM</option>
                <option value="30000">Até 30.000 km</option>
                <option value="60000">Até 60.000 km</option>
                <option value="100000">Até 100.000 km</option>
                <option value="OVER_100000">Acima 100k</option>
              </select>
            </div>

            {/* Dropdown de Margem FIPE */}
            <div className="w-full sm:w-auto sm:flex-1 min-w-[180px] flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Desconto Mínimo</label>
              <select
                value={maxFipePct}
                onChange={(e) => setMaxFipePct(e.target.value)}
                className="w-full h-11 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-zinc-300 text-sm font-semibold focus:outline-none focus:border-zinc-700 transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">Qualquer Margem</option>
                <option value="90">Mais de 10% desc.</option>
                <option value="85">Mais de 15% desc.</option>
                <option value="80">Mais de 20% desc.</option>
              </select>
            </div>
            
            {/* Botão Limpar Filtros */}
            <button
              type="button"
              onClick={clearAllFilters}
              className="w-full sm:w-auto shrink-0 h-11 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          </div>
        </section>

        {/* Lista de Oportunidades */}
        {loading ? (
          <div className="glass-panel border border-zinc-850 rounded-2xl p-24 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <div>
              <h3 className="font-bold text-white text-lg">Avaliando Oportunidades</h3>
              <p className="text-sm text-zinc-400 mt-1">Buscando as melhores ofertas do mercado de repasse...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel border border-red-500/20 bg-red-950/5 rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-white text-lg">Erro ao carregar o Radar</h3>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="glass-panel border border-zinc-850 rounded-2xl p-24 flex flex-col items-center justify-center text-center gap-4">
            <Layers className="w-8 h-8 text-zinc-600" />
            <div>
              <h3 className="font-bold text-white text-lg">Nenhuma Oportunidade Encontrada</h3>
              <p className="text-sm text-zinc-500 mt-1">Nenhum veículo corresponde aos filtros no momento.</p>
            </div>
          </div>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOpportunities.map((opp) => {
              const styles = getRatingStyles(opp.rating);
              const formattedFipe = opp.fipe_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
              const formattedAsk = opp.ask_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

              // SVG Circle parameters
              const radius = 28;
              const strokeWidth = 5;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (opp.deal_score / 100) * circumference;

              return (
                <div 
                  key={opp.id} 
                  onClick={() => {
                    setSelectedOppForDrawer(opp);
                    setSelectedOppForInterest(opp);
                    setInterestSuccess(false);
                    setInterestError(null);
                  }}
                  className={`glass-panel border rounded-2xl p-5 md:p-6 flex flex-col justify-between gap-5 relative overflow-hidden transition-all hover:bg-zinc-900/15 hover:border-zinc-700 cursor-pointer ${styles.border} ${styles.glow}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-950/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Topo do card */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase text-zinc-450 bg-zinc-900 border-zinc-800">
                          Repasse Público
                        </span>
                        {opp.recovered_accident && (
                          <span className="text-[8px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded uppercase">
                            Sinistrado / Leilão
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-lg text-white leading-tight mt-1">{opp.model}</h3>
                      <p className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-0.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-zinc-550" /> {opp.year_model}</span>
                        <span className="text-zinc-800">•</span>
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-zinc-550" /> {opp.km.toLocaleString('pt-BR')} km</span>
                        <span className="text-zinc-800">•</span>
                        <span className="flex items-center gap-1 text-zinc-450">
                          <Clock className="w-3.5 h-3.5 text-zinc-550 animate-pulse-soft" /> {formatarData(opp.posted_at)}
                        </span>
                      </p>
                    </div>

                    {/* Circular Deal Score */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r={radius}
                          stroke="#18181b"
                          strokeWidth={strokeWidth}
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r={radius}
                          stroke={styles.circleColor}
                          strokeWidth={strokeWidth}
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-sm font-black text-white leading-none">{opp.deal_score}</span>
                        <span className="text-[8px] font-bold text-zinc-550 tracking-wide uppercase mt-0.5">Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Informações de Preços */}
                  <div className="flex justify-between items-end bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Repasse:</span>
                      <span className="text-white font-black text-xl block mt-0.5">{formattedAsk}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">FIPE:</span>
                      <span className="text-zinc-300 font-bold block mt-0.5">{formattedFipe}</span>
                    </div>
                  </div>

                  {/* Deságio / Botão de Acesso Rápido */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-500 text-xs font-medium">Margem abaixo FIPE:</span>
                      <span className="text-emerald-400 font-extrabold text-sm bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
                        -{100 - opp.fipe_pct}%
                      </span>
                    </div>
                    
                    <button 
                      onClick={(e) => handleOpenInterestModal(opp, e)}
                      className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      Tenho Interesse
                    </button>
                  </div>

                </div>
              );
            })}
          </section>
        )}

      </main>

      {/* DRAWER LATERAL DE DETALHES */}
      {selectedOppForDrawer && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedOppForDrawer(null)}
        >
          <div 
            className="w-full max-w-lg bg-zinc-950 border-l border-zinc-850 h-full flex flex-col justify-between shadow-2xl relative animate-slide-left p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button 
              onClick={() => setSelectedOppForDrawer(null)}
              className="absolute top-6 right-6 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6 mt-10">
              
              {/* Topo do Veículo */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border uppercase border-zinc-800 bg-zinc-900/50 text-zinc-400 w-fit">
                  {selectedOppForDrawer.brand}
                </span>
                <h2 className="text-2xl font-black text-white mt-1 leading-snug">{selectedOppForDrawer.model}</h2>
                <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-zinc-550" /> Ano: {selectedOppForDrawer.year_model}</span>
                  <span className="text-zinc-800">•</span>
                  <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-zinc-550" /> {selectedOppForDrawer.km.toLocaleString('pt-BR')} km</span>
                </div>
              </div>

              <div className="h-px bg-zinc-900" />

              {/* Informações FIPE e Preço */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Preço Pedido</span>
                  <span className="text-xl font-black text-white block mt-1.5">
                    {selectedOppForDrawer.ask_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="p-4 bg-zinc-900/30 border border-zinc-900 rounded-2xl">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Tabela FIPE</span>
                  <span className="text-xl font-black text-zinc-350 block mt-1.5">
                    {selectedOppForDrawer.fipe_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Inteligência de Mercado / Deal Score */}
              <div className="p-5 bg-zinc-900/10 border border-zinc-900 rounded-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white uppercase tracking-wider">Pontuação de Mercado (Deal Score)</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded border uppercase ${getRatingStyles(selectedOppForDrawer.rating).bg}`}>
                    {selectedOppForDrawer.rating}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-black text-white leading-none">{selectedOppForDrawer.deal_score}</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase mt-1">Score</span>
                  </div>
                  <div className="text-xs text-zinc-400 leading-normal">
                    Este veículo foi pontuado em <strong className="text-white">{selectedOppForDrawer.deal_score}/100</strong>. Margem real de deságio de <strong className="text-emerald-400">-{100 - selectedOppForDrawer.fipe_pct}%</strong> em relação à FIPE oficial.
                  </div>
                </div>

                {/* Justificativas do Score */}
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Razões da classificação</span>
                  <div className="flex flex-col gap-2">
                    {selectedOppForDrawer.reasons.map((r, i) => (
                      <div key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                          r.type === 'penalty' ? 'bg-red-500' : r.type === 'bonus' || r.type === 'fipe' ? 'bg-emerald-500' : 'bg-zinc-500'
                        }`} />
                        <span>{r.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações Originais e Notas */}
              {selectedOppForDrawer.notes && (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Detalhes do Veículo</span>
                  <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-xs text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedOppForDrawer.notes}
                  </div>
                </div>
              )}

              {/* Info de Contato Pública */}
              <div className="p-4 bg-zinc-900/10 border border-zinc-900 rounded-2xl text-xs text-zinc-400 flex gap-2.5">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-200 block mb-1">Precisa de Contato do Vendedor?</strong>
                  Para comprar ou negociar este repasse com segurança, utilize o botão "Tenho Interesse" abaixo. Nossa equipe irá receber sua intenção e mediar o negócio.
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-900 flex gap-3 mt-4">
              <button 
                onClick={() => handleOpenInterestModal(selectedOppForDrawer)}
                className="flex-1 py-4 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer glow-primary glow-primary-hover"
              >
                Registrar Interesse
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE INTERESSE DE COMPRA */}
      {interestModalOpen && selectedOppForInterest && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setInterestModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-zinc-950 border border-zinc-850 rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button 
              onClick={() => setInterestModalOpen(false)}
              className="absolute top-6 right-6 p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {interestSuccess ? (
              <div className="flex flex-col items-center justify-center text-center gap-4 py-8 animate-fade-in">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-xl">Interesse Registrado!</h3>
                  <p className="text-sm text-zinc-400 mt-2 max-w-xs leading-relaxed">
                    Nossa central recebeu sua solicitação para o **{selectedOppForInterest.model}**. Entraremos em contato em instantes no seu WhatsApp.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setInterestModalOpen(false);
                    setInterestSuccess(false);
                  }}
                  className="mt-4 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar Janela
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInterest} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <h3 className="font-extrabold text-white text-lg">Comprar Repasse</h3>
                  <p className="text-xs text-zinc-400">Inscreva-se abaixo para que um de nossos corretores envie o contato oficial:</p>
                  
                  {/* Info Box Carro */}
                  <div className="mt-3 p-3.5 bg-zinc-900/60 border border-zinc-850 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block leading-snug">{selectedOppForInterest.model}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block">KM: {selectedOppForInterest.km.toLocaleString('pt-BR')} • Ano: {selectedOppForInterest.year_model}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">Valor de Repasse</span>
                      <span className="text-primary font-black text-sm block mt-0.5">
                        {selectedOppForInterest.ask_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>

                {interestError && (
                  <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{interestError}</span>
                  </div>
                )}

                {/* Input Nome */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Seu Nome completo *</label>
                  <input
                    type="text"
                    required
                    disabled={submittingInterest}
                    placeholder="Ex: João Silveira"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Input Telefone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp com DDD *</label>
                  <input
                    type="text"
                    required
                    disabled={submittingInterest}
                    placeholder="Ex: (47) 99999-9999"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Input Cidade */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sua Cidade / UF *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      disabled={submittingInterest}
                      placeholder="Ex: Rio do Sul / SC"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    disabled={submittingInterest}
                    onClick={() => setInterestModalOpen(false)}
                    className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold transition-all cursor-pointer text-center disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInterest}
                    className="flex-2 py-3.5 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer glow-primary glow-primary-hover disabled:opacity-50"
                  >
                    {submittingInterest ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        Quero Comprar
                        <Phone className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
