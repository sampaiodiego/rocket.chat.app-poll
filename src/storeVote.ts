import { IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { IPoll } from './IPoll';

export async function storeVote(poll: IPoll, voteIndex: number, voter: IUser, { persis }: { persis: IPersistence }) {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);

    const { username } = voter;

    const hasVoted = poll.votes[voteIndex].voters.indexOf(username);

    if (hasVoted !== -1) {
        poll.totalVotes--;
        poll.votes[voteIndex].quantity--;
        poll.votes[voteIndex].voters.splice(hasVoted, 1);
    } else {
        poll.totalVotes++;
        poll.votes[voteIndex].quantity++;
        poll.votes[voteIndex].voters.push(username);
    }
    return persis.updateByAssociation(association, poll);
}
