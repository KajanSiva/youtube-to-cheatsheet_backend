import { PromptTemplate } from '@langchain/core/prompts';

export const createMapPrompt = (language: string, focusedThemes: string[]) => {
  const sectionDescriptions = `
- summary: Brief overview capturing the essence of the entire video content.
- key_points: Consolidated list of main topics or concepts discussed.
- detailed_notes: Comprehensive and structured summary of the video content, including key arguments, examples, and explanations.
- important_quotes: List of the most notable quotes or standout statements.
- actions_takeaways: Compiled list of practical tips, steps, or lessons viewers can apply.
- glossary: Definitions of important specialized terms or concepts introduced.
- references_and_resources: Any external resources or citations mentioned.
  `;

  return PromptTemplate.fromTemplate(`
Analyze the following part of a video transcript and create a partial summary. Focus on the content of this specific part.
Generate the summary in ${language}.

# Focus Themes:
${focusedThemes.length > 0 ? focusedThemes.join(', ') : 'All themes'}

# Summary Sections:
${sectionDescriptions}

# Transcript Part:
{text}

Provide a concise summary focusing on the specified themes and sections:
  `);
};

export const createCombinePrompt = (
  language: string,
  focusedThemes: string[],
) => {
  const sectionDescriptions = `
- summary: Brief overview capturing the essence of the entire video content.
- key_points: Consolidated list of main topics or concepts discussed.
- detailed_notes: Comprehensive and structured summary of the video content, including key arguments, examples, and explanations.
- important_quotes: List of the most notable quotes or standout statements.
- actions_takeaways: Compiled list of practical tips, steps, or lessons viewers can apply.
- glossary: Definitions of important specialized terms or concepts introduced.
- references_and_resources: Any external resources or citations mentioned.
  `;

  return PromptTemplate.fromTemplate(`
Create a comprehensive cheatsheet for the entire video content by synthesizing the following partial summaries. 
Organize the information logically and eliminate redundancies.
Generate the cheatsheet in ${language}.

# Focus Themes:
${focusedThemes.length > 0 ? focusedThemes.join(', ') : 'All themes'}

# Summary Sections:
${sectionDescriptions}

{text}

Generate a final cheatsheet with these sections, ensuring each section adheres to its description:
- summary
- key_points
- detailed_notes
- important_quotes
- actions_takeaways
- glossary
- references_and_resources

Ensure the final cheatsheet is well-organized, covers the entire video content, and focuses on the specified themes:
  `);
};
