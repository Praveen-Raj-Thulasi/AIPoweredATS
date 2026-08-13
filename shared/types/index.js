"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PIPELINE_STAGES = exports.ASSESSMENT_LEVEL_LABELS = void 0;
exports.ASSESSMENT_LEVEL_LABELS = {
    1: 'Knowledge',
    2: 'Application',
    3: 'Debugging',
    4: 'Scenario',
    5: 'Transfer',
    6: 'Explanation',
};
exports.DEFAULT_PIPELINE_STAGES = [
    { id: 'applied', label: 'Applied', order: 1, color: '#64748b' },
    { id: 'screening', label: 'Screening', order: 2, color: '#818cf8' },
    { id: 'assessment', label: 'Assessment', order: 3, color: '#06b6d4' },
    { id: 'interview', label: 'Interview', order: 4, color: '#a855f7' },
    { id: 'evaluation', label: 'Evaluation', order: 5, color: '#ec4899' },
    { id: 'offer', label: 'Offer', order: 6, color: '#3b82f6' },
    { id: 'hired', label: 'Hired 🎉', order: 7, color: '#10b981', isTerminal: true },
    { id: 'rejected', label: 'Rejected', order: 8, color: '#f43f5e', isTerminal: true },
];
