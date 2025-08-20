import { Bell, Check, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useGroups } from "../hooks/useGroups";

interface PendingInvitationProps {
  invitationId: string;
  groupName: string;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
}

const PendingInvitation: React.FC<PendingInvitationProps> = ({
  invitationId,
  groupName,
  onAccept,
  onReject
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  
  const handleAccept = async () => {
    setLoading('accept');
    await onAccept();
    setLoading(null);
  };
  
  const handleReject = async () => {
    setLoading('reject');
    await onReject();
    setLoading(null);
  };
  
  return (
    <div className="flex items-center justify-between border border-zinc-800 p-3">
      <div>
        <p className="text-white">
          Invitation to join <strong>{groupName}</strong>
        </p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={handleAccept}
          disabled={loading !== null}
          className="bg-green-800/30 hover:bg-green-700/40 border border-green-800 text-green-400 p-2 rounded-full transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="bg-red-800/30 hover:bg-red-700/40 border border-red-800 text-red-400 p-2 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface PendingInvitationsProps {
  onAcceptedInvitation: () => void;
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({
  onAcceptedInvitation
}) => {
  const { fetchPendingInvitations, acceptInvitation, rejectInvitation } = useGroups();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadInvitations = async () => {
    setLoading(true);
    try {
      const pendingInvitations = await fetchPendingInvitations();
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadInvitations();
  }, []);
  
  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      await loadInvitations();
      onAcceptedInvitation();
    } catch (error) {
      console.error("Error accepting invitation:", error);
    }
  };
  
  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      await loadInvitations();
    } catch (error) {
      console.error("Error rejecting invitation:", error);
    }
  };
  
  if (loading) {
    return null;
  }
  
  if (invitations.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <div className="border-b border-zinc-800 pb-2 mb-3">
        <h3 className="flex items-center text-lg font-light text-white">
          <Bell className="w-4 h-4 mr-2" />
          PENDING INVITATIONS
        </h3>
      </div>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <PendingInvitation
            key={invitation.id}
            invitationId={invitation.id}
            groupName={invitation.groups.name}
            onAccept={() => handleAcceptInvitation(invitation.id)}
            onReject={() => handleRejectInvitation(invitation.id)}
          />
        ))}
      </div>
    </div>
  );
};
