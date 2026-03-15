import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../server/profileFns";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });
}
