interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fefefe",
            color: "#1b1c3f",
            maxWidth: "500px",
            maxHeight: "75vh",
            borderRadius: "1rem",
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {title && (
            <div
              style={{
                backgroundColor: "#b6d9ec",
                padding: "1.5rem 2rem",
                borderTopLeftRadius: "1rem",
                borderTopRightRadius: "1rem",
                fontWeight: "700",
                fontSize: "1.5rem",
                color: "#1b1c3f",
                userSelect: "none",
                textAlign: "center",
              }}
            >
              {title}
            </div>
          )}

          <div
            style={{
              padding: "1.5rem 2rem",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              whiteSpace: "pre-line",
              color: "#1b1c3f",
            }}
          >
            {children}
          </div>

          <button
            onClick={onClose}
            style={{
              margin: "1rem 2rem 2rem",
              backgroundColor: "#181d54",
              color: "#fff",
              padding: "0.6rem 1.4rem",
              border: "none",
              borderRadius: "0.6rem",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "1rem",
              alignSelf: "center",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#b6d9ec")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLButtonElement).style.backgroundColor = "#181d54")
            }
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
};
