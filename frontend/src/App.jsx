import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import TotemPage from "./pages/TotemPage";
import PainelPage from "./pages/PainelPage";
import AtendentePage from "./pages/AtendentePage";
import GestorPage from "./pages/GestorPage";

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-xs text-center">
        <h1 className="text-2xl font-bold text-sky-700">nassauTickets</h1>
        <p className="text-slate-600 text-sm mt-2">
          Laboratório de Análises Clínicas
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            to="/totem"
            target="_blank"
            rel="noreferrer"
            className="py-3 px-4 rounded-xl bg-sky-600 text-white font-semibold hover:bg-sky-700"
          >
            Abrir Totem em nova aba
          </Link>
          <Link
            to="/painel"
            target="_blank"
            rel="noreferrer"
            className="py-3 px-4 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700"
          >
            Abrir Painel em nova aba
          </Link>
          <Link
            to="/atendente"
            target="_blank"
            rel="noreferrer"
            className="py-3 px-4 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900"
          >
            Abrir Atendente em nova aba
          </Link>
          <Link
            to="/gestor"
            target="_blank"
            rel="noreferrer"
            className="py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Abrir Gestor (Relatórios) em nova aba
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/totem" element={<TotemPage />} />
        <Route path="/painel" element={<PainelPage />} />
        <Route path="/atendente" element={<AtendentePage />} />
        <Route path="/gestor" element={<GestorPage />} />
      </Routes>
    </BrowserRouter>
  );
}