export interface IVoter {
    quantity: number;
    voters: Array<string>;
}
export interface IPoll {
    msgId: string;
    question: string;
    options: Array<string>;
    totalVotes: number;
    votes: Array<IVoter>;
}
