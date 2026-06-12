import { useState, useEffect } from "react";
import { auth, singInWithGooglePopup, logoutUser } from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Calendar, LogIn, LogOut, User as UserIcon, Sparkles } from "lucide-react";

interface HeaderProps {
  onUserChanged: (user: User | null) => void;
}

export default function Header({ onUserChanged }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      await singInWithGooglePopup();
    } catch (e) {
      console.error("Erro ao fazer login:", e);
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
    </header>
  );
}
