import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WelcomePage from '../src/components/WelcomePage'

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>)

describe('WelcomePage', () => {
  it('mostra a mensagem de boas-vindas', () => {
    renderWithRouter(<WelcomePage />)
    expect(
      screen.getByRole('heading', { name: /bem-vindo ao/i }),
    ).toBeInTheDocument()
  })

  it('apresenta o botão para começar', () => {
    renderWithRouter(<WelcomePage />)
    expect(
      screen.getByRole('button', { name: /começar/i }),
    ).toBeInTheDocument()
  })
})
