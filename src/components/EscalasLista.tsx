import { Escala } from "../types";
import { Plus, Check, Trash2, Edit, Calendar, Info } from "lucide-react";

interface EscalasListaProps {
  escalas: Escala[];
  escalaAtivaId: string | null;
  onSelectEscala: (id: string) => void;
  onEditEscala: (escala: Escala) => void;
  onExcluirEscala: (id: string) => void;
  onNovoCadastro: () => void;
}

export default function EscalasLista({
  escalas,
  escalaAtivaId,
  onSelectEscala,
  onEditEscala,
  onExcluirEscala,
  onNovoCadastro,
}: EscalasListaProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      
      {/* Title block */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-gray-800">Minhas Escalas</h3>
        </div>
        
        <button
          id="btn-adicionar-cadastro"
          onClick={onNovoCadastro}
          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white text-xs font-bold py-1.5 px-3.5 shadow-md shadow-blue-250/20 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Escala</span>
        </button>
      </div>

      {escalas.length === 0 ? (
        <div className="text-center py-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-2">
            <Info className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-gray-600 block">Nenhuma escala cadastrada</p>
          <p className="text-xxs text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
            Configure seu primeiro plantão clicando no botão acima para iniciar os cálculos automáticos.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {escalas.map((escala) => {
            const isAtiva = escala.id === escalaAtivaId;
            return (
              <div
                id={`escala-card-item-${escala.id}`}
                key={escala.id}
                className={`relative flex items-center justify-between rounded-xl border p-3 transition ${
                  isAtiva
                    ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500"
                    : "border-gray-100 bg-gray-50/30 hover:bg-gray-50/50"
                }`}
              >
                {/* Scale description info */}
                <div 
                  onClick={() => onSelectEscala(escala.id)}
                  className="flex-1 cursor-pointer pr-3"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-850 block truncate max-w-[150px] sm:max-w-[240px]">
                      {escala.nomeEscala}
                    </span>
                    {isAtiva && (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>

                  <p className="text-xxs text-gray-400 font-semibold mt-1">
                    Tipo: <span className="text-gray-600 font-extrabold uppercase">{escala.tipoEscala}</span> • Inicia às {escala.horarioInicio || "07:00"}
                  </p>
                  
                  <p className="text-xxs text-gray-400 mt-0.5">
                    Data-base: {escala.dataBase.split("-").reverse().join("/")} ({escala.statusDataBase === "trabalhando" ? "Trabalha" : "Folga"})
                  </p>
                </div>

                {/* Operations buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id={`btn-editar-escala-${escala.id}`}
                    onClick={() => onEditEscala(escala)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                    title="Editar informações"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    id={`btn-excluir-escala-${escala.id}`}
                    onClick={() => onExcluirEscala(escala.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition cursor-pointer"
                    title="Remover escala"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
