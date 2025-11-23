import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Heading, Body, Caption, Icon, Button } from '../components';
import { THEME } from '../theme/Theme';
import { TaskStatus, TaskCategory } from '../types/api';
import { TaskFilterParams } from '../services/api/taskService';

interface TaskFilterPanelProps {
    onApplyFilters: (filters: TaskFilterParams) => void;
    onClear: () => void;
    onClose: () => void;
    initialFilters?: TaskFilterParams;
}

const ALL_STATUSES: TaskStatus[] = ['OPEN', 'WIP', 'IN_PROGRESS', 'INSPECTION', 'BLOCKED', 'DONE', 'CLOSED'];
const ALL_CATEGORIES: TaskCategory[] = ['SNAG', 'QUALITY_ISSUE', 'EHS_ISSUE', 'OTHER'];

export const TaskFilterPanel: React.FC<TaskFilterPanelProps> = ({
    onApplyFilters,
    onClear,
    onClose,
    initialFilters = {}
}) => {
    const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>(
        initialFilters.statuses || []
    );
    const [selectedCategories, setSelectedCategories] = useState<TaskCategory[]>(
        initialFilters.categories || []
    );
    const [minPriority, setMinPriority] = useState<number | undefined>(
        initialFilters.minPriority
    );
    const [overdueOnly, setOverdueOnly] = useState<boolean>(
        initialFilters.overdueOnly || false
    );

    const toggleStatus = (status: TaskStatus) => {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const toggleCategory = (category: TaskCategory) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleApply = () => {
        const filters: TaskFilterParams = {};

        if (selectedStatuses.length > 0) {
            filters.statuses = selectedStatuses;
        }

        if (selectedCategories.length > 0) {
            filters.categories = selectedCategories;
        }

        if (minPriority !== undefined && minPriority > 0) {
            filters.minPriority = minPriority;
        }

        if (overdueOnly) {
            filters.overdueOnly = true;
        }

        onApplyFilters(filters);
        onClose();
    };

    const handleClearAll = () => {
        setSelectedStatuses([]);
        setSelectedCategories([]);
        setMinPriority(undefined);
        setOverdueOnly(false);
        onClear();
        onClose();
    };

    const getStatusLabel = (status: TaskStatus) => {
        return status.replace('_', ' ');
    };

    const getCategoryLabel = (category: TaskCategory) => {
        return category.replace('_', ' ');
    };

    const hasActiveFilters = selectedStatuses.length > 0 ||
        selectedCategories.length > 0 ||
        (minPriority !== undefined && minPriority > 0) ||
        overdueOnly;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Heading level={2}>Filter Tasks</Heading>
                <TouchableOpacity onPress={onClose}>
                    <Icon name="close" size="lg" color={THEME.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Filter */}
                <View style={styles.section}>
                    <Heading level={3} style={styles.sectionTitle}>Status</Heading>
                    <View style={styles.chipContainer}>
                        {ALL_STATUSES.map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.chip,
                                    selectedStatuses.includes(status) && styles.chipActive
                                ]}
                                onPress={() => toggleStatus(status)}
                            >
                                <Body
                                    size="sm"
                                    style={[
                                        styles.chipText,
                                        selectedStatuses.includes(status) && styles.chipTextActive
                                    ]}
                                >
                                    {getStatusLabel(status)}
                                </Body>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Category Filter */}
                <View style={styles.section}>
                    <Heading level={3} style={styles.sectionTitle}>Category</Heading>
                    <View style={styles.chipContainer}>
                        {ALL_CATEGORIES.map(category => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.chip,
                                    selectedCategories.includes(category) && styles.chipActive
                                ]}
                                onPress={() => toggleCategory(category)}
                            >
                                <Body
                                    size="sm"
                                    style={[
                                        styles.chipText,
                                        selectedCategories.includes(category) && styles.chipTextActive
                                    ]}
                                >
                                    {getCategoryLabel(category)}
                                </Body>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Priority Filter */}
                <View style={styles.section}>
                    <Heading level={3} style={styles.sectionTitle}>
                        Minimum Priority: {minPriority || 0}
                    </Heading>
                    <View style={styles.priorityButtons}>
                        {[0, 3, 5, 7, 9].map(priority => (
                            <TouchableOpacity
                                key={priority}
                                style={[
                                    styles.priorityButton,
                                    minPriority === priority && styles.priorityButtonActive
                                ]}
                                onPress={() => setMinPriority(priority === 0 ? undefined : priority)}
                            >
                                <Body
                                    size="sm"
                                    style={[
                                        styles.priorityButtonText,
                                        minPriority === priority && styles.priorityButtonTextActive
                                    ]}
                                >
                                    {priority === 0 ? 'Any' : priority}
                                </Body>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.priorityLegend}>
                        <Caption style={styles.legendText}>Low (1-4)</Caption>
                        <Caption style={styles.legendText}>Med (5-7)</Caption>
                        <Caption style={styles.legendText}>High (8-10)</Caption>
                    </View>
                </View>

                {/* Overdue Only */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.toggleRow}
                        onPress={() => setOverdueOnly(!overdueOnly)}
                    >
                        <View style={styles.toggleLeft}>
                            <Icon
                                name="clock-alert-outline"
                                size="base"
                                color={overdueOnly ? THEME.colors.error : THEME.colors.textSecondary}
                            />
                            <Body>Show Overdue Only</Body>
                        </View>
                        <View style={[
                            styles.toggle,
                            overdueOnly && styles.toggleActive
                        ]}>
                            <View style={[
                                styles.toggleKnob,
                                overdueOnly && styles.toggleKnobActive
                            ]} />
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
                {hasActiveFilters && (
                    <Button
                        title="Clear All"
                        onPress={handleClearAll}
                        variant="text"
                        style={styles.clearButton}
                    />
                )}
                <Button
                    title={`Apply Filters${hasActiveFilters ? ` (${getActiveFilterCount()})` : ''}`}
                    onPress={handleApply}
                    variant="primary"
                    style={styles.applyButton}
                />
            </View>
        </View>
    );

    function getActiveFilterCount(): number {
        let count = 0;
        if (selectedStatuses.length > 0) count++;
        if (selectedCategories.length > 0) count++;
        if (minPriority !== undefined && minPriority > 0) count++;
        if (overdueOnly) count++;
        return count;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: THEME.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
    },
    content: {
        flex: 1,
        padding: THEME.spacing.l,
    },
    section: {
        marginBottom: THEME.spacing.xl,
    },
    sectionTitle: {
        marginBottom: THEME.spacing.m,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: THEME.spacing.s,
    },
    chip: {
        paddingHorizontal: THEME.spacing.m,
        paddingVertical: THEME.spacing.s,
        borderRadius: THEME.radius.full,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        backgroundColor: THEME.colors.surface,
    },
    chipActive: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    chipText: {
        color: THEME.colors.text,
    },
    chipTextActive: {
        color: THEME.colors.white,
        fontWeight: '600',
    },
    priorityButtons: {
        flexDirection: 'row',
        gap: THEME.spacing.s,
        marginBottom: THEME.spacing.s,
    },
    priorityButton: {
        flex: 1,
        paddingVertical: THEME.spacing.m,
        borderRadius: THEME.radius.base,
        borderWidth: 1,
        borderColor: THEME.colors.border,
        backgroundColor: THEME.colors.surface,
        alignItems: 'center',
    },
    priorityButtonActive: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    priorityButtonText: {
        color: THEME.colors.text,
    },
    priorityButtonTextActive: {
        color: THEME.colors.white,
        fontWeight: '600',
    },
    priorityLegend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: THEME.spacing.s,
    },
    legendText: {
        color: THEME.colors.textSecondary,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: THEME.spacing.m,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.base,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.m,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: THEME.colors.border,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: THEME.colors.primary,
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: THEME.colors.white,
    },
    toggleKnobActive: {
        transform: [{ translateX: 22 }],
    },
    footer: {
        flexDirection: 'row',
        padding: THEME.spacing.l,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
        gap: THEME.spacing.m,
    },
    clearButton: {
        flex: 1,
    },
    applyButton: {
        flex: 2,
    },
});
