import { useEffect, useState } from "react";
import { Ticket, CheckCircle2, Clock, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { gerarNumeroSenha, lerEstadoLocal } from "../services/store";

const CHAVE_ESTADO = "nassauTickets_estado_v1";

const SERVICOS = [
  {
    sigla: "SP",
    nome: "Serviço Prioritário",
    descricao: "Idosos, gestantes, pessoas com deficiência e condições prioritárias.",
    destaque: "border-amber-300 bg-amber-50/60 hover:border-amber-400",
    badge: "bg-amber-100 text-amber-800",
    botao: "bg-amber-600 hover:bg-amber-700",
  },
  {
    sigla: "SE",
    nome: "Serviço de Exames",
    descricao: "Coleta laboratorial, exames de rotina, jejum e entrega de resultados.",
    destaque: "border-sky-300 bg-sky-50/60 hover:border-sky-400",
    badge: "bg-sky-100 text-sky-800",
    botao: "bg-sky-600 hover:bg-sky-700",
  },
  {
    sigla: "SG",
    nome: "Serviço Geral",
    descricao: "Informações administrativas, convênios, cadastro e orientações gerais.",
    destaque: "border-teal-300 bg-teal-50/60 hover:border-teal-400",
    badge: "bg-teal-100 text-teal-800",
    botao: "bg-teal-600 hover:bg-teal-700",
  },
];

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
    // ignora erro de parse
  }
  return normalizarEstado(null);
}

export default function TotemPage() {
  const [estado, setEstado] = useState(() => carregarEstado());
  const [ultimaSenha, setUltimaSenha] = useState(null);
  const [erro, setErro] = useState("");
  const [agora, setAgora] = useState(() => new Date());

  const horaAtual = agora.getHours();
  const dentroHorarioOficial = horaAtual >= 7 && horaAtual < 17;
  const dentroDoExpediente = estado.modoLivre24h || dentroHorarioOficial;

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

  function alternarModoExpediente() {
    const atual = carregarEstado();
    const proximo = {
      ...atual,
      modoLivre24h: !atual.modoLivre24h,
    };
    localStorage.setItem(CHAVE_ESTADO, JSON.stringify(proximo));
    window.dispatchEvent(new Event("nassauTickets:state"));
    setEstado(proximo);
    setErro("");
  }

  function handleEmitir(servico) {
    setErro("");
    if (!dentroDoExpediente) {
      setErro("Expediente encerrado. Atendimento oficial das 07h às 17h.");
      return;
    }

    try {
      const atual = carregarEstado();
      const numero = gerarNumeroSenha(servico.sigla, atual.fila, atual.historico);
      const emitidaEm = new Date().toISOString();

      // Máquina de estados: EMITIDA -> AGUARDANDO
      const novaSenha = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        numero,
        codigo: numero,
        tipo: servico.sigla,
        servico: servico.nome,
        status: "AGUARDANDO",
        historicoEstados: [
          { status: "EMITIDA", em: emitidaEm },
          { status: "AGUARDANDO", em: emitidaEm },
        ],
        emitidaEm,
        totalChamadas: 0,
      };

      const proximoEstado = {
        ...atual,
        fila: [...atual.fila, novaSenha],
      };

      localStorage.setItem(CHAVE_ESTADO, JSON.stringify(proximoEstado));
      window.dispatchEvent(new Event("nassauTickets:state"));
      setEstado(proximoEstado);
      setUltimaSenha(novaSenha);
    } catch (err) {
      setErro(err?.message || "Não foi possível emitir a senha.");
    }
  }

  const aguardandoTotal = (estado.fila || []).filter(
    (item) => !item.status || item.status === "AGUARDANDO"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                nassauTickets • Totem de Autoatendimento
              </h1>
              <p className="text-xs text-slate-500">
                Laboratório de Análises Clínicas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={alternarModoExpediente}
              title="Alternar entre Expediente Oficial (07h–17h) e Modo Livre 24h"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer transition ${
                dentroDoExpediente
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {estado.modoLivre24h
                ? "Expediente: 07h–17h (Modo 24h ativo)"
                : dentroHorarioOficial
                ? "Expediente: 07h às 17h (Aberto)"
                : "Expediente: 07h às 17h (Encerrado)"}
            </button>
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
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

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Selecione o tipo de atendimento
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Toque em uma das opções abaixo para retirar sua senha na fila.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-right">
            <span className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Aguardando na fila
            </span>
            <span className="text-lg font-bold text-sky-700">
              {aguardandoTotal} {aguardandoTotal === 1 ? "senha" : "senhas"}
            </span>
          </div>
        </div>

        {erro && (
          <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {erro}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SERVICOS.map((servico) => (
            <div
              key={servico.sigla}
              className={`rounded-2xl border p-6 bg-white flex flex-col justify-between transition shadow-xs ${servico.destaque}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${servico.badge}`}
                  >
                    {servico.sigla}
                  </span>
                  <Sparkles className="w-4 h-4 text-slate-400" />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {servico.nome}
                </h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {servico.descricao}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleEmitir(servico)}
                disabled={!dentroDoExpediente}
                className={`mt-6 w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed ${servico.botao}`}
              >
                Emitir senha ({servico.sigla})
              </button>
            </div>
          ))}
        </div>

        {ultimaSenha && (
          <div className="mt-8 rounded-2xl bg-white border-2 border-emerald-500 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Senha emitida com sucesso • Estado: {ultimaSenha.status}
                </span>
                <p className="text-3xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                  {ultimaSenha.numero}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Serviço: <strong>{ultimaSenha.servico}</strong> • Aguarde a
                  chamada no painel.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              Emitida às{" "}
              <strong>
                {new Date(ultimaSenha.emitidaEm).toLocaleTimeString("pt-BR")}
              </strong>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}