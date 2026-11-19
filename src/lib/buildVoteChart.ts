import { IDataVisualizationBlock, IPoll } from '../definition';

const maxTitle = 50;
const maxLabel = 20;
const maxCategories = 20;
const maxSegments = 12;

const truncate = (text: string, max: number) => text.length > max ? `${ text.slice(0, max - 1) }…` : text;

// Category labels must be unique, so number them all if truncating made any two equal.
function buildLabels(options: Array<string>) {
    const labels = options.map((option) => truncate(option.trim(), maxLabel));
    if (new Set(labels).size === labels.length) {
        return labels;
    }
    return options.map((option, index) => truncate(`${ index + 1 }. ${ option.trim() }`, maxLabel));
}

export function buildVoteChart(poll: IPoll): IDataVisualizationBlock | undefined {
    if (poll.totalVotes === 0) {
        return undefined;
    }

    const labels = buildLabels(poll.options);
    const title = truncate(poll.question.trim(), maxTitle);

    if (poll.chartType === 'pie') {
        const segments = labels
            .map((label, index) => ({ label, value: poll.votes[index].quantity }))
            .filter(({ value }) => value > 0);

        if (segments.length > maxSegments) {
            return undefined;
        }

        return { type: 'data_visualization', title, chart: { type: 'pie', segments } };
    }

    if (labels.length > maxCategories) {
        return undefined;
    }

    return {
        type: 'data_visualization',
        title,
        chart: {
            type: 'bar',
            series: [{
                name: 'Votes',
                data: labels.map((label, index) => ({ label, value: poll.votes[index].quantity })),
            }],
            axis_config: { categories: labels },
        },
    };
}
