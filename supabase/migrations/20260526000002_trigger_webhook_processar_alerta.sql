-- 1. Remove o gatilho antigo da tabela repassecentral (que disparava o webhook direto do banco)
DROP TRIGGER IF EXISTS trigger_alerta_repasse ON repassecentral;

-- 2. Remove o gatilho se já existir a nova versão
DROP TRIGGER IF EXISTS trigger_notificar_api_repasse ON repassecentral;

-- 3. Cria a função que notifica a Serverless Route do Next.js enviando o novo veículo inserido
CREATE OR REPLACE FUNCTION notificar_api_novo_repasse()
RETURNS TRIGGER AS $$
DECLARE
  payload text;
  admin_key text;
  webhook_url text;
BEGIN
  -- Busca a chave secreta dos parâmetros de configuração do banco (ou assume a padrão se nulo)
  admin_key := coalesce(current_setting('app.settings.admin_secret_key', true), 'manos_intel_secret_key');
  
  -- Monta a URL dinâmica usando o domínio de produção
  webhook_url := 'https://vyro.drivvoo.com/api/webhooks/processar-alerta?admin_key=' || admin_key;

  -- Monta o payload contendo a linha inserida no campo 'record'
  payload := json_build_object(
    'record', row_to_json(NEW)
  )::text;

  -- Dispara a requisição HTTP POST assíncrona para a Serverless Route
  PERFORM net.http_post(
    url := webhook_url,
    body := payload::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Cria o novo gatilho (Trigger) na tabela repassecentral
CREATE TRIGGER trigger_notificar_api_repasse
AFTER INSERT ON repassecentral
FOR EACH ROW
EXECUTE FUNCTION notificar_api_novo_repasse();
