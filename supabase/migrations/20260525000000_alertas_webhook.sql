-- Habilita a extensão pg_net para chamadas HTTP assíncronas do PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Cria a função que será disparada pelo gatilho (Trigger)
CREATE OR REPLACE FUNCTION processar_alerta_repasse()
RETURNS TRIGGER AS $$
DECLARE
  alerta RECORD;
  payload text;
BEGIN
  -- Percorre todos os alertas ativos cadastrados
  FOR alerta IN 
    SELECT 
      id,
      nome_cliente,
      telefone_cliente,
      marca,
      modelo,
      valor_maximo
    FROM alertas_clientes
    WHERE ativo = true
      AND (
        marca = 'OUTROS' 
        OR UPPER(TRIM(marca)) = UPPER(TRIM(NEW.marca))
      )
      AND (
        valor_maximo IS NULL 
        OR NEW.preco_pedido <= valor_maximo
      )
      AND EXISTS (
        SELECT 1
        FROM unnest(string_to_array(modelo, ',')) AS termo
        WHERE NEW.modelo ILIKE '%' || TRIM(termo) || '%'
      )
  LOOP
    -- Monta o payload JSON contendo os dados do veículo e do interessado
    payload := json_build_object(
      'veiculo_nome', NEW.marca || ' ' || NEW.modelo,
      'contato_nome', alerta.nome_cliente,
      'contato_telefone', alerta.telefone_cliente,
      'preco_pedido', NEW.preco_pedido,
      'alerta_id', alerta.id,
      'repasse_id', NEW.id
    )::text;

    -- Dispara a requisição HTTP POST assíncrona para o webhook do n8n
    PERFORM net.http_post(
      url := 'https://n8n.drivvoo.com/webhook/d1911d38-9289-4771-b4e4-d0e25590cf65',
      body := payload,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o gatilho (Trigger) na tabela repassecentral
DROP TRIGGER IF EXISTS trigger_alerta_repasse ON repassecentral;
CREATE TRIGGER trigger_alerta_repasse
AFTER INSERT ON repassecentral
FOR EACH ROW
EXECUTE FUNCTION processar_alerta_repasse();
