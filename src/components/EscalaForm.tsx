import { useState, useEffect, FormEvent } from "react";
import { Escala, TipoEscala, StatusDataBase } from "../types";
import { Save, X, CalendarCheck, Clock, ShieldAlert, Sparkles } from "lucide-react";

interface EscalaFormProps {
  escalaEmEdicao?: Escala | null;
  onSave: (escala: Omit<Escala, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }) => void;
  onCancel: () => void;
}

export default function EscalaForm({ escalaEmEdicao, onSave, onCancel }: EscalaFormProps) {
  const [nomeEscala, setNomeEscala] = useState("");
  const [tipoEscala, setTipoEscala] = useState<TipoEscala>("12x36");
  const [horasTrabalho, setHorasTrabalho] = useState(12);
  const [horasFolga, setHorasFolga] = useState(36);
  const [dataBase, setDataBase] = useState("");
  const [statusDataBase, setStatusDataBase] = useState<StatusDataBase>("trabalhando");
  const [horarioInicio, setHorarioInicio] = useState("07:00");
  const [horarioFim, setHorarioFim] = useState("19:00");
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());

  // Set default values if editing
  useEffect(() => {
    if (escalaEmEdicao) {
      setNomeEscala(escalaEmEdicao.nomeEscala);
      setTipoEscala(escalaEmEdicao.tipoEscala);
      setHorasTrabalho(escalaEmEdicao.horasTrabalho);
      setHorasFolga(escalaEmEdicao.horasFolga);
      setDataBase(escalaEmEdicao.dataBase);
      setStatusDataBase(escalaEmEdicao.statusDataBase);
      setHorarioInicio(escalaEmEdicao.horarioInicio || "07:00");
      setHorarioFim(escalaEmEdicao.horarioFim || "19:00");
      // Derive year if there is one, or current
      const dbYear = escalaEmEdicao.dataBase ? parseYear(escalaEmEdicao.dataBase) : new Date().getFullYear();
      setAnoReferencia(dbYear);
    } else {
      // Default to today formatted YYYY-MM-DD
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setDataBase(`${yyyy}-${mm}-${dd}`);
      setNomeEscala("");
      setTipoEscala("12x36");
      setHorasTrabalho(12);
      setHorasFolga(36);
      setStatusDataBase("trabalhando");
      setHorarioInicio("07:00");
      setHorarioFim("19:00");
      setAnoReferencia(yyyy);
    }
  }, [escalaEmEdicao]);

  const parseYear = (dateStr: string) => {
    if (!dateStr) return new Date().getFullYear();
    const parts = dateStr.split("-");
    const y = parseInt(parts[0], 10);
    return isNaN(y) ? new Date().getFullYear() : y;
  };

  // Adjust hours when preset scale changes
  const handleTipoEscalaChange = (tipo: TipoEscala) => {
    setTipoEscala(tipo);
    if (tipo === "12x36") {
      setHorasTrabalho(12);
      setHorasFolga(36);
      setHorarioFim(calculateEndTime("07:00", 12));
    } else if (tipo === "24x48") {
      setHorasTrabalho(24);
      setHorasFolga(48);
      setHorarioFim("07:00"); // 24 hours ends on adjacent day start hour
    } else if (tipo === "24x72") {
      setHorasTrabalho(24);
      setHorasFolga(72);
      setHorarioFim("07:00");
    }
  };

  // Helper helper to calculateEndTime
  const calculateEndTime = (startStr: string, duration: number): string => {
    try {
      const [h, m] = startStr.split(":").map(Number);
      if (isNaN(h) || isNaN(m)) return "19:00";
      const totalH = (h + duration) % 24;
      return `${String(totalH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    } catch {
      return "19:00";
    }
  };

  const handleStartHourChange = (val: string) => {
    setHorarioInicio(val);
    if (tipoEscala !== "personalizada") {
      setHorarioFim(calculateEndTime(val, horasTrabalho));
    }
  };

  const handleCustomWorkHoursChange = (val: number) => {
    setHorasTrabalho(val);
    setHorarioFim(calculateEndTime(horarioInicio, val));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nomeEscala.trim()) {
      alert("Por favor, preencha o nome da escala!");
      return;
    }
    if (!dataBase) {
      alert("Por favor, selecione uma data-base!");
      return;
    }

    onSave({
      id: escalaEmEdicao?.id, // keep original ID if editing
      userId: escalaEmEdicao?.userId || null,
      nomeEscala: nomeEscala.trim(),
      tipoEscala,
      horasTrabalho,
      horasFolga,
      dataBase,
      statusDataBase,
      horarioInicio,
      horarioFim,
      excecoes: escalaEmEdicao?.excecoes || {},
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 id="form-title" className="text-base font-bold text-gray-800 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-blue-600" />
          {escalaEmEdicao ? "Editar Minha Escala" : "Cadastrar Nova Escala"}
        </h3>
        <button
          id="btn-close-form"
          onClick={onCancel}
          className="rounded-full p-1.5 text-gray-405 hover:bg-gray-50 hover:text-gray-650 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name input */}
        <div>
          <label htmlFor="input-nome-escala" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Nome da Escala *
          </label>
          <input
            id="input-nome-escala"
            type="text"
            required
            value={nomeEscala}
            onChange={(e) => setNomeEscala(e.target.value)}
            placeholder="Ex: Plantão Hospital Municipal"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tipo de Escala Radio Selectors */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Tipo de Escala
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(["12x36", "24x48", "24x72", "personalizada"] as TipoEscala[]).map((tipo) => (
              <button
                id={`btn-tipo-${tipo}`}
                key={tipo}
                type="button"
                onClick={() => handleTipoEscalaChange(tipo)}
                className={`relative rounded-xl border py-2.5 text-xs font-bold transition cursor-pointer ${
                  tipoEscala === tipo
                    ? "border-blue-500 bg-blue-50/50 text-blue-600 ring-1 ring-blue-500"
                    : "border-gray-200 bg-white text-gray-650 hover:bg-gray-50/50"
                }`}
              >
                {tipo === "personalizada" ? "Personalizada" : tipo}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Hour Controls if Custom is selected */}
        {tipoEscala === "personalizada" && (
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-blue-50/10 border border-blue-500/10 p-3">
            <div>
              <label htmlFor="input-custom-work" className="block text-xxs font-bold text-blue-600 uppercase mb-1">
                Horas de Plantão (Trabalho)
              </label>
              <input
                id="input-custom-work"
                type="number"
                min="1"
                max="168"
                required
                value={horasTrabalho}
                onChange={(e) => handleCustomWorkHoursChange(parseInt(e.target.value, 10) || 12)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="input-custom-off" className="block text-xxs font-bold text-blue-600 uppercase mb-1">
                Horas de Descanso (Folga)
              </label>
              <input
                id="input-custom-off"
                type="number"
                min="1"
                max="168"
                required
                value={horasFolga}
                onChange={(e) => setHorasFolga(parseInt(e.target.value, 10) || 36)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Baseline Date configuration */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="input-data-base" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Data-base para Cálculo *
            </label>
            <input
              id="input-data-base"
              type="date"
              required
              value={dataBase}
              onChange={(e) => setDataBase(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
            <p className="mt-1 text-xxs text-gray-400">
              Escolha uma data de início onde você sabe com certeza se trabalhou ou folgou.
            </p>
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Status nessa Data-base *
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-status-trabalhando"
                type="button"
                onClick={() => setStatusDataBase("trabalhando")}
                className={`rounded-xl border py-2.5 text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                  statusDataBase === "trabalhando"
                    ? "border-orange-400 bg-orange-50 text-orange-700 ring-1 ring-orange-400"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50/50"
                }`}
              >
                <span>Trabalhando</span>
                <span className="text-[10px] font-normal opacity-70">(Plantão)</span>
              </button>
              <button
                id="btn-status-folga"
                type="button"
                onClick={() => setStatusDataBase("folga")}
                className={`rounded-xl border py-2.5 text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                  statusDataBase === "folga"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-400"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50/50"
                }`}
              >
                <span>De Folga</span>
                <span className="text-[10px] font-normal opacity-70">(Descanso)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Time configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="input-hora-inicio" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Hora de Início
            </label>
            <div className="relative">
              <input
                id="input-hora-inicio"
                type="time"
                value={horarioInicio}
                onChange={(e) => handleStartHourChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-hora-fim" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Hora de Término
            </label>
            <input
              id="input-hora-fim"
              type="time"
              value={horarioFim}
              onChange={(e) => setHorarioFim(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Exemplo explicativo no rodapé do formulário */}
        <div className="rounded-xl bg-blue-50/10 border border-blue-200/20 p-3 text-xs text-gray-500 flex gap-2">
          <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-700 block mb-0.5">Como funciona o ciclo?</span>
            Pela escala <strong className="text-gray-700">{horasTrabalho}x{horasFolga}</strong>, o ciclo total dura {horasTrabalho + horasFolga} horas ({Math.round((horasTrabalho + horasFolga) / 24)} dias). O aplicativo projeta esse ciclo continuamente ao longo do ano.
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="btn-cancel-form"
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="btn-submit-form"
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-750 shadow-lg shadow-blue-200/50 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Salvar Escala
          </button>
        </div>
      </form>
    </div>
  );
}
