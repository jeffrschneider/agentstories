import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { IDEATION_SYSTEM_PROMPT } from '@/lib/ideation/agent-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IdeationRequest {
  messages: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY environment variable is not set. Please add it to .env.local' },
        { status: 500 }
      );
    }

    // Use trimmed key in case of whitespace issues
    const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    const anthropic = new Anthropic({ apiKey: cleanApiKey });

    const body: IdeationRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Format messages for Claude API
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Create a streaming response using the Anthropic SDK
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      system: IDEATION_SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    // Create a ReadableStream that forwards the Anthropic stream as SSE
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if ('text' in delta) {
                // Send text delta as SSE
                const sseData = `data: ${JSON.stringify({ type: 'delta', text: delta.text })}\n\n`;
                controller.enqueue(encoder.encode(sseData));
              }
            } else if (event.type === 'message_stop') {
              // Signal completion
              const sseData = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            }
          }
          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Stream error';
          const sseData = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(sseData));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Ideation API error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process ideation request' },
      { status: 500 }
    );
  }
}
