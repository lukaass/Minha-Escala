import { useState, useEffect } from "react";
import { Escala, StatusExcecao } from "../types";
import { 
  calcularStatusDia, 
  formatLocalDateString, 
  parseLocalDate 
} from "../utils/escalaCalculator";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Edit3, 
  Plus, 
  RotateCcw, 
  Umbrella, 
  Activity, 
  Home, 
  Briefcase,
  Check,
  Download,
  Printer
} from "lucide-react";
import { jsPDF } from "jspdf";

interface CalendarioAnualProps {
  escala: Escala;
  focusedDate: Date | null;
  onUpdateEscalaExcecoes: (novasExcecoes: Record<string, StatusExcecao>) => void;
  onSelectDate: (date: Date) => void;
}

const MESES_NOMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DIAS_SEMANA_SIGLAS = ["D", "S", "T", "Q", "Q", "S", "S"];

export default function CalendarioAnual({ 
  escala, 
  focusedDate, 
  onUpdateEscalaExcecoes,
  onSelectDate
}: CalendarioAnualProps) {
  // Navigation states
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Interactive day editing state
  const [selectedDayToEdit, setSelectedDayToEdit] = useState<{ date: Date; dateStr: string; status: "plantao" | "folga" | "ferias" | "atestado" | "padrao" } | null>(null);

  // Multi-day selection states
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMultiDays, setSelectedMultiDays] = useState<string[]>([]);

  // Focus calendar when queried date changes externally
  useEffect(() => {
    if (focusedDate) {
      setCurrentMonth(focusedDate.getMonth());
      setCurrentYear(focusedDate.getFullYear());
    }
  }, [focusedDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate matrix grid of days in currentMonth
  const getDaysInMonthMatrix = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekDay = firstDay.getDay(); // 0 is Sunday, 6 Saturday
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysCount = lastDay.getDate();

    const matrix: (Date | null)[] = [];
    
    // Fill blank prefix spaces
    for (let i = 0; i < startWeekDay; i++) {
      matrix.push(null);
    }

    // Fill dates
    for (let d = 1; d <= daysCount; d++) {
      matrix.push(new Date(currentYear, currentMonth, d));
    }

    return matrix;
  };

  const daysMatrix = getDaysInMonthMatrix();
  const todayStr = formatLocalDateString(today);
  const focusedStr = focusedDate ? formatLocalDateString(focusedDate) : null;

  // Handles click to edit override status on a day
  const handleDayClick = (date: Date) => {
    const dateStr = formatLocalDateString(date);

    if (isMultiSelectMode) {
      setSelectedMultiDays((prev) => {
        if (prev.includes(dateStr)) {
          return prev.filter((d) => d !== dateStr);
        } else {
          return [...prev, dateStr];
        }
      });
      onSelectDate(date);
      return;
    }

    const statusAtual = calcularStatusDia(escala, date);
    
    // Check if there is an explicit exception stored
    const exceptionValue = escala.excecoes && escala.excecoes[dateStr];
    const statusSelectValue = exceptionValue ? exceptionValue : "padrao";

    setSelectedDayToEdit({
      date,
      dateStr,
      status: statusSelectValue as any,
    });

    onSelectDate(date);
  };

  const handleApplyMultiStatus = (newStatus: "plantao" | "folga" | "ferias" | "atestado" | "padrao") => {
    if (selectedMultiDays.length === 0) return;

    const novasExcecoes = { ...(escala.excecoes || {}) };

    selectedMultiDays.forEach((dateStr) => {
      if (newStatus === "padrao") {
        delete novasExcecoes[dateStr];
      } else {
        novasExcecoes[dateStr] = newStatus as StatusExcecao;
      }
    });

    onUpdateEscalaExcecoes(novasExcecoes);
    setSelectedMultiDays([]);
    setIsMultiSelectMode(false);
  };

  const handleSaveException = (newStatus: "plantao" | "folga" | "ferias" | "atestado" | "padrao") => {
    if (!selectedDayToEdit) return;

    const { dateStr } = selectedDayToEdit;
    const novasExcecoes = { ...(escala.excecoes || {}) };

    if (newStatus === "padrao") {
      delete novasExcecoes[dateStr];
    } else {
      novasExcecoes[dateStr] = newStatus as StatusExcecao;
    }

    onUpdateEscalaExcecoes(novasExcecoes);
    setSelectedDayToEdit(null);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // 1. Header design
    doc.setFillColor(37, 99, 235); // Blue-600 accent
    doc.rect(15, 15, 180, 4, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text("DOCUMENTO OFICIAL DE ESCALA DE TRABALHO", 15, 28);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const dataExport = new Date().toLocaleDateString("pt-BR") + " as " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    doc.text(`Relatorio emitido em ${dataExport} | Plataforma de Escala`, 15, 34);

    // 2. Info details container
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 39, 180, 26, 3, 3, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("INFORMACOES DA ESCALA ATIVA", 20, 45);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nome da Escala: ${escala.nomeEscala}`, 20, 51);
    
    const regimeLabel = escala.tipoEscala === "personalizada" 
      ? `Regime: Personalizado (${escala.horasTrabalho}x${escala.horasFolga}h)` 
      : `Regime: ${escala.tipoEscala}`;
    doc.text(regimeLabel, 20, 57);

    const dataBaseFormat = escala.dataBase.split("-").reverse().join("/");
    doc.text(`Inicio da Escala: ${dataBaseFormat}`, 110, 51);
    doc.text(`Horario do Plantao: ${escala.horarioInicio} as ${escala.horarioFim}`, 110, 57);

    // 3. Month section Title
    const mesNome = MESES_NOMES[currentMonth];
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`Grade Mensal: ${mesNome.toUpperCase()} / ${currentYear}`, 15, 75);

    // 4. Grid header / Days of week
    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
    const colWidth = 25;
    const rowHeight = 18;
    const gridStartX = 17.5; // Centers the 175mm grid (7 * 25) inside 180mm content area
    
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    
    for (let i = 0; i < 7; i++) {
      const x = gridStartX + i * colWidth;
      doc.text(diasSemana[i], x + 12.5, 81, { align: "center" });
    }

    // Grid matrix
    let r = 0;
    let c = 0;
    
    daysMatrix.forEach((date) => {
      const x = gridStartX + c * colWidth;
      const y = 84 + r * rowHeight;

      if (date) {
        const dateStr = formatLocalDateString(date);
        const status = calcularStatusDia(escala, date);
        const hasManualOverride = escala.excecoes && !!escala.excecoes[dateStr];

        // Status coloring definitions for PDF printing
        let fillRGB = [255, 255, 255];
        let borderRGB = [226, 232, 240];
        let textRGB = [71, 85, 105];
        let label = "FOLGA";

        if (status === "plantao") {
          fillRGB = [255, 247, 237]; // orange-50
          borderRGB = [253, 186, 116]; // orange-300
          textRGB = [194, 65, 12]; // orange-700
          label = "PLANTAO";
        } else if (status === "folga") {
          fillRGB = [236, 253, 245]; // emerald-50
          borderRGB = [167, 243, 208]; // emerald-300
          textRGB = [6, 95, 70]; // emerald-700
          label = "FOLGA";
        } else if (status === "ferias") {
          fillRGB = [254, 243, 199]; // amber-50
          borderRGB = [252, 211, 77]; // amber-300
          textRGB = [146, 64, 14]; // amber-800
          label = "FERIAS";
        } else if (status === "atestado") {
          fillRGB = [239, 246, 255]; // blue-50
          borderRGB = [191, 219, 254]; // blue-300
          textRGB = [30, 64, 175]; // blue-700
          label = "ATESTADO";
        }

        // Cell container background & border
        doc.setFillColor(fillRGB[0], fillRGB[1], fillRGB[2]);
        doc.setDrawColor(borderRGB[0], borderRGB[1], borderRGB[2]);
        doc.setLineWidth(0.25);
        doc.roundedRect(x + 1, y, 23, 15, 1.5, 1.5, "FD");

        // Day number
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(textRGB[0], textRGB[1], textRGB[2]);
        doc.text(String(date.getDate()), x + 3, y + 4.5);

        // Status identifier text label
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(label, x + 3, y + 11.5);

        // Dot markup for manual override exceptions
        if (hasManualOverride) {
          doc.setFillColor(15, 23, 42); // slate-800
          doc.circle(x + 20, y + 3.5, 0.7, "F");
        }
      } else {
        // Draw thin gray empty boxes for pad gaps
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.15);
        doc.roundedRect(x + 1, y, 23, 15, 1.5, 1.5, "FD");
      }

      // Matrix pointer incremental progress
      c += 1;
      if (c === 7) {
        c = 0;
        r += 1;
      }
    });

    // 5. Build dynamically calculated count stats
    let totalPlantoes = 0;
    let totalFolgas = 0;
    let totalFerias = 0;
    let totalAtestados = 0;

    daysMatrix.forEach((date) => {
      if (date) {
        const status = calcularStatusDia(escala, date);
        if (status === "plantao") totalPlantoes++;
        else if (status === "folga") totalFolgas++;
        else if (status === "ferias") totalFerias++;
        else if (status === "atestado") totalAtestados++;
      }
    });

    // Statistics layout positioning anchor
    const statsY = 196;

    // Resumo de Atividades card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, statsY, 180, 27, 3, 3, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text("ESTATISTICAS DA JORNADA MENSAL", 20, statsY + 6);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    const plantaoHoras = totalPlantoes * escala.horasTrabalho;
    doc.text(`- Plantoes cumpridos: ${totalPlantoes} (${plantaoHoras}h estimadas)`, 20, statsY + 13);
    doc.text(`- Total de folgas regulares: ${totalFolgas}`, 20, statsY + 20);
    
    doc.text(`- Dias de ferias registradas: ${totalFerias}`, 110, statsY + 13);
    doc.text(`- Dias de afastamento (Atestado): ${totalAtestados}`, 110, statsY + 20);

    // 6. Legend Guide Container
    const legendY = 229;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(15, legendY, 180, 16, 2, 2, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(115, 115, 115);
    doc.text("Legenda:", 20, legendY + 10);

    // Legend item coordinates (horizontal columns)
    // ITEM 1: PLANTÃO
    doc.setFillColor(255, 247, 237);
    doc.setDrawColor(253, 186, 116);
    doc.rect(38, legendY + 7, 3.5, 3.5, "FD");
    doc.setFont("Helvetica", "normal");
    doc.text("Plantao", 44, legendY + 10);

    // ITEM 2: FOLGA
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.rect(73, legendY + 7, 3.5, 3.5, "FD");
    doc.text("Folga", 79, legendY + 10);

    // ITEM 3: FÉRIAS
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(252, 211, 77);
    doc.rect(106, legendY + 7, 3.5, 3.5, "FD");
    doc.text("Ferias", 112, legendY + 10);

    // ITEM 4: ATESTADO
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.rect(139, legendY + 7, 3.5, 3.5, "FD");
    doc.text("Atestado", 145, legendY + 10);

    // ITEM 5: MANUAL MODIFIED
    doc.setFillColor(15, 23, 42);
    doc.circle(173, legendY + 8.5, 0.6, "F");
    doc.text("Manual", 176, legendY + 10);

    // 7. Signature area (officially validated structure)
    const sigY = 255;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(15, sigY + 13, 95, sigY + 13);
    doc.line(115, sigY + 13, 195, sigY + 13);

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Assinatura do Profissional", 55, sigY + 17, { align: "center" });
    doc.text("Assinatura do Supervisor / RH", 155, sigY + 17, { align: "center" });

    // Header branding & metadata line
    doc.text("Documento oficial gerado digitalmente para homologacao e controle de escalas.", 105, 287, { align: "center" });

    // Save triggers download dialogue
    const safeScaleName = escala.nomeEscala.toLowerCase().replace(/[^a-z0-9]/g, "_") || "escala";
    doc.save(`escala_${safeScaleName}_${currentYear}_${currentMonth + 1}.pdf`);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 relative">
      
      {/* Calendar Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-gray-800">Calendário de Plantões</h3>
          </div>
          <span className="text-xxs text-gray-400">
            {isMultiSelectMode ? (
              <span className="text-indigo-600 font-bold animate-pulse">● Modo Seleção Múltipla Ativo</span>
            ) : (
              "Toque em um dia para alterar ou use a seleção de vários dias"
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          {/* Export PDF Button */}
          <button
            id="btn-export-pdf-header"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-650 transition-all hover:bg-gray-50 hover:text-gray-950 cursor-pointer shadow-sm"
            title="Exportar Escala Mensal Oficial em PDF"
          >
            <Download className="h-3.5 w-3.5 text-blue-600" />
            <span>Exportar PDF</span>
          </button>

          {/* Multi-select toggle button */}
          <button
            id="btn-toggle-multi-select"
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              setSelectedMultiDays([]);
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              isMultiSelectMode
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-gray-650 hover:bg-gray-50 hover:text-gray-950"
            }`}
          >
            {isMultiSelectMode ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span>{isMultiSelectMode ? "Sair da Seleção" : "Selecionar Vários"}</span>
          </button>

          <div className="flex items-center gap-1">
            {/* Navigate Left */}
            <button
              id="btn-calendar-prev"
              onClick={handlePrevMonth}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Month & Year Selection Banner */}
            <span className="min-w-[120px] text-center text-sm font-black text-gray-700">
              {MESES_NOMES[currentMonth]} {currentYear}
            </span>

            {/* Navigate Right */}
            <button
              id="btn-calendar-next"
              onClick={handleNextMonth}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Titles Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xxs font-bold uppercase tracking-wider text-gray-400 mb-1">
        {DIAS_SEMANA_SIGLAS.map((day, idx) => (
          <div key={idx} className="py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Monthly grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysMatrix.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square bg-gray-50/20 rounded-xl" />;
          }

          const dateStr = formatLocalDateString(date);
          const isToday = dateStr === todayStr;
          const isFocused = dateStr === focusedStr;
          const isSelectedInMulti = selectedMultiDays.includes(dateStr);
          const status = calcularStatusDia(escala, date);
          const hasManualOverride = escala.excecoes && !!escala.excecoes[dateStr];

          // Determine styles
          let statusBg = "bg-white border-gray-150 hover:bg-gray-50";
          let statusText = "text-gray-700";

          if (status === "plantao") {
            statusBg = "bg-orange-50 hover:bg-orange-100 border-orange-150";
            statusText = "text-orange-900 font-bold";
          } else if (status === "folga") {
            statusBg = "bg-emerald-50 hover:bg-emerald-100 border-emerald-150";
            statusText = "text-emerald-950 font-bold";
          } else if (status === "ferias") {
            statusBg = "bg-amber-50 hover:bg-amber-100 border-amber-200";
            statusText = "text-amber-805 font-bold";
          } else if (status === "atestado") {
            statusBg = "bg-blue-50 hover:bg-blue-105 border-blue-200";
            statusText = "text-blue-900 font-bold";
          }

          return (
            <button
              id={`btn-dia-calendario-${dateStr}`}
              key={dateStr}
              onClick={() => handleDayClick(date)}
              className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center text-xs transition active:scale-95 cursor-pointer ${statusBg} ${statusText} ${
                isFocused ? "ring-2 ring-blue-600 ring-offset-1 z-10 font-bold" : ""
              } ${
                isSelectedInMulti ? "ring-2 ring-indigo-600 bg-indigo-100/80 border-indigo-300 z-10 font-black scale-95" : ""
              }`}
            >
              <span className="relative z-10">{date.getDate()}</span>

              {/* Status indicator badge dot */}
              {hasManualOverride && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-gray-750" title="Modificado manualmente" />
              )}

              {/* Today indicator emblem */}
              {isToday && (
                <div className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Multi-Selection Control Panel */}
      {isMultiSelectMode && selectedMultiDays.length > 0 && (
        <div className="mt-4 rounded-2xl border border-indigo-150 bg-indigo-50/40 p-4 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
              <div>
                <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                  {selectedMultiDays.length} {selectedMultiDays.length === 1 ? "dia selecionado" : "dias selecionados"} para alteração múltipla
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  Clique nos dias no calendário para selecioná-los ou remarcá-los. Escolha a ação abaixo:
                </p>
              </div>
              <button
                id="btn-clear-selection"
                onClick={() => setSelectedMultiDays([])}
                className="text-xxs font-bold text-indigo-600 hover:text-indigo-805 hover:underline cursor-pointer"
              >
                Limpar seleção ({selectedMultiDays.length})
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                id="btn-multi-choice-ferias"
                onClick={() => handleApplyMultiStatus("ferias")}
                className="inline-flex items-center gap-1 hover:brightness-105 rounded-xl bg-amber-500 px-3 py-1.5 text-xxs font-black text-white transition cursor-pointer shadow-sm"
              >
                <Umbrella className="h-3 w-3" />
                <span>Registrar Férias 🌴</span>
              </button>

              <button
                id="btn-multi-choice-atestado"
                onClick={() => handleApplyMultiStatus("atestado")}
                className="inline-flex items-center gap-1 hover:brightness-105 rounded-xl bg-blue-600 px-3 py-1.5 text-xxs font-black text-white transition cursor-pointer shadow-sm"
              >
                <Activity className="h-3 w-3" />
                <span>Registrar Atestado 🩺</span>
              </button>

              <button
                id="btn-multi-choice-plantao"
                onClick={() => handleApplyMultiStatus("plantao")}
                className="inline-flex items-center gap-1 hover:brightness-105 rounded-xl bg-orange-500 px-3 py-1.5 text-xxs font-black text-white transition cursor-pointer shadow-sm"
              >
                <Briefcase className="h-3 w-3" />
                <span>Forçar Plantão (Trabalho)</span>
              </button>

              <button
                id="btn-multi-choice-folga"
                onClick={() => handleApplyMultiStatus("folga")}
                className="inline-flex items-center gap-1 hover:brightness-105 rounded-xl bg-emerald-600 px-3 py-1.5 text-xxs font-black text-white transition cursor-pointer shadow-sm"
              >
                <Home className="h-3 w-3" />
                <span>Forçar Folga (Descanso)</span>
              </button>

              <button
                id="btn-multi-choice-padrao"
                onClick={() => handleApplyMultiStatus("padrao")}
                className="inline-flex items-center gap-1 hover:bg-gray-200 rounded-xl bg-gray-150 px-3 py-1.5 text-xxs font-black text-gray-700 transition cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Limpar (Ciclo Padrão)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Legends Guide */}
      <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-gray-50/50 p-3 text-xxs sm:grid-cols-4 sm:gap-4 border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-orange-400 border border-orange-200" />
          <span className="font-semibold text-gray-500">Plantão</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-emerald-400 border border-emerald-250/30" />
          <span className="font-semibold text-gray-500">Folga</span>
        </div>
        <div className="flex items-center gap-1.5 font-sans">
          <span className="h-3 w-3 rounded-md bg-amber-300 border border-amber-200" />
          <span className="font-semibold text-gray-500 flex items-center gap-0.5">Férias 🌴</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-md bg-blue-300 border border-blue-200" />
          <span className="font-semibold text-gray-500 flex items-center gap-0.5">Atestado 🩺</span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5 text-xxs text-gray-400 border-t border-gray-100 pt-3">
        <p>💡 <strong className="text-gray-600">Toque em qualquer dia</strong> no calendário acima para realizar alterações manuais, cadastrar folgas, férias ou trocas de plantões!</p>
        <div className="flex justify-between items-center mt-1">
          <p>📍 Ponto azul destaca o dia de hoje.</p>
        </div>
      </div>

      {/* Manual Override Custom Dialog */}
      {selectedDayToEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-150 bg-white p-5 shadow-xl animate-in fade-in zoom-in duration-150">
            <h4 id="dialog-header-edit" className="text-sm font-bold text-gray-800 flex items-center gap-1.5 border-b border-gray-100 pb-2.5 mb-3 font-sans">
              <Edit3 className="h-4 w-4 text-blue-650" />
              Alterar Dia: {selectedDayToEdit.dateStr.split("-").reverse().join("/")}
            </h4>
            
            <p className="text-xxs text-gray-500 mb-4 leading-relaxed font-semibold">
              Defina se deseja marcar este dia como folga extra, férias, atestado ou plantão. Isso atualizará automaticamente os cálculos e relatórios.
            </p>

            <div className="space-y-2">
              <button
                id="btn-choice-padrao"
                onClick={() => handleSaveException("padrao")}
                className={`w-full text-left rounded-xl border p-2.5 text-xs transition flex items-center justify-between cursor-pointer ${
                  selectedDayToEdit.status === "padrao"
                    ? "border-blue-500 bg-blue-50/15 font-bold text-blue-750"
                    : "border-gray-200 bg-white text-gray-650 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-gray-550" />
                  Calcular pelo ciclo da escala (Padrão)
                </span>
              </button>

              <button
                id="btn-choice-plantao"
                onClick={() => handleSaveException("plantao")}
                className={`w-full text-left rounded-xl border p-2.5 text-xs transition flex items-center justify-between cursor-pointer ${
                  selectedDayToEdit.status === "plantao"
                    ? "border-orange-400 bg-orange-50 font-bold text-orange-700"
                    : "border-gray-200 bg-white text-gray-650 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-orange-550" />
                  Forçar Plantão (Trabalhando)
                </span>
                <span className="text-xxs rounded bg-orange-100 px-1 text-orange-700">Modificado</span>
              </button>

              <button
                id="btn-choice-folga"
                onClick={() => handleSaveException("folga")}
                className={`w-full text-left rounded-xl border p-2.5 text-xs transition flex items-center justify-between cursor-pointer ${
                  selectedDayToEdit.status === "folga"
                    ? "border-emerald-400 bg-emerald-50/70 font-bold text-emerald-800"
                    : "border-gray-200 bg-white text-gray-650 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-emerald-555" />
                  Forçar Folga (Descanso)
                </span>
                <span className="text-xxs rounded bg-emerald-100 px-1 text-emerald-700">Modificado</span>
              </button>

              <button
                id="btn-choice-ferias"
                onClick={() => handleSaveException("ferias")}
                className={`w-full text-left rounded-xl border p-2.5 text-xs transition flex items-center justify-between cursor-pointer ${
                  selectedDayToEdit.status === "ferias"
                    ? "border-amber-400 bg-amber-50 font-bold text-amber-800"
                    : "border-gray-200 bg-white text-gray-650 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Umbrella className="h-4 w-4 text-amber-550" />
                  Registrar Férias 🌴
                </span>
                <span className="text-xxs rounded bg-amber-100 px-1 text-amber-705 font-sans">Especial</span>
              </button>

              <button
                id="btn-choice-atestado"
                onClick={() => handleSaveException("atestado")}
                className={`w-full text-left rounded-xl border p-2.5 text-xs transition flex items-center justify-between cursor-pointer ${
                  selectedDayToEdit.status === "atestado"
                    ? "border-blue-400 bg-blue-50 font-bold text-blue-800"
                    : "border-gray-200 bg-white text-gray-650 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-550" />
                  Atestado Médico 🩺
                </span>
                <span className="text-xxs rounded bg-blue-100 px-1 text-blue-700">Afastado</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-gray-100 mt-4">
              <button
                id="btn-close-edit-dialog"
                onClick={() => setSelectedDayToEdit(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Notice Educational Dialog / Alternative workflow */}
    </div>
  );
}
