'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Database, 
  Trash2, 
  Lock, 
  ShieldAlert, 
  Search, 
  ArrowLeft, 
  AlertOctagon, 
  Loader2, 
  RefreshCw, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  Calendar,
  Sparkles,
  Info,
  Bell
} from 'lucide-react';

interface DBStat {
  key: string;
  name: string;
  count: number;
  active: boolean;
  error?: string;
}

interface RepasseItem {
  id: string;
  marca: string;
  modelo: string;
  ano_modelo: string;
  km: number;
  preco_pedido: number | string;
  preco_fipe: number | string;
  nome_anunciante: string | null;
  numero_anunciante: string | null;
  data_hora_recebimento: string;
  nome_grupo: string | null;
}

export default function AdminPage() {
  // Autenticação
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  // Estados dos Dados
  const [stats, setStats] = useState<DBStat[]>([]);
  const [repasses, setRepasses] = useState<RepasseItem[]>([]);
  const [totalRepasses, setTotalRepasses] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Filtros/Paginação dos Repasses
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [repassesLoading, setRepassesLoading] = useState(false);

  // Estados para alertas de compras no admin
  const [alertas, setAlertas] = useState<any[]>([]);
  const [alertasLoading, setAlertasLoading] = useState(false);
  const [alertasPage, setAlertasPage] = useState(1);
  const [alertasLimit] = useState(10);
  const [alertasTotal, setAlertasTotal] = useState(0);
  const [alertasSearchQuery, setAlertasSearchQuery] = useState('');
  const [alertasStatusFilter, setAlertasStatusFilter] = useState('ALL');
  const [deleteAlertaModal, setDeleteAlertaModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });

  // Modais de Ação e Confirmação
  const [deleteSingleModal, setDeleteSingleModal] = useState<{ open: boolean; item: RepasseItem | null }>({ open: false, item: null });
  const [deleteMassModal, setDeleteMassModal] = useState<{ open: boolean; tableKey: string; tableName: string }>({ open: false, tableKey: '', tableName: '' });
  const [confirmWord, setConfirmWord] = useState('');
  
  // Status de execução de ações
  const [actionExecuting, setActionExecuting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Tenta autenticar automaticamente se houver chave no localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('vyro_admin_key');
    if (savedKey) {
      verifyKey(savedKey);
    } else {
      setAuthChecking(false);
    }
  }, []);

  // Busca dados de repasse quando autenticado, e ao mudar página/busca
  useEffect(() => {
    if (isAuthenticated) {
      fetchRepasses();
    }
  }, [isAuthenticated, page, searchQuery]);

  // Recarrega alertas quando mudar página/busca/filtro
  useEffect(() => {
    if (isAuthenticated) {
      fetchAlertas();
    }
  }, [isAuthenticated, alertasPage, alertasSearchQuery, alertasStatusFilter]);

  // Função para validar a chave de acesso via chamada de teste na API
  const verifyKey = async (keyToVerify: string) => {
    setAuthChecking(true);
    setAuthError('');
    try {
      const res = await fetch(`/api/admin/database?admin_key=${encodeURIComponent(keyToVerify)}`);
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('vyro_admin_key', keyToVerify);
        setIsAuthenticated(true);
        setStats(data.stats);
      } else {
        setAuthError(data.error || 'Chave de acesso incorreta.');
        localStorage.removeItem('vyro_admin_key');
        setIsAuthenticated(false);
      }
    } catch (err: any) {
      setAuthError('Erro ao validar chave com o servidor.');
      setIsAuthenticated(false);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAuthError('Insira a chave de administrador.');
      return;
    }
    verifyKey(adminKey.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('vyro_admin_key');
    setIsAuthenticated(false);
    setAdminKey('');
    setStats([]);
    setRepasses([]);
  };

  // Carrega as estatísticas do banco de dados
  const fetchStats = async () => {
    setStatsLoading(true);
    const savedKey = localStorage.getItem('vyro_admin_key') || '';
    try {
      const res = await fetch(`/api/admin/database?admin_key=${encodeURIComponent(savedKey)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
      }
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Carrega as oportunidades (repassestabela central)
  const fetchRepasses = async () => {
    setRepassesLoading(true);
    const savedKey = localStorage.getItem('vyro_admin_key') || '';
    try {
      const res = await fetch(`/api/admin/repasse?admin_key=${encodeURIComponent(savedKey)}&page=${page}&limit=${limit}&query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setRepasses(data.repasses);
        setTotalRepasses(data.total);
      } else {
        console.error('Erro ao carregar repasses:', data.error);
      }
    } catch (err: any) {
      console.error('Erro ao buscar repasses:', err);
    } finally {
      setRepassesLoading(false);
    }
  };

  // Carrega os alertas dos compradores
  const fetchAlertas = async () => {
    setAlertasLoading(true);
    const savedKey = localStorage.getItem('vyro_admin_key') || '';
    try {
      const res = await fetch(`/api/admin/alertas?admin_key=${encodeURIComponent(savedKey)}&page=${alertasPage}&limit=${alertasLimit}&query=${encodeURIComponent(alertasSearchQuery)}&status=${alertasStatusFilter}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAlertas(data.alerts || []);
        setAlertasTotal(data.total || 0);
      } else {
        console.error('Erro ao carregar alertas no admin:', data.error);
      }
    } catch (err: any) {
      console.error('Erro ao buscar alertas no admin:', err);
    } finally {
      setAlertasLoading(false);
    }
  };

  // Excluir alerta físico no admin (deletar permanentemente do banco)
  const handleDeleteAlerta = async () => {
    if (!deleteAlertaModal.item) return;
    setActionExecuting(true);
    setActionSuccess(null);
    setActionError(null);

    const savedKey = localStorage.getItem('vyro_admin_key') || '';
    const itemId = deleteAlertaModal.item.id;

    try {
      const res = await fetch(`/api/admin/alertas?admin_key=${encodeURIComponent(savedKey)}&id=${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setActionSuccess('Alerta excluído permanentemente do banco!');
        fetchStats();
        fetchAlertas();
        setDeleteAlertaModal({ open: false, item: null });
      } else {
        setActionError(data.error || 'Erro ao excluir o alerta.');
      }
    } catch (err: any) {
      setActionError('Falha de conexão com o servidor.');
    } finally {
      setActionExecuting(false);
    }
  };

  // Excluir repasse individual
  const handleDeleteSingle = async () => {
    if (!deleteSingleModal.item) return;
    setActionExecuting(true);
    setActionSuccess(null);
    setActionError(null);

    const savedKey = localStorage.getItem('vyro_admin_key') || '';
    const itemId = deleteSingleModal.item.id;

    try {
      const res = await fetch(`/api/admin/repasse?admin_key=${encodeURIComponent(savedKey)}&id=${itemId}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setActionSuccess('Registro excluído com sucesso!');
        // Atualiza estatísticas e recarrega página atual
        fetchStats();
        fetchRepasses();
        setDeleteSingleModal({ open: false, item: null });
      } else {
        setActionError(data.error || 'Erro ao excluir o registro.');
      }
    } catch (err: any) {
      setActionError('Falha de conexão com o servidor.');
    } finally {
      setActionExecuting(false);
    }
  };

  // Excluir dados em lote de tabela específica
  const handleDeleteMass = async () => {
    if (!deleteMassModal.tableKey) return;
    
    if (confirmWord !== 'EXCLUIR') {
      setActionError('Palavra de confirmação inválida. Digite EXCLUIR em maiúsculo.');
      return;
    }

    setActionExecuting(true);
    setActionSuccess(null);
    setActionError(null);

    const savedKey = localStorage.getItem('vyro_admin_key') || '';
    const tableKey = deleteMassModal.tableKey;

    try {
      const res = await fetch(`/api/admin/database?admin_key=${encodeURIComponent(savedKey)}&table=${tableKey}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setActionSuccess(`A tabela "${deleteMassModal.tableName}" foi totalmente limpa!`);
        fetchStats();
        if (tableKey === 'repassecentral') {
          setPage(1);
          fetchRepasses();
        }
        setDeleteMassModal({ open: false, tableKey: '', tableName: '' });
        setConfirmWord('');
      } else {
        setActionError(data.error || 'Erro ao efetuar a exclusão em massa.');
      }
    } catch (err: any) {
      setActionError('Erro de conexão ao processar requisição em lote.');
    } finally {
      setActionExecuting(false);
    }
  };

  // Auxiliar de formatação de moeda brasileira
  const formatBRL = (val: any) => {
    if (!val) return '—';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d]/g, '')) : val;
    if (isNaN(num)) return '—';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  };

  // Auxiliar de formatação de data
  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return '—';
    }
  };

  // Auxiliar de formatação de telefone
  const formatDisplayPhone = (phone: string) => {
    if (!phone) return '';
    const clean = phone.replace(/[^\d]/g, '');
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  // Exibe tela de carregamento inicial
  if (authChecking) {
    return (
      <div className="flex-1 min-h-screen bg-black flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
        <p className="text-zinc-400 mt-4 text-sm font-semibold tracking-wider">Verificando chaves de segurança...</p>
      </div>
    );
  }

  // Tela de "Login" da chave administrativa
  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center relative overflow-hidden px-6">
        {/* Efeitos decorativos */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/20 blur-[150px] pointer-events-none" />
        
        <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center gap-4 text-center mb-8">
            <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-500 rounded-2xl glow-primary">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Painel de Controle Admin</h1>
              <p className="text-xs text-zinc-400 mt-1">Insira a chave de segurança administrativa para prosseguir</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="admin-key" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Chave Secreta</label>
              <input
                id="admin-key"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Insira a chave administrativa..."
                className="w-full bg-zinc-950 border border-zinc-850 hover:border-zinc-750 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm text-white px-4 py-3 rounded-xl transition-all outline-none"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/20 hover:scale-[1.01]"
            >
              Acessar Painel
            </button>

            <Link
              href="/"
              className="text-center text-xs text-zinc-500 hover:text-zinc-300 mt-2 flex items-center justify-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard de Admin Principal
  return (
    <div className="flex-1 bg-black text-zinc-100 min-h-screen relative overflow-hidden flex flex-col">
      {/* Detalhes de Gradients */}
      <div className="absolute top-0 right-0 w-[40%] h-[30%] rounded-full bg-red-950/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[30%] rounded-full bg-zinc-900/10 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-850 bg-black/85 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/oportunidades"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse-soft">
                <ShieldAlert className="w-3 h-3" /> Admin Mode
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight mt-0.5">Painel do Administrador</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8 z-10">
        
        {/* Banner de Feedback de Ações Globais */}
        {(actionSuccess || actionError) && (
          <div className={`p-4 rounded-xl border flex items-center justify-between ${actionSuccess ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-red-950/20 border-red-500/20 text-red-400'}`}>
            <div className="flex items-center gap-3 text-sm">
              {actionSuccess ? <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />}
              <span>{actionSuccess || actionError}</span>
            </div>
            <button 
              onClick={() => { setActionSuccess(null); setActionError(null); }}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Dashboard: Contagem de Linhas */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-4 h-4 text-zinc-400" /> Visão Geral do Banco de Dados
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((t) => (
              <div 
                key={t.key}
                className="bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between gap-4 transition-all hover:bg-zinc-900/60 group"
              >
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">{t.name}</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-extrabold text-white">{t.count.toLocaleString('pt-BR')}</span>
                    <span className="text-xs text-zinc-500">linhas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-850/60 pt-3">
                  <span className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {t.active ? 'Conectado' : 'Erro'}
                  </span>
                  
                  <button
                    onClick={() => setDeleteMassModal({ open: true, tableKey: t.key, tableName: t.name })}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer opacity-40 group-hover:opacity-100"
                    title={`Limpar tabela ${t.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Gerenciador de Repasses (Tabela repassecentral) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-zinc-400" /> Registro Ativo de Repasses (repassecentral)
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Delete e gerencie as ofertas que aparecem no Radar 24h</p>
            </div>

            {/* Filtro de Busca */}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-zinc-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                placeholder="Buscar por marca, modelo, anunciante..."
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-750 focus:border-zinc-700 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-1 focus:ring-zinc-700"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Listagem */}
          <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
            {repassesLoading ? (
              <div className="py-20 flex flex-col justify-center items-center gap-3">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                <span className="text-zinc-500 text-xs">Carregando dados dos repasses...</span>
              </div>
            ) : repasses.length === 0 ? (
              <div className="py-20 flex flex-col justify-center items-center gap-3 text-zinc-500">
                <Database className="w-8 h-8" />
                <span className="text-xs">Nenhum repasse encontrado no banco de dados.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-850 bg-zinc-900/50 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Veículo</th>
                      <th className="py-3 px-4">KM</th>
                      <th className="py-3 px-4">Preço Pedido</th>
                      <th className="py-3 px-4">FIPE Oficial</th>
                      <th className="py-3 px-4">Anunciante (WhatsApp)</th>
                      <th className="py-3 px-4">Recebido Em</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/55">
                    {repasses.map((r) => (
                      <tr 
                        key={r.id}
                        className="hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{r.modelo}</div>
                          <div className="text-[10px] text-zinc-500 font-bold mt-0.5">{r.marca} • Ano: {r.ano_modelo || '—'}</div>
                        </td>
                        <td className="py-3 px-4">{r.km ? `${r.km.toLocaleString('pt-BR')} km` : '—'}</td>
                        <td className="py-3 px-4 font-bold text-white">{formatBRL(r.preco_pedido)}</td>
                        <td className="py-3 px-4 text-zinc-400">{formatBRL(r.preco_fipe)}</td>
                        <td className="py-3 px-4">
                          <div>{r.nome_anunciante || 'Particular'}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{r.numero_anunciante || '—'}</div>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">{formatDateBR(r.data_hora_recebimento)}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setDeleteSingleModal({ open: true, item: r })}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                            title="Excluir repasse"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {totalRepasses > limit && (
              <div className="border-t border-zinc-850/80 px-4 py-3 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Mostrando <strong className="text-zinc-300">{(page - 1) * limit + 1}</strong> a <strong className="text-zinc-300">{Math.min(page * limit, totalRepasses)}</strong> de <strong className="text-zinc-300">{totalRepasses}</strong> repasses
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-zinc-300 font-semibold">{page}</span>
                  <button
                    disabled={page * limit >= totalRepasses}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Novo: Painel de Alertas de Compras (Monitoramento Comercial) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-zinc-400" /> Painel de Alertas de Compras (Monitoramento Comercial)
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Monitore em tempo real as demandas de marcas, modelos e compradores (incluindo excluídos)</p>
            </div>

            {/* Filtros de Alertas */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Select Status */}
              <select
                value={alertasStatusFilter}
                onChange={(e) => { setAlertasStatusFilter(e.target.value); setAlertasPage(1); }}
                className="w-full sm:w-44 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 px-3 py-2.5 rounded-xl outline-none cursor-pointer focus:ring-1 focus:ring-zinc-700"
              >
                <option value="ALL">TODOS OS STATUS</option>
                <option value="ACTIVE">ATIVOS (MONITORANDO)</option>
                <option value="PAUSED">PAUSADOS PELO CLIENTE</option>
                <option value="DELETED">EXCLUÍDOS (HISTÓRICO)</option>
              </select>

              {/* Input Busca */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-zinc-500" />
                </span>
                <input
                  type="text"
                  value={alertasSearchQuery}
                  onChange={(e) => { setAlertasSearchQuery(e.target.value); setAlertasPage(1); }}
                  placeholder="Buscar comprador, marca, modelo..."
                  className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-750 focus:border-zinc-700 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all focus:ring-1 focus:ring-zinc-700"
                />
                {alertasSearchQuery && (
                  <button 
                    onClick={() => setAlertasSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabela de Alertas */}
          <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl">
            {alertasLoading ? (
              <div className="py-20 flex flex-col justify-center items-center gap-3">
                <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
                <span className="text-zinc-500 text-xs">Carregando dados dos alertas...</span>
              </div>
            ) : alertas.length === 0 ? (
              <div className="py-20 flex flex-col justify-center items-center gap-3 text-zinc-500">
                <Bell className="w-8 h-8" />
                <span className="text-xs">Nenhum alerta encontrado com os filtros aplicados.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-850 bg-zinc-900/50 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Comprador</th>
                      <th className="py-3 px-4">Contato</th>
                      <th className="py-3 px-4">Marca de Interesse</th>
                      <th className="py-3 px-4">Modelo/Versão</th>
                      <th className="py-3 px-4">Valor Limite</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Configurado Em</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/55">
                    {alertas.map((a) => {
                      const isDeleted = a.nome_cliente.startsWith('[EXCLUIDO] ');
                      const cleanName = isDeleted ? a.nome_cliente.replace('[EXCLUIDO] ', '') : a.nome_cliente;

                      return (
                        <tr 
                          key={a.id}
                          className="hover:bg-zinc-900/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-white">
                            {cleanName}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {a.telefone_cliente ? formatDisplayPhone(a.telefone_cliente) : '—'}
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-400">
                            {a.marca}
                          </td>
                          <td className="py-3 px-4 text-zinc-200">
                            {a.modelo}
                          </td>
                          <td className="py-3 px-4 font-bold text-white">
                            {a.valor_maximo ? formatBRL(a.valor_maximo) : 'Sem limite'}
                          </td>
                          <td className="py-3 px-4">
                            {isDeleted ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">
                                Excluído (Soft Delete)
                              </span>
                            ) : a.ativo ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                Ativo (Monitorando)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                Pausado pelo Cliente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-400">
                            {formatDateBR(a.criado_em)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setDeleteAlertaModal({ open: true, item: a })}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                              title="Excluir alerta permanentemente do banco"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação de Alertas */}
            {alertasTotal > alertasLimit && (
              <div className="border-t border-zinc-850/80 px-4 py-3 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  Mostrando <strong className="text-zinc-300">{(alertasPage - 1) * alertasLimit + 1}</strong> a <strong className="text-zinc-300">{Math.min(alertasPage * alertasLimit, alertasTotal)}</strong> de <strong className="text-zinc-300">{alertasTotal}</strong> alertas
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={alertasPage === 1}
                    onClick={() => setAlertasPage(alertasPage - 1)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-zinc-300 font-semibold">{alertasPage}</span>
                  <button
                    disabled={alertasPage * alertasLimit >= alertasTotal}
                    onClick={() => setAlertasPage(alertasPage + 1)}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Painel de Controle de Limpeza em Massa */}
        <section className="bg-zinc-950 border border-red-500/10 rounded-2xl p-6 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-500 rounded-xl">
              <ShieldAlert className="w-5 h-5 animate-pulse-soft" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ações Destrutivas Administrativas</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Controle global do banco de dados para limpezas e resets completos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* Exclusão Repasse Central */}
            <div className="bg-zinc-900/20 border border-zinc-850 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Apagar Tudo de: repassecentral</h4>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  Esta ação excluirá permanentemente todos os registros de ofertas/carros importados no painel de Radar 24h. Use para limpar o histórico e começar do zero.
                </p>
              </div>
              
              <button
                onClick={() => setDeleteMassModal({ open: true, tableKey: 'repassecentral', tableName: 'repassecentral (Radar 24h)' })}
                className="w-fit px-4 py-2.5 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/30 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar Repasse Central
              </button>
            </div>

            {/* Exclusão Tracking Leads e CRM */}
            <div className="bg-zinc-900/20 border border-zinc-850 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Apagar Tudo de: Leads de Rastreamento</h4>
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  Esta ação limpará todas as linhas das tabelas de leads de rastreamento (`tracking_leads` e `leads_master`). Recomendado para limpar conversões e leads antigos de campanhas.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setDeleteMassModal({ open: true, tableKey: 'tracking_leads', tableName: 'tracking_leads (Leads de Rastreamento)' })}
                  className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/30 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Tracking Leads
                </button>
                
                <button
                  onClick={() => setDeleteMassModal({ open: true, tableKey: 'leads_master', tableName: 'leads_master (Leads CRM Master)' })}
                  className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/30 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Leads Master
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="py-6 border-t border-zinc-850 text-center text-[10px] text-zinc-650 mt-12 bg-black/50">
        vyrobr admin mode • {new Date().getFullYear()} • Todas as exclusões são irreversíveis.
      </footer>

      {/* MODAL: CONFIRMAÇÃO DE DELEÇÃO INDIVIDUAL */}
      {deleteSingleModal.open && deleteSingleModal.item && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setDeleteSingleModal({ open: false, item: null })}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-500 rounded-xl flex-shrink-0">
                <AlertOctagon className="w-6 h-6 animate-pulse-soft" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Excluir Repasse?</h3>
                <p className="text-xs text-zinc-400 mt-1.5">Isso apagará permanentemente o veículo de repasse do banco de dados.</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 flex flex-col gap-2 mb-6">
              <div><strong>Veículo:</strong> {deleteSingleModal.item.modelo} ({deleteSingleModal.item.marca})</div>
              <div><strong>Preço:</strong> {formatBRL(deleteSingleModal.item.preco_pedido)}</div>
              <div><strong>Anunciante:</strong> {deleteSingleModal.item.nome_anunciante || 'Particular'} ({deleteSingleModal.item.numero_anunciante || '—'})</div>
            </div>

            <div className="flex gap-3">
              <button
                disabled={actionExecuting}
                onClick={() => setDeleteSingleModal({ open: false, item: null })}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                disabled={actionExecuting}
                onClick={handleDeleteSingle}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-red-950/20"
              >
                {actionExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Excluir Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE DELEÇÃO FÍSICA DE ALERTA */}
      {deleteAlertaModal.open && deleteAlertaModal.item && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex justify-center items-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setDeleteAlertaModal({ open: false, item: null })}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-500 rounded-xl flex-shrink-0">
                <AlertOctagon className="w-6 h-6 animate-pulse-soft" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Excluir Alerta Permanentemente?</h3>
                <p className="text-xs text-zinc-400 mt-1.5">Isso apagará permanentemente o alerta de compra do banco de dados.</p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 flex flex-col gap-2 mb-6">
              <div><strong>Comprador:</strong> {deleteAlertaModal.item.nome_cliente.replace('[EXCLUIDO] ', '')}</div>
              <div><strong>Telefone:</strong> {deleteAlertaModal.item.telefone_cliente ? formatDisplayPhone(deleteAlertaModal.item.telefone_cliente) : '—'}</div>
              <div><strong>Marca/Modelo de Interesse:</strong> {deleteAlertaModal.item.marca} - {deleteAlertaModal.item.modelo}</div>
              {deleteAlertaModal.item.valor_maximo && <div><strong>Preço Limite:</strong> {formatBRL(deleteAlertaModal.item.valor_maximo)}</div>}
            </div>

            <div className="flex gap-3">
              <button
                disabled={actionExecuting}
                onClick={() => setDeleteAlertaModal({ open: false, item: null })}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                disabled={actionExecuting}
                onClick={handleDeleteAlerta}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-red-950/20"
              >
                {actionExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Excluir Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE DELEÇÃO EM MASSA */}
      {deleteMassModal.open && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex justify-center items-center p-6">
          <div className="bg-zinc-900 border border-red-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => { setDeleteMassModal({ open: false, tableKey: '', tableName: '' }); setConfirmWord(''); }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-500 rounded-xl flex-shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse-soft" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight uppercase tracking-wider">Ação Crítica de Limpeza</h3>
                <p className="text-xs text-red-400 mt-1.5 font-semibold">Exclusão irreversível de toda a tabela: {deleteMassModal.tableName}.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-5">
              Ao confirmar, **todos** os registros dessa tabela no Supabase serão apagados e não poderão ser recuperados. 
              Para confirmar que você deseja efetuar essa limpeza, digite <strong className="text-white">EXCLUIR</strong> no campo abaixo:
            </p>

            <div className="mb-6">
              <input
                type="text"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                placeholder="Digite EXCLUIR para continuar..."
                className="w-full bg-zinc-950 border border-red-950/60 hover:border-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs text-white px-4 py-3 rounded-xl transition-all outline-none text-center font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal"
              />
            </div>

            <div className="flex gap-3">
              <button
                disabled={actionExecuting}
                onClick={() => { setDeleteMassModal({ open: false, tableKey: '', tableName: '' }); setConfirmWord(''); }}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                disabled={actionExecuting || confirmWord !== 'EXCLUIR'}
                onClick={handleDeleteMass}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:opacity-40 disabled:text-zinc-650 disabled:cursor-not-allowed text-white font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg"
              >
                {actionExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Apagar Dados
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
