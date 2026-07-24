import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { UserProvider } from '../src/contexts/UserContext'

describe('App', () => {
  it('renderiza o título de boas-vindas do +MMAis e navega para o Login', async () => {
    const user = userEvent.setup()
    render(
      <UserProvider>
        <App />
      </UserProvider>
    )

    // Verifica se a página de boas-vindas é exibida
    expect(
      await screen.findByRole('heading', { name: /Bem-vindo ao \+MMAis!/i })
    ).toBeInTheDocument()

    // Encontra o botão "Começar!" e clica nele
    const button = screen.getByRole('button', { name: /Começar!/i })
    await user.click(button)

    // Verifica se navegou para a página de Login
    expect(
      await screen.findByText(/Email Institucional/i)
    ).toBeInTheDocument()
  })
})

