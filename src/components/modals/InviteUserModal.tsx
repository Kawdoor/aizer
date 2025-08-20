import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ModalAnimations } from "./ModalAnimations";

interface InviteUserModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onUserInvited: () => void;
  onInviteUser: (email: string, isAdmin: boolean) => Promise<void>;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  groupId,
  groupName,
  onClose,
  onUserInvited,
  onInviteUser,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    isAdmin: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onInviteUser(formData.email, formData.isAdmin);
      onUserInvited();
    } catch (error) {
      console.error("Error inviting user:", error);
      setError(error instanceof Error ? error.message : "Error inviting user");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/0 backdrop-blur-0 z-50 transition-all duration-300"
        style={{ animation: "fadeIn 0.3s ease-out forwards" }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto modal-scroll"
          style={{ animation: "slideUp 0.3s ease-out forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
            <h2 className="text-lg font-light tracking-wider text-white">
              INVITE USER TO {groupName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-800 p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                USER EMAIL
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                placeholder="user@example.com"
              />
              <p className="text-gray-500 text-xs mt-2">
                The user must be registered in the system to receive the invitation.
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isAdmin"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={handleChange}
                className="mr-2 bg-black border border-zinc-800"
              />
              <label 
                htmlFor="isAdmin" 
                className="text-sm font-light tracking-wider text-gray-300"
              >
                Grant admin permissions
              </label>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-zinc-800 py-3 font-light text-sm tracking-wider text-gray-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-black py-3 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "SENDING INVITE..." : "SEND INVITE"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default InviteUserModal;
