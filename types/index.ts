export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';

export type EstadoUF = 
  | 'AC' | 'AL' | 'AP' | 'AM' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MT' | 'MS' | 'MG' | 'PA' | 'PB' | 'PR' | 'PE' | 'PI'
  | 'RJ' | 'RN' | 'RS' | 'RO' | 'RR' | 'SC' | 'SP' | 'SE' | 'TO';

export interface Loja {
  id: string;
  nome: string;
  codigo?: string; // Código da loja do Excel (ex: "CE01", "CE02")
  place_id: string;
  estado: EstadoUF;
  regiao: Regiao;
  endereco?: string;
  cidade?: string;
  time?: string; // Coluna "Time" do Excel (ex: "Esquadrão 40 graus", "Águias do Cerrado")
}

export interface Avaliacao {
  id: string;
  loja_id: string;
  place_id: string;
  data: Date;
  nota: 1 | 2 | 3 | 4 | 5;
  comentario?: string;
  autor?: string;
  autor_url?: string;
  data_avaliacao_maps?: Date;
}

export interface DistribuicaoNotas {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface MetricasQuantitativas {
  notaMedia: number;
  totalAvaliacoes: number;
  distribuicao: DistribuicaoNotas;
  notaMediaPorPeriodo: Array<{
    data: string;
    notaMedia: number;
    total: number;
  }>;
}

export interface RankingLoja {
  loja_id: string;
  nome: string;
  codigo?: string; // Código da loja (ex: "CE01", "CE02")
  estado: EstadoUF;
  regiao: Regiao;
  notaMedia: number;
  totalAvaliacoes: number;
  posicao: number;
}

export interface AnaliseQualitativa {
  nivel: 'macro' | 'intermediario' | 'micro';
  escopo: string; // 'rede' | 'regiao:XX' | 'estado:XX' | 'loja:XXX'
  pontosFortes: string[];
  pontosFracos: string[];
  tendencias: string[];
  oportunidades: string[];
  resumo?: string;
  reclamacoesFrequentes?: string[];
  destaquesPositivos?: string[];
  planosAcao?: string[];
  geradoEm: Date;
}

export interface FiltrosDashboard {
  regiao?: Regiao;
  estado?: EstadoUF;
  regional?: string; // Filtro por Time (nomeado como "Regional" no frontend)
  lojaId?: string;
}

export interface MapsReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface MapsPlaceDetails {
  place_id: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: MapsReview[];
}

export type Sentimento = 'positivo' | 'neutro' | 'negativo';

export type CategoriaComentario = 
  | 'Atendimento' 
  | 'Ambiente' 
  | 'Tempo de Espera' 
  | 'Produtos' 
  | 'Preços' 
  | 'Outros';

export interface Elogio {
  texto: string;
  mencoes: number;
}

export interface Reclamacao {
  texto: string;
  mencoes: number;
}

export interface AnaliseSentimentos {
  distribuicaoSentimentos: {
    positivo: number;
    neutro: number;
    negativo: number;
    total: number;
  };
  distribuicaoCategorias: { [key: string]: number };
  principaisElogios: Elogio[];
  principaisReclamacoes: Reclamacao[];
  geradoEm: Date;
}

