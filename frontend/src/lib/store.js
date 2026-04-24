import { useState, useCallback, useSyncExternalStore } from "react";

function createStore(initialData) {
  let data = structuredClone(initialData);
  const listeners = new Set();

  function notify() {
    listeners.forEach((l) => l());
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return data;
    },

    getList(key) {
      return data[key] ?? [];
    },
    addItem(key, item) {
      const list = data[key] ?? [];
      const maxId = list.reduce((m, i) => Math.max(m, i.id ?? 0), 0);
      const newItem = { ...item, id: maxId + 1 };
      data = { ...data, [key]: [...list, newItem] };
      notify();
      return newItem;
    },
    updateItem(key, id, updates) {
      data = {
        ...data,
        [key]: (data[key] ?? []).map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      };
      notify();
    },
    deleteItem(key, id) {
      data = {
        ...data,
        [key]: (data[key] ?? []).filter((i) => i.id !== id),
      };
      notify();
    },

    set(key, value) {
      data = { ...data, [key]: value };
      notify();
    },
    get(key) {
      return data[key];
    },
  };
}

/** Empty lists — pages load data from the .NET API into the store (or local state). */
const storeData = {
  staffMembers: [],
  partsInventory: [],
  vendors: [],
  customers: [],
  notifications: [],
  orderHistory: [],
  purchaseInvoices: [],
  posProducts: [],
  completedSales: [],
  partRequests: [],
};

export const store = createStore(storeData);

export function useStore(selector) {
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return selector ? selector(snap) : snap;
}

export function useList(key) {
  const snap = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const list = snap[key] ?? [];

  const add = useCallback((item) => store.addItem(key, item), [key]);
  const update = useCallback((id, u) => store.updateItem(key, id, u), [key]);
  const remove = useCallback((id) => store.deleteItem(key, id), [key]);

  return { list, add, update, remove };
}
