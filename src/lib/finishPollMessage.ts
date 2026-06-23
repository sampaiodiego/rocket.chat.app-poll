import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { closePoll } from './closePoll';
import { getPoll } from './getPoll';

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

    if (poll.finished) {
        throw new Error('this poll is already finished');
    }

    if (poll.uid !== data.user.id) {
        throw new Error('You are not allowed to finish the poll'); // send an ephemeral message
    }

    try {
        return await closePoll({ poll, user: data.user, read, persistence, modify });
    } catch (e) {
        console.error('Error', e);
    }
}
