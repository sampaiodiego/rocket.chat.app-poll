import { ITextObject } from '@rocket.chat/apps-engine/definition/uikit';

import { IVoter } from '../definition';
import { markdown } from './i18n';

const votersNames = (voters: IVoter['voters'], showNames: boolean) =>
    voters.map(({ name, username }) => showNames ? name : username).join(' ');

export function buildVoters(votes: IVoter, showNames: boolean): ITextObject | undefined {
    if (!votes || votes.quantity === 0) {
        return undefined;
    }

    const names = votersNames(votes.voters, showNames);

    return markdown('poll_voters', { count: votes.quantity, voters: names });
}
