import { Bell, Check, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useGroups } from "../hooks/useGroups";

interface NotificationsBellProps {
  onAcceptedInvitation?: () => void;
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({
  onAcceptedInvitation,
}) => {
  const {
    fetchPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    loading: groupsLoading,
  } = useGroups();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const pendingInvitations = await fetchPendingInvitations();
      setInvitations(pendingInvitations || []);
    } catch (error) {
      console.error("Error loading invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load invitations after groups have finished loading to avoid false positives
    if (!groupsLoading) {
      loadInvitations();
    }

    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsLoading]);

  const handleAccept = async (id: string) => {
    try {
      await acceptInvitation(id);
      await loadInvitations();
      onAcceptedInvitation?.();
    } catch (err) {
      console.error("Error accepting invitation", err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectInvitation(id);
      await loadInvitations();
    } catch (err) {
      console.error("Error rejecting invitation", err);
    }
  };

  const count = invitations.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && !groupsLoading) loadInvitations();
        }}
        className="p-2 rounded-full text-gray-400 hover:text-white transition-colors border border-transparent hover:border-zinc-800"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 p-3 z-50">
          <h4 className="text-sm text-gray-400 mb-2">Pending Invitations</h4>
          {loading ? (
            <div className="text-gray-400 text-sm">Loading...</div>
          ) : invitations.length === 0 ? (
            <div className="text-gray-400 text-sm">No pending invitations</div>
          ) : (
            <div className="space-y-2">
              {invitations.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between border border-zinc-800 p-2"
                >
                  <div className="text-sm text-white">
                    {inv.groups?.name || "Group"}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAccept(inv.id)}
                      className="bg-green-800/30 hover:bg-green-700/40 border border-green-800 text-green-400 p-2 rounded-full transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(inv.id)}
                      className="bg-red-800/30 hover:bg-red-700/40 border border-red-800 text-red-400 p-2 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
