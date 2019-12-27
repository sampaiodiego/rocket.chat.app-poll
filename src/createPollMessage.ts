import { BlockBuilder, BlockElementType, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';

import { buildVoters } from './buildOptions';
import { IPoll } from './IPoll';

export function createPollMessage(block: BlockBuilder, question: string, options: Array<any>, poll: IPoll) {
    block.addSectionBlock({
        text: {
            type: TextObjectType.PLAINTEXT,
            text: question,
        },
    });
    block.addDividerBlock();
    options.forEach((option, index) => {
        block.addSectionBlock({
            text: {
                type: TextObjectType.PLAINTEXT,
                text: option,
            },
            accessory: {
                type: BlockElementType.BUTTON,
                actionId: 'vote',
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: 'Vote',
                },
                value: String(index),
            },
        });
        if (!poll.votes[index]) {
            return;
        }
        const voters = buildVoters(poll.votes[index], poll.totalVotes);
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
    // block.addSectionBlock({
    //     text: {
    //         type: TextObjectType.PLAINTEXT,
    //         text: 'Yes',
    //     },
    //     accessory: {
    //         type: BlockElementType.BUTTON,
    //         actionId: 'voteOption1',
    //         text: {
    //             type: TextObjectType.PLAINTEXT,
    //             text: 'Vote',
    //         },
    //         value: 'option1',
    //     },
    // });
    // block.addContextBlock({
    //     elements: [
    //         {
    //             type: TextObjectType.MARKDOWN,
    //             text: '2 votes - @diego.sampaio, @guilherme.gazzo',
    //         },
    //     ],
    // });
}
