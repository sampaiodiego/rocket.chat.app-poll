export interface IVoter {
    quantity: number;
    voters: Array<string>;
}
export interface IPoll {
    msgId: string;
    uid: string; // user who created the poll
    question: string;
    options: Array<string>;
    totalVotes: number;
    votes: Array<IVoter>;
    finished?: boolean;
    confidential?: boolean;
    singleChoice?: boolean;
}
