import { X } from "lucide-react";
import React from "react";

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

interface InventoryViewProps {
  inventoryName: string;
  items: Item[];
  onClose: () => void;
  onItemClick: (item: Item) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({
  inventoryName,
  items,
  onClose,
  onItemClick,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-thin tracking-wider text-white">
            {inventoryName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-light text-lg tracking-wider">
              NO ITEMS IN THIS INVENTORY
            </p>
            <p className="text-gray-600 text-sm font-light tracking-wide mt-2">
              Add items to this inventory
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemClick(item)}
                className="bg-zinc-800/50 border border-zinc-700 p-4 hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="text-2xl">📦</div>
                  <div className="text-xs text-gray-500 font-light tracking-wide">
                    QTY: {item.quantity}
                  </div>
                </div>

                <h4 className="font-light text-white tracking-wide mb-2">
                  {item.name}
                </h4>

                {item.color && (
                  <div className="text-sm text-gray-400 font-light tracking-wide mb-2">
                    Color: {item.color}
                  </div>
                )}

                {item.price && (
                  <div className="text-sm text-gray-400 font-light tracking-wide mb-2">
                    ${item.price.toFixed(2)}
                  </div>
                )}

                {item.description && (
                  <p className="text-gray-500 text-xs font-light tracking-wide mt-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryView;
