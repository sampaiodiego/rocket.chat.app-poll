import { IUIKitBlockIncomingInteraction } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionTypes';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export type IVoterPerson = Pick<IUser, 'id' | 'username' | 'name'>;

export interface IVoter {
    quantity: number;
    voters: Array<IVoterPerson>;
}

export interface IPoll {
    msgId: string;
    uid: string; // user who created the poll
    question: string;
    options: Array<string>;
    totalVotes: number;
    votes: Array<IVoter>;
    finished?: boolean;
    confidential?: boolean;
    showResults?: boolean;
    singleChoice?: boolean;
    closesAt?: number; // epoch ms (UTC) when the poll auto-closes - also used for display
    closeJobId?: string; // scheduler jobId, so a manual finish can cancel the pending job
    chartType?: ChartType; // missing on polls created before charts, rendered as 'bar'
}

export type ChartType = 'bar' | 'pie';

interface IChartPoint {
    label: string;
    value: number;
}

// Mirrors ui-kit's DataVisualizationBlock; drop it once apps-engine ships those types.
export interface IDataVisualizationBlock {
    type: 'data_visualization';
    title: string;
    chart: {
        type: 'pie';
        segments: Array<IChartPoint>;
    } | {
        type: 'bar';
        series: Array<{ name: string; data: Array<IChartPoint> }>;
        axis_config: { categories: Array<string> };
    };
}

export interface IModalContext extends Partial<IUIKitBlockIncomingInteraction> {
    threadId?: string;
}
