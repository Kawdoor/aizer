import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Space {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

interface CreateSpaceModalProps {
  groupId: string;
  spaces: Space[];
  onClose: () => void;
  onSpaceCreated: () => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ 
  groupId, 
  spaces, 
  onClose, 
  onSpaceCreated 
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('spaces').insert([
        {
          group_id: groupId,
          name: formData.name,
          description: formData.description || null,
          parent_id: formData.parent_id || null,
        },
      ]);

      if (error) throw error;
      onSpaceCreated();
    } catch (error) {
      console.error('Error creating space:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <h2 className="text-lg font-light tracking-wider text-white">CREATE SPACE</h2>
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
              placeholder="e.g. Living Room, Kitchen"
            />
          </div>

          <div>
            <label className="block text-sm font-light tracking-wider text-gray-300 mb-2">
              PARENT SPACE (OPTIONAL)
            </label>
            <select
              name="parent_id"
              value={formData.parent_id}
              onChange={handleChange}
              className="w-full bg-black border border-zinc-800 px-4 py-3 text-white font-light text-sm tracking-wide focus:outline-none focus:border-white transition-colors"
            >
              <option value="">No parent space</option>
              {spaces.map(space => (
                <option key={space.id} value={space.id}>
                  {space.name}
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
              placeholder="Describe this space"
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
              {loading ? 'CREATING...' : 'CREATE SPACE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSpaceModal;