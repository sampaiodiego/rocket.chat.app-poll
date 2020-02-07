import { IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { IPoll } from '../IPoll';

export async function storeVote(poll: IPoll, voteIndex: number, voter: IUser, { persis }: { persis: IPersistence }) {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);

    const { username } = voter;

    const previousVote = poll.votes.findIndex(({ voters }) => voters.indexOf(username) !== -1);

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

    if (poll.singleChoice && hasVoted === -1 && previousVote !== -1) {
        poll.totalVotes--;
        poll.votes[previousVote].quantity--;
        poll.votes[previousVote].voters = poll.votes[previousVote].voters.filter((voter) => voter !== username);
    }

    return persis.updateByAssociation(association, poll);
}
