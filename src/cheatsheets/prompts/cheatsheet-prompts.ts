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
