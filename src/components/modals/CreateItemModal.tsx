import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { ModalAnimations } from "./ModalAnimations";

interface CreateItemModalProps {
  groupId: string;
  selectedInventoryId?: string | null;
  selectedInventoryName?: string | null;
  onClose: () => void;
  onItemCreated: () => void;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({
  groupId,
  selectedInventoryId,
  selectedInventoryName,
  onClose,
  onItemCreated,
}) => {
  const { refreshSession } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!groupId) {
      setError("No group selected. Please select a group first.");
      return;
    }
    if (!selectedInventoryId) {
      setError(
        "No inventory selected. Please select an inventory before creating item."
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        quantity: quantity ? parseInt(quantity) : 1,
        inventory_id: selectedInventoryId,
        group_id: groupId,
      };

      console.log("Creating item with payload:", payload);

      const { data, error: createError } = await supabase
        .from("items")
        .insert([payload])
        .select();

      if (createError) {
        console.error("Supabase error creating item:", createError);

        if (createError.code === "42501") {
          setError("You don't have permission to create items in this group.");
        } else if (createError.message?.includes("Failed to fetch")) {
          try {
            await refreshSession();
            const { error: retryError } = await supabase
              .from("items")
              .insert([payload])
              .select();

            if (retryError) throw retryError;
          } catch (retryErr) {
            setError("Failed to create item after session refresh.");
            return;
          }
        } else {
          setError(createError.message || "Failed to create item.");
        }
        return;
      }

      console.log("Item created successfully:", data);
      onItemCreated();
      onClose();
    } catch (err) {
      console.error("Error creating item:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
          className="bg-zinc-900 border border-zinc-800 w-full max-w-md pointer-events-auto modal-scroll flex flex-col max-h-[85vh]"
          style={{ animation: "slideUp 0.3s ease-out forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
            <h2 className="text-lg font-light tracking-wider text-white">
              CREATE ITEM
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-900/30 border border-red-800 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {/* Show context */}
              {selectedInventoryName && (
                <div className="bg-zinc-800/50 p-3 border border-zinc-700">
                  <p className="text-xs font-light tracking-wider text-gray-400 mb-1">
                    CREATING ITEM IN:
                  </p>
                  <p className="text-sm text-white font-light">
                    {selectedInventoryName}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                  placeholder="e.g. Red T-Shirt, Blue Mug"
                />
              </div>

              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors resize-none"
                  placeholder="Describe this item"
                />
              </div>

              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  QUANTITY
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </form>
          </div>

          <div className="border-t border-zinc-800 p-6 bg-zinc-900 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-zinc-800 py-3 font-light text-sm tracking-wider text-gray-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || !selectedInventoryId}
                className="flex-1 bg-white text-black py-3 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "CREATING..." : "CREATE ITEM"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default CreateItemModal;
