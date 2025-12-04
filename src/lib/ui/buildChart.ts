import { IVoter, IPoll } from '../../definition';

/**
 * Chart configuration
 */
const CHART_CONFIG = {
    barWidth: 20,
    filled: '█',
    empty: '░',
};

/**
 * Formats a number to a percentage string
 */
function formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
}

/**
 * Builds a clean visual bar chart for vote display
 * 
 * Example: ████████████░░░░░░░░ 60.0% (3)
 */
export function buildVoteGraph(votes: IVoter, totalVotes: number): string {
    const { barWidth, filled, empty } = CHART_CONFIG;

    const percentage = totalVotes === 0 ? 0 : (votes.quantity / totalVotes) * 100;
    const filledWidth = Math.round((percentage / 100) * barWidth);
    const emptyWidth = barWidth - filledWidth;

    const bar = filled.repeat(filledWidth) + empty.repeat(emptyWidth);
    const votesLabel = votes.quantity === 1 ? 'vote' : 'votes';

    return `\`${bar}\` ${formatPercentage(percentage)} (${votes.quantity} ${votesLabel})`;
}

/**
 * Builds total votes display
 */
export function buildTotalVotesDisplay(totalVotes: number): string {
    if (totalVotes === 0) return 'No votes yet';
    if (totalVotes === 1) return '1 vote';
    return `${totalVotes} votes`;
}
