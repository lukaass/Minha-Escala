export type TipoEscala = "12x36" | "24x48" | "24x72" | "personalizada";
export type StatusDataBase = "trabalhando" | "folga";
export type StatusExcecao = "plantao" | "folga" | "ferias" | "atestado";

export interface Escala {
  id: string;
  userId: string | null; // null if stored in localStorage (non-logged-in profile)
  nomeEscala: string;
  tipoEscala: TipoEscala;
  horasTrabalho: number; // e.g., 12, 24, or custom hours
  horasFolga: number;    // e.g., 36, 48, 72, or custom hours
  dataBase: string;      // "YYYY-MM-DD"
  statusDataBase: StatusDataBase;
  horarioInicio: string;  // "HH:MM"
  horarioFim: string;     // "HH:MM"
  excecoes?: Record<string, StatusExcecao>; // Key: "YYYY-MM-DD", Value: StatusExcecao
  criadoEm: string;       // ISO date string
  atualizadoEm: string;   // ISO date string
}

export interface CalculoDia {
  data: string;          // "YYYY-MM-DD"
  dataObj: Date;
  status: "plantao" | "folga" | "ferias" | "atestado";
  diaDaSemanaNome: string;
  diferencaDias: number;  // Relative to query or current day
  escalaOriginal: string; // The base status before overrides
  isExcecao: boolean;    // If there is a manual override on this day
}
