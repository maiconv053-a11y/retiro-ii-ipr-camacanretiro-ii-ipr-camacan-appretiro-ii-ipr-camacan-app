import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ParticipantForm } from '@/components/participants/ParticipantForm'

describe('ParticipantForm', () => {
  it('libera o cadastro e envia pelo botão de adicionar no topo', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ParticipantForm onSubmit={onSubmit} defaultTotalAmount={450} />)

    await user.type(screen.getByLabelText('Nome completo'), 'Carlos Eduardo')
    await user.type(screen.getByLabelText('Data de nascimento'), '2000-01-01')
    await user.type(screen.getByLabelText('Telefone'), '73999887766')
    await user.type(screen.getByLabelText('E-mail'), 'carlos@email.com')
    await user.type(screen.getByLabelText('Qual a sua igreja'), 'II IPR de Camacan')
    await user.type(screen.getByLabelText('Cidade onde mora'), 'Camacan - BA')
    await user.click(screen.getByLabelText('Adicionar participante'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Carlos Eduardo',
        phone: '(73) 99988-7766',
        email: 'carlos@email.com',
        church: 'II IPR de Camacan',
        city: 'Camacan - BA',
        totalAmount: 450,
        paymentMethod: 'PIX',
      }),
    )
  })
})
