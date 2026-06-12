import { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import Header from "./components/Header";
import EscalaForm from "./components/EscalaForm";
import ConsultaData from "./components/ConsultaData";
import CalendarioAnual from "./components/CalendarioAnual";
import EscalasLista from "./components/EscalasLista";
import { Escala, StatusDataBase, StatusExcecao } from "./types";
import { 
  carregarEscalas, 
  salvarEscala, 
  excluirEscala 
} from "./lib/escalasService";
import { 
  calcularStatusDia, 
  formatLocalDateString, 
  parseLocalDate 
} from "./utils/escalaCalculator";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle, 
  Plus, 
  Info, 
  Heart, 
  Bell, 
  ShieldAlert, 
  Coffee, 
  CalendarDays,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [escalaAtivaId, setEscalaAtivaId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [escalaEmEdicao, setEscalaEmEdicao] = useState<Escala | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Tracks which date the user clicked on the calendar or searched
  const [focusedDate, setFocusedDate] = useState<Date>(new Date());

  // Handle user auth changes exported by Header.tsx
  const handleUserChanged = useCallback((user: User | null) => {
    setCurrentUser(user);
    setUserLoaded(true);
  }, []);

  // Seed default demo scale for high-quality sandbox experience if empty (Item 9)
  const seedExemploSeVazio = (lista: Escala[]): Escala[] => {
    if (lista.length > 0) return lista;

    const baseHoje = "2026-06-12"; // Today's date relative to metadata
    const exemplo: Escala = {
      id: "demo-scale-12x36",
      userId: null,
      nomeEscala: "Ronda Hospitalar (Exemplo 12x36)",
      tipoEscala: "12x36",
      horasTrabalho: 12,
      horasFolga: 36,
      dataBase: baseHoje,
      statusDataBase: "trabalhando",
      horarioInicio: "07:00",
      horarioFim: "19:00",
      excecoes: {},
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    return [exemplo];
  };

  // Sync / Load scales from data layer
  const fetchSchedules = useCallback(async () => {
    if (!userLoaded) return;
    setIsSyncing(true);
    try {
      let dados = await carregarEscalas(currentUser ? currentUser.uid : null);
      
      // On empty localStorage, populate with the required demo example
      if (!currentUser && dados.length === 0) {
        dados = seedExemploSeVazio(dados);
        // Persist default demo scale to localStorage so calculations immediately work
        localStorage.setItem("minha_escala_dados_escalas_v1", JSON.stringify(dados));
      }

      setEscalas(dados);

      // Select active scale: prefer previously selected, or first item
      if (dados.length > 0) {
        const salvadoAtiva = localStorage.getItem(`escala_ativa_${currentUser?.uid || "anon"}`);
        const correspondente = dados.find((e) => e.id === salvadoAtiva);
        if (correspondente) {
          setEscalaAtivaId(correspondente.id);
        } else {
          setEscalaAtivaId(dados[0].id);
        }
      } else {
        setEscalaAtivaId(null);
      }
    } catch (e) {
      console.error("Erro ao sincronizar escalas:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser, userLoaded]);

  // Load schedules on authentication state modification
  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Set selected scale as active
  const handleSelectEscala = (id: string) => {
    setEscalaAtivaId(id);
    localStorage.setItem(`escala_ativa_${currentUser?.uid || "anon"}`, id);
  };

  // Trigger form opening for a new scale
  const handleNovoCadastro = () => {
    setEscalaEmEdicao(null);
    setShowForm(true);
  };

  // Trigger form opening to edit an existing scale
  const handleEditEscala = (escala: Escala) => {
    setEscalaEmEdicao(escala);
    setShowForm(true);
  };

  // Trigger scale deletion
  const handleExcluirEscala = async (id: string) => {
    const confirmacao = window.confirm("Deseja realmente excluir esta escala? Todos os plantões e folgas serão removidos.");
    if (!confirmacao) return;

    setIsSyncing(true);
    try {
      await excluirEscala(id, currentUser ? currentUser.uid : null);
      await fetchSchedules();
    } catch (e) {
      console.error("Erro ao excluir escala:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Form submission handler to save values
  const handleSaveForm = async (
    fieldValues: Omit<Escala, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }
  ) => {
    setIsSyncing(true);
    const scaleId = fieldValues.id || `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const scaleObj: Escala = {
      ...fieldValues,
      id: scaleId,
      userId: currentUser ? currentUser.uid : null,
      criadoEm: fieldValues.id 
        ? (escalas.find((e) => e.id === fieldValues.id)?.criadoEm || new Date().toISOString()) 
        : new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    try {
      await salvarEscala(scaleObj, currentUser ? currentUser.uid : null);
      setShowForm(false);
      setEscalaEmEdicao(null);
      await fetchSchedules();
      handleSelectEscala(scaleId);
    } catch (e) {
      console.error("Erro ao salvar escala:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save specific date overrides (férias, atestados ou trocas)
  const handleUpdateExcecoes = async (novasExcecoes: Record<string, StatusExcecao>) => {
    if (!escalaAtivaId) return;
    const escalaAtiva = escalas.find((e) => e.id === escalaAtivaId);
    if (!escalaAtiva) return;

    const escalaAtualizada: Escala = {
      ...escalaAtiva,
      excecoes: novasExcecoes,
      atualizadoEm: new Date().toISOString(),
    };

    setIsSyncing(true);
    try {
      await salvarEscala(escalaAtualizada, currentUser ? currentUser.uid : null);
      await fetchSchedules();
    } catch (e) {
      console.error("Erro ao atualizar exceções:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const activeScale = escalas.find((e) => e.id === escalaAtivaId);
  const statusHoje = activeScale ? calcularStatusDia(activeScale, new Date()) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-orange-500/10 transition-colors duration-200">
      
      {/* Header with auth */}
      <Header onUserChanged={handleUserChanged} />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        
        {/* Banner with explanation and example (Items 1 & 9) */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white shadow-xl shadow-orange-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-bounce" />
              Minha Escala
            </h2>
            <p className="text-xs font-medium text-orange-55/90 leading-relaxed">
              Informe sua escala de trabalho e descubra automaticamente seus dias de plantão e folga. Marque férias, registre atestados e configure trocas de turno com toques simples direto no calendário anual!
            </p>
          </div>
          <div className="rounded-xl bg-white/10 backdrop-blur-md px-3 py-2 text-xxs text-white max-w-xs border border-white/10">
            <span className="font-extrabold uppercase tracking-wide block mb-1">💡 Exemplo Prático</span>
            Se você trabalha hoje, <strong className="underline">12/06/2026</strong>, em uma escala 12x36, o app calcula todos os plantões e folgas automáticos durante o ano.
          </div>
        </div>

        {/* Sync loading flag */}
        {isSyncing && (
          <div className="mb-4 text-center text-xxs font-bold text-orange-500 flex items-center justify-center gap-1.5 print:hidden">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
            <span>Sincronizando dados com a nuvem...</span>
          </div>
        )}

        {/* Dual layout bento grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          
          {/* LEFT SUBFLOW: PROFILE DISPLAY, SEARCH AND LISTS */}
          <div className="space-y-6 md:col-span-5 print:hidden">

            {/* MAIN STATS BANNER: Today's shift summary */}
            {activeScale && (
              <div
                id="box-today-card"
                className={`rounded-2xl border p-5 shadow-sm overflow-hidden relative ${
                  statusHoje === "plantao"
                    ? "border-orange-600 bg-orange-700 text-white shadow-orange-700/12"
                    : statusHoje === "folga"
                    ? "border-emerald-600 bg-emerald-700 text-white shadow-emerald-700/12"
                    : statusHoje === "ferias"
                    ? "border-amber-700 bg-amber-800 text-white shadow-amber-800/12"
                    : "border-blue-600 bg-blue-700 text-white shadow-blue-700/12"
                }`}
              >
                {/* Decorative background circle */}
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xxs font-black uppercase tracking-widest opacity-80 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Status Hoje • {formatLocalDateString(new Date()).split("-").reverse().join("/")}
                  </span>
                  
                  {currentUser && (
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                      Nuvem Ativa
                    </span>
                  )}
                </div>

                <div id="text-today-status" className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                  {statusHoje === "plantao" && "Hoje é Plantão! 🏥"}
                  {statusHoje === "folga" && "Hoje é Folga! 😎"}
                  {statusHoje === "ferias" && "Hoje é Férias! 🌴"}
                  {statusHoje === "atestado" && "Atestado Médico 🩺"}
                </div>

                <p className="mt-2 text-xs opacity-90 font-medium">
                  Ativo na escala: <strong className="underline">{activeScale.nomeEscala}</strong> ({activeScale.tipoEscala})
                </p>

                {/* Times description if available */}
                <div className="mt-4 flex gap-4 border-t border-white/20 pt-3 text-xs">
                  <div>
                    <span className="opacity-95 block text-[10px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">Início do Turno</span>
                    <strong className="font-extrabold [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">{activeScale.horarioInicio || "07:00"} hs</strong>
                  </div>
                  <div>
                    <span className="opacity-95 block text-[10px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">Término do Turno</span>
                    <strong className="font-extrabold [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]">{activeScale.horarioFim || "19:00"} hs</strong>
                  </div>
                </div>
              </div>
            )}

            {/* DATE SPECIFIC QUERY MODULE (Item 3) */}
            {activeScale && (
              <ConsultaData 
                escala={activeScale} 
                onSelectDate={(date) => setFocusedDate(date)} 
              />
            )}

            {/* MULTIPLE SCALES MANAGER (Items 6 & 10) */}
            <EscalasLista
              escalas={escalas}
              escalaAtivaId={escalaAtivaId}
              onSelectEscala={handleSelectEscala}
              onEditEscala={handleEditEscala}
              onExcluirEscala={handleExcluirEscala}
              onNovoCadastro={handleNovoCadastro}
            />

            {/* ADMONISHING HELP DESK */}
            {!currentUser && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center">
                <p className="text-xxs text-slate-400 font-semibold leading-relaxed">
                  Você está navegando em modo <strong className="text-slate-600">Local (Offline)</strong>. Seus dados estão armazenados localmente neste navegador. Faça login com o Google para salvar tudo na nuvem com segurança!
                </p>
              </div>
            )}
            
          </div>

          {/* RIGHT SUBFLOW: YEARLY CALENDAR GRIDS OR REGISTER FORM CONTAINER */}
          <div className="space-y-6 md:col-span-7">
            
            <AnimatePresence mode="wait">
              {showForm ? (
                <motion.div
                  key="scale-form-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="print:hidden"
                >
                  <EscalaForm
                    escalaEmEdicao={escalaEmEdicao}
                    onSave={handleSaveForm}
                    onCancel={() => {
                      setShowForm(false);
                      setEscalaEmEdicao(null);
                    }}
                  />
                </motion.div>
              ) : activeScale ? (
                <motion.div
                  key="calendar-display-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <CalendarioAnual
                    escala={activeScale}
                    focusedDate={focusedDate}
                    onUpdateEscalaExcecoes={handleUpdateExcecoes}
                    onSelectDate={(date) => setFocusedDate(date)}
                  />
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center flex flex-col items-center justify-center min-h-[350px]">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Seja Bem-vindo ao Minha Escala</h3>
                  <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Você ainda não possui escalas salvas. Para projetar suas folgas e plantões no calendário anual, configure seu padrão de escala de trabalho.
                  </p>
                  <button
                    id="btn-primeiro-cadastro"
                    onClick={handleNovoCadastro}
                    className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 transition px-5 text-xs font-bold text-white shadow-md shadow-orange-500/15"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Cadastrar Minha Escala</span>
                  </button>
                </div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </main>

      {/* Styled Footer */}
      <footer className="mt-12 border-t border-slate-100 bg-white py-6 text-center text-slate-400 text-xxs font-medium print:hidden">
        <p className="flex items-center justify-center gap-1">
          <span>Minha Escala • Desenvolvido para Profissionais em Escalas de Plantões</span>
          <Heart className="h-3 w-3 text-red-400 fill-current" />
        </p>
        <p className="mt-1 opacity-70">
          Suporta cálculos personalizados offline e armazenamento seguro no Firestore.
        </p>
      </footer>

    </div>
  );
}
