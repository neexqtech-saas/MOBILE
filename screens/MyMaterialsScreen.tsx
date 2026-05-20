import React, { useCallback, useState } from "react";

import {

  View,

  StyleSheet,

  ActivityIndicator,

  FlatList,

  RefreshControl,

  Text,

  Pressable,

  Modal,

  TextInput,

  Alert,

  KeyboardAvoidingView,

  Platform,

} from "react-native";

import { Feather } from "@expo/vector-icons";



import { ThemedText } from "@/components/ThemedText";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";

import { useHRMSStore } from "@/store/hrmsStore";

import { apiService, type InventoryMaterialAssignment } from "@/services/api";



export default function MyMaterialsScreen() {

  const { employee } = useHRMSStore();

  const [items, setItems] = useState<InventoryMaterialAssignment[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [ackModalVisible, setAckModalVisible] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryMaterialAssignment | null>(null);

  const [remark, setRemark] = useState("");

  const [submitting, setSubmitting] = useState(false);



  const load = useCallback(async () => {

    const adminId = employee.adminId;

    const userId = employee.id;

    if (!adminId) {

      setError("Admin not configured. Please log in again.");

      setLoading(false);

      return;

    }

    try {

      const res = await apiService.getMyInventoryMaterials(adminId, userId);

      setItems(Array.isArray(res.data) ? res.data : []);

      setError(null);

    } catch (e: any) {

      setError(e?.message || "Failed to load materials");

      setItems([]);

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [employee.adminId, employee.id]);



  React.useEffect(() => {

    load();

  }, [load]);



  const onRefresh = () => {

    setRefreshing(true);

    load();

  };



  const formatDate = (dateStr: string) => {

    try {

      return new Date(dateStr).toLocaleDateString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric",

      });

    } catch {

      return dateStr;

    }

  };



  const openAcknowledge = (item: InventoryMaterialAssignment) => {

    setSelectedItem(item);

    setRemark("");

    setAckModalVisible(true);

  };



  const closeAckModal = () => {

    if (submitting) return;

    setAckModalVisible(false);

    setSelectedItem(null);

    setRemark("");

  };



  const submitAcknowledge = async () => {

    const adminId = employee.adminId;

    const userId = employee.id;

    if (!adminId || !userId || !selectedItem) return;

    const trimmed = remark.trim();

    if (!trimmed) {

      Alert.alert("Remark required", "Please add a short note (e.g. received in good condition).");

      return;

    }

    setSubmitting(true);

    try {

      await apiService.acknowledgeInventoryMaterial(adminId, userId, selectedItem.id, trimmed);

      setItems((prev) =>

        prev.map((it) =>

          it.id === selectedItem.id

            ? {

                ...it,

                isReceived: true,

                receivedAt: new Date().toISOString(),

                receiveRemark: trimmed,

              }

            : it

        )

      );

      closeAckModal();

      Alert.alert("Received", "Material receipt recorded. Admin dashboard will reflect this.");

    } catch (e: any) {

      Alert.alert("Failed", e?.message || "Could not submit receipt");

    } finally {

      setSubmitting(false);

    }

  };



  const renderItem = ({ item }: { item: InventoryMaterialAssignment }) => {

    const received = !!item.isReceived;

    return (

      <View style={styles.card}>

        <View style={styles.cardIcon}>

          <Feather name="package" size={22} color={Colors.dark.primary} />

        </View>

        <View style={styles.cardBody}>

          <View style={styles.cardTitleRow}>

            <Text style={styles.cardTitle} numberOfLines={3}>

              {item.item}

            </Text>

            <View

              style={[

                styles.receiptBadge,

                received ? styles.receiptBadgeDone : styles.receiptBadgePending,

              ]}

            >

              <Text style={styles.receiptBadgeText}>{received ? "Received" : "Pending"}</Text>

            </View>

          </View>

          <View style={styles.qtyRow}>

            <Text style={styles.qtyValue}>{String(item.quantity)}</Text>

            <Text style={styles.qtyUnit}>{item.unit}</Text>

          </View>

          <View style={styles.metaRow}>

            <Feather name="map-pin" size={12} color="#64748B" style={styles.metaIcon} />

            <Text style={styles.metaText} numberOfLines={2}>

              {item.site || "—"}

            </Text>

          </View>

          <View style={styles.metaRow}>

            <Feather name="calendar" size={12} color="#64748B" style={styles.metaIcon} />

            <Text style={styles.metaText} numberOfLines={1}>

              Issued {formatDate(item.assignedDate)}

            </Text>

          </View>

          {received && item.receiveRemark ? (

            <View style={styles.remarkBox}>

              <Text style={styles.remarkLabel}>Your remark</Text>

              <Text style={styles.remarkText}>{item.receiveRemark}</Text>

            </View>

          ) : null}

          {!received ? (

            <Pressable

              style={({ pressed }) => [styles.ackButton, pressed && styles.ackButtonPressed]}

              onPress={() => openAcknowledge(item)}

            >

              <Feather name="check-circle" size={18} color="#FFFFFF" />

              <Text style={styles.ackButtonText}>Mark as received</Text>

            </Pressable>

          ) : null}

        </View>

      </View>

    );

  };



  if (loading) {

    return (

      <View style={styles.centered}>

        <ActivityIndicator size="large" color={Colors.dark.primary} />

        <ThemedText style={styles.hint}>Loading your materials…</ThemedText>

      </View>

    );

  }



  if (error) {

    return (

      <View style={styles.container}>

        <View style={styles.centered}>

          <Feather name="alert-circle" size={40} color="#EF4444" />

          <Text style={styles.errorText}>{error}</Text>

        </View>

      </View>

    );

  }



  return (

    <View style={styles.container}>

      <FlatList

        data={items}

        keyExtractor={(item) => String(item.id)}

        renderItem={renderItem}

        contentContainerStyle={styles.listContent}

        refreshControl={

          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.dark.primary]} />

        }

        ListEmptyComponent={

          <View style={styles.empty}>

            <Feather name="inbox" size={48} color="#CBD5E1" />

            <Text style={styles.emptyTitle}>No materials assigned</Text>

            <Text style={styles.emptySub}>

              When admin issues material for you, it will show here and you will receive a push notification.

            </Text>

          </View>

        }

      />



      <Modal visible={ackModalVisible} transparent animationType="slide" onRequestClose={closeAckModal}>

        <KeyboardAvoidingView

          style={styles.modalOverlay}

          behavior={Platform.OS === "ios" ? "padding" : undefined}

        >

          <Pressable style={styles.modalBackdrop} onPress={closeAckModal} />

          <View style={styles.modalSheet}>

            <Text style={styles.modalTitle}>Confirm receipt</Text>

            {selectedItem ? (

              <Text style={styles.modalItem} numberOfLines={2}>

                {selectedItem.item} · {selectedItem.quantity} {selectedItem.unit}

              </Text>

            ) : null}

            <Text style={styles.modalLabel}>Remark *</Text>

            <TextInput

              style={styles.modalInput}

              placeholder="e.g. Received in good condition at site"

              placeholderTextColor="#94A3B8"

              value={remark}

              onChangeText={setRemark}

              multiline

              maxLength={500}

              editable={!submitting}

            />

            <View style={styles.modalActions}>

              <Pressable style={styles.modalCancel} onPress={closeAckModal} disabled={submitting}>

                <Text style={styles.modalCancelText}>Cancel</Text>

              </Pressable>

              <Pressable

                style={[styles.modalSubmit, submitting && styles.modalSubmitDisabled]}

                onPress={submitAcknowledge}

                disabled={submitting}

              >

                {submitting ? (

                  <ActivityIndicator color="#FFF" size="small" />

                ) : (

                  <Text style={styles.modalSubmitText}>Submit received</Text>

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

  container: {

    flex: 1,

    backgroundColor: "#F8FAFC",

  },

  listContent: {

    paddingHorizontal: Spacing.lg,

    paddingTop: Spacing.lg,

    paddingBottom: Spacing["3xl"],

    flexGrow: 1,

  },

  card: {

    flexDirection: "row",

    alignItems: "flex-start",

    backgroundColor: "#FFFFFF",

    borderRadius: BorderRadius.lg,

    padding: Spacing.md,

    marginBottom: Spacing.md,

    borderWidth: 1,

    borderColor: "#E2E8F0",

  },

  cardIcon: {

    width: 44,

    height: 44,

    borderRadius: 12,

    backgroundColor: Colors.dark.primary + "14",

    alignItems: "center",

    justifyContent: "center",

    marginRight: Spacing.md,

    flexShrink: 0,

  },

  cardBody: {

    flex: 1,

    minWidth: 0,

  },

  cardTitleRow: {

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 8,

    marginBottom: 6,

  },

  cardTitle: {

    flex: 1,

    fontSize: 15,

    fontWeight: "700",

    color: "#1E293B",

    lineHeight: 20,

  },

  receiptBadge: {

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 8,

    flexShrink: 0,

  },

  receiptBadgePending: {

    backgroundColor: "#FEF3C7",

  },

  receiptBadgeDone: {

    backgroundColor: "#DCFCE7",

  },

  receiptBadgeText: {

    fontSize: 11,

    fontWeight: "700",

    color: "#334155",

  },

  qtyRow: {

    flexDirection: "row",

    alignItems: "baseline",

    flexWrap: "wrap",

    gap: 6,

    marginBottom: 8,

  },

  qtyValue: {

    fontSize: 20,

    fontWeight: "800",

    color: Colors.dark.primary,

  },

  qtyUnit: {

    fontSize: 14,

    color: "#64748B",

    fontWeight: "600",

  },

  metaRow: {

    flexDirection: "row",

    alignItems: "flex-start",

    marginTop: 4,

  },

  metaIcon: {

    marginTop: 2,

    marginRight: 6,

    flexShrink: 0,

  },

  metaText: {

    flex: 1,

    flexShrink: 1,

    fontSize: 13,

    color: "#64748B",

    lineHeight: 18,

  },

  remarkBox: {

    marginTop: Spacing.sm,

    padding: Spacing.sm,

    backgroundColor: "#F1F5F9",

    borderRadius: 8,

  },

  remarkLabel: {

    fontSize: 11,

    fontWeight: "600",

    color: "#64748B",

    marginBottom: 2,

  },

  remarkText: {

    fontSize: 13,

    color: "#334155",

    lineHeight: 18,

  },

  ackButton: {

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    marginTop: Spacing.md,

    backgroundColor: Colors.dark.primary,

    paddingVertical: 10,

    paddingHorizontal: Spacing.md,

    borderRadius: BorderRadius.md,

  },

  ackButtonPressed: {

    opacity: 0.9,

  },

  ackButtonText: {

    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "700",

  },

  centered: {

    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    padding: Spacing.xl,

  },

  hint: {

    marginTop: Spacing.md,

    color: "#64748B",

    textAlign: "center",

  },

  errorText: {

    marginTop: Spacing.md,

    color: "#EF4444",

    textAlign: "center",

    fontSize: 14,

    lineHeight: 20,

    paddingHorizontal: Spacing.lg,

  },

  empty: {

    alignItems: "center",

    paddingTop: 48,

    paddingHorizontal: Spacing.xl,

  },

  emptyTitle: {

    marginTop: Spacing.lg,

    fontSize: 16,

    fontWeight: "700",

    color: "#1E293B",

    textAlign: "center",

  },

  emptySub: {

    marginTop: Spacing.sm,

    fontSize: 14,

    color: "#64748B",

    textAlign: "center",

    lineHeight: 22,

  },

  modalOverlay: {

    flex: 1,

    justifyContent: "flex-end",

  },

  modalBackdrop: {

    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(15, 23, 42, 0.45)",

  },

  modalSheet: {

    backgroundColor: "#FFFFFF",

    borderTopLeftRadius: 20,

    borderTopRightRadius: 20,

    padding: Spacing.xl,

    paddingBottom: Spacing["3xl"],

  },

  modalTitle: {

    fontSize: 18,

    fontWeight: "800",

    color: "#0F172A",

    marginBottom: 6,

  },

  modalItem: {

    fontSize: 14,

    color: "#64748B",

    marginBottom: Spacing.md,

    lineHeight: 20,

  },

  modalLabel: {

    fontSize: 13,

    fontWeight: "600",

    color: "#334155",

    marginBottom: 6,

  },

  modalInput: {

    borderWidth: 1,

    borderColor: "#E2E8F0",

    borderRadius: BorderRadius.md,

    padding: Spacing.md,

    minHeight: 88,

    fontSize: 15,

    color: "#0F172A",

    textAlignVertical: "top",

  },

  modalActions: {

    flexDirection: "row",

    gap: Spacing.md,

    marginTop: Spacing.lg,

  },

  modalCancel: {

    flex: 1,

    paddingVertical: 12,

    alignItems: "center",

    borderRadius: BorderRadius.md,

    borderWidth: 1,

    borderColor: "#E2E8F0",

  },

  modalCancelText: {

    fontSize: 15,

    fontWeight: "600",

    color: "#64748B",

  },

  modalSubmit: {

    flex: 1,

    paddingVertical: 12,

    alignItems: "center",

    justifyContent: "center",

    borderRadius: BorderRadius.md,

    backgroundColor: Colors.dark.primary,

  },

  modalSubmitDisabled: {

    opacity: 0.7,

  },

  modalSubmitText: {

    fontSize: 15,

    fontWeight: "700",

    color: "#FFFFFF",

  },

});


