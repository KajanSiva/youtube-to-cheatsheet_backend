import { PromptTemplate } from '@langchain/core/prompts';

const contentStructure = `

1. Podcast Overview
    * Host and Guest Information
2. Episode Summary
    * Brief Synopsis
    * Key Discussion Points
3. Key Takeaways
    * Actionable Insights
    * Lessons Learned
4. Notable Quotes
    * Memorable Statements
    * Speaker Attribution
5. Frameworks and Models Discussed
    * Descriptions
    * Applications
6. Case Studies and Examples
    * Overview
    * Insights
7. Industry Trends and Insights
    * Current Trends
    * Future Predictions
8. Tools and Resources
    * Recommended Tools
    * Additional Resources
9. Challenges and Solutions
    * Identified Challenges
    * Proposed Solutions
10. Questions for Reflection
    * Self-Assessment Questions
    * Team Discussion Points
11. Action Items
    * Immediate Steps
    * Long-Term Strategies
12. Personal Anecdotes and Stories
    * Engaging Narratives
    * Morals or Takeaways
13. Entertainment Highlights
    * Humorous Moments
    * Interesting Tidbits

`;

const guidelines = `

* Writing Style: Use clear, professional language. Ensure the tone is engaging and informative.
* Focus: Only include information present in this transcript chunk.
* Consistency: Ensure consistent terminology and style throughout the summary.
* Detail and Depth: Provide sufficient detail in each section to make the cheatsheet a standalone resource, allowing the reader to fully grasp the content without having listened to the podcast.
* Markdown Format: Use Markdown syntax for headings, subheadings, lists, and emphasis where appropriate.
* Avoid Plagiarism: Paraphrase the content from the transcript in your own words. If direct quotes are used, enclose them in quotation marks and attribute them appropriately.

`;

const persona = `
This summary is for a busy product manager. Who wants to learn and understand the content of the podcast in depth.
`;

export const createQuestionPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with creating the initial summary for a detailed cheatsheet based on the first chunk of a podcast transcript for a busy persona detailed below. Please focus solely on the content within this transcript chunk. For each applicable section listed below, write comprehensive sentences that thoroughly explain each point. Ensure the result is formatted in Markdown with appropriate headings and subheadings.
The goal is to produce a rich, informative summary that entertains and enhances the knowledge of a busy persona detailed below.

# Who's this summary for?
${persona}

# Sections to Include (as relevant to this chunk):
${contentStructure}

# Guidelines:
${guidelines}

# Transcript Chunk:
{text}
`);
};

export const createRefinePrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with refining and expanding a detailed cheatsheet for a busy persona detailed below. Using the existing summary and new information from an additional chunk of a podcast transcript, create an updated and comprehensive cheatsheet. Your goals are to:
* Integrate New Information: Seamlessly incorporate relevant details from the new transcript chunk into the existing summary.
* Maintain Coherence: Ensure the updated summary reads smoothly, with logical flow and coherence across all sections.
* Eliminate Redundancies: Remove any duplicate information and resolve any inconsistencies.
* Enhance Detail and Depth: Provide additional details where appropriate to make the cheatsheet a standalone resource.
* Focus on Relevance: Prioritize information that is most useful and engaging for a busy persona detailed below.

# Who's this summary for?
${persona}

# Sections to Include (as relevant):
${contentStructure}

# Guidelines:
${guidelines}

# Existing Summary:
{existing_answer}

# New Transcript Chunk:
{text}

# Updated Complete Summary:
[Provide the full, updated cheatsheet summary here, incorporating all relevant information from both the existing summary and the new chunk. Ensure all applicable sections are included and properly formatted in Markdown.]
`);
};

export const createOneShotPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with creating a detailed cheatsheet based on a video transcript for a busy persona detailed below. Please focus solely on the content within this transcript.
For each section, write comprehensive sentences that thoroughly explain each point, rather than using brief bullet points. The goal is to produce a rich, informative summary that entertains and enhances the knowledge of a busy persona detailed below.

# Who's this summary for?
${persona}

# Sections to Include (as relevant):

${contentStructure}

# Guidelines:

${guidelines}

# Transcript:
{text}
  `);
};

/* Main theme & persona */
export const createMainThemeQuestionPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with identifying the main theme of a video based on the first chunk of its transcript. Focus solely on the content within this transcript chunk. Your goal is to analyze the content and summarize the primary topic or subject matter in one or two sentences, capturing the essence of the discussion.

# Transcript Chunk:
{text}

Main Theme:
[Provide a concise summary of the main theme based on this chunk]
`);
};

export const createMainThemeRefinePrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with refining and expanding the identification of a video's main theme. Using the existing theme summary and new information from an additional chunk of the video transcript, create an updated and comprehensive main theme description. Your goals are to:
* Integrate New Information: Incorporate relevant details from the new transcript chunk into the existing theme summary.
* Maintain Coherence: Ensure the updated theme description is clear and concise.
* Enhance Accuracy: Provide additional context if necessary to better capture the video's main subject matter.
* Focus on Relevance: Prioritize information that best represents the overall theme of the video.

# Existing Theme Summary:
{existing_answer}

# New Transcript Chunk:
{text}

# Updated Main Theme:
[Provide the refined main theme description here, incorporating insights from both the existing summary and the new chunk.]
`);
};

export const createMainThemeOneShotPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with identifying the main theme of a video based on its full transcript. Please focus solely on the content within this transcript. Your goal is to analyze the content and summarize the primary topic or subject matter in one or two sentences.

# Transcript:
{text}

Main Theme:
[Provide a concise summary of the main theme based on the full transcript]
`);
};

export const createTargetPersonaQuestionPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with identifying the target persona for a video based on the first chunk of its transcript. Your goal is to determine the type of audience that would most benefit from the content and describe this persona in detail.

# Persona Description Format:
- Professional role and industry
- Experience level
- Specific interests or challenges relevant to the video content
- Goals or objectives they might have that align with the video's topic

# Transcript Chunk:
{text}

Target Persona:
[Provide a detailed description of the target persona based on this chunk]
`);
};

export const createTargetPersonaRefinePrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with refining and expanding the identification of a video's target persona. Using the existing persona description and new information from an additional chunk of the video transcript, create an updated and comprehensive target persona description. Your goals are to:
* Integrate New Information: Incorporate relevant details from the new transcript chunk into the existing persona description.
* Maintain Coherence: Ensure the updated persona description is clear and detailed.
* Enhance Accuracy: Provide additional context if necessary to better capture the intended audience.
* Focus on Relevance: Prioritize information that best represents the target persona for the video content.

# Persona Description Format:
- Professional role and industry
- Experience level
- Specific interests or challenges relevant to the video content
- Goals or objectives they might have that align with the video's topic

# Existing Persona Description:
{existing_answer}

# New Transcript Chunk:
{text}

# Updated Target Persona:
[Provide the refined target persona description here, incorporating insights from both the existing description and the new chunk.]
`);
};

export const createTargetPersonaOneShotPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with identifying the target persona for a video based on its full transcript. Your goal is to determine the type of audience that would most benefit from the content and describe this persona in detail.

# Persona Description Format:
- Professional role and industry
- Experience level
- Specific interests or challenges relevant to the video content
- Goals or objectives they might have that align with the video's topic

# Transcript:
{text}

Target Persona:
[Provide a detailed description of the target persona based on the full transcript]
`);
};
