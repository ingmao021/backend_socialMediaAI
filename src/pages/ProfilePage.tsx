import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import type { UpdateProfileRequest } from '../types/user.types';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user?.name?.charAt(0)?.toUpperCase() || '?';
  const displayAvatar = avatarPreview || user?.avatarUrl;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('El nombre no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      const request: UpdateProfileRequest = { name: trimmed };
      await userService.updateProfile(request);
      await refreshUser();
      toast.success('Perfil actualizado.');
    } catch {
      toast.error('Error al actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation — backend only accepts PNG and JPEG, not WebP
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Solo se aceptan imágenes JPG o PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar 2 MB.');
      return;
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Upload immediately
    uploadAvatar(file);
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      await userService.uploadAvatar(file);
      await refreshUser();
      toast.success('Avatar actualizado.');
    } catch {
      toast.error('Error al subir el avatar.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card glass-card">
        <h1 className="profile-title">Editar perfil</h1>

        <form className="profile-form" onSubmit={handleSave}>
          {/* Avatar */}
          <div className="form-group">
            <label className="form-label">Avatar</label>
            <div className="avatar-section">
              <div className="avatar-preview">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Avatar" />
                ) : (
                  <div className="avatar-preview-fallback">{initials}</div>
                )}
              </div>
              <div className="avatar-upload-info">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <>
                      <div className="spinner spinner-sm" />
                      Subiendo…
                    </>
                  ) : (
                    'Cambiar avatar'
                  )}
                </button>
                <span className="avatar-upload-label">
                  JPG o PNG. Máx 2 MB.
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="avatar-file-input"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">
              Nombre
            </label>
            <input
              id="profile-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Email (read-only) */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={user?.email ?? ''}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cuenta vinculada</label>
            <div style={{ color: 'var(--text-secondary)' }}>
              {user?.hasGoogle ? '✅ Conectado con Google' : 'No conectado con Google'}
            </div>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !name.trim()}
              id="profile-save-btn"
            >
              {saving ? (
                <div className="spinner spinner-sm" />
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
