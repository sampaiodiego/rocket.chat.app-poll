import { IPoll, IVoter } from './IPoll';

export const emojis = [
    ':zero:',
    ':one:',
    ':two:',
    ':three:',
    ':four:',
    ':five:',
    ':six:',
    ':seven:',
    ':eight:',
    ':nine:',
    ':keycap_ten:',
];

function addVoters(votes: IVoter, totalVotes: IPoll['totalVotes']) {
    if (!votes) {
        return '';
    }
    // const percentage = votes.quantity > 0 ? votes.quantity / totalVotes * 100 : 0;
    // let voters = ` \`${ votes.quantity } (${ percentage.toFixed(2) }%)\``;
    let voters = ` \`${ votes.quantity }\``;

    if (votes.voters.length > 0) {
        voters += `\n_${ votes.voters.join('_, _') }_`;
    }

    return voters;
}

export function buildVoters(votes: IVoter, totalVotes: IPoll['totalVotes']) {
    if (!votes) {
        return '';
    }

    if (votes.quantity === 0) {
        return '';
    }

    // const percentage = votes.quantity > 0 ? votes.quantity / totalVotes * 100 : 0;
    // let voters = ` \`${ votes.quantity } (${ percentage.toFixed(2) }%)\``;
    const votesStr = votes.quantity === 1 ? 'vote' : 'votes';

    return `${ votes.quantity } ${ votesStr } - ${ votes.voters.length > 0 ? '@' : '' }${ votes.voters.join('@') }`;
}

export function buildOptions(options: Array<any>, poll: IPoll) {
    return {
        color: '#73a7ce',
        text: options.map((option, index) => `${emojis[index + 1]} ${option}${addVoters(poll.votes[index], poll.totalVotes)}`).join('\n'),
    };
}
