/**
 * Utilitários para formatação e manipulação de dados de lojas
 */

import type { Loja } from '@/types';

/**
 * Formata o nome da loja incluindo o código no formato "CEXX - Nome da loja"
 */
export function formatarNomeLoja(loja: Loja): string {
  if (loja.codigo) {
    return `${loja.codigo} - ${loja.nome}`;
  }
  return loja.nome;
}

/**
 * Formata o nome da loja a partir de nome e código separados
 */
export function formatarNomeLojaComCodigo(nome: string, codigo?: string): string {
  if (codigo) {
    return `${codigo} - ${nome}`;
  }
  return nome;
}

/**
 * Extrai o número do código da loja (ex: "CE20" -> 20, "CE1101" -> 1101)
 * Retorna Infinity se não houver código, para que lojas sem código fiquem por último
 */
export function extrairNumeroCodigo(loja: Loja): number {
  if (!loja.codigo) {
    return Infinity;
  }
  
  // Remove "CE" e pega o número restante
  const match = loja.codigo.match(/CE(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  return Infinity;
}

/**
 * Ordena lojas por número do código (crescente)
 * Lojas sem código ficam por último
 */
export function ordenarLojasPorCodigo(lojas: Loja[]): Loja[] {
  return [...lojas].sort((a, b) => {
    const numA = extrairNumeroCodigo(a);
    const numB = extrairNumeroCodigo(b);
    return numA - numB;
  });
}
