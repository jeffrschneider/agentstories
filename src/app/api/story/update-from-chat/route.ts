import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { AgentStory } from '@/lib/schemas/story';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UpdateRequest {
  messages: ChatMessage[];
  currentStory: AgentStory;
}

const EXTRACTION_PROMPT = `You are an AI that extracts structured updates to an agent specification from a conversation.

Given the current agent story and a conversation about changes, return ONLY a JSON object with the fields that should be UPDATED.

Rules:
- Only include fields that were explicitly discussed or changed
- Use the exact field names from the schema below
- For arrays (skills, guardrails), include the complete updated array if changes were made
- Omit fields that weren't discussed
- Return {} if no actionable changes were discussed

Schema fields you can update:
- name: string (agent's display name)
- identifier: string (lowercase, hyphens only)
- role: string (what role the agent fulfills)
- purpose: string (why this agent exists)
- autonomyLevel: "full" | "supervised" | "collaborative" | "directed"
- tags: string[] (categorization tags)
- skills: array of skill objects (if adding/modifying skills)
- guardrails: array of guardrail objects (if adding/modifying constraints)
- notes: string (additional notes)

Return ONLY valid JSON, no explanation.`;

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
    const body: UpdateRequest = await request.json();
    const { messages, currentStory } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ updates: {} });
    }

    // Build context
    const conversationText = messages
      .filter(m => m.role !== 'system')
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    const currentStoryContext = `Current agent story:
Name: ${currentStory.name || '(not set)'}
Purpose: ${currentStory.purpose || '(not set)'}
Role: ${currentStory.role || '(not set)'}
Autonomy: ${currentStory.autonomyLevel || '(not set)'}
Skills: ${currentStory.skills?.length || 0} defined
Guardrails: ${currentStory.guardrails?.length || 0} defined`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${currentStoryContext}\n\nConversation:\n${conversationText}\n\nExtract the updates as JSON:`,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const jsonText = textContent?.type === 'text' ? textContent.text : '{}';

    let updates: Partial<AgentStory>;
    try {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : '{}';
      updates = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse extraction response:', jsonText);
      updates = {};
    }

    return NextResponse.json({ updates });
  } catch (error) {
    console.error('Story update extraction error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to extract story updates' },
      { status: 500 }
    );
  }
}
