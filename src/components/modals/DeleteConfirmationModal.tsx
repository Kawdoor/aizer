import { X, AlertTriangle } from "lucide-react";
import React from "react";
import { ModalAnimations } from "./ModalAnimations";

interface DeleteConfirmationModalProps {
  title: string;
  message: string;
  onClose: () => void;
  // allow async confirm handlers
  onConfirm: () => Promise<void> | void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  title,
  message,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = React.useState(false);
  return (
    <>
      <div
        className="fixed inset-0 bg-black/0 backdrop-blur-0 z-50 transition-all duration-300"
        style={{ animation: "fadeIn 0.3s ease-out forwards" }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 w-full max-w-md overflow-y-auto pointer-events-auto"
          style={{ animation: "slideUp 0.3s ease-out forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900">
            <h2 className="text-lg font-light tracking-wider text-white flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-gray-300 mb-6 font-light">{message}</p>

            <div className="flex space-x-4">
              <button
                onClick={onClose}
                className="flex-1 border border-zinc-800 py-3 font-light text-sm tracking-wider text-gray-400 hover:text-white hover:border-zinc-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await onConfirm();
                    onClose();
                  } catch (err) {
                    // keep modal open and log error
                    console.error('Error in delete confirm:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="flex-1 bg-red-700 text-white py-3 font-light text-sm tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModalAnimations />
    </>
  );
};

export default DeleteConfirmationModal;
