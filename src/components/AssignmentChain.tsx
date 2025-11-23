import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Body, Caption, Avatar } from './index';
import { THEME } from '../theme/Theme';
import { taskService } from '../services/api/taskService';
import { User } from '../types/api';

interface Assignment {
    id: string;
    assignedBy: User;
    assignedTo: User;
    assignedAt: string;
}

interface AssignmentChainProps {
    projectId: string;
    taskId: string;
    compact?: boolean;
}

export const AssignmentChain: React.FC<AssignmentChainProps> = ({
    projectId,
    taskId,
    compact = false,
}) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await taskService.getAssignments(projectId, taskId);
            setAssignments(data || []);
        } catch (err: any) {
            console.error('Failed to fetch assignments:', err);
            setError(err.message || 'Failed to load assignment chain');
        } finally {
            setLoading(false);
        }
    }, [projectId, taskId]);

    useEffect(() => {
        fetchAssignments();
    }, [projectId, taskId, fetchAssignments]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
            </View>
        );
    }

    if (error || !assignments || assignments.length === 0) {
        return null; // Don't show anything if no chain exists
    }

    return (
        <View style={styles.container}>
            <Caption style={styles.header}>Assignment Chain</Caption>

            <View style={styles.chainContainer}>
                {assignments.map((assignment, index) => (
                    <React.Fragment key={assignment.id}>
                        {/* Assignment Item */}
                        <View style={styles.assignmentItem}>
                            <Avatar
                                name={assignment.assignedTo.name || ''}
                                source={
                                    assignment.assignedTo.avatarUrl
                                        ? { uri: assignment.assignedTo.avatarUrl }
                                        : undefined
                                }
                                size="sm"
                            />
                            <View style={styles.assignmentInfo}>
                                <Body style={styles.assigneeName}>
                                    {assignment.assignedTo.name}
                                </Body>
                                {!compact && (
                                    <>
                                        <Caption style={styles.assignedBy}>
                                            by {assignment.assignedBy.name}
                                        </Caption>
                                        <Caption style={styles.timestamp}>
                                            {formatDate(assignment.assignedAt)}
                                        </Caption>
                                    </>
                                )}
                                {index === assignments.length - 1 && (
                                    <Caption style={styles.activeBadge}>● Active</Caption>
                                )}
                            </View>
                        </View>

                        {/* Arrow between assignments */}
                        {index < assignments.length - 1 && (
                            <View style={styles.arrowContainer}>
                                <Body style={styles.arrow}>→</Body>
                            </View>
                        )}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: THEME.spacing.m,
    },
    header: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.s,
    },
    loadingContainer: {
        padding: THEME.spacing.m,
        alignItems: 'center',
    },
    chainContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: THEME.spacing.m,
        backgroundColor: THEME.colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: THEME.colors.border,
    },
    assignmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.s,
    },
    assignmentInfo: {
        gap: 2,
    },
    assigneeName: {
        fontWeight: '600',
        color: THEME.colors.text,
    },
    assignedBy: {
        color: THEME.colors.textSecondary,
        fontSize: 11,
    },
    timestamp: {
        color: THEME.colors.textTertiary,
        fontSize: 10,
    },
    activeBadge: {
        color: THEME.colors.success,
        fontSize: 11,
        fontWeight: '600',
    },
    arrowContainer: {
        paddingHorizontal: THEME.spacing.s,
    },
    arrow: {
        fontSize: 20,
        color: THEME.colors.textSecondary,
    },
});
