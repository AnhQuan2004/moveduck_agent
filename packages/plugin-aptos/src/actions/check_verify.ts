import { Action, ActionExample, Memory, IAgentRuntime, State, HandlerCallback, generateText, ModelClass } from "@elizaos/core";
import { get_all_bounties, participateInBounty } from '../services/bounty';
import { evaluateSubmissionPrompt } from './prompts';
import * as fs from 'fs/promises';
import { ethers } from 'ethers';

// Utility function to write logs to file
async function writeToLog(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        await fs.appendFile('pinata_bounty.txt', logMessage);
    } catch (error) {
        console.error('Error writing to log file:', error);
    }
}

// Log the return values of functions
async function logFunctionReturn(functionName: string, returnValue: any) {
    await writeToLog(`Function ${functionName} returned: ${JSON.stringify(returnValue)}`);
}

// Function to fetch data from IPFS
async function getPinataData(cid: string) {
    try {
        console.log(`Fetching IPFS data for CID: ${cid}`);
        const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
        if (!response.ok) {
            if (response.status === 422) {
                // Silently ignore 422 errors
                return null;
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Successfully fetched IPFS data for CID: ${cid}`);
        return data;
    } catch (error) {
        // Only log non-422 errors
        if (error.message && !error.message.includes('422')) {
            console.error(`Error fetching IPFS data for CID ${cid}:`, error.message);
        }
        return null;
    }
}

export default {
    name: "CHECK_VERIFY",
    similes: [
        "check bounty", "verify bounty", "get all bounties", "list bounties", "evaluate submission", "submit bounty"
    ],
    description: "Check and verify all bounties data from the blockchain, and evaluate submissions",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return message.content?.text?.length > 0;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: {
            userAddress?: string;
            [key: string]: unknown
        },
        callback?: HandlerCallback
    ) => {
        try {
            const messageText = message.content.text.toLowerCase();
            const isSubmission = messageText.includes('data submit') && messageText.includes('wallet address') && messageText.includes('bountyid');

            if (isSubmission) {
                await writeToLog("Starting submission evaluation process");
                
                // Parse user input
                const matches = message.content.text.match(/data submit:\s*([\s\S]+?)\s*wallet address:\s*([\s\S]+?)\s*bountyId:\s*([\s\S]+?)(?:\s|$)/);
                
                if (!matches) {
                    throw new Error("Invalid input format. Please provide data submit, wallet address, and bountyId.");
                }

                const [, submitData, walletAddress, bountyId] = matches;

                // Get all bounties from blockchain
                console.log("\n=== FETCHING BOUNTY DATA ===");
                const bounties = await get_all_bounties();
                await logFunctionReturn('get_all_bounties', bounties);

                if (!bounties || (Array.isArray(bounties) && bounties.length === 0)) {
                    throw new Error("Failed to fetch bounties");
                }

                // The response is nested in an array of arrays, so we need to get the first element
                const bountyList = Array.isArray(bounties[0]) ? bounties[0] : bounties;
                console.log("Processed bounty list:", JSON.stringify(bountyList, null, 2));

                // Find the specific bounty
                const bounty = bountyList.find((b: any) => b.bounty_id === bountyId);
                if (!bounty) {
                    callback?.({
                        text: `Bounty not available. The bounty ID ${bountyId} could not be found.`,
                        action: "CHECK_VERIFY",
                        params: {
                            type: "submission_evaluation",
                            error: "bounty_not_found",
                            bountyId
                        }
                    });
                    return;
                }

                // Fetch IPFS data for the bounty
                console.log(`\n=== FETCHING IPFS DATA FOR BOUNTY ${bountyId} ===`);
                const ipfsData = await getPinataData(bounty.data_ref || bountyId);
                await logFunctionReturn('getPinataData', ipfsData);
                if (!ipfsData) {
                    throw new Error("Failed to fetch bounty IPFS data");
                }

                // Prepare data for evaluation
                const allPostsContent = JSON.stringify(ipfsData.allPostData);
                const requirements = ipfsData.requirements.join("\n");

                // Generate evaluation using AI
                console.log("\n=== EVALUATING SUBMISSION ===");
                const evaluationResult = await generateText({
                    runtime,
                    context: evaluateSubmissionPrompt(allPostsContent, submitData, requirements),
                    modelClass: ModelClass.SMALL,
                });
                await logFunctionReturn('generateText', evaluationResult);

                let evaluation;
                try {
                    const cleanResult = evaluationResult
                        .replace(/```json\n?/g, '')  // Remove ```json
                        .replace(/```\n?/g, '')      // Remove closing ```
                        .trim();                     // Remove extra whitespace
                    
                    console.log("Cleaned evaluation result:", cleanResult);
                    evaluation = JSON.parse(cleanResult);
                } catch (error) {
                    console.error("Failed to parse evaluation result:", error);
                    console.error("Raw evaluation result:", evaluationResult);
                    evaluation = {
                        overallScore: 0,
                        qualifiesForBounty: false,
                        summary: "Failed to process evaluation",
                        detailedFeedback: "Error in evaluation process. Raw response: " + evaluationResult
                    };
                }

                // If submission qualifies, call the smart contract
                if (evaluation.qualifiesForBounty) {
                    console.log("\n=== SUBMITTING TO BLOCKCHAIN ===");
                    try {
                        const point = Math.floor(evaluation.overallScore * 10); // Convert score to points (0-100)
                        const result = await participateInBounty(
                            walletAddress,
                            point,
                            bountyId
                        );
                        await logFunctionReturn('participateInBounty', result);
                        console.log("Blockchain submission result:", result);
                    } catch (error) {
                        console.error("Failed to submit to blockchain:", error);
                        evaluation.summary += "\nWarning: Qualified but failed to submit to blockchain.";
                    }
                }

                // Send response with evaluation results
                callback?.({
                    text: `Evaluation complete for bounty ${bountyId}, ${evaluation.summary}, ${evaluation.detailedFeedback}`,
                    action: "CHECK_VERIFY",
                    params: {
                        type: "submission_evaluation",
                        bountyId,
                        walletAddress,
                        evaluation,
                        bountyDetails: {
                            ...bounty,
                            rewardAmount: bounty.reward_amount ? (parseInt(bounty.reward_amount) / 100000000).toString() : "0", // Convert from Octas to APT
                            expiredAt: new Date(Number(bounty.expired_at) * 1000).toISOString(),
                            requirements: ipfsData.requirements,
                            allPostData: ipfsData.allPostData
                        }
                    }
                });

            } else {
                // Original bounty listing functionality
                await writeToLog("Starting bounty verification process");

                console.log("\n=== FETCHING ALL BOUNTIES FROM BLOCKCHAIN ===");
                const bounties = await get_all_bounties();
                await logFunctionReturn('get_all_bounties', bounties);

                if (!bounties || bounties instanceof Error) {
                    throw new Error("Failed to fetch bounties");
                }

                // The response is nested in an array of arrays, so we need to get the first element
                const bountyList = Array.isArray(bounties[0]) ? bounties[0] : bounties;
                console.log("Processing bounty list:", JSON.stringify(bountyList, null, 2));

                const formattedBounties = await Promise.all(bountyList.map(async bounty => {
                    const ipfsData = await getPinataData(bounty.data_ref || bounty.bounty_id);
                    
                    // Only include bounties with valid IPFS data
                    if (ipfsData) {
                        console.log(`Successfully processed bounty ID: ${bounty.bounty_id}`);
                        return {
                            bountyId: bounty.bounty_id,
                            creator: bounty.creator,
                            rewardAmount: bounty.reward_amount ? (parseInt(bounty.reward_amount) / 100000000).toString() : "0", // Convert from Octas to APT
                            minOfParticipants: bounty.min_of_participants,
                            expiredAt: new Date(Number(bounty.expired_at) * 1000).toISOString(),
                            distributed: bounty.distributed,
                            participantCount: (bounty.participants || []).length,
                            allPostData: ipfsData.allPostData || {},
                            title: ipfsData.title || '',
                            description: ipfsData.description || '',
                            requirements: ipfsData.requirements || [],
                            tags: ipfsData.tags || []
                        };
                    }
                    return null;
                }));

                // Filter out null values (bounties without valid IPFS data)
                const validBounties = formattedBounties.filter(bounty => bounty !== null);

                await writeToLog(`Successfully fetched ${validBounties.length} valid bounties with IPFS data`);

                callback?.({
                    text: `Found ${validBounties.length} valid bounties on the blockchain.`,
                    action: "CHECK_VERIFY",
                    params: {
                        type: "bounty_list",
                        bounties: validBounties,
                        totalCount: validBounties.length
                    }
                });
            }

        } catch (error) {
            console.error("❌ Error in process:", error);
            await writeToLog(`Error in process: ${error.message}`);
            throw error;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check all bounties"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Found X bounties on the blockchain with details..."
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "data submit: My submission content\nwallet address: 0x123...\nbountyId: abc123..."
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Evaluation complete with score and feedback..."
                }
            }
        ]
    ] as ActionExample[][]
}; 