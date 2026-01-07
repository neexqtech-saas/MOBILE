import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore, Announcement } from "@/store/hrmsStore";
import Spacer from "@/components/Spacer";

export default function AnnouncementScreen() {
  const { theme } = useTheme();
  const { announcements, markAnnouncementRead } = useHRMSStore();

  const getTypeIcon = (type: Announcement["type"]): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "announcement":
        return "bell";
      case "notice":
        return "alert-circle";
      case "policy":
        return "file-text";
      default:
        return "info";
    }
  };

  const getTypeColor = (type: Announcement["type"]) => {
    switch (type) {
      case "announcement":
        return Colors.dark.primary;
      case "notice":
        return Colors.dark.warning;
      case "policy":
        return Colors.dark.success;
      default:
        return theme.textMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  const handlePress = (id: string) => {
    markAnnouncementRead(id);
  };

  return (
    <ScreenScrollView>
      {unreadCount > 0 ? (
        <View style={[styles.unreadBanner, { backgroundColor: Colors.dark.primary + "20" }]}>
          <Feather name="bell" size={18} color={Colors.dark.primary} />
          <ThemedText style={{ color: Colors.dark.primary }}>
            You have {unreadCount} unread {unreadCount === 1 ? "announcement" : "announcements"}
          </ThemedText>
        </View>
      ) : null}

      <Spacer height={Spacing.lg} />

      {announcements.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="inbox" size={48} color={theme.textMuted} />
          <ThemedText style={{ color: theme.textMuted, marginTop: Spacing.md }}>
            No announcements yet
          </ThemedText>
        </View>
      ) : (
        announcements.map((announcement) => {
          const typeColor = getTypeColor(announcement.type);
          const typeIcon = getTypeIcon(announcement.type);

          return (
            <Pressable
              key={announcement.id}
              onPress={() => handlePress(announcement.id)}
              style={({ pressed }) => [
                styles.announcementCard,
                {
                  backgroundColor: theme.backgroundDefault,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              {!announcement.isRead ? (
                <View style={styles.unreadDot} />
              ) : null}

              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.typeIcon,
                    { backgroundColor: typeColor + "20" },
                  ]}
                >
                  <Feather name={typeIcon} size={18} color={typeColor} />
                </View>
                <View style={styles.cardMeta}>
                  <View style={styles.typeRow}>
                    <ThemedText
                      type="small"
                      style={{ color: typeColor, fontWeight: "600" }}
                    >
                      {announcement.type.charAt(0).toUpperCase() +
                        announcement.type.slice(1)}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textMuted }}>
                      {formatDate(announcement.date)}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="body"
                    style={{ fontWeight: "600", marginTop: Spacing.xs }}
                  >
                    {announcement.title}
                  </ThemedText>
                </View>
              </View>

              <ThemedText
                style={[styles.content, { color: theme.textMuted }]}
                numberOfLines={3}
              >
                {announcement.content}
              </ThemedText>

              <View style={styles.cardFooter}>
                <Pressable style={styles.readMoreButton}>
                  <ThemedText
                    type="small"
                    style={{ color: Colors.dark.primary }}
                  >
                    Read More
                  </ThemedText>
                  <Feather
                    name="arrow-right"
                    size={14}
                    color={Colors.dark.primary}
                  />
                </Pressable>
              </View>
            </Pressable>
          );
        })
      )}

      <Spacer height={Spacing["3xl"]} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  announcementCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.dark.primary,
  },
  cardHeader: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: {
    flex: 1,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  cardFooter: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyState: {
    padding: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
