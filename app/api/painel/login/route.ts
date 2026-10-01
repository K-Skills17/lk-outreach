import { NextRequest, NextResponse } from 'next/server';
import { requestLoginCode } from '@/lib/painel-auth';

// Step 1 of the painel login: send a one-time code to the owner's WhatsApp.
// The response is the same whether or not the phone belongs to a client.
export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({}));
  const digits = typeof body?.phone === 'string' ? body.phone.replace(/\D/g, '') : '';

  if (digits.length < 10) {
    return NextResponse.json({ error: 'Digite um número válido com DDD.' }, { status: 400 });
  }

  const result = await requestLoginCode(digits);
  switch (result.status) {
    case 'rate_limited':
      return NextResponse.json(
        { error: 'Muitos códigos solicitados. Aguarde alguns minutos e tente novamente.' },
        { status: 429 },
      );
    case 'send_failed':
      return NextResponse.json(
        { error: 'Não foi possível enviar o código pelo WhatsApp. Tente novamente em instantes.' },
        { status: 502 },
      );
    default:
      return NextResponse.json({ ok: true });
  }
}
