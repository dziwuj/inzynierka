import styles from "./EmptyDashboard.module.scss";

interface EmptyDashboardProps {
  onUploadClick: () => void;
  isAuthenticated: boolean;
}

const SUPPORTED_FORMATS = [
  {
    extension: ".gltf",
    name: "GL Transmission Format",
    description: "Standard 3D format",
  },
  {
    extension: ".glb",
    name: "GL Binary Format",
    description: "Binary version of GLTF",
  },

  {
    extension: ".obj",
    name: "Wavefront Object",
    description: "Common 3D format",
  },
  {
    extension: ".stl",
    name: "Stereolithography",
    description: "3D printing format",
  },
  {
    extension: ".ply",
    name: "Polygon File Format",
    description: "Point cloud format",
  },
];

const EmptyDashboard = ({
  onUploadClick,
  isAuthenticated,
}: EmptyDashboardProps) => {
  return (
    <div className={styles.emptyDashboard}>
      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Welcome to 3D Model Viewer</h1>
          <p className={styles.subtitle}>
            {isAuthenticated
              ? "You haven't uploaded any models yet. Start by uploading your first 3D model!"
              : "View and interact with 3D models in your browser. Upload a model to get started!"}
          </p>
          <div className={styles.actions}>
            <button className={styles.uploadButton} onClick={onUploadClick}>
              {isAuthenticated ? "Upload Your First Model" : "Upload Model"}
            </button>
          </div>
        </div>

        <div className={styles.formats}>
          <h2 className={styles.sectionTitle}>Supported File Formats</h2>
          <div className={styles.formatGrid}>
            {SUPPORTED_FORMATS.map(format => (
              <div key={format.extension} className={styles.formatCard}>
                <div className={styles.formatExtension}>{format.extension}</div>
                <div className={styles.formatName}>{format.name}</div>
                <div className={styles.formatDescription}>
                  {format.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isAuthenticated && (
          <div className={styles.loginPrompt}>
            <p>Sign in to upload and manage your 3D models</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyDashboard;
