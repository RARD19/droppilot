import OpenAI from 'openai'
import { NextResponse } from 'next/server'


export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY no está configurada' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

    const product = await request.json()

    const response = await openai.responses.create({
      model: 'gpt-4.1-mini',
      instructions: `
Eres un analista experto en dropshipping, e-commerce y selección de productos.
Tu tarea es analizar un producto para uso personal dentro de DropPilot.

Debes ser realista y conservador. No prometas ventas.
Evalúa margen, precio, competencia, riesgo, facilidad de venta sin stock, proveedor, estado y datos actuales.
Responde siempre en español.
      `,
      input: `
Analiza este producto:

${JSON.stringify(product, null, 2)}

Devuelve una recomendación útil para decidir si conviene testear, observar, pausar o descartar.
      `,
      text: {
        format: {
          type: 'json_schema',
          name: 'drop_pilot_product_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              ai_score: {
                type: 'number',
                description: 'Score de 0 a 100 sobre la oportunidad del producto.'
              },
              verdict: {
                type: 'string',
                enum: ['Testear', 'Observar', 'Pausar', 'Descartar', 'Escalar']
              },
              suggested_price: {
                type: 'string',
                description: 'Precio de venta sugerido, o rango si no hay información suficiente.'
              },
              main_risk: {
                type: 'string',
                description: 'Riesgo principal del producto.'
              },
              reasoning: {
                type: 'string',
                description: 'Motivo claro y breve de la recomendación.'
              },
              next_step: {
                type: 'string',
                description: 'Siguiente acción recomendada.'
              }
            },
            required: [
              'ai_score',
              'verdict',
              'suggested_price',
              'main_risk',
              'reasoning',
              'next_step'
            ]
          }
        }
      }
    })

    const analysis = JSON.parse(response.output_text)

    return NextResponse.json({ analysis })
  } catch (error: any) {
    console.error(error)

    return NextResponse.json(
      { error: error.message || 'Error analizando producto con IA' },
      { status: 500 }
    )
  }
}