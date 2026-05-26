-- 1. Adiciona as novas colunas à tabela alertas_clientes se elas não existirem
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS ano_minimo integer;
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS ano_maximo integer;
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS cor text;
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS cambio text;
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS combustivel text;
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS km_minimo integer;
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS km_maximo integer;

-- 2. Atualiza a função do gatilho (Trigger) com validações avançadas
CREATE OR REPLACE FUNCTION processar_alerta_repasse()
RETURNS TRIGGER AS $$
DECLARE
  alerta RECORD;
  payload text;
  carro_ano integer;
BEGIN
  -- Tenta extrair o ano do carro a partir do campo ano_modelo (ex: "2015/2015" ou "2015")
  BEGIN
    carro_ano := substring(NEW.ano_modelo from '\d{4}')::integer;
  EXCEPTION WHEN OTHERS THEN
    carro_ano := NULL;
  END;

  -- Percorre todos os alertas ativos cadastrados
  FOR alerta IN 
    SELECT 
      id,
      nome_cliente,
      telefone_cliente,
      marca,
      modelo,
      valor_maximo,
      ano_minimo,
      ano_maximo,
      cor,
      cambio,
      combustivel,
      km_minimo,
      km_maximo
    FROM alertas_clientes
    WHERE ativo = true
      -- Filtro de Marca
      AND (
        marca = 'OUTROS' 
        OR UPPER(TRIM(marca)) = UPPER(TRIM(NEW.marca))
      )
      -- Filtro de Preço Máximo
      AND (
        valor_maximo IS NULL 
        OR NEW.preco_pedido <= valor_maximo
      )
      -- Filtro de Modelo (Palavras-chave separadas por vírgula)
      AND EXISTS (
        SELECT 1
        FROM unnest(string_to_array(modelo, ',')) AS termo
        WHERE NEW.modelo ILIKE '%' || TRIM(termo) || '%'
      )
      -- Filtro de Ano Mínimo
      AND (
        ano_minimo IS NULL 
        OR carro_ano IS NULL 
        OR carro_ano >= ano_minimo
      )
      -- Filtro de Ano Máximo
      AND (
        ano_maximo IS NULL 
        OR carro_ano IS NULL 
        OR carro_ano <= ano_maximo
      )
      -- Filtro de KM Mínimo
      AND (
        km_minimo IS NULL 
        OR NEW.km IS NULL 
        OR NEW.km >= km_minimo
      )
      -- Filtro de KM Máximo
      AND (
        km_maximo IS NULL 
        OR NEW.km IS NULL 
        OR NEW.km <= km_maximo
      )
      -- Filtro de Cor
      AND (
        cor IS NULL 
        OR TRIM(cor) = ''
        OR NEW.modelo ILIKE '%' || TRIM(cor) || '%'
        OR NEW.detalhes_mecanica_estetica ILIKE '%' || TRIM(cor) || '%'
      )
      -- Filtro de Câmbio (AUTOMATICO ou MANUAL)
      AND (
        cambio IS NULL 
        OR TRIM(cambio) = ''
        OR (UPPER(TRIM(cambio)) = 'AUTOMATICO' AND (
          NEW.modelo ILIKE '%aut%' 
          OR NEW.modelo ILIKE '%cvt%'
          OR NEW.detalhes_mecanica_estetica ILIKE '%aut%' 
          OR NEW.detalhes_mecanica_estetica ILIKE '%cvt%'
        ))
        OR (UPPER(TRIM(cambio)) = 'MANUAL' AND (
          NEW.modelo ILIKE '%man%' 
          OR NEW.modelo ILIKE '%manual%'
          OR NEW.detalhes_mecanica_estetica ILIKE '%man%' 
          OR NEW.detalhes_mecanica_estetica ILIKE '%manual%'
        ))
      )
      -- Filtro de Combustível
      AND (
        combustivel IS NULL 
        OR TRIM(combustivel) = ''
        OR NEW.modelo ILIKE '%' || TRIM(combustivel) || '%'
        OR NEW.detalhes_mecanica_estetica ILIKE '%' || TRIM(combustivel) || '%'
        OR (UPPER(TRIM(combustivel)) = 'FLEX' AND (
          NEW.modelo ILIKE '%flex%' 
          OR NEW.detalhes_mecanica_estetica ILIKE '%flex%'
        ))
      )
  LOOP
    -- Monta o payload JSON contendo os dados do veículo, interessado e detalhes adicionais
    payload := json_build_object(
      'veiculo_nome', NEW.marca || ' ' || NEW.modelo,
      'contato_nome', alerta.nome_cliente,
      'contato_telefone', alerta.telefone_cliente,
      'preco_pedido', NEW.preco_pedido,
      'km', NEW.km,
      'ano_modelo', NEW.ano_modelo,
      'cor_carro', NEW.detalhes_mecanica_estetica, -- cor pode estar nos detalhes
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

-- 3. Reconstrói o gatilho (Trigger) na tabela repassecentral
DROP TRIGGER IF EXISTS trigger_alerta_repasse ON repassecentral;
CREATE TRIGGER trigger_alerta_repasse
AFTER INSERT ON repassecentral
FOR EACH ROW
EXECUTE FUNCTION processar_alerta_repasse();
