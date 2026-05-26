'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles,
  Phone,
  User,
  Car,
  DollarSign,
  Bell,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ToggleLeft,
  ToggleRight,
  Search,
  X
} from 'lucide-react';

interface AlertaCliente {
  id: string;
  nome_cliente: string;
  telefone_cliente: string;
  marca: string;
  modelo: string;
  valor_minimo: number | null;
  valor_maximo: number | null;
  ano_minimo: number | null;
  ano_maximo: number | null;
  cor: string | null;
  cambio: string | null;
  combustivel: string | null;
  km_minimo: number | null;
  km_maximo: number | null;
  ativo: boolean;
  criado_em: string;
}

const BRANDS = [
  'CHEVROLET',
  'FIAT',
  'FORD',
  'HONDA',
  'HYUNDAI',
  'JEEP',
  'RENAULT',
  'TOYOTA',
  'VOLKSWAGEN',
  'OUTROS'
];

export default function AlertasPage() {
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

  const [alerts, setAlerts] = useState<AlertaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos filtros da listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('TODAS');
  const [filterStatus, setFilterStatus] = useState('TODOS'); // 'TODOS' | 'ATIVOS' | 'INATIVOS'

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');

  // Novos campos específicos de filtros
  const [anoMinimo, setAnoMinimo] = useState('');
  const [anoMaximo, setAnoMaximo] = useState('');
  const [cor, setCor] = useState('');
  const [cambio, setCambio] = useState(''); // '' | 'AUTOMATICO' | 'MANUAL'
  const [combustivel, setCombustivel] = useState(''); // '' | 'FLEX' | 'GASOLINA' | 'DIESEL' | 'HIBRIDO' | 'ELETRICO'
  const [kmMinimo, setKmMinimo] = useState('');
  const [kmMaximo, setKmMaximo] = useState('');

  // Status de envio
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Efeito para carregar os alertas
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/alertas');
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erro ao carregar os alertas.');
        }
        setAlerts(data.alerts || []);
      } catch (err: any) {
        console.warn('[Fetch Alerts Warning]', err);
        setError(err.message || 'Falha ao buscar alertas ativos do banco.');
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  // Filtragem dos alertas com base na busca, marca e status
  const filteredAlerts = alerts.filter(alerta => {
    const matchesSearch = 
      alerta.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alerta.modelo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = 
      filterBrand === 'TODAS' || 
      alerta.marca.toUpperCase() === filterBrand.toUpperCase();
      
    const matchesStatus = 
      filterStatus === 'TODOS' || 
      (filterStatus === 'ATIVOS' && alerta.ativo) ||
      (filterStatus === 'INATIVOS' && !alerta.ativo);
      
    return matchesSearch && matchesBrand && matchesStatus;
  });

  // Máscara brasileira para telefone: (99) 99999-9999 ou (99) 9999-9999
  const formatPhoneNumber = (value: string) => {
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
    const formatted = formatPhoneNumber(e.target.value);
    setTelefone(formatted);
  };

  // Formata o input de moeda no padrão R$ 0,00
  const formatCurrencyInput = (value: string) => {
    const clean = value.replace(/[^\d]/g, '');
    if (!clean) return '';
    const num = parseFloat(clean) / 100;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleValorMinimoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorMinimo(formatCurrencyInput(e.target.value));
  };

  const handleValorMaximoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValorMaximo(formatCurrencyInput(e.target.value));
  };

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !telefone || !marca || !modelo) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    // Converte o valor formatado para número puro
    const parseCurrency = (val: string) => {
      const raw = val.replace(/[^\d]/g, '');
      return raw ? parseFloat(raw) / 100 : null;
    };

    const valorMinNum = parseCurrency(valorMinimo);
    const valorMaxNum = parseCurrency(valorMaximo);

    try {
      const res = await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_cliente: nome,
          telefone_cliente: telefone,
          marca,
          modelo,
          valor_minimo: valorMinNum,
          valor_maximo: valorMaxNum,
          ano_minimo: anoMinimo ? Number(anoMinimo) : null,
          ano_maximo: anoMaximo ? Number(anoMaximo) : null,
          cor,
          cambio,
          combustivel,
          km_minimo: kmMinimo ? Number(kmMinimo) : null,
          km_maximo: kmMaximo ? Number(kmMaximo) : null
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao criar alerta.');
      }

      setAlerts(prev => [data.alert, ...prev]);
      setSuccessMsg('Monitoramento ativado com sucesso! Monitorando 24h por dia.');
      
      // Limpa os inputs
      setNome('');
      setTelefone('');
      setModelo('');
      setValorMinimo('');
      setValorMaximo('');
      setAnoMinimo('');
      setAnoMaximo('');
      setCor('');
      setCambio('');
      setCombustivel('');
      setKmMinimo('');
      setKmMaximo('');

      // Some com a mensagem de sucesso depois de 4 segundos
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Falha ao ativar monitoramento.');
    } finally {
      setSubmitting(false);
    }
  };

  // Alterna o status ativo do alerta
  const handleToggleAlert = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/alertas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ativo: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao atualizar alerta.');
      }

      setAlerts(prev => prev.map(a => a.id === id ? data.alert : a));
    } catch (err: any) {
      console.error('Erro ao alternar status do alerta:', err);
      alert('Não foi possível alternar o status do alerta.');
    }
  };

  // Remove permanentemente o alerta
  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Deseja realmente excluir este alerta de monitoramento?')) return;

    try {
      const res = await fetch(`/api/alertas?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao remover alerta.');
      }

      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      console.error('Erro ao excluir alerta:', err);
      alert('Não foi possível remover o alerta.');
    }
  };

  // Formata o número brasileiro de volta para visualização
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

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col font-sans">
      {/* Luzes decorativas de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-red-950/10 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/10 blur-[180px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-900 bg-black/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all">
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
            <Link href="/facebook" className="text-zinc-400 hover:text-white transition-colors">
              Exclusivas Manos
            </Link>

            <span className="text-zinc-800">|</span>
            <Link href="/alertas" className="text-primary hover:text-primary transition-colors">
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
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-8 z-10">
        
        {/* Título */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Configurar Alertas de Compra
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Cadastre os carros de interesse dos seus compradores. Monitoramos as tabelas de repasse 24h por dia e avisamos o n8n instantaneamente.
          </p>
        </div>

        {/* Status messages */}
        {error && (
          <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start gap-2.5 max-w-4xl">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl flex items-start gap-2.5 max-w-4xl animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Lado Esquerdo: Formulário (4 colunas) */}
          <section className="lg:col-span-5">
            <div className="glass-panel border border-zinc-850 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">Novo Monitoramento</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Cadastre o comprador e a marca/modelo desejados</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                
                {/* Nome do Cliente */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Nome do Comprador *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Silveira"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>

                {/* Telefone / WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">WhatsApp Comprador *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: (47) 99999-9999"
                      value={telefone}
                      onChange={handlePhoneChange}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>

                {/* Marca (Input) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Marca Desejada</label>
                  <div className="relative">
                    <Car className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Ex: Volkswagen, Fiat, Honda..."
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>

                {/* Modelo Desejado */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Modelo / Palavra-Chave *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Civic, Corolla, Tiguan..."
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                  />
                </div>

                {/* Divisor Visual para Filtros Avançados */}
                <div className="flex items-center gap-2 my-1">
                  <div className="h-px bg-zinc-900 flex-1" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Filtros Avançados (Opcional)</span>
                  <div className="h-px bg-zinc-900 flex-1" />
                </div>

                {/* Ano Inicial e Final */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ano Inicial</label>
                    <input
                      type="number"
                      placeholder="Ex: 2018"
                      value={anoMinimo}
                      onChange={(e) => setAnoMinimo(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ano Final</label>
                    <input
                      type="number"
                      placeholder="Ex: 2024"
                      value={anoMaximo}
                      onChange={(e) => setAnoMaximo(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>

                {/* KM Inicial e Final */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">KM Mínimo</label>
                    <input
                      type="number"
                      placeholder="Ex: 10000"
                      value={kmMinimo}
                      onChange={(e) => setKmMinimo(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">KM Máximo</label>
                    <input
                      type="number"
                      placeholder="Ex: 80000"
                      value={kmMaximo}
                      onChange={(e) => setKmMaximo(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>

                {/* Cor */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cor Desejada</label>
                  <input
                    type="text"
                    placeholder="Ex: Preto, Branco, Prata"
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                  />
                </div>

                {/* Câmbio e Combustível */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Câmbio</label>
                    <select
                      value={cambio}
                      onChange={(e) => setCambio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-350 text-xs font-semibold focus:outline-none focus:border-zinc-800 transition-colors cursor-pointer"
                    >
                      <option value="">Qualquer</option>
                      <option value="AUTOMATICO">Automático</option>
                      <option value="MANUAL">Manual</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Combustível</label>
                    <select
                      value={combustivel}
                      onChange={(e) => setCombustivel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-350 text-xs font-semibold focus:outline-none focus:border-zinc-800 transition-colors cursor-pointer"
                    >
                      <option value="">Qualquer</option>
                      <option value="FLEX">Flex</option>
                      <option value="GASOLINA">Gasolina</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="HIBRIDO">Híbrido</option>
                      <option value="ELETRICO">Elétrico</option>
                    </select>
                  </div>
                </div>

                {/* Faixa de Preço (Min e Max) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Faixa de preço que procura</label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        value={valorMinimo}
                        onChange={handleValorMinimoChange}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-all placeholder:text-zinc-600 font-medium"
                      />
                    </div>
                    <span className="text-zinc-500 font-medium text-xs">até</span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Sem limite"
                        value={valorMaximo}
                        onChange={handleValorMaximoChange}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-all placeholder:text-zinc-600 font-medium"
                      />
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-medium mt-0.5">Deixe os campos vazios ou zerados para receber alertas de qualquer faixa de preço do modelo cadastrado.</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-4 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer glow-primary glow-primary-hover disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Habilitando...
                    </>
                  ) : (
                    <>
                      Ativar Monitoramento 24h
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* Lado Direito: Listagem (8 colunas) */}
          <section className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> Fila de Espera Ativa
              </h3>
              <span className="text-xs text-zinc-500 font-medium">
                {searchTerm || filterBrand !== 'TODAS' || filterStatus !== 'TODOS' ? (
                  `${filteredAlerts.length} de ${alerts.length} alerta${alerts.length !== 1 ? 's' : ''}`
                ) : (
                  `${alerts.length} alerta${alerts.length !== 1 ? 's' : ''} cadastrado${alerts.length !== 1 ? 's' : ''}`
                )}
              </span>
            </div>

            {/* Barra de Filtros e Busca */}
            {!loading && alerts.length > 0 && (
              <div className="glass-panel border border-zinc-900 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-center">
                {/* Campo de Busca */}
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar comprador ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-9 py-2.5 text-zinc-200 text-xs focus:outline-none focus:border-zinc-800 transition-colors"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filtro de Marca */}
                <div className="relative w-full sm:w-44">
                  <select
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-350 text-xs font-semibold focus:outline-none focus:border-zinc-800 transition-colors cursor-pointer"
                  >
                    <option value="TODAS">TODAS AS MARCAS</option>
                    {BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro de Status */}
                <div className="relative w-full sm:w-36">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-350 text-xs font-semibold focus:outline-none focus:border-zinc-800 transition-colors cursor-pointer"
                  >
                    <option value="TODOS">TODOS</option>
                    <option value="ATIVOS">ATIVOS</option>
                    <option value="INATIVOS">INATIVOS</option>
                  </select>
                </div>
              </div>
            )}

            {loading ? (
              <div className="glass-panel border border-zinc-900 rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-zinc-400">Carregando fila de monitoramento...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="glass-panel border border-zinc-900 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
                <Bell className="w-8 h-8 text-zinc-700" />
                <div>
                  <h4 className="font-bold text-white text-sm">Nenhum Alerta Ativo</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">Use o formulário ao lado para cadastrar compradores que desejam receber avisos em tempo real.</p>
                </div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="glass-panel border border-zinc-900 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4">
                <Search className="w-8 h-8 text-zinc-700" />
                <div>
                  <h4 className="font-bold text-white text-sm">Nenhum Alerta Encontrado</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">Nenhum comprador ou modelo cadastrado corresponde aos critérios de pesquisa selecionados.</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterBrand('TODAS');
                      setFilterStatus('TODOS');
                    }}
                    className="mt-4 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredAlerts.map((alerta) => (
                  <div 
                    key={alerta.id}
                    className={`glass-panel border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                      alerta.ativo 
                        ? 'border-zinc-850 bg-zinc-900/10' 
                        : 'border-zinc-900/60 bg-zinc-950/20 opacity-50'
                    }`}
                  >
                    {/* Indicador de monitoramento ativo */}
                    {alerta.ativo && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full m-3 animate-pulse" />
                    )}

                    {/* Detalhes do Alerta */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-extrabold text-sm text-white block truncate max-w-[170px]" title={alerta.nome_cliente}>
                            {alerta.nome_cliente}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                            Tel: {formatDisplayPhone(alerta.telefone_cliente)}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase border-zinc-800 bg-zinc-900/50 text-zinc-400">
                          {alerta.marca}
                        </span>
                      </div>

                      <div className="h-px bg-zinc-900/60" />

                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between text-zinc-400">
                          <span>Modelo Desejado:</span>
                          <span className="text-zinc-200 font-bold capitalize">{alerta.modelo}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>Faixa de Preço:</span>
                          <span className="text-emerald-400 font-bold">
                            {alerta.valor_minimo || alerta.valor_maximo 
                              ? `${alerta.valor_minimo ? alerta.valor_minimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'} - ${alerta.valor_maximo ? alerta.valor_maximo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sem limite'}` 
                              : 'Qualquer valor'}
                          </span>
                        </div>
                      </div>

                      {/* Badges de Filtros Avançados */}
                      {(alerta.ano_minimo || alerta.ano_maximo || alerta.km_minimo || alerta.km_maximo || alerta.cor || alerta.cambio || alerta.combustivel) && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {/* Ano */}
                          {(alerta.ano_minimo || alerta.ano_maximo) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
                              Ano: {alerta.ano_minimo || 'Qualquer'} - {alerta.ano_maximo || 'Qualquer'}
                            </span>
                          )}
                          {/* KM */}
                          {(alerta.km_minimo || alerta.km_maximo) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400">
                              KM: {alerta.km_minimo !== null ? `${alerta.km_minimo / 1000}k` : '0'} - {alerta.km_maximo !== null ? `${alerta.km_maximo / 1000}k` : 'Qualquer'}
                            </span>
                          )}
                          {/* Cor */}
                          {alerta.cor && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 capitalize">
                              Cor: {alerta.cor}
                            </span>
                          )}
                          {/* Câmbio */}
                          {alerta.cambio && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-850 bg-primary/10 text-primary uppercase">
                              {alerta.cambio === 'AUTOMATICO' ? 'AUT' : 'MAN'}
                            </span>
                          )}
                          {/* Combustível */}
                          {alerta.combustivel && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-850 bg-emerald-950/30 text-emerald-400 uppercase">
                              {alerta.combustivel}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Card: Switch e Lixeira */}
                    <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleAlert(alerta.id, alerta.ativo)}
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
                      >
                        {alerta.ativo ? (
                          <>
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-5 h-5 text-zinc-650" />
                            Inativo
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alerta.id)}
                        className="p-1.5 rounded-lg border border-zinc-900 hover:border-red-900 bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                        title="Excluir alerta de monitoramento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
