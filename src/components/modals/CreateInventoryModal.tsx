import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { ModalAnimations } from "./ModalAnimations";

interface Space {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  name: string;
}

interface CreateInventoryModalProps {
  groupId: string;
  spaces: Space[];
  inventories: Inventory[];
  onClose: () => void;
  onInventoryCreated: () => void;
  initialParent?: { type: "space" | "inventory"; id: string } | null;
}

const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  groupId,
  spaces,
  inventories,
  onClose,
  onInventoryCreated,
  initialParent = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshSession } = useAuth();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);
  const [parentType, setParentType] = useState<"space" | "inventory">("space");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_space_id: "",
    parent_inventory_id: "",
  });

  useEffect(() => {
    if (initialParent) {
      setParentType(initialParent.type);
      if (initialParent.type === "space") {
        setFormData((f) => ({ ...f, parent_space_id: initialParent.id }));
      } else {
        setFormData((f) => ({ ...f, parent_inventory_id: initialParent.id }));
      }
    }
  }, [initialParent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!groupId) {
      setError("Missing group. Please select a group before creating an inventory.");
      return;
    }
    // Validate parent exists depending on parentType
    if (parentType === "space" && !formData.parent_space_id) {
      setError("Please select a parent space.");
      return;
    }
    if (parentType === "inventory" && !formData.parent_inventory_id) {
      setError("Please select a parent inventory.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("inventories")
        .insert([
          {
            group_id: groupId,
            name: formData.name,
            description: formData.description || null,
            parent_space_id:
              parentType === "space" ? formData.parent_space_id || null : null,
            parent_inventory_id:
              parentType === "inventory"
                ? formData.parent_inventory_id || null
                : null,
          },
        ])
        .select();

      if (error) {
        // Try refresh session on auth-related errors
        if (
          error.code === "401" ||
          error.code === "403" ||
          error.message?.includes("JWT")
        ) {
          console.log("CreateInventoryModal: auth error, trying to refresh session...", error);
          const refreshed = await refreshSession();
          if (refreshed) {
            const { data: retryData, error: retryError } = await supabase
              .from("inventories")
              .insert([
                {
                  group_id: groupId,
                  name: formData.name,
                  description: formData.description || null,
                  parent_space_id:
                    parentType === "space" ? formData.parent_space_id || null : null,
                  parent_inventory_id:
                    parentType === "inventory"
                      ? formData.parent_inventory_id || null
                      : null,
                },
              ])
              .select();

            if (retryError) {
              console.error("CreateInventoryModal: retry failed", retryError, retryData);
              setError("No se pudo crear el inventario después de refrescar la sesión.");
              throw retryError;
            }

            console.log("CreateInventoryModal: created inventory after refresh", retryData);
            onInventoryCreated();
            return;
          }
        }

        console.error("CreateInventoryModal: supabase insert error:", error, data);
        if (error.code === "42501") {
          setError(
            "Permisos insuficientes para crear inventarios (RLS). Revisa las políticas en Supabase o que tu usuario pertenezca al grupo."
          );
        } else {
          setError("Failed to create inventory: " + error.message);
        }
        throw error;
      }

      console.log("CreateInventoryModal: created inventory", data);
      onInventoryCreated();
    } catch (error) {
      console.error("Error creating inventory:", error);
      if (!error) {
        setError("Failed to create inventory.");
      }
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
              CREATE INVENTORY
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
              <div className="bg-red-900/30 border border-red-800 p-3 text-sm text-red-200">
                {error}
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
                placeholder="e.g. Closet, Drawer, Cabinet"
              />
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                PARENT TYPE
              </label>
              <div className="flex border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setParentType("space")}
                  className={`flex-1 py-3 text-sm font-light tracking-wider transition-colors ${
                    parentType === "space"
                      ? "bg-white text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  SPACE
                </button>
                <button
                  type="button"
                  onClick={() => setParentType("inventory")}
                  className={`flex-1 py-3 text-sm font-light tracking-wider transition-colors ${
                    parentType === "inventory"
                      ? "bg-white text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  INVENTORY
                </button>
              </div>
            </div>

            {parentType === "space" ? (
              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  PARENT SPACE
                </label>
                <select
                  name="parent_space_id"
                  value={formData.parent_space_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
                >
                  <option value="">Select a space</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  PARENT INVENTORY
                </label>
                <select
                  name="parent_inventory_id"
                  value={formData.parent_inventory_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
                >
                  <option value="">Select an inventory</option>
                  {inventories.map((inventory) => (
                    <option key={inventory.id} value={inventory.id}>
                      {inventory.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                {loading ? "CREATING..." : "CREATE INVENTORY"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default CreateInventoryModal;
