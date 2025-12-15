/**
 * Serviço de análise de sentimentos
 * 
 * Calcula sentimentos a partir das notas e usa IA para categorizar
 * comentários, extrair elogios e reclamações.
 */

import type { Avaliacao, Sentimento, CategoriaComentario, AnaliseSentimentos, Elogio, Reclamacao } from '@/types';
import { categorizarComentario } from './avaliacaoDetailService';

/**
 * Classifica sentimento baseado na nota
 */
export function classificarSentimento(nota: number): Sentimento {
  if (nota >= 4) return 'positivo';
  if (nota === 3) return 'neutro';
  return 'negativo';
}

/**
 * Calcula distribuição de sentimentos a partir das avaliações
 */
export function calcularDistribuicaoSentimentos(avaliacoes: Avaliacao[]): {
  positivo: number;
  neutro: number;
  negativo: number;
  total: number;
} {
  const distribuicao = {
    positivo: 0,
    neutro: 0,
    negativo: 0,
    total: avaliacoes.length,
  };

  avaliacoes.forEach((av) => {
    const sentimento = classificarSentimento(av.nota);
    distribuicao[sentimento]++;
  });

  return distribuicao;
}

/**
 * Categoriza comentários usando a mesma lógica de Avaliações Detalhadas
 */
function categorizarComentarios(comentarios: string[]): Map<string, number> {
  const categorias = new Map<string, number>();
  
  comentarios.forEach((comentario) => {
    if (comentario && comentario.trim().length > 0) {
      const categoria = categorizarComentario(comentario);
      categorias.set(categoria, (categorias.get(categoria) || 0) + 1);
    }
  });

  return categorias;
}

/**
 * Extrai principais elogios usando IA, categorizados
 * Analisa TODOS os comentários positivos e identifica os motivos pelos quais foram positivos
 */
async function extrairElogiosComIA(comentarios: string[]): Promise<Elogio[]> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:64',message:'extrairElogiosComIA called',data:{comentariosCount:comentarios.length,hasApiKey:!!process.env.OPENAI_API_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
  // #endregion
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || comentarios.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:66',message:'extrairElogiosComIA early return',data:{reason:!apiKey?'no-api-key':'no-comments',comentariosCount:comentarios.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    return [];
  }

  try {
    // Usa todos os comentários, mas limita para evitar exceder tokens (máximo ~200)
    const comentariosLimitados = comentarios.slice(0, 200);

    const prompt = `Você é um analista especializado em feedback de clientes. Analise TODOS os seguintes comentários POSITIVOS de avaliações de uma loja de artigos esportivos.

Sua tarefa é identificar os PRINCIPAIS MOTIVOS pelos quais os clientes deixaram avaliações positivas. Para cada motivo, você deve:
1. Agrupar comentários semelhantes que mencionam o mesmo aspecto positivo
2. Contar quantas vezes cada motivo foi mencionado
3. Criar uma descrição clara e específica do motivo
4. Categorizar o motivo em uma das categorias abaixo

Categorias disponíveis:
- Atendimento: aspectos relacionados ao atendimento, cordialidade, eficiência, educação dos funcionários (ex: "Atendimento cordial e eficiente", "Rapidez no atendimento", "Funcionários prestativos")
- Ambiente: aspectos relacionados à limpeza, organização, estrutura física da loja (ex: "Ambiente limpo e organizado", "Loja bem estruturada")
- Produtos: aspectos relacionados à qualidade, variedade, disponibilidade de produtos (ex: "Produtos de alta qualidade", "Boa variedade de produtos")
- Preços: aspectos relacionados a valores, promoções, competitividade (ex: "Preços competitivos", "Bons descontos")
- Tempo de Espera: aspectos relacionados à rapidez, espera, agilidade (ex: "Atendimento rápido", "Sem demora")

TODOS os comentários positivos para análise:
${comentariosLimitados.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Analise cada comentário e identifique qual(is) motivo(s) positivo(s) ele menciona. Agrupe comentários que mencionam o mesmo motivo e conte as ocorrências.

Retorne APENAS um JSON válido (sem markdown) com esta estrutura:
{
  "elogios": [
    {"texto": "Atendimento cordial e eficiente", "mencoes": 15},
    {"texto": "Produtos de alta qualidade", "mencoes": 12},
    {"texto": "Ambiente limpo e organizado", "mencoes": 10},
    {"texto": "Rapidez no atendimento", "mencoes": 8},
    {"texto": "Preços competitivos", "mencoes": 6}
  ]
}

IMPORTANTE:
- Máximo de 5 elogios, ordenados por número de menções (maior para menor)
- Cada elogio deve representar um motivo específico e categorizado
- O campo "mencoes" deve ser o número real de comentários que mencionam aquele motivo
- Use descrições claras e específicas que resumam o motivo positivo`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista especializado em identificar padrões positivos em feedback. Retorne apenas JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const respostaTexto = data.choices[0]?.message?.content || '{}';
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:137',message:'OpenAI response received for elogios',data:{responseOk:response.ok,status:response.status,hasChoices:!!data.choices,respostaTextoLength:respostaTexto.length,respostaTextoPreview:respostaTexto.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    const respostaJson = JSON.parse(respostaTexto.replace(/```json\n?|\n?```/g, ''));
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:139',message:'JSON parsed for elogios',data:{hasElogios:!!respostaJson.elogios,isArray:Array.isArray(respostaJson.elogios),elogiosLength:Array.isArray(respostaJson.elogios)?respostaJson.elogios.length:0,keys:Object.keys(respostaJson)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion

    if (Array.isArray(respostaJson.elogios)) {
      const result = respostaJson.elogios.slice(0, 5);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:142',message:'returning elogios',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return result;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:145',message:'elogios not array, returning empty',data:{respostaJsonKeys:Object.keys(respostaJson)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return [];
  } catch (error) {
    console.error('Erro ao extrair elogios com IA:', error);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:147',message:'error extracting elogios',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    return [];
  }
}

/**
 * Extrai principais reclamações usando IA, categorizadas
 * Analisa TODOS os comentários negativos e identifica os motivos pelos quais foram negativos
 */
async function extrairReclamacoesComIA(comentarios: string[]): Promise<Reclamacao[]> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:156',message:'extrairReclamacoesComIA called',data:{comentariosCount:comentarios.length,hasApiKey:!!process.env.OPENAI_API_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
  // #endregion
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || comentarios.length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:158',message:'extrairReclamacoesComIA early return',data:{reason:!apiKey?'no-api-key':'no-comments',comentariosCount:comentarios.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    return [];
  }

  try {
    // Usa todos os comentários, mas limita para evitar exceder tokens (máximo ~200)
    const comentariosLimitados = comentarios.slice(0, 200);

    const prompt = `Você é um analista especializado em feedback de clientes. Analise TODOS os seguintes comentários NEGATIVOS de avaliações de uma loja de artigos esportivos.

Sua tarefa é identificar os PRINCIPAIS MOTIVOS pelos quais os clientes deixaram avaliações negativas. Para cada motivo, você deve:
1. Agrupar comentários semelhantes que mencionam o mesmo problema ou aspecto negativo
2. Contar quantas vezes cada motivo foi mencionado
3. Criar uma descrição clara e específica do motivo
4. Categorizar o motivo em uma das categorias abaixo

Categorias disponíveis:
- Tempo de Espera: aspectos relacionados a demora, filas, lentidão (ex: "Tempo de espera elevado", "Demora no atendimento")
- Produtos: aspectos relacionados à falta, qualidade, disponibilidade de produtos (ex: "Falta de produtos em estoque", "Produtos de baixa qualidade")
- Preços: aspectos relacionados a valores altos, falta de promoções (ex: "Preços acima da média", "Produtos caros")
- Atendimento: aspectos relacionados a falta de atenção, má educação, ineficiência (ex: "Atendimento desatencioso", "Funcionários mal educados")
- Ambiente: aspectos relacionados a desorganização, sujeira, estrutura (ex: "Ambiente desorganizado", "Loja suja")
- Outros: outros problemas não categorizados acima (ex: "Dificuldade para trocas", "Problemas com garantia")

TODOS os comentários negativos para análise:
${comentariosLimitados.map((c, i) => `${i + 1}. "${c}"`).join('\n')}

Analise cada comentário e identifique qual(is) motivo(s) negativo(s) ele menciona. Agrupe comentários que mencionam o mesmo problema e conte as ocorrências.

Retorne APENAS um JSON válido (sem markdown) com esta estrutura:
{
  "reclamacoes": [
    {"texto": "Tempo de espera elevado", "mencoes": 12},
    {"texto": "Falta de produtos em estoque", "mencoes": 10},
    {"texto": "Preços acima da média", "mencoes": 8},
    {"texto": "Atendimento desatencioso", "mencoes": 6},
    {"texto": "Dificuldade para trocas", "mencoes": 5}
  ]
}

IMPORTANTE:
- Máximo de 5 reclamações, ordenadas por número de menções (maior para menor)
- Cada reclamação deve representar um motivo específico e categorizado
- O campo "mencoes" deve ser o número real de comentários que mencionam aquele problema
- Use descrições claras e específicas que resumam o motivo negativo`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista especializado em identificar problemas recorrentes em feedback. Retorne apenas JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      // #region agent log
      const errorText = await response.text().catch(() => '');
      fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:225',message:'OpenAI API error for reclamações',data:{status:response.status,statusText:response.statusText,errorText:errorText.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const respostaTexto = data.choices[0]?.message?.content || '{}';
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:229',message:'OpenAI response received for reclamações',data:{responseOk:response.ok,status:response.status,hasChoices:!!data.choices,respostaTextoLength:respostaTexto.length,respostaTextoPreview:respostaTexto.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    const respostaJson = JSON.parse(respostaTexto.replace(/```json\n?|\n?```/g, ''));
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:231',message:'JSON parsed for reclamações',data:{hasReclamacoes:!!respostaJson.reclamacoes,isArray:Array.isArray(respostaJson.reclamacoes),reclamacoesLength:Array.isArray(respostaJson.reclamacoes)?respostaJson.reclamacoes.length:0,keys:Object.keys(respostaJson)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
    // #endregion

    if (Array.isArray(respostaJson.reclamacoes)) {
      const result = respostaJson.reclamacoes.slice(0, 5);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:234',message:'returning reclamações',data:{resultLength:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return result;
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:237',message:'reclamações not array, returning empty',data:{respostaJsonKeys:Object.keys(respostaJson)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return [];
  } catch (error) {
    console.error('Erro ao extrair reclamações com IA:', error);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:239',message:'error extracting reclamações',data:{errorMessage:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    return [];
  }
}

/**
 * Gera análise completa de sentimentos
 */
export async function gerarAnaliseSentimentos(avaliacoes: Avaliacao[]): Promise<AnaliseSentimentos> {
  // 1. Calcula distribuição de sentimentos
  const distribuicaoSentimentos = calcularDistribuicaoSentimentos(avaliacoes);

  // 2. Separa comentários positivos e negativos
  const comentariosPositivos = avaliacoes
    .filter((av) => av.comentario && av.nota >= 4)
    .map((av) => av.comentario!);

  const comentariosNegativos = avaliacoes
    .filter((av) => av.comentario && av.nota <= 2)
    .map((av) => av.comentario!);

  const todosComentarios = avaliacoes
    .filter((av) => av.comentario)
    .map((av) => av.comentario!);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:252',message:'separated comments',data:{totalAvaliacoes:avaliacoes.length,comentariosPositivosCount:comentariosPositivos.length,comentariosNegativosCount:comentariosNegativos.length,todosComentariosCount:todosComentarios.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  // 3. Categoriza comentários usando a mesma lógica de Avaliações Detalhadas
  const categoriasMap = categorizarComentarios(todosComentarios);
  const distribuicaoCategorias: { [key: string]: number } = {};
  categoriasMap.forEach((valor, chave) => {
    distribuicaoCategorias[chave] = valor;
  });

  // 4. Extrai elogios e reclamações com IA (executa em paralelo para melhor performance)
  const [principaisElogios, principaisReclamacoes] = await Promise.all([
    extrairElogiosComIA(comentariosPositivos),
    extrairReclamacoesComIA(comentariosNegativos),
  ]);

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a7ad799c-5aa9-4168-8bc7-3a82c3fd7a9d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sentimentAnalysisService.ts:277',message:'returning analysis',data:{principaisElogiosLength:principaisElogios?.length||0,principaisReclamacoesLength:principaisReclamacoes?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  return {
    distribuicaoSentimentos,
    distribuicaoCategorias,
    principaisElogios: principaisElogios || [],
    principaisReclamacoes: principaisReclamacoes || [],
    geradoEm: new Date(),
  };
}
