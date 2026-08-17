import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/admin/books/')({
  component: AdminBooksUpload,
})

function AdminBooksUpload() {
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    price: '',
    category: ''
  })
  const [file, setFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const getAuthToken = async () => {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')
    return user.getIdToken()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a PDF file' })
      return
    }

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Only PDF files are allowed' })
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 50MB' })
      return
    }

    try {
      setUploading(true)
      const token = await getAuthToken()
      
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('title', formData.title)
      uploadData.append('description', formData.description)
      uploadData.append('author', formData.author)
      // Convert price from dollars to cents (multiply by 100)
      uploadData.append('price', String(Math.round(parseFloat(formData.price) * 100)))
      uploadData.append('category', formData.category)
      
      // Add image if provided
      if (imageFile) {
        uploadData.append('image', imageFile)
      }

      const response = await fetch('/api/books/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to upload book')
      }

      const result = await response.json()
      setMessage({ type: 'success', text: 'Book uploaded successfully!' })
      
      // Reset form
      setFormData({ title: '', description: '', author: '', price: '', category: '' })
      setFile(null)
      setImageFile(null)
      setImagePreview(null)
      
      // Reset file inputs
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      const imageInput = document.getElementById('image-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      if (imageInput) imageInput.value = ''

    } catch (error: any) {
      console.error('Error uploading book:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to upload book' })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImage = e.target.files?.[0]
    if (selectedImage) {
      // Validate image type
      if (!selectedImage.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' })
        return
      }
      
      // Validate image size (max 5MB)
      if (selectedImage.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' })
        return
      }
      
      setImageFile(selectedImage)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(selectedImage)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-2">
        <h1 className="text-4xl font-bold text-gray-900">Upload Book</h1>
        <p className="text-gray-600 mt-1">Add a new book to the library</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-gray-900 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter book title"
            />
          </div>

          <div>
            <label htmlFor="author" className="block text-sm font-bold text-gray-900 mb-2">
              Author *
            </label>
            <input
              id="author"
              type="text"
              required
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter author name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold text-gray-900 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter book description"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-bold text-gray-900 mb-2">
              Category *
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="programming">Programming</option>
              <option value="ai">Artificial Intelligence</option>
              <option value="business">Business</option>
              <option value="finance">Finance</option>
              <option value="self-development">Self Development</option>
              <option value="design">Design</option>
              <option value="education">Education</option>
              <option value="fiction">Fiction</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-bold text-gray-900 mb-2">
              Price (USD) *
            </label>
            <input
              id="price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter price in dollars (e.g., 78.00)"
            />
            <p className="mt-1 text-xs text-gray-500">Enter the price in dollars (will be stored as cents in database)</p>
          </div>

          <div>
            <label htmlFor="image-upload" className="block text-sm font-bold text-gray-900 mb-2">
              Cover Image (Optional, Max 5MB)
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img 
                  src={imagePreview} 
                  alt="Book cover preview" 
                  className="w-32 h-48 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
            {imageFile && !imagePreview && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {imageFile.name} ({(imageFile.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="file-upload" className="block text-sm font-bold text-gray-900 mb-2">
              PDF File * (Max 50MB)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,application/pdf"
              required
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
              uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Book'}
          </button>
        </form>
      </div>
    </div>
  )
}
