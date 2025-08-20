export const ModalAnimations = () => (
  <style>{`
    @keyframes fadeIn {
      from {
        background-color: rgba(0, 0, 0, 0);
        backdrop-filter: blur(0px);
      }
      to {
        background-color: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `}</style>
);
