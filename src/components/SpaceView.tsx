import { X } from "lucide-react";
import React from "react";

interface Inventory {
  id: string;
  name: string;
  description: string | null;
  parent_space_id: string | null;
  parent_inventory_id: string | null;
  created_at: string;
}

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

interface SpaceViewProps {
  spaceName: string;
  inventories: Inventory[];
  items: Item[];
  onClose: () => void;
  onItemClick: (item: Item) => void;
}

const SpaceView: React.FC<SpaceViewProps> = ({
  spaceName,
  inventories,
  items,
  onClose,
  onItemClick,
}) => {
  const inventoryItems = new Map<string, Item[]>();

  // Group items by inventory
  items.forEach((item) => {
    if (!inventoryItems.has(item.inventory_id)) {
      inventoryItems.set(item.inventory_id, []);
    }
    inventoryItems.get(item.inventory_id)?.push(item);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-thin tracking-wider text-white">
            {spaceName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {inventories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-light text-lg tracking-wider">
              NO INVENTORIES IN THIS SPACE
            </p>
            <p className="text-gray-600 text-sm font-light tracking-wide mt-2">
              Add inventories to organize your items
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {inventories.map((inventory) => (
              <div key={inventory.id} className="border border-zinc-800 p-6">
                <h3 className="text-lg font-light tracking-wider text-white mb-4">
                  {inventory.name}
                </h3>

                {inventory.description && (
                  <p className="text-gray-500 text-sm font-light tracking-wide mb-6">
                    {inventory.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventoryItems.get(inventory.id)?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-800/50 border border-zinc-700 p-4 hover:border-zinc-600 transition-colors cursor-pointer"
                      onClick={() => onItemClick(item)}
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

                      {item.description && (
                        <p className="text-gray-500 text-xs font-light tracking-wide line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpaceView;
