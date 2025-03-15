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
        - For longer content (like web pages), focus on the most important concepts and key takeaways.
        - For technical content, prioritize questions about core concepts, features, and benefits.

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

