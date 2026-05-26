'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Calendar, 
  Gauge, 
  DollarSign, 
  Phone, 
  Info,
  ListFilter,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  FileText,
  User,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Calculator,
  Trash2
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

interface FacebookLead {
  mensagem_id: string;
  whatsapp_instancia: string;
  whatsapp_remetente: string;
  contato_nome_whatsapp: string;
  data_envio: string;
  data_envio_formatada: string;
  nome: string;
  telefone: string;
  cidade: string;
  veiculo: string;
  ano: string;
  km: string;
  valor_pedido: string;
  aceita_fipe: string;
  origem: string;
  resumo: string;
  fipe_price: number | null;
  fipe_model: string | null;
  fipe_code: string | null;
  fipe_pct: number | null;
  deal_score: number | null;
  is_estimated: boolean;
}

export default function FacebookPage() {
  const [leads, setLeads] = useState<FacebookLead[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Estados de segurança adicionais para acesso restrito
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Função centralizada para verificar a chave contra o backend e carregar os dados
  const checkAuthAndLoad = async (key: string, isInitial: boolean = false) => {
    if (!key) {
      setIsAuthenticated(false);
      setAuthChecking(false);
      setLoading(false);
      return false;
    }
    
    if (!isInitial) {
      setVerifyingPassword(true);
      setAuthError(null);
    } else {
      setLoading(true);
    }

    try {
      const url = `/api/facebook?admin_key=${encodeURIComponent(key.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.status === 401) {
        if (isInitial) {
          localStorage.removeItem('vyro_admin_key');
        }
        setIsAuthenticated(false);
        if (!isInitial) {
          setAuthError('Chave da equipe Manos incorreta ou não autorizada.');
        }
        return false;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro na requisição das ofertas.');
      }

      // Sucesso! Chave é válida.
      localStorage.setItem('vyro_admin_key', key.trim());
      setIsAdmin(true); // se validou a chave do facebook, pode ver e excluir estes leads
      setLeads(data.leads || []);
      setCities(data.cities || []);
      setIsAuthenticated(true);
      setError(null);
      return true;
    } catch (err: any) {
      console.error('[Facebook Auth Error]', err);
      if (!isInitial) {
        setAuthError(err.message || 'Erro ao conectar ao servidor.');
      } else {
        setError(err.message || 'Falha ao buscar leads do Facebook.');
      }
      return false;
    } finally {
      setAuthChecking(false);
      setVerifyingPassword(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('vyro_admin_key') || '';
    if (savedKey) {
      checkAuthAndLoad(savedKey, true);
    } else {
      setAuthChecking(false);
      setLoading(false);
    }

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

  // Estados dos filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [onlyFipeAccepted, setOnlyFipeAccepted] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'discount' | 'score' | 'price'>('recent');

  // Estado do Drawer/Painel Lateral
  const [selectedLead, setSelectedLead] = useState<FacebookLead | null>(null);

  // Estados para Localização Manual da FIPE
  const [fipeSearchModalOpen, setFipeSearchModalOpen] = useState(false);
  const [leadForFipeSearch, setLeadForFipeSearch] = useState<FacebookLead | null>(null);
  const [fipeSearchQuery, setFipeSearchQuery] = useState('');
  const [fipeSearchResults, setFipeSearchResults] = useState<any[]>([]);
  const [fipeSearching, setFipeSearching] = useState(false);
  const [fipeLinking, setFipeLinking] = useState(false);
  const [fipeSearchError, setFipeSearchError] = useState<string | null>(null);

  // Abre o modal de localização de FIPE com valores iniciais
  const handleOpenFipeSearch = (lead: FacebookLead) => {
    setLeadForFipeSearch(lead);
    
    // Extrai o modelo aproximado (remove a marca no início)
    const parts = lead.veiculo.trim().split(/\s+/);
    const initialQuery = parts.slice(1).join(' ') || lead.veiculo;
    setFipeSearchQuery(initialQuery);
    setFipeSearchResults([]);
    setFipeSearchError(null);
    setFipeSearchModalOpen(true);

    // Dispara busca inicial automática
    const brand = parts[0] || '';
    const year = lead.ano ? lead.ano.replace(/[^\d]/g, '').slice(0, 4) : '';
    if (brand && initialQuery && year) {
      triggerFipeSearch(brand, initialQuery, year);
    }
  };

  const triggerFipeSearch = async (brand: string, query: string, year: string) => {
    setFipeSearching(true);
    setFipeSearchError(null);
    try {
      const res = await fetch(
        `/api/avaliacao?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(query)}&year_model=${year}&km=80000`
      );
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao pesquisar modelos FIPE.');
      }

      if (data.isCorrectionSuggested && data.suggestion) {
        // Se sugeriu correção, busca novamente com a sugestão
        const nextRes = await fetch(
          `/api/avaliacao?brand=${encodeURIComponent(data.suggestion.brand)}&model=${encodeURIComponent(data.suggestion.model)}&year_model=${year}&km=80000`
        );
        const nextData = await nextRes.json();
        if (nextData.hasMultipleMatches) {
          setFipeSearchResults(nextData.options || []);
        } else if (nextData.fipe) {
          setFipeSearchResults([nextData.fipe]);
        } else {
          setFipeSearchResults([]);
        }
      } else if (data.hasMultipleMatches) {
        setFipeSearchResults(data.options || []);
      } else if (data.fipe) {
        setFipeSearchResults([data.fipe]);
      } else {
        setFipeSearchResults([]);
      }
    } catch (err: any) {
      console.warn('Erro ao buscar modelos FIPE no modal:', err);
      setFipeSearchError(err.message || 'Falha ao buscar modelos na FIPE.');
    } finally {
      setFipeSearching(false);
    }
  };

  // Executa o salvamento do vínculo da FIPE no backend
  const handleLinkFipeCode = async (fCode: string) => {
    if (!leadForFipeSearch) return;
    setFipeLinking(true);
    setFipeSearchError(null);
    try {
      const res = await fetch('/api/facebook/vincular-fipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem_id: leadForFipeSearch.mensagem_id,
          fipe_code: fCodeFormat(fCode)
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao vincular código FIPE.');
      }

      // Atualiza o estado da lista local de leads
      setLeads(prev => prev.map(l => l.mensagem_id === leadForFipeSearch.mensagem_id ? data.lead : l));
      
      // Se o lead selecionado no drawer for o mesmo, atualiza ele também
      if (selectedLead && selectedLead.mensagem_id === leadForFipeSearch.mensagem_id) {
        setSelectedLead(data.lead);
      }

      setFipeSearchModalOpen(false);
      setLeadForFipeSearch(null);
    } catch (err: any) {
      console.error('Erro ao vincular FIPE no backend:', err);
      setFipeSearchError(err.message || 'Erro ao registrar vínculo da FIPE no banco.');
    } finally {
      setFipeLinking(false);
    }
  };

  // Garante que o formato do código FIPE tenha o hífen antes do dígito (ex: 004526-8) se vier grudado
  const fCodeFormat = (code: string) => {
    if (!code) return '';
    const clean = code.replace(/[^\d]/g, '');
    if (clean.length === 7) {
      return `${clean.substring(0, 6)}-${clean.substring(6)}`;
    }
    return code;
  };

  // O carregamento inicial e validação da chave são tratados no useEffect do início do arquivo

  // Filtra os leads em tempo real
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      // 1. Busca textual por Veículo ou Nome do Cliente
      const matchesSearch = 
        (lead.veiculo ? lead.veiculo.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
        (lead.nome ? lead.nome.toLowerCase().includes(searchQuery.toLowerCase()) : false);

      // 2. Filtro de Cidade
      // Compara ignorando maiúsculas/minúsculas para evitar problemas de digitação
      const matchesCity = 
        selectedCity === 'ALL' || 
        (lead.cidade && lead.cidade.trim().toLowerCase() === selectedCity.trim().toLowerCase());

      // 3. Filtro de Aceita FIPE
      const matchesFipe = 
        !onlyFipeAccepted || 
        (lead.aceita_fipe && lead.aceita_fipe.trim().toLowerCase() === 'sim');

      return matchesSearch && matchesCity && matchesFipe;
    });

    // Ordenação dinâmica
    if (sortBy === 'discount') {
      result.sort((a, b) => {
        if (a.fipe_pct === null) return 1;
        if (b.fipe_pct === null) return -1;
        return a.fipe_pct - b.fipe_pct; // Menor porcentagem FIPE primeiro (maior desconto)
      });
    } else if (sortBy === 'score') {
      result.sort((a, b) => {
        if (a.deal_score === null) return 1;
        if (b.deal_score === null) return -1;
        return b.deal_score - a.deal_score; // Maior Deal Score primeiro
      });
    } else if (sortBy === 'price') {
      const getPrice = (l: any) => {
        const clean = l.valor_pedido ? l.valor_pedido.replace(/[^\d]/g, '') : '';
        return clean ? parseInt(clean, 10) : Infinity;
      };
      result.sort((a, b) => getPrice(a) - getPrice(b)); // Menor preço pedido primeiro
    }

    return result;
  }, [leads, searchQuery, selectedCity, onlyFipeAccepted, sortBy]);

  // Contadores Estatísticos
  const stats = useMemo(() => {
    const total = filteredLeads.length;
    const fipeSim = filteredLeads.filter(l => l.aceita_fipe && l.aceita_fipe.trim().toLowerCase() === 'sim').length;
    
    // Contagem de leads das últimas 24h
    const umDiaAtras = new Date();
    umDiaAtras.setDate(umDiaAtras.getDate() - 1);
    const leadsRecentes = filteredLeads.filter(l => {
      if (!l.data_envio) return false;
      const dataLead = new Date(l.data_envio);
      return dataLead >= umDiaAtras;
    }).length;

    return { total, fipeSim, leadsRecentes };
  }, [filteredLeads]);

  // Verifica se há filtros ativos
  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedCity !== 'ALL' || 
    onlyFipeAccepted;

  // Função para limpar todos os filtros
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCity('ALL');
    setOnlyFipeAccepted(false);
    setSortBy('recent');
  };

  // Helper para gerar o link do WhatsApp formatado
  const getWhatsAppLink = (lead: FacebookLead) => {
    if (!lead.telefone) return '#';
    const cleanPhone = lead.telefone.replace(/[^\d]/g, '');
    // Se o número tiver 10 ou 11 dígitos, adiciona o DDI 55 (Brasil) por segurança
    const whatsappNumber = (cleanPhone.length === 10 || cleanPhone.length === 11) ? `55${cleanPhone}` : cleanPhone;
    const greetingText = `Olá ${lead.nome || ''}, vi seu anúncio no Facebook do veículo *${lead.veiculo || ''}* e gostaria de conversar sobre a avaliação dele.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(greetingText)}`;
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center font-sans relative">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-950/15 blur-[180px] pointer-events-none" />
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <span className="text-xs text-zinc-500 mt-4 font-bold tracking-widest uppercase">Verificando Credenciais...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-center font-sans relative px-4">
        {/* Luzes decorativas de fundo */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-950/15 blur-[180px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/10 blur-[180px] pointer-events-none" />

        <div className="w-full max-w-md bg-zinc-950/50 backdrop-blur-md border border-zinc-900 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight text-white">Acesso Restrito</h2>
            <p className="text-sm text-zinc-400 mt-2">Esta página contém leads exclusivos da equipe Manos. Insira a chave de acesso para visualizar.</p>
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              await checkAuthAndLoad(passwordInput);
            }}
            className="w-full flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Senha da Equipe</label>
              <input
                type="password"
                placeholder="Digite a chave secreta..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                disabled={verifyingPassword}
                required
              />
            </div>

            {authError && (
              <div className="text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/20 px-4 py-2.5 rounded-xl text-center">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={verifyingPassword || !passwordInput.trim()}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-extrabold text-xs tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-primary/10 border-0 flex items-center justify-center gap-2"
            >
              {verifyingPassword ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : 'Acessar Leads'}
            </button>
          </form>

          <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-zinc-400 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col font-sans">
      
      {/* Luzes decorativas de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-950/15 blur-[180px] pointer-events-none" />
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
            <Link href="/oportunidades" className="text-zinc-400 hover:text-white transition-colors">
              Radar 24hrs
            </Link>
            <span className="text-zinc-800">|</span>
            <Link href="/facebook" className="text-primary hover:text-primary transition-colors">
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
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Exclusivas Manos
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Veículos ofertados por clientes nas campanhas de captação exclusivas Manos.</p>
          </div>
        </div>

        {/* Estatísticas Superiores (KPI Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total de Leads</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-white">{loading ? '...' : stats.total}</span>
              <span className="text-[10px] text-zinc-500 font-semibold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded">
                {!hasActiveFilters ? 'No Banco' : 'Filtrados'}
              </span>
            </div>
          </div>

          <div className="glass-panel border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Aceitam FIPE</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-emerald-400">{loading ? '...' : stats.fipeSim}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">
                {!hasActiveFilters ? 'Total' : 'Filtrados'}
              </span>
            </div>
          </div>

          <div className="glass-panel border border-zinc-900 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Novos nas Últimas 24h</span>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-blue-400">{loading ? '...' : stats.leadsRecentes}</span>
              <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 font-bold px-2 py-0.5 rounded">
                Recentes
              </span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros no Topo */}
        <section className="glass-panel border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            
            {/* Campo de Busca por Modelo/Cliente (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Busca de Veículo ou Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar Voyage, Edicarlos, Compass..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                />
              </div>
            </div>

            {/* Dropdown de Cidades (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cidade</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-zinc-350 text-sm font-semibold focus:outline-none focus:border-zinc-800 transition-colors cursor-pointer"
              >
                <option value="ALL">TODAS AS CIDADES</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Dropdown de Ordenação (3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3.5 text-zinc-350 text-sm font-semibold focus:outline-none focus:border-zinc-800 transition-colors cursor-pointer"
              >
                <option value="recent">MAIS RECENTES</option>
                <option value="discount">MAIOR DESCONTO (FIPE)</option>
                <option value="score">MELHOR DEAL SCORE</option>
                <option value="price">MENOR VALOR PEDIDO</option>
              </select>
            </div>

            {/* Switch / Checkbox Aceita FIPE (2 cols) */}
            <div className="lg:col-span-2 flex items-center justify-start pb-2 sm:pb-3">
              <label className="flex items-center gap-3 cursor-pointer select-none text-zinc-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={onlyFipeAccepted}
                  onChange={(e) => setOnlyFipeAccepted(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-800 text-primary focus:ring-primary focus:ring-offset-black cursor-pointer"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider">Aceita FIPE</span>
              </label>
            </div>

          </div>

          {/* Botão de limpar filtros se algum estiver ativo */}
          {hasActiveFilters && (
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-0"
              >
                Limpar Filtros Selecionados
              </button>
            </div>
          )}
        </section>

        {/* Tabela de Leads */}
        <section className="glass-panel border border-zinc-900 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div>
                <h3 className="font-bold text-white text-lg">Carregando Ofertas</h3>
                <p className="text-sm text-zinc-400 mt-1">Buscando as ofertas exclusivas em tempo real...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-16 flex flex-col items-center justify-center text-center gap-4 bg-red-950/5">
              <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-white text-lg">Erro de Conexão</h3>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-24 flex flex-col items-center justify-center text-center gap-4">
              <Info className="w-8 h-8 text-zinc-650" />
              <div>
                <h3 className="font-bold text-white text-lg">Nenhum Lead Encontrado</h3>
                <p className="text-sm text-zinc-500 mt-1">Não foram localizados registros no banco com os filtros selecionados.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/60 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <th className="px-6 py-4">Veículo</th>
                    <th className="px-6 py-4">Ano</th>
                    <th className="px-6 py-4">KM</th>
                    <th className="px-6 py-4">Valor Pedido</th>
                    <th className="px-6 py-4">Cidade</th>
                    <th className="px-6 py-4">Data Envio</th>
                    <th className="px-6 py-4">FIPE Oficial</th>
                    <th className="px-6 py-4 text-center">Calculadora</th>
                    {isAdmin && <th className="px-6 py-4 text-center">Excluir</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60">
                  {filteredLeads.map((lead) => {
                    const isFipeSim = lead.aceita_fipe && lead.aceita_fipe.trim().toLowerCase() === 'sim';
                    return (
                      <tr 
                        key={lead.mensagem_id}
                        onClick={() => setSelectedLead(lead)}
                        className={`hover:bg-zinc-900/40 transition-all cursor-pointer group relative ${
                          isFipeSim ? 'border-l-2 border-l-emerald-500' : ''
                        }`}
                      >
                        {/* Veículo */}
                        <td className="px-6 py-4">
                          <span className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors block">
                            {lead.veiculo}
                          </span>
                          <span className="text-[10px] text-zinc-550 block mt-0.5">
                            Cliente: {lead.nome || 'Não informado'}
                          </span>
                        </td>
                        {/* Ano */}
                        <td className="px-6 py-4 text-sm text-zinc-300 font-semibold">
                          {lead.ano || 'N/A'}
                        </td>
                        {/* KM */}
                        <td className="px-6 py-4 text-sm text-zinc-350">
                          {lead.km ? `${lead.km} km` : 'N/A'}
                        </td>
                        {/* Valor Pedido */}
                        <td className="px-6 py-4 text-sm text-white font-extrabold">
                          {lead.valor_pedido || 'N/A'}
                        </td>
                        {/* Cidade */}
                        <td className="px-6 py-4 text-sm text-zinc-400 capitalize">
                          {lead.cidade || 'N/A'}
                        </td>
                        {/* Data Envio */}
                        <td className="px-6 py-4 text-xs text-zinc-500">
                          {lead.data_envio_formatada}
                        </td>
                        {/* FIPE Oficial */}
                        <td className="px-6 py-4 text-sm text-zinc-350">
                          {lead.fipe_price ? (
                            <div>
                              <span className="font-bold text-zinc-300">
                                {lead.fipe_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                              </span>
                              {lead.fipe_pct !== null && (
                                <span className={`block text-[10px] font-bold mt-0.5 ${lead.fipe_pct <= 90 ? 'text-lime-400' : lead.fipe_pct <= 100 ? 'text-emerald-400' : 'text-amber-500'}`}>
                                  {lead.fipe_pct - 100 > 0 ? `+${lead.fipe_pct - 100}%` : lead.fipe_pct - 100 < 0 ? `${lead.fipe_pct - 100}%` : 'Fipe'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="text-zinc-650 text-xs italic block animate-pulse-soft">Não cotado</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenFipeSearch(lead);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-extrabold text-primary hover:text-primary/80 transition-colors bg-transparent border-0 cursor-pointer p-0 w-fit"
                              >
                                <Search className="w-3 h-3 text-primary animate-pulse" /> Localizar FIPE
                              </button>
                            </div>
                          )}
                        </td>
                        {/* Ação da Calculadora de Compra */}
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/avaliacao?brand=${encodeURIComponent(lead.veiculo.trim().split(' ')[0])}&model=${encodeURIComponent(lead.veiculo.trim().split(' ').slice(1).join(' '))}&year_model=${lead.ano ? lead.ano.replace(/[^\d]/g, '').slice(0, 4) : '2018'}&km=${lead.km ? lead.km.replace(/[^\d]/g, '') : '80000'}`}
                            onClick={(e) => e.stopPropagation()} // impede a abertura do Drawer quando clica na calculadora
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-extrabold cursor-pointer"
                            title="Calcular compra com todos os dados preenchidos"
                          >
                            <Calculator className="w-3.5 h-3.5 text-primary animate-pulse-soft" />
                            Calcular
                            {lead.deal_score !== null && (
                              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black border ml-1 ${
                                lead.deal_score >= 85 
                                  ? 'bg-lime-500/10 border-lime-500/20 text-lime-400' 
                                  : lead.deal_score >= 70 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                  : lead.deal_score >= 50 
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                              }`}>
                                {lead.deal_score}
                              </span>
                            )}
                          </Link>
                        </td>
                        {/* Ação de Exclusão para Admin */}
                        {isAdmin && (
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation(); // impede abrir drawer
                                if (window.confirm(`Deseja realmente apagar o lead de ${lead.nome || 'cliente'} (${lead.veiculo}) permanentemente do banco de dados?`)) {
                                  try {
                                    const savedKey = localStorage.getItem('vyro_admin_key') || '';
                                    const res = await fetch(`/api/admin/facebook?admin_key=${encodeURIComponent(savedKey)}&mensagem_id=${lead.mensagem_id}`, {
                                      method: 'DELETE'
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.success) {
                                      alert('Lead excluído com sucesso!');
                                      setLeads(prev => prev.filter(l => l.mensagem_id !== lead.mensagem_id));
                                    } else {
                                      alert(data.error || 'Erro ao excluir o lead.');
                                    }
                                  } catch (err: any) {
                                    alert('Falha ao conectar com o servidor.');
                                  }
                                }
                              }}
                              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                              title="Excluir lead do banco de dados"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* MODAL LOCALIZAR FIPE */}
      {fipeSearchModalOpen && leadForFipeSearch && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4"
          onClick={() => setFipeSearchModalOpen(false)}
        >
          <div 
            className="glass-panel border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-zinc-950/90 border-b border-zinc-900 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse-soft" /> Localizar FIPE Oficial
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Busque a versão exata do veículo anunciado para calcular o Deal Score.</p>
              </div>
              <button 
                onClick={() => setFipeSearchModalOpen(false)}
                className="p-2 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              
              {/* Resumo do Carro */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-550 uppercase font-bold tracking-widest">Veículo do Anúncio</span>
                <span className="text-white font-extrabold text-base">{leadForFipeSearch.veiculo}</span>
                <div className="flex gap-4 text-xs text-zinc-400 mt-1">
                  <span>Ano: <strong>{leadForFipeSearch.ano}</strong></span>
                  <span>KM: <strong>{leadForFipeSearch.km}</strong></span>
                  <span>Preço Pedido: <strong>{leadForFipeSearch.valor_pedido}</strong></span>
                </div>
              </div>

              {/* Formulário de Busca FIPE */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Modelo (ex: Tracker 1.0, Uno Way)"
                  value={fipeSearchQuery}
                  onChange={(e) => setFipeSearchQuery(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                />
                <button
                  type="button"
                  disabled={fipeSearching || !fipeSearchQuery.trim()}
                  onClick={() => {
                    const brand = leadForFipeSearch.veiculo.trim().split(/\s+/)[0] || '';
                    const year = leadForFipeSearch.ano ? leadForFipeSearch.ano.replace(/[^\d]/g, '').slice(0, 4) : '';
                    triggerFipeSearch(brand, fipeSearchQuery, year);
                  }}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {fipeSearching ? 'Buscando...' : 'Pesquisar'}
                </button>
              </div>

              {fipeSearchError && (
                <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fipeSearchError}</span>
                </div>
              )}

              {/* Resultados */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Selecione a Versão Correta</span>
                
                {fipeSearching ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-zinc-550">Consultando base FIPE...</span>
                  </div>
                ) : fipeSearchResults.length === 0 ? (
                  <div className="py-8 text-center bg-zinc-900/10 border border-dashed border-zinc-900 rounded-2xl">
                    <span className="text-xs text-zinc-550 italic">Pesquise o modelo acima para carregar as versões da FIPE.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {fipeSearchResults.map((opt) => (
                      <div
                        key={opt.fipe_code || opt.CodigoFipe}
                        className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/40 flex justify-between items-center text-left hover:border-zinc-800 transition-colors"
                      >
                        <div className="max-w-[70%]">
                          <span className="font-bold text-xs text-zinc-200 block leading-tight">{opt.model_official || opt.Modelo}</span>
                          <span className="text-[9px] text-zinc-500 block mt-1">FIPE: {opt.fipe_code || opt.CodigoFipe}</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0 gap-2">
                          <span className="text-xs font-black text-emerald-400">
                            {(opt.fipe_price_official || (opt.Valor ? Number(opt.Valor.replace(/[^\d]/g, '')) / 100 : 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                          </span>
                          <button
                            type="button"
                            disabled={fipeLinking}
                            onClick={() => handleLinkFipeCode(opt.fipe_code || opt.CodigoFipe)}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white font-extrabold text-[10px] transition-colors cursor-pointer border-0"
                          >
                            Vincular
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DRAWER LATERAL (Painel de Detalhes) */}
      {selectedLead && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex justify-end"
          onClick={() => setSelectedLead(null)}
        >
          {/* Drawer Body */}
          <div 
            className="w-full max-w-md bg-zinc-950 border-l border-zinc-900 h-full flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div className="bg-zinc-900/60 border-b border-zinc-900/80 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-extrabold text-white text-base">Detalhes da Oferta</span>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm(`Deseja realmente apagar o lead de ${selectedLead.nome || 'cliente'} (${selectedLead.veiculo}) permanentemente do banco de dados?`)) {
                          try {
                            const savedKey = localStorage.getItem('vyro_admin_key') || '';
                            const res = await fetch(`/api/admin/facebook?admin_key=${encodeURIComponent(savedKey)}&mensagem_id=${selectedLead.mensagem_id}`, {
                              method: 'DELETE'
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              alert('Lead excluído com sucesso!');
                              setLeads(prev => prev.filter(l => l.mensagem_id !== selectedLead.mensagem_id));
                              setSelectedLead(null);
                            } else {
                              alert(data.error || 'Erro ao excluir o lead.');
                            }
                          } catch (err: any) {
                            alert('Falha ao conectar com o servidor.');
                          }
                        }
                      }}
                      className="p-2 bg-red-950/20 hover:bg-red-900 border border-red-900/30 hover:border-red-800 rounded-xl transition-all text-red-500 hover:text-white text-xs font-bold cursor-pointer"
                      title="Excluir este lead permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-170px)]">
                
                {/* Cabeçalho do Lead */}
                <div className="flex flex-col gap-2 pb-4 border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase">
                      {selectedLead.origem || 'Oferta Exclusiva'}
                    </span>
                    {selectedLead.aceita_fipe && selectedLead.aceita_fipe.trim().toLowerCase() === 'sim' && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                        Aceita FIPE
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-white mt-1 leading-tight">{selectedLead.veiculo}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-550" /> Recebido em: {selectedLead.data_envio_formatada}
                  </p>
                </div>

                {/* Grid de Informações Estruturadas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Ano Modelo</span>
                    <span className="text-sm font-bold text-zinc-200">{selectedLead.ano || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Quilometragem</span>
                    <span className="text-sm font-bold text-zinc-200">{selectedLead.km ? `${selectedLead.km} km` : 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Valor do Pedido</span>
                    <span className="text-sm font-extrabold text-white">{selectedLead.valor_pedido || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-semibold text-zinc-550 uppercase">Cidade</span>
                    <span className="text-sm font-bold text-zinc-200 capitalize">{selectedLead.cidade || 'N/A'}</span>
                  </div>
                </div>

                {/* Avaliação FIPE e Score no Drawer */}
                {selectedLead.fipe_price ? (
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Avaliação FIPE Oficial</span>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-white text-base leading-none">
                          {selectedLead.fipe_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </h4>
                        <span className="text-[10px] text-zinc-400 mt-1.5 block max-w-[220px] truncate" title={selectedLead.fipe_model || ''}>
                          {selectedLead.fipe_model}
                        </span>
                      </div>
                      {selectedLead.deal_score !== null && (
                        <div className="text-right flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-zinc-300">Deal Score</span>
                            {selectedLead.fipe_pct !== null && (
                              <span className={`text-[10px] font-semibold ${selectedLead.fipe_pct <= 90 ? 'text-lime-400' : selectedLead.fipe_pct <= 100 ? 'text-emerald-400' : 'text-amber-500'}`}>
                                {selectedLead.fipe_pct - 100 > 0 ? `+${selectedLead.fipe_pct - 100}%` : selectedLead.fipe_pct - 100 < 0 ? `${selectedLead.fipe_pct - 100}%` : 'Fipe'}
                              </span>
                            )}
                          </div>
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-black border ${
                            selectedLead.deal_score >= 85 
                              ? 'bg-lime-500/10 border-lime-500/20 text-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.2)]' 
                              : selectedLead.deal_score >= 70 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                              : selectedLead.deal_score >= 50 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {selectedLead.deal_score}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-550 flex justify-between pt-2 border-t border-zinc-900/60">
                      <span>Código FIPE: <strong>{selectedLead.fipe_code || 'N/A'}</strong></span>
                      {selectedLead.is_estimated && <span className="text-amber-500 font-semibold">Valor Estimado Local</span>}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex flex-col gap-3">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Avaliação FIPE Oficial</span>
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <h4 className="font-extrabold text-zinc-400 text-sm leading-none">
                          Não cotado
                        </h4>
                        <span className="text-[10px] text-zinc-550 mt-1 block">
                          Modelo não identificado automaticamente
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenFipeSearch(selectedLead)}
                        className="py-2 px-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold text-xs transition-all cursor-pointer"
                      >
                        Localizar FIPE
                      </button>
                    </div>
                  </div>
                )}

                {/* Bloco Detalhes do Cliente */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> Informações de Contato
                  </h4>
                  
                  <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col gap-2.5 text-xs text-zinc-400">
                    <div className="flex justify-between">
                      <span>Nome do Cliente</span>
                      <span className="text-zinc-200 font-semibold">{selectedLead.nome || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Telefone Informado</span>
                      <span className="text-zinc-200 font-semibold">{selectedLead.telefone || 'N/A'}</span>
                    </div>
                    {selectedLead.contato_nome_whatsapp && (
                      <div className="flex justify-between">
                        <span>WhatsApp (Contato)</span>
                        <span className="text-zinc-200 font-semibold">{selectedLead.contato_nome_whatsapp}</span>
                      </div>
                    )}
                    {selectedLead.whatsapp_remetente && (
                      <div className="flex justify-between">
                        <span>WhatsApp ID Remetente</span>
                        <span className="text-zinc-300 font-mono text-[10px]">{selectedLead.whatsapp_remetente}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloco de Notas: RESUMO (UX/UI de Destaque) */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Resumo do Lead
                  </h4>
                  
                  {/* UX Bloco de Notas (Post-It Estilo Lojista) */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 relative overflow-hidden flex flex-col gap-2">
                    {/* Indicador suave de nota */}
                    <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-full blur-md" />
                    <p className="text-sm text-amber-200 leading-relaxed italic">
                      "{selectedLead.resumo || 'Sem resumo disponível.'}"
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Drawer Footer: Botões de Ação */}
            <div className="bg-zinc-950 border-t border-zinc-900 px-6 py-5 flex flex-col sm:flex-row gap-3">
              {/* Botão de Simular na Calculadora com parâmetros higienizados */}
              <Link
                href={`/avaliacao?brand=${encodeURIComponent(selectedLead.veiculo.trim().split(' ')[0])}&model=${encodeURIComponent(selectedLead.veiculo.trim().split(' ').slice(1).join(' '))}&year_model=${selectedLead.ano ? selectedLead.ano.replace(/[^\d]/g, '').slice(0, 4) : '2018'}&km=${selectedLead.km ? selectedLead.km.replace(/[^\d]/g, '') : '80000'}`}
                className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                Simular Precificação
              </Link>
              
              <a
                href={getWhatsAppLink(selectedLead)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 px-5 rounded-xl bg-primary hover:bg-primary/95 text-white font-extrabold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10 border-0"
              >
                Falar no WhatsApp
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
