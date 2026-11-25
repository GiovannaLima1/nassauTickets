import { useEffect, useState } from "react";
import {
  UserCheck,
  PhoneCall,
  RotateCcw,
  CheckCircle,
  Clock,
  ArrowLeft,
  Users,
  Trash2,
  LogIn,
  LogOut,
  ShieldCheck,
  Play,
  UserX,
  PowerOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { lerEstadoLocal } from "../services/store";

const CHAVE_ESTADO = "nassauTickets_estado_v1";
const CHAVE_SESSAO_ATENDENTE = "nassauTickets_atendente_sessao";

function normalizarEstado(raw) {
  const base = lerEstadoLocal ? lerEstadoLocal() : {};
  const src =
    raw && typeof raw === "object"
      ? raw
      : base && typeof base === "object"
      ? base
      : {};

  return {
    fila: Array.isArray(src.fila) ? src.fila : [],
    historico: Array.isArray(src.historico) ? src.historico : [],
    chamadaAtual: src.chamadaAtual || null,
    guiches: Array.isArray(src.guiches) ? src.guiches : [],
    ultimoTipoChamado: src.ultimoTipoChamado || null,
    modoLivre24h: src.modoLivre24h !== undefined ? Boolean(src.modoLivre24h) : true,
  };
}

function carregarEstado() {
  try {
    const salvo = localStorage.getItem(CHAVE_ESTADO);
    if (salvo) {
      return normalizarEstado(JSON.parse(salvo));
    }
  } catch {
    // ignora erro de leitura
  }
  return normalizarEstado(null);
}

function salvarEstado(proximoEstado) {
  localStorage.setItem(CHAVE_ESTADO, JSON.stringify(proximoEstado));
  window.dispatchEvent(new Event("nassauTickets:state"));
}

function carregarSessao() {
  try {
    const salvo = sessionStorage.getItem(CHAVE_SESSAO_ATENDENTE);
    return salvo ? JSON.parse(salvo) : null;
  } catch {
    return null;
  }
}

/**
 * Regra de priorização da especificação:
 * [SP] -> [SE | SG] -> [SP] -> [SE | SG]
 * - Se a última chamada foi SP, tenta chamar SE (se houver) ou SG (se houver) antes de outra SP.
 * - Caso contrário, chama SP (se houver), depois SE, depois SG.
 * - Dentro de cada tipo, respeita ordem cronológica de emissão (FIFO).
 */
function selecionarProximaSenha(fila, ultimoTipoChamado) {
  const aguardando = [...(fila || [])]
    .filter((item) => !item.status || item.status === "AGUARDANDO")
    .sort((a, b) => new Date(a.emitidaEm || 0) - new Date(b.emitidaEm || 0));

  if (aguardando.length === 0) return null;

  const proxSP = aguardando.find((s) => s.tipo === "SP");
  const proxSE = aguardando.find((s) => s.tipo === "SE");
  const proxSG = aguardando.find((s) => s.tipo === "SG");

  if (ultimoTipoChamado === "SP") {
    return proxSE || proxSG || proxSP || aguardando[0];
  }

  return proxSP || proxSE || proxSG || aguardando[0];
}

export default function AtendentePage() {
  const [sessao, setSessao] = useState(() => carregarSessao());
  const [nomeInput, setNomeInput] = useState("");
  const [matriculaInput, setMatriculaInput] = useState("");
  const [guicheInput, setGuicheInput] = useState("01");
  const [perfilGestorInput, setPerfilGestorInput] = useState(false);
  const [erroLogin, setErroLogin] = useState("");

  const [estado, setEstado] = useState(() => carregarEstado());
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const sincronizar = () => {
      setEstado(carregarEstado());
    };

    window.addEventListener("storage", sincronizar);
    window.addEventListener("nassauTickets:state", sincronizar);
    const timer = setInterval(() => setAgora(new Date()), 1000);

    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener("nassauTickets:state", sincronizar);
      clearInterval(timer);
    };
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    if (!nomeInput.trim()) {
      setErroLogin("Informe o nome do atendente para iniciar o turno.");
      return;
    }

    const novaSessao = {
      nome: nomeInput.trim(),
      matricula: matriculaInput.trim() || "ATD-01",
      guiche: guicheInput || "01",
      isGestor: perfilGestorInput,
      inicioTurno: new Date().toISOString(),
    };

    sessionStorage.setItem(CHAVE_SESSAO_ATENDENTE, JSON.stringify(novaSessao));
    setSessao(novaSessao);
    setErroLogin("");
  }

  function handleLogout() {
    sessionStorage.removeItem(CHAVE_SESSAO_ATENDENTE);
    setSessao(null);
  }

  if (!sessao) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Login do Atendente
              </h1>
              <p className="text-xs text-slate-500">
                nassauTickets • Terminal de Guichê
              </p>
            </div>
          </div>

          {erroLogin && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700">
              {erroLogin}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Atendente *
              </label>
              <input
                type="text"
                placeholder="Ex.: Giovanna Tavares"
                value={nomeInput}
                onChange={(e) => setNomeInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  placeholder="Ex.: 202601"
                  value={matriculaInput}
                  onChange={(e) => setMatriculaInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guichê de Atendimento
                </label>
                <select
                  value={guicheInput}
                  onChange={(e) => setGuicheInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:border-sky-600"
                >
                  <option value="01">Guichê 01</option>
                  <option value="02">Guichê 02</option>
                  <option value="03">Guichê 03</option>
                  <option value="04">Guichê 04</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={perfilGestorInput}
                onChange={(e) => setPerfilGestorInput(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Acessar também com perfil adicional de Gestor</span>
            </label>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              Entrar no Terminal
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filaAguardando = [...(estado.fila || [])]
    .filter((item) => !item.status || item.status === "AGUARDANDO")
    .sort((a, b) => new Date(a.emitidaEm || 0) - new Date(b.emitidaEm || 0));

  // 1. Chamar próxima senha (AGUARDANDO -> CHAMADA)
  function handleChamarProxima() {
    const atual = carregarEstado();
    const proxima = selecionarProximaSenha(atual.fila, atual.ultimoTipoChamado);
    if (!proxima) return;

    const chamadaEm = new Date().toISOString();
    const senhaChamada = {
      ...proxima,
      status: "CHAMADA",
      guiche: sessao.guiche || "01",
      atendente: sessao.nome,
      chamadaEm,
      primeiraChamadaEm: chamadaEm,
      segundaChamadaEm: null,
      iniciadaEm: null,
      finalizadaEm: null,
      totalChamadas: 1,
      historicoEstados: [
        ...(proxima.historicoEstados || []),
        { status: "CHAMADA", em: chamadaEm },
      ],
    };

    const novaFila = (atual.fila || []).filter(
      (item) =>
        (item.id && proxima.id && item.id !== proxima.id) ||
        (!item.id && item.numero !== proxima.numero)
    );

    const semDuplicata = (atual.historico || []).filter(
      (h) => (h.numero || h.codigo) !== (senhaChamada.numero || senhaChamada.codigo)
    );

    const novoHistorico = [senhaChamada, ...semDuplicata].slice(0, 100);

    const proximoEstado = {
      ...atual,
      fila: novaFila,
      chamadaAtual: senhaChamada,
      historico: novoHistorico,
      ultimoTipoChamado: senhaChamada.tipo,
    };

    salvarEstado(proximoEstado);
    setEstado(proximoEstado);
  }

  // 2. Chamar novamente (CHAMADA -> CHAMADA_NOVAMENTE, sem duplicar no painel)
  function handleChamarNovamente() {
    const atual = carregarEstado();
    if (!atual.chamadaAtual) return;

    const agoraIso = new Date().toISOString();
    const totalChamadas = (atual.chamadaAtual.totalChamadas || 1) + 1;

    const repetida = {
      ...atual.chamadaAtual,
      status: "CHAMADA_NOVAMENTE",
      guiche: sessao.guiche || atual.chamadaAtual.guiche || "01",
      atendente: sessao.nome,
      chamadaEm: agoraIso,
      segundaChamadaEm: atual.chamadaAtual.segundaChamadaEm || agoraIso,
      totalChamadas,
      historicoEstados: [
        ...(atual.chamadaAtual.historicoEstados || []),
        { status: "CHAMADA_NOVAMENTE", em: agoraIso },
      ],
    };

    const codigoAtual = repetida.numero || repetida.codigo;
    const historicoAtualizado = (atual.historico || []).map((item) =>
      (item.numero || item.codigo) === codigoAtual ? repetida : item
    );

    const proximoEstado = {
      ...atual,
      chamadaAtual: repetida,
      historico: historicoAtualizado,
    };

    salvarEstado(proximoEstado);
    setEstado(proximoEstado);
  }

  // 3. Iniciar atendimento (CHAMADA / CHAMADA_NOVAMENTE -> EM_ATENDIMENTO)
  function handleIniciarAtendimento() {
    const atual = carregarEstado();
    if (!atual.chamadaAtual) return;

    const iniciadaEm = new Date().toISOString();
    const emAtendimento = {
      ...atual.chamadaAtual,
      status: "EM_ATENDIMENTO",
      guiche: sessao.guiche || atual.chamadaAtual.guiche || "01",
      atendente: sessao.nome,
      iniciadaEm,
      historicoEstados: [
        ...(atual.chamadaAtual.historicoEstados || []),
        { status: "EM_ATENDIMENTO", em: iniciadaEm },
      ],
    };

    const codigoAtual = emAtendimento.numero || emAtendimento.codigo;
    const historicoAtualizado = (atual.historico || []).map((item) =>
      (item.numero || item.codigo) === codigoAtual ? emAtendimento : item
    );

    const proximoEstado = {
      ...atual,
      chamadaAtual: emAtendimento,
      historico: historicoAtualizado,
    };

    salvarEstado(proximoEstado);
    setEstado(proximoEstado);
  }

  // 4. Finalizar atendimento (EM_ATENDIMENTO -> ATENDIDA)
  function handleFinalizarAtendimento() {
    const atual = carregarEstado();
    if (!atual.chamadaAtual) return;

    const finalizadaEm = new Date().toISOString();
    const iniciadaEm = atual.chamadaAtual.iniciadaEm || atual.chamadaAtual.chamadaEm || finalizadaEm;
    const atendida = {
      ...atual.chamadaAtual,
      status: "ATENDIDA",
      iniciadaEm,
      finalizadaEm,
      historicoEstados: [
        ...(atual.chamadaAtual.historicoEstados || []),
        { status: "ATENDIDA", em: finalizadaEm },
      ],
    };

    const codigoAtual = atendida.numero || atendida.codigo;
    const historicoAtualizado = (atual.historico || []).map((item) =>
      (item.numero || item.codigo) === codigoAtual ? atendida : item
    );

    const proximoEstado = {
      ...atual,
      chamadaAtual: atendida,
      historico: historicoAtualizado,
    };

    salvarEstado(proximoEstado);
    setEstado(proximoEstado);
  }

  // 5. Não compareceu após chamadas (CHAMADA / CHAMADA_NOVAMENTE -> NÃO_COMPARECEU)
  function handleNaoCompareceu() {
    const atual = carregarEstado();
    if (!atual.chamadaAtual) return;

    const encerradaEm = new Date().toISOString();
    const abandonada = {
      ...atual.chamadaAtual,
      status: "NÃO_COMPARECEU",
      iniciadaEm: null,
      finalizadaEm: encerradaEm,
      historicoEstados: [
        ...(atual.chamadaAtual.historicoEstados || []),
        { status: "NÃO_COMPARECEU", em: encerradaEm },
      ],
    };

    const codigoAtual = abandonada.numero || abandonada.codigo;
    const historicoAtualizado = (atual.historico || []).map((item) =>
      (item.numero || item.codigo) === codigoAtual ? abandonada : item
    );

    const proximoEstado = {
      ...atual,
      chamadaAtual: abandonada,
      historico: historicoAtualizado,
    };

    salvarEstado(proximoEstado);
    setEstado(proximoEstado);
  }

  // Encerrar expediente: descarta senhas restantes na fila (regra das 17h)
  function handleEncerrarExpediente() {
    const atual = carregarEstado();
    const agoraIso = new Date().toISOString();

    const descartadas = (atual.fila || []).map((s) => ({
      ...s,
      status: "NÃO_COMPARECEU",
      guiche: null,
      atendente: null,
      primeiraChamadaEm: null,
      segundaChamadaEm: null,
      iniciadaEm: null,
      finalizadaEm: agoraIso,
      observacao: "Descartada ao encerrar expediente",
    }));

    const proximoEstado = {
      ...atual,
      fila: [],
      historico: [...descartadas, ...(atual.historico || [])].slice(0, 100),
      modoLivre24h: false,
    };

    salvarEstado(proximoEstado);
    setEstado(proximoEstado);
  }

  function handleZerarSenhas() {
    const estadoLimpo = {
      fila: [],
      historico: [],
      chamadaAtual: null,
      guiches: [],
      ultimoTipoChamado: null,
      modoLivre24h: estado.modoLivre24h,
    };

    salvarEstado(estadoLimpo);
    setEstado(estadoLimpo);
  }

  const chamadaAtual = estado.chamadaAtual;
  const historicoRecente = (estado.historico || []).slice(0, 8);
  const totalAtendidasTurno = (estado.historico || []).filter(
    (h) => h.status === "ATENDIDA" || h.status === "FINALIZADA"
  ).length;

  const emFluxoAtivo =
    chamadaAtual &&
    (chamadaAtual.status === "CHAMADA" ||
      chamadaAtual.status === "CHAMADA_NOVAMENTE" ||
      chamadaAtual.status === "EM_ATENDIMENTO");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                nassauTickets • Terminal do Atendente
              </h1>
              <p className="text-xs text-slate-500">
                Operador: <strong>{sessao.nome}</strong> ({sessao.matricula}) •{" "}
                <strong>Guichê {sessao.guiche}</strong>
                {sessao.isGestor ? " • Perfil Gestor" : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
            {sessao.isGestor && (
              <Link
                to="/gestor"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition"
              >
                Relatórios (Gestor)
              </Link>
            )}

            <button
              type="button"
              onClick={handleEncerrarExpediente}
              title="Descarta senhas restantes na fila ao final do expediente"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition cursor-pointer"
            >
              <PowerOff className="w-3.5 h-3.5" />
              Encerrar expediente
            </button>

            <button
              type="button"
              onClick={handleZerarSenhas}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Zerar senhas
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
              <Clock className="w-3.5 h-3.5" />
              {agora.toLocaleTimeString("pt-BR")}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Início
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Guichê Ativo</span>
              <strong className="text-2xl font-extrabold text-slate-900">
                {sessao.guiche}
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Na Fila</span>
              <strong className="text-2xl font-extrabold text-sky-700">
                {filaAguardando.length}
              </strong>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <span className="text-xs text-slate-500 block">Atendidas</span>
              <strong className="text-2xl font-extrabold text-emerald-700">
                {totalAtendidasTurno}
              </strong>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                  Controle de Atendimento • Prioridade [SP] → [SE | SG]
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Senha em atendimento
                </h2>
              </div>

              <button
                type="button"
                onClick={handleChamarProxima}
                disabled={filaAguardando.length === 0 || emFluxoAtivo}
                title={
                  emFluxoAtivo
                    ? "Finalize ou registre não comparecimento antes de chamar a próxima senha"
                    : "Chamar próxima senha conforme regra de prioridade"
                }
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm transition cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                Chamar próxima senha
              </button>
            </div>

            {chamadaAtual ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                      Estado atual: {chamadaAtual.status}
                      {chamadaAtual.totalChamadas > 1
                        ? ` (${chamadaAtual.totalChamadas}ª chamada - Última chamada)`
                        : ""}
                    </span>
                    <p className="text-4xl font-black text-slate-900 mt-1">
                      {chamadaAtual.numero || chamadaAtual.codigo}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {chamadaAtual.servico || chamadaAtual.tipo} • Guichê{" "}
                      <strong>{chamadaAtual.guiche || sessao.guiche}</strong>
                    </p>
                  </div>

                  {emFluxoAtivo && (
                    <div className="flex flex-wrap gap-2">
                      {chamadaAtual.status !== "EM_ATENDIMENTO" && (
                        <>
                          <button
                            type="button"
                            onClick={handleChamarNovamente}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Chamar novamente
                          </button>

                          <button
                            type="button"
                            onClick={handleIniciarAtendimento}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition cursor-pointer"
                          >
                            <Play className="w-4 h-4" />
                            Iniciar atendimento
                          </button>

                          <button
                            type="button"
                            onClick={handleNaoCompareceu}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <UserX className="w-4 h-4" />
                            Não compareceu
                          </button>
                        </>
                      )}

                      {chamadaAtual.status === "EM_ATENDIMENTO" && (
                        <button
                          type="button"
                          onClick={handleFinalizarAtendimento}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Encerrar atendimento
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500 text-sm">
                Nenhuma senha chamada ainda. Clique em{" "}
                <strong>Chamar próxima senha</strong> para iniciar.
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Últimas chamadas realizadas
            </h3>

            {historicoRecente.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma chamada registrada ainda.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {historicoRecente.map((item, idx) => (
                  <div
                    key={item.id || `${item.numero}-${idx}`}
                    className="border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between bg-slate-50/70"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {item.numero || item.codigo}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.servico || item.tipo} • {item.status}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-sky-700">
                      {item.guiche ? `Guichê ${item.guiche}` : "Descartada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              Fila de espera
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {filaAguardando.length}
            </span>
          </div>

          {filaAguardando.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Nenhuma senha aguardando no momento.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {filaAguardando.map((senha, idx) => (
                <li
                  key={senha.id || `${senha.numero}-${idx}`}
                  className="border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {senha.numero || senha.codigo}
                    </span>
                    <span className="text-xs text-slate-500">
                      {senha.servico || senha.tipo}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {senha.tipo}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>
    </div>
  );
}