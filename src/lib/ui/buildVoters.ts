import { IVoter, IVoterPerson } from '../../definition';

/**
 * Maximum number of voters to show inline before collapsing
 */
const MAX_INLINE_VOTERS = 3;

/**
 * Gets voter display names
 */
function getVoterName(voter: IVoterPerson, showNames: boolean): string {
    return showNames && voter.name ? voter.name : `@${voter.username}`;
}

/**
 * Builds the voters display string with collapsible list
 * 
 * Example outputs:
 * - "3 votes - @john, @jane, @bob"
 * - "5 votes - @john, @jane, @bob + 2 more"
 */
export function buildVoters(votes: IVoter, showNames: boolean): string {
    if (!votes || votes.quantity === 0) {
        return '';
    }

    const votersCount = votes.voters.length;
    const votesLabel = votes.quantity === 1 ? 'vote' : 'votes';

    // If no voters to display (anonymous mode shows count only)
    if (votersCount === 0) {
        return `${votes.quantity} ${votesLabel}`;
    }

    // Get voter names for display
    const displayVoters = votes.voters.slice(0, MAX_INLINE_VOTERS);
    const voterNames = displayVoters.map(v => getVoterName(v, showNames)).join(', ');

    // Check if we need to show "+X more"
    const remaining = votersCount - MAX_INLINE_VOTERS;

    if (remaining > 0) {
        return `${votes.quantity} ${votesLabel} - ${voterNames} + ${remaining} more`;
    }

    return `${votes.quantity} ${votesLabel} - ${voterNames}`;
}

/**
 * Builds a compact voter list for export
 */
export function buildVotersForExport(votes: IVoter): string[] {
    return votes.voters.map(v => v.username || v.id);
}
