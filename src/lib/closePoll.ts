import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

import { IPoll } from '../definition';
import { createPollBlocks } from './createPollBlocks';

/**
 * Marks a poll as finished and updates its message. Shared by the manual
 * "Finish poll" action and the scheduler processor, so it performs no
 * authorization checks — callers are responsible for that.
 *
 * When a pending auto-close job exists (`poll.closeJobId`), it is cancelled so
 * the scheduled close does not fire after a manual finish.
 */
export async function closePoll({ poll, user, read, persistence, modify }: {
    poll: IPoll,
    user: IUser,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
}) {
    const association = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, poll.msgId);
    poll.finished = true;
    await persistence.updateByAssociation(association, poll);

    if (poll.closeJobId) {
        try {
            await modify.getScheduler().cancelJob(poll.closeJobId);
        } catch (err) {
            console.error('Error cancelling scheduled poll close', err);
        }
    }

    const message = await modify.getUpdater().message(poll.msgId, user);
    message.setEditor(message.getSender());

    const block = modify.getCreator().getBlockBuilder();

    const showNames = await read.getEnvironmentReader().getSettings().getById('use-user-name');

    createPollBlocks(block, poll.question, poll.options, poll, showNames.value);

    message.setBlocks(block);

    return modify.getUpdater().finish(message);
}
