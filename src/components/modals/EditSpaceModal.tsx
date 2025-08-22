import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ModalAnimations } from "./ModalAnimations";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../toast/Toast";

interface Space {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

interface EditSpaceModalProps {
  space: Space;
  spaces: Space[];
  onClose: () => void;
  onSpaceUpdated: () => void;
}

const EditSpaceModal: React.FC<EditSpaceModalProps> = ({
  space,
  spaces,
  onClose,
  onSpaceUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshSession } = useAuth();
  const { push } = useToast();

  const [formData, setFormData] = useState({
    name: space.name,
    description: space.description || "",
    parent_id: space.parent_id || "",
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

  // (availableParentSpaces is computed below for the select)

    try {
      const { error } = await supabase
        .from("spaces")
        .update({
          name: formData.name,
          description: formData.description || null,
          parent_id: formData.parent_id || null,
        })
        .eq("id", space.id);

      if (error) {
        // Check if it's an authentication error (401, 403)
        if (error.code === '401' || error.code === '403' || error.message?.includes('JWT')) {
          console.log("Authentication error detected, trying to refresh session...");
          const refreshed = await refreshSession();
          
          if (refreshed) {
            // Try again with refreshed session
            const { error: retryError } = await supabase
              .from("spaces")
              .update({
                name: formData.name,
                description: formData.description || null,
                parent_id: formData.parent_id || null,
              })
              .eq("id", space.id);
            
            if (retryError) {
              setErrorMessage("No se pudo actualizar el espacio después de refrescar la sesión. Por favor, inicia sesión nuevamente.");
              throw retryError;
            }
            
            onSpaceUpdated();
            return;
          } else {
            // Couldn't refresh, need to re-login
            setErrorMessage("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            throw new Error("Session refresh failed");
          }
        }
        
        setErrorMessage("Error al actualizar el espacio: " + error.message);
        throw error;
      }
      
  onSpaceUpdated();
  try { push({ message: `Espacio "${formData.name}" actualizado.`, type: 'success' }); } catch {}
    } catch (error) {
      console.error("Error updating space:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Filter out parent spaces that would create a cycle
  const availableParentSpaces = spaces.filter((s) => s.id !== space.id);

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
              EDIT SPACE
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errorMessage && (
              <div className="bg-red-900/30 border border-red-800 p-4 mb-4 flex items-start space-x-3">
                <div className="text-sm text-red-300">{errorMessage}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                NAME
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. Living Room, Kitchen"
              />
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                PARENT SPACE (OPTIONAL)
              </label>
              <select
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
              >
                <option value="">No parent space</option>
                {availableParentSpaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                DESCRIPTION (OPTIONAL)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
                placeholder="Describe this space"
              />
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
                {loading ? "UPDATING..." : "UPDATE SPACE"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default EditSpaceModal;
