import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ParticipantForm } from '@/components/participants/ParticipantForm'

describe('ParticipantForm', () => {
  it('libera o cadastro e envia pelo botão de adicionar no topo', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<ParticipantForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Nome completo'), 'Carlos Eduardo')
    await user.type(screen.getByLabelText('Telefone'), '73999887766')
    await user.click(screen.getByLabelText('Adicionar participante'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Carlos Eduardo',
        phone: '(73) 99988-7766',
        totalAmount: 380,
        paymentMethod: 'PIX',
      }),
    )
  })
})
