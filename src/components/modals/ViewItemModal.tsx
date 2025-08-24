import { X } from "lucide-react";
import React, { useEffect } from "react";
import { ModalAnimations } from "./ModalAnimations";

interface Item {
  id: string;
  name: string;
  quantity: number;
  description: string | null;
  color: string | null;
  price: number | null;
  inventory_id: string;
  created_at: string;
}

interface ViewItemModalProps {
  item: Item;
  onClose: () => void;
}

const ViewItemModal: React.FC<ViewItemModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div
        className="fixed inset-0 bg-black/0 backdrop-blur-0 transition-all duration-300"
        style={{
          animation: "fadeIn 0.3s ease-out forwards",
        }}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="bg-zinc-900 border border-zinc-800 p-8 max-w-lg w-full my-4 sm:my-8 relative z-10 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-8rem)] overflow-y-auto"
          style={{
            animation: "slideUp 0.3s ease-out forwards",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-5xl mb-6">📦</div>

          <h2 className="text-2xl font-light tracking-wider text-white mb-4">
            {item.name}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-light tracking-wider">
                QUANTITY
              </label>
              <p className="text-white font-light mt-1">{item.quantity}</p>
            </div>

            {item.description && (
              <div>
                <label className="text-xs text-gray-400 font-light tracking-wider">
                  DESCRIPTION
                </label>
                <p className="text-white font-light mt-1">{item.description}</p>
              </div>
            )}

            {item.color && (
              <div>
                <label className="text-xs text-gray-400 font-light tracking-wider">
                  COLOR
                </label>
                <p className="text-white font-light mt-1">{item.color}</p>
              </div>
            )}

            {item.price && (
              <div>
                <label className="text-xs text-gray-400 font-light tracking-wider">
                  PRICE
                </label>
                <p className="text-white font-light mt-1">
                  ${item.price.toFixed(2)}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 font-light tracking-wider">
                CREATED AT
              </label>
              <p className="text-white font-light mt-1">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ModalAnimations />
    </div>
  );
};

export default ViewItemModal;
