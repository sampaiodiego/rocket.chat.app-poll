import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import {
    IUIKitViewSubmitIncomingInteraction,
} from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';

import { createPollBlocks } from './createPollBlocks';
import { getPoll } from './getPoll';

export async function updatePollMessage(data: IUIKitViewSubmitIncomingInteraction, read: IRead, modify: IModify, persistence: IPersistence, uid: string) {
    const { view: { id } } = data;
    const { state }: {
        state?: any;
    } = data.view;

    const msgId = data.view.blocks[1].blockId;

    const poll = await getPoll(String(msgId), read);
    if (!poll) {
        throw new Error('no such poll');
    }

    if (poll.finished) {
        throw new Error('poll is already finished');
    }


    const message = await modify.getUpdater().message(msgId as string, data.user);
    message.setEditor(message.getSender());
    
    const block = modify.getCreator().getBlockBuilder();

    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

    poll.votes.push({ quantity: 0, voters: [] });
    poll.options.push(state.userChoice.addUserOption)

    createPollBlocks(block, poll.question, poll.options, poll, showNames.value);

    message.setBlocks(block);

    const pollAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);

    await persistence.updateByAssociation(pollAssociation, poll);

    return modify.getUpdater().finish(message);
}
