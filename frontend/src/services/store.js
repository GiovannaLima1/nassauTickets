const STORAGE_KEY = "nassauTickets_estado_v1";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const estadoInicial = {
  fila: [],
  senhaAtual: null,
  ultimasChamadas: [], // máximo 5 últimas chamadas
  historico: [],
  online: true,
  ultimaAtualizacao: Date.now(),
};

function formatarDataPrefixo(data = new Date()) {
  const yy = String(data.getFullYear()).slice(-2);
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

export function gerarNumeroSenha(tipo, filaExistente = [], historicoExistente = []) {
  const prefixo = formatarDataPrefixo();
  const todas = [...filaExistente, ...historicoExistente];
  const mesmoTipoHoje = todas.filter(
    (s) => s.tipo === tipo && s.numero?.startsWith(`${prefixo}-${tipo}`)
  );
  const seq = String(mesmoTipoHoje.length + 1).padStart(3, "0");
  return `${prefixo}-${tipo}${seq}`;
}

export function lerEstadoLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoInicial));
      return estadoInicial;
    }
    return { ...estadoInicial, ...JSON.parse(raw) };
  } catch {
    return estadoInicial;
  }
}

export function salvarEstadoLocal(novoEstado) {
  const payload = { ...novoEstado, ultimaAtualizacao: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event("nassauTickets:sync"));
  return payload;
}

export function observarEstado(callback) {
  callback(lerEstadoLocal());

  const aoMudar = () => callback(lerEstadoLocal());
  const aoMudarStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      callback(lerEstadoLocal());
    }
  };

  window.addEventListener("nassauTickets:sync", aoMudar);
  window.addEventListener("storage", aoMudarStorage);

  return () => {
    window.removeEventListener("nassauTickets:sync", aoMudar);
    window.removeEventListener("storage", aoMudarStorage);
  };
}

export async function chamarApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, offline: true, error: err.message };
  }
}