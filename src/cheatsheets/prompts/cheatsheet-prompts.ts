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
