-- =====================================================
-- 1. FONTES (grupos de WhatsApp / canais)
-- =====================================================
CREATE TABLE IF NOT EXISTS sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                    -- "Flash Car SC"
  type          text NOT NULL,                    -- 'whatsapp_group' | 'manual' | 'evolution_api'
  format_hint   text,                             -- 'flashcar' | 'vaapty' | 'autopay' | 'free'
  created_at    timestamptz DEFAULT now()
);

-- =====================================================
-- 2. MENSAGENS BRUTAS (toda mensagem ingerida)
-- =====================================================
CREATE TABLE IF NOT EXISTS raw_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id     uuid REFERENCES sources(id) ON DELETE SET NULL,
  author        text,
  sent_at       timestamptz NOT NULL,
  content       text NOT NULL,
  is_offer      boolean,                          -- preenchido pelo classificador
  parsed        boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_messages_sent_at ON raw_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_messages_unparsed ON raw_messages(parsed) WHERE parsed = false;

-- =====================================================
-- 3. OFERTAS NORMALIZADAS (uma linha = uma oferta)
-- =====================================================
CREATE TABLE IF NOT EXISTS offers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message_id      uuid REFERENCES raw_messages(id) ON DELETE SET NULL,
  source_id           uuid REFERENCES sources(id) ON DELETE SET NULL,

  -- Identificação
  brand               text NOT NULL,              -- 'CHEVROLET'
  model               text NOT NULL,              -- 'TRACKER LTZ 1.2 TURBO'
  model_normalized    text,                       -- normalizado para busca
  year_model          int NOT NULL,               -- 2021
  year_manufacture    int,                        -- 2020 (se '2020/2021')
  fuel                text,                       -- 'FLEX' | 'GASOLINA' | 'DIESEL' | 'HIBRIDO' | 'ELETRICO'
  transmission        text,                       -- 'MANUAL' | 'AUTOMATICO'
  km                  int NOT NULL,
  plate_end           text,                       -- 'Q' (última letra/dígito)

  -- Preços
  fipe_price          numeric(12,2),              -- valor da FIPE informado na mensagem
  ask_price           numeric(12,2) NOT NULL,     -- valor anunciado
  net_price           numeric(12,2),              -- ask_price * 0.94 (descontando 6% anunciante)
  fipe_pct            numeric(5,2),               -- net_price / fipe_price * 100

  -- FIPE oficial (enriquecido)
  fipe_code           text,                       -- código FIPE oficial (ex: '004278-1')
  fipe_price_official numeric(12,2),              -- preço atual real na FIPE
  fipe_match_score    numeric(3,2),               -- confiança do match 0-1

  -- Características
  tires               text,                       -- '4 BONS' | '2 BONS + 2 FRACOS' | etc
  optionals           text[],                     -- ['MULTIMIDIA', 'COURO', 'TETO SOLAR']
  expenses            text,                       -- '4 PEÇAS, MARTELINHO' (texto livre)
  expenses_estimated  numeric(12,2),              -- estimado pela IA
  notes               text,                       -- observações
  has_manual          boolean,
  has_spare_key       boolean,
  recovered_accident  boolean DEFAULT false,        -- "recuperado de sinistro"

  -- Negociador
  seller_name         text,
  seller_phone        text,
  location            text,                       -- 'JOINVILLE-SC'

  -- Metadados
  posted_at           timestamptz NOT NULL,
  status              text DEFAULT 'active',      -- 'active' | 'sold' | 'expired' | 'deleted'
  raw_text            text NOT NULL,              -- mensagem original para auditoria
  parser_confidence   numeric(3,2),               -- 0-1 confiança da extração

  -- Deduplicação
  fingerprint         text,                       -- hash para detectar repostagens
  duplicate_of        uuid REFERENCES offers(id) ON DELETE SET NULL,

  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_brand_model_year ON offers(brand, model_normalized, year_model);
CREATE INDEX IF NOT EXISTS idx_offers_posted_at ON offers(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_offers_fipe_pct ON offers(fipe_pct);
CREATE INDEX IF NOT EXISTS idx_offers_fingerprint ON offers(fingerprint);

-- =====================================================
-- 4. CACHE DA FIPE (para não bater toda hora na API)
-- =====================================================
CREATE TABLE IF NOT EXISTS fipe_cache (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fipe_code         text NOT NULL,
  reference_month   text NOT NULL,                -- '2026-05'
  brand             text NOT NULL,
  model             text NOT NULL,
  year_model        int NOT NULL,
  fuel              text,
  price             numeric(12,2) NOT NULL,
  fetched_at        timestamptz DEFAULT now(),
  UNIQUE(fipe_code, year_model, reference_month)
);

-- =====================================================
-- 5. HISTÓRICO DE PREÇO (mesmo carro, várias datas)
-- =====================================================
CREATE TABLE IF NOT EXISTS price_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand           text NOT NULL,
  model_normalized text NOT NULL,
  year_model      int NOT NULL,
  km_range        text,                           -- '50-70k', '70-100k', etc
  fipe_price      numeric(12,2),
  market_avg      numeric(12,2),                  -- média de preços anunciados na semana
  market_min      numeric(12,2),
  market_max      numeric(12,2),
  sample_size     int,
  week_start      date NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_lookup ON price_history(brand, model_normalized, year_model, week_start DESC);

-- =====================================================
-- 6. DEAL SCORES (avaliação de cada oferta)
-- =====================================================
CREATE TABLE IF NOT EXISTS deal_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id        uuid REFERENCES offers(id) ON DELETE CASCADE,
  score           int NOT NULL,                   -- 0-100
  rating          text NOT NULL,                  -- 'EXCELENTE' | 'BOM' | 'MEDIO' | 'RUIM' | 'EVITAR'
  reasons         jsonb,                          -- {below_fipe: -8, low_km: +5, recovered: -15}
  computed_at     timestamptz DEFAULT now()
);

-- =====================================================
-- 7. WATCHLIST (lojista monitora modelos específicos)
-- =====================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  brand           text,
  model_pattern   text,                           -- 'TRACKER%' ou 'ONIX LT%'
  year_min        int,
  year_max        int,
  km_max          int,
  max_price       numeric(12,2),
  min_fipe_pct    numeric(5,2),                   -- 'só me avise se for <85% da FIPE'
  notify_whatsapp boolean DEFAULT true,
  active          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- Habilitar Row Level Security (RLS) para as tabelas criadas
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fipe_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso básicas (Leitura/Escrita para usuários autenticados)
-- E leitura livre/anon quando for o caso (ex: FIPE cache ou leitura de ofertas se necessário, mas por segurança, apenas autenticados)
CREATE POLICY "Permitir leitura para usuários autenticados em sources" ON sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuários autenticados em sources" ON sources FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir leitura para usuários autenticados em raw_messages" ON raw_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuários autenticados em raw_messages" ON raw_messages FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir leitura para usuários autenticados em offers" ON offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuários autenticados em offers" ON offers FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir leitura para usuários autenticados em fipe_cache" ON fipe_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuários autenticados em fipe_cache" ON fipe_cache FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir leitura para usuários autenticados em price_history" ON price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuários autenticados em price_history" ON price_history FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir leitura para usuários autenticados em deal_scores" ON deal_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuários autenticados em deal_scores" ON deal_scores FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir tudo para o dono na watchlist" ON watchlist FOR ALL TO authenticated USING (auth.uid() = user_id);
