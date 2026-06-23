import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export type IVoterPerson = Pick<IUser, 'id' | 'username' | 'name'>;

export interface IVoter {
    quantity: number;
    voters: Array<IVoterPerson>;
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
    showResults?: boolean;
    singleChoice?: boolean;
    closesAt?: number; // epoch ms (UTC) when the poll auto-closes - also used for display
    closeJobId?: string; // scheduler jobId, so a manual finish can cancel the pending job
}

export interface IModalContext extends Partial<IUIKitBlockIncomingInteraction> {
    threadId?: string;
}
