import { IPoll, IVoter } from '../definition';

const filled = '█';
const empty = ' ';
const width = 20;

const format = (num) => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
}).format(num);

export function buildVoteGraph(votes: IVoter, totalVotes: IPoll['totalVotes']) {
    const percent = totalVotes === 0 ? 0 : votes.quantity / totalVotes;

    const graphFilled = filled.repeat(Math.floor(percent * width));
    const graphEmpty = empty.repeat(width - Math.floor(percent * width));

    return `\`${ graphFilled + graphEmpty }\` ${ format(percent * 100) }% (${ votes.quantity })`;
}
