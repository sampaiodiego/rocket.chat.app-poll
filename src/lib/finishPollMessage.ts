import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { createPollBlocks } from './createPollBlocks';
import { getPoll } from './getPoll';
import { storeVote } from './storeVote';

import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { IPoll } from '../IPoll';
import { TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { BlockBuilder } from '@rocket.chat/apps-engine/definition/uikit';
import { BlockElementType } from '@rocket.chat/apps-engine/definition/uikit';

import { buildVoters } from '../buildOptions';
import { buildVoteGraph } from './buildVoteGraph';


async function finishPoll(poll: IPoll, { persis }: { persis: IPersistence }) {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);
    poll.finished = true;
    return persis.updateByAssociation(association, poll);
}


function createPollFinished(block: BlockBuilder, question: string, options: Array<any>, poll: IPoll) {
    block.addSectionBlock({
        text: {
            type: TextObjectType.PLAINTEXT,
            text: question,
        }
    });

    block.addContextBlock({
        elements: [
            {
                type: TextObjectType.MARKDOWN,
                text: `The poll has been finished (${new Date().toString()})`
            }
        ]
    });

    block.addDividerBlock();
    options.forEach((option, index) => {
        block.addSectionBlock({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: option,
            },
        });
        if (!poll.votes[index]) {
            return;
        }
        const voters = buildVoters(poll.votes[index], poll.totalVotes);

        const graph = buildVoteGraph(poll.votes[index], poll.totalVotes);
        block.addContextBlock({
            elements: [
                {
                    type: TextObjectType.MARKDOWN,
                    text: graph,
                },
            ],
        });

        // addVoters(poll.votes[index], poll.totalVotes)
        if (!voters) {
            return;
        }
        block.addContextBlock({
            elements: [
                {
                    type: TextObjectType.MARKDOWN,
                    text: voters,
                },
            ],
        });
    });
}

export async function finishPollMessage({ data, read, persistence, modify }: {
    data,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
}) {
    if (!data.message) {
        return {
            success: true,
        };
    }

    const poll = await getPoll(String(data.message.id), read);


    if (!poll) {
        throw new Error('no such poll');
    }

    if(poll.finished) {
        throw new Error('this poll is already finished');
    }

    if (data.message.sender.id !== data.user.id) {
        throw new Error("You are not allowed to finish the poll"); // send an ephemeral message
    }

    const message = await modify.getUpdater().message(data.message.id as string, data.user);

    await finishPoll(poll, { persis: persistence });

    const block = modify.getCreator().getBlockBuilder();

    try {

        createPollFinished(block, poll.question, poll.options, poll);

        message.setBlocks(block);

        return modify.getUpdater().finish(message);
    } catch (e) {
        console.error('Error', e);
    }
}
