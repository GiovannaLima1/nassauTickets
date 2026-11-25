import { useEffect, useRef, useState } from "react";
import { Monitor, Volume2, VolumeX, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { lerEstadoLocal } from "../services/store";
import * as speechModule from "../utils/speech";

const CHAVE_ESTADO = "nassauTickets_estado_v1";

function montarMensagemVoz(chamada) {
  const numero = chamada.numero || chamada.codigo || "";
  const guiche = chamada.guiche || "01";
  const servico = chamada.servico || chamada.tipo || "";
  const prefixo =
    chamada.status === "CHAMADA_NOVAMENTE" || (chamada.totalChamadas || 1) > 1
      ? "Última chamada. "
      : "";

  return `${prefixo}Senha ${numero}, ${servico}, comparecer ao guichê ${guiche}.`;
}

function falarTextoDireto(texto, onStatus) {
  if (!texto) return;

  try {
    if (typeof speechModule.falarSenha === "function") {
      speechModule.falarSenha({ texto, mensagem: texto });
    } else if (typeof speechModule.falar === "function") {
      speechModule.falar(texto);
    } else if (typeof speechModule.speak === "function") {
      speechModule.speak(texto);
    }
  } catch {
    // segue para síntese nativa
  }

  if (!("speechSynthesis" in window)) {
    if (onStatus) onStatus("Navegador sem suporte a speechSynthesis");
    return;
  }

  try {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(texto);
      const vozes = window.speechSynthesis.getVoices
        ? window.speechSynthesis.getVoices()
        : [];
      const vozPt =
        vozes.find((v) => v.lang && v.lang.toLowerCase().includes("pt-br")) ||
        vozes.find((v) => v.lang && v.lang.toLowerCase().startsWith("pt"));

      if (vozPt) {
        utterance.voice = vozPt;
        utterance.lang = vozPt.lang;
      } else {
        utterance.lang = "pt-BR";
      }

      utterance.rate = 1;
      utterance.volume = 1;

      utterance.onerror = (e) => {
        if (onStatus) {
          onStatus(
            `Erro de áudio: ${e?.error || "desconhecido"} (${vozes.length} vozes)`
          );
        }
      };

      utterance.onstart = () => {
        if (onStatus) {
          onStatus(`Falando (${vozPt ? vozPt.name : "padrão"})`);
        }
      };

      window.speechSynthesis.speak(utterance);
    }, 80);
  } catch (err) {
    if (onStatus) {
      onStatus(`Falha ao falar: ${err?.message || "erro"}`);
    }
  }
}

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
    // ignora erro de leitura
  }
  return normalizarEstado(null);
}

export default function PainelPage() {
  const [estado, setEstado] = useState(() => carregarEstado());
  const [agora, setAgora] = useState(() => new Date());
  const [somAtivado, setSomAtivado] = useState(true);
  const [statusVoz, setStatusVoz] = useState("Pronto");
  const ultimaAssinaturaFaladaRef = useRef("");

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

  useEffect(() => {
    const atual = estado.chamadaAtual;
    if (
      !atual ||
      (atual.status !== "CHAMADA" && atual.status !== "CHAMADA_NOVAMENTE")
    ) {
      return;
    }

    const assinatura = `${atual.numero || atual.codigo}-${atual.guiche || "01"}-${atual.chamadaEm || ""}-${atual.totalChamadas || 1}`;
    if (!assinatura || assinatura === ultimaAssinaturaFaladaRef.current) return;

    ultimaAssinaturaFaladaRef.current = assinatura;
    if (somAtivado) {
      falarTextoDireto(montarMensagemVoz(atual), setStatusVoz);
    }
  }, [estado.chamadaAtual, somAtivado]);

  function handleTestarVoz() {
    setSomAtivado(true);
    const atual = estado.chamadaAtual;
    if (
      atual &&
      (atual.status === "CHAMADA" || atual.status === "CHAMADA_NOVAMENTE")
    ) {
      falarTextoDireto(montarMensagemVoz(atual), setStatusVoz);
    } else {
      falarTextoDireto("Teste de voz do painel nassauTickets.", setStatusVoz);
    }
  }

  function handleAlternarSom() {
    const proximo = !somAtivado;
    setSomAtivado(proximo);
    if (!proximo && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setStatusVoz("Som desligado");
    } else if (proximo) {
      handleTestarVoz();
    }
  }

  const chamadaAtual = estado.chamadaAtual;
  // Apenas as 5 últimas senhas efetivamente chamadas (sem exibir próxima senha)
  const ultimasSenhas = (estado.historico || [])
    .filter((item) => item.primeiraChamadaEm || item.chamadaEm)
    .slice(0, 5);
  const aguardando = (estado.fila || []).filter(
    (item) => !item.status || item.status === "AGUARDANDO"
  );

  const isUltimaChamada =
    chamadaAtual &&
    (chamadaAtual.status === "CHAMADA_NOVAMENTE" ||
      (chamadaAtual.totalChamadas || 1) > 1);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="bg-slate-950/70 border-b border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                nassauTickets • Painel de Chamada
              </h1>
              <p className="text-xs text-slate-400">
                Laboratório de Análises Clínicas • Atendimento 07h às 17h
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium">
            <button
              type="button"
              onClick={handleTestarVoz}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
            >
              Testar voz
            </button>

            <button
              type="button"
              onClick={handleAlternarSom}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition cursor-pointer ${
                somAtivado
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
              }`}
            >
              {somAtivado ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  Som ativo
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  Som mudo
                </>
              )}
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <Clock className="w-3.5 h-3.5" />
              {agora.toLocaleTimeString("pt-BR")}
            </span>

            <Link
              to="/"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Início
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-slate-800/80 border border-slate-700 rounded-3xl p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-300 bg-teal-500/10 border border-teal-500/20 px-3.5 py-1.5 rounded-full">
              <Volume2 className="w-4 h-4" />
              {isUltimaChamada ? "Última Chamada" : "Chamada Atual"}
            </span>
            <span className="text-xs text-slate-400">
              Voz: <strong className="text-slate-200">{statusVoz}</strong> • Na
              fila: <strong className="text-white">{aguardando.length}</strong>
            </span>
          </div>

          {chamadaAtual ? (
            <div className="my-10 text-center">
              <p className="text-sm uppercase tracking-widest text-slate-400 font-semibold">
                {chamadaAtual.servico || chamadaAtual.tipo || "Atendimento"}
              </p>
              <div className="text-6xl sm:text-7xl font-black text-teal-400 my-4 tracking-tight">
                {chamadaAtual.numero || chamadaAtual.codigo}
              </div>
              <p className="text-xl text-slate-200 font-semibold">
                Guichê / Sala:{" "}
                <span className="text-amber-300">
                  {chamadaAtual.guiche || "01"}
                </span>
              </p>
            </div>
          ) : (
            <div className="my-10 text-center">
              <p className="text-lg text-slate-400">
                Nenhuma senha em chamada no momento.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                As senhas emitidas no Totem ficam na fila aguardando chamada do
                atendente.
              </p>
            </div>
          )}

          <div className="border-t border-slate-700/80 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Senhas Prioritárias (SP) • Exames (SE) • Geral (SG)</span>
            <span>Sincronização em tempo real</span>
          </div>
        </section>

        <aside className="bg-slate-800/60 border border-slate-700 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-4">
              Últimas 5 senhas chamadas
            </h2>

            {ultimasSenhas.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">
                Ainda não há histórico de chamadas.
              </p>
            ) : (
              <ul className="space-y-3">
                {ultimasSenhas.map((item, idx) => (
                  <li
                    key={item.id || `${item.numero}-${idx}`}
                    className="bg-slate-900/80 border border-slate-700/80 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-extrabold text-lg text-white block leading-none">
                        {item.numero || item.codigo}
                      </span>
                      <span className="text-xs text-slate-400 mt-1 block">
                        {item.servico || item.tipo}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-teal-300 block">
                        Guichê {item.guiche || "01"}
                      </span>
                      {item.chamadaEm && (
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.chamadaEm).toLocaleTimeString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Aguardando na fila</span>
            <span className="font-bold text-white">{aguardando.length}</span>
          </div>
        </aside>
      </main>
    </div>
  );
}