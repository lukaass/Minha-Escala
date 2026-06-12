import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Escala } from "../types";

const LOCAL_STORAGE_KEY = "minha_escala_dados_escalas_v1";

/**
 * Loads all scales for the specified user ID (or local storage if not logged in)
 */
export async function carregarEscalas(userId: string | null): Promise<Escala[]> {
  if (!userId) {
    // Offline/Local mode
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Escala[];
    } catch (e) {
      console.error("Erro ao carregar do localStorage:", e);
      return [];
    }
  }

  // Firebase Firestore mode
  const path = "escalas";
  try {
    const q = query(collection(db, path), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const result: Escala[] = [];
    snapshot.forEach((doc) => {
      result.push(doc.data() as Escala);
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Saves (inserts or updates) a scale in Firestore or offline storage
 */
export async function salvarEscala(escala: Escala, userId: string | null): Promise<void> {
  const escalaSalva: Escala = {
    ...escala,
    userId, // ensure correct association
    atualizadoEm: new Date().toISOString(),
  };

  if (!userId) {
    // Offline/Local mode
    const escalasAtuais = await carregarEscalas(null);
    const index = escalasAtuais.findIndex((e) => e.id === escalaSalva.id);
    if (index >= 0) {
      escalasAtuais[index] = escalaSalva;
    } else {
      escalasAtuais.push(escalaSalva);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(escalasAtuais));
    return;
  }

  // Firebase Firestore mode
  const path = `escalas/${escalaSalva.id}`;
  try {
    await setDoc(doc(db, "escalas", escalaSalva.id), escalaSalva);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a scale by ID
 */
export async function excluirEscala(id: string, userId: string | null): Promise<void> {
  if (!userId) {
    // Offline/Local mode
    const escalasAtuais = await carregarEscalas(null);
    const novasEscalas = escalasAtuais.filter((e) => e.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(novasEscalas));
    return;
  }

  // Firebase Firestore mode
  const path = `escalas/${id}`;
  try {
    await deleteDoc(doc(db, "escalas", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
