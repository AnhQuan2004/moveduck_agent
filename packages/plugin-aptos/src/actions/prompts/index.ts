export const labelDataPrompt = (textContent: string) => {
    return `
        You are an AI model specialized in analyzing and categorizing social media posts. Your task is to read the content of user message and assign the most appropriate category based on its meaning and context.

Ensure that:

Always select the most suitable category. If the content fits into multiple categories, choose the most relevant one.
If the post does not match any predefined category, create a new, concise, and meaningful category based on the post's topic.
Do not modify the content of the post. Only add the "category" and "color" fields.
Return the result in plain JSON format, without any surrounding backticks or code block formatting.
Categorization Guidelines:

- If the post contains news or updates → "News/Update" (Color: #2196F3)
- If the post is related to hackathons, competitions, or winner announcements → "Hackathon Update" (Color: #FF9800)
- If the post announces an event, conference, or invitation to join → "Event Announcement" (Color: #9C27B0)
- If the post analyzes the crypto market, financial indicators → "Crypto Market Analysis" (Color: #F44336)
- If the post mentions collaborations, partnerships, or alliances → "Collaboration Announcement" (Color: #FFEB3B)
- If the post is a personal story, reflection, or life lesson → "Personal Reflection" (Color: #795548)
- If the post is a proposal or introduction of a new project → "Proposal/Project Introduction" (Color: #607D8B)
- If the post contains motivational content, encouragement, or inspiration → "Motivational Post" (Color: #E91E63)
- If the post contains errors or is unavailable → "Error/Unavailable" (Color: #9E9E9E)
- If the post is meant to connect with the community, discussions, or engagement → "Community Engagement" (Color: #3F51B5)
- If the post relates to blockchain development, new technologies → "Blockchain Development" (Color: #00BCD4)
- If the post provides financial advice, investment tips → "Financial Advice" (Color: #FF5722)
- If the post contains educational content, learning resources, or tutorials → "Educational Content" (Color: #8BC34A)
- If the post does not fit into any of the above categories, create a new category based on its content and meaning.

Input data:
text: "${textContent}"
Output:
{
  "post": "After seeing these humanoid robot demos, I bet you'll be convinced that all manual labor will be gone to robots.\n\n(even the world's oldest profession will be taken by them).\n\nAll 26 humanoid robot demos:",
  "category": "Technology Discussion",
  "color": "#4CAF50" // Example color for the category
}
    `;
}



export const analyzePostPrompt = (textContent: string, datapost: string) => {
    return `
        Based on the question: "${textContent}"
        Analyze these relevant data posts: "${datapost}"

        Provide a focused analysis in the following format:

        ### 1. Direct Query Response
        - Provide the most direct and relevant answer to the query
        - Include only facts that are directly related to the main query
        - Note the confidence level of the information (High/Medium/Low)
        - Keep this section focused on core facts only

        ### 2. Key Information
        - **Core Details**:
          List only verified details directly related to the query (dates, numbers, requirements)
        - **Key Stakeholders**:
          List only organizations/entities directly involved

        ### 3. Additional Context & Insights
        - Note any missing but important information
        - List only directly related action items
        - Do not include speculative information
        - Do not mix information from unrelated events

        Important Guidelines:
        - Bold all dates, numbers, and deadlines using **text**
        - Keep each bullet point focused on a single piece of information
        - Maintain clear separation between sections with line breaks
        - Only include information that is directly related to the query
        - Exclude information from similar but different events
        - If information seems related but you're not sure, mention it in a 'Note:' at the end
    `;
}

export const evaluateSubmissionPrompt = (allPostsContent: string, submitData: string, criteria: string) => {
    return `
Prompt for Automated Submission Evaluation System
Task
Analyze and evaluate the submitted data based on the provided evaluation criteria to determine whether the submission qualifies for the bounty or not.

Input
- allPostsContent: A collection of all existing posts/content in the system for comparison and reference.
- submitData: Data submitted by the user that needs to be evaluated.
- criteria: A list of evaluation criteria with corresponding weights for each criterion.

Functional Requirements
1. Detailed Analysis

- Compare submitData with allPostsContent to evaluate its originality.
- Assess how well the submission meets each criterion in the criteria list.
- Identify any issues with data quality or failure to meet the defined criteria.

2. Scoring

- Assign a score to each individual criterion (on a scale of 0–10).
- Calculate a weighted overall score based on the importance of each criterion.
- Define a minimum score threshold for qualifying for the bounty.
- If the submission is entirely unrelated to the criteria, the overall score should be below 3/10.
- If the submission is a short, non-technical response, the overall score should be below 2/10.

3. Detailed Feedback

- Provide specific feedback for each evaluation criterion.
- Highlight the strengths and weaknesses of the submitted data.
- Offer specific suggestions for improvement (if necessary).

4. Final Evaluation

- Provide a clear conclusion on whether the submission qualifies for the bounty.
- Give specific reasons for the decision.
- The submission will only qualify for the bounty if the overall score is 7/10 or higher.

Strict Scoring Guidelines
- If the submission lacks code when the criteria require code: maximum score = 2/10.
- If the submission lacks instructions when the criteria require them: maximum score = 3/10.
- If the submission is just a call to action or an announcement: maximum score = 1/10.
- If the submission does not mention any of the criteria in criteria: maximum score = 0/10.
- If the submission is unrelated to the bounty topic: score = 0/10.

Expected Output
Return an evaluation report structured as follows:
{
  "overallScore": number,
  "qualifiesForBounty": boolean,
  "summary": "string",
  "detailedFeedback": "string"
}
Evaluation Data
- overallScore: Final computed score based on weighted evaluation.
- qualifiesForBounty: Boolean indicating if the submission meets the bounty requirements.
- summary: A brief overview of the evaluation result.
- detailedFeedback: A detailed explanation of how the submission performed against each criterion and areas for improvement.
allPostsContent: ${allPostsContent}

submitData: ${submitData}

criteria: ${criteria}
    `;
}

export const quizGenPrompt = (textContent: string) => {
    return `
        Generate 4 multiple-choice questions based on this text:
        "${textContent}"

        Requirements:
        - Always generate exactly 4 questions based on the key knowledge from the content.
        - STRICT REQUIREMENT: Each question and answer MUST be 18 characters or less.
        - Questions should be very concise and to the point.
        - Each question must test different aspects of the content.
        - Each question must have 4 answer choices, labeled A, B, C, and D.
        - Answers must be extremely short - single words or brief phrases only.
        - Only one answer should be correct.
        - If a concept can't be expressed in 18 chars, simplify it or break it down.

        Format the output as follows:
        Example Output:
        Question 1: What is Move?
        A. Smart contract
        B. Blockchain
        C. Database
        D. Network
        Correct Answer: B

        Question 2: Move speed?
        A. Very fast
        B. Medium
        C. Slow
        D. Variable
        Correct Answer: A

        Question 3: Move secure?
        A. Very high
        B. Medium
        C. Low
        D. None
        Correct Answer: A

        Question 4: Move cost?
        A. Free
        B. Low cost
        C. High cost
        D. Variable
        Correct Answer: B
    `;
}



export const generateBountyPrompt = (textContent: string, datapost: string) => {
    return `
        # Prompt: Analyze User Query and Generate Project Details
Based on the question: "${textContent}"
Using data posts as knowledge: "${datapost}"

Parse the provided user query related to technical projects, then generate:
1. A concise, professional title that describes the project goal (NOT the user's request)
2. A clear, concise project description (2-4 sentences)
3. A bullet point list of key requirements (4-8 points)

All sections should be presented professionally in a compact format that's easy to scan and understand.

## Processing Workflow:
1. Carefully read the user query
2. Identify the core project purpose and technologies
3. Create a professional title that describes what needs to be built/done (NOT "Create Bounty for...")
4. Determine the most essential requirements
5. Create a brief but comprehensive description
6. List only the most important requirements as bullet points

## Example User Query and Response:
Query: "create bounty for developing a smart contract on Aptos"

**Title**
Aptos Smart Contract Development Project

**Description**
[Brief project overview in 2-4 sentences]

**Requirements**
[List of key requirements, maximum 5 points]
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]
- [Requirement 4]

**Tags**
[Provide 2-4 relevant technical tags, separated by commas.]

## Expected Output Format:

**Title**
[Create a professional project title - DO NOT start with "Create Bounty for"]

**Description**
[Brief project overview in 2-4 sentences]

**Requirements**
[List of key requirements, maximum 5 points]
- [Requirement 1]
- [Requirement 2]
- [Requirement 3]
- [Requirement 4]

**Tags**
[Provide 2-4 relevant technical tags, separated by commas.]
    `;
}

export const getAllPostsPrompt = (textContent: string, datapost: string) => {
    return `
        Based on the request: "${textContent}"
        Format these posts into a GFM markdown table: "${datapost}"

        # Posts Overview

        | No. | Author | Post Content |
        |-----|:------:|--------------|
        ${datapost}

        Please follow these formatting rules:
        1. Number each post sequentially
        2. Truncate long post content to first 100 characters and add "..." if needed
        3. Maximum 20 posts per page
        4. Use proper column alignment syntax:
           - Left-align the "No." column
           - Center-align the "Author" column (using :---:)
           - Left-align the "Post Content" column
        5. Ensure all table cells follow GFM markdown table syntax
        6. Do not include explain, just the table
    `;
}