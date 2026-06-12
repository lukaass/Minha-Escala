import { Escala, CalculoDia, StatusExcecao } from "../types";

/**
 * Formats a given Date object into local "YYYY-MM-DD" style.
 */
export function formatLocalDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parses a "YYYY-MM-DD" local date string into a Date object at midnight.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

const DIAS_SEMANA_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

/**
 * Calculates the shift and off status for a target date given a user scale.
 * 
 * Logic details:
 * - We find the duration of the entire work+off cycle in hours.
 * - We find the difference in hours between the target date (evaluated 1 hour after shift start time) 
 *   and the baseline date (at the shift start time).
 * - We apply modulo algebra to account for past or future dates.
 * - If manual overrides (excecoes) exist for the target date, they take precedence.
 */
export function calcularStatusDia(escala: Escala, targetDate: Date): "plantao" | "folga" | "ferias" | "atestado" {
  const dateStr = formatLocalDateString(targetDate);
  
  // 1. Check for manual overrides/excecoes
  if (escala.excecoes && escala.excecoes[dateStr]) {
    return escala.excecoes[dateStr];
  }

  // 2. Parse schedule configurations
  let workHours = escala.horasTrabalho;
  let offHours = escala.horasFolga;

  if (escala.tipoEscala === "12x36") {
    workHours = 12;
    offHours = 36;
  } else if (escala.tipoEscala === "24x48") {
    workHours = 24;
    offHours = 48;
  } else if (escala.tipoEscala === "24x72") {
    workHours = 24;
    offHours = 72;
  }

  const cicloTotalHoras = workHours + offHours;
  if (!cicloTotalHoras || cicloTotalHoras <= 0) {
    return "folga";
  }

  // Parse start hour of baseline shift: default to 07:00
  let startH = 7;
  let startM = 0;
  if (escala.horarioInicio && escala.horarioInicio.includes(":")) {
    const [h, m] = escala.horarioInicio.split(":").map(Number);
    if (!isNaN(h)) startH = h;
    if (!isNaN(m)) startM = m;
  }

  // Base shift datetime at browser local timezone
  const baseDateTime = parseLocalDate(escala.dataBase);
  baseDateTime.setHours(startH, startM, 0, 0);

  // Target datetime to inspect of that day.
  // We check 1 hour after the shift starts inside the target date to ensure 
  // we capture the active shift on that day without border timezone glitches.
  const targetCheckTime = new Date(targetDate);
  targetCheckTime.setHours(startH + 1, startM, 0, 0);

  // Time difference in hours
  const diffMs = targetCheckTime.getTime() - baseDateTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // JavaScript modulo handle negative numbers gracefully
  const moduloHours = ((diffHours % cicloTotalHoras) + cicloTotalHoras) % cicloTotalHoras;

  if (escala.statusDataBase === "trabalhando") {
    // Base cycle starts with "Working" then "Off"
    return moduloHours < workHours ? "plantao" : "folga";
  } else {
    // Base cycle starts with "Off" then "Working"
    return moduloHours < offHours ? "folga" : "plantao";
  }
}

/**
 * Builds rich schedule query results for a specific target date
 */
export function obterDetalhesData(escala: Escala, targetDate: Date, referenceDate: Date = new Date()): CalculoDia {
  const dateStr = formatLocalDateString(targetDate);
  const status = calcularStatusDia(escala, targetDate);
  
  // Calculate original scale status (ignoring exceptions) for audit
  const escalaSemExcecoes: Escala = { ...escala, excecoes: {} };
  const statusOriginal = calcularStatusDia(escalaSemExcecoes, targetDate);

  // Clean midnight dates to compute days remaining accurately
  const dTarget = parseLocalDate(dateStr);
  const dRef = parseLocalDate(formatLocalDateString(referenceDate));

  const offsetMs = dTarget.getTime() - dRef.getTime();
  const diferencaDias = Math.round(offsetMs / (1000 * 60 * 60 * 24));

  return {
    data: dateStr,
    dataObj: dTarget,
    status,
    diaDaSemanaNome: DIAS_SEMANA_PT[dTarget.getDay()],
    diferencaDias,
    escalaOriginal: statusOriginal,
    isExcecao: status !== statusOriginal,
  };
}

/**
 * Finds the next shift and next day off starting from a specific target date
 */
export function encontrarProximosMarcos(escala: Escala, startDate: Date) {
  let nextShift: Date | null = null;
  let nextOff: Date | null = null;

  // Search up to 365 days into the future
  for (let i = 1; i <= 365; i++) {
    const nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + i);
    const status = calcularStatusDia(escala, nextDate);

    if (status === "plantao" && !nextShift) {
      nextShift = nextDate;
    }
    if (status === "folga" && !nextOff) {
      nextOff = nextDate;
    }

    if (nextShift && nextOff) {
      break;
    }
  }

  return { nextShift, nextOff };
}
