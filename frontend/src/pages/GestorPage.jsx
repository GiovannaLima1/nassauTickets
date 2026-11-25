import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Users,
  Ticket,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { lerEstadoLocal } from "../services/store";

const CHAVE_ESTADO = "nassauTickets_estado_v1";

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
  };
}

function carregarEstado() {
  try {
    const salvo = localStorage.getItem(CHAVE_ESTADO);
    if (salvo) {
      return normalizarEstado(JSON.parse(salvo));
    }
  } catch {
    // ignora erro
  }
  return normalizarEstado(null);
}

function formatarDuracaoSegundos(segundos) {
  if (!Number.isFinite(segundos) || segundos <= 0) return "—";
  const min = Math.floor(segundos / 60);
  const seg = Math.round(segundos % 60);
  if (min === 0) return `${seg}s`;
  return `${min}m ${String(seg).padStart(2, "0")}s`;
}

export default function GestorPage() {
  const [estado, setEstado] = useState(() => carregarEstado());
  const [periodo, setPeriodo] = useState("DIARIO");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [abaRelatorio, setAbaRelatorio] = useState("DETALHADO");
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const sincronizar = () => setEstado(carregarEstado());
    window.addEventListener("storage", sincronizar);
    window.addEventListener("nassauTickets:state", sincronizar);
    const timer = setInterval(() => setAgora(new Date()), 1000);

    return () => {
      window.removeEventListener("storage", sincronizar);
      window.removeEventListener("nassauTickets:state", sincronizar);
      clearInterval(timer);
    };
  }, []);

  const todasSenhas = useMemo(() => {
    const mapa = new Map();
    [...(estado.fila || []), ...(estado.historico || [])].forEach((item) => {
      const chave = item.id || item.numero || item.codigo;
      if (chave) mapa.set(chave, item);
    });

    const hoje = new Date();
    const diaStr = hoje.toISOString().slice(0, 10);
    const mesStr = hoje.toISOString().slice(0, 7);

    return Array.from(mapa.values())
      .filter((s) => {
        if (!s.emitidaEm) return true;
        if (periodo === "DIARIO") return s.emitidaEm.startsWith(diaStr);
        return s.emitidaEm.startsWith(mesStr);
      })
      .sort((a, b) => new Date(b.emitidaEm || 0) - new Date(a.emitidaEm || 0));
  }, [estado, periodo]);

  const metricas = useMemo(() => {
    const totalEmitidas = todasSenhas.length;
    const aguardando = todasSenhas.filter(
      (s) => !s.status || s.status === "AGUARDANDO"
    ).length;
    const emAtendimento = todasSenhas.filter(
      (s) =>
        s.status === "CHAMADA" ||
        s.status === "CHAMADA_NOVAMENTE" ||
        s.status === "EM_ATENDIMENTO"
    ).length;
    const finalizadas = todasSenhas.filter(
      (s) => s.status === "ATENDIDA" || s.status === "FINALIZADA"
    ).length;
    const naoCompareceram = todasSenhas.filter(
      (s) => s.status === "NÃO_COMPARECEU"
    ).length;

    const temposEspera = todasSenhas
      .filter((s) => s.emitidaEm && (s.primeiraChamadaEm || s.chamadaEm))
      .map(
        (s) =>
          (new Date(s.primeiraChamadaEm || s.chamadaEm).getTime() -
            new Date(s.emitidaEm).getTime()) /
          1000
      )
      .filter((v) => v >= 0);

    const temposAtendimento = todasSenhas
      .filter(
        (s) =>
          (s.status === "ATENDIDA" || s.status === "FINALIZADA") &&
          (s.iniciadaEm || s.chamadaEm) &&
          s.finalizadaEm
      )
      .map(
        (s) =>
          (new Date(s.finalizadaEm).getTime() -
            new Date(s.iniciadaEm || s.chamadaEm).getTime()) /
          1000
      )
      .filter((v) => v >= 0);

    const tme =
      temposEspera.length > 0
        ? temposEspera.reduce((acc, v) => acc + v, 0) / temposEspera.length
        : 0;

    const tma =
      temposAtendimento.length > 0
        ? temposAtendimento.reduce((acc, v) => acc + v, 0) /
          temposAtendimento.length
        : 0;

    const porTipo = ["SP", "SE", "SG"].map((sigla) => {
      const lista = todasSenhas.filter((s) => s.tipo === sigla);
      const nomeMap = {
        SP: "Serviço Prioritário",
        SE: "Serviço de Exames",
        SG: "Serviço Geral",
      };
      const atendidasTipo = lista.filter(
        (s) => s.status === "ATENDIDA" || s.status === "FINALIZADA"
      ).length;

      return {
        sigla,
        nome: nomeMap[sigla],
        total: lista.length,
        aguardando: lista.filter((s) => !s.status || s.status === "AGUARDANDO")
          .length,
        atendidas: atendidasTipo,
        percentual:
          totalEmitidas > 0 ? Math.round((lista.length / totalEmitidas) * 100) : 0,
      };
    });

    const mapaGuiches = new Map();
    todasSenhas
      .filter((s) => s.guiche)
      .forEach((s) => {
        const chave = `${s.guiche} - ${s.atendente || "Operador"}`;
        const atual = mapaGuiches.get(chave) || {
          guiche: s.guiche,
          atendente: s.atendente || "Operador",
          chamadas: 0,
          finalizadas: 0,
        };
        atual.chamadas += 1;
        if (s.status === "ATENDIDA" || s.status === "FINALIZADA") {
          atual.finalizadas += 1;
        }
        mapaGuiches.set(chave, atual);
      });

    return {
      totalEmitidas,
      aguardando,
      emAtendimento,
      finalizadas,
      naoCompareceram,
      tme,
      tma,
      porTipo,
      porGuiche: Array.from(mapaGuiches.values()),
    };
  }, [todasSenhas]);

  const senhasFiltradas = useMemo(() => {
    return todasSenhas.filter((s) => {
      const okTipo = filtroTipo === "TODOS" || s.tipo === filtroTipo;
      const statusNorm =
        s.status === "FINALIZADA" ? "ATENDIDA" : s.status || "AGUARDANDO";
      const okStatus = filtroStatus === "TODOS" || statusNorm === filtroStatus;
      return okTipo && okStatus;
    });
  }, [todasSenhas, filtroTipo, filtroStatus]);

  function handleExportarCSV() {
    const cabecalho = [
      "Senha",
      "Tipo",
      "Servico",
      "Status",
      "Data/Hora Emissao",
      "1a Chamada",
      "2a Chamada",
      "Inicio Atendimento",
      "Finalizacao Atendimento",
      "Guiche",
      "Atendente",
    ];

    const linhas = senhasFiltradas.map((s) => {
      const foiAtendida = s.status === "ATENDIDA" || s.status === "FINALIZADA";
      return [
        s.numero || s.codigo || "",
        s.tipo || "",
        s.servico || "",
        s.status === "FINALIZADA" ? "ATENDIDA" : s.status || "AGUARDANDO",
        s.emitidaEm ? new Date(s.emitidaEm).toLocaleString("pt-BR") : "",
        s.primeiraChamadaEm || s.chamadaEm
          ? new Date(s.primeiraChamadaEm || s.chamadaEm).toLocaleString("pt-BR")
          : "",
        s.segundaChamadaEm
          ? new Date(s.segundaChamadaEm).toLocaleString("pt-BR")
          : "",
        foiAtendida && s.iniciadaEm
          ? new Date(s.iniciadaEm).toLocaleString("pt-BR")
          : "",
        foiAtendida && s.finalizadaEm
          ? new Date(s.finalizadaEm).toLocaleString("pt-BR")
          : "",
        foiAtendida || s.guiche ? s.guiche || "" : "",
        s.atendente || "",
      ];
    });

    const csv = [cabecalho, ...linhas]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${periodo.toLowerCase()}-nassauTickets-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                nassauTickets • Painel do Gestor & Relatórios
              </h1>
              <p className="text-xs text-slate-500">
                Relatórios Diário e Mensal • Auditoria • Laboratório de Análises
                Clínicas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="rounded-full border border-slate-300 px-3 py-1.5 bg-white text-slate-700 font-semibold"
            >
              <option value="DIARIO">Relatório Diário</option>
              <option value="MENSAL">Relatório Mensal</option>
            </select>

            <button
              type="button"
              onClick={handleExportarCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
              <Clock className="w-3.5 h-3.5" />
              {agora.toLocaleTimeString("pt-BR")}
            </span>

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

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>TOTAL EMITIDAS</span>
              <Ticket className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {metricas.totalEmitidas}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              Aguardando: <strong>{metricas.aguardando}</strong> • Não
              compareceu: <strong>{metricas.naoCompareceram}</strong>
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>SENHAS ATENDIDAS</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-700 mt-2">
              {metricas.finalizadas}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              Em fluxo ativo: <strong>{metricas.emAtendimento}</strong>
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>TEMPO MÉDIO DE ESPERA</span>
              <Timer className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {formatarDuracaoSegundos(metricas.tme)}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              Da emissão até a 1ª chamada
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>TEMPO MÉDIO ATENDIMENTO (TM)</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-3xl font-black text-slate-900 mt-2">
              {formatarDuracaoSegundos(metricas.tma)}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">
              Do início até o encerramento
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Quantitativo Emitido e Atendido por Prioridade
            </h2>
            <div className="space-y-4">
              {metricas.porTipo.map((t) => (
                <div key={t.sigla}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-800">
                      {t.sigla} • {t.nome}
                    </span>
                    <span className="text-xs text-slate-600">
                      Emitidas: <strong>{t.total}</strong> ({t.percentual}%) •
                      Atendidas: <strong>{t.atendidas}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${t.percentual}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">
              Produtividade por Guichê / Operador
            </h2>
            {metricas.porGuiche.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">
                Nenhum atendimento registrado nos guichês ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2">Guichê</th>
                      <th className="py-2">Atendente</th>
                      <th className="py-2 text-right">Chamadas</th>
                      <th className="py-2 text-right">Atendidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metricas.porGuiche.map((g, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold text-slate-900">
                          Guichê {g.guiche}
                        </td>
                        <td className="py-2.5 text-slate-700">{g.atendente}</td>
                        <td className="py-2.5 text-right font-semibold">
                          {g.chamadas}
                        </td>
                        <td className="py-2.5 text-right text-emerald-700 font-semibold">
                          {g.finalizadas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAbaRelatorio("DETALHADO")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  abaRelatorio === "DETALHADO"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Relatório Detalhado das Senhas
              </button>
              <button
                type="button"
                onClick={() => setAbaRelatorio("AUDITORIA")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  abaRelatorio === "AUDITORIA"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Relatório de Auditoria
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 bg-white text-slate-700"
              >
                <option value="TODOS">Todos os tipos</option>
                <option value="SP">SP - Prioritário</option>
                <option value="SE">SE - Exames</option>
                <option value="SG">SG - Geral</option>
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-1.5 bg-white text-slate-700"
              >
                <option value="TODOS">Todos os status</option>
                <option value="AGUARDANDO">Aguardando</option>
                <option value="CHAMADA">Chamada</option>
                <option value="CHAMADA_NOVAMENTE">Chamada novamente</option>
                <option value="EM_ATENDIMENTO">Em atendimento</option>
                <option value="ATENDIDA">Atendida</option>
                <option value="NÃO_COMPARECEU">Não compareceu</option>
              </select>
            </div>
          </div>

          {senhasFiltradas.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Nenhuma senha encontrada para os filtros selecionados.
            </p>
          ) : abaRelatorio === "DETALHADO" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase">
                    <th className="py-2.5 pr-3">Numeração</th>
                    <th className="py-2.5 pr-3">Tipo</th>
                    <th className="py-2.5 pr-3">Status</th>
                    <th className="py-2.5 pr-3">Data/Hora Emissão</th>
                    <th className="py-2.5 pr-3">Data/Hora Atendimento</th>
                    <th className="py-2.5">Guichê Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {senhasFiltradas.map((s, idx) => {
                    const st =
                      s.status === "FINALIZADA"
                        ? "ATENDIDA"
                        : s.status || "AGUARDANDO";
                    const foiAtendida = st === "ATENDIDA";
                    return (
                      <tr key={s.id || `${s.numero}-${idx}`}>
                        <td className="py-2.5 pr-3 font-bold text-slate-900">
                          {s.numero || s.codigo}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-700">
                          {s.tipo} • {s.servico}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold ${
                              st === "ATENDIDA"
                                ? "bg-emerald-100 text-emerald-800"
                                : st === "NÃO_COMPARECEU"
                                ? "bg-rose-100 text-rose-800"
                                : st === "CHAMADA" ||
                                  st === "CHAMADA_NOVAMENTE" ||
                                  st === "EM_ATENDIMENTO"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {st}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {s.emitidaEm
                            ? new Date(s.emitidaEm).toLocaleString("pt-BR")
                            : ""}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {foiAtendida && (s.iniciadaEm || s.finalizadaEm)
                            ? new Date(
                                s.iniciadaEm || s.finalizadaEm
                              ).toLocaleString("pt-BR")
                            : ""}
                        </td>
                        <td className="py-2.5 text-slate-700">
                          {foiAtendida && s.guiche ? `Guichê ${s.guiche}` : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase">
                    <th className="py-2.5 pr-3">Atendente</th>
                    <th className="py-2.5 pr-3">Guichê</th>
                    <th className="py-2.5 pr-3">Senha</th>
                    <th className="py-2.5 pr-3">1ª Chamada</th>
                    <th className="py-2.5 pr-3">2ª Chamada</th>
                    <th className="py-2.5 pr-3">Início Atend.</th>
                    <th className="py-2.5">Finalização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {senhasFiltradas
                    .filter((s) => s.primeiraChamadaEm || s.chamadaEm)
                    .map((s, idx) => (
                      <tr key={s.id || `${s.numero}-${idx}`}>
                        <td className="py-2.5 pr-3 font-semibold text-slate-800">
                          {s.atendente || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-700">
                          {s.guiche ? `Guichê ${s.guiche}` : "—"}
                        </td>
                        <td className="py-2.5 pr-3 font-bold text-slate-900">
                          {s.numero || s.codigo}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {s.primeiraChamadaEm || s.chamadaEm
                            ? new Date(
                                s.primeiraChamadaEm || s.chamadaEm
                              ).toLocaleTimeString("pt-BR")
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {s.segundaChamadaEm
                            ? new Date(s.segundaChamadaEm).toLocaleTimeString(
                                "pt-BR"
                              )
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {s.iniciadaEm
                            ? new Date(s.iniciadaEm).toLocaleTimeString("pt-BR")
                            : "—"}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {s.finalizadaEm
                            ? new Date(s.finalizadaEm).toLocaleTimeString(
                                "pt-BR"
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}