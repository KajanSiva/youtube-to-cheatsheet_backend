import { PromptTemplate } from '@langchain/core/prompts';

const guidelines = `

- Writing Style: Use clear, professional language suitable for the specified persona. Ensure the tone is engaging and informative.
- Format:
  - Write in well-structured paragraphs, providing detailed explanations and insights.
  - Incorporate direct quotes from the transcript to highlight key points, enclosing them in quotation marks and attributing them to the speakers.
  - Use bullet points sparingly, only when listing items that benefit from being in a list format.
- Focus: Only include information present in this transcript.
- Consistency: Ensure consistent terminology and style throughout the summary.
- Detail and Depth: Provide sufficient detail in each section to make the summary a standalone resource, allowing the reader to fully grasp the content without having watched the video.
- Markdown Format: Use Markdown syntax for headings, subheadings, and emphasis where appropriate.
- Avoid Plagiarism: Paraphrase the content from the transcript in your own words. If direct quotes are used, enclose them in quotation marks and attribute them appropriately.


`;

export const createQuestionPrompt = (contentStructure, persona) => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with creating the initial summary for a detailed summary based on the first chunk of a podcast transcript for a busy persona detailed below. Please focus solely on the content within this transcript chunk. For each applicable section listed below, write comprehensive sentences that thoroughly explain each point. Ensure the result is formatted in Markdown with appropriate headings and subheadings.
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

export const createRefinePrompt = (contentStructure, persona) => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with refining and expanding a detailed summary for a busy persona detailed below. Using the existing summary and new information from an additional chunk of a podcast transcript, create an updated and comprehensive detailed summary. Your goals are to:
* Integrate New Information: Seamlessly incorporate relevant details from the new transcript chunk into the existing summary.
* Maintain Coherence: Ensure the updated summary reads smoothly, with logical flow and coherence across all sections.
* Eliminate Redundancies: Remove any duplicate information and resolve any inconsistencies.
* Enhance Detail and Depth: Provide additional details where appropriate to make the detailed summary a standalone resource.
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
[Provide the full, updated detailed summary here, incorporating all relevant information from both the existing summary and the new chunk. Ensure all applicable sections are included and properly formatted in Markdown.]
`);
};

export const createOneShotPrompt = (contentStructure, persona) => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with creating a detailed summary based on a video transcript for a busy persona detailed below. Please focus solely on the content within this transcript.
For each section, write well-structured paragraphs that thoroughly explain each point, incorporating direct quotes from the transcript where appropriate. Use bullet points sparingly, only when they enhance the clarity of the information. The goal is to produce a rich, informative summary that entertains and enhances the knowledge of the busy persona detailed below.

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

Determine the main theme of the video based on the first chunk of its transcript. Your goal is to analyze the content and determine the main theme of the video, without going too much into detail about the specific content of the video.
The final result should be few words that categorize the main theme of the video.

# Transcript Chunk:
{text}

Main Theme:
`);
};

export const createMainThemeRefinePrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

Determine the main theme of the video based on it's transcript. Using the existing theme summary and new information from an additional chunk of the video transcript, create an updated and comprehensive main theme description. Your goals are to:
The final result should be few words that categorize the main theme of the video.

# Existing Theme Summary:
{existing_answer}

# New Transcript Chunk:
{text}

# Updated Main Theme:
`);
};

export const createMainThemeOneShotPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

Determine the main theme of the video based on its full transcript. Your goal is to analyze the content and determine the main theme of the video, without going too much into detail about the specific content of the video.
The final result should be few words that categorize the main theme of the video.

# Transcript:
{text}

Main Theme:
`);
};

export const createTargetPersonaQuestionPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with identifying the target persona for a video based on the first chunk of its transcript. Your goal is to determine the type of audience that would most benefit from the content and describe this persona in detail.
Ensure the result is formatted in Markdown with appropriate headings and subheadings.

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

Ensure the result is formatted in Markdown with appropriate headings and subheadings.

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
Ensure the result is formatted in Markdown with appropriate headings and subheadings.

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

export const createContentStructurePrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with creating a content structure for a detailed summary based on a video's main theme and target persona. Your goal is to design a comprehensive and relevant structure that will best serve the needs of the target audience.

# Video Information:
Main Theme: {mainTheme}
Target Persona: {persona}

# Guidelines:
- Create a detailed content structure with main sections and subsections
- Ensure the structure is relevant to the main theme and tailored to the target persona
- Use clear and concise headings for each section
- Include 8-12 main sections, each with 2-4 subsections
- Format the structure using Markdown syntax

# Example Content Structure:

## Persona
Professional role and industry:
- Product managers, engineers, or designers working in tech companies, particularly those focused on AI and machine learning products

Experience level:
- Mid to senior-level professionals with several years of experience in product development or technology

Specific interests or challenges relevant to the video content:
- Interested in AI and machine learning applications, particularly in natural language processing and content generation
- Curious about innovative product development processes and how to build disruptive products within large organizations
- Facing challenges in creating user-friendly interfaces for complex AI technologies
- Interested in the intersection of technology and content creation, especially in audio and text formats

Goals or objectives they might have that align with the video's topic:
- Seeking inspiration for new AI-powered product ideas
- Looking to understand how to build and scale AI products rapidly
- Wanting to learn about unconventional product development approaches within large tech companies
- Aiming to create more engaging and personalized user experiences using AI
- Interested in exploring new ways to transform and present information using AI technologies
- Seeking to understand the potential future directions of AI in content creation and knowledge management

This persona would likely be someone who is passionate about pushing the boundaries of what's possible with AI, values user-centric design, and is interested in learning from innovative approaches to product development in the tech industry.

## Main Theme
The main theme of this podcast episode is a discussion about Notebook LM, an innovative AI product developed by Google Labs. The guest, Riza Martin, who is the product lead for Notebook LM, shares insights into the product's development, its unique features (especially the audio overview function), and how it was created within Google's organizational structure. The conversation covers the product's origins as a 20% project, its rapid growth, and its potential future applications, highlighting how Notebook LM represents a new approach to AI-powered content creation and interaction.

## Content Structure

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

# Generated Content Structure:
[Provide the content structure here, using Markdown formatting for headings and subheadings]
  `);
};
