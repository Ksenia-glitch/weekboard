type FormSubmitResponse = {
  success?: string | boolean
  message?: string
}

export async function sendPasswordResetEmail(
  email: string,
  code: string,
  username: string,
): Promise<void> {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: 'Weekboard',
      subject: 'Weekboard password reset code',
      message: [
        `Hi ${username},`,
        '',
        `Your Weekboard password reset code is: ${code}`,
        '',
        'This code expires in 15 minutes.',
        'If you did not ask to reset your password, you can ignore this email.',
      ].join('\n'),
      _captcha: 'false',
      _template: 'box',
    }),
  })

  let payload: FormSubmitResponse | null = null
  try {
    payload = (await response.json()) as FormSubmitResponse
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail = payload?.message?.trim()
    throw new Error(
      detail ||
        'Could not send the reset email. Check the address and try again in a minute.',
    )
  }

  const message = typeof payload?.message === 'string' ? payload.message.toLowerCase() : ''
  if (message.includes('activate') || message.includes('confirm your email')) {
    throw new Error(
      'Check your inbox and confirm the first FormSubmit email, then request a new code.',
    )
  }
}
