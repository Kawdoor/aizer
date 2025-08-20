import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
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
}

const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  groupId,
  spaces,
  inventories,
  onClose,
  onInventoryCreated,
}) => {
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("inventories").insert([
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
      ]);

      if (error) throw error;
      onInventoryCreated();
    } catch (error) {
      console.error("Error creating inventory:", error);
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
