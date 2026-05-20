import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, FlatList, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHRMSStore } from "@/store/hrmsStore";
import type { NotificationHistoryItem } from "@/services/api";
import type { HomeStackParamList } from "@/navigation/HomeStackNavigator";

type NotificationNav = NativeStackNavigationProp<HomeStackParamList, "Notifications">;

export default function NotificationScreen() {
    const navigation = useNavigation<NotificationNav>();
    const {
        notificationHistory,
        fetchNotificationHistory,
        markNotificationAsRead,
    } = useHRMSStore();

    const [isRefreshing, setIsRefreshing] = React.useState(false);

    useEffect(() => {
        fetchNotificationHistory();
    }, []);

    const onRefresh = async () => {
        setIsRefreshing(true);
        await fetchNotificationHistory();
        setIsRefreshing(false);
    };

    const getIcon = (type: string | null): keyof typeof Feather.glyphMap => {
        switch (type) {
            case "task_assigned":
            case "task_updated":
                return "check-square";
            case "leave_approved":
            case "leave_rejected":
                return "calendar";
            case "attendance_alert":
                return "clock";
            case "material_issued":
                return "package";
            default:
                return "bell";
        }
    };

    const getColor = (type: string | null) => {
        switch (type) {
            case "task_assigned":
                return "#2563EB"; // Blue
            case "task_updated":
                return "#8B5CF6"; // Purple
            case "leave_approved":
                return "#10B981"; // Green
            case "leave_rejected":
                return "#EF4444"; // Red
            case "attendance_alert":
                return "#F59E0B"; // Amber
            case "material_issued":
                return "#D4693E"; // Inventory orange
            default:
                return Colors.dark.primary;
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const today = new Date();
            const diffTime = Math.abs(today.getTime() - date.getTime());
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffMinutes < 60) return `${diffMinutes}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays === 1) return "Yesterday";
            if (diffDays < 7) return `${diffDays}d ago`;

            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        } catch (e) {
            return dateStr;
        }
    };

    const handleNotificationPress = (notification: NotificationHistoryItem) => {
        if (!notification.is_read) {
            markNotificationAsRead(notification.id);
        }
        // Handle navigation based on notification type/data if needed
        if (
            notification.notification_type === "material_issued" ||
            notification.data?.type === "material_issued"
        ) {
            navigation.navigate("MyMaterials");
            return;
        }
        if (notification.data?.task_id) {
            console.log('🔗 Should navigate to task:', notification.data.task_id);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: "#F8FAFC" }]}>
            <FlatList
                data={notificationHistory}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[Colors.dark.primary]} />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Feather name="bell-off" size={48} color="#94A3B8" />
                        </View>
                        <ThemedText type="h4" style={styles.emptyTitle}>All caught up!</ThemedText>
                        <ThemedText style={styles.emptySubtitle}>
                            You don't have any notifications right now.
                        </ThemedText>
                    </View>
                }
                renderItem={({ item }) => {
                    const color = getColor(item.notification_type);
                    const icon = getIcon(item.notification_type);

                    return (
                        <Pressable
                            onPress={() => handleNotificationPress(item)}
                            style={({ pressed }) => [
                                styles.notificationCard,
                                {
                                    backgroundColor: "#FFFFFF",
                                    opacity: pressed ? 0.9 : 1,
                                    borderLeftColor: item.is_read ? "transparent" : Colors.dark.primary,
                                    borderLeftWidth: item.is_read ? 0 : 4,
                                },
                            ]}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
                                <Feather name={icon} size={20} color={color} />
                            </View>

                            <View style={styles.contentContainer}>
                                <View style={styles.titleRow}>
                                    <ThemedText style={[styles.title, !item.is_read && styles.unreadTitle]}>
                                        {item.title}
                                    </ThemedText>
                                    <ThemedText type="small" style={styles.time}>
                                        {formatDate(item.created_at)}
                                    </ThemedText>
                                </View>

                                <ThemedText style={styles.body} numberOfLines={2}>
                                    {item.body}
                                </ThemedText>

                                {!item.is_read && <View style={styles.unreadIndicator} />}
                            </View>
                        </Pressable>
                    );
                }}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing["3xl"],
        flexGrow: 1,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        position: 'relative',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    contentContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        color: '#0F172A',
        fontWeight: '700',
    },
    time: {
        color: '#94A3B8',
        fontSize: 12,
    },
    body: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    unreadIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.dark.primary,
    },
    separator: {
        height: Spacing.md,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    emptyTitle: {
        color: '#475569',
        marginBottom: Spacing.xs,
    },
    emptySubtitle: {
        color: '#94A3B8',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
