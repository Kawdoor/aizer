import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  user_email?: string;  // Joined from profiles
  display_name?: string | null; // Joined from profiles
  is_admin: boolean;
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
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;

    try {
      // First fetch all groups where user is owner or member
      const ownedGroups = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      const memberGroups = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (ownedGroups.error) throw ownedGroups.error;
      if (memberGroups.error) throw memberGroups.error;

      // Get the actual groups where the user is a member
      let memberGroupIds = memberGroups.data?.map(m => m.group_id) || [];
      let memberGroupsData: Group[] = [];
      
      if (memberGroupIds.length > 0) {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .in('id', memberGroupIds);
          
        if (error) throw error;
        memberGroupsData = data || [];
      }

      // Combine both sets of groups
      const allGroups = [...(ownedGroups.data || []), ...memberGroupsData];
      
      // Remove duplicates if any
      const uniqueGroups = Array.from(
        new Map(allGroups.map(item => [item.id, item])).values()
      );

      setGroups(uniqueGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('groups')
        .insert([{ name, description, owner_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      await fetchGroups();
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    try {
      // Get members and their email from profiles table
      const { data: members, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          user_id,
          is_admin,
          created_at,
          updated_at
        `)
        .eq('group_id', groupId);

      if (error) throw error;
      
      // For each member, get their profile information
      const membersWithProfiles = await Promise.all(members.map(async (member) => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', member.user_id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return {
            ...member,
            user_email: member.user_id, // Use user_id as email as it's likely the email
            display_name: null
          };
        }
        
        return {
          ...member,
          user_email: member.user_id, // In Auth system, the ID is typically the email
          display_name: profile?.display_name || null
        };
      }));
      
      return membersWithProfiles;
    } catch (error) {
      console.error('Error fetching group members:', error);
      throw error;
    }
  };

  const inviteUserToGroup = async (groupId: string, email: string, isAdmin: boolean = false) => {
    try {
      // First check if the user exists
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', email)
        .single();

      if (userError) {
        throw new Error('User not found with this email');
      }

      // Check if the user is already a member or invited
      const { data: existingMember, error: memberError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userData.id);

      if (memberError) throw memberError;

      if (existingMember && existingMember.length > 0) {
        throw new Error('User is already a member or has a pending invitation');
      }

      // Create the invitation
      const { data, error } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: userData.id,
          is_admin: isAdmin
        }])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error inviting user to group:', error);
      throw error;
    }
  };

  const updateMemberRole = async (memberId: string, isAdmin: boolean) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .update({ is_admin: isAdmin })
        .eq('id', memberId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  };

  const removeMemberFromGroup = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  };

  const acceptInvitation = async (memberId: string) => {
    try {
      // Since we don't have a status column, just keep the member in the table
      await fetchGroups();
      return { accepted: true };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  };

  const rejectInvitation = async (memberId: string) => {
    try {
      // Since we don't have a status column, rejecting means removing the member
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      await fetchGroups();
      return { rejected: true };
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      throw error;
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user) return [];

    try {
      // Without the status column, we'll consider all group_members as pending invitations
      // We'll need to filter on the frontend based on the groups the user is already a member of
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          is_admin,
          created_at,
          groups:group_id (
            name,
            description
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // We need to filter out the groups where the user is already a member
      // by checking against the groups array
      const groupIds = groups.map(g => g.id);
      const pendingInvitations = data?.filter(
        invitation => !groupIds.includes(invitation.group_id)
      ) || [];
      
      return pendingInvitations;
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
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
    fetchPendingInvitations
  };
};