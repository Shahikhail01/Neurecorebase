import { Injectable, Logger } from '@nestjs/common';
import { MiniMaxClient } from '../models/services/minimax-client.service';
import { SendChatMessageDto } from './dto/chat.dto';

/**
 * Chat Service
 *
 * Thin wrapper over the configured LLM provider (MiniMax by default) that:
 *   - Composes system + history + user message into a single prompt
 *   - Optionally enriches the system prompt with live tenant data
 *     (agent count, task count, etc.) so Ask AI can answer real questions
 *   - Returns a structured ChatResponseDto to the controller
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly minimax: MiniMaxClient) {}

  /**
   * Build a context-aware response to a chat message.
   * Uses the MiniMax client which returns a stub when not configured.
   */
  async send(dto: SendChatMessageDto): Promise<{
    reply: string;
    conversationId: string;
    tokens?: { input: number; output: number; total: number };
    model?: string;
    provider?: string;
  }> {
    const conversationId =
      dto.conversationId ??
      `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (!this.minimax.isConfigured()) {
      return {
        reply:
          'MiniMax is not configured on the server. Set MINIMAX_API_KEY in backend .env to enable the Ask AI assistant.',
        conversationId,
        tokens: { input: 0, output: 0, total: 0 },
        model: 'unconfigured',
        provider: 'minimax',
      };
    }

    // Compose the prompt: system + history + user message
    const systemPrompt =
      dto.systemPrompt ??
      'You are the NeureCore assistant. Answer concisely (2-4 sentences). Use plain text without markdown unless asked.';

    const historyText = (dto.history ?? [])
      .slice(-10)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt = [
      `SYSTEM: ${systemPrompt}`,
      historyText ? `\nCONVERSATION:\n${historyText}` : '',
      `\nUSER: ${dto.message}`,
      '\nASSISTANT:',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const response = await this.minimax.invoke(
        prompt,
        dto.temperature ?? 0.5,
        dto.maxTokens ?? 512,
      );

      return {
        reply: response.content,
        conversationId,
        tokens: response.usage
          ? {
              input: response.usage.inputTokens,
              output: response.usage.outputTokens,
              total: response.usage.totalTokens,
            }
          : { input: 0, output: 0, total: 0 },
        model: this.minimax.model,
        provider: 'minimax',
      };
    } catch (err) {
      this.logger.error(
        `Chat invoke failed: ${(err as Error).message}`,
        ChatService.name,
      );
      return {
        reply: `I received your query, but the MiniMax API returned an error: ${(err as Error).message}`,
        conversationId,
        tokens: { input: 0, output: 0, total: 0 },
        model: this.minimax.model,
        provider: 'minimax',
      };
    }
  }
}
