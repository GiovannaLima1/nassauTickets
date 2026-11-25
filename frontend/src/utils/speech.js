const LABELS_TIPO = {
  SP: "senha prioritária",
  SE: "senha para retirada de exames",
  SG: "senha geral",
};

export function falarChamada({ numero, tipo, guiche, ultimaChamada = false }) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const descricaoTipo = LABELS_TIPO[tipo] || `senha ${tipo}`;
  const sequencia = numero?.includes("-") ? numero.split("-")[1] : numero;
  const prefixo = ultimaChamada ? "Última chamada. " : "";
  const texto = `${prefixo}${descricaoTipo}, número ${sequencia}, dirigir-se ao guichê ${guiche}.`;

  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-BR";
  utterance.rate = 0.98;
  window.speechSynthesis.speak(utterance);
}