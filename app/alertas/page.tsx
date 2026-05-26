'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { safeFetch } from '@/lib/api-client';
import { 
  ArrowLeft, 
  Sparkles,
  Phone,
  User,
  Car,
  Bell,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
  Lock,
  Key,
  RefreshCw,
  Clock,
  ShieldCheck,
  LogOut,
  Info
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
  // Estados de desbloqueio de equipe
  const [unlocked, setUnlocked] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Estados de sessão
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);

  // Controle de exibição do Modal de Login OTP integrado
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Estados do formulário de Login OTP integrado
  const [loginNome, setLoginNome] = useState('');
  const [loginTelefone, setLoginTelefone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);
  const [loginHash, setLoginHash] = useState('');
  const [loginExp, setLoginExp] = useState(0);
  const [resendTimer, setResendTimer] = useState(0);

  // Estados de alertas
  const [alerts, setAlerts] = useState<AlertaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos filtros da listagem
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('TODAS');
  const [filterStatus, setFilterStatus] = useState('TODOS'); 

  // Estados do formulário de criação de alerta
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [valorMaximo, setValorMaximo] = useState('');
  const [anoMinimo, setAnoMinimo] = useState('');
  const [anoMaximo, setAnoMaximo] = useState('');
  const [cor, setCor] = useState('');
  const [cambio, setCambio] = useState(''); 
  const [combustivel, setCombustivel] = useState(''); 
  const [kmMinimo, setKmMinimo] = useState('');
  const [kmMaximo, setKmMaximo] = useState('');

  // Status de envio
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Alerta pendente antes da autenticação
  const [pendingAlert, setPendingAlert] = useState<any>(null);

  // Timer de reenvio de OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Efeito para verificar sessão no carregamento inicial
  useEffect(() => {
    const checkSession = () => {
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

      if (isUnlocked) {
        // Modo Equipe / Admin
        setIsUserLoggedIn(true);
        setUserName('Equipe Manos');
        setUserPhone('00000000000');
        fetchAlerts(true, '');
      } else if (sessionCookie) {
        // Usuário logado
        try {
          const decoded = decodeURIComponent(sessionCookie);
          const parsed = JSON.parse(decoded);
          setIsUserLoggedIn(true);
          setUserName(parsed.nome || 'Visitante');
          setUserPhone(parsed.telefone || '');
          // Preenche os campos do formulário
          setNome(parsed.nome || '');
          setTelefone(formatPhoneNumber(parsed.telefone || ''));
          fetchAlerts(false, parsed.telefone || '');
        } catch (err) {
          console.error('Falha ao decodificar cookie de sessão em alertas:', err);
          setIsUserLoggedIn(false);
          fetchAlerts(false, ''); // Fallback para anônimo
        }
      } else {
        setIsUserLoggedIn(false);
        setUserName('');
        setUserPhone('');
        fetchAlerts(false, ''); // Carrega lista anonimizada
      }
    };

    checkSession();
  }, []);

  // Busca alertas do backend
  const fetchAlerts = async (adminMode: boolean, phoneNum: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/alertas';
      if (adminMode) {
        url += `?admin_key=manos_intel_secret_key`;
      } else if (phoneNum) {
        url += `?phone=${encodeURIComponent(phoneNum.replace(/[^\d]/g, ''))}`;
      }
      const data = await safeFetch(url);
      setAlerts(data.alerts || []);
    } catch (err: any) {
      console.warn('[Fetch Alerts Warning]', err);
      setError(err.message || 'Falha ao buscar alertas ativos.');
    } finally {
      setLoading(false);
      setSessionLoading(false);
    }
  };

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
            setIsUserLoggedIn(true);
            setUserName('Equipe Manos');
            setUserPhone('00000000000');
            fetchAlerts(true, '');
          } else {
            try {
              await safeFetch(`/api/facebook?admin_key=${encodeURIComponent(cleanPassword)}`);
              localStorage.setItem('vyro_hidden_unlocked', 'true');
              localStorage.setItem('vyro_admin_key', cleanPassword);
              setUnlocked(true);
              setIsUserLoggedIn(true);
              setUserName('Equipe Manos');
              setUserPhone('00000000000');
              fetchAlerts(true, '');
            } catch (err) {
              alert('Senha incorreta ou erro de conexão com o servidor.');
            }
          }
        }
      } else {
        localStorage.setItem('vyro_hidden_unlocked', 'false');
        localStorage.removeItem('vyro_admin_key');
        setUnlocked(false);
        // Desloga e força recarregamento da sessão
        document.cookie = 'vyro_public_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        setIsUserLoggedIn(false);
        setAlerts([]);
        setNome('');
        setTelefone('');
        fetchAlerts(false, ''); // recarrega como anônimo
      }
    } else {
      setClickCount(nextCount);
    }
  };

  // LÓGICA DE LOGIN OTP INTEGRADO
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

  const handleLoginPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginTelefone(formatPhone(e.target.value));
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginNome.trim() || !loginTelefone.trim()) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccessMsg(null);

    try {
      const data = await safeFetch('/api/auth/enviar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: loginNome.trim(),
          telefone: loginTelefone,
        }),
      });

      setLoginHash(data.hash);
      setLoginExp(data.expiraEm);
      setLoginSuccessMsg('Código de segurança gerado e enviado para seu WhatsApp!');
      setResendTimer(60);

      setTimeout(() => {
        setLoginStep(2);
        setLoginSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setLoginError(err.message || 'Falha ao conectar com o servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp.trim() || loginOtp.length !== 4) {
      setLoginError('Digite o código de 4 dígitos enviado.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccessMsg(null);

    try {
      const data = await safeFetch('/api/auth/validar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: loginNome.trim(),
          telefone: loginTelefone,
          otp: loginOtp.trim(),
          hash: loginHash,
          expiraEm: loginExp,
        }),
      });

      setLoginSuccessMsg('Acesso autorizado com sucesso!');
      
      // Atualiza o estado da sessão local
      setIsUserLoggedIn(true);
      setUserName(loginNome.trim());
      setUserPhone(loginTelefone);
      setNome(loginNome.trim());
      setTelefone(loginTelefone);

      // Limpa os campos de login e fecha modal
      setLoginNome('');
      setLoginTelefone('');
      setLoginOtp('');
      setLoginStep(1);
      setShowLoginModal(false);

      // Se havia um alerta pendente, submete ele agora usando o nome e telefone logados!
      if (pendingAlert) {
        try {
          const alertData = await safeFetch('/api/alertas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...pendingAlert,
              nome_cliente: loginNome.trim(),
              telefone_cliente: loginTelefone
            })
          });
          setAlerts(prev => [alertData.alert, ...prev]);
          setSuccessMsg('Monitoramento ativado com sucesso! Monitorando 24h por dia.');
          setTimeout(() => setSuccessMsg(null), 4000);
          
          // Limpa formulário
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
        } catch (alertErr: any) {
          setError(alertErr.message || 'Falha ao salvar o alerta após a validação.');
        } finally {
          setPendingAlert(null);
        }
      } else {
        // Se não havia alerta pendente, apenas carrega a lista do telefone logado
        fetchAlerts(false, loginTelefone);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Falha ao validar o código.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoginLoading(true);
    setLoginError(null);
    setLoginSuccessMsg(null);
    setLoginOtp('');

    try {
      const data = await safeFetch('/api/auth/enviar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: loginNome.trim(),
          telefone: loginTelefone,
        }),
      });

      setLoginHash(data.hash);
      setLoginExp(data.expiraEm);
      setLoginSuccessMsg('Um novo código de confirmação foi enviado para seu WhatsApp!');
      setResendTimer(60);
    } catch (err: any) {
      setLoginError(err.message || 'Falha ao reenviar código.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = 'vyro_public_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    localStorage.removeItem('vyro_admin_key');
    localStorage.setItem('vyro_hidden_unlocked', 'false');
    setUnlocked(false);
    setIsUserLoggedIn(false);
    setUserName('');
    setUserPhone('');
    setAlerts([]);
    setNome('');
    setTelefone('');
    fetchAlerts(false, ''); // recarrega lista anonimizada
  };

  // Filtragem dos alertas com base na busca, marca e status
  const filteredAlerts = alerts.filter(alerta => {
    // Para administradores, a busca pode filtrar pelo nome do cliente ou pelo modelo
    // Para usuários comuns e anônimos, a busca filtra apenas pelo modelo já que nome está oculto
    const matchesSearch = (unlocked && !isUserLoggedIn)
      ? (alerta.nome_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
         alerta.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
      : alerta.modelo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBrand = 
      filterBrand === 'TODAS' || 
      alerta.marca.toUpperCase() === filterBrand.toUpperCase();
      
    const matchesStatus = 
      filterStatus === 'TODOS' || 
      (filterStatus === 'ATIVOS' && alerta.ativo) ||
      (filterStatus === 'INATIVOS' && !alerta.ativo);
      
    return matchesSearch && matchesBrand && matchesStatus;
  });

  // Máscara brasileira para telefone
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

  // Formata o input de moeda
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

    const parseCurrency = (val: string) => {
      const raw = val.replace(/[^\d]/g, '');
      return raw ? parseFloat(raw) / 100 : null;
    };

    const valorMinNum = parseCurrency(valorMinimo);
    const valorMaxNum = parseCurrency(valorMaximo);

    const alertDetails = {
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
    };

    // Se o usuário não estiver autenticado nem for admin, exige autenticação OTP antes de salvar
    if (!isUserLoggedIn && !unlocked) {
      setPendingAlert(alertDetails);
      setLoginNome(nome);
      setLoginTelefone(telefone);
      setLoginError(null);
      setLoginSuccessMsg(null);
      setLoginStep(1);
      setShowLoginModal(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await safeFetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertDetails)
      });

      // Adiciona o alerta criado na listagem atual do cliente (se ele estiver logado)
      if (unlocked || isUserLoggedIn) {
        setAlerts(prev => [data.alert, ...prev]);
      } else {
        // Se for anônimo, recarrega a lista para mostrar o novo alerta (de forma anonimizada)
        fetchAlerts(false, '');
      }

      setSuccessMsg('Monitoramento ativado com sucesso! Monitorando 24h por dia.');
      
      // Limpa os inputs (se for admin ou anônimo; se for usuário comum mantém nome e telefone da sessão)
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

      if (unlocked || !isUserLoggedIn) {
        setNome('');
        setTelefone('');
      }

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
      const body: any = { id, ativo: !currentStatus };
      if (unlocked) {
        body.admin_key = 'manos_intel_secret_key';
      } else {
        body.phone = userPhone;
      }

      const data = await safeFetch('/api/alertas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      setAlerts(prev => prev.map(a => a.id === id ? data.alert : a));
    } catch (err: any) {
      console.error('Erro ao alternar status do alerta:', err);
      alert(err.message || 'Não foi possível alternar o status do alerta.');
    }
  };

  // Remove permanentemente o alerta
  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Deseja realmente excluir este alerta de monitoramento?')) return;

    try {
      let url = `/api/alertas?id=${id}`;
      if (unlocked) {
        url += `&admin_key=manos_intel_secret_key`;
      } else {
        url += `&phone=${encodeURIComponent(userPhone)}`;
      }

      await safeFetch(url, {
        method: 'DELETE'
      });

      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      console.error('Erro ao excluir alerta:', err);
      alert(err.message || 'Não foi possível remover o alerta.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative overflow-hidden flex flex-col font-sans">
      
      {/* Imagem de Fundo de Veículo Premium */}
      <div className="absolute inset-0 bg-[url('/images/bg_vehicle.png')] bg-cover bg-center opacity-[0.05] mix-blend-screen pointer-events-none" />

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
            <span className="text-xl font-black tracking-tight text-white select-none">
              vyro<span 
                onClick={handleLogoClick}
                className="text-primary cursor-pointer hover:text-primary/80 transition-colors"
              >
                br
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-bold mr-1 sm:mr-2">
              {unlocked ? (
                <>
                  <Link href="/oportunidades" className="text-zinc-400 hover:text-white transition-colors">
                    Radar 24hrs
                  </Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/facebook" className="text-zinc-400 hover:text-white transition-colors">
                    Exclusivas Drivvoo
                  </Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/alertas" className="text-primary hover:text-primary transition-colors">
                    Configurar Alertas
                  </Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/avaliacao" className="text-zinc-400 hover:text-white transition-colors">
                    Calculadora
                  </Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/admin" className="text-zinc-400 hover:text-red-400 transition-colors">
                    Admin
                  </Link>
                </>
              ) : (
                <>
                  <Link href={isUserLoggedIn ? "/portal/radar" : "/portal"} className="text-zinc-400 hover:text-white transition-colors">
                    Radar
                  </Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/alertas" className="text-primary hover:text-primary transition-colors">
                    Alertas de Compra
                  </Link>
                </>
              )}
            </nav>

            {isUserLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl font-medium">
                  {unlocked ? <ShieldCheck className="w-3.5 h-3.5 text-primary" /> : <User className="w-3.5 h-3.5 text-primary" />}
                  <span>{userName}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 bg-zinc-900 hover:bg-red-950/20 hover:border-red-950 border border-zinc-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-red-400 cursor-pointer"
                  title="Sair do painel"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full flex flex-col gap-8 z-10">
        
        {/* Título */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3 animate-fade-in">
            Configurar Alertas de Compra
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Cadastre os carros de interesse e receba avisos em tempo real no WhatsApp assim que nossa IA encontrar a oferta.
          </p>
        </div>

        {sessionLoading ? (
          <div className="glass-panel border border-zinc-850 rounded-2xl p-24 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-zinc-400">Verificando segurança do portal...</span>
          </div>
        ) : (
          /* DASHBOARD DE ALERTAS PÚBLICO E LIVRE */
          <>
            {/* Mensagens de feedback do formulário */}
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
              
              {/* Lado Esquerdo: Formulário (5 colunas) */}
              <section className="lg:col-span-5">
                <div className="glass-panel border border-zinc-850 rounded-2xl p-6 flex flex-col gap-5 bg-zinc-950/20 backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
                      <Bell className="w-5 h-5 animate-pulse-soft" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg">Novo Monitoramento</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Cadastre a marca/modelo desejados para ser avisado</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    
                    {/* Nome do Cliente */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Nome do Comprador *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: João Silveira"
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          disabled={isUserLoggedIn && !unlocked} // usuários normais logados têm seu nome fixado
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-60 disabled:text-zinc-400"
                        />
                      </div>
                    </div>

                    {/* Telefone / WhatsApp */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">WhatsApp Comprador *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: (47) 99999-9999"
                          value={telefone}
                          onChange={handlePhoneChange}
                          disabled={isUserLoggedIn && !unlocked} // usuários normais logados têm seu telefone fixado
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-9 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-60 disabled:text-zinc-400"
                        />
                      </div>
                    </div>

                    {/* Marca */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Marca Desejada *</label>
                      <select
                        required
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-3 text-zinc-200 text-sm font-semibold focus:outline-none focus:border-zinc-800 transition-colors cursor-pointer appearance-none"
                      >
                        <option value="" disabled>Selecione uma marca...</option>
                        {BRANDS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
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

                    {/* Divisor Filtros Avançados */}
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
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-350 text-xs font-semibold focus:outline-none focus:border-zinc-850 transition-colors cursor-pointer"
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
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2.5 text-zinc-350 text-xs font-semibold focus:outline-none focus:border-zinc-850 transition-colors cursor-pointer"
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

                    {/* Faixa de Preço */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Faixa de preço que procura</label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="R$ 0,00"
                            value={valorMinimo}
                            onChange={handleValorMinimoChange}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-all placeholder:text-zinc-650 font-medium"
                          />
                        </div>
                        <span className="text-zinc-500 font-medium text-xs">até</span>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Sem limite"
                            value={valorMaximo}
                            onChange={handleValorMaximoChange}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-all placeholder:text-zinc-650 font-medium"
                          />
                        </div>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-medium mt-0.5">Deixe os campos vazios para monitorar qualquer valor.</span>
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

              {/* Lado Direito: Listagem (7 colunas) */}
              <section className="lg:col-span-7 flex flex-col gap-5">
                
                {/* Banner de Login LGPD (Caso não esteja logado) */}
                {!isUserLoggedIn && (
                  <div className="glass-panel border border-zinc-800 bg-zinc-950/40 rounded-2xl p-4 flex justify-between items-center gap-4">
                    <div className="flex gap-2.5 items-center">
                      <Info className="w-4 h-4 text-primary shrink-0 animate-pulse-soft" />
                      <span className="text-[11px] text-zinc-400 leading-normal">
                        Você está vendo a fila de alertas anonimizada. <strong>Identifique-se</strong> para gerenciar seus alertas de forma privada.
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowLoginModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      Entrar
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400 animate-pulse-soft" /> 
                    {unlocked 
                      ? 'Fila de Espera Ativa (Equipe)' 
                      : isUserLoggedIn 
                        ? 'Meus Alertas Ativos' 
                        : 'Fila de Espera Ativa (Público)'}
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
                {!loading && (isUserLoggedIn || unlocked) && alerts.length > 0 && (
                  <div className="glass-panel border border-zinc-900 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-center bg-zinc-950/20">
                    <div className="relative w-full sm:flex-1">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder={(unlocked) ? "Buscar comprador ou modelo..." : "Buscar por modelo..."}
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
                ) : !isUserLoggedIn && !unlocked ? (
                  /* Banner informativo premium para usuários não logados */
                  <div className="glass-panel border border-zinc-850 bg-zinc-950/20 rounded-3xl p-6 md:p-8 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h4 className="font-extrabold text-white text-base md:text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Como funciona o Monitoramento?
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                        Nosso sistema analisa de forma contínua as ofertas de repasse publicadas em grupos do WhatsApp 24 horas por dia.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl flex flex-col gap-2">
                        <span className="text-primary font-bold text-xs uppercase tracking-wider">1. Cadastre o veículo</span>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Defina a marca, modelo, ano, km e faixa de preço desejados no formulário.
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl flex flex-col gap-2">
                        <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">2. Rastreamento por IA</span>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Nossa Inteligência Artificial lerá cada anúncio e calculará se o preço está abaixo da FIPE oficial.
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl flex flex-col gap-2">
                        <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">3. Alerta no WhatsApp</span>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Assim que o veículo correspondente for postado, nós te enviaremos um alerta com os dados do repasse.
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl flex flex-col gap-2">
                        <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">4. Totalmente Seguro</span>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Seus dados pessoais são protegidos por criptografia e você pode desativar o monitoramento a qualquer momento.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                      <span className="text-[11px] text-zinc-400 leading-relaxed">
                        Já possui alertas cadastrados? Identifique seu WhatsApp para gerenciar e visualizar seus monitoramentos.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLoginModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-xs transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
                      >
                        Acessar meus alertas
                      </button>
                    </div>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="glass-panel border border-zinc-900 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4 bg-zinc-950/10">
                    <Bell className="w-8 h-8 text-zinc-700" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Nenhum Alerta Cadastrado</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs">Use o formulário para configurar o monitoramento de veículos e ser avisado na hora.</p>
                    </div>
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="glass-panel border border-zinc-900 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center gap-4 bg-zinc-950/10">
                    <Search className="w-8 h-8 text-zinc-700" />
                    <div>
                      <h4 className="font-bold text-white text-sm">Nenhum Alerta Encontrado</h4>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xs">Nenhum monitoramento corresponde aos critérios de busca.</p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    {filteredAlerts.map((alerta) => {
                      const isAnonymized = alerta.telefone_cliente === 'Omitido (LGPD)';
                      return (
                        <div 
                          key={alerta.id}
                          className={`glass-panel border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                            alerta.ativo 
                              ? 'border-zinc-850 bg-zinc-900/10' 
                              : 'border-zinc-900/60 bg-zinc-950/20 opacity-50'
                          }`}
                        >
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
                                {!isAnonymized && (
                                  <span className="text-[10px] text-zinc-500 font-semibold block mt-0.5">
                                    Tel: {formatPhoneNumber(alerta.telefone_cliente)}
                                  </span>
                                )}
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

                            {/* Filtros Avançados */}
                            {(alerta.ano_minimo || alerta.ano_maximo || alerta.km_minimo || alerta.km_maximo || alerta.cor || alerta.cambio || alerta.combustivel) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {(alerta.ano_minimo || alerta.ano_maximo) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-850 bg-zinc-950 text-zinc-450">
                                    Ano: {alerta.ano_minimo || 'Qualquer'} - {alerta.ano_maximo || 'Qualquer'}
                                  </span>
                                )}
                                {(alerta.km_minimo || alerta.km_maximo) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-850 bg-zinc-950 text-zinc-450">
                                    KM: {alerta.km_minimo !== null ? `${alerta.km_minimo / 1000}k` : '0'} - {alerta.km_maximo !== null ? `${alerta.km_maximo / 1000}k` : 'Qualquer'}
                                  </span>
                                )}
                                {alerta.cor && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-850 bg-zinc-950 text-zinc-450 capitalize">
                                    Cor: {alerta.cor}
                                  </span>
                                )}
                                {alerta.cambio && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-850 bg-primary/10 text-primary uppercase">
                                    {alerta.cambio === 'AUTOMATICO' ? 'AUT' : 'MAN'}
                                  </span>
                                )}
                                {alerta.combustivel && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-850 bg-emerald-950/30 text-emerald-400 uppercase">
                                    {alerta.combustivel}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Botões do Card (Apenas renderizados se o alerta NÃO for anonimizado / pertencer a ele) */}
                          {!isAnonymized ? (
                            <div className="flex items-center justify-between border-t border-zinc-900/60 pt-3 mt-1.5 animate-fade-in">
                              <button
                                type="button"
                                onClick={() => handleToggleAlert(alerta.id, alerta.ativo)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-450 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
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
                                className="p-1.5 rounded-lg border border-zinc-900 hover:border-red-950 bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                                title="Excluir monitoramento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            // Oferece espaço visual para simetria do card
                            <div className="pt-3 border-t border-zinc-900/10 text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-right">
                              Protegido por LGPD
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>
          </>
        )}
      </main>

      {/* MODAL DE LOGIN OTP INTEGRADO */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-3xl p-8 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white">Identifique seu WhatsApp</h2>
              <p className="text-xs text-zinc-400 mt-1">Para carregar e gerenciar seus alertas cadastrados de forma segura.</p>
            </div>

            {loginError && (
              <div className="mb-6 p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-start gap-2.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginSuccessMsg}</span>
              </div>
            )}

            {/* Login OTP Passo 1: Digitar Telefone */}
            {loginStep === 1 && (
              <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Seu Nome completo</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      disabled={loginLoading}
                      placeholder="Ex: João Silveira"
                      value={loginNome}
                      onChange={(e) => setLoginNome(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Seu WhatsApp (com DDD)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      disabled={loginLoading}
                      placeholder="Ex: (47) 99999-9999"
                      value={loginTelefone}
                      onChange={handleLoginPhoneChange}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl pl-10 pr-4 py-3 text-zinc-200 text-sm focus:outline-none focus:border-zinc-800 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-4 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer glow-primary glow-primary-hover disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Gerando código...
                    </>
                  ) : (
                    <>
                      Enviar Código de Confirmação
                      <Sparkles className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Login OTP Passo 2: Confirmar Código */}
            {loginStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-zinc-400 leading-relaxed text-center">
                    Digitou o código de 4 dígitos enviado para o WhatsApp <strong className="text-zinc-200">{loginTelefone}</strong>.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="relative flex justify-center">
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      maxLength={4}
                      disabled={loginLoading}
                      placeholder="0000"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-3.5 px-4 text-center text-lg font-black tracking-[0.75em] text-white focus:outline-none focus:border-zinc-800 transition-colors disabled:opacity-50 placeholder:tracking-normal placeholder:font-normal placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary/95 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer glow-primary glow-primary-hover disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      Confirmar e Acessar
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>

                <div className="flex flex-col items-center gap-2 mt-2">
                  <button
                    type="button"
                    disabled={loginLoading || resendTimer > 0}
                    onClick={handleResendOtp}
                    className="text-xs font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loginLoading ? 'animate-spin' : ''}`} />
                    Reenviar código
                  </button>
                  {resendTimer > 0 && (
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Aguarde {resendTimer}s para solicitar novamente
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-950 py-6 text-center text-xs text-zinc-650">
        Todos os direitos reservados a drivvoo &copy; {new Date().getFullYear()}.
      </footer>
    </div>
  );
}
