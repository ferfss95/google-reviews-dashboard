/**
 * Utilitários para manipulação de datas
 */

import { format, parseISO } from 'date-fns';

/**
 * Converte string ISO para Date
 */
export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Formata data para exibição
 */
export function formatDate(date: Date, formatStr: string = 'dd/MM/yyyy'): string {
  return format(date, formatStr);
}

/**
 * Converte Date para string ISO
 */
export function dateToISO(date: Date): string {
  return date.toISOString();
}

