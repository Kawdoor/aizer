import { Package, X } from "lucide-react";
import React from "react";
import { supabase } from "../../lib/supabase";
import { ModalAnimations } from "./ModalAnimations";

interface Space {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Inventory {
  id: string;
  name: string;
  description: string | null;
  parent_space_id: string | null;
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
  space: Space;
  onClose: () => void;
  onItemClick: (item: Item) => void;
}

const SpaceView: React.FC<SpaceViewProps> = ({
  space,
  onClose,
  onItemClick,
}) => {
  const [inventories, setInventories] = React.useState<Inventory[]>([]);
  const [items, setItems] = React.useState<{ [key: string]: Item[] }>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadInventoriesAndItems();
  }, [space.id]);

  const loadInventoriesAndItems = async () => {
    setLoading(true);
    try {
      // Fetch inventories for this space
      const { data: inventoriesData, error: inventoriesError } = await supabase
        .from("inventories")
        .select("*")
        .eq("parent_space_id", space.id)
        .order("created_at", { ascending: false });

      if (inventoriesError) throw inventoriesError;

      if (inventoriesData) {
        setInventories(inventoriesData);

        // Fetch items for all inventories
        const itemsMap: { [key: string]: Item[] } = {};
        for (const inventory of inventoriesData) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("items")
            .select("*")
            .eq("inventory_id", inventory.id)
            .order("created_at", { ascending: false });

          if (itemsError) throw itemsError;
          itemsMap[inventory.id] = itemsData || [];
        }
        setItems(itemsMap);
      }
    } catch (error) {
      console.error("Error loading inventories and items:", error);
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
          className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto modal-scroll"
          style={{ animation: "slideUp 0.3s ease-out forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
            <div>
              <h2 className="text-lg font-light tracking-wider text-white">
                {space.name}
              </h2>
              {space.description && (
                <p className="text-sm text-gray-400 font-light mt-1">
                  {space.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-400 font-light">Loading...</p>
            </div>
          ) : inventories.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-400 font-light">
                No inventories in this space yet
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {inventories.map((inventory) => (
                  <div
                    key={inventory.id}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden"
                  >
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <h3 className="font-light text-white">
                            {inventory.name}
                          </h3>
                          {inventory.description && (
                            <p className="text-sm text-gray-400 font-light mt-1">
                              {inventory.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-light">
                        {items[inventory.id]?.length || 0} items
                      </span>
                    </div>

                    {items[inventory.id]?.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {items[inventory.id].map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-black/30 border border-zinc-800 rounded hover:border-zinc-700 transition-colors cursor-pointer"
                            onClick={() => onItemClick(item)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="text-xl">📦</div>
                              <div>
                                <h4 className="text-white font-light">
                                  {item.name}
                                </h4>
                                {item.description && (
                                  <p className="text-sm text-gray-400 font-light line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 font-light">
                              QTY: {item.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500 font-light">
                          No items yet
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default SpaceView;
