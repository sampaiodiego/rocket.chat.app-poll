export interface IVoter {
    quantity: number;
    voters: Array<string>;
}
export interface IPoll {
    messageId: string;
    options: Array<string>;
    totalVotes: number;
    votes: Array<IVoter>;
}
