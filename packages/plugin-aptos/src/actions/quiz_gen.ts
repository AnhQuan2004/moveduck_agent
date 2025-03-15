import { Action, ActionExample, Memory, IAgentRuntime, State, HandlerCallback, generateText, ModelClass, elizaLogger } from "@elizaos/core";
import { quizGenPrompt } from "./prompts";
import { QuizGenAction } from "./enum";
import axios from 'axios';
import { getTweetById } from "./twitterClient";
import { getPageContent } from "./crawl_web";
import { URL } from "url";

interface QuizQuestion {
    question: string;
    answerA: string;
    answerB: string;
    answerC: string;
    answerD: string;
    correctAnswer: string;
}

// Function to extract tweet ID from Twitter URL
function extractTweetId(text: string): string | null {
    // Match Twitter/X URLs in various formats
    const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:\w+)\/status\/(\d+)/i;
    const match = text.match(twitterRegex);
    
    if (match && match[1]) {
        return match[1];
    }
    
    return null;
}

// Function to extract URLs from text
function extractUrl(text: string): string | null {
    // Check for URLs with @ prefix (e.g., "gen quiz @https://example.com")
    const atPrefixRegex = /@(https?:\/\/[^\s]+)/i;
    const atMatch = text.match(atPrefixRegex);
    
    if (atMatch && atMatch[1]) {
        return atMatch[1];
    }
    
    // Regular URL matching as fallback
    const urlRegex = /(https?:\/\/[^\s]+)/i;
    const match = text.match(urlRegex);
    
    if (match && match[1]) {
        return match[1];
    }
    
    return null;
}

// Function to check if URL is from allowed domains
function isAllowedDomain(url: string): boolean {
    try {
        const domain = new URL(url).hostname;
        return domain.includes("aptos.dev") || domain.includes("move-developers-dao.gitbook.io");
    } catch (error) {
        elizaLogger.error(`Error parsing URL: ${error}`);
        return false;
    }
}

interface QuizData {
    questions: QuizQuestion[];
    source?: {
        type: string;
        id?: string;
        url?: string;
        document?: string;
    };
}

// Function to store quiz data to backend
async function storeQuizToBackend(quizData: QuizData): Promise<boolean> {
    try {
        const response = await axios.post(
            'https://movestack-backend.vercel.app/api/v1/quiz',
            quizData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.status >= 200 && response.status < 300) {
            elizaLogger.info('Quiz data successfully stored to backend:', response.data);
            return true;
        } else {
            elizaLogger.error('Failed to store quiz data to backend:', response.status, response.data);
            return false;
        }
    } catch (error) {
        elizaLogger.error('Error storing quiz data to backend:', error);
        return false;
    }
}

export default {
    name: "QUIZ_GEN",
    similes: [
        "quiz gen", "quiz", "I need to quiz gen", "help me quiz gen", "what quiz gen", "help me generate a quiz", "generate a quiz", "quiz generation", "quiz generation help", "quiz generation help me", "quiz generation what", "quiz generation generate", "gen quiz", "create question", "generate question", "help me create question", "help me generate question"
    ],
    description: "Quiz gen and create question from tweet, url and document",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return message.content?.text?.length > 0;
    },
    handler: async (runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback) => {
        try {
            let contentText = message.content.text;
            const tweetId = extractTweetId(contentText);
            let sourceInfo = null;
            
            // If a Twitter URL is found, fetch the tweet content
            if (tweetId) {
                try {
                    elizaLogger.info(`Found Twitter URL with ID: ${tweetId}. Fetching tweet content...`);
                    const tweet = await getTweetById(tweetId);
                    
                    if (tweet && tweet.text) {
                        elizaLogger.info(`Successfully fetched tweet: ${tweet.text}`);
                        // Use the tweet text as content for quiz generation
                        contentText = tweet.text;
                        
                        // Store source information
                        sourceInfo = {
                            type: 'twitter',
                            id: tweetId,
                            url: message.content.text.match(/(https?:\/\/[^\s]+)/i)?.[1] || `https://twitter.com/i/status/${tweetId}`,
                            document: tweet.text // Add the original tweet content
                        };
                    } else {
                        elizaLogger.warn(`Could not fetch tweet content for ID: ${tweetId}`);
                    }
                } catch (error) {
                    elizaLogger.error(`Error fetching tweet: ${error}`);
                    // Continue with original text if tweet fetch fails
                }
            } else {
                // Check for URLs from allowed domains
                const url = extractUrl(contentText);
                if (url && isAllowedDomain(url)) {
                    try {
                        elizaLogger.info(`Found URL from allowed domain: ${url}. Crawling content...`);
                        const webContent = await getPageContent(url);
                        
                        if (webContent && webContent.length > 0) {
                            elizaLogger.info(`Successfully crawled content from: ${url}`);
                            // Use the crawled content for quiz generation
                            contentText = webContent;
                            
                            // Store source information
                            sourceInfo = {
                                type: 'web',
                                url: url,
                                document: webContent // Add the original web content
                            };
                        } else {
                            elizaLogger.warn(`Could not crawl content from URL: ${url}`);
                        }
                    } catch (error) {
                        elizaLogger.error(`Error crawling web content: ${error}`);
                        // Continue with original text if web crawl fails
                    }
                }
            }
            
            const context = quizGenPrompt(contentText);
            console.log(context);

            const response = await generateText({
                runtime,
                context: JSON.stringify(context),
                modelClass: ModelClass.SMALL,
            });

            let parsedQuestions: QuizQuestion[] = [];
            let parsedResponse: any;
            const processedQuestions = new Set();

            try {
                // First try parsing as JSON
                parsedResponse = JSON.parse(response.trim());
                if (Array.isArray(parsedResponse)) {
                    parsedQuestions = parsedResponse;
                } else {
                    parsedQuestions = [parsedResponse];
                }
            } catch (e) {
                // If JSON parsing fails, try parsing the formatted text
                const lines = response.trim().split('\n');
                let currentQuestion: Partial<QuizQuestion> = {};
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    if (line.startsWith('Question')) {
                        // If we have a complete question, check for duplicates before adding
                        if (currentQuestion.question && currentQuestion.correctAnswer) {
                            if (!processedQuestions.has(currentQuestion.question)) {
                                parsedQuestions.push(currentQuestion as QuizQuestion);
                                processedQuestions.add(currentQuestion.question);
                            }
                        }
                        // Start new question
                        currentQuestion = {};
                        const questionMatch = line.match(/Question \d+:\s*(.*)/);
                        if (questionMatch) {
                            currentQuestion.question = questionMatch[1].trim();
                        }
                    } else if (line.startsWith('A.')) currentQuestion.answerA = line.substring(2).trim();
                    else if (line.startsWith('B.')) currentQuestion.answerB = line.substring(2).trim();
                    else if (line.startsWith('C.')) currentQuestion.answerC = line.substring(2).trim();
                    else if (line.startsWith('D.')) currentQuestion.answerD = line.substring(2).trim();
                    else if (line.startsWith('Correct Answer:')) {
                        const correctMatch = line.match(/:\s*([A-D])/i);
                        if (correctMatch) {
                            currentQuestion.correctAnswer = correctMatch[1].trim();
                        }
                        // Add the last question if complete and not duplicate
                        if (currentQuestion.question && currentQuestion.correctAnswer) {
                            if (!processedQuestions.has(currentQuestion.question)) {
                                parsedQuestions.push(currentQuestion as QuizQuestion);
                                processedQuestions.add(currentQuestion.question);
                            }
                        }
                    }
                }
            }

            const quizData: QuizData = {
                questions: parsedQuestions
            };

            // Add source information if available
            if (sourceInfo) {
                quizData.source = sourceInfo;
            }

            // Store quiz data to backend
            await storeQuizToBackend(quizData);
            
            callback({
                text: response.trim(),
                action: QuizGenAction.QUIZ_GEN,
                params: quizData,
                document: sourceInfo?.document || contentText // Include the original document content
            });

        } catch (error) {
            console.error('Error in quiz gen:', error);
            throw error;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I love the new features in the app! It's so user-friendly."
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "The app has improved a lot, especially the new updates!"
                }
            }
        ],
        [
            {
                user: "{{user3}}",
                content: {
                    text: "I'm not happy with the recent changes. They made it worse."
                }
            },
            {
                user: "{{user4}}",
                content: {
                    text: "The latest update is frustrating and confusing."
                }
            }
        ],
        [
            {
                user: "{{user5}}",
                content: {
                    text: "gen quiz @https://move-developers-dao.gitbook.io/aptos-move-by-example/why-is-move-secure"
                }
            }
        ]
    ] as ActionExample[][],
};

export interface TwitterPost {
    id: string;
    text: string;
    userId: string;
    createdAt: Date;
    username?: string;
    profileImageUrl?: string;
    url?: string;
}
