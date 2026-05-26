export async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    
    let data: any = null;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      // Se retornou JSON, tenta usar a mensagem de erro fornecida pelo backend
      if (data && data.error) {
        throw new Error(data.error);
      }
      
      // Trata erros comuns de indisponibilidade (atualizações/limites de CPU no Hostinger)
      if (res.status === 503 || res.status === 502) {
        throw new Error('O servidor está temporariamente indisponível ou em manutenção (Erro 503). Por favor, aguarde alguns segundos e tente novamente.');
      }
      
      if (res.status === 504) {
        throw new Error('Tempo limite de resposta do servidor esgotado. Por favor, tente novamente.');
      }
      
      throw new Error(`O servidor retornou um status inesperado (Erro ${res.status}).`);
    }

    // Se a resposta foi bem-sucedida mas o corpo não é JSON (ex: resposta vazia)
    if (data === null) {
      return { success: true };
    }

    return data;
  } catch (err: any) {
    // Se já for uma mensagem estruturada por nós, propaga ela
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Não foi possível conectar ao servidor. Por favor, verifique sua conexão com a internet.');
  }
}
