import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export interface Group {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  user_email?: string; // joined from profiles
  display_name?: string | null; // joined from profiles
  role?: string; // from group_members.role
  created_at: string;
  updated_at: string;
}

export interface GroupWithMembers extends Group {
  members?: GroupMember[];
}

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroups();
    } else {
      setGroups([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const ownedRes = await supabase
        .from("groups")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      const memberRes = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (ownedRes.error) throw ownedRes.error;
      if (memberRes.error) throw memberRes.error;

      const ownedGroups = ownedRes.data || [];
      const memberGroupIds = memberRes.data?.map((m: any) => m.group_id) || [];

      let memberGroups: Group[] = [];
      if (memberGroupIds.length > 0) {
        const { data, error } = await supabase
          .from("groups")
          .select("*")
          .in("id", memberGroupIds);
        if (error) throw error;
        memberGroups = data || [];
      }

      const allGroups = [...ownedGroups, ...memberGroups];
      const unique = Array.from(
        new Map(allGroups.map((g: Group) => [g.id, g])).values()
      );
      setGroups(unique as GroupWithMembers[]);
    } catch (err) {
      console.error("Error fetching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description?: string) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from("groups")
        .insert([{ name, description, owner_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      await fetchGroups();
      return data;
    } catch (err) {
      console.error("Error creating group:", err);
      throw err;
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      const { data: members, error } = await supabase
        .from("group_members")
        .select(`id, group_id, user_id, role, created_at, updated_at`)
        .eq("group_id", groupId);

      if (error) throw error;

      const membersWithProfiles = await Promise.all(
        (members || []).map(async (member: any) => {
          try {
            // Try to get display_name and email from profiles
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, email")
              .eq("id", member.user_id)
              .single();

            let email = profile?.email;

            // If profiles doesn't have email, try auth.users
            if (!email) {
              try {
                const { data: authUser } = await supabase
                  .from("auth.users")
                  .select("email")
                  .eq("id", member.user_id)
                  .single();
                email = authUser?.email;
              } catch (e) {
                // ignore
              }
            }

            return {
              ...member,
              user_email: email || member.user_id,
              display_name: profile?.display_name || null,
              role: member.role,
            } as GroupMember;
          } catch (profileErr) {
            console.error("Error fetching profile:", profileErr);
            return {
              ...member,
              user_email: member.user_id,
              display_name: null,
              role: member.role,
            } as GroupMember;
          }
        })
      );

      // Ensure the group owner appears in the members list (owner may not be in group_members)
      try {
        const { data: groupData, error: groupErr } = await supabase
          .from("groups")
          .select("owner_id")
          .eq("id", groupId)
          .single();

        if (!groupErr && groupData?.owner_id) {
          const ownerId = groupData.owner_id as string;
          const ownerPresent = (membersWithProfiles || []).some(
            (m: any) => m.user_id === ownerId
          );
          if (!ownerPresent) {
            // fetch owner profile
            try {
              const { data: ownerProfile } = await supabase
                .from("profiles")
                .select("display_name, email")
                .eq("id", ownerId)
                .single();

              // try to populate owner email if possible
              let ownerEmail: string | undefined = ownerProfile?.email;
              if (!ownerEmail) {
                try {
                  const { data: authUser } = await supabase
                    .from("auth.users")
                    .select("email")
                    .eq("id", ownerId)
                    .single();
                  ownerEmail = authUser?.email;
                } catch (e) {
                  // ignore
                }
              }

              const ownerEntry: GroupMember = {
                id: `owner-${ownerId}`,
                group_id: groupId,
                user_id: ownerId,
                user_email: ownerEmail || ownerId,
                display_name: ownerProfile?.display_name || null,
                role: "owner",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

              membersWithProfiles.unshift(ownerEntry);
            } catch (ownerProfileErr) {
              console.error("Error fetching owner profile:", ownerProfileErr);
            }
          }
        }
      } catch (e) {
        // non-fatal
      }

      return membersWithProfiles as GroupMember[];
    } catch (err) {
      console.error("Error fetching group members:", err);
      throw err;
    }
  };

  const inviteUserToGroup = async (
    groupId: string,
    email: string,
    isAdmin?: boolean
  ) => {
    try {
      // Try to find user id by email in profiles (adjust if your schema differs)
      const { data: userData, error: userErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (userErr || !userData) {
        throw new Error("User not found with this email");
      }

      const { data: existing, error: existingErr } = await supabase
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", userData.id);

      if (existingErr) throw existingErr;
      if (existing && (existing as any).length > 0)
        throw new Error("User is already a member");

      const role = isAdmin ? "admin" : "member";
      const { data, error } = await supabase
        .from("group_members")
        .insert([{ group_id: groupId, user_id: userData.id, role }])
        .select();

      if (error) throw error;
      await fetchGroups();
      return data;
    } catch (err) {
      console.error("Error inviting user to group:", err);
      throw err;
    }
  };

  const updateMemberRole = async (_memberId: string, _isAdmin: boolean) => {
    // Update the role column on group_members: set to 'admin' or 'member'
    try {
      const newRole = _isAdmin ? "admin" : "member";
      const { error } = await supabase
        .from("group_members")
        .update({ role: newRole })
        .eq("id", _memberId);
      if (error) throw error;
      await fetchGroups();
      return { updated: true };
    } catch (err) {
      console.error("Error updating member role:", err);
      throw err;
    }
  };

  const removeMemberFromGroup = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      await fetchGroups();
      return true;
    } catch (err) {
      console.error("Error removing member from group:", err);
      throw err;
    }
  };

  const acceptInvitation = async (_memberId: string) => {
    // No status column: accepting is a no-op server-side; simply refresh local state
    await fetchGroups();
    return { accepted: true };
  };

  const rejectInvitation = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
      await fetchGroups();
      return { rejected: true };
    } catch (err) {
      console.error("Error rejecting invitation:", err);
      throw err;
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from("group_members")
        .select(
          `id, group_id, created_at, groups:group_id (id, name, description)`
        )
        .eq("user_id", user.id);

      if (error) throw error;

      const groupIds = groups.map((g) => g.id);
      const pending = (data || []).filter(
        (inv: any) => !groupIds.includes(inv.group_id)
      );
      return pending;
    } catch (err) {
      console.error("Error fetching pending invitations:", err);
      throw err;
    }
  };

  return {
    groups,
    loading,
    createGroup,
    refetch: fetchGroups,
    fetchGroupMembers,
    inviteUserToGroup,
    updateMemberRole,
    removeMemberFromGroup,
    acceptInvitation,
    rejectInvitation,
    fetchPendingInvitations,
  };
};
