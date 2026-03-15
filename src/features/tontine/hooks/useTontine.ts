import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listTontines,
  getTontine,
  createTontine,
  updateTontine,
  addMember,
  markPaymentPaid,
  deleteTontine,
} from "../server/tontineFns";

export function useTontines() {
  return useQuery({
    queryKey: ["tontines"],
    queryFn: () => listTontines(),
  });
}

export function useTontine(id: string) {
  return useQuery({
    queryKey: ["tontine", id],
    queryFn: () => getTontine({ data: id }),
    enabled: !!id,
  });
}

export function useCreateTontine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTontine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tontines"] });
    },
  });
}

export function useUpdateTontine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTontine,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tontines"] });
      queryClient.invalidateQueries({ queryKey: ["tontine", data.id] });
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addMember,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tontine", data.tontineId] });
    },
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markPaymentPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tontines"] });
      // Invalidate all individual tontine queries
      queryClient.invalidateQueries({ queryKey: ["tontine"] });
    },
  });
}

export function useDeleteTontine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTontine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tontines"] });
    },
  });
}
