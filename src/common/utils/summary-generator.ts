import { ChatAnthropic } from '@langchain/anthropic';
import { Document } from 'langchain/document';
import { BasePromptTemplate } from '@langchain/core/prompts';
import { loadSummarizationChain } from 'langchain/chains';

export interface SummaryGeneratorOptions {
  refinePrompt: BasePromptTemplate;
  questionPrompt: BasePromptTemplate;
  oneShotPrompt: BasePromptTemplate;
  model: ChatAnthropic;
}

export async function generateSummary(
  docs: Document[],
  options: SummaryGeneratorOptions,
): Promise<string> {
  const { refinePrompt, questionPrompt, oneShotPrompt, model } = options;

  if (docs.length > 1) {
    const chain = loadSummarizationChain(model, {
      type: 'refine',
      questionPrompt,
      refinePrompt,
    });

    const result = await chain.invoke({ input_documents: docs });
    return result.output_text;
  }

  const chain = oneShotPrompt.pipe(model);
  const result = await chain.invoke({ text: docs[0].pageContent });
  return result.content.toString();
}
