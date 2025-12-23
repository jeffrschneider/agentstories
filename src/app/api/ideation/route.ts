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

    // Debug logging
    console.log('=== Ideation API Debug ===');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key prefix:', apiKey?.substring(0, 15) + '...');
    console.log('API Key has whitespace:', apiKey !== apiKey?.trim());
    console.log('API Key has quotes:', apiKey?.startsWith('"') || apiKey?.startsWith("'"));
    console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC')));

    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY environment variable is not set. Please add it to .env.local' },
        { status: 500 }
      );
    }

    // Use trimmed key in case of whitespace issues
    const cleanApiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    console.log('Clean API Key prefix:', cleanApiKey.substring(0, 15) + '...');

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

    // Call Claude Opus
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
      max_tokens: 4096,
      system: IDEATION_SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === 'text');
    const assistantMessage = textContent?.type === 'text' ? textContent.text : '';

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
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
