import { useState } from 'react'
import Header from './components/Header'

function App() {
  const [senhaSelecionada, setSenhaSelecionada] = useState('')

  return (
    <>
      <Header />

      <main>
        <h2>Emissão de Senha</h2>
        <p>Selecione o tipo de atendimento:</p>

        <div>
          <button
            type="button"
            onClick={() => setSenhaSelecionada('SP')}
          >
            Senha Prioritária (SP)
          </button>

          <button
            type="button"
            onClick={() => setSenhaSelecionada('SG')}
          >
            Senha Geral (SG)
          </button>

          <button
            type="button"
            onClick={() => setSenhaSelecionada('SE')}
          >
            Retirada de Exames (SE)
          </button>
        </div>

        {senhaSelecionada && (
          <p>Senha selecionada: {senhaSelecionada}</p>
        )}
      </main>
    </>
  )
}

export default App