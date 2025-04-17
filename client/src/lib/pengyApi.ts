import { DrPengyMessage } from '@/components/DrPengyAssistant';

type ApiResponse = {
  content: string;
  error?: string;
};

/**
 * Sends a message to the Dr. Pengy AI assistant and gets a response
 */
export async function chatWithDrPengy(
  messages: DrPengyMessage[],
  model: string,
  systemPrompt: string
): Promise<ApiResponse> {
  try {
    // Format messages for OpenAI API
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
        .filter(m => m.status !== 'loading') // Remove loading messages
        .map(m => ({ 
          role: m.role, 
          content: m.content 
        }))
    ];
    
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formattedMessages,
        model: model
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response from AI');
    }
    
    const data = await response.json();
    
    return {
      content: data.content || 'عذراً، لم أستطع إيجاد رد مناسب. حاول مرة أخرى.',
    };
    
  } catch (error) {
    console.error('Error in chatWithDrPengy:', error);
    return {
      content: 'عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى لاحقًا.',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}