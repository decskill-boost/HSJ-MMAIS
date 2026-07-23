import { render, screen } from '@testing-library/react'
import CapitaoMais from '../src/components/CapitaoMais'
import BtnGlobal from '../src/components/BtnGlobal'

// Smoke tests da identidade MMAIS (substituem os testes obsoletos do template Vite)
describe('Identidade MMAIS', () => {
  it('renderiza a mascote Capitão Mais', () => {
    render(<CapitaoMais />)
    expect(
      screen.getByRole('img', { name: /capitão mais/i }),
    ).toBeInTheDocument()
  })

  it('renderiza o botão global com o texto correto', () => {
    render(<BtnGlobal variant="raio">Começar!</BtnGlobal>)
    expect(
      screen.getByRole('button', { name: /começar/i }),
    ).toBeInTheDocument()
  })
})
