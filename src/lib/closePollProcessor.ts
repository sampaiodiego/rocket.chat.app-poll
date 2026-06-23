import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';

import { closePoll } from './closePoll';
import { getPoll } from './getPoll';

/**
 * Scheduler processor that finishes a poll when its scheduled close time
 * arrives. Registered in `PollApp.initialize()` and triggered by the one-time
 * job created in `createPollMessage`.
 */
export const closePollProcessor: IProcessor = {
    id: 'close-poll',
    processor: async (jobContext: IJobContext, read: IRead, modify: IModify, _http: IHttp, persis: IPersistence): Promise<void> => {
        const msgId = jobContext.msgId as string;
        if (!msgId) {
            return;
        }

        let poll;
        try {
            poll = await getPoll(msgId, read);
        } catch (err) {
            // Poll no longer exists - nothing to close.
            return;
        }

        if (!poll || poll.finished) {
            return;
        }

        const creator = await read.getUserReader().getById(poll.uid);

        await closePoll({ poll, user: creator, read, persistence: persis, modify });
    },
};
