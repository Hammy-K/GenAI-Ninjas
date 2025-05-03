// Type declarations to extend OpenAI SDK typings
import 'openai';

declare module 'openai' {
  interface ImagesGenerateParams {
    quality?: 'low' | 'medium' | 'high' | 'auto';
  }
}