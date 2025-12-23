import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { EXTRACTION_SYSTEM_PROMPT, IdeatedAgent } from '@/lib/ideation/agent-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractionRequest {
  messages: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const body: ExtractionRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { agent: { skills: [], guardrails: [] } as IdeatedAgent },
        { status: 200 }
      );
    }

    // Create a summary of the conversation for extraction
    const conversationSummary = messages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // Call Claude to extract the agent specification - use a faster model for extraction
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract the agent specification from this conversation:\n\n${conversationSummary}`,
        },
      ],
    });

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === 'text');
    const jsonText = textContent?.type === 'text' ? textContent.text : '{}';

    // Parse the JSON response
    let agent: IdeatedAgent;
    try {
      // Try to extract JSON from the response (it might have markdown formatting)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : '{}';
      agent = JSON.parse(cleanJson);

      // Ensure skills array exists
      if (!agent.skills) {
        agent.skills = [];
      }
      if (!agent.guardrails) {
        agent.guardrails = [];
      }
    } catch {
      console.error('Failed to parse extraction response:', jsonText);
      agent = { skills: [], guardrails: [] };
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Extraction API error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to extract agent specification' },
      { status: 500 }
    );
  }
}
