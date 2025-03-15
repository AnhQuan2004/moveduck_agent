import quizGen from "./actions/quiz_gen.ts";

//export all actions
export {quizGen};


export const aptosPlugin = {
    name: "aptos",
    description: "Aptos Plugin for Eliza",
    actions: [quizGen],
    evaluators: [],
    // providers: [walletProvider],
};

export default aptosPlugin;
