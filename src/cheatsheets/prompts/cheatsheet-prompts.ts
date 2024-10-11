import { PromptTemplate } from '@langchain/core/prompts';

export const createMapPrompt = () => {
  return PromptTemplate.fromTemplate(`
Instructions:

You are a helpful assistant tasked with analyzing a portion of a podcast transcript to contribute to a detailed cheatsheet for a busy product manager. Please focus solely on the content within this chunk. For each applicable section listed below, write comprehensive sentences that thoroughly explain each point. Ensure the result is formatted in Markdown with appropriate headings and subheadings.

Sections to Include (as relevant to this chunk):

Episode Summary

Brief Synopsis
Key Discussion Points
Key Takeaways

Actionable Insights
Lessons Learned
Notable Quotes

Memorable Statements
Speaker Attribution
Frameworks and Models Discussed

Descriptions
Applications
Case Studies and Examples

Overview
Insights
Industry Trends and Insights

Current Trends
Future Predictions
Tools and Resources

Recommended Tools
Additional Resources
Challenges and Solutions

Identified Challenges
Proposed Solutions
Questions for Reflection

Self-Assessment Questions
Team Discussion Points
Action Items

Immediate Steps
Long-Term Strategies
Personal Anecdotes and Stories

Engaging Narratives
Morals or Takeaways
Entertainment Highlights

Humorous Moments
Interesting Tidbits
Guidelines:

Writing Style: Use clear, professional language suitable for a seasoned product manager. Ensure the tone is engaging and informative.
Focus: Only include information present in this transcript chunk.
Detail and Depth: Provide sufficient detail to make the summary meaningful.
Markdown Format: Structure your response using Markdown syntax, including headings and subheadings.

Transcript Chunk:
{text}
`);
};

export const createCombinePrompt = () => {
  return PromptTemplate.fromTemplate(`
Instructions:

You are a helpful assistant tasked with combining summaries from multiple transcript chunks into a comprehensive cheatsheet for a busy product manager. Using the provided summaries, create a unified document that covers all relevant sections listed below. Write in full sentences and ensure the final result is formatted in Markdown with appropriate headings and subheadings.

Sections to Include:

Podcast Overview

Title and Episode Number
Host and Guest Information
Duration
Episode Summary

Brief Synopsis
Key Discussion Points
Key Takeaways

Actionable Insights
Lessons Learned
Notable Quotes

Memorable Statements
Speaker Attribution
Frameworks and Models Discussed

Descriptions
Applications
Case Studies and Examples

Overview
Insights
Industry Trends and Insights

Current Trends
Future Predictions
Tools and Resources

Recommended Tools
Additional Resources
Challenges and Solutions

Identified Challenges
Proposed Solutions
Questions for Reflection

Self-Assessment Questions
Team Discussion Points
Action Items

Immediate Steps
Long-Term Strategies
Personal Anecdotes and Stories

Engaging Narratives
Morals or Takeaways
Entertainment Highlights

Humorous Moments
Interesting Tidbits
Guidelines:

Integration: Seamlessly integrate information from all summaries, ensuring a logical flow and coherence.
Elimination of Redundancy: Remove duplicate information and resolve any inconsistencies.
Writing Style: Use clear, professional language suitable for a seasoned product manager. Maintain an engaging and informative tone throughout.
Detail and Depth: Provide sufficient detail to make the cheatsheet a standalone resource.
Markdown Format: Use Markdown syntax for headings, subheadings, lists, and emphasis where appropriate.

Summaries of Transcript Chunks:
{text}
  `);
};

export const createQuestionPrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with creating the initial summary for a detailed cheatsheet based on the first chunk of a podcast transcript for a busy product manager. Please focus solely on the content within this transcript chunk. For each applicable section listed below, write comprehensive sentences that thoroughly explain each point. Ensure the result is formatted in Markdown with appropriate headings and subheadings.
Sections to Include (as relevant to this chunk):

1. Episode Summary
    * Brief Synopsis
    * Key Discussion Points
2. Key Takeaways
    * Actionable Insights
    * Lessons Learned
3. Notable Quotes
    * Memorable Statements
    * Speaker Attribution
4. Frameworks and Models Discussed
    * Descriptions
    * Applications
5. Case Studies and Examples
    * Overview
    * Insights
6. Industry Trends and Insights
    * Current Trends
    * Future Predictions
7. Tools and Resources
    * Recommended Tools
    * Additional Resources
8. Challenges and Solutions
    * Identified Challenges
    * Proposed Solutions
9. Questions for Reflection
    * Self-Assessment Questions
    * Team Discussion Points
10. Action Items
    * Immediate Steps
    * Long-Term Strategies
11. Personal Anecdotes and Stories
    * Engaging Narratives
    * Morals or Takeaways
12. Entertainment Highlights
    * Humorous Moments
    * Interesting Tidbits

# Guidelines:

* Writing Style: Use clear, professional language suitable for a seasoned product manager. Ensure the tone is engaging and informative.
* Focus: Only include information present in this transcript chunk.
* Detail and Depth: Provide sufficient detail to make the summary meaningful.
* Markdown Format: Structure your response using Markdown syntax, including headings and subheadings.

# Transcript Chunk:
{text}
`);
};

export const createRefinePrompt = () => {
  return PromptTemplate.fromTemplate(`
# Instructions:

You are a helpful assistant tasked with refining and expanding a detailed cheatsheet for a busy product manager. Using the existing summary and new information from an additional chunk of a podcast transcript, create an updated and comprehensive cheatsheet. Your goals are to:
* Integrate New Information: Seamlessly incorporate relevant details from the new transcript chunk into the existing summary.
* Maintain Coherence: Ensure the updated summary reads smoothly, with logical flow and coherence across all sections.
* Eliminate Redundancies: Remove any duplicate information and resolve any inconsistencies.
* Enhance Detail and Depth: Provide additional details where appropriate to make the cheatsheet a standalone resource.
* Focus on Relevance: Prioritize information that is most useful and engaging for a busy product manager.

Sections to Include (as relevant):
1. Podcast Overview
    * Title and Episode Number
    * Host and Guest Information
    * Duration
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

# Guidelines:
* Writing Style: Use clear, professional language suitable for a seasoned product manager. Maintain an engaging and informative tone throughout.
* Markdown Format: Use Markdown syntax for headings, subheadings, lists, and emphasis where appropriate.
* Consistency: Ensure consistent terminology and style throughout the summary.
* Detail and Depth: Provide sufficient detail to make the cheatsheet a standalone resource.
* Integration: Seamlessly merge new information with existing content, ensuring a logical flow.
* Complete Summary: Provide a full, updated summary incorporating all relevant information from both the existing summary and the new chunk.

# Existing Summary:
{existing_answer}

# New Transcript Chunk:
{text}

# Updated Complete Summary:
[Provide the full, updated cheatsheet summary here, incorporating all relevant information from both the existing summary and the new chunk. Ensure all applicable sections are included and properly formatted in Markdown.]
`);
};
