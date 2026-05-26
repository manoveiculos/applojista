'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  ArrowLeft, 
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
  X
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

export default function OportunidadesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const savedKey = localStorage.getItem('vyro_admin_key');
    const isUnlocked = localStorage.getItem('vyro_hidden_unlocked') === 'true';
    const isTeam = savedKey === 'manos_intel_secret_key' || isUnlocked;

    if (isTeam) {
      setIsAdmin(true);
      setUnlocked(isUnlocked);
      setLoadingSession(false);
    } else {
      const sessionCookie = getCookie('vyro_public_session');
      if (sessionCookie) {
        router.push('/portal/radar');
      } else {
        router.push('/portal');
      }
    }
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

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedBrand('ALL');
    setMinYear('');
    setMaxYear('');
    setMaxKm('ALL');
    setMaxFipePct('ALL');
    setActiveQuickFilter('ALL');
  };

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

  // Função para abrir o modal de interesse
  const handleOpenInterestModal = (opp: Opportunity, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // impede abertura do Drawer
    setSelectedOppForInterest(opp);
    setInterestModalOpen(true);
    setInterestSuccess(false);
    setInterestError(null);
  };

  // Máscara de telefone
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

      const res = await fetch('/api/oportunidades/interesse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_cliente: customerName,
          telefone_cliente: customerPhone,
          cidade_cliente: customerCity,
          veiculo: `${selectedOppForInterest.brand} ${selectedOppForInterest.model} (${selectedOppForInterest.year_model}) - KM: ${selectedOppForInterest.km.toLocaleString('pt-BR')} - Preço: ${formattedAsk} (FIPE: ${formattedFipe})`,
          grupo_anuncio: selectedOppForInterest.grupo_anuncio || 'Grupo de Repasse',
          data_anuncio: selectedOppForInterest.posted_at,
          cidade_anuncio: selectedOppForInterest.location,
          oportunidade_id: selectedOppForInterest.id
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao enviar interesse.');
      }

      setInterestSuccess(true);
      setCustomerName('');
      setCustomerCity('');
      setCustomerPhone('');
    } catch (err: any) {
      console.warn('[Interest Form Warning]', err);
      setInterestError(err.message || 'Falha ao registrar interesse. Tente novamente.');
    } finally {
      setSubmittingInterest(false);
    }
  };

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const params = new URLSearchParams(window.location.search);
        const adminKey = params.get('admin_key') || localStorage.getItem('vyro_admin_key') || '';
        let url = '/api/oportunidades?limit=150';
        if (adminKey) {
          url += `&admin_key=${encodeURIComponent(adminKey)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erro ao carregar oportunidades de repasse.');
        }

        setOpportunities(data.opportunities || []);
        setDbStats({
          total: data.totalCount || 0,
          excelentes: data.excelentesCount || 0,
          bons: data.bonsCount || 0,
          avgDiscount: data.avgDiscount || 0
        });
      } catch (err: any) {
        console.warn('[Fetch Opportunities Warning]', err);
        setError(err.message || 'Falha ao buscar oportunidades.');
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  const uniqueBrands = useMemo(() => {
    const brands = opportunities.map(o => o.brand ? o.brand.toUpperCase() : 'OUTROS');
    const unique = Array.from(new Set(brands)).filter(b => b && b !== 'OUTROS');
    unique.sort();
    
    // Marcas frequentes no topo
    const topBrands = ['VOLKSWAGEN', 'CHEVROLET', 'FIAT', 'FORD', 'HONDA', 'TOYOTA', 'VW', 'GM'];
    const sortedUnique = [
      ...topBrands.filter(b => unique.includes(b)),
      ...unique.filter(b => !topBrands.includes(b))
    ];

    return ['ALL', ...sortedUnique, 'OUTROS'];
  }, [opportunities]);

  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter(o => {
      // Filtros rápidos
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
      result.sort((a, b) => {
        const aPct = a.fipe_pct ?? 100;
        const bPct = b.fipe_pct ?? 100;
        return aPct - bPct; // Menor percentual (maior deságio) primeiro
      });
    } else {
      // Ordenação padrão: mais recente primeiro (data_hora_recebimento desc)
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
    
    const offersWithFipe = filteredOpportunities.filter(o => {
      const fipe = o.fipe_price_official || o.fipe_price || 0;
      return fipe > 0;
    });
    
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

  const getGroupBadgeStyles = (group: string) => {
    switch (group) {
      case 'Ally Repasses':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'Alto Vale VIP':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Carvalho e Júnior':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-zinc-450 bg-zinc-900 border-zinc-800';
    }
  };

  // Formata data e hora no padrão brasileiro
  const formatarData = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const dia = String(date.getDate()).padStart(2, '0');
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const ano = date.getFullYear();
      const hora = String(date.getHours()).padStart(2, '0');
      const minuto = String(date.getMinutes()).padStart(2, '0');
      return `Publicado em ${dia}/${mes}/${ano} às ${hora}:${minuto}hrs`;
    } catch {
      return 'N/A';
    }
  };

  // Formatação de data / tempo amigável (Time Ago)
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Agora mesmo';
      if (diffMins < 60) return `Há ${diffMins} min`;
      if (diffHours < 24) return `Há ${diffHours} h`;
      if (diffDays === 1) return 'Ontem';
      return `Há ${diffDays} dias`;
    } catch {
      return 'N/A';
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-black text-zinc-400 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-sm font-medium">Verificando acesso...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col">
      {/* Luzes decorativas */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/15 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/10 blur-[180px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-all">
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <span className="text-xl font-black tracking-tight text-white">
              vyro<span 
                onClick={handleLogoClick}
                className="text-primary cursor-pointer hover:text-primary/80 transition-colors select-none"
              >
                br
              </span>
            </span>
          </div>
          <nav className="flex items-center gap-3 md:gap-5 text-[11px] md:text-xs font-bold">
            <Link href="/oportunidades" className="text-primary hover:text-primary transition-colors">
              Radar 24hrs
            </Link>
            <span className="text-zinc-800">|</span>
            <Link href="/facebook" className="text-zinc-400 hover:text-white transition-colors">
              Exclusivas Manos
            </Link>

            <span className="text-zinc-800">|</span>
            <Link href="/alertas" className="text-zinc-400 hover:text-white transition-colors">
              Configurar Alertas
            </Link>
            <span className="text-zinc-800">|</span>
            <Link href="/avaliacao" className="text-zinc-400 hover:text-white transition-colors">
              Calculadora
            </Link>
            {unlocked && (
              <>
                <span className="text-zinc-800">|</span>
                <Link href="/admin" className="text-zinc-400 hover:text-red-400 transition-colors">
                  Admin
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full flex flex-col gap-8 z-10">
        
        {/* Título da tela */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Oportunidades de Repasse</h1>
            <p className="text-sm text-zinc-400 mt-1">Lista de veículos pontuados e ordenados pelas ofertas mais recentes.</p>
          </div>
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
                {!hasActiveFilters ? 'No Banco' : 'Filtradas'}
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
                {!hasActiveFilters ? 'No Banco' : 'Filtradas'}
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
                {!hasActiveFilters ? 'Média Geral' : 'Filtrado'}
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
              title="Limpar todos os filtros"
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
              <p className="text-sm text-zinc-400 mt-1">Carregando ofertas mineradas e processando os Deal Scores...</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-panel border border-red-500/20 bg-red-950/5 rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-white text-lg">Erro ao carregar oportunidades</h3>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="glass-panel border border-zinc-850 rounded-2xl p-24 flex flex-col items-center justify-center text-center gap-4">
            <Layers className="w-8 h-8 text-zinc-600" />
            <div>
              <h3 className="font-bold text-white text-lg">Nenhuma Oportunidade Encontrada</h3>
              <p className="text-sm text-zinc-500 mt-1">Nenhum veículo corresponde aos filtros selecionados no momento.</p>
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
                  {/* Glow decorativo suave */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-950/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Topo do card: Identificação e Deal Score */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getGroupBadgeStyles(opp.grupo_anuncio)}`}>
                          {opp.grupo_anuncio}
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

                  {/* Informações de Preços Simplificadas */}
                  <div className="flex justify-between items-end bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Repasse:</span>
                      <span className="text-white font-black text-xl block mt-0.5">{formattedAsk}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block uppercase font-bold tracking-wider">Referência FIPE</span>
                      <span className="text-zinc-400 font-semibold block mt-0.5">
                        {formattedFipe} {opp.fipe_pct !== null && (
                          <span className={`font-bold ml-1.5 ${opp.fipe_pct <= 90 ? 'text-lime-400' : opp.fipe_pct <= 100 ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {opp.fipe_pct - 100 > 0 ? `+${opp.fipe_pct - 100}%` : opp.fipe_pct - 100 < 0 ? `${opp.fipe_pct - 100}%` : 'Fipe'}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Badges de Justificativa / Motivos */}
                  <div className="flex flex-wrap gap-1.5">
                    {opp.reasons.map((r, i) => {
                      const isHighRisk = r.type === 'penalty' && (
                        r.text.toLowerCase().includes('sinistro') ||
                        r.text.toLowerCase().includes('leilão') ||
                        r.text.toLowerCase().includes('rejeição') ||
                        r.text.toLowerCase().includes('complexo') ||
                        r.text.toLowerCase().includes('mico') ||
                        r.text.toLowerCase().includes('desgaste')
                      );

                      return (
                        <span 
                          key={i} 
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border leading-none flex items-center gap-1 ${
                            r.type === 'fipe' 
                              ? 'bg-lime-500/10 border-lime-500/20 text-lime-400' 
                              : r.type === 'bonus' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : r.type === 'penalty'
                              ? isHighRisk
                                ? 'bg-red-500/10 border-red-500/20 text-red-400 font-bold'
                                : 'bg-amber-500/5 border-amber-500/15 text-amber-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {(r.type === 'penalty' || isHighRisk) && <AlertTriangle className="w-3 h-3 text-current" />}
                          {r.type === 'bonus' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {r.text}
                        </span>
                      );
                    })}
                  </div>

                  {/* Rodapé do card: Localização e Ações */}
                  <div className="border-t border-zinc-900/60 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-zinc-400 flex flex-col gap-1">
                      {opp.location && (
                        <span className="flex items-center gap-1.5 text-zinc-500 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-zinc-550" /> {opp.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation(); // impede a abertura do Drawer
                            if (window.confirm(`Deseja realmente excluir permanentemente a oportunidade "${opp.model}" (${opp.brand}) do banco de dados?`)) {
                              try {
                                const savedKey = localStorage.getItem('vyro_admin_key') || '';
                                const res = await fetch(`/api/admin/repasse?admin_key=${encodeURIComponent(savedKey)}&id=${opp.id}`, {
                                  method: 'DELETE'
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  alert('Oportunidade excluída com sucesso!');
                                  setOpportunities(prev => prev.filter(o => o.id !== opp.id));
                                } else {
                                  alert(data.error || 'Erro ao excluir oportunidade.');
                                }
                              } catch (err: any) {
                                alert('Falha ao conectar com o servidor.');
                              }
                            }
                          }}
                          className="p-2.5 rounded-xl border border-red-950/40 bg-red-950/10 hover:bg-red-900 hover:border-red-900 text-red-500 hover:text-white transition-all cursor-pointer mr-1"
                          title="Excluir esta oportunidade do banco de dados"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => handleOpenInterestModal(opp, e)}
                        className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm shadow-primary/10 group border-0"
                      >
                        Interesse em Compra <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </section>
        )}

      </main>

      {/* Modal de Interesse */}
      {interestModalOpen && selectedOppForInterest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 transition-all duration-350">
          <div 
            className="glass-panel border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-[0_0_50px_rgba(220,38,38,0.12)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-zinc-950/90 border-b border-zinc-900 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Registrar Interesse
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Insira os dados do interessado para intermediarmos a negociação.</p>
              </div>
              <button 
                onClick={() => setInterestModalOpen(false)}
                className="p-2 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded w-fit">
                  {selectedOppForInterest.brand || 'VEÍCULO'}
                </span>
                <h4 className="font-bold text-white text-base leading-tight mt-1">{selectedOppForInterest.model}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
                  <span>Ano: <strong>{selectedOppForInterest.year_model}</strong></span>
                  <span>KM: <strong>{selectedOppForInterest.km.toLocaleString('pt-BR')}</strong></span>
                  <span>Preço Repasse: <strong className="text-primary">{selectedOppForInterest.ask_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</strong></span>
                </div>
              </div>

              {interestSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-6 gap-4 animate-fade-in">
                  <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-xl">Interesse Registrado!</h4>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-sm">
                      Vamos verificar se o veículo encontra-se disponível e enviaremos o material completo pelo WhatsApp, se o veículo ainda estiver disponível.
                    </p>
                  </div>
                  <button
                    onClick={() => setInterestModalOpen(false)}
                    className="mt-4 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-sm font-bold cursor-pointer transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitInterest} className="flex flex-col gap-4">
                  {interestError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{interestError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nome do Interessado *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp / Telefone *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: (47) 99999-9999"
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cidade *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Joinville"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingInterest}
                    className="w-full mt-4 py-3.5 px-6 rounded-xl bg-primary hover:bg-primary/95 disabled:bg-zinc-900 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer shadow-md shadow-primary/10 border-0"
                  >
                    {submittingInterest ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Registrando interesse...
                      </>
                    ) : (
                      <>
                        Confirmar Interesse <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER LATERAL DE DETALHES DA OPORTUNIDADE */}
      {selectedOppForDrawer && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex justify-end"
          onClick={() => setSelectedOppForDrawer(null)}
        >
          <div 
            className="w-full max-w-md bg-zinc-950 border-l border-zinc-900 h-full flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div className="bg-zinc-900/60 border-b border-zinc-900/80 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-extrabold text-white text-base">Detalhes do Repasse</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Deseja realmente excluir permanentemente a oportunidade "${selectedOppForDrawer.model}" (${selectedOppForDrawer.brand}) do banco de dados?`)) {
                          try {
                            const savedKey = localStorage.getItem('vyro_admin_key') || '';
                            const res = await fetch(`/api/admin/repasse?admin_key=${encodeURIComponent(savedKey)}&id=${selectedOppForDrawer.id}`, {
                              method: 'DELETE'
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              alert('Oportunidade excluída com sucesso!');
                              setOpportunities(prev => prev.filter(o => o.id !== selectedOppForDrawer.id));
                              setSelectedOppForDrawer(null);
                            } else {
                              alert(data.error || 'Erro ao excluir oportunidade.');
                            }
                          } catch (err: any) {
                            alert('Falha ao conectar com o servidor.');
                          }
                        }
                      }}
                      className="p-2 bg-red-950/20 hover:bg-red-900 border border-red-900/30 hover:border-red-800 rounded-xl transition-all text-red-500 hover:text-white text-xs font-bold cursor-pointer"
                      title="Excluir esta oportunidade permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOppForDrawer(null)}
                    className="p-2 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-170px)]">
                
                {/* Cabeçalho do Veículo */}
                <div className="flex flex-col gap-2 pb-4 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getGroupBadgeStyles(selectedOppForDrawer.grupo_anuncio)}`}>
                      {selectedOppForDrawer.grupo_anuncio}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1 leading-tight">{selectedOppForDrawer.brand} {selectedOppForDrawer.model}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-550" /> Recebido em: {new Date(selectedOppForDrawer.posted_at).toLocaleString('pt-BR')}
                  </p>
                </div>

                {/* Grid de Informações Estruturadas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Ano Modelo</span>
                    <span className="text-sm font-bold text-zinc-200">{selectedOppForDrawer.year_model || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Quilometragem</span>
                    <span className="text-sm font-bold text-zinc-200">
                      {selectedOppForDrawer.km ? `${selectedOppForDrawer.km.toLocaleString('pt-BR')} km` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Preço Anúncio</span>
                    <span className="text-sm font-extrabold text-white">
                      {selectedOppForDrawer.ask_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Referência FIPE</span>
                    <span className="text-sm font-bold text-zinc-200">
                      {selectedOppForDrawer.fipe_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Bloco de Mensagem Original / Detalhes */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Detalhes:
                  </h4>
                  <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 overflow-y-auto max-h-[200px]">
                    <pre className="text-xs text-zinc-300 font-sans whitespace-pre-wrap leading-relaxed">
                      {selectedOppForDrawer.notes || 'Sem detalhes adicionais.'}
                    </pre>
                  </div>
                </div>

                {/* Formulario Integrado (Substitui Info Vendedor e Footer antigo) */}
              </div>
            </div>

            {/* Drawer Footer com Formulário de Interesse Integrado */}
            <div className="bg-zinc-950 border-t border-zinc-900 p-6 flex flex-col gap-4">
              
              {interestSuccess ? (
                <div className="flex flex-col items-center justify-center text-center py-3 gap-2.5 animate-fade-in">
                  <div className="p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Interesse Registrado!</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-[280px]">
                      Vamos verificar se o veículo encontra-se disponível e enviaremos o material completo pelo WhatsApp.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitInterest} className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary animate-pulse-soft" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Tenho Interesse neste Veículo</span>
                  </div>

                  {interestError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{interestError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {/* Nome */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-zinc-550 uppercase">Seu Nome *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: João Silva"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                      />
                    </div>

                    {/* Telefone */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-zinc-550 uppercase">WhatsApp *</label>
                      <input
                        type="text"
                        required
                        placeholder="(47) 99999-9999"
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Cidade */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-zinc-550 uppercase">Cidade *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Joinville"
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingInterest}
                    className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/95 disabled:bg-zinc-900 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer border-0 shadow-md shadow-primary/10"
                  >
                    {submittingInterest ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      <>
                        Tenho Interesse neste Veículo <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
