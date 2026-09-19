// Profile.tsx
import { useEffect, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import SharedTopBar from '../../components/topbar/SharedTopBar';
import './profile.css';
import { FaUserCircle, FaEnvelope, FaEdit, FaSave, FaTimes, FaUserTag } from 'react-icons/fa';
import { fetchUserData, updateUserData } from "../../service/User"

interface UserProfile {
  name: string;
  email: string;
  userType: string;
}

const userTypeLabels: Record<string, string> = {
  CUIDADOR: "Cuidador",
  PROFESSOR: "Professor",
  RESPONSAVEL: "Responsável",
  TEA_NIVEL_1: "TEA Nível 1",
  TEA_NIVEL_2: "TEA Nível 2",
  TEA_NIVEL_3: "TEA Nível 3",
  USUARIO: "Usuário Geral",
};

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [tempProfileData, setTempProfileData] = useState<UserProfile | null>(null);

  const userId = localStorage.getItem("id");

  useEffect(() => {
    if (!userId) return;

    const loadUserData = async () => {
      const data = await fetchUserData(userId);
      if (data) {
        setProfileData(data);
        setTempProfileData(data);
      }
    };

    loadUserData();
  }, [userId]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTempProfileData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEdit = (e: MouseEvent) => {
    e.preventDefault();
    if (profileData) {
      setTempProfileData(profileData);
      setIsEditing(true);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId || !tempProfileData) return;

    const updated = await updateUserData(userId, {
      name: tempProfileData.name,
      email: tempProfileData.email,
      userType: tempProfileData.userType,
    });

    if (updated) {
      setProfileData(updated);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempProfileData(profileData);
    setIsEditing(false);
  };

  if (!profileData || !tempProfileData) {
    return <div className="profile-page-container">Carregando...</div>;
  }

  return (
    <div className="profile-page-container">
      <SharedTopBar pageType="profile" />
      <main className="profile-content">
        <form onSubmit={handleSave} className="profile-card">
          <div className="profile-header">
            <h2>{isEditing ? 'Editar Perfil' : 'Meu Perfil'}</h2>
          </div>

          <div className="profile-fields-scroll-container">
            <div className="profile-field">
              <label htmlFor="name"><FaUserCircle className="field-icon" /> Nome:</label>
              {isEditing ? (
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={tempProfileData.name}
                  onChange={handleInputChange}
                  required
                />
              ) : (
                <span>{profileData.name}</span>
              )}
            </div>

            <div className="profile-field">
              <label htmlFor="email"><FaEnvelope className="field-icon" /> Email:</label>
              {isEditing ? (
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={tempProfileData.email}
                  onChange={handleInputChange}
                  required
                />
              ) : (
                <span>{profileData.email}</span>
              )}
            </div>

            <div className="profile-field">
              <label htmlFor="userType"><FaUserTag className="field-icon" /> Tipo de conta:</label>
              {isEditing ? (
                <select
                  id="userType"
                  name="userType"
                  value={tempProfileData.userType}
                  onChange={handleInputChange}
                  required
                >
                  {Object.entries(userTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              ) : (
                <span>{userTypeLabels[profileData.userType]}</span>
              )}
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button type="submit" className="profile-button save-button">
                  <FaSave /> Salvar Alterações
                </button>
                <button type="button" onClick={handleCancel} className="profile-button cancel-button">
                  <FaTimes /> Cancelar
                </button>
              </>
            ) : (
              <button type="button" onClick={handleEdit} className="profile-button edit-button">
                <FaEdit /> Editar Perfil
              </button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
};

export default Profile;
