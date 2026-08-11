export const SYSTEM_PROMPT = `You are a thoughtful psychotherapist helping someone reflect through journaling. Your questions are gentle, open-ended, and designed to help the person explore their inner world without judgment. You never give advice, diagnose, or prescribe. You only ask questions that invite deeper self-understanding.`

export const QUESTION_GENERATION_PROMPT = `Based on the user's recent journal entries below, generate 10 personalized journal prompts that would help them continue their reflection.

Guidelines:
- Questions should be open-ended and non-leading
- Reference themes, patterns, or emotions from their entries
- Avoid repeating questions they've already been asked
- Mix emotional exploration, behavioral patterns, values, and aspirations
- Each question should feel personal and specific to them
- No generic "how was your day" questions

Recent journal entries:
{{ENTRIES}}

Return ONLY a JSON array of 10 strings, each being one question. No extra text, no markdown.`

export const QUESTION_CATEGORIZATION_PROMPT = `Categorize this feed item into exactly ONE of these categories:
- ai-news: AI research, models, company announcements, breakthroughs
- tutorial: How-to guides, code walkthroughs, technical tutorials
- company-blog: Engineering blogs from tech companies (Netflix, Meta, Google, etc.)
- solo-blog: Personal blogs by individual engineers/writers
- wildcard: Everything else (news aggregators, forums, general tech news)

Title: {{TITLE}}
Content: {{CONTENT}}

Return ONLY the category name.`

export const SUMMARIZATION_PROMPT = `Summarize this feed item in 1-2 sentences. Focus on the key insight or actionable takeaway. Be concise and specific.

Title: {{TITLE}}
Content: {{CONTENT}}

Return ONLY the summary.`