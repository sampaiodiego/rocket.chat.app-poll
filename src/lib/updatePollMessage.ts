import { IModify, IPersistence, IRead, IModifyUpdater } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';

import { createPollBlocks } from './createPollBlocks';
import { getPoll } from './getPoll';
import { storeVote } from './storeVote';
import { uuid } from './uuid';

export async function updatePollMessage({ data, read, persistence, modify, option }: {
    data: IUIKitBlockIncomingInteraction,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
    option: string
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

    if (poll.finished) {
        throw new Error('poll is already finished');
    }

    // await storeVote(poll, parseInt(String(data.value), 10), data.user, { persis: persistence });

    const message = await modify.getUpdater().message(data.message.id as string, data.user);
    message.setEditor(message.getSender());

    const block = modify.getCreator().getBlockBuilder();

    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

    console.log(poll.options.concat(option));
    createPollBlocks(block, poll.question, poll.options.concat(option), poll, showNames.value);

    message.setBlocks(block);

    return modify.getUpdater().finish(message);
}
