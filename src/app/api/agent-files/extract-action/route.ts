import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import type { AgentFile } from '@/lib/agent-files';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractActionRequest {
  messages: ChatMessage[];
  currentFile: AgentFile | null;
  allFiles: AgentFile[];
}

interface ChatAction {
  type: 'create_file' | 'update_file' | 'delete_file';
  path: string;
  content?: string;
}

const EXTRACTION_PROMPT = `You are an AI that extracts file operations from a conversation about editing an agent.

Given a conversation and the current file context, determine if the user wants to:
1. UPDATE the current file (return updated content)
2. CREATE a new file (return path and content)
3. DELETE a file (return path)

Rules:
- Only return an action if the conversation clearly indicates a file change
- For skill creation, use path: skills/{slug}/SKILL.md
- For updates, return the COMPLETE updated file content
- Return null if no file operation is needed

Response format (JSON only, no explanation):
{
  "action": {
    "type": "create_file" | "update_file" | "delete_file",
    "path": "string",
    "content": "string (for create/update)"
  }
}

Or if no action:
{
  "action": null
}`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ action: null });
    }

    const anthropic = new Anthropic({ apiKey });
    const body: ExtractActionRequest = await request.json();
    const { messages, currentFile, allFiles } = body;

    if (!messages || messages.length < 2) {
      return NextResponse.json({ action: null });
    }

    // Build context
    const fileContext = currentFile
      ? `Current file: ${currentFile.path}\nContent:\n${currentFile.content}`
      : `No file selected. Available files:\n${allFiles.map(f => f.path).join('\n')}`;

    const conversationText = messages
      .slice(-4) // Last 4 messages for context
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: EXTRACTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${fileContext}\n\nConversation:\n${conversationText}\n\nExtract file action:`,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const jsonText = textContent?.type === 'text' ? textContent.text : '{}';

    try {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : '{}';
      const parsed = JSON.parse(cleanJson);

      if (parsed.action && parsed.action.type) {
        return NextResponse.json({ action: parsed.action as ChatAction });
      }
    } catch {
      console.error('Failed to parse action:', jsonText);
    }

    return NextResponse.json({ action: null });
  } catch (error) {
    console.error('Action extraction error:', error);
    return NextResponse.json({ action: null });
  }
}
