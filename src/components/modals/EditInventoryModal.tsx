import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ModalAnimations } from "./ModalAnimations";
import { useAuth } from "../../contexts/AuthContext";

interface Space {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

interface Inventory {
  id: string;
  name: string;
  description: string | null;
  parent_space_id: string | null;
  parent_inventory_id: string | null;
}

interface EditInventoryModalProps {
  inventory: Inventory;
  spaces: Space[];
  inventories: Inventory[];
  onClose: () => void;
  onInventoryUpdated: () => void;
}

const EditInventoryModal: React.FC<EditInventoryModalProps> = ({
  inventory,
  spaces,
  inventories,
  onClose,
  onInventoryUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshSession } = useAuth();

  const [formData, setFormData] = useState({
    name: inventory.name,
    description: inventory.description || "",
    parent_space_id: inventory.parent_space_id || "",
    parent_inventory_id: inventory.parent_inventory_id || "",
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

    // Make sure we don't have both parent space and parent inventory
    if (formData.parent_space_id && formData.parent_inventory_id) {
      setErrorMessage(
        "An inventory can either be in a space OR in another inventory, not both."
      );
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("inventories")
        .update({
          name: formData.name,
          description: formData.description || null,
          parent_space_id: formData.parent_space_id || null,
          parent_inventory_id: formData.parent_inventory_id || null,
        })
        .eq("id", inventory.id);

      if (error) {
        // Check if it's an authentication error (401, 403)
        if (
          error.code === "401" ||
          error.code === "403" ||
          error.message?.includes("JWT")
        ) {
          console.log("Authentication error detected, trying to refresh session...");
          const refreshed = await refreshSession();

          if (refreshed) {
            // Try again with refreshed session
            const { error: retryError } = await supabase
              .from("inventories")
              .update({
                name: formData.name,
                description: formData.description || null,
                parent_space_id: formData.parent_space_id || null,
                parent_inventory_id: formData.parent_inventory_id || null,
              })
              .eq("id", inventory.id);

            if (retryError) {
              setErrorMessage(
                "No se pudo actualizar el inventario después de refrescar la sesión. Por favor, inicia sesión nuevamente."
              );
              throw retryError;
            }

            onInventoryUpdated();
            return;
          } else {
            // Couldn't refresh, need to re-login
            setErrorMessage(
              "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
            );
            throw new Error("Session refresh failed");
          }
        }

        setErrorMessage("Error al actualizar el inventario: " + error.message);
        throw error;
      }

      onInventoryUpdated();
    } catch (error) {
      console.error("Error updating inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    
    // If parent_space_id is selected, clear parent_inventory_id
    if (name === "parent_space_id" && value) {
      setFormData({
        ...formData,
        parent_space_id: value,
        parent_inventory_id: "",
      });
    }
    // If parent_inventory_id is selected, clear parent_space_id
    else if (name === "parent_inventory_id" && value) {
      setFormData({
        ...formData,
        parent_inventory_id: value,
        parent_space_id: "",
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Filter out inventories that would create a cycle
  const availableInventories = inventories.filter((inv) => inv.id !== inventory.id);

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
              EDIT INVENTORY
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
                placeholder="e.g. Kitchen Tools, Tools"
              />
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                PARENT SPACE (OPTIONAL)
              </label>
              <select
                name="parent_space_id"
                value={formData.parent_space_id}
                onChange={handleChange}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
              >
                <option value="">No parent space</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                PARENT INVENTORY (OPTIONAL)
              </label>
              <select
                name="parent_inventory_id"
                value={formData.parent_inventory_id}
                onChange={handleChange}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
              >
                <option value="">No parent inventory</option>
                {availableInventories.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
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
                placeholder="Describe this inventory"
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
                {loading ? "UPDATING..." : "UPDATE INVENTORY"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default EditInventoryModal;
