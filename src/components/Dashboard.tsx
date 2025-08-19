import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogOut, Plus, Search, Home, Package, Box } from 'lucide-react';
import { useGroups } from '../hooks/useGroups';
import CreateSpaceModal from './modals/CreateSpaceModal';
import CreateInventoryModal from './modals/CreateInventoryModal';
import CreateItemModal from './modals/CreateItemModal';

interface Space {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
}

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

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { groups, loading: groupsLoading, createGroup } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModal, setActiveModal] = useState<'space' | 'inventory' | 'item' | null>(null);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      fetchData();
    }
  }, [selectedGroupId]);

  const fetchData = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      // Fetch spaces
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .eq('group_id', selectedGroupId)
        .order('created_at', { ascending: false });

      if (spacesError) throw spacesError;

      // Fetch inventories
      const { data: inventoriesData, error: inventoriesError } = await supabase
        .from('inventories')
        .select('*')
        .eq('group_id', selectedGroupId)
        .order('created_at', { ascending: false });

      if (inventoriesError) throw inventoriesError;

      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('group_id', selectedGroupId)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      setSpaces(spacesData || []);
      setInventories(inventoriesData || []);
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    const name = prompt('Enter group name:');
    if (name) {
      try {
        const group = await createGroup(name);
        if (group) {
          setSelectedGroupId(group.id);
        }
      } catch (error) {
        console.error('Error creating group:', error);
      }
    }
  };

  const handleModalClose = () => {
    setActiveModal(null);
    fetchData();
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (groupsLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white font-thin text-lg tracking-wider">LOADING...</div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-thin text-white tracking-[0.3em] mb-4">AIZER</h1>
          <p className="text-gray-400 font-light text-sm tracking-wider mb-8">
            CREATE YOUR FIRST GROUP TO GET STARTED
          </p>
          <button
            onClick={handleCreateGroup}
            className="bg-white text-black px-8 py-3 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors"
          >
            CREATE GROUP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div>
              <h1 className="text-2xl font-thin tracking-[0.3em]">AIZER</h1>
              <p className="text-gray-400 text-xs font-light tracking-wider mt-1">
                {user?.email}
              </p>
            </div>
            
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-black border border-zinc-800 px-4 py-2 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
            >
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateGroup}
              className="text-gray-400 hover:text-white transition-colors text-sm font-light tracking-wider"
            >
              + NEW GROUP
            </button>
          </div>

          <button
            onClick={signOut}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-light tracking-wider">SIGN OUT</span>
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-white font-light text-sm tracking-wide placeholder-gray-500 focus:outline-none focus:border-white transition-colors w-64"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveModal('space')}
              className="bg-zinc-900 border border-zinc-800 px-4 py-2 font-light text-sm tracking-wider text-white hover:border-white transition-colors flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>ADD SPACE</span>
            </button>

            <button
              onClick={() => setActiveModal('inventory')}
              className="bg-zinc-900 border border-zinc-800 px-4 py-2 font-light text-sm tracking-wider text-white hover:border-white transition-colors flex items-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>ADD INVENTORY</span>
            </button>

            <button
              onClick={() => setActiveModal('item')}
              className="bg-white text-black px-6 py-2 font-light text-sm tracking-wider hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Box className="w-4 h-4" />
              <span>ADD ITEM</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-light tracking-wider">SPACES</p>
                <p className="text-2xl font-thin text-white mt-1">{spaces.length}</p>
              </div>
              <Home className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-light tracking-wider">INVENTORIES</p>
                <p className="text-2xl font-thin text-white mt-1">{inventories.length}</p>
              </div>
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-light tracking-wider">ITEMS</p>
                <p className="text-2xl font-thin text-white mt-1">{items.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
              <Box className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-light text-lg tracking-wider">
              {items.length === 0 ? 'NO ITEMS YET' : 'NO ITEMS MATCH YOUR SEARCH'}
            </p>
            <p className="text-gray-600 text-sm font-light tracking-wide mt-2">
              {items.length === 0 ? 'Start by creating spaces, inventories, and adding items' : 'Try adjusting your search'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map(item => (
              <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-3xl">📦</div>
                  <div className="text-xs text-gray-500 font-light tracking-wide">
                    QTY: {item.quantity}
                  </div>
                </div>

                <h3 className="font-light text-white tracking-wide text-lg mb-2">{item.name}</h3>
                
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
                  <p className="text-gray-500 text-xs font-light tracking-wide mt-4 line-clamp-3">
                    {item.description}
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="text-xs text-gray-600 font-light tracking-wide">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'space' && (
        <CreateSpaceModal
          groupId={selectedGroupId}
          spaces={spaces}
          onClose={handleModalClose}
          onSpaceCreated={handleModalClose}
        />
      )}

      {activeModal === 'inventory' && (
        <CreateInventoryModal
          groupId={selectedGroupId}
          spaces={spaces}
          inventories={inventories}
          onClose={handleModalClose}
          onInventoryCreated={handleModalClose}
        />
      )}

      {activeModal === 'item' && (
        <CreateItemModal
          groupId={selectedGroupId}
          inventories={inventories}
          onClose={handleModalClose}
          onItemCreated={handleModalClose}
        />
      )}
    </div>
  );
};

export default Dashboard;