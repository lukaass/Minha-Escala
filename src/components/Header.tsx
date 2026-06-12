import { useState, useEffect } from "react";
import { auth, singInWithGooglePopup, logoutUser } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Calendar, LogIn, LogOut, User as UserIcon, Sparkles, X, ShieldAlert, ExternalLink, HelpCircle, AlertCircle } from "lucide-react";

interface HeaderProps {
  onUserChanged: (user: User | null) => void;
}

export default function Header({ onUserChanged }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthHelpModal, setShowAuthHelpModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      onUserChanged(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [onUserChanged]);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await singInWithGooglePopup();
    } catch (e: any) {
      console.error("Erro ao fazer login:", e);
      const errorCode = e?.code || "";
      const errorMsg = e?.message || "";
      setAuthError(`${errorCode} ${errorMsg ? `(${errorMsg})` : ""}`);
      setShowAuthHelpModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/15">
            M
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
          </div>
          <div>
            <h1 id="app-title" className="font-sans text-lg font-bold tracking-tight text-gray-800 sm:text-lg">
              Minha Escala
            </h1>
            <p className="hidden text-[10px] font-medium text-gray-400 sm:block">
              Organize seus plantões e folgas
            </p>
          </div>
        </div>

        {/* Authenticator Section */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-6 w-24 animate-pulse rounded bg-gray-150" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Avatar & Name */}
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/50 py-1 pl-1 pr-3">
                {user.photoURL ? (
                  <img
                    id="user-avatar"
                    referrerPolicy="no-referrer"
                    src={user.photoURL}
                    alt={user.displayName || "Usuário"}
                    className="h-7 w-7 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
                <span id="user-display-name" className="max-w-[80px] truncate text-xs font-semibold text-gray-700 sm:max-w-[120px]">
                  {user.displayName?.split(" ")[0]}
                </span>
                <span className="hidden rounded-full bg-blue-100/80 px-1.5 py-0.5 text-xxs font-bold text-blue-700 sm:block">
                  Nuvem
                </span>
              </div>

              {/* Logout Button */}
              <button
                id="btn-logout"
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-red-500 md:h-9 md:w-auto md:px-3 md:gap-1.5"
                title="Sair da Conta"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden text-xs font-medium md:inline">Sair</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden text-[10px] text-gray-400 lg:inline">
                Sincronize seus dados:
              </span>
              <button
                id="btn-login-google"
                onClick={handleLogin}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-200/50 sm:px-4"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar com Google</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Auth Help Modal when Google Sign-in fails outside AI Studio */}
      {showAuthHelpModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-150 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-150 text-left">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
              <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 font-sans">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                Problemas no Login do Google?
              </h4>
              <button 
                onClick={() => setShowAuthHelpModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mb-4 leading-relaxed font-semibold">
              Se a janela de login do Google abriu e fechou imediatamente, ou se você está testando esse aplicativo em uma nova conta de hospedagem (como <strong className="text-gray-850">Vercel</strong> ou <strong className="text-gray-850">GitHub Pages</strong>), o Firebase bloqueia o acesso por motivos de segurança até que o novo endereço seja explicitamente autorizado.
            </p>

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-4 mb-4">
              <h5 className="text-xxs font-bold text-blue-800 uppercase tracking-widest mb-2 font-mono flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                COMO RESOLVER NO SEU FIREBASE (PASSO A PASSO):
              </h5>
              <ol className="text-xs text-gray-700 space-y-2.5 list-decimal list-inside font-medium">
                <li>
                  Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5">
                    Console do Firebase <ExternalLink className="h-3 w-3" />
                  </a> e clique no projeto do seu aplicativo.
                </li>
                <li>
                  No menu lateral, vá em <strong className="text-gray-850">Authentication (Autenticação)</strong>.
                </li>
                <li>
                  Clique na aba <strong className="text-gray-850">Settings (Configurações)</strong> na parte superior e depois selecione <strong className="text-gray-850">Authorized domains (Domínios autorizados)</strong> no painel.
                </li>
                <li>
                  Clique em <strong className="text-indigo-600">Add domain (Adicionar domínio)</strong> e adicione o endereço do seu site Vercel (ex: <code className="bg-white/80 px-1 border rounded text-xs font-mono select-all">sua-escala.vercel.app</code>) ou seu domínio atual.
                </li>
              </ol>
            </div>

            {authError && (
              <div className="rounded-lg bg-gray-50 border border-gray-150 p-2.5 mb-4 text-[11px] font-mono text-gray-500 overflow-x-auto whitespace-pre-wrap max-h-24">
                <span className="font-bold text-gray-750 block mb-0.5">Código Técnico do Erro:</span>
                {authError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-3">
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <span>Console do Firebase</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => setShowAuthHelpModal(false)}
                className="rounded-xl bg-blue-600 text-white px-4.5 py-2 text-xs font-bold hover:bg-blue-700 transition cursor-pointer shadow-md"
              >
                Fechar Ajuda
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
