-- Adiciona a coluna valor_minimo
ALTER TABLE alertas_clientes ADD COLUMN IF NOT EXISTS valor_minimo numeric;

-- Atualiza a função do gatilho (Trigger) para suportar valor_minimo
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
      valor_minimo,
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
      -- Filtro de Preço Mínimo
      AND (
        valor_minimo IS NULL 
        OR NEW.preco_pedido >= valor_minimo
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
          NEW.modelo NOT ILIKE '%aut%' 
          AND NEW.modelo NOT ILIKE '%cvt%'
          AND NEW.detalhes_mecanica_estetica NOT ILIKE '%aut%'
          AND NEW.detalhes_mecanica_estetica NOT ILIKE '%cvt%'
        ))
      )
      -- Filtro de Combustível
      AND (
        combustivel IS NULL 
        OR TRIM(combustivel) = ''
        OR NEW.modelo ILIKE '%' || TRIM(combustivel) || '%'
        OR NEW.detalhes_mecanica_estetica ILIKE '%' || TRIM(combustivel) || '%'
      )
  LOOP
    -- Monta o payload JSON a ser enviado via webhook para este alerta/carro
    payload := json_build_object(
      'alerta_id', alerta.id,
      'cliente_nome', alerta.nome_cliente,
      'cliente_telefone', alerta.telefone_cliente,
      'carro_id', NEW.id,
      'carro_marca', NEW.marca,
      'carro_modelo', NEW.modelo,
      'carro_ano', NEW.ano_modelo,
      'carro_preco', NEW.preco_pedido,
      'carro_fipe', NEW.fipe_preco,
      'carro_desagio_pct', NEW.fipe_pct,
      'carro_km', NEW.km,
      'carro_url', NEW.url_veiculo,
      'alerta_filtros', json_build_object(
        'marca_desejada', alerta.marca,
        'modelo_desejado', alerta.modelo,
        'valor_minimo', alerta.valor_minimo,
        'valor_maximo', alerta.valor_maximo,
        'ano_minimo', alerta.ano_minimo,
        'ano_maximo', alerta.ano_maximo,
        'cor', alerta.cor,
        'cambio', alerta.cambio,
        'combustivel', alerta.combustivel,
        'km_minimo', alerta.km_minimo,
        'km_maximo', alerta.km_maximo
      ),
      'timestamp', CURRENT_TIMESTAMP
    )::text;

    -- Dispara a requisição HTTP POST assíncrona para o webhook (n8n)
    -- Importante: A extensão pg_net (net.http_post) precisa estar habilitada
    PERFORM net.http_post(
      url := 'https://n8n.drivvoo.com/webhook/d1911d38-9289-4771-b4e4-d0e25590cf65',
      body := payload::jsonb,
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
