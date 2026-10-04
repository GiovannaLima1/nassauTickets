import { useState } from 'react'
import Header from './components/Header'

function App() {
  const [senha, setSenha] = useState('')
  const [sequencia, setSequencia] = useState(1)

  function emitirSenha(tipo) {
    const agora = new Date()

    const ano = agora.getFullYear().toString().slice(-2)
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const dia = String(agora.getDate()).padStart(2, '0')

    const numero = String(sequencia).padStart(2, '0')

    const novaSenha = `${ano}${mes}${dia}-${tipo}${numero}`

    setSenha(novaSenha)
    setSequencia(sequencia + 1)
  }

  return (
    <>
      <Header />

      <main>
        <h2>Emissão de Senha</h2>
        <p>Selecione o tipo de atendimento:</p>

        <div>
          <button type="button" onClick={() => emitirSenha('SP')}>
            Senha Prioritária (SP)
          </button>

          <button type="button" onClick={() => emitirSenha('SG')}>
            Senha Geral (SG)
          </button>

          <button type="button" onClick={() => emitirSenha('SE')}>
            Retirada de Exames (SE)
          </button>
        </div>

        {senha && (
          <div>
            <h3>Sua senha é:</h3>
            <p>{senha}</p>
          </div>
        )}
      </main>
    </>
  )
}

export default App