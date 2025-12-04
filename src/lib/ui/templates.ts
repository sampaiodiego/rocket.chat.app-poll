/**
 * Template configuration for pre-defined poll types
 */
export interface IPollTemplate {
    name: string;
    description: string;
    options: string[];
}

/**
 * Available poll templates - using string keys for bundler compatibility
 */
export const POLL_TEMPLATES: Record<string, IPollTemplate> = {
    'custom': {
        name: 'Custom',
        description: 'Create your own options',
        options: [],
    },
    'yes_no': {
        name: 'Yes / No',
        description: 'Simple yes or no question',
        options: ['✅ Yes', '❌ No'],
    },
    'rating_5': {
        name: 'Rating (1-5)',
        description: 'Rate on a scale of 1 to 5',
        options: [
            '⭐ 1 - Poor',
            '⭐⭐ 2 - Fair',
            '⭐⭐⭐ 3 - Good',
            '⭐⭐⭐⭐ 4 - Very Good',
            '⭐⭐⭐⭐⭐ 5 - Excellent',
        ],
    },
    'rating_10': {
        name: 'Rating (1-10)',
        description: 'Rate on a scale of 1 to 10',
        options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    },
    'agreement': {
        name: 'Agreement Scale',
        description: 'Likert scale for agreement',
        options: [
            '😤 Strongly Disagree',
            '😕 Disagree',
            '😐 Neutral',
            '🙂 Agree',
            '😄 Strongly Agree',
        ],
    },
};

/**
 * Gets template options for a given template type
 */
export function getTemplateOptions(template: string): string[] {
    return POLL_TEMPLATES[template]?.options || [];
}

/**
 * Gets all available template options for the modal dropdown
 */
export function getTemplateSelectOptions() {
    return Object.entries(POLL_TEMPLATES).map(([value, template]) => ({
        value,
        text: template.name,
        description: template.description,
    }));
}
