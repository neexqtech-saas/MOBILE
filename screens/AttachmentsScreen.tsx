import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Text,
  Alert,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useHRMSStore } from "@/store/hrmsStore";
import {
  apiService,
  type AttachmentBreadcrumb,
  type AttachmentFileItem,
  type AttachmentFolderItem,
} from "@/services/api";
import { useTheme } from "@/hooks/useTheme";
import { prepareAssetsForUpload } from "@/utils/uploadFile";

type ListRow =
  | { key: string; type: "folder"; data: AttachmentFolderItem }
  | { key: string; type: "file"; data: AttachmentFileItem };

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKindIcon(kind: string): keyof typeof Feather.glyphMap {
  if (kind === "image") return "image";
  if (kind === "video") return "video";
  if (kind === "document") return "file-text";
  return "file";
}

export default function AttachmentsScreen() {
  const { theme } = useTheme();
  const { employee } = useHRMSStore();
  const adminId = employee?.adminId;

  const [folderId, setFolderId] = useState<number | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<AttachmentBreadcrumb[]>([]);
  const [folders, setFolders] = useState<AttachmentFolderItem[]>([]);
  const [files, setFiles] = useState<AttachmentFileItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const searchRef = useRef(search);
  searchRef.current = search;

  const loadBrowse = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!adminId) return;
      if (!opts?.silent) setLoading(true);
      try {
        const res = await apiService.browseAttachments(adminId, {
          folder_id: folderId,
          search: searchRef.current.trim() || undefined,
        });
        const data = res.data;
        setBreadcrumbs(data.breadcrumbs ?? []);
        setFolders(data.folders ?? []);
        setFiles(data.files ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not load files";
        Alert.alert("Error", msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [adminId, folderId]
  );

  useEffect(() => {
    void loadBrowse();
  }, [loadBrowse]);

  useFocusEffect(
    useCallback(() => {
      void loadBrowse({ silent: true });
    }, [loadBrowse])
  );

  const rows: ListRow[] = useMemo(() => {
    const folderRows: ListRow[] = folders.map((f) => ({
      key: `folder-${f.id}`,
      type: "folder",
      data: f,
    }));
    const fileRows: ListRow[] = files.map((f) => ({
      key: `file-${f.id}`,
      type: "file",
      data: f,
    }));
    return [...folderRows, ...fileRows];
  }, [folders, files]);

  const navigateToFolder = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFolderId(id);
  };

  const navigateToBreadcrumb = (id: number | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFolderId(id);
  };

  const openFile = async (file: AttachmentFileItem) => {
    if (!file.file_url) {
      Alert.alert("Unavailable", "File URL is not available.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(file.file_url);
      if (!supported) {
        Alert.alert("Cannot open", "This file type cannot be opened on your device.");
        return;
      }
      await Linking.openURL(file.file_url);
    } catch {
      Alert.alert("Error", "Failed to open file.");
    }
  };

  const confirmDeleteFolder = (folder: AttachmentFolderItem) => {
    Alert.alert(
      "Delete folder?",
      `"${folder.name}" and all contents will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!adminId) return;
            try {
              await apiService.deleteAttachmentFolder(adminId, folder.id);
              await loadBrowse({ silent: true });
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Delete failed");
            }
          },
        },
      ]
    );
  };

  const confirmDeleteFile = (file: AttachmentFileItem) => {
    Alert.alert(
      "Delete file?",
      `"${file.original_name}" will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!adminId) return;
            try {
              await apiService.deleteAttachmentFile(adminId, file.id);
              await loadBrowse({ silent: true });
            } catch (err) {
              Alert.alert("Error", err instanceof Error ? err.message : "Delete failed");
            }
          },
        },
      ]
    );
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      Alert.alert("Required", "Enter a folder name.");
      return;
    }
    if (!adminId) return;
    setCreatingFolder(true);
    try {
      await apiService.createAttachmentFolder(adminId, name, folderId);
      setFolderModalVisible(false);
      setNewFolderName("");
      await loadBrowse({ silent: true });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Could not create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleUpload = async () => {
    if (!adminId) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission required", "Gallery access is needed to upload files.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const uploads = await prepareAssetsForUpload(result.assets);
      const res = await apiService.uploadAttachmentFiles(adminId, uploads, folderId);
      const uploaded = res.data?.uploaded?.length ?? 0;
      const errors = res.data?.errors?.length ?? 0;
      if (uploaded > 0) {
        await loadBrowse({ silent: true });
      }
      if (errors > 0) {
        Alert.alert(
          "Upload finished",
          `${uploaded} file(s) uploaded. ${errors} file(s) failed.`
        );
      } else if (uploaded > 0) {
        Alert.alert("Success", `${uploaded} file(s) uploaded.`);
      }
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Try again");
    } finally {
      setUploading(false);
    }
  };

  const renderRow = ({ item }: { item: ListRow }) => {
    if (item.type === "folder") {
      const folder = item.data;
      return (
        <Pressable
          onPress={() => navigateToFolder(folder.id)}
          onLongPress={() => confirmDeleteFolder(folder)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: Colors.dark.primary + "18" }]}>
            <Feather name="folder" size={22} color={Colors.dark.primary} />
          </View>
          <View style={styles.rowBody}>
            <ThemedText style={styles.rowTitle} numberOfLines={1}>
              {folder.name}
            </ThemedText>
            <ThemedText style={[styles.rowMeta, { color: theme.textMuted }]}>
              {folder.child_folder_count} folder(s) · {folder.file_count} file(s)
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textMuted} />
        </Pressable>
      );
    }

    const file = item.data;
    return (
      <Pressable
        onPress={() => void openFile(file)}
        onLongPress={() => confirmDeleteFile(file)}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
          pressed && { opacity: 0.85 },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: theme.border + "40" }]}>
          <Feather name={fileKindIcon(file.file_kind)} size={22} color={theme.text} />
        </View>
        <View style={styles.rowBody}>
          <ThemedText style={styles.rowTitle} numberOfLines={2}>
            {file.original_name}
          </ThemedText>
          <ThemedText style={[styles.rowMeta, { color: theme.textMuted }]}>
            {formatBytes(file.file_size)}
            {file.uploaded_by_name ? ` · ${file.uploaded_by_name}` : ""}
          </ThemedText>
        </View>
        <Feather name="external-link" size={18} color={theme.textMuted} />
      </Pressable>
    );
  };

  if (!adminId) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Admin scope not available. Please log in again.</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
        <View style={[styles.searchWrap, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => void loadBrowse()}
            placeholder="Search folders & files"
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => {
                setSearch("");
                setTimeout(() => void loadBrowse(), 0);
              }}
              hitSlop={8}
            >
              <Feather name="x" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.breadcrumbRow}>
        <Pressable onPress={() => navigateToBreadcrumb(null)} style={styles.crumbBtn}>
          <Feather name="home" size={16} color={Colors.dark.primary} />
          <Text style={[styles.crumbText, { color: Colors.dark.primary }]}>Root</Text>
        </Pressable>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <Feather name="chevron-right" size={14} color={theme.textMuted} />
            <Pressable onPress={() => navigateToBreadcrumb(crumb.id)} style={styles.crumbBtn}>
              <Text
                style={[
                  styles.crumbText,
                  { color: crumb.id === folderId ? theme.text : Colors.dark.primary },
                ]}
                numberOfLines={1}
              >
                {crumb.name}
              </Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.key}
          renderItem={renderRow}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadBrowse({ silent: true });
              }}
              tintColor={Colors.dark.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="folder" size={48} color={theme.textMuted} />
              <ThemedText style={[styles.emptyTitle, { color: theme.textMuted }]}>
                No folders or files here
              </ThemedText>
              <ThemedText style={[styles.emptyHint, { color: theme.textMuted }]}>
                Create a folder or upload from your gallery
              </ThemedText>
            </View>
          }
        />
      )}

      <View style={[styles.actionBar, { borderTopColor: theme.border, backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          onPress={() => setFolderModalVisible(true)}
          style={[styles.actionBtn, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <Feather name="folder-plus" size={20} color={Colors.dark.primary} />
          <Text style={[styles.actionLabel, { color: theme.text }]}>New folder</Text>
        </Pressable>
        <Pressable
          onPress={() => void handleUpload()}
          disabled={uploading}
          style={[styles.actionBtn, styles.actionBtnPrimary, uploading && { opacity: 0.6 }]}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="upload" size={20} color="#fff" />
              <Text style={[styles.actionLabel, { color: "#fff" }]}>Upload</Text>
            </>
          )}
        </Pressable>
      </View>

      <Modal visible={folderModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText style={styles.modalTitle}>New folder</ThemedText>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name"
              placeholderTextColor={theme.textMuted}
              autoFocus
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setFolderModalVisible(false);
                  setNewFolderName("");
                }}
                style={[styles.modalBtn, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.text }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleCreateFolder()}
                disabled={creatingFolder}
                style={[styles.modalBtn, styles.modalBtnPrimary, creatingFolder && { opacity: 0.6 }]}
              >
                {creatingFolder ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg },
  toolbar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
  breadcrumbRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  crumbBtn: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 140 },
  crumbText: { fontSize: 13, fontWeight: "600" },
  listContent: { padding: Spacing.md, paddingBottom: 100, gap: Spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowMeta: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 48, gap: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
  emptyHint: { fontSize: 13, textAlign: "center", paddingHorizontal: Spacing.xl },
  actionBar: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  actionLabel: { fontSize: 15, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  modalActions: { flexDirection: "row", gap: Spacing.sm },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  modalBtnPrimary: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
});
