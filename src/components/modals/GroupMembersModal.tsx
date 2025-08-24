import { Shield, UserPlus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useAuth } from "../../contexts/AuthContext";
import { GroupMember } from "../../hooks/useGroups";
import { TableView } from "../TableView";
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
  updateGroup: (groupId: string, data: { name?: string; description?: string | null }) => Promise<any>;
  deleteGroup: (groupId: string) => Promise<boolean>;
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
  updateGroup,
  deleteGroup,
}) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(groupName);
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [groupSaving, setGroupSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

    // Don't allow changing role of the owner
    if (member.user_id === ownerId) {
      return;
    }

    try {
      const makeAdmin = member.role !== "admin";
      await updateMemberRole(member.id, makeAdmin);
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
    if (
      !window.confirm(
        `Are you sure you want to remove ${
          member.user_email || member.user_id
        } from the group?`
      )
    ) {
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
            {/* Group edit section (owner only) */}
            {isUserOwner && (
              <div className="mb-6 border-b border-zinc-800 pb-4">
                <h4 className="text-sm text-gray-400 mb-2">GROUP SETTINGS</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Name</label>
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                    <input
                      value={editingDescription ?? ""}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      className="w-full bg-black border border-zinc-800 px-3 py-2 text-white text-sm"
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={async () => {
                        setGroupSaving(true);
                        try {
                          await updateGroup(groupId, {
                            name: editingName,
                            description: editingDescription || null,
                          });
                          await loadMembers();
                        } catch (err) {
                          console.error(err);
                          setError("Failed to save group");
                        } finally {
                          setGroupSaving(false);
                        }
                      }}
                      className="bg-white text-black px-3 py-2 text-sm"
                      disabled={groupSaving}
                    >
                      {groupSaving ? "SAVING..." : "SAVE GROUP"}
                    </button>
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="bg-red-700 text-white px-3 py-2 text-sm"
                    >
                      DELETE GROUP
                    </button>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="bg-red-900/30 border border-red-800 p-4 mb-6">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-light text-white">
                {members.length} {members.length === 1 ? "Member" : "Members"}
              </h3>
              {isUserOwner ||
              members.some(
                (m) => m.user_id === user?.id && m.role === "admin"
              ) ? (
                <button
                  onClick={onInviteClick}
                  className="flex items-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-light tracking-wider">
                    INVITE USER
                  </span>
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
                    render: (member: GroupMember) => (
                      <span>{member.user_email ?? member.user_id}</span>
                    ),
                  },
                  {
                    key: "display_name",
                    label: "NAME",
                    render: (member: GroupMember) => (
                      <span>
                        {member.display_name ??
                          member.user_email ??
                          member.user_id}
                      </span>
                    ),
                  },
                  {
                    key: "role",
                    label: "ROLE",
                    render: (member: GroupMember) => (
                      <div className="flex items-center space-x-2">
                        {member.user_id === ownerId ? (
                          <span className="text-yellow-500 flex items-center">
                            <Shield className="w-4 h-4 mr-1" />
                            Owner
                          </span>
                        ) : member.role === "admin" ? (
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
                ]}
                onEdit={
                  isUserOwner ||
                  (user &&
                    members.some(
                      (m) => m.user_id === user.id && m.role === "admin"
                    ))
                    ? (member) => handleToggleAdmin(member)
                    : undefined
                }
                onDelete={
                  isUserOwner ||
                  (user &&
                    members.some(
                      (m) => m.user_id === user.id && m.role === "admin"
                    ))
                    ? (member) => handleRemoveMember(member)
                    : undefined
                }
                defaultViewMode="table"
              />
            )}
          </div>
        </div>
      </div>

      <ModalAnimations />
      {confirmOpen && (
        <DeleteConfirmationModal
          title={`Delete group ${groupName}`}
          message={`Are you sure you want to delete the group "${groupName}" and all its data? This action cannot be undone.`}
          onClose={() => setConfirmOpen(false)}
          onConfirm={async () => {
            try {
              await deleteGroup(groupId);
              onClose();
            } catch (err) {
              console.error(err);
              setError("Failed to delete group");
            }
          }}
        />
      )}
    </>
  );
};

export default GroupMembersModal;
