import { useState, useEffect } from "react";
import { Escala } from "../types";
import { 
  obterDetalhesData, 
  encontrarProximosMarcos, 
  parseLocalDate, 
  formatLocalDateString 
} from "../utils/escalaCalculator";
import { CalendarSearch, Share2, AlertTriangle, ChevronRight } from "lucide-react";

interface ConsultaDataProps {
  escala: Escala;
  onSelectDate: (date: Date) => void;
  defaultDate?: string;
}

export default function ConsultaData({ escala, onSelectDate, defaultDate }: ConsultaDataProps) {
  const [dataConsulta, setDataConsulta] = useState(() => {
    if (defaultDate) return defaultDate;
    // Default to today + 1 (tomorrow) for convenient default lookup
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatLocalDateString(tomorrow);
  });

  const [resultado, setResultado] = useState<ReturnType<typeof obterDetalhesData> | null>(null);
  const [indicadores, setIndicadores] = useState<{ nextShift: Date | null; nextOff: Date | null } | null>(null);

  // Re-calculate whenever scale or queried date updates
  useEffect(() => {
    if (!escala || !dataConsulta) return;

    try {
      const parsed = parseLocalDate(dataConsulta);
      const detalhes = obterDetalhesData(escala, parsed);
      setResultado(detalhes);

      const marcos = encontrarProximosMarcos(escala, parsed);
      setIndicadores(marcos);
    } catch (e) {
      console.error("Erro ao calcular escala para data informada:", e);
    }
  }, [escala, dataConsulta]);

  const handleChangeDate = (val: string) => {
    setDataConsulta(val);
    if (val) {
      const parsed = parseLocalDate(val);
      onSelectDate(parsed);
    }
  };

  const handleShareWhatsApp = () => {
    if (!resultado) return;

    const formattedDate = resultado.data.split("-").reverse().join("/");
    let statusTexto = "";
    if (resultado.status === "plantao") {
      statusTexto = "🔴 de PLANTÃO 🏥";
    } else if (resultado.status === "folga") {
      statusTexto = "🟢 de FOLGA 😎";
    } else if (resultado.status === "ferias") {
      statusTexto = "🌴 de FÉRIAS 🎉";
    } else {
      statusTexto = "🩹 de ATESTADO MÉDICO 🩺";
    }

    const mensagem = `Olá! Consultei minha escala no aplicativo *Minha Escala*:\n\n📅 No dia *${formattedDate}* (${resultado.diaDaSemanaNome}), eu estarei *${statusTexto}*.\n\nEscala: ${escala.nomeEscala} (${escala.tipoEscala})\nConsulte você também a sua! `;
    const link = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
    window.open(link, "_blank");
  };

  const formatShortDate = (date: Date | null) => {
    if (!date) return "-";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const diaSemana = [
      "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"
    ][date.getDay()];
    return `${dd}/${mm}/${yyyy} (${diaSemana})`;
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
        <CalendarSearch className="h-5 w-5 text-blue-600" />
        <h3 className="text-base font-bold text-gray-805">Consultar uma Data</h3>
      </div>

      <div className="space-y-4">
        {/* Date selection input */}
        <div>
          <label htmlFor="input-consulta-data" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 border-none">
            Selecione a Data
          </label>
          <input
            id="input-consulta-data"
            type="date"
            value={dataConsulta}
            onChange={(e) => handleChangeDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-805 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Calculated result display */}
        {resultado && (
          <div className="space-y-4">
            
            {/* Main status feedback banner */}
            <div
              id="box-resultado-status"
              className={`rounded-2xl border p-4 text-center transition-all ${
                resultado.status === "plantao"
                  ? "border-orange-100 bg-orange-50/45 text-orange-900"
                  : resultado.status === "folga"
                  ? "border-emerald-100 bg-emerald-50/45 text-emerald-900"
                  : resultado.status === "ferias"
                  ? "border-amber-100 bg-amber-50/45 text-amber-950"
                  : "border-blue-105 bg-blue-50/45 text-blue-900"
              }`}
            >
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                {resultado.diaDaSemanaNome}
              </div>
              
              <div className="my-1.5 text-lg font-black text-gray-805 sm:text-xl">
                {resultado.data.split("-").reverse().join("/")}
              </div>

              <div id="resultado-status-badge" className="inline-flex items-center gap-2 rounded-xl px-5 py-1.5 text-xs font-bold shadow-sm bg-white uppercase tracking-wider border border-gray-105">
                <span className={`h-2.5 w-2.5 rounded-full ${
                  resultado.status === "plantao" ? "bg-orange-500" :
                  resultado.status === "folga" ? "bg-emerald-500" :
                  resultado.status === "ferias" ? "bg-amber-400" : "bg-blue-550"
                }`} />
                {resultado.status === "plantao" && <span className="text-orange-850">De Plantão</span>}
                {resultado.status === "folga" && <span className="text-emerald-800">De Folga</span>}
                {resultado.status === "ferias" && <span className="text-amber-850">De Férias</span>}
                {resultado.status === "atestado" && <span className="text-blue-800">Atestado Médico</span>}
              </div>

              {resultado.isExcecao && (
                <div className="mt-2.5 text-[10px] font-semibold text-gray-500 flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Este dia possui alteração manual (Original: {resultado.escalaOriginal === "plantao" ? "Plantão" : "Folga"})
                </div>
              )}

              {/* Day details */}
              <div id="contagem-regressiva-txt" className="mt-3 text-xs font-bold text-gray-600">
                {resultado.diferencaDias === 0 && "É hoje! 🎉"}
                {resultado.diferencaDias === 1 && "Falta 1 dia (Amanhã!) 🌅"}
                {resultado.diferencaDias > 1 && `Faltam ${resultado.diferencaDias} dias`}
                {resultado.diferencaDias === -1 && "Foi ontem! 🕰️"}
                {resultado.diferencaDias < -1 && `Ocorreu há ${Math.abs(resultado.diferencaDias)} dias`}
              </div>
            </div>

            {/* Next shifts predictions layout */}
            <div className="grid grid-cols-1 gap-2 rounded-xl bg-gray-50/50 border border-gray-100 p-3 text-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-500 flex items-center gap-1.5 font-semibold">
                  Próximo Plantão:
                </span>
                <span className="font-extrabold text-orange-600">
                  {formatShortDate(indicadores?.nextShift || null)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-gray-500 flex items-center gap-1.5 font-semibold">
                  Próxima Folga:
                </span>
                <span className="font-extrabold text-emerald-600">
                  {formatShortDate(indicadores?.nextOff || null)}
                </span>
              </div>
            </div>

            {/* Share layout */}
            <div className="flex justify-center pt-1.5">
              <button
                id="btn-whatsapp-share"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-green-200/50 hover:brightness-105 transition cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>Compartilhar</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
