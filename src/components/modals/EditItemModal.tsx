import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { useToast } from "../toast/Toast";
import { ModalAnimations } from "./ModalAnimations";

interface Inventory {
  id: string;
  name: string;
  description: string | null;
  parent_space_id: string | null;
  parent_inventory_id: string | null;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string | null;
  inventory_id: string;
  group_id?: string;
  color: string | null;
  price: number | null;
  measures: any | null;
}

interface EditItemModalProps {
  item: Item;
  inventories: Inventory[];
  onClose: () => void;
  onItemUpdated: () => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  inventories,
  onClose,
  onItemUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refreshSession } = useAuth();
  const { push } = useToast();

  const [formData, setFormData] = useState({
    name: item.name,
    quantity: item.quantity.toString(),
    description: item.description || "",
    inventory_id: item.inventory_id,
    color: item.color || "",
    price: item.price?.toString() || "",
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

    try {
      const upsertPayload = [
        {
          id: item.id,
          name: formData.name,
          quantity: parseInt(formData.quantity, 10) || 0,
          description: formData.description || null,
          inventory_id: formData.inventory_id,
          color: formData.color || null,
          price: formData.price ? parseFloat(formData.price) : null,
          // preserve existing group_id to avoid insert failures
          group_id: (item as any).group_id ?? null,
        },
      ];

      const { data: updatedData, error } = await supabase
        .from("items")
        .upsert(upsertPayload, { onConflict: "id" })
        .select();

      if (error) {
        // Check if it's an authentication error (401, 403)
        if (
          error.code === "401" ||
          error.code === "403" ||
          error.message?.includes("JWT")
        ) {
          console.log(
            "Authentication error detected, trying to refresh session..."
          );
          const refreshed = await refreshSession();

          if (refreshed) {
            // Try again with refreshed session
            const { data: retryData, error: retryError } = await supabase
              .from("items")
              .upsert(upsertPayload, { onConflict: "id" })
              .select();

            if (retryError) {
              setErrorMessage(
                "No se pudo actualizar el artículo después de refrescar la sesión. Por favor, inicia sesión nuevamente."
              );
              throw retryError;
            }

            console.log("EditItemModal: retry update succeeded", retryData);
            onItemUpdated();
            return;
          } else {
            // Couldn't refresh, need to re-login
            setErrorMessage(
              "Tu sesión ha expirado. Por favor, inicia sesión nuevamente."
            );
            throw new Error("Session refresh failed");
          }
        }

        setErrorMessage("Error al actualizar el artículo: " + error.message);
        throw error;
      }

      console.log("EditItemModal: update succeeded", updatedData);
      onItemUpdated();
      try {
        push({
          message: `Artículo "${formData.name}" actualizado.`,
          type: "success",
        });
      } catch {}
    } catch (error) {
      console.error("Error updating item:", error);
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
              EDIT ITEM
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
                placeholder="e.g. Hammer, Drill"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  QUANTITY
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                  PRICE (OPTIONAL)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                COLOR (OPTIONAL)
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
                placeholder="e.g. Red, Blue, Black"
              />
            </div>

            <div>
              <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
                INVENTORY
              </label>
              <select
                name="inventory_id"
                value={formData.inventory_id}
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
                placeholder="Describe this item"
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
                {loading ? "UPDATING..." : "UPDATE ITEM"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default EditItemModal;
