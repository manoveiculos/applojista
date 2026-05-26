'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database, 
  TrendingUp,
  Sparkles,
  Car,
  ChevronRight,
  Clipboard,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

interface ProcessedOffer {
  id?: string;
  brand: string;
  model: string;
  year_model: number;
  km: number;
  ask_price: number;
  net_price: number;
  fipe_pct: number | null;
  score?: number;
  rating?: string;
}

export default function ImportarPage() {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados do pipeline de importação
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [processedMessages, setProcessedMessages] = useState(0);
  const [extractedOffersCount, setExtractedOffersCount] = useState(0);
  const [latestOffers, setLatestOffers] = useState<ProcessedOffer[]>([]);
  
  // Caixa de texto manual
  const [manualText, setManualText] = useState('');
  const [sourceName, setSourceName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipulador de drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  // Envio do texto manual colado
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    
    const blob = new Blob([manualText], { type: 'text/plain' });
    const file = new File([blob], 'texto_colado.txt', { type: 'text/plain' });
    await processFile(file);
  };

  // Função principal de upload e disparo do parser
  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setSourceId(null);
    setTotalMessages(0);
    setProcessedMessages(0);
    setExtractedOffersCount(0);
    setLatestOffers([]);

    try {
      const text = await file.text();
      
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          sourceName: sourceName.trim() || file.name.replace('.txt', '')
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao importar arquivo.');
      }

      if (data.total === 0) {
        setError('Nenhuma mensagem válida encontrada no arquivo de log do WhatsApp.');
        setLoading(false);
        return;
      }

      setSourceId(data.sourceId);
      setTotalMessages(data.total);
      setSuccess(`${data.total} mensagens carregadas! Iniciando pipeline de inteligência artificial...`);
      setLoading(false);
      
      // Inicia o loop de processamento por lotes
      startProcessing(data.sourceId, data.total);

    } catch (err: any) {
      setError(err.message || 'Erro inesperado durante a importação.');
      setLoading(false);
    }
  };

  // Loop de processamento de fila (batches de 5 mensagens por vez)
  const startProcessing = async (sid: string, total: number) => {
    setProcessing(true);
    let done = false;
    let currentProcessed = 0;
    let accumulatedOffers: ProcessedOffer[] = [];

    while (!done) {
      try {
        const response = await fetch('/api/parse/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: sid,
            limit: 5 // tamanho do lote seguro para evitar timeout
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro no lote de processamento.');
        }

        if (data.finished || data.processed === 0) {
          done = true;
          break;
        }

        currentProcessed += data.processed;
        setProcessedMessages(currentProcessed);
        setExtractedOffersCount(prev => prev + data.offersFound);

        // Se houver novas ofertas processadas, buscar os últimos dados inseridos para exibir na tela
        if (data.offersFound > 0) {
          fetchLatestOffers(sid);
        }

        if (currentProcessed >= total || data.remaining === 0) {
          done = true;
        }
      } catch (err) {
        console.warn('Erro no processamento em lote:', err);
        // Espera um segundo antes de tentar novamente para não travar em caso de oscilações
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setProcessing(false);
    setSuccess('Processamento concluído com sucesso!');
  };

  // Busca as ofertas mais recentes importadas no banco para o feedback instantâneo
  const fetchLatestOffers = async (sid: string) => {
    try {
      const response = await fetch(`/api/parse/offers?sourceId=${sid}`);
      if (response.ok) {
        const data = await response.json();
        setLatestOffers(data.offers || []);
      }
    } catch (e) {
      console.warn('Erro ao carregar últimas ofertas:', e);
    }
  };

  // Retorna a cor do badge do deal score
  const getScoreBadgeStyles = (rating?: string) => {
    switch (rating) {
      case 'EXCELENTE':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'BOM':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'MEDIO':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'RUIM':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'EVITAR':
      default:
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  const progressPercent = totalMessages > 0 ? Math.round((processedMessages / totalMessages) * 100) : 0;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-all">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary glow-primary animate-pulse-soft">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Importar Fluxo de Ofertas</h1>
            <p className="text-sm text-zinc-400">Insira logs de conversa do WhatsApp para alimentar o mecanismo de inteligência artificial.</p>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo - Upload e Ingestão */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Fontes de Mensagem
            </h2>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Identificador do Grupo / Canal</label>
              <input
                type="text"
                placeholder="Ex: Flash Car SC, MVJP Premium"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                disabled={loading || processing}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary/50 focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-white text-sm outline-none transition-all"
              />
            </div>

            {/* Drag & Drop Area */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
              } ${(loading || processing) ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt"
                className="hidden"
              />
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 group-hover:text-white transition-all">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Carregue o arquivo .txt</p>
                <p className="text-xs text-zinc-400 mt-1">Arraste e solte o backup ou clique para buscar</p>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-500 uppercase">Ou</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            {/* Colar mensagem manual */}
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5" /> Analisar Texto Avulso
              </label>
              <textarea
                placeholder="Cole uma oferta do WhatsApp aqui..."
                rows={6}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                disabled={loading || processing}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-primary/50 focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-white text-sm outline-none resize-none transition-all placeholder:text-zinc-600"
              />
              <button
                type="submit"
                disabled={loading || processing || !manualText.trim()}
                className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading || processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Analisar Mensagem
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Lado Direito - Progresso e Estatísticas / Resultados em Tempo Real */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Alertas */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && !error && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Painel de Processamento Principal */}
          {(loading || processing || totalMessages > 0) && (
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-primary" /> Pipeline de Ingestão Ativo
                    </>
                  ) : (
                    'Status do Pipeline'
                  )}
                </h3>
                <span className="text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
                  ID: {sourceId ? `${sourceId.substring(0, 8)}...` : 'Gerando...'}
                </span>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-xs text-zinc-400 font-medium">Lidas</span>
                  <span className="text-xl md:text-2xl font-bold text-white">{processedMessages} <span className="text-xs font-normal text-zinc-500">/ {totalMessages}</span></span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-xs text-zinc-400 font-medium">Extraídas</span>
                  <span className="text-xl md:text-2xl font-bold text-primary flex items-center gap-1.5">
                    <Car className="w-5 h-5" /> {extractedOffersCount}
                  </span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-1">
                  <span className="text-xs text-zinc-400 font-medium">Taxa de Ofertas</span>
                  <span className="text-xl md:text-2xl font-bold text-zinc-300">
                    {processedMessages > 0 ? `${Math.round((extractedOffersCount / processedMessages) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
                  <span>Progresso do Parsing</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                  <div 
                    className="bg-gradient-to-r from-primary to-red-500 h-full rounded-full transition-all duration-300 glow-primary"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Últimas Ofertas Encontradas */}
          {latestOffers.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Ofertas Extraídas Recentes
                </h3>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <RefreshCw className={`w-3.5 h-3.5 ${processing ? 'animate-spin' : ''}`} /> Atualizando
                </span>
              </div>

              <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-1">
                {latestOffers.map((offer, idx) => (
                  <div 
                    key={offer.id || idx}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/60 transition-all hover:bg-zinc-900/70 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-400 group-hover:text-primary transition-all">
                        <Car className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">{offer.brand}</span>
                        <span className="text-sm font-medium text-white leading-snug">{offer.model}</span>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-medium">
                          <span>Ano {offer.year_model}</span>
                          <span>•</span>
                          <span>{offer.km.toLocaleString('pt-BR')} km</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-zinc-800/80 md:border-none pt-3 md:pt-0">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-zinc-500 font-medium">Venda Repasse</span>
                        <span className="text-sm font-bold text-white">R$ {offer.ask_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs text-zinc-400">FIPE: {offer.fipe_pct ? `${offer.fipe_pct.toFixed(1)}%` : 'N/A'}</span>
                      </div>

                      {offer.score !== undefined && (
                        <div className={`flex flex-col items-center justify-center border px-3 py-1.5 rounded-lg font-bold text-xs min-w-[70px] ${getScoreBadgeStyles(offer.rating)}`}>
                          <span className="text-base leading-none">{offer.score}</span>
                          <span className="text-[9px] font-semibold mt-0.5 tracking-wider">{offer.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado Vazio - Instruções */}
          {!loading && !processing && latestOffers.length === 0 && (
            <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 min-y-[400px]">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-600 animate-pulse-soft">
                <FileText className="w-10 h-10" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-semibold text-white">Nenhum log importado ainda</h3>
                <p className="text-xs text-zinc-400 mt-1">Carregue um arquivo .txt de exportação de chat do WhatsApp ou cole mensagens avulsas no painel ao lado para começar a estruturar e analisar as ofertas.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
