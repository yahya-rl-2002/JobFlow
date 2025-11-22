import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'react-toastify'
import { cvService } from '../services/api'
import { format } from 'date-fns'
import { FaCloudUploadAlt, FaFilePdf, FaFileWord, FaTrash, FaMagic, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'

interface CV {
  id: number
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  parsed_data?: any
}

export default function CVUpload() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState<number | null>(null)

  const loadCVs = useCallback(async () => {
    try {
      setLoading(true)
      const data = await cvService.getAll()
      setCvs(data)
    } catch (error: any) {
      toast.error('Erreur lors du chargement des CVs: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCVs()
  }, [loadCVs])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      return toast.error('Format non supporté. Utilisez PDF, DOC ou DOCX.')
    }

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Fichier trop volumineux (max 5MB)')
    }

    try {
      setUploading(true)
      await cvService.upload(file)
      toast.success('CV téléchargé avec succès!')
      await loadCVs()
    } catch (error: any) {
      toast.error('Erreur lors du téléchargement: ' + (error.response?.data?.error || error.message))
    } finally {
      setUploading(false)
    }
  }, [loadCVs])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: uploading
  })

  const handleParse = async (cvId: number) => {
    try {
      setParsing(cvId)
      await cvService.parse(cvId)
      toast.success('CV analysé avec succès!')
      await loadCVs()
    } catch (error: any) {
      toast.error('Erreur lors de l\'analyse: ' + (error.response?.data?.error || error.message))
    } finally {
      setParsing(null)
    }
  }

  const handleDelete = async (cvId: number, fileName: string) => {
    if (!window.confirm(`Supprimer "${fileName}" ?`)) return

    try {
      await cvService.delete(cvId)
      toast.success('CV supprimé')
      await loadCVs()
    } catch (error: any) {
      toast.error('Erreur: ' + (error.response?.data?.error || error.message))
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Mes CVs
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gérez vos CVs et analysez-les pour améliorer vos correspondances.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--primary-color)' : '#e5e7eb'}`,
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragActive ? 'rgba(37, 99, 235, 0.05)' : 'white',
          transition: 'all 0.2s',
          marginBottom: '40px',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: isDragActive ? 'rgba(37, 99, 235, 0.1)' : '#f3f4f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <FaCloudUploadAlt size={40} color={isDragActive ? 'var(--primary-color)' : '#9ca3af'} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {isDragActive ? 'Déposez le fichier ici' : 'Cliquez ou glissez un fichier ici'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0' }}>
          PDF, DOC, DOCX (Max 5MB)
        </p>
      </div>

      {/* CV List */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
          CVs enregistrés ({cvs.length})
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Chargement...</div>
        ) : cvs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', color: 'var(--text-secondary)' }}>
            Aucun CV pour le moment.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {cvs.map((cv) => (
              <div
                key={cv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: cv.file_type.includes('pdf') ? '#fee2e2' : '#dbeafe',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '16px'
                }}>
                  {cv.file_type.includes('pdf') ? (
                    <FaFilePdf size={24} color="#ef4444" />
                  ) : (
                    <FaFileWord size={24} color="#3b82f6" />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {cv.file_name}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>{formatFileSize(cv.file_size)}</span>
                    <span>{format(new Date(cv.created_at), 'dd MMM yyyy')}</span>
                    {cv.parsed_data && (
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FaCheckCircle size={12} /> Analysé
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {!cv.parsed_data && (
                    <button
                      onClick={() => handleParse(cv.id)}
                      disabled={parsing === cv.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        color: 'var(--text-primary)',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '500',
                        cursor: parsing === cv.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    >
                      <FaMagic size={14} />
                      {parsing === cv.id ? 'Analyse...' : 'Analyser'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(cv.id, cv.file_name)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #fee2e2',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
