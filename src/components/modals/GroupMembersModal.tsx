import { UserPlus, Shield, X, Check } from "lucide-react";
import React, { useEffect, useState } from "react";
import { TableView } from "../TableView";
import { GroupMember } from "../../hooks/useGroups";
import { useAuth } from "../../contexts/AuthContext";
import { ModalAnimations } from "./ModalAnimations";

interface GroupMembersModalProps {
  groupId: string;
  groupName: string;
  ownerId: string;
  onClose: () => void;
  onInviteClick: () => void;
  fetchMembers: (groupId: string) => Promise<GroupMember[]>;
  updateMemberRole: (memberId: string, isAdmin: boolean) => Promise<any>;
  removeMember: (memberId: string) => Promise<boolean>;
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  groupId,
  groupName,
  ownerId,
  onClose,
  onInviteClick,
  fetchMembers,
  updateMemberRole,
  removeMember,
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    loadMembers();
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [groupId]);
  
  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const membersList = await fetchMembers(groupId);
      setMembers(membersList);
    } catch (err) {
      console.error("Error loading members:", err);
      setError("Failed to load group members");
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleAdmin = async (member: GroupMember) => {
    if (!user) return;
    
    // Don't allow removing admin from the owner
    if (member.user_id === ownerId && member.is_admin) {
      return;
    }
    
    try {
      await updateMemberRole(member.id, !member.is_admin);
      await loadMembers();
    } catch (err) {
      console.error("Error updating role:", err);
      setError("Failed to update member role");
    }
  };
  
  const handleRemoveMember = async (member: GroupMember) => {
    if (!user) return;
    
    // Don't allow removing the owner
    if (member.user_id === ownerId) {
      setError("Cannot remove the group owner");
      return;
    }
    
    // Confirm before removing
    if (!window.confirm(`Are you sure you want to remove ${member.user_email || member.user_id} from the group?`)) {
      return;
    }
    
    try {
      await removeMember(member.id);
      await loadMembers();
    } catch (err) {
      console.error("Error removing member:", err);
      setError("Failed to remove member");
    }
  };
  
  const isUserOwner = user?.id === ownerId;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/0 backdrop-blur-0 z-50 transition-all duration-300"
        style={{ animation: "fadeIn 0.3s ease-out forwards" }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto modal-scroll"
          style={{ animation: "slideUp 0.3s ease-out forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
            <h2 className="text-lg font-light tracking-wider text-white">
              {groupName} - MEMBERS
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-900/30 border border-red-800 p-4 mb-6">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-light text-white">
                {members.length} {members.length === 1 ? "Member" : "Members"}
              </h3>
              {isUserOwner || members.some(m => m.user_id === user?.id && m.is_admin) ? (
                <button
                  onClick={onInviteClick}
                  className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-light tracking-wider">INVITE USER</span>
                </button>
              ) : null}
            </div>

            {loading ? (
              <div className="text-center py-10">
                <p className="text-gray-400">Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400">No members found</p>
              </div>
            ) : (
              <TableView
                data={members}
                columns={[
                  {
                    key: "user_email",
                    label: "EMAIL",
                  },
                  {
                    key: "display_name",
                    label: "NAME",
                  },
                  {
                    key: "is_admin",
                    label: "ROLE",
                    render: (member) => (
                      <div className="flex items-center space-x-2">
                        {member.user_id === ownerId ? (
                          <span className="text-yellow-500 flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            Owner
                          </span>
                        ) : member.is_admin ? (
                          <span className="text-blue-500 flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span>Member</span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    label: "STATUS",
                    render: () => (
                      <span className="text-green-500 flex items-center">
                        <Check className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    ),
                  },
                ]}
                onEdit={isUserOwner || (user && members.some(m => m.user_id === user.id && m.is_admin)) ? 
                  (member) => handleToggleAdmin(member) : undefined}
                onDelete={isUserOwner || (user && members.some(m => m.user_id === user.id && m.is_admin)) ? 
                  (member) => handleRemoveMember(member) : undefined}
              />
            )}
          </div>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default GroupMembersModal;
